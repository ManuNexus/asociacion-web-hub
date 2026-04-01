import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BajaSocioRequest {
  socio_id: string;
  email: string;
  nombre: string;
  apellidos: string;
  eliminar_datos?: boolean;
  motivo?: "impago" | "baja";
  pasar_a_amigo?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      throw new Error("Invalid or expired token");
    }
    
    const adminUserId = user.id;
    console.log("Verified admin user ID:", adminUserId);

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Only admins can manage socios");
    }

    const { socio_id, email, nombre, apellidos, eliminar_datos, motivo = "baja", pasar_a_amigo }: BajaSocioRequest = await req.json();

    console.log(`Processing baja for socio: ${email} (${nombre} ${apellidos}), motivo: ${motivo}, eliminar_datos: ${eliminar_datos}, pasar_a_amigo: ${pasar_a_amigo}`);

    // Get socio data
    const { data: socioData, error: socioError } = await supabaseAdmin
      .from("socios")
      .select("user_id, telefono, activo")
      .eq("id", socio_id)
      .single();

    if (socioError || !socioData) {
      throw new Error("Socio no encontrado");
    }

    let existingAmigo: { id: string } | null = null;

    if (!eliminar_datos && pasar_a_amigo) {
      const { data: existingAmigoData } = await supabaseAdmin
        .from("amigos")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      existingAmigo = existingAmigoData;
    }

    if (!eliminar_datos && socioData.activo === false) {
      let membershipRoles: Array<{ role: string }> = [];

      if (socioData.user_id) {
        const { data: membershipRoleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", socioData.user_id)
          .in("role", ["socio", "junta"]);

        membershipRoles = membershipRoleData || [];
      }

      const alreadyProcessed = membershipRoles.length === 0 && (!pasar_a_amigo || !!existingAmigo);

      if (alreadyProcessed) {
        console.log("Baja already processed, skipping duplicate email");
        return new Response(
          JSON.stringify({ success: true, message: "La baja ya estaba tramitada" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    if (eliminar_datos && socioData?.user_id) {
      console.log("Deleting socio data and auth user...");
      await supabaseAdmin.from("socios").delete().eq("id", socio_id);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", socioData.user_id);
      await supabaseAdmin.auth.admin.deleteUser(socioData.user_id);
      console.log("Socio data deleted successfully");
    } else {
      // Deactivate socio
      await supabaseAdmin
        .from("socios")
        .update({ activo: false })
        .eq("id", socio_id);

      // Remove socio and junta roles (keep user role for auth access but no panel access)
      if (socioData?.user_id) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", socioData.user_id).eq("role", "socio");
        await supabaseAdmin.from("user_roles").delete().eq("user_id", socioData.user_id).eq("role", "junta");
      }

      // Insert into amigos table if pasar_a_amigo
      if (pasar_a_amigo) {
        if (!existingAmigo) {
          await supabaseAdmin.from("amigos").insert({
            nombre,
            apellidos,
            email,
            telefono: socioData?.telefono || null,
          });
          console.log("Socio added to amigos table");
        } else {
          console.log("Already exists as amigo, skipping insert");
        }
      }
    }

    // Build email based on motivo
    const isImpago = motivo === "impago";
    
    const subject = eliminar_datos 
      ? "Tus datos han sido eliminados - AHORA" 
      : isImpago
        ? "Cambio en tu membresía por impago - AHORA"
        : "Baja de socio - AHORA";

    const contentHtml = eliminar_datos ? `
      <p>Te confirmamos que tus datos han sido <strong>eliminados completamente</strong> de nuestros sistemas, conforme a tu solicitud y a la normativa de protección de datos (RGPD).</p>
      <p>Gracias por haber formado parte de AHORA durante este tiempo. Ha sido un placer tenerte con nosotros.</p>
    ` : isImpago ? `
      <p>Te escribimos para informarte de que, debido al <strong>impago de las cuotas correspondientes</strong>, tu condición de socio/a en AHORA ha sido modificada.</p>
      <p>A partir de ahora, <strong>no tendrás acceso</strong> al área de socios ni a los servicios exclusivos para miembros.</p>
      <p>No obstante, hemos mantenido tus datos como <strong>amigo/a de AHORA</strong>, por lo que seguirás recibiendo nuestras comunicaciones generales y podrás seguir participando en nuestras actividades públicas.</p>
      
      <div class="info-box">
        <p><strong>¿Quieres regularizar tu situación?</strong></p>
        <p>Si deseas volver a ser socio/a, puedes ponerte al corriente de pago escribiéndonos a <a href="mailto:info@ahoraorg.es">info@ahoraorg.es</a> y tramitaremos tu reincorporación de forma inmediata.</p>
      </div>
    ` : `
      <p>Te confirmamos que tu membresía como socio/a en AHORA ha sido dada de <strong>baja</strong> según tu solicitud.</p>
      <p>A partir de ahora, <strong>no tendrás acceso</strong> al área de socios ni a los servicios exclusivos para miembros.</p>
      <p>Hemos mantenido tus datos como <strong>amigo/a de AHORA</strong>, por lo que seguirás recibiendo nuestras comunicaciones generales y podrás seguir participando en nuestras actividades públicas.</p>
      <p>Queremos agradecerte sinceramente el tiempo que has formado parte de nuestra comunidad. Ha sido un placer tenerte con nosotros.</p>
      
      <div class="info-box">
        <p><strong>¿Quieres volver?</strong></p>
        <p>Si en el futuro deseas volver a ser socio/a, solo tienes que escribirnos a <a href="mailto:info@ahoraorg.es">info@ahoraorg.es</a> y estaremos encantados de tramitar tu alta de nuevo.</p>
      </div>
    `;

    const headerTitle = eliminar_datos 
      ? "Eliminación de datos" 
      : isImpago 
        ? "Cambio en tu membresía"
        : "Baja de socio";

    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [email],
      subject,
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
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .info-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${headerTitle}</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              ${contentHtml}
              ${!eliminar_datos ? `
                <div class="info-box">
                  <p><strong>¿Deseas eliminar tus datos?</strong></p>
                  <p>Si prefieres que eliminemos completamente tus datos de nuestros sistemas, envíanos un correo a <a href="mailto:info@ahoraorg.es">info@ahoraorg.es</a> solicitándolo y procederemos conforme a la normativa RGPD.</p>
                </div>
              ` : ''}
              <p>Te deseamos lo mejor en tus proyectos futuros.</p>
              <p>Un cordial saludo,<br><em>El equipo de AHORA</em></p>
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
        message: eliminar_datos 
          ? "Datos eliminados correctamente" 
          : `Socio pasado a amigo (${motivo})`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in baja-socio function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
