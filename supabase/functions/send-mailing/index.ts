import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MailingRequest {
  asunto: string;
  contenido: string;
  imagen_url: string | null;
  destinatarios: string[];
}

// Helper function to add delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log("User authenticated:", user.email);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Only admins can send mailings" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin authorization verified");

    const { asunto, contenido, imagen_url, destinatarios }: MailingRequest = await req.json();

    if (!asunto || !contenido || !destinatarios || destinatarios.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending mailing "${asunto}" to ${destinatarios.length} recipients`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
          .header p { margin: 10px 0 0 0; font-size: 14px; letter-spacing: 2px; color: #f1c40f; font-weight: 600; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; }
          .content h1, .content h2, .content h3 { color: #1e3a5f; }
          .content img { max-width: 100%; height: auto; }
          .featured-image { width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; }
          .button { display: inline-block; background: #f1c40f; color: #1e3a5f !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666666; font-size: 12px; padding: 20px; }
          ul, ol { padding-left: 20px; }
          blockquote { border-left: 3px solid #1e3a5f; padding-left: 15px; margin-left: 0; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AHORA</h1>
            <p>ACTUAR EN EL PRESENTE PARA CONSTRUIR EL FUTURO</p>
          </div>
          <div class="content">
            ${imagen_url ? `<img src="${imagen_url}" alt="Imagen destacada" class="featured-image" />` : ""}
            <h2 style="color: #1e3a5f; margin-top: 0;">${asunto}</h2>
            ${contenido}
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://ahoraorg.es/socios" class="button" style="color: #1e3a5f !important;">Acceder al Panel de Socios</a>
            </p>
          </div>
          <div class="footer">
            <p>AHORA - Actuar en el presente para construir el futuro</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails sequentially with delay to avoid rate limiting
    let successful = 0;
    let failed = 0;
    const failedEmails: string[] = [];
    
    for (const email of destinatarios) {
      try {
        await resend.emails.send({
          from: "AHORA <socios@ahoraorg.es>",
          to: [email],
          subject: asunto,
          html: htmlContent,
        });
        successful++;
        console.log(`Email sent to ${email}`);
      } catch (error) {
        failed++;
        failedEmails.push(email);
        console.error(`Failed to send email to ${email}:`, error);
      }
      
      // Wait 1 second between emails to avoid rate limiting
      if (destinatarios.indexOf(email) < destinatarios.length - 1) {
        await delay(1000);
      }
    }

    console.log(`Mailing complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Emails enviados: ${successful} correctos, ${failed} fallidos`,
        successful,
        failed,
        failedEmails: failed > 0 ? failedEmails : undefined
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-mailing function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
