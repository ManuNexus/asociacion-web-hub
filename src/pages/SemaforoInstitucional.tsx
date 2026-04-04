import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Download, ExternalLink, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type Gravedad = "rojo" | "ambar" | "verde";

interface Caso {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  gravedad: Gravedad;
  ambito: string;
  fuente_url: string | null;
}

const GRAVEDAD_CONFIG: Record<Gravedad, { label: string; color: string; bg: string; border: string; dot: string }> = {
  rojo: {
    label: "Alerta de Integridad",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  ambar: {
    label: "Riesgo Institucional",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  verde: {
    label: "Estándar de Calidad",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

function getYearsFromCases(cases: Caso[]) {
  const years = new Set<string>();
  cases.forEach((c) => {
    years.add(format(parseISO(c.fecha), "yyyy"));
  });
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export default function SemaforoInstitucional() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const { data: casos = [] } = useQuery({
    queryKey: ["casos-semaforo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("casos_semaforo")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data as Caso[];
    },
  });

  const { data: informe } = useQuery({
    queryKey: ["informe-trimestral"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("informe_trimestral")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const years = useMemo(() => getYearsFromCases(casos), [casos]);

  const filteredCases = useMemo(() => {
    if (!selectedYear) return casos;
    return casos.filter((c) => format(parseISO(c.fecha), "yyyy") === selectedYear);
  }, [casos, selectedYear]);

  const counts = useMemo(() => {
    const source = filteredCases;
    return {
      rojo: source.filter((c) => c.gravedad === "rojo").length,
      ambar: source.filter((c) => c.gravedad === "ambar").length,
      verde: source.filter((c) => c.gravedad === "verde").length,
    };
  }, [filteredCases]);

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-hero relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-secondary/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-secondary/20 blur-3xl" />
          </div>
          <div className="container relative py-16 md:py-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary-foreground max-w-3xl leading-[1.1]">
              Semáforo Institucional
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/70 max-w-2xl leading-relaxed">
              Monitorización en tiempo real de la integridad pública. Condenas, alertas de gestión y buenas prácticas institucionales.
            </p>
          </div>
          <div className="h-1 bg-secondary" />
        </section>

        {/* Counters */}
        <section className="border-b border-border">
          <div className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CounterCard
                count={counts.rojo}
                label="Alerta de Integridad"
                sublabel="Casos de corrupción"
                dotColor="bg-red-500"
                textColor="text-red-600"
              />
              <CounterCard
                count={counts.ambar}
                label="Riesgo Institucional"
                sublabel="Irregularidades en gestión"
                dotColor="bg-amber-500"
                textColor="text-amber-600"
              />
              <CounterCard
                count={counts.verde}
                label="Estándar de Calidad"
                sublabel="Entidades reconocidas"
                dotColor="bg-emerald-500"
                textColor="text-emerald-600"
              />
            </div>
          </div>
        </section>

        {/* Filter + Download */}
        <section className="border-b border-border">
          <div className="container py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedYear(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    selectedYear === null
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Todos
                </button>
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      selectedYear === year
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
              {informe && (
                <a
                  href={informe.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Informe Trimestral
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Cases Feed */}
        <section className="container py-12">
          {filteredCases.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              No hay casos registrados para este periodo.
            </p>
          ) : (
            <div className="grid gap-4">
              {filteredCases.map((caso) => {
                const config = GRAVEDAD_CONFIG[caso.gravedad];
                return (
                  <article
                    key={caso.id}
                    className={`group relative border rounded-xl p-6 transition-all hover:shadow-card ${config.border} ${config.bg}/30`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`h-3 w-3 rounded-full ${config.dot}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-foreground leading-snug">
                          {caso.titulo}
                        </h3>
                        {caso.descripcion && (
                          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                            {caso.descripcion}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(parseISO(caso.fecha), "d MMM yyyy", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {caso.ambito === "nacional" ? "Nacional" : "Local"}
                          </span>
                          {caso.fuente_url && (
                            <a
                              href={caso.fuente_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-foreground/70 hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Ver fuente
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <section className="border-t border-border">
          <div className="container py-10">
            <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
              ⚠️ Este sistema de monitorización es completamente autónomo y puede contener errores o imprecisiones. La asociación revisa semanalmente la información publicada para garantizar su veracidad y corregir cualquier dato incorrecto.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function CounterCard({
  count,
  label,
  sublabel,
  dotColor,
  textColor,
}: {
  count: number;
  label: string;
  sublabel: string;
  dotColor: string;
  textColor: string;
}) {
  return (
    <div className="border border-border rounded-xl p-8 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`text-5xl font-extrabold tracking-tight ${textColor}`}>
        {count}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{sublabel}</p>
    </div>
  );
}
