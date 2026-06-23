import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const STRIPE_PRICE_MENSUAL = "price_1TlZiSGds51tUOqDwqLQf1xQ";
const STRIPE_PRICE_ANUAL = "price_1TlZixGds51tUOqDZc30UxrY";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteSocioRequest {
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  tipo_cuota?: string;
  tipo_pago?: string;
  solicitud_id: string;
  dni: string;
  iban?: string;
  titular_cuenta?: string;
  dia_cobro?: number;
}

interface SolicitudData {
  tipo_pago: string;
  iban: string | null;
  titular_cuenta: string | null;
  metodo_pago?: string | null;
  stripe_customer_id?: string | null;
  stripe_payment_method_id?: string | null;
  tarjeta_lista?: boolean | null;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Extract token from Bearer header
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify JWT token using service role key for cryptographic verification
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      throw new Error("Invalid or expired token");
    }
    
    const adminUserId = user.id;
    console.log("Verified admin user ID:", adminUserId);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Only admins can invite socios");
    }

    const { email, nombre, apellidos, telefono, tipo_cuota, tipo_pago, solicitud_id, dni, iban, titular_cuenta, dia_cobro }: InviteSocioRequest = await req.json();

    if (!dni) {
      throw new Error("DNI is required");
    }

    const billingDay = dia_cobro && dia_cobro >= 1 && dia_cobro <= 28 ? dia_cobro : 1;

    console.log(`Inviting socio: ${email} (${nombre} ${apellidos})`);

    // Fetch solicitud data
    const { data: solicitudData, error: solicitudFetchError } = await supabaseAdmin
      .from("solicitudes_socio")
      .select("tipo_pago, iban, titular_cuenta, metodo_pago, stripe_customer_id, stripe_payment_method_id, tarjeta_lista")
      .eq("id", solicitud_id)
      .single();

    if (solicitudFetchError) {
      console.error("Error fetching solicitud:", solicitudFetchError);
    }

    const solicitud: SolicitudData = solicitudData || {
      tipo_pago: tipo_pago || 'mensual',
      iban: iban || null,
      titular_cuenta: titular_cuenta || null,
      metodo_pago: 'sepa',
    };

    const metodoPago = solicitud.metodo_pago || 'sepa';

    // If card payment: validate card is registered and create Stripe subscription BEFORE creating user
    let stripeSubscriptionId: string | null = null;
    if (metodoPago === 'tarjeta') {
      if (!solicitud.stripe_customer_id || !solicitud.stripe_payment_method_id || !solicitud.tarjeta_lista) {
        throw new Error("El socio aún no ha registrado su tarjeta. No se puede aprobar todavía.");
      }
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY no configurada");
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      const priceId = (solicitud.tipo_pago === 'anual') ? STRIPE_PRICE_ANUAL : STRIPE_PRICE_MENSUAL;

      // Make sure the payment method is attached and set as default on the customer
      try {
        await stripe.paymentMethods.attach(solicitud.stripe_payment_method_id, {
          customer: solicitud.stripe_customer_id,
        });
      } catch (e: any) {
        // Already attached → ignore
        if (!String(e?.message || "").includes("already been attached")) {
          console.warn("attach payment_method warning:", e?.message);
        }
      }
      await stripe.customers.update(solicitud.stripe_customer_id, {
        invoice_settings: { default_payment_method: solicitud.stripe_payment_method_id },
      });

      const subscription = await stripe.subscriptions.create({
        customer: solicitud.stripe_customer_id,
        items: [{ price: priceId }],
        default_payment_method: solicitud.stripe_payment_method_id,
        metadata: { solicitud_id, dni },
      });

      stripeSubscriptionId = subscription.id;
      console.log("Stripe subscription created:", stripeSubscriptionId);
    }



    // Use DNI as the default password (cleaned, uppercase)
    const defaultPassword = dni.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    let socioUserId: string;

    // Try to create user account with admin API using DNI as password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellidos,
      },
    });

    if (createError) {
      // If user already exists, get their ID and update their password
      if (createError.message.includes("already been registered")) {
        console.log("User already exists, fetching existing user...");
        
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          throw new Error(`Error listing users: ${listError.message}`);
        }
        
        const existingUser = existingUsers.users.find(u => u.email === email);
        
        if (!existingUser) {
          throw new Error("User exists but could not be found");
        }
        
        socioUserId = existingUser.id;
        
        // Update their password to DNI
        await supabaseAdmin.auth.admin.updateUserById(socioUserId, {
          password: defaultPassword,
          email_confirm: true,
        });
        
        console.log(`Existing user updated with ID: ${socioUserId}`);
      } else {
        console.error("Error creating user:", createError);
        throw new Error(`Error creating user: ${createError.message}`);
      }
    } else {
      socioUserId = newUser.user.id;
      console.log(`User created with ID: ${socioUserId}`);
    }

    // Add socio role (upsert to handle existing)
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: socioUserId,
        role: "socio",
      }, { onConflict: 'user_id,role' });

    if (roleInsertError) {
      console.error("Error adding socio role:", roleInsertError);
    }

    // Create or update socio record with address from solicitud
    const { error: socioError } = await supabaseAdmin
      .from("socios")
      .upsert({
        user_id: socioUserId,
        nombre,
        apellidos,
        email,
        telefono: telefono || null,
        tipo_cuota: tipo_cuota || "normal",
        tipo_pago: tipo_pago || "mensual",
        iban: iban || null,
        titular_cuenta: titular_cuenta || null,
        dia_cobro: billingDay,
        activo: true,
      }, { onConflict: 'user_id' });

    if (socioError) {
      console.error("Error creating socio record:", socioError);
    }

    // Update solicitud status to accepted
    const { error: solicitudError } = await supabaseAdmin
      .from("solicitudes_socio")
      .update({ estado: "aceptado" })
      .eq("id", solicitud_id);

    if (solicitudError) {
      console.error("Error updating solicitud:", solicitudError);
    }

    // Send welcome email (no SEPA attachment - authorization accepted via online conditions)
    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [email],
      subject: "¡Bienvenido/a a AHORA!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f1c40f; color: #1e3a5f; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .credentials { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .credentials p { margin: 5px 0; }
            .credentials strong { color: #1e3a5f; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">¡Bienvenido/a a AHORA!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>¡Enhorabuena! Tu solicitud de membresía ha sido <strong>aprobada</strong> por la Junta Directiva.</p>
              
              <div class="credentials">
                <p><strong>Ya puedes acceder al área de socios:</strong></p>
                <p>📧 Email: <strong>${email}</strong></p>
                <p>🔑 Contraseña: <strong>Tu número de DNI (sin guiones ni espacios)</strong></p>
              </div>

              <p style="text-align: center;">
                <a href="https://ahoraorg.es/socios" class="button">Acceder al área de socios</a>
              </p>
              
              <p>En tu panel de socios encontrarás:</p>
              <ul>
                <li>Directorio de socios</li>
                <li>Votaciones internas</li>
                <li>Eventos exclusivos</li>
                <li>Documentación interna</li>
              </ul>
              
              <p><em>💡 Recomendación: Una vez dentro, puedes cambiar tu contraseña desde la pestaña "Mi cuenta" del panel de socios.</em></p>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>¡Gracias por unirte a nosotros!</p>
              <p><em>El equipo de AHORA</em></p>
            </div>
            <div class="footer">
              <p>AHORA - Actuar en el presente para construir el futuro</p>
              <p>NIF: G24999484</p>
              <p>Este correo fue enviado a ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: socioUserId,
        message: "Socio invitado correctamente" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-socio function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
