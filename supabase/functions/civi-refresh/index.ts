import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Only allow service-role or admin-token callers (cron / admin). Reject anon/user JWTs.
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const adminToken = Deno.env.get("CIVI_ADMIN_TOKEN");
    const headerAdmin = req.headers.get("x-admin-token");
    const isAdmin = !!adminToken && headerAdmin === adminToken;
    if (token !== serviceKey && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all years with data
    const { data: casos } = await supabase
      .from("casos_semaforo")
      .select("fecha");

    if (!casos || casos.length === 0) {
      return new Response(JSON.stringify({ message: "No data to refresh" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const years = [...new Set(casos.map((c: any) => c.fecha.substring(0, 4)))];
    console.log(`Refreshing CIVI cache for years: ${years.join(", ")}`);

    // Delete existing cache entries to force regeneration
    await supabase.from("civi_cache").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Regenerate cache for each year by calling civi-summary
    const results: string[] = [];
    for (const year of years) {
      const contexto = `semaforo_${year}`;
      console.log(`Generating summary for ${contexto}...`);

      const res = await fetch(`${supabaseUrl}/functions/v1/civi-summary`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contexto }),
      });

      if (res.ok) {
        results.push(`✅ ${contexto}`);
      } else {
        const err = await res.text();
        results.push(`❌ ${contexto}: ${err}`);
        console.error(`Error refreshing ${contexto}:`, err);
      }

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log("CIVI refresh complete:", results);

    return new Response(JSON.stringify({ message: "CIVI refresh complete", results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("civi-refresh error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
