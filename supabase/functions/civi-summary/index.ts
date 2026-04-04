import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contexto } = await req.json();
    if (!contexto) {
      return new Response(JSON.stringify({ error: "contexto is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("civi_cache")
      .select("*")
      .eq("contexto", contexto)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ contenido: cached.contenido, datos_extra: cached.datos_extra, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all cases for the context (e.g., "semaforo_2025" → year 2025)
    const year = contexto.replace("semaforo_", "");
    let query = supabase.from("casos_semaforo").select("*").order("fecha", { ascending: false });

    if (year !== "all") {
      query = query.gte("fecha", `${year}-01-01`).lte("fecha", `${year}-12-31`);
    }

    const { data: casos, error: casosError } = await query;
    if (casosError) throw casosError;

    if (!casos || casos.length === 0) {
      return new Response(JSON.stringify({ contenido: null, datos_extra: null, cached: false, empty: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build stats for charts
    const stats = {
      total: casos.length,
      por_gravedad: { rojo: 0, ambar: 0, verde: 0 },
      por_ambito: { local: 0, autonomico: 0, nacional: 0 },
      por_mes: {} as Record<string, { rojo: number; ambar: number; verde: number }>,
    };

    for (const c of casos) {
      const g = c.gravedad as "rojo" | "ambar" | "verde";
      const a = c.ambito as "local" | "autonomico" | "nacional";
      stats.por_gravedad[g] = (stats.por_gravedad[g] || 0) + 1;
      stats.por_ambito[a] = (stats.por_ambito[a] || 0) + 1;

      const mes = c.fecha.substring(0, 7); // YYYY-MM
      if (!stats.por_mes[mes]) stats.por_mes[mes] = { rojo: 0, ambar: 0, verde: 0 };
      stats.por_mes[mes][g]++;
    }

    // Generate AI summary
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const casosResumen = casos.slice(0, 30).map((c: any) => `- [${c.gravedad}] ${c.titulo} (${c.ambito}, ${c.fecha})`).join("\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres CIVI, un asistente de inteligencia cívica de la asociación AHORA. Tu misión es analizar casos reales de integridad institucional y ofrecer resúmenes claros, objetivos y útiles para la ciudadanía.

El Semáforo Institucional clasifica los casos en tres niveles:
- 🔴 Condena / Delito: sentencias judiciales firmes, corrupción probada, malversación, prevaricación
- 🟡 Bajo Investigación: casos pendientes de resolución judicial, irregularidades denunciadas, procesos abiertos
- 🟢 Buena Práctica: mejoras en transparencia, cumplimiento normativo, avances institucionales positivos

Reglas:
- Escribe en español, tono profesional pero accesible
- Sé conciso: máximo 3-4 párrafos
- Destaca las tendencias más relevantes: ¿hay más condenas o más buenas prácticas? ¿qué ámbito territorial concentra más problemas?
- Menciona casos concretos cuando sean significativos
- No inventes datos, solo analiza lo proporcionado
- Usa formato markdown con negritas para destacar puntos clave
- Termina con una valoración breve sobre el estado de la integridad institucional`,
          },
          {
            role: "user",
            content: `Analiza los siguientes ${casos.length} casos del Semáforo Institucional${year !== "all" ? ` del año ${year}` : ""}:

Estadísticas:
- Total: ${stats.total} casos
- Condenas / Delitos (rojo): ${stats.por_gravedad.rojo}
- Bajo Investigación (ámbar): ${stats.por_gravedad.ambar}
- Buenas Prácticas (verde): ${stats.por_gravedad.verde}
- Ámbito local: ${stats.por_ambito.local}, autonómico: ${stats.por_ambito.autonomico}, nacional: ${stats.por_ambito.nacional}

Casos más recientes:
${casosResumen}

Genera un resumen analítico de la situación institucional.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Servicio temporalmente saturado. Inténtalo de nuevo en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const contenido = aiData.choices?.[0]?.message?.content || "No se pudo generar el análisis.";

    // Save to cache (24h TTL)
    await supabase.from("civi_cache").upsert({
      contexto,
      contenido,
      datos_extra: stats,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "contexto" });

    return new Response(JSON.stringify({ contenido, datos_extra: stats, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("civi-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
