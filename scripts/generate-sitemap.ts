// Genera public/sitemap.xml incluyendo rutas estáticas y noticias publicadas.
// Se ejecuta antes de `vite dev` y `vite build` (hooks predev/prebuild).

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ahoraorg.es";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://ihxczttkofjnyviqmxpl.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeGN6dHRrb2Zqbnl2aXFteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODE5ODMsImV4cCI6MjA4MDI1Nzk4M30.buT0MwGEmD68p2SuX5OO9DcCQNudKtEV6Cg6FqFdlYk";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/nosotros", changefreq: "monthly", priority: "0.8" },
  { path: "/noticias", changefreq: "daily", priority: "0.9" },
  { path: "/eventos", changefreq: "weekly", priority: "0.7" },
  { path: "/transparencia", changefreq: "monthly", priority: "0.7" },
  { path: "/hazte-socio", changefreq: "monthly", priority: "0.8" },
  { path: "/hazte-amigo", changefreq: "monthly", priority: "0.6" },
  { path: "/dona", changefreq: "monthly", priority: "0.7" },
  { path: "/semaforo-institucional", changefreq: "daily", priority: "0.8" },
  { path: "/politica-privacidad", changefreq: "yearly", priority: "0.3" },
  { path: "/condiciones-afiliacion", changefreq: "yearly", priority: "0.3" },
];

function toW3CDate(d: string): string {
  return new Date(d).toISOString().split("T")[0];
}

async function fetchNoticias(): Promise<SitemapEntry[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/noticias?select=id,updated_at,fecha_publicacion&publicada=eq.true&order=fecha_publicacion.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] No se pudieron cargar noticias (${res.status})`);
      return [];
    }
    const rows: Array<{
      id: string;
      updated_at: string | null;
      fecha_publicacion: string | null;
    }> = await res.json();
    return rows.map((n) => ({
      path: `/noticias/${n.id}`,
      lastmod: toW3CDate(n.updated_at || n.fecha_publicacion || new Date().toISOString()),
      changefreq: "monthly",
      priority: "0.7",
    }));
  } catch (err) {
    console.warn("[sitemap] Error al cargar noticias:", err);
    return [];
  }
}

function buildXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

async function main() {
  const noticias = await fetchNoticias();
  const entries = [...staticEntries, ...noticias];
  writeFileSync(resolve("public/sitemap.xml"), buildXml(entries));
  console.log(
    `sitemap.xml generado (${entries.length} entradas: ${staticEntries.length} estáticas + ${noticias.length} noticias)`,
  );
}

main();
