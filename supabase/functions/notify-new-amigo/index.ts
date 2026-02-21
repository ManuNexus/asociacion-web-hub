import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AmigoData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const amigo: AmigoData = await req.json();
    console.log("Nuevo amigo registrado:", amigo.email);

    // Email 1: Notificación al administrador
    const adminEmailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: ["marrorra2001@gmail.com", "presidencia@ahoraorg.es"],
      subject: `Nuevo amigo registrado: ${amigo.nombre} ${amigo.apellidos}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
              <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">Nuevo Amigo Registrado</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Se ha registrado un nuevo amigo/simpatizante en AHORA.
              </p>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 15px 0;">Datos del amigo:</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; width: 140px;">Nombre:</td>
                    <td style="padding: 8px 0; color: #333;">${amigo.nombre} ${amigo.apellidos}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #333;"><a href="mailto:${amigo.email}" style="color: #2d5a87;">${amigo.email}</a></td>
                  </tr>
                  ${amigo.telefono ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Teléfono:</td>
                    <td style="padding: 8px 0; color: #333;">${amigo.telefono}</td>
                  </tr>
                  ` : ''}
                </table>
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

    console.log("Email de notificación al admin enviado:", adminEmailResponse);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Email 2: Confirmación al amigo
    const amigoEmailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [amigo.email],
      subject: "¡Bienvenido/a a la comunidad de AHORA!",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
              <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">¡Bienvenido/a a AHORA!</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Hola <strong>${amigo.nombre}</strong>,
              </p>
              
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                ¡Gracias por unirte a la comunidad de amigos de <strong>AHORA</strong>! Ya formas parte de una red de personas comprometidas con los valores democráticos y constitucionales.
              </p>
              
              <div style="background-color: #f0f9ff; border-left: 4px solid #1e3a5f; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #1e3a5f; font-size: 16px; margin: 0 0 10px 0;">¿Qué significa ser amigo de AHORA?</h3>
                <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Recibirás nuestro boletín informativo con noticias y novedades</li>
                  <li>Te informaremos de todos los eventos públicos que organicemos</li>
                  <li>Formarás parte de nuestra comunidad de simpatizantes</li>
                </ul>
              </div>

              <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">💡 ¿Quieres participar más activamente?</h3>
                <p style="color: #78350f; margin: 0; line-height: 1.6;">
                  Si en el futuro quieres tener voz y voto en la asociación, puedes hacerte socio/a en cualquier momento desde nuestra web.
                </p>
              </div>

              <p style="text-align: center; margin: 25px 0;">
                <a href="https://ahoraorg.es" style="display: inline-block; background-color: #f1c40f; color: #1e3a5f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Visitar AHORA
                </a>
              </p>
              
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Si tienes cualquier duda, puedes escribirnos a <a href="mailto:info@ahoraorg.es" style="color: #2d5a87;">info@ahoraorg.es</a>.
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 25px;">
                Un cordial saludo,<br>
                <em>El equipo de AHORA</em>
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                AHORA - Actuar en el presente para construir el futuro
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de confirmación al amigo enviado:", amigoEmailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error enviando notificación de amigo:", error);
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
