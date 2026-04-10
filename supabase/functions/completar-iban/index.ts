import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, solicitud_id, iban, titular_cuenta } = await req.json();

    if (!solicitud_id || typeof solicitud_id !== "string") {
      return new Response(JSON.stringify({ error: "solicitud_id requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(solicitud_id)) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get") {
      // Return only minimal, non-sensitive fields
      const { data, error } = await supabaseAdmin
        .from("solicitudes_socio")
        .select("nombre, apellidos, email, iban")
        .eq("id", solicitud_id)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Only return whether IBAN exists, not the actual value
      return new Response(JSON.stringify({
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        has_iban: !!data.iban,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!iban || typeof iban !== "string") {
        return new Response(JSON.stringify({ error: "IBAN requerido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate IBAN format
      const cleanIban = iban.replace(/\s/g, "").toUpperCase();
      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
      if (!ibanRegex.test(cleanIban)) {
        return new Response(JSON.stringify({ error: "Formato de IBAN inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check solicitud exists and doesn't already have IBAN
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from("solicitudes_socio")
        .select("id, iban")
        .eq("id", solicitud_id)
        .single();

      if (fetchError || !existing) {
        return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (existing.iban) {
        return new Response(JSON.stringify({ error: "IBAN ya completado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Sanitize titular_cuenta
      const cleanTitular = titular_cuenta
        ? String(titular_cuenta).trim().substring(0, 200)
        : null;

      const { error: updateError } = await supabaseAdmin
        .from("solicitudes_socio")
        .update({
          iban: cleanIban,
          titular_cuenta: cleanTitular,
          iban_submitted_at: new Date().toISOString(),
        })
        .eq("id", solicitud_id);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Error al guardar" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acción no válida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
