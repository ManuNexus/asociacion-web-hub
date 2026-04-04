import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Download, ExternalLink, Calendar, MapPin, Search, ChevronLeft, ChevronRight, Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SemaforoCharts } from "@/components/semaforo/SemaforoCharts";
import { CiviSummary } from "@/components/semaforo/CiviSummary";

type Gravedad = "rojo" | "ambar" | "verde";
type Ambito = "local" | "autonomico" | "nacional";

interface Caso {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  gravedad: Gravedad;
  ambito: string;
  fuente_url: string | null;
}

const GRAVEDAD_CONFIG: Record<Gravedad, { label: string; icon: typeof Shield; color: string; bg: string; bgSolid: string; border: string; dot: string; ring: string }> = {
  rojo: { label: "Condena / Delito", icon: Shield, color: "text-red-700", bg: "bg-red-50", bgSolid: "bg-red-500", border: "border-red-200", dot: "bg-red-500", ring: "ring-red-200" },
  ambar: { label: "Bajo Investigación", icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50", bgSolid: "bg-amber-500", border: "border-amber-200", dot: "bg-amber-500", ring: "ring-amber-200" },
  verde: { label: "Buena Práctica", icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50", bgSolid: "bg-emerald-500", border: "border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-200" },
};

const AMBITO_LABELS: Record<Ambito, string> = {
  local: "Local",
  autonomico: "Autonómico",
  nacional: "Nacional",
};

const ITEMS_PER_PAGE = 12;

function getYearsFromCases(cases: Caso[]) {
  const years = new Set<string>();
  cases.forEach((c) => years.add(format(parseISO(c.fecha), "yyyy")));
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export default function SemaforoInstitucional() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedAmbito, setSelectedAmbito] = useState<Ambito | null>(null);
  const [selectedGravedad, setSelectedGravedad] = useState<Gravedad | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
  const currentYear = years[0] || new Date().getFullYear().toString();

  const totalCounts = useMemo(() => ({
    rojo: casos.filter((c) => c.gravedad === "rojo").length,
    ambar: casos.filter((c) => c.gravedad === "ambar").length,
    verde: casos.filter((c) => c.gravedad === "verde").length,
  }), [casos]);

  const filteredCases = useMemo(() => {
    let result = casos;
    if (selectedYear) result = result.filter((c) => format(parseISO(c.fecha), "yyyy") === selectedYear);
    if (selectedAmbito) result = result.filter((c) => c.ambito === selectedAmbito);
    if (selectedGravedad) result = result.filter((c) => c.gravedad === selectedGravedad);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => c.titulo.toLowerCase().includes(q) || (c.descripcion && c.descripcion.toLowerCase().includes(q)));
    }
    return result;
  }, [casos, selectedYear, selectedAmbito, selectedGravedad, searchQuery]);

  const filteredCount = filteredCases.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedCases = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredCases.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCases, safePage]);

  const handleFilterChange = (setter: (v: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

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

        {/* Explicación */}
        <section className="border-b border-border">
          <div className="container py-12">
            <div className="flex items-start gap-3 mb-6">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-foreground">¿Qué es el Semáforo Institucional?</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  Es un sistema de vigilancia ciudadana que clasifica la actuación de las instituciones públicas en tres niveles según su gravedad. Permite a cualquier persona consultar de forma transparente los casos detectados y fomentar la rendición de cuentas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["rojo", "ambar", "verde"] as Gravedad[]).map((g) => {
                const config = GRAVEDAD_CONFIG[g];
                const Icon = config.icon;
                const isActive = selectedGravedad === g;
                return (
                  <button
                    key={g}
                    onClick={() => handleFilterChange(setSelectedGravedad, isActive ? null : g)}
                    className={`relative border rounded-xl p-6 text-left transition-all hover:shadow-card group ${
                      isActive ? `${config.border} ${config.bg} ring-2 ${config.ring}` : "border-border hover:border-muted-foreground/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{config.label}</span>
                    </div>
                    <p className={`text-4xl font-extrabold tracking-tight ${config.color}`}>{totalCounts[g]}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {isActive ? "Clic para quitar filtro" : "Clic para filtrar"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* CIVI AI Analysis + Charts */}
        {casos.length > 0 && (
          <section className="border-b border-border">
            <div className="container py-12 space-y-8">
              <CiviSummary year={currentYear} />
              <SemaforoCharts casos={casos} />
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="border-b border-border bg-muted/30">
          <div className="container py-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <Select value={selectedYear || "all"} onValueChange={(v) => handleFilterChange(setSelectedYear, v === "all" ? null : v)}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los años</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedAmbito || "all"} onValueChange={(v) => handleFilterChange(setSelectedAmbito, v === "all" ? null : v as Ambito)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Ámbito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ámbitos</SelectItem>
                  {(Object.keys(AMBITO_LABELS) as Ambito[]).map((key) => (
                    <SelectItem key={key} value={key}>{AMBITO_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {informe && (
                <a href={informe.archivo_url} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0">
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <Download className="h-3.5 w-3.5" />
                    Informe
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Results count */}
        <div className="container pt-8 pb-2">
          <p className="text-sm text-muted-foreground">
            {filteredCount === casos.length ? `${filteredCount} casos registrados` : `${filteredCount} de ${casos.length} casos`}
          </p>
        </div>

        {/* Cases Feed */}
        <section className="container pb-12">
          {paginatedCases.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Search className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground font-medium">No hay casos para estos filtros</p>
              <p className="text-sm text-muted-foreground/70">Prueba a cambiar los criterios de búsqueda</p>
            </div>
          ) : (
            <div className="grid gap-4 mt-4">
              {paginatedCases.map((caso) => {
                const config = GRAVEDAD_CONFIG[caso.gravedad];
                const Icon = config.icon;
                return (
                  <article key={caso.id} className={`group relative border rounded-xl p-5 md:p-6 transition-all hover:shadow-card ${config.border} ${config.bg}/40`}>
                    <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${config.bgSolid}`} />
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 pl-4">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-foreground leading-snug">{caso.titulo}</h3>
                        {caso.descripcion && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">{caso.descripcion}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(parseISO(caso.fecha), "d MMM yyyy", { locale: es })}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                            <MapPin className="h-3 w-3" />
                            {AMBITO_LABELS[caso.ambito as Ambito] || caso.ambito}
                          </span>
                          {caso.fuente_url && (
                            <a href={caso.fuente_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-foreground/70 hover:text-foreground transition-colors">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button variant="outline" size="icon" disabled={safePage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button key={page} variant={page === safePage ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(page)} className="w-9 h-9">
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="icon" disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
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

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
        active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  );
}
