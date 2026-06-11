import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { escapeHtml as esc } from "../_shared/escape-html.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SolicitudBajaRequest {
  motivo: string;
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

    // Verify user token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      throw new Error("Invalid or expired token");
    }

    // Get socio data
    const { data: socio, error: socioError } = await supabaseAdmin
      .from("socios")
      .select("id, nombre, apellidos, email, numero_socio")
      .eq("user_id", user.id)
      .eq("activo", true)
      .single();

    if (socioError || !socio) {
      throw new Error("No se encontró el socio");
    }

    const { motivo }: SolicitudBajaRequest = await req.json();

    if (!motivo || motivo.trim().length < 10) {
      throw new Error("Por favor, indica un motivo válido (mínimo 10 caracteres)");
    }

    console.log(`Solicitud de baja de ${socio.nombre} ${socio.apellidos} (${socio.email})`);

    const nombreSafe = esc(socio.nombre);
    const apellidosSafe = esc(socio.apellidos);
    const emailSafe = esc(socio.email);
    const numeroSocioSafe = esc(socio.numero_socio);
    const motivoSafe = esc(motivo);

    const fechaSolicitud = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send confirmation email to the member
    await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [socio.email],
      subject: "Solicitud de baja recibida - AHORA",
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
              <h1 style="margin: 0;">Solicitud de baja recibida</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${socio.nombre}</strong>,</p>
              
              <p>Hemos recibido tu solicitud de baja como socio/a de AHORA.</p>
              
              <div class="info-box">
                <p><strong>Fecha de solicitud:</strong> ${fechaSolicitud}</p>
                <p><strong>Motivo indicado:</strong></p>
                <p style="font-style: italic; color: #555;">"${motivo}"</p>
              </div>
              
              <p>La Junta Directiva ha sido notificada y <strong>procesará tu solicitud en los próximos días</strong>. Recibirás una confirmación cuando la baja sea efectiva.</p>
              
              <p>Si tienes cualquier duda o deseas cancelar esta solicitud, puedes escribirnos a <a href="mailto:info@ahoraorg.es">info@ahoraorg.es</a>.</p>
              
              <p>Gracias por haber formado parte de nuestra comunidad.</p>
              
              <p>Un cordial saludo,<br><em>El equipo de AHORA</em></p>
            </div>
            <div class="footer">
              <p>AHORA - Actuar en el presente para construir el futuro</p>
              <p>Este correo fue enviado a ${socio.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Confirmation email sent to member");

    // Send notification email to presidencia
    await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: ["presidencia@ahoraorg.es"],
      subject: `⚠️ Solicitud de baja: ${socio.nombre} ${socio.apellidos}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .info-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Solicitud de baja de socio</h1>
            </div>
            <div class="content">
              <p>Se ha recibido una <strong>solicitud de baja</strong> de un socio.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #1e3a5f;">Datos del socio</h3>
                <p><strong>Nombre:</strong> ${socio.nombre} ${socio.apellidos}</p>
                <p><strong>Email:</strong> ${socio.email}</p>
                <p><strong>Nº de socio:</strong> ${socio.numero_socio || 'No asignado'}</p>
                <p><strong>Fecha solicitud:</strong> ${fechaSolicitud}</p>
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #1e3a5f;">Motivo de la baja</h3>
                <p style="font-style: italic; color: #555;">"${motivo}"</p>
              </div>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Acción requerida:</strong> Por favor, procesa esta solicitud desde el panel de administración cuando corresponda.</p>
              </div>
              
              <p>Puedes acceder al <a href="https://ahoraorg.es/admin">panel de administración</a> para gestionar esta solicitud.</p>
            </div>
            <div class="footer">
              <p>AHORA - Sistema de gestión de socios</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Notification email sent to presidencia");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Solicitud de baja enviada correctamente"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in solicitar-baja function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
