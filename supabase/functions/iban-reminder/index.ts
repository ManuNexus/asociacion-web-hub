import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find solicitudes created more than 20 minutes ago without IBAN and not yet reminded
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    const { data: solicitudes, error: fetchError } = await supabase
      .from("solicitudes_socio")
      .select("id, nombre, apellidos, email")
      .is("iban", null)
      .eq("iban_reminder_sent", false)
      .lt("created_at", twentyMinutesAgo);

    if (fetchError) {
      console.error("Error fetching solicitudes:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${solicitudes?.length || 0} solicitudes needing IBAN reminder`);

    if (!solicitudes || solicitudes.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let sentCount = 0;

    for (const solicitud of solicitudes) {
      const completarIbanUrl = `https://asociacion-web-hub.lovable.app/completar-iban?id=${solicitud.id}`;

      try {
        await resend.emails.send({
          from: "AHORA <socios@ahoraorg.es>",
          to: [solicitud.email],
          subject: "Completa tu solicitud de socio - Datos bancarios pendientes",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">Datos Bancarios Pendientes</h1>
                </div>
                <div style="padding: 30px;">
                  <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                    Hola <strong>${solicitud.nombre}</strong>,
                  </p>
                  
                  <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                    Hemos recibido tu solicitud para formar parte de <strong>AHORA</strong>, pero nos falta un dato indispensable: <strong>tu cuenta bancaria para la domiciliación de la cuota</strong>.
                  </p>
                  
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                      <strong>⚠️ Importante:</strong> Sin los datos bancarios no podremos tramitar tu alta como socio, aunque la Junta apruebe tu solicitud.
                    </p>
                  </div>
                  
                  <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                    Te recomendamos que completes este paso mientras la Junta valora tu solicitud. Solo te llevará un minuto:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${completarIbanUrl}" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Completar datos bancarios
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; margin-top: 25px;">
                    Si tienes cualquier duda, puedes escribirnos a <a href="mailto:info@ahoraorg.es" style="color: #2d5a87;">info@ahoraorg.es</a>.
                  </p>
                  
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
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

        // Mark as reminded
        await supabase
          .from("solicitudes_socio")
          .update({ iban_reminder_sent: true })
          .eq("id", solicitud.id);

        sentCount++;
        console.log(`Reminder sent to ${solicitud.email}`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (emailError) {
        console.error(`Error sending reminder to ${solicitud.email}:`, emailError);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in iban-reminder function:", error);
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
