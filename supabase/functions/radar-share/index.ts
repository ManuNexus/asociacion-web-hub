import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const redirect = "https://ahoraorg.es/radar-politico";

  let image = "https://ahoraorg.es/og-radar-default.png";
  let title = "Radar Político — AHORA";
  let description = "Descubre con qué partido político tienes más afinidad. Test rápido de AHORA.";

  if (id) {
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data } = await supabase
        .from("radar_resultados")
        .select("image_url, ganador_afinidad, resultados")
        .eq("id", id)
        .maybeSingle();
      if (data?.image_url) image = data.image_url;
      const top = Array.isArray(data?.resultados) ? (data!.resultados as any[])[0] : null;
      if (top && data?.ganador_afinidad != null) {
        title = `Mi partido más afín es ${top.nombre} (${data.ganador_afinidad}%)`;
        description = `Radar Político de AHORA · 20 preguntas · ¿Y el tuyo? #RadarPoliticoAHORA`;
      }
    } catch (_) { /* fallback */ }
  }

  const html = `<!doctype html><html lang="es"><head>
<meta charset="utf-8">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:image" content="${escape(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escape(redirect)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@AhoraORG_es">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${escape(image)}">
<meta http-equiv="refresh" content="0; url=${escape(redirect)}">
<link rel="canonical" href="${escape(redirect)}">
</head><body><p>Redirigiendo… <a href="${escape(redirect)}">Ir al Radar Político</a></p></body></html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
  });
});
