import { useEffect, useState, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Download, RotateCcw, ChevronRight, ChevronLeft, Loader2, Twitter } from "lucide-react";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import radarIllustration from "@/assets/radar-illustration.jpg";
import logoAhoraWhite from "@/assets/logo-ahora-white.png";
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
  const [step, setStep] = useState(-1);
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

  const startTest = () => setStep(0);

  const total = QUESTIONS.length;
  const isFinished = step >= total;
  const isLanding = step < 0;
  const current = !isFinished && !isLanding ? QUESTIONS[step] : null;
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
  const [resultId, setResultId] = useState<string | null>(null);
  useEffect(() => {
    if (!isFinished || results.length === 0 || savedRef.current) return;
    savedRef.current = true;
    const top = results[0];
    supabase
      .from("radar_resultados")
      .insert({
        ganador_partido_id: top.id,
        ganador_afinidad: top.affinity,
        resultados: results.map((r) => ({ id: r.id, nombre: r.nombre, affinity: r.affinity, color: r.color })),
        respuestas: answers,
      })
      .select("id")
      .single()
      .then(({ data, error }) => {
        if (error) console.warn("No se pudo registrar el resultado:", error.message);
        else if (data?.id) setResultId(data.id);
      });
  }, [isFinished, results, answers]);


  const reset = () => {
    setAnswers({});
    setStep(-1);
    setResultId(null);
    savedRef.current = false;
  };

  const HASHTAG = "#RadarPoliticoAHORA";
  const PARTY_HANDLES: Record<string, string> = {
    PP: "@ppopular",
    PSOE: "@PSOE",
    VOX: "@vox_es",
    SUMAR: "@sumar",
    PODEMOS: "@PODEMOS",
    CIUDADANOS: "@CiudadanosCs",
  };

  const shareOnTwitter = () => {
    const top = results[0];
    if (!top) return;
    const handle = PARTY_HANDLES[top.id];
    const partyMention = handle ? `${top.nombre} (${handle})` : top.nombre;
    const shareUrl = "https://ahoraorg.es/radar-politico";
    const text = `Mi partido más afín según el Radar Político de @AhoraORG_es es ${partyMention} con un ${top.affinity}% de afinidad. ¿Y el tuyo? ${HASHTAG}`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  const progress = isFinished ? 100 : isLanding ? 0 : (step / total) * 100;

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
          {isLanding && (
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white flex flex-col">
              <div className="bg-primary pt-8 pb-14 px-6 rounded-b-[2rem] relative">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-secondary text-[10px] font-bold tracking-widest uppercase">
                    Radar Político · AHORA
                  </span>
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                  </div>
                </div>
                <h1 className="text-primary-foreground text-2xl md:text-3xl font-bold leading-tight">
                  Descubre con qué partido coincide tu voz
                </h1>
              </div>

              <div className="px-5 -mt-8 z-10 flex flex-col pb-6">
                <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 p-6 border border-slate-50 flex flex-col">
                  <p className="text-sm text-primary/80 leading-relaxed mb-4">
                    El Radar Político es un test de posicionamiento ideológico basado en los programas electorales de PP, PSOE, VOX, SUMAR, PODEMOS y Ciudadanos.
                  </p>
                  <ul className="space-y-2 mb-6 text-sm text-primary/70">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">✓</span>
                      <span>20 preguntas sobre economía, territorio, vivienda, inmigración, derechos y más.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">✓</span>
                      <span>Duración aproximada: 5 minutos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">✓</span>
                      <span>Respuestas anónimas: no guardamos quién eres, solo la afinidad con cada partido.</span>
                    </li>
                  </ul>

                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[11px] font-semibold text-primary/60">PROGRESO</span>
                      <span className="text-[11px] font-bold text-primary">0 de {total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={startTest}
                    className="w-full h-12 rounded-xl bg-secondary text-[13px] font-bold text-primary shadow-md hover:brightness-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Empezar el test</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isFinished && !isLanding && current && (

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
                <Button onClick={shareOnTwitter} className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white">
                  <Twitter className="mr-2 h-4 w-4" /> Compartir en X
                </Button>
              </div>
            </div>
    </Layout>
  );
}
