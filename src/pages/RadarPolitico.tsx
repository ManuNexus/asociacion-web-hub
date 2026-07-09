import { useState, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SEO } from "@/components/SEO";
import { Download, Share2, RotateCcw } from "lucide-react";
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
  // Posición en el eje bidimensional (-2 a +2)
  // x: económico (-2 progresista/izquierda ↔ +2 conservador/derecha)
  // y: social (-2 progresista ↔ +2 conservador)
  axis: { x: number; y: number };
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
  // puntuación oficial 1-5 por partido
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

const OPTIONS = [
  { value: 1, label: "Totalmente en desacuerdo" },
  { value: 2, label: "En desacuerdo" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "De acuerdo" },
  { value: 5, label: "Totalmente de acuerdo" },
];

// ============ COMPONENTE ============
export default function RadarPolitico() {
  const [step, setStep] = useState(0); // 0..QUESTIONS.length; length = resultados
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const resultsRef = useRef<HTMLDivElement>(null);

  const total = QUESTIONS.length;
  const isFinished = step >= total;

  const handleAnswer = (value: number) => {
    const q = QUESTIONS[step];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setTimeout(() => setStep((s) => s + 1), 180);
  };

  const results = useMemo(() => {
    if (!isFinished) return [];
    const maxDiff = 4 * QUESTIONS.length; // diferencia máxima por pregunta = 4
    return PARTIES.map((p) => {
      const sumDiff = QUESTIONS.reduce((acc, q) => {
        const user = answers[q.id] ?? 3;
        return acc + Math.abs(user - q.scores[p.id]);
      }, 0);
      const affinity = Math.round(100 * (1 - sumDiff / maxDiff));
      return { ...p, affinity };
    }).sort((a, b) => b.affinity - a.affinity);
  }, [isFinished, answers]);

  // Posición del usuario en el eje bidimensional a partir de las respuestas
  const userAxis = useMemo(() => {
    if (!isFinished) return { x: 0, y: 0 };
    // Estimamos posición del usuario como promedio ponderado de posiciones de partidos por afinidad
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
    const canvas = await html2canvas(resultsRef.current, { backgroundColor: "#ffffff", scale: 2 });
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
      <SEO
        title="Radar Político — AHORA"
        description="Herramienta interna en pruebas"
        noIndex
      />
      <div className="container max-w-3xl py-8 md:py-12">
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Entorno de pruebas interno · Datos provisionales
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Radar Político</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Descubre con qué partido tienes mayor afinidad respondiendo unas preguntas.
          </p>
        </div>

        {!isFinished && (
          <>
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Pregunta {step + 1} de {total}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card key={QUESTIONS[step].id} className="p-6 md:p-8 animate-fade-in">
              <div className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
                {QUESTIONS[step].category}
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-primary mb-6">
                {QUESTIONS[step].text}
              </h2>
              <div className="flex flex-col gap-2">
                {OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => handleAnswer(o.value)}
                    className="w-full text-left rounded-md border border-border px-4 py-3 text-sm transition-all hover:border-secondary hover:bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Card>

            {step > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="text-xs text-muted-foreground hover:text-primary underline"
                >
                  ← Volver a la pregunta anterior
                </button>
              </div>
            )}
          </>
        )}

        {isFinished && (
          <div className="animate-fade-in">
            <div ref={resultsRef} className="bg-background p-4 md:p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-primary mb-1">Tus resultados</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Afinidad calculada sobre {total} preguntas.
              </p>

              {/* Ranking de barras */}
              <div className="mb-8" style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={results} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={90} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="affinity" radius={[0, 6, 6, 0]}>
                      {results.map((r) => (
                        <Cell key={r.id} fill={r.color} />
                      ))}
                      <LabelList dataKey="affinity" position="right" formatter={(v: number) => `${v}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Eje bidimensional */}
              <h3 className="text-lg font-semibold text-primary mb-2">Mapa ideológico</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Eje horizontal: Progresista ← → Conservador · Eje vertical: Social
              </p>
              <div style={{ width: "100%", height: 360 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[-2.2, 2.2]}
                      tick={{ fontSize: 10 }}
                      label={{ value: "Progresista ← → Conservador", position: "insideBottom", offset: -5, fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      domain={[-2.2, 2.2]}
                      tick={{ fontSize: 10 }}
                    />
                    <ZAxis type="number" range={[200, 200]} />
                    <ReferenceLine x={0} stroke="#94a3b8" />
                    <ReferenceLine y={0} stroke="#94a3b8" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter data={PARTIES.map((p) => ({ ...p, label: p.name }))}>
                      {PARTIES.map((p) => (
                        <Cell key={p.id} fill={p.color} />
                      ))}
                      <LabelList dataKey="label" position="top" style={{ fontSize: 10, fontWeight: 600 }} />
                    </Scatter>
                    <Scatter
                      data={[{ x: userAxis.x, y: userAxis.y, label: "Tú" }]}
                      shape="star"
                    >
                      <Cell fill="#EBAF0A" />
                      <LabelList dataKey="label" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#224172" }} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
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
    </Layout>
  );
}
