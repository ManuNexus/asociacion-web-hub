import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BirthdayRequest {
  email: string;
  nombre: string;
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
        JSON.stringify({ error: "Only admins can send birthday emails" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin authorization verified");

    const { email, nombre }: BirthdayRequest = await req.json();

    if (!email || !nombre) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending birthday email to ${email}`);

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
          .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; text-align: center; }
          .birthday-icon { font-size: 60px; margin-bottom: 20px; }
          .greeting { font-size: 28px; color: #1e3a5f; font-weight: bold; margin-bottom: 10px; }
          .message { font-size: 16px; color: #555; line-height: 1.8; }
          .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; color: #666666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AHORA</h1>
            <p>ACTUAR EN EL PRESENTE PARA CONSTRUIR EL FUTURO</p>
          </div>
          <div class="content">
            <div class="birthday-icon">🎂</div>
            <div class="greeting">¡Feliz Cumpleaños, ${nombre}!</div>
            <div class="message">
              <p>Desde AHORA queremos desearte un día muy especial lleno de alegría y buenos momentos.</p>
              <p>Gracias por ser parte de nuestra organización y por tu compromiso con nuestra causa.</p>
              <p>¡Que este nuevo año de vida te traiga muchas satisfacciones!</p>
            </div>
            <div class="signature">
              Con cariño,<br>
              <strong>La Junta Directiva de AHORA</strong>
            </div>
          </div>
          <div class="footer">
            <p>AHORA - Actuar en el presente para construir el futuro</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [email],
      subject: `¡Feliz Cumpleaños, ${nombre}! 🎂`,
      html: htmlContent,
    });

    console.log("Birthday email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ message: "Birthday email sent successfully", emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-birthday-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
