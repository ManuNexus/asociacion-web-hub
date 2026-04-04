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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  try {
    // GET — list all or get by id
    if (req.method === "GET") {
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
      // Optional filters
      const gravedad = url.searchParams.get("gravedad");
      const ambito = url.searchParams.get("ambito");
      const limit = parseInt(url.searchParams.get("limit") || "100");

      let query = supabase
        .from("casos_semaforo")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(limit);

      if (gravedad) query = query.eq("gravedad", gravedad);
      if (ambito) query = query.eq("ambito", ambito);

      const { data, error } = await query;
      if (error) throw error;
      return json(data);
    }

    // POST — create
    if (req.method === "POST") {
      const body = await req.json();
      const { titulo, descripcion, fecha, gravedad, ambito, fuente_url } = body;
      if (!titulo || !gravedad) {
        return json({ error: "titulo and gravedad are required" }, 400);
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
      return json(data, 201);
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
