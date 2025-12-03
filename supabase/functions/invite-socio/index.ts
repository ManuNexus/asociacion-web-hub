import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  solicitud_id: string;
  dni: string; // DNI will be used as default password
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Decode JWT to extract user_id (sub claim)
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;
    
    if (!userId) {
      throw new Error("Invalid JWT: no user_id");
    }
    
    console.log("User ID from JWT:", userId);
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error("Token expired");
    }
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Only admins can invite socios");
    }

    const { email, nombre, apellidos, telefono, tipo_cuota, solicitud_id, dni }: InviteSocioRequest = await req.json();

    if (!dni) {
      throw new Error("DNI is required");
    }

    console.log(`Inviting socio: ${email} (${nombre} ${apellidos})`);

    // Use DNI as the default password (cleaned, uppercase)
    const defaultPassword = dni.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    // Create user account with admin API using DNI as password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto-confirm email since we're inviting them
      user_metadata: {
        nombre,
        apellidos,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error(`Error creating user: ${createError.message}`);
    }

    console.log(`User created with ID: ${newUser.user.id}`);

    // Add socio role
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "socio",
      });

    if (roleInsertError) {
      console.error("Error adding socio role:", roleInsertError);
    }

    // Create socio record
    const { error: socioError } = await supabaseAdmin
      .from("socios")
      .insert({
        user_id: newUser.user.id,
        nombre,
        apellidos,
        email,
        telefono: telefono || null,
        tipo_cuota: tipo_cuota || "normal",
        activo: true,
      });

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

    // Send welcome email with direct access link (no password setup needed)
    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [email],
      subject: "¡Bienvenido a AHORA! Ya puedes acceder al área de socios",
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
              <p>Tu solicitud de membresía ha sido <strong>aprobada</strong>. Ya eres oficialmente socio/a de AHORA.</p>
              
              <div class="credentials">
                <p><strong>Tus credenciales de acceso:</strong></p>
                <p>📧 Email: <strong>${email}</strong></p>
                <p>🔑 Contraseña: <strong>Tu número de DNI (sin guiones ni espacios)</strong></p>
              </div>

              <p>Ya puedes acceder a tu espacio de socio:</p>
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
              <p>Este correo fue enviado a ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUser.user.id,
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
