import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Madrid'
  });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  });
};

const generateReminderHTML = (
  evento: { titulo: string; descripcion: string | null; fecha: string; fecha_fin: string | null },
  socioNombre: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center;">
                  <img src="https://ihxczttkofjnyviqmxpl.supabase.co/storage/v1/object/public/assets/logo-ahora-white.png" alt="AHORA" style="height: 50px; margin-bottom: 15px;" />
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                    ⏰ ¡Tu evento comienza en 1 hora!
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hola <strong>${socioNombre}</strong>,
                  </p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Te recordamos que tienes un evento programado que <strong>comienza en 1 hora</strong>:
                  </p>
                  
                  <!-- Event Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 20px;">${evento.titulo}</h2>
                        
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 5px 0;">
                              <span style="color: #6b7280; font-size: 14px;">📅 Fecha:</span>
                              <span style="color: #374151; font-size: 14px; font-weight: 500; margin-left: 8px;">${formatDate(evento.fecha)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0;">
                              <span style="color: #6b7280; font-size: 14px;">🕐 Hora:</span>
                              <span style="color: #374151; font-size: 14px; font-weight: 500; margin-left: 8px;">
                                ${formatTime(evento.fecha)}${evento.fecha_fin ? ` - ${formatTime(evento.fecha_fin)}` : ''}
                              </span>
                            </td>
                          </tr>
                          ${evento.descripcion ? `
                          <tr>
                            <td style="padding: 10px 0 0 0;">
                              <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.5;">${evento.descripcion}</p>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                    ¡No olvides prepararte para el evento!
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Este es un mensaje automático de la Asociación AHORA.<br>
                    No respondas a este correo.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("calendario-reminder: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get events starting in approximately 1 hour (55-65 minutes from now)
    const now = new Date();
    const in55Minutes = new Date(now.getTime() + 55 * 60 * 1000);
    const in65Minutes = new Date(now.getTime() + 65 * 60 * 1000);

    console.log(`Checking for events between ${in55Minutes.toISOString()} and ${in65Minutes.toISOString()}`);

    const { data: eventos, error: eventosError } = await supabaseClient
      .from("calendario_junta")
      .select("*")
      .gte("fecha", in55Minutes.toISOString())
      .lte("fecha", in65Minutes.toISOString());

    if (eventosError) {
      console.error("Error fetching eventos:", eventosError);
      throw new Error("Error al obtener eventos");
    }

    if (!eventos || eventos.length === 0) {
      console.log("No events found for reminder");
      return new Response(
        JSON.stringify({ success: true, message: "No hay eventos próximos" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${eventos.length} events to send reminders for`);

    let totalSent = 0;
    let totalErrors = 0;

    for (const evento of eventos) {
      console.log(`Processing reminder for: ${evento.titulo}`);

      // Get socios based on roles
      let query = supabaseClient
        .from("socios")
        .select("id, nombre, apellidos, email, cargo_junta")
        .eq("activo", true)
        .not("cargo_junta", "is", null);

      // If specific roles are assigned, filter by them
      if (evento.roles && evento.roles.length > 0) {
        query = query.in("cargo_junta", evento.roles);
      }

      const { data: socios, error: sociosError } = await query;

      if (sociosError) {
        console.error("Error fetching socios:", sociosError);
        continue;
      }

      if (!socios || socios.length === 0) {
        console.log("No socios to notify for this event");
        continue;
      }

      console.log(`Sending reminders to ${socios.length} socios`);

      // Send reminder emails
      for (const socio of socios) {
        try {
          await resend.emails.send({
            from: "AHORA <socios@ahoraorg.es>",
            to: [socio.email],
            subject: `⏰ Recordatorio: ${evento.titulo} - En 1 hora`,
            html: generateReminderHTML(evento, socio.nombre),
          });
          console.log(`Reminder sent to ${socio.email}`);
          totalSent++;
        } catch (error) {
          console.error(`Error sending reminder to ${socio.email}:`, error);
          totalErrors++;
        }
      }
    }

    console.log(`Reminders sent: ${totalSent}, Errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalSent,
        errors: totalErrors,
        eventsProcessed: eventos.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in calendario-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
