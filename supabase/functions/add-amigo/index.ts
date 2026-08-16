import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const BodySchema = z.object({
  nombre: z.string().min(1).max(255),
  apellidos: z.string().max(255).optional().default(""),
  email: z.string().email().max(255),
  telefono: z.string().max(50).optional(),
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
    const token = req.headers.get("x-amigo-token");
    if (!token || token !== Deno.env.get("AMIGO_WEB_TOKEN")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { nombre, apellidos, email, telefono } = parsed.data;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: existingAmigo } = await supabaseAdmin
      .from("amigos")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingAmigo) {
      return new Response(
        JSON.stringify({ success: true, created: false, message: "El email ya estaba registrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: amigoData, error: insertError } = await supabaseAdmin
      .from("amigos")
      .insert({
        nombre,
        apellidos: apellidos || "",
        email,
        telefono: telefono || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting amigo:", insertError);
      throw new Error("No se pudo registrar el amigo");
    }

    console.log("Nuevo amigo registrado desde web personal:", email);

    const safeNombre = escapeHtml(nombre);
    const safeApellidos = escapeHtml(apellidos);
    const safeEmail = escapeHtml(email);
    const safeTelefono = escapeHtml(telefono);

    await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: ["marrorra2001@gmail.com", "presidencia@ahoraorg.es"],
      subject: `Nuevo amigo registrado desde web personal: ${safeNombre} ${safeApellidos}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
              <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">Nuevo Amigo desde Web Personal</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Se ha registrado un nuevo amigo/simpatizante en AHORA desde un formulario externo.
              </p>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 15px 0;">Datos del amigo:</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; width: 140px;">Nombre:</td>
                    <td style="padding: 8px 0; color: #333;">${safeNombre} ${safeApellidos}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #333;"><a href="mailto:${safeEmail}" style="color: #2d5a87;">${safeEmail}</a></td>
                  </tr>
                  ${safeTelefono ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Teléfono:</td>
                    <td style="padding: 8px 0; color: #333;">${safeTelefono}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Este es un mensaje automático de AHORA - Asociación
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de notificación al admin enviado para:", email);

    return new Response(
      JSON.stringify({ success: true, created: true, id: amigoData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in add-amigo function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
