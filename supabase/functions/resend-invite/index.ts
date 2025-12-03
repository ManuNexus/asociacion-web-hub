import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendInviteRequest {
  email: string;
  nombre: string;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    // Verify the token using REST API directly with anon key
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: supabaseAnonKey,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("Auth verification failed:", errorText);
      throw new Error("Unauthorized: Invalid token");
    }

    const user = await userResponse.json();
    console.log("User verified:", user.id);

    // Create admin client for other operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    console.log("Role check:", { roleData, roleError: roleError?.message });

    if (roleError || !roleData) {
      throw new Error("Only admins can resend invitations");
    }

    const { email, nombre }: ResendInviteRequest = await req.json();
    console.log(`Resending invite to: ${email} (${nombre})`);

    // Generate new password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app")}/auth`,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      throw new Error(`Error generating reset link: ${resetError.message}`);
    }

    const resetLink = resetData?.properties?.action_link || "";

    // Send email
    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [email],
      subject: "Recordatorio: Configura tu cuenta de AHORA",
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Recordatorio de AHORA</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>Te enviamos este recordatorio porque aún no has configurado tu contraseña para acceder al área de socios de AHORA.</p>
              <p>Haz clic en el siguiente botón para configurar tu contraseña:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Configurar mi contraseña</a>
              </p>
              <p>Una vez configurada tu contraseña, podrás acceder a:</p>
              <ul>
                <li>Directorio de socios</li>
                <li>Votaciones internas</li>
                <li>Eventos exclusivos</li>
                <li>Documentación interna</li>
              </ul>
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitación reenviada correctamente" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in resend-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
