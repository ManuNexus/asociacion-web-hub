import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  tipo: "evento" | "votacion";
  titulo: string;
  descripcion?: string;
  fecha?: string;
  ubicacion?: string;
  solo_junta: boolean;
}

// Helper function to convert line breaks to HTML
function nl2br(text: string): string {
  return text.replace(/\n/g, '<br>');
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let adminUserId: string;
    
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      adminUserId = payload.sub;
    } catch {
      console.error("Invalid token format");
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("User is not an admin:", adminUserId);
      return new Response(
        JSON.stringify({ error: "Only admins can send notifications" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin authorization verified for user:", adminUserId);

    const { tipo, titulo, descripcion, fecha, ubicacion, solo_junta }: NotifyRequest = await req.json();

    console.log(`Sending notification for ${tipo}: ${titulo}, solo_junta: ${solo_junta}`);

    // Get all active socios
    const { data: socios, error: sociosError } = await supabase
      .from("socios")
      .select("email, nombre, apellidos, user_id")
      .eq("activo", true);

    if (sociosError) {
      console.error("Error fetching socios:", sociosError);
      throw new Error("Error fetching socios");
    }

    if (!socios || socios.length === 0) {
      console.log("No socios to notify");
      return new Response(JSON.stringify({ message: "No recipients found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // If solo_junta, filter to only junta members
    let recipients = socios;
    if (solo_junta) {
      const userIds = socios.map(s => s.user_id);
      const { data: juntaRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "junta")
        .in("user_id", userIds);

      const juntaUserIds = new Set(juntaRoles?.map(r => r.user_id) || []);
      recipients = socios.filter(s => juntaUserIds.has(s.user_id));
      
      console.log(`Filtered to ${recipients.length} junta members`);
    }

    if (recipients.length === 0) {
      console.log("No recipients to notify");
      return new Response(JSON.stringify({ message: "No recipients found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const tipoLabel = tipo === "evento" ? "Nuevo Evento" : "Nueva Votación";
    const subject = `${solo_junta ? "[JUNTA] " : ""}${tipoLabel}: ${titulo}`;

    let detallesContent = "";
    
    if (descripcion) {
      detallesContent += `<p>${nl2br(descripcion)}</p>`;
    }

    if (tipo === "evento" && fecha) {
      const fechaFormatted = new Date(fecha).toLocaleString("es-ES", {
        dateStyle: "long",
        timeStyle: "short",
      });
      detallesContent += `<p><strong>📅 Fecha:</strong> ${fechaFormatted}</p>`;
      if (ubicacion) {
        detallesContent += `<p><strong>📍 Lugar:</strong> ${ubicacion}</p>`;
      }
    }

    if (tipo === "votacion") {
      detallesContent += `<p>Se ha abierto una nueva votación. Accede al panel de socios para participar.</p>`;
    }

    const htmlContent = `
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
          .info-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${tipoLabel}${solo_junta ? " (Junta)" : ""}</h1>
          </div>
          <div class="content">
            <h2 style="color: #1e3a5f; margin-top: 0;">${titulo}</h2>
            
            <div class="info-box">
              ${detallesContent}
            </div>
            
            <p style="text-align: center;">
              <a href="https://ahoraorg.es/socios" class="button">Acceder al Panel de Socios</a>
            </p>
            
            <p>Un cordial saludo,<br><em>El equipo de AHORA</em></p>
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
    
    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: "AHORA <socios@ahoraorg.es>",
          to: [recipient.email],
          subject: subject,
          html: htmlContent,
        });
        successful++;
        console.log(`Email sent to ${recipient.email}`);
      } catch (error) {
        failed++;
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }
      
      // Wait 1 second between emails to avoid rate limiting
      if (recipients.indexOf(recipient) < recipients.length - 1) {
        await delay(1000);
      }
    }

    console.log(`Emails sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Notificaciones enviadas: ${successful} correctas, ${failed} fallidas`,
        successful,
        failed 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-socios function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
