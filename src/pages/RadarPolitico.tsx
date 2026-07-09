import { useEffect, useState, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Download, RotateCcw, ChevronRight, ChevronLeft, Loader2, Twitter } from "lucide-react";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import radarIllustration from "@/assets/radar-illustration.jpg";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  LabelList,
} from "recharts";

// ============ TYPES ============
interface Party {
  id: string;
  nombre: string;
  color: string;
  logo_url: string | null;
  axis_x: number;
  axis_y: number;
}

interface Question {
  id: string;
  category: string;
  text: string;
  /** Puntuación 1-5 de cada partido para esta pregunta. Claves = id partido en BD. */
  scores: Record<string, number>;
}

// ============ 20 PREGUNTAS (extraídas de programas 2023-2025) ============
// Escala: 1 = totalmente en desacuerdo con el enunciado, 5 = totalmente de acuerdo.
// CIUDADANOS incluido como placeholder centrista-liberal por si el admin lo activa.
const QUESTIONS: Question[] = [
  // ECONOMÍA (4)
  {
    id: "q1", category: "Economía",
    text: "Hay que reducir los impuestos directos a empresas y autónomos para estimular la actividad económica.",
    scores: { PP: 5, VOX: 5, CIUDADANOS: 5, PSOE: 2, SUMAR: 1, PODEMOS: 1 },
  },
  {
    id: "q2", category: "Economía",
    text: "El salario mínimo interprofesional debe seguir subiendo hasta alcanzar el 60% del salario medio.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 5, CIUDADANOS: 3, PP: 2, VOX: 2 },
  },
  {
    id: "q3", category: "Economía",
    text: "Debe implantarse una jornada laboral de 32-35 horas sin reducción salarial.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 3, CIUDADANOS: 2, PP: 1, VOX: 1 },
  },
  {
    id: "q4", category: "Economía",
    text: "Grandes fortunas y bancos deben pagar impuestos extraordinarios permanentes.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 4, CIUDADANOS: 2, PP: 1, VOX: 1 },
  },

  // MODELO TERRITORIAL (2)
  {
    id: "q5", category: "Modelo Territorial",
    text: "Es necesario recentralizar competencias autonómicas como educación o sanidad para asegurar la homogeneidad.",
    scores: { VOX: 5, PP: 3, CIUDADANOS: 4, PSOE: 1, SUMAR: 1, PODEMOS: 1 },
  },
  {
    id: "q6", category: "Modelo Territorial",
    text: "Cataluña y País Vasco deberían poder celebrar referéndums de autodeterminación pactados con el Estado.",
    scores: { PODEMOS: 5, SUMAR: 4, PSOE: 2, CIUDADANOS: 1, PP: 1, VOX: 1 },
  },

  // VIVIENDA (2)
  {
    id: "q7", category: "Vivienda",
    text: "El Estado debe intervenir y regular el precio máximo del alquiler en zonas tensionadas.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 4, CIUDADANOS: 1, PP: 1, VOX: 1 },
  },
  {
    id: "q8", category: "Vivienda",
    text: "La solución al problema de vivienda pasa por liberar suelo y ayudar a comprar, no por regular alquileres.",
    scores: { VOX: 5, PP: 5, CIUDADANOS: 5, PSOE: 2, SUMAR: 1, PODEMOS: 1 },
  },

  // ENERGÍA Y MEDIOAMBIENTE (2)
  {
    id: "q9", category: "Energía",
    text: "Debe prolongarse la vida útil de las centrales nucleares actuales como energía de transición.",
    scores: { VOX: 5, PP: 5, CIUDADANOS: 4, PSOE: 2, SUMAR: 1, PODEMOS: 1 },
  },
  {
    id: "q10", category: "Medioambiente",
    text: "España debe acelerar el cierre del diésel/gasolina y priorizar coche eléctrico y transporte público.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 4, CIUDADANOS: 3, PP: 2, VOX: 1 },
  },

  // SOCIAL / DERECHOS (3)
  {
    id: "q11", category: "Derechos LGTBI",
    text: "La ley trans (autodeterminación de género sin informe médico) debe mantenerse tal cual.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 4, CIUDADANOS: 2, PP: 1, VOX: 1 },
  },
  {
    id: "q12", category: "Aborto y Eutanasia",
    text: "El derecho al aborto y a la eutanasia deben blindarse constitucionalmente.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 5, CIUDADANOS: 4, PP: 2, VOX: 1 },
  },
  {
    id: "q13", category: "Seguridad",
    text: "Hay que endurecer las penas de cárcel y ampliar los efectivos policiales.",
    scores: { VOX: 5, PP: 5, CIUDADANOS: 4, PSOE: 3, SUMAR: 2, PODEMOS: 1 },
  },

  // EDUCACIÓN (2)
  {
    id: "q14", category: "Educación",
    text: "La educación concertada debe recibir financiación pública en igualdad con la pública.",
    scores: { VOX: 5, PP: 5, CIUDADANOS: 4, PSOE: 2, SUMAR: 1, PODEMOS: 1 },
  },
  {
    id: "q15", category: "Educación",
    text: "Debe eliminarse la asignatura de religión del horario lectivo en la escuela pública.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 3, CIUDADANOS: 4, PP: 1, VOX: 1 },
  },

  // INMIGRACIÓN (2)
  {
    id: "q16", category: "Inmigración",
    text: "Hay que endurecer los controles migratorios y facilitar las deportaciones de irregulares.",
    scores: { VOX: 5, PP: 4, CIUDADANOS: 3, PSOE: 2, SUMAR: 1, PODEMOS: 1 },
  },
  {
    id: "q17", category: "Inmigración",
    text: "Los inmigrantes en situación irregular deben tener acceso pleno a sanidad y servicios sociales.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 4, CIUDADANOS: 3, PP: 2, VOX: 1 },
  },

  // JUSTICIA Y MEMORIA (1)
  {
    id: "q18", category: "Memoria Histórica",
    text: "La Ley de Memoria Democrática debe mantenerse y ampliarse.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 5, CIUDADANOS: 2, PP: 2, VOX: 1 },
  },

  // UE / EXTERIOR (1)
  {
    id: "q19", category: "Unión Europea",
    text: "España debe aumentar su gasto militar hasta el 2% del PIB comprometido con la OTAN.",
    scores: { PP: 5, VOX: 5, CIUDADANOS: 4, PSOE: 4, SUMAR: 1, PODEMOS: 1 },
  },

  // IGUALDAD (1)
  {
    id: "q20", category: "Igualdad",
    text: "Las políticas específicas de igualdad de género (Ministerio de Igualdad, leyes de paridad) son necesarias.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 5, CIUDADANOS: 3, PP: 2, VOX: 1 },
  },
];

const SCALE = [
  { value: 1, short: "Totalmente\nen desacuerdo" },
  { value: 2, short: "En desacuerdo" },
  { value: 3, short: "Neutro" },
  { value: 4, short: "De acuerdo" },
  { value: 5, short: "Totalmente\nde acuerdo" },
];

export default function RadarPolitico() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("radar_partidos")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true });
      setParties((data as Party[]) ?? []);
      setLoadingParties(false);
    })();
  }, []);

  const total = QUESTIONS.length;
  const isFinished = step >= total;
  const current = !isFinished ? QUESTIONS[step] : null;
  const currentAnswer = current ? answers[current.id] : undefined;

  const selectValue = (v: number) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: v }));
  };

  const next = () => {
    if (currentAnswer == null) return;
    setStep((s) => s + 1);
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const results = useMemo(() => {
    if (!isFinished || parties.length === 0) return [];
    const maxDiff = 4 * QUESTIONS.length;
    return parties
      .map((p) => {
        const sumDiff = QUESTIONS.reduce(
          (acc, q) => acc + Math.abs((answers[q.id] ?? 3) - (q.scores[p.id] ?? 3)),
          0,
        );
        const affinity = Math.round(100 * (1 - sumDiff / maxDiff));
        return { ...p, affinity };
      })
      .sort((a, b) => b.affinity - a.affinity);
  }, [isFinished, answers, parties]);

  const userAxis = useMemo(() => {
    if (!isFinished || results.length === 0) return { x: 0, y: 0 };
    const weights = results.map((r) => Math.max(r.affinity, 0));
    const wSum = weights.reduce((a, b) => a + b, 0) || 1;
    const x = results.reduce((acc, r, i) => acc + Number(r.axis_x) * weights[i], 0) / wSum;
    const y = results.reduce((acc, r, i) => acc + Number(r.axis_y) * weights[i], 0) / wSum;
    return { x, y };
  }, [results, isFinished]);

  // Guarda anónimamente el resultado (sin datos personales) una única vez al finalizar
  const savedRef = useRef(false);
  useEffect(() => {
    if (!isFinished || results.length === 0 || savedRef.current) return;
    savedRef.current = true;
    const top = results[0];
    supabase
      .from("radar_resultados")
      .insert({
        ganador_partido_id: top.id,
        ganador_afinidad: top.affinity,
        resultados: results.map((r) => ({ id: r.id, nombre: r.nombre, affinity: r.affinity })),
        respuestas: answers,
      })
      .then(({ error }) => {
        if (error) console.warn("No se pudo registrar el resultado:", error.message);
      });
  }, [isFinished, results, answers]);


  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  const socialCardRef = useRef<HTMLDivElement>(null);
  const SHARE_URL = "https://ahoraorg.es/radar-politico";
  const HASHTAG = "#RadarPoliticoAHORA";
  const PARTY_HANDLES: Record<string, string> = {
    PP: "@ppopular",
    PSOE: "@PSOE",
    VOX: "@vox_es",
    SUMAR: "@sumar",
    PODEMOS: "@PODEMOS",
    CIUDADANOS: "@CiudadanosCs",
  };


  const buildSocialCanvas = async () => {
    if (!socialCardRef.current) return null;
    return await html2canvas(socialCardRef.current, {
      backgroundColor: "#224172",
      scale: 2,
      width: 1200,
      height: 630,
      windowWidth: 1200,
      windowHeight: 630,
      useCORS: true,
      allowTaint: false,
    });
  };

  const downloadImage = async () => {
    const canvas = await buildSocialCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "radar-politico-ahora.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const shareOnTwitter = async () => {
    const top = results[0];
    if (!top) return;
    // También descargamos la imagen para que el usuario pueda adjuntarla al tweet
    await downloadImage();
    const handle = PARTY_HANDLES[top.id];
    const partyMention = handle ? `${top.nombre} (${handle})` : top.nombre;
    const text = `Mi partido más afín según el Radar Político de @AhoraORG_es es ${partyMention} con un ${top.affinity}% de afinidad. ¿Y el tuyo? ${HASHTAG}`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SHARE_URL)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  const progress = isFinished ? 100 : (step / total) * 100;

  if (loadingParties) {
    return (
      <Layout>
        <SEO title="Radar Político — AHORA" description="Herramienta interna en pruebas" noindex />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (parties.length === 0) {
    return (
      <Layout>
        <SEO title="Radar Político — AHORA" description="Herramienta interna en pruebas" noindex />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <p className="text-center text-muted-foreground">
            No hay partidos activos configurados. Añádelos desde el panel de administración.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Radar Político — AHORA" description="Herramienta interna en pruebas" noindex />

      <div className="bg-slate-100 min-h-[calc(100vh-4rem)] py-6 md:py-10">
        <div className="container max-w-xl">
          {!isFinished && current && (

            <div className="bg-white rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white flex flex-col">
              <div className="bg-primary pt-8 pb-14 px-6 rounded-b-[2rem] relative">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-secondary text-[10px] font-bold tracking-widest uppercase">
                    Radar Político · {current.category}
                  </span>
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                  </div>
                </div>
                <h1 key={current.id} className="text-primary-foreground text-lg md:text-2xl font-bold leading-tight animate-fade-in">
                  {current.text}
                </h1>
              </div>

              <div className="px-5 -mt-8 z-10 flex flex-col pb-6">
                <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 p-6 border border-slate-50 flex flex-col">
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[11px] font-semibold text-primary/60">PROGRESO</span>
                      <span className="text-[11px] font-bold text-primary">{step + 1} de {total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="py-4">
                    <div className="relative flex justify-between items-center mb-6">
                      <div className="absolute left-2 right-2 h-0.5 bg-slate-200 top-1/2 -translate-y-1/2 z-0" />
                      {SCALE.map((opt) => {
                        const selected = currentAnswer === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => selectValue(opt.value)}
                            aria-label={opt.short.replace("\n", " ")}
                            className={
                              selected
                                ? "w-10 h-10 rounded-full bg-secondary border-4 border-white shadow-lg shadow-secondary/40 z-20 relative transition-all scale-110"
                                : "w-6 h-6 rounded-full bg-white border-2 border-slate-300 z-10 relative hover:border-primary hover:scale-110 transition-all"
                            }
                          />
                        );
                      })}
                    </div>

                    <div className="flex justify-between px-0 gap-1">
                      {SCALE.map((opt) => {
                        const selected = currentAnswer === opt.value;
                        return (
                          <div key={opt.value} className="text-center w-14">
                            <p className={"text-[9px] font-bold uppercase leading-tight whitespace-pre-line " + (selected ? "text-primary" : "text-slate-400")}>
                              {opt.short}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-5 flex gap-3 items-center">
                  <button
                    onClick={prev}
                    disabled={step === 0}
                    className="flex-1 h-12 rounded-xl text-[13px] font-bold text-primary border-2 border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button
                    onClick={next}
                    disabled={currentAnswer == null}
                    className="flex-[2] h-12 rounded-xl bg-secondary text-[13px] font-bold text-primary shadow-md hover:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{step === total - 1 ? "Ver resultados" : "Continuar"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isFinished && (
            <div className="mt-10 flex flex-col items-center text-center animate-fade-in">
              <img
                src={radarIllustration}
                alt="Ciudadanía participando en política"
                width={1024}
                height={1024}
                loading="lazy"
                className="w-full max-w-xs md:max-w-sm h-auto mix-blend-multiply select-none pointer-events-none"
              />
              <p className="mt-2 max-w-sm text-sm text-primary/70 font-medium">
                Tu opinión cuenta. Al terminar, tus respuestas se suman <span className="font-bold">de forma anónima</span> a la radiografía política de AHORA.
              </p>
            </div>
          )}



          {isFinished && results.length > 0 && (
            <div className="animate-fade-in space-y-4">
              <div ref={resultsRef} className="bg-white rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white">
                <div className="bg-primary pt-8 pb-10 px-6 rounded-b-[2rem]">
                  <span className="text-secondary text-[10px] font-bold tracking-widest uppercase">Tus resultados</span>
                  <div className="flex items-center gap-3 mt-1">
                    {results[0].logo_url && (
                      <img src={results[0].logo_url} alt={results[0].nombre} className="w-12 h-12 object-contain rounded bg-white p-1" />
                    )}
                    <h2 className="text-primary-foreground text-2xl md:text-3xl font-bold">
                      Mayor afinidad con{" "}
                      <span style={{ color: results[0].color }}>{results[0].nombre}</span>
                    </h2>
                  </div>
                  <p className="text-primary-foreground/70 text-sm mt-2">
                    {results[0].affinity}% de coincidencia · {total} preguntas
                  </p>
                </div>

                <div className="p-5 md:p-6 space-y-8">
                  <section>
                    <h3 className="text-[11px] font-bold text-primary/60 uppercase tracking-widest mb-3">Ranking de afinidad</h3>
                    <div className="space-y-2">
                      {results.map((r) => (
                        <div key={r.id} className="flex items-center gap-3">
                          {r.logo_url ? (
                            <img src={r.logo_url} alt={r.nombre} className="w-8 h-8 object-contain rounded bg-slate-50 border shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded shrink-0" style={{ backgroundColor: r.color }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-sm font-bold text-primary">{r.nombre}</span>
                              <span className="text-sm font-bold" style={{ color: r.color }}>{r.affinity}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(r.affinity, 0)}%`, backgroundColor: r.color }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <Button onClick={reset} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
                </Button>
                <Button onClick={downloadImage} variant="secondary">
                  <Download className="mr-2 h-4 w-4" /> Descargar imagen
                </Button>
                <Button onClick={shareOnTwitter} className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white">
                  <Twitter className="mr-2 h-4 w-4" /> Compartir en X
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta oculta para exportar imagen 1200x630 (formato redes sociales) */}
      {isFinished && results.length > 0 && (
        <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden="true">
          <div
            ref={socialCardRef}
            style={{
              width: 1200,
              height: 630,
              background: "linear-gradient(135deg, #224172 0%, #1a3560 60%, #142a4d 100%)",
              color: "#ffffff",
              fontFamily: "Montserrat, system-ui, sans-serif",
              padding: 56,
              boxSizing: "border-box",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Acento amarillo */}
            <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: "100%", background: "#EBAF0A" }} />
            <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(235,175,10,0.12)" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ background: "#EBAF0A", color: "#224172", fontWeight: 800, fontSize: 14, padding: "6px 14px", borderRadius: 999, letterSpacing: 1 }}>
                  RADAR POLÍTICO
                </span>
                <span style={{ opacity: 0.85, fontSize: 16 }}>AHORA · ahoraorg.es</span>
              </div>
              <span style={{ fontSize: 14, opacity: 0.75 }}>{HASHTAG}</span>
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 300, margin: 0, marginBottom: 8, opacity: 0.9 }}>Mi partido más afín es</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 12 }}>
              {results[0].logo_url && (
                <img
                  src={results[0].logo_url}
                  crossOrigin="anonymous"
                  alt={results[0].nombre}
                  style={{ width: 96, height: 96, objectFit: "contain", background: "#fff", borderRadius: 12, padding: 8 }}
                />
              )}
              <h1 style={{ fontSize: 76, fontWeight: 900, margin: 0, color: results[0].color, textShadow: "0 2px 20px rgba(0,0,0,0.3)", lineHeight: 1 }}>
                {results[0].nombre}
              </h1>
            </div>
            <p style={{ fontSize: 40, fontWeight: 700, margin: 0, marginBottom: 26 }}>
              <span style={{ color: "#EBAF0A" }}>{results[0].affinity}%</span>
              <span style={{ fontSize: 24, fontWeight: 400, opacity: 0.85, marginLeft: 12 }}>de afinidad</span>
            </p>

            {/* Ranking top 5 en barras con logos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.slice(0, 5).map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {r.logo_url ? (
                    <img
                      src={r.logo_url}
                      crossOrigin="anonymous"
                      alt={r.nombre}
                      style={{ width: 32, height: 32, objectFit: "contain", background: "#fff", borderRadius: 6, padding: 3, flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: r.color, flexShrink: 0 }} />
                  )}
                  <div style={{ width: 110, fontSize: 15, fontWeight: 700 }}>{r.nombre}</div>
                  <div style={{ flex: 1, height: 20, background: "rgba(255,255,255,0.12)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${r.affinity}%`, height: "100%", background: r.color, borderRadius: 999 }} />
                  </div>
                  <div style={{ width: 55, fontSize: 15, fontWeight: 700 }}>{r.affinity}%</div>
                </div>
              ))}
            </div>

            <div style={{ position: "absolute", bottom: 32, left: 56, right: 56, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, opacity: 0.85 }}>
              <span>Haz tu test en ahoraorg.es/radar-politico</span>
              <span style={{ fontWeight: 700 }}>#AHORA</span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
