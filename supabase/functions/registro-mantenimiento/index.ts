import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  tipo: z.enum(["amigo", "socio"]),
  nombre: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  dni: z.string().trim().max(20).optional().or(z.literal("")),
  localidad: z.string().trim().max(120).optional().or(z.literal("")),
  cuota: z.string().trim().max(50).optional().or(z.literal("")),
  mensaje: z.string().trim().max(1000).optional().or(z.literal("")),
});

function escapeHtml(text?: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const d = parsed.data;
    const esSocio = d.tipo === "socio";
    const row = (label: string, value?: string) =>
      value
        ? `<tr><td style="padding:8px 0;color:#666;font-weight:bold;width:150px;">${label}:</td><td style="padding:8px 0;color:#333;">${escapeHtml(value)}</td></tr>`
        : "";

    const html = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
          <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);padding:30px;text-align:center;">
            <h1 style="color:#fbbf24;margin:0;font-size:22px;">Nueva solicitud de ${esSocio ? "SOCIO" : "AMIGO"} (modo mantenimiento)</h1>
          </div>
          <div style="padding:30px;">
            <p style="color:#333;font-size:15px;">Registro recibido desde la pantalla de mantenimiento de la web. No se ha guardado en la base de datos: procesar manualmente.</p>
            <div style="background:#f8fafc;border-radius:8px;padding:20px;">
              <table style="width:100%;border-collapse:collapse;">
                ${row("Tipo", esSocio ? "Socio" : "Amigo")}
                ${row("Nombre", `${d.nombre} ${d.apellidos}`)}
                ${row("Email", d.email)}
                ${row("Teléfono", d.telefono)}
                ${row("DNI", d.dni)}
                ${row("Localidad", d.localidad)}
                ${row("Cuota", d.cuota)}
                ${row("Mensaje", d.mensaje)}
              </table>
            </div>
          </div>
          <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">Mensaje automático de AHORA - Asociación</p>
          </div>
        </div>
      </body></html>`;

    await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: ["marrorra2001@gmail.com", "socios@ahoraorg.es"],
      reply_to: d.email,
      subject: `Nueva solicitud de ${esSocio ? "socio" : "amigo"}: ${d.nombre} ${d.apellidos}`,
      html,
    });

    await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [d.email],
      subject: "Hemos recibido tu solicitud - AHORA",
      html: `
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);padding:30px;text-align:center;">
              <h1 style="color:#fbbf24;margin:0;font-size:22px;">¡Gracias, ${escapeHtml(d.nombre)}!</h1>
            </div>
            <div style="padding:30px;color:#333;font-size:15px;line-height:1.6;">
              <p>Hemos recibido tu solicitud para ${esSocio ? "hacerte socio/a" : "ser amigo/a"} de AHORA.</p>
              <p>La web está temporalmente en mantenimiento, así que tramitaremos tu alta manualmente y te contactaremos en breve.</p>
              <p>Si necesitas algo, escríbenos a <a href="mailto:info@ahoraorg.es" style="color:#2d5a87;">info@ahoraorg.es</a>.</p>
            </div>
          </div>
        </body></html>`,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("registro-mantenimiento error:", error);
    return new Response(JSON.stringify({ error: "No se pudo enviar la solicitud" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
