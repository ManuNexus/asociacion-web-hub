import { useState, useMemo, useRef, useCallback, useEffect, FormEvent } from "react";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInMadrid } from "@/lib/timezone";
import { Download, ExternalLink, Calendar, MapPin, Search, ChevronLeft, ChevronRight, Shield, AlertTriangle, CheckCircle, Info, Brain, List, BarChart3, Mail, Loader2, X, Heart, Users, HandHeart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SemaforoCharts } from "@/components/semaforo/SemaforoCharts";
import { CiviSummary } from "@/components/semaforo/CiviSummary";
import { SEO, breadcrumbSchema } from "@/components/SEO";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
  updated_at: string;
}

const GRAVEDAD_CONFIG: Record<Gravedad, { label: string; icon: typeof Shield; color: string; bg: string; bgSolid: string; border: string; dot: string; ring: string }> = {
  rojo: { label: "Alerta de Integridad", icon: Shield, color: "text-red-700", bg: "bg-red-50", bgSolid: "bg-red-500", border: "border-red-200", dot: "bg-red-500", ring: "ring-red-200" },
  ambar: { label: "Riesgo Institucional", icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50", bgSolid: "bg-amber-500", border: "border-amber-200", dot: "bg-amber-500", ring: "ring-amber-200" },
  verde: { label: "Estándar de Calidad", icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50", bgSolid: "bg-emerald-500", border: "border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-200" },
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
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const casesRef = useRef<HTMLDivElement>(null);
  const civiRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  // Show newsletter popup after 3s, once per session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("semaforo-newsletter-dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setNewsletterOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const scrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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

  const totalCounts = useMemo(() => ({
    rojo: casos.filter((c) => c.gravedad === "rojo").length,
    ambar: casos.filter((c) => c.gravedad === "ambar").length,
    verde: casos.filter((c) => c.gravedad === "verde").length,
  }), [casos]);

  const lastUpdated = useMemo(() => {
    if (casos.length === 0) return null;
    const latest = casos.reduce((a, b) => (a.updated_at > b.updated_at ? a : b));
    return formatInMadrid(latest.updated_at, "dd/MM/yyyy 'a las' HH:mm");
  }, [casos]);

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

  const handleGravedadClick = (g: Gravedad) => {
    const isActive = selectedGravedad === g;
    handleFilterChange(setSelectedGravedad, isActive ? null : g);
    setTimeout(() => scrollTo(casesRef), 100);
  };

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_semaforo")
        .insert({ email: newsletterEmail.trim().toLowerCase(), nombre: newsletterName.trim() || null });
      if (error) {
        if (error.code === "23505") {
          toast.info("Este correo ya está suscrito al informe trimestral.");
          setNewsletterSuccess(true);
        } else {
          throw error;
        }
      } else {
        setNewsletterSuccess(true);
      }
      setNewsletterEmail("");
      setNewsletterName("");
    } catch {
      toast.error("No se pudo completar la suscripción. Inténtalo de nuevo.");
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleNewsletterClose = () => {
    setNewsletterOpen(false);
    setNewsletterSuccess(false);
    sessionStorage.setItem("semaforo-newsletter-dismissed", "1");
  };

  return (
    <Layout>
      <SEO
        title="Semáforo Institucional — Observatorio de Integridad Pública"
        description="Sistema de vigilancia ciudadana que monitoriza la integridad de las instituciones públicas en España. Alertas, investigaciones y buenas prácticas."
        canonical="/semaforo-institucional"
        jsonLd={breadcrumbSchema([
          { name: "Inicio", url: "/" },
          { name: "Semáforo Institucional", url: "/semaforo-institucional" },
        ])}
      />
      <div className="min-h-screen bg-background">
        <section className="bg-hero relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-secondary/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-secondary/20 blur-3xl" />
          </div>
          <div className="container relative py-8 md:py-24">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary-foreground max-w-3xl leading-[1.1]">
              Semáforo Institucional
            </h1>
            <p className="hidden md:block mt-4 text-lg text-primary-foreground/70 max-w-2xl leading-relaxed">
              Monitorización en tiempo real de la integridad pública. Condenas, alertas de gestión y buenas prácticas institucionales.
            </p>
            {/* Quick nav buttons */}
            <div className="flex flex-wrap gap-2 mt-4 md:mt-6">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => scrollTo(civiRef)}
              >
                <Brain className="h-3.5 w-3.5" />
                Análisis IA
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => scrollTo(chartsRef)}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Radiografía
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => scrollTo(casesRef)}
              >
                <List className="h-3.5 w-3.5" />
                Alertas
              </Button>
            </div>
          </div>
          <div className="h-1 bg-secondary" />
        </section>

        {/* Explicación + counters */}
        <section className="border-b border-border">
          <div className="container py-8 md:py-12">
            <div className="flex items-start gap-3 mb-4 md:mb-6">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h2 className="text-base md:text-lg font-bold text-foreground">¿Qué es el Semáforo Institucional?</h2>
                <p className="mt-1 text-xs md:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  Sistema de vigilancia ciudadana que clasifica la actuación de las instituciones públicas en tres niveles según su gravedad.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {(["rojo", "ambar", "verde"] as Gravedad[]).map((g) => {
                const config = GRAVEDAD_CONFIG[g];
                const Icon = config.icon;
                const isActive = selectedGravedad === g;
                return (
                  <button
                    key={g}
                    onClick={() => handleGravedadClick(g)}
                    className={`relative border rounded-xl p-3 md:p-6 text-left transition-all hover:shadow-card group ${
                      isActive ? `${config.border} ${config.bg} ring-2 ${config.ring}` : "border-border hover:border-muted-foreground/20"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 md:gap-3 mb-1 md:mb-3">
                      <div className={`p-1 md:p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`h-3.5 w-3.5 md:h-5 md:w-5 ${config.color}`} />
                      </div>
                      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">{config.label}</span>
                    </div>
                    <p className={`text-2xl md:text-4xl font-extrabold tracking-tight ${config.color}`}>{totalCounts[g]}</p>
                    <span className="text-[10px] md:text-xs text-muted-foreground mt-0.5 block truncate">
                      <span className="hidden sm:inline">{isActive ? "Quitar filtro" : "Filtrar"}</span>
                      <span className="sm:hidden">{config.label.split(" ")[0]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {lastUpdated && (
              <p className="mt-3 text-[11px] text-muted-foreground/60 text-right">
                Última actualización: {lastUpdated}
              </p>
            )}
          </div>
        </section>

        {/* CIVI AI Analysis + Charts */}
        {casos.length > 0 && (
          <>
            <section ref={civiRef} className="border-b border-border scroll-mt-16">
              <div className="container py-8 md:py-12">
                <CiviSummary />
              </div>
            </section>
            <section ref={chartsRef} className="border-b border-border scroll-mt-16">
              <div className="container py-8 md:py-12">
                <SemaforoCharts casos={casos} />
              </div>
            </section>
          </>
        )}

        {/* Filters */}
        <div ref={casesRef} className="scroll-mt-16">
          <section className="border-b border-border bg-muted/30">
            <div className="container py-3 md:py-5">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="relative flex-1 min-w-[140px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                    className="pl-10 h-9 text-sm"
                  />
                </div>
                <Select value={selectedYear || "all"} onValueChange={(v) => handleFilterChange(setSelectedYear, v === "all" ? null : v)}>
                  <SelectTrigger className="w-[100px] md:w-[120px] h-9 text-xs md:text-sm">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedAmbito || "all"} onValueChange={(v) => handleFilterChange(setSelectedAmbito, v === "all" ? null : v as Ambito)}>
                  <SelectTrigger className="w-[110px] md:w-[140px] h-9 text-xs md:text-sm">
                    <SelectValue placeholder="Ámbito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(Object.keys(AMBITO_LABELS) as Ambito[]).map((key) => (
                      <SelectItem key={key} value={key}>{AMBITO_LABELS[key]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {informe && (
                  <a href={informe.archivo_url} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0">
                    <Button variant="outline" size="sm" className="gap-2 h-9">
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Informe</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Results count */}
          <div className="container pt-6 md:pt-8 pb-2">
            <p className="text-xs md:text-sm text-muted-foreground">
              {filteredCount === casos.length ? `${filteredCount} alertas registradas` : `${filteredCount} de ${casos.length} alertas`}
            </p>
          </div>

          {/* Cases Feed */}
          <section className="container pb-12">
            {paginatedCases.length === 0 ? (
              <div className="text-center py-12 md:py-16 space-y-2">
                <Search className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground font-medium text-sm">No hay alertas para estos filtros</p>
                <p className="text-xs text-muted-foreground/70">Prueba a cambiar los criterios de búsqueda</p>
              </div>
            ) : (
              <div className="grid gap-3 md:gap-4 mt-3 md:mt-4">
                {paginatedCases.map((caso) => {
                  const config = GRAVEDAD_CONFIG[caso.gravedad];
                  const Icon = config.icon;
                  return (
                    <article key={caso.id} className={`group relative border rounded-xl p-4 md:p-6 transition-all hover:shadow-card ${config.border} ${config.bg}/40`}>
                      <div className={`absolute left-0 top-3 bottom-3 md:top-4 md:bottom-4 w-1 rounded-full ${config.bgSolid}`} />
                      <div className="flex flex-col gap-2 md:gap-4 pl-3 md:pl-4">
                        <div className="flex items-center gap-2 shrink-0">
                          <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${config.color}`} />
                          <span className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base font-semibold text-foreground leading-snug">{caso.titulo}</h3>
                          {caso.descripcion && <p className="mt-1 text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">{caso.descripcion}</p>}
                          <div className="mt-2 md:mt-3 flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(caso.fecha), "d MMM yyyy", { locale: es })}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              {AMBITO_LABELS[caso.ambito as Ambito] || caso.ambito}
                            </span>
                            {caso.fuente_url && (
                              <a href={caso.fuente_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-foreground/70 hover:text-foreground transition-colors">
                                <ExternalLink className="h-3 w-3" />
                                Fuente
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
              <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-8 md:mt-10">
                <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" disabled={safePage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button key={page} variant={page === safePage ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(page)} className="w-8 h-8 md:w-9 md:h-9 text-xs">
                    {page}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* Newsletter Popup */}
        <Dialog open={newsletterOpen} onOpenChange={(open) => { if (!open) handleNewsletterClose(); }}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            {!newsletterSuccess ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-2">Informe Trimestral</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Recibe en tu correo el informe trimestral del Semáforo Institucional con el análisis completo de alertas y tendencias.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Tu nombre (opcional)"
                    value={newsletterName}
                    onChange={(e) => setNewsletterName(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={newsletterLoading} className="w-full">
                    {newsletterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suscribirme"}
                  </Button>
                </form>
                <p className="text-[10px] text-muted-foreground mt-3">
                  Sin spam. Solo informes trimestrales. Puedes darte de baja en cualquier momento.
                </p>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-2">¡Suscripción completada!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Recibirás el próximo informe trimestral en tu correo. Mientras tanto, si quieres ayudarnos a seguir realizando acciones como el Semáforo Institucional, puedes:
                </p>
                <div className="grid gap-3">
                  <Link to="/hazte-socio" onClick={handleNewsletterClose}>
                    <Button variant="default" className="w-full gap-2">
                      <Users className="h-4 w-4" /> Hazte Socio
                    </Button>
                  </Link>
                  <Link to="/hazte-amigo" onClick={handleNewsletterClose}>
                    <Button variant="outline" className="w-full gap-2">
                      <Heart className="h-4 w-4" /> Hazte Amigo
                    </Button>
                  </Link>
                  <Link to="/dona" onClick={handleNewsletterClose}>
                    <Button variant="outline" className="w-full gap-2">
                      <HandHeart className="h-4 w-4" /> Haz una donación
                    </Button>
                  </Link>
                </div>
                <button
                  onClick={handleNewsletterClose}
                  className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Quizás más tarde
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Disclaimer */}
        <section className="border-t border-border">
          <div className="container py-6 md:py-10">
            <p className="text-[10px] md:text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
              ⚠️ Este sistema de monitorización es completamente autónomo y puede contener errores o imprecisiones. La asociación revisa semanalmente la información publicada para garantizar su veracidad y corregir cualquier dato incorrecto.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
