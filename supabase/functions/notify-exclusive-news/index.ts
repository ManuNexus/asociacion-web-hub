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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header-title { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 1px; }
          .header-subtitle { color: #f1c40f; font-size: 14px; letter-spacing: 2px; margin: 0; font-weight: 600; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f1c40f; color: #1e3a5f !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666666; font-size: 12px; }
          .info-box { background: #ffffff; border-left: 4px solid #f1c40f; padding: 15px; border-radius: 0 5px 5px 0; margin: 20px 0; }
          .exclusive-badge { display: inline-block; background: #f1c40f; color: #1e3a5f; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p class="header-title">AHORA</p>
            <p class="header-subtitle">CONTENIDO EXCLUSIVO PARA SOCIOS</p>
          </div>
          <div class="content">
            <p style="text-align: center;">
              <span class="exclusive-badge">⭐ ¡Nuevo artículo exclusivo disponible!</span>
            </p>
            
            <h2 style="color: #1e3a5f; margin-top: 10px; text-align: center;">${titulo}</h2>
            
            ${extracto ? `
            <div class="info-box">
              <p style="margin: 0;">${extracto}</p>
            </div>
            ` : ''}
            
            <p>Como socio/a de AHORA, tienes acceso anticipado a este contenido antes de su publicación general. ¡Gracias por formar parte de nuestra comunidad!</p>
            
            <p style="text-align: center;">
              <a href="${noticiaUrl}" style="display: inline-block; background: #f1c40f; color: #1e3a5f; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Leer artículo exclusivo</a>
            </p>
            
            <p>Un cordial saludo,<br><em>El equipo de AHORA</em></p>
          </div>
          <div class="footer">
            <p>Este email es exclusivo para socios de AHORA.</p>
            <p>AHORA - Actuar en el presente para construir el futuro</p>
          </div>
        </div>
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
