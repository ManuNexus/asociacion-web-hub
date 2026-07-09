import { useState, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Download, Share2, RotateCcw, ChevronRight, ChevronLeft } from "lucide-react";
import html2canvas from "html2canvas";
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

// ============ CONFIG (escalable) ============
type PartyId = "PP" | "PSOE" | "VOX" | "SUMAR" | "PODEMOS" | "CIUDADANOS";

interface Party {
  id: PartyId;
  name: string;
  color: string;
  axis: { x: number; y: number }; // x: prog(-)↔cons(+), y: prog(-)↔cons(+)
}

const PARTIES: Party[] = [
  { id: "PP", name: "PP", color: "#1D9BD1", axis: { x: 1.3, y: 1.2 } },
  { id: "PSOE", name: "PSOE", color: "#E30613", axis: { x: -0.8, y: -0.5 } },
  { id: "VOX", name: "VOX", color: "#63BE21", axis: { x: 1.6, y: 1.8 } },
  { id: "SUMAR", name: "SUMAR", color: "#D9377E", axis: { x: -1.5, y: -1.4 } },
  { id: "PODEMOS", name: "PODEMOS", color: "#6E236E", axis: { x: -1.7, y: -1.6 } },
  { id: "CIUDADANOS", name: "CIUDADANOS", color: "#EB6109", axis: { x: 0.9, y: 0.2 } },
];

interface Question {
  id: string;
  category: string;
  text: string;
  scores: Record<PartyId, number>;
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    category: "Economía",
    text: "Se deben reducir los impuestos directos a empresas y autónomos para estimular la economía.",
    scores: { PP: 5, VOX: 5, CIUDADANOS: 5, PSOE: 2, SUMAR: 1, PODEMOS: 1 },
  },
  {
    id: "q2",
    category: "Modelo Territorial",
    text: "Es necesario recentralizar competencias autonómicas como educación o sanidad para asegurar la homogeneidad.",
    scores: { VOX: 5, PP: 3, CIUDADANOS: 3, PSOE: 1, SUMAR: 1, PODEMOS: 1 },
  },
  {
    id: "q3",
    category: "Vivienda",
    text: "El Estado debe intervenir y regular el precio máximo del alquiler en las zonas declaradas tensionadas.",
    scores: { PODEMOS: 5, SUMAR: 5, PSOE: 4, CIUDADANOS: 1, PP: 1, VOX: 1 },
  },
  {
    id: "q4",
    category: "Energía y Transición",
    text: "Se debe prolongar la vida útil de las centrales nucleares actuales como energía de transición.",
    scores: { VOX: 5, PP: 5, CIUDADANOS: 4, PSOE: 2, SUMAR: 1, PODEMOS: 1 },
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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const resultsRef = useRef<HTMLDivElement>(null);

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
    if (!isFinished) return [];
    const maxDiff = 4 * QUESTIONS.length;
    return PARTIES.map((p) => {
      const sumDiff = QUESTIONS.reduce(
        (acc, q) => acc + Math.abs((answers[q.id] ?? 3) - q.scores[p.id]),
        0,
      );
      const affinity = Math.round(100 * (1 - sumDiff / maxDiff));
      return { ...p, affinity };
    }).sort((a, b) => b.affinity - a.affinity);
  }, [isFinished, answers]);

  const userAxis = useMemo(() => {
    if (!isFinished) return { x: 0, y: 0 };
    const weights = results.map((r) => Math.max(r.affinity, 0));
    const wSum = weights.reduce((a, b) => a + b, 0) || 1;
    const x = results.reduce((acc, r, i) => acc + r.axis.x * weights[i], 0) / wSum;
    const y = results.reduce((acc, r, i) => acc + r.axis.y * weights[i], 0) / wSum;
    return { x, y };
  }, [results, isFinished]);

  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  const downloadImage = async () => {
    if (!resultsRef.current) return;
    const canvas = await html2canvas(resultsRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = "radar-politico.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const shareResults = async () => {
    const top = results[0];
    const text = `Mi Radar Político: ${top.name} (${top.affinity}% afinidad)`;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Radar Político", text, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(`${text} — ${url}`);
      alert("Resultado copiado al portapapeles");
    }
  };

  const progress = isFinished ? 100 : (step / total) * 100;

  return (
    <Layout>
      <SEO title="Radar Político — AHORA" description="Herramienta interna en pruebas" noindex />

      <div className="bg-slate-100 min-h-[calc(100vh-4rem)] py-6 md:py-10">
        <div className="container max-w-xl">
          {/* Aviso interno */}
          <div className="mb-4 text-center">
            <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
              Entorno de pruebas interno · Datos provisionales
            </span>
          </div>

          {!isFinished && current && (
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white flex flex-col">
              {/* Hero */}
              <div className="bg-primary pt-8 pb-14 px-6 rounded-b-[2rem] relative">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-secondary text-[10px] font-bold tracking-widest uppercase">
                    Radar Político · {current.category}
                  </span>
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                  </div>
                </div>
                <h1
                  key={current.id}
                  className="text-primary-foreground text-lg md:text-2xl font-bold leading-tight animate-fade-in"
                >
                  {current.text}
                </h1>
              </div>

              {/* Card superpuesta */}
              <div className="px-5 -mt-8 z-10 flex flex-col pb-6">
                <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 p-6 border border-slate-50 flex flex-col">
                  {/* Progreso */}
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[11px] font-semibold text-primary/60">PROGRESO</span>
                      <span className="text-[11px] font-bold text-primary">
                        {step + 1} de {total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Likert Slider */}
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
                            <p
                              className={
                                "text-[9px] font-bold uppercase leading-tight whitespace-pre-line " +
                                (selected ? "text-primary" : "text-slate-400")
                              }
                            >
                              {opt.short}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Nav */}
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

          {isFinished && (
            <div className="animate-fade-in space-y-4">
              <div
                ref={resultsRef}
                className="bg-white rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white"
              >
                <div className="bg-primary pt-8 pb-10 px-6 rounded-b-[2rem]">
                  <span className="text-secondary text-[10px] font-bold tracking-widest uppercase">
                    Tus resultados
                  </span>
                  <h2 className="text-primary-foreground text-2xl md:text-3xl font-bold mt-1">
                    Mayor afinidad con{" "}
                    <span style={{ color: results[0].color }}>{results[0].name}</span>
                  </h2>
                  <p className="text-primary-foreground/70 text-sm mt-2">
                    {results[0].affinity}% de coincidencia · {total} preguntas
                  </p>
                </div>

                <div className="p-5 md:p-6 space-y-8">
                  {/* Ranking */}
                  <section>
                    <h3 className="text-[11px] font-bold text-primary/60 uppercase tracking-widest mb-3">
                      Ranking de afinidad
                    </h3>
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={results}
                          layout="vertical"
                          margin={{ left: 4, right: 44, top: 4, bottom: 4 }}
                        >
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={90}
                            tick={{ fontSize: 11, fontWeight: 700, fill: "#224172" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip formatter={(v: number) => `${v}%`} cursor={{ fill: "#f1f5f9" }} />
                          <Bar dataKey="affinity" radius={[0, 8, 8, 0]} barSize={22}>
                            {results.map((r) => (
                              <Cell key={r.id} fill={r.color} />
                            ))}
                            <LabelList
                              dataKey="affinity"
                              position="right"
                              formatter={(v: number) => `${v}%`}
                              style={{ fontSize: 11, fontWeight: 700, fill: "#224172" }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Mapa ideológico */}
                  <section>
                    <h3 className="text-[11px] font-bold text-primary/60 uppercase tracking-widest mb-1">
                      Mapa ideológico
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Progresista ← → Conservador
                    </p>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-2">
                      <div style={{ width: "100%", height: 320 }}>
                        <ResponsiveContainer>
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                            <XAxis
                              type="number"
                              dataKey="x"
                              domain={[-2.2, 2.2]}
                              tick={{ fontSize: 9, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="number"
                              dataKey="y"
                              domain={[-2.2, 2.2]}
                              tick={{ fontSize: 9, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <ZAxis type="number" range={[220, 220]} />
                            <ReferenceLine x={0} stroke="#cbd5e1" />
                            <ReferenceLine y={0} stroke="#cbd5e1" />
                            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                            <Scatter data={PARTIES.map((p) => ({ ...p, label: p.name }))}>
                              {PARTIES.map((p) => (
                                <Cell key={p.id} fill={p.color} />
                              ))}
                              <LabelList
                                dataKey="label"
                                position="top"
                                style={{ fontSize: 10, fontWeight: 700, fill: "#224172" }}
                              />
                            </Scatter>
                            <Scatter
                              data={[{ x: userAxis.x, y: userAxis.y, label: "Tú" }]}
                              shape="star"
                            >
                              <Cell fill="#EBAF0A" />
                              <LabelList
                                dataKey="label"
                                position="top"
                                style={{ fontSize: 12, fontWeight: 800, fill: "#224172" }}
                              />
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <Button onClick={reset} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar el Radar
                </Button>
                <Button onClick={downloadImage} variant="secondary">
                  <Download className="mr-2 h-4 w-4" /> Descargar imagen
                </Button>
                <Button onClick={shareResults}>
                  <Share2 className="mr-2 h-4 w-4" /> Compartir
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
