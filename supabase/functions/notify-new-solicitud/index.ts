import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SolicitudData {
  nombre: string;
  apellidos: string;
  email: string;
  dni: string;
  telefono?: string;
  ciudad?: string;
  provincia?: string;
  motivacion?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const solicitud: SolicitudData = await req.json();
    console.log("Nueva solicitud de socio recibida:", solicitud.email);

    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: ["marrorra2001@gmail.com"],
      subject: `Nueva solicitud de socio: ${solicitud.nombre} ${solicitud.apellidos}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
              <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">Nueva Solicitud de Socio</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Se ha recibido una nueva solicitud de alta como socio en AHORA.
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 15px 0;">Datos del solicitante:</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; width: 140px;">Nombre:</td>
                    <td style="padding: 8px 0; color: #333;">${solicitud.nombre} ${solicitud.apellidos}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">DNI/NIE:</td>
                    <td style="padding: 8px 0; color: #333;">${solicitud.dni}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #333;"><a href="mailto:${solicitud.email}" style="color: #2d5a87;">${solicitud.email}</a></td>
                  </tr>
                  ${solicitud.telefono ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Teléfono:</td>
                    <td style="padding: 8px 0; color: #333;">${solicitud.telefono}</td>
                  </tr>
                  ` : ''}
                  ${solicitud.ciudad || solicitud.provincia ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Ubicación:</td>
                    <td style="padding: 8px 0; color: #333;">${[solicitud.ciudad, solicitud.provincia].filter(Boolean).join(', ')}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              ${solicitud.motivacion ? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">Motivación:</h3>
                <p style="color: #78350f; margin: 0; font-style: italic;">"${solicitud.motivacion}"</p>
              </div>
              ` : ''}
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Accede al panel de administración para gestionar esta solicitud.
              </p>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://ahoraorg.es/admin" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Ir al Panel de Administración
                </a>
              </div>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Este es un mensaje automático de AHORA - Asociación
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de notificación enviado:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error enviando notificación de solicitud:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
