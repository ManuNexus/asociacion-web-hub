import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Processing password reset for: ${email}`);

    // Check if user exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "Si el email existe, recibirás un enlace de recuperación" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log("User not found, returning generic success message");
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "Si el email existe, recibirás un enlace de recuperación" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user's name from socios table if available
    const { data: socioData } = await supabaseAdmin
      .from("socios")
      .select("nombre")
      .eq("email", email)
      .maybeSingle();

    const nombre = socioData?.nombre || "Usuario";

    // Generate password reset link with redirect to production domain
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: "https://ahoraorg.es/auth",
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      throw new Error("Error al generar el enlace de recuperación");
    }

    // The generated link contains the token, but we need to construct a proper URL
    // that redirects to our production domain
    const resetLink = linkData.properties?.action_link;
    
    if (!resetLink) {
      throw new Error("No se pudo generar el enlace de recuperación");
    }

    console.log("Reset link generated successfully");

    // Send email using Resend with our branding
    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [email],
      subject: "Recupera tu contraseña - AHORA",
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
            .button { display: inline-block; background: #f1c40f; color: #1e3a5f; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en AHORA.</p>
              
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Restablecer mi contraseña</a>
              </p>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⏱️ Este enlace expirará en 1 hora.</strong></p>
              </div>
              
              <p>Si no has solicitado este cambio, puedes ignorar este mensaje. Tu contraseña actual seguirá siendo válida.</p>
              
              <p>Si tienes algún problema, contacta con nosotros.</p>
              <p><em>El equipo de AHORA</em></p>
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

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Si el email existe, recibirás un enlace de recuperación" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
