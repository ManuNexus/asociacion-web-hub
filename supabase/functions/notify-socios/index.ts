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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">AHORA</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
          <h2 style="color: #1e3a8a; margin-top: 0;">${tipoLabel}</h2>
          <h3 style="color: #333; font-size: 20px;">${titulo}</h3>
    `;

    if (descripcion) {
      htmlContent += `<p style="color: #666;">${descripcion}</p>`;
    }

    if (tipo === "evento" && fecha) {
      const fechaFormatted = new Date(fecha).toLocaleString("es-ES", {
        dateStyle: "long",
        timeStyle: "short",
      });
      htmlContent += `
        <p style="color: #333;"><strong>📅 Fecha:</strong> ${fechaFormatted}</p>
      `;
      if (ubicacion) {
        htmlContent += `<p style="color: #333;"><strong>📍 Lugar:</strong> ${ubicacion}</p>`;
      }
    }

    if (tipo === "votacion") {
      htmlContent += `
        <p style="color: #333;">Se ha abierto una nueva votación. Accede al panel de socios para participar.</p>
      `;
    }

    htmlContent += `
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <a href="https://ahoraorg.es/socios" style="background: #eab308; color: #1e3a8a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Acceder al Panel de Socios
            </a>
          </div>
        </div>
        <div style="background: #1e3a8a; padding: 16px; text-align: center;">
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            Este correo se ha enviado automáticamente desde AHORA
          </p>
        </div>
      </div>
    `;

    // Send emails to all recipients
    const emailPromises = recipients.map(recipient =>
      resend.emails.send({
        from: "AHORA <noreply@ahoraorg.es>",
        to: [recipient.email],
        subject: subject,
        html: htmlContent,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

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