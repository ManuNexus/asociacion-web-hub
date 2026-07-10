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

    // Only service-role callers can trigger fresh AI generation. Public callers
    // only ever read the cached result to prevent AI credit abuse.
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const isPrivileged = token && token === serviceKey;

    // Check cache first
    const { data: cached } = await supabase
      .from("civi_cache")
      .select("*")
      .eq("contexto", contexto)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ contenido: cached.contenido, datos_extra: cached.datos_extra, cached: true, cached_at: cached.created_at }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isPrivileged) {
      // No fresh cache and caller is not authorized to regenerate — return empty.
      return new Response(JSON.stringify({ contenido: null, datos_extra: null, cached: false, empty: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all cases for the context
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

    // Build stats
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

      const mes = c.fecha.substring(0, 7);
      if (!stats.por_mes[mes]) stats.por_mes[mes] = { rojo: 0, ambar: 0, verde: 0 };
      stats.por_mes[mes][g]++;
    }

    // Generate AI summary
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const casosResumen = casos.slice(0, 40).map((c: any) => 
      `- [${c.gravedad.toUpperCase()}] ${c.titulo} | ${c.ambito} | ${c.fecha}${c.descripcion ? ` — ${c.descripcion.substring(0, 120)}` : ""}`
    ).join("\n");

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
            content: `Eres **CIVI**, el motor de inteligencia cívica de la Asociación AHORA. Tu misión es leer las alertas del Semáforo Institucional y ofrecer una lectura cualitativa de cómo está la situación de la integridad institucional en España.

## Clasificación del Semáforo
- 🔴 **Condena / Delito**: sentencias firmes, corrupción probada, malversación, prevaricación.
- 🟡 **Bajo Investigación**: alertas pendientes de resolución, irregularidades denunciadas, procesos abiertos.
- 🟢 **Buena Práctica**: avances en transparencia, cumplimiento normativo, mejoras institucionales.

## Formato de respuesta obligatorio

Estructura tu análisis así:

### 📊 Panorama general
Párrafo cualitativo describiendo el clima institucional actual: qué tipo de casos predominan, qué instituciones o ámbitos están más señalados, qué está pasando en general. Sin cifras, sin porcentajes, sin totales.

### 🔍 Tendencias clave
- 2-3 patrones cualitativos: qué tipo de irregularidades se repiten, dónde se concentran, si mejora o empeora el tono general.
- Menciona **casos concretos** por su nombre cuando ilustren bien la tendencia.

### ⚖️ Valoración
Cierra con 1-2 frases que valoren el estado de la integridad institucional de forma clara y directa.

## Reglas de estilo
- Español, tono profesional pero cercano — como un analista explicando a un ciudadano informado.
- **Prohibido usar cifras, porcentajes, cantidades o comparaciones numéricas.** Nada de "el X%", "N alertas", "de cada diez", "mayoría/minoría cuantificada". Habla en términos cualitativos: "predominan", "es habitual", "destaca", "abundan", "resulta minoritario".
- Usa **negritas** para nombres de casos, instituciones o conceptos clave.
- Sé conciso: máximo 250 palabras.
- No inventes hechos ni extrapoles más allá de las alertas proporcionadas.
- No uses emojis en el cuerpo del texto (solo en los encabezados de sección).`,
          },
          {
            role: "user",
            content: `Genera la lectura cualitativa del Semáforo Institucional${year !== "all" ? ` del año ${year}` : ""}. Recuerda: nada de cifras ni porcentajes, solo un resumen de cómo está la situación.

**Alertas registradas (más recientes primero):**
${casosResumen}`,
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

    return new Response(JSON.stringify({ contenido, datos_extra: stats, cached: false, cached_at: new Date().toISOString() }), {
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
