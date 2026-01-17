import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyExclusiveNewsRequest {
  noticia_id: string;
  titulo: string;
  extracto?: string;
  test_email?: string; // If provided, send only to this email for testing
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    const { noticia_id, titulo, extracto, test_email }: NotifyExclusiveNewsRequest = await req.json();

    if (!noticia_id || !titulo) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: noticia_id, titulo" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If test_email is provided, only send to that email
    let recipients: { email: string; nombre: string; apellidos: string }[] = [];
    
    if (test_email) {
      console.log(`Test mode: sending only to ${test_email}`);
      recipients = [{ email: test_email, nombre: "Test", apellidos: "User" }];
    } else {
      // Fetch all active socios
      const { data: socios, error: sociosError } = await supabase
        .from("socios")
        .select("email, nombre, apellidos")
        .eq("activo", true);

      if (sociosError) {
        console.error("Error fetching socios:", sociosError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch socios" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!socios || socios.length === 0) {
        return new Response(
          JSON.stringify({ message: "No active socios to notify" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      recipients = socios;
    }

    console.log(`Sending exclusive news notification to ${recipients.length} recipient(s)`);

    const noticiaUrl = `https://ahoraorg.es/noticias/${noticia_id}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
              <img src="https://ahoraorg.es/logo-ahora-white.png" alt="AHORA" width="120" style="margin-bottom: 16px;">
              <p style="color: #ffd700; font-size: 14px; font-weight: 600; letter-spacing: 2px; margin: 0;">CONTENIDO EXCLUSIVO PARA SOCIOS</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); padding: 4px; border-radius: 8px; margin-bottom: 24px;">
                <div style="background: #ffffff; padding: 16px; border-radius: 6px;">
                  <p style="margin: 0; font-size: 14px; color: #1a1a2e; font-weight: 600;">⭐ ¡Nuevo artículo exclusivo disponible!</p>
                </div>
              </div>
              
              <h1 style="color: #1a1a2e; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.3;">
                ${titulo}
              </h1>
              
              ${extracto ? `
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${extracto}
              </p>
              ` : ''}
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                Como socio/a de AHORA, tienes acceso anticipado a este contenido antes de su publicación general. ¡Gracias por formar parte de nuestra comunidad!
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${noticiaUrl}" style="display: inline-block; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Leer artículo exclusivo
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 8px 0;">
                Este email es exclusivo para socios de AHORA.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Asociación AHORA. Todos los derechos reservados.
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

    let sentCount = 0;
    let failedCount = 0;

    // Send emails sequentially with delay to avoid rate limiting
    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: "AHORA <socios@ahoraorg.es>",
          to: [recipient.email],
          subject: `⭐ Exclusivo para socios: ${titulo}`,
          html: emailHtml,
        });
        sentCount++;
        console.log(`Email sent to ${recipient.email}`);
        
        // Wait 1 second between emails to avoid rate limiting (skip for single test email)
        if (recipients.length > 1) {
          await delay(1000);
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        failedCount++;
      }
    }

    console.log(`Finished: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        total: recipients.length,
        test_mode: !!test_email
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in notify-exclusive-news:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
