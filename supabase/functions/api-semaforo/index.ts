import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth via shared secret
  const apiKey = req.headers.get("x-api-key");
  const expected = Deno.env.get("N8N_API_SECRET");
  if (!expected || apiKey !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action");

  try {
    // Special action: refresh CIVI
    if (req.method === "POST" && action === "refresh-civi") {
      // Clear cache
      await supabase.from("civi_cache").delete().eq("contexto", "semaforo_all");

      // Trigger regeneration
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const civiRes = await fetch(`${supabaseUrl}/functions/v1/civi-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ contexto: "semaforo_all" }),
      });

      if (!civiRes.ok) {
        const errBody = await civiRes.text();
        return json({ error: "CIVI refresh failed", detail: errBody }, 502);
      }

      return json({ success: true, message: "CIVI analysis refreshed" });
    }

    // GET — list, get by id, or check similarity match
    if (req.method === "GET") {
      // Similarity match check (para n8n: ¿existe ya un caso parecido?)
      const matchText = url.searchParams.get("match");
      if (matchText) {
        const threshold = parseFloat(url.searchParams.get("threshold") || "0.8");
        const matchLimit = parseInt(url.searchParams.get("limit") || "5");
        const { data, error } = await supabase.rpc("match_casos_semaforo", {
          _texto: matchText,
          _threshold: threshold,
          _limit: matchLimit,
        });
        if (error) throw error;
        const filtered = (data || []).filter((r: any) => r.similarity >= threshold);
        const best = filtered[0];
        return json({
          match: !!best,
          best_similarity: best?.similarity ?? 0,
          best_id: best?.id ?? null,
          threshold,
          results: filtered,
        });
      }

      if (id) {
        const { data, error } = await supabase
          .from("casos_semaforo")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return json({ error: "Not found" }, 404);
        return json(data);
      }
      const gravedad = url.searchParams.get("gravedad");
      const ambito = url.searchParams.get("ambito");
      const q = url.searchParams.get("q");
      const fuenteUrl = url.searchParams.get("fuente_url");
      const limit = parseInt(url.searchParams.get("limit") || "100");

      let query = supabase
        .from("casos_semaforo")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(limit);

      if (fuenteUrl) query = query.eq("fuente_url", fuenteUrl);
      if (q) {
        // Split into tokens; each token must match titulo OR descripcion (AND across tokens)
        const tokens = q.split(/\s+/).filter((t) => t.length > 1);
        for (const t of tokens) {
          const p = `%${t}%`;
          query = query.or(`titulo.ilike.${p},descripcion.ilike.${p}`);
        }
      }
      if (gravedad) query = query.eq("gravedad", gravedad);
      if (ambito) query = query.eq("ambito", ambito);

      const { data, error } = await query;
      if (error) throw error;
      return json(data);
    }

    // POST — create (with dedup by fuente_url)
    if (req.method === "POST") {
      const body = await req.json();
      const { titulo, descripcion, fecha, gravedad, ambito, fuente_url } = body;
      if (!titulo || !gravedad) {
        return json({ error: "titulo and gravedad are required" }, 400);
      }

      const mode = url.searchParams.get("mode"); // 'upsert' to overwrite on duplicate

      // Dedup by fuente_url when provided
      if (fuente_url) {
        const { data: existing, error: findErr } = await supabase
          .from("casos_semaforo")
          .select("*")
          .eq("fuente_url", fuente_url)
          .maybeSingle();
        if (findErr) throw findErr;

        if (existing) {
          if (mode === "upsert") {
            const updatePayload: Record<string, unknown> = {};
            if (titulo !== undefined) updatePayload.titulo = titulo;
            if (descripcion !== undefined) updatePayload.descripcion = descripcion;
            if (fecha !== undefined) updatePayload.fecha = fecha;
            if (gravedad !== undefined) updatePayload.gravedad = gravedad;
            if (ambito !== undefined) updatePayload.ambito = ambito;
            const { data: updated, error: updErr } = await supabase
              .from("casos_semaforo")
              .update(updatePayload)
              .eq("id", existing.id)
              .select()
              .single();
            if (updErr) throw updErr;
            return json({ duplicate: true, updated: true, data: updated }, 200);
          }
          return json({ duplicate: true, updated: false, data: existing }, 200);
        }
      }

      const payload = {
        titulo,
        descripcion: descripcion || null,
        fecha: fecha || new Date().toISOString().slice(0, 10),
        gravedad,
        ambito: ambito || "nacional",
        fuente_url: fuente_url || null,
      };
      const { data, error } = await supabase.from("casos_semaforo").insert(payload).select().single();
      if (error) throw error;
      return json({ duplicate: false, data }, 201);
    }

    // PUT/PATCH — update by id
    if (req.method === "PUT" || req.method === "PATCH") {
      if (!id) return json({ error: "id query param required" }, 400);
      const body = await req.json();
      const { data, error } = await supabase
        .from("casos_semaforo")
        .update(body)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return json(data);
    }

    // DELETE
    if (req.method === "DELETE") {
      if (!id) return json({ error: "id query param required" }, 400);
      const { error } = await supabase.from("casos_semaforo").delete().eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("api-semaforo error:", err);
    return json({ error: err.message || "Internal error" }, 500);
  }
});
