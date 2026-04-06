import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const BASE_URL = "https://ahoraorg.es";

const STATIC_PAGES = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/nosotros", changefreq: "monthly", priority: "0.8" },
  { loc: "/noticias", changefreq: "daily", priority: "0.9" },
  { loc: "/eventos", changefreq: "weekly", priority: "0.7" },
  { loc: "/transparencia", changefreq: "monthly", priority: "0.7" },
  { loc: "/hazte-socio", changefreq: "monthly", priority: "0.8" },
  { loc: "/hazte-amigo", changefreq: "monthly", priority: "0.6" },
  { loc: "/dona", changefreq: "monthly", priority: "0.7" },
  { loc: "/semaforo-institucional", changefreq: "daily", priority: "0.8" },
  { loc: "/politica-privacidad", changefreq: "yearly", priority: "0.3" },
  { loc: "/condiciones-afiliacion", changefreq: "yearly", priority: "0.3" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toW3CDate(date: string): string {
  return new Date(date).toISOString().split("T")[0];
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch all published news
  const { data: noticias } = await supabase
    .from("noticias")
    .select("id, updated_at, fecha_publicacion, imagen_url, titulo")
    .eq("publicada", true)
    .order("fecha_publicacion", { ascending: false });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

  // Static pages
  for (const page of STATIC_PAGES) {
    xml += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Dynamic news pages
  if (noticias) {
    for (const n of noticias) {
      const lastmod = toW3CDate(n.updated_at || n.fecha_publicacion);
      xml += `  <url>
    <loc>${BASE_URL}/noticias/${n.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>`;

      // Add image if available
      if (n.imagen_url) {
        xml += `
    <image:image>
      <image:loc>${escapeXml(n.imagen_url)}</image:loc>
      <image:title>${escapeXml(n.titulo)}</image:title>
    </image:image>`;
      }

      // Add Google News tag for articles published in the last 2 days
      if (n.fecha_publicacion) {
        const pubDate = new Date(n.fecha_publicacion);
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        if (pubDate >= twoDaysAgo) {
          xml += `
    <news:news>
      <news:publication>
        <news:name>AHORA</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${pubDate.toISOString()}</news:publication_date>
      <news:title>${escapeXml(n.titulo)}</news:title>
    </news:news>`;
        }
      }

      xml += `
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
