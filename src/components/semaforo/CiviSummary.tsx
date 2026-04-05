import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatInMadrid } from "@/lib/timezone";

export function CiviSummary() {
  const contexto = "semaforo_all";

  const { data, isLoading, error } = useQuery({
    queryKey: ["civi-summary", contexto],
    queryFn: async () => {
      const res = await supabase.functions.invoke("civi-summary", {
        body: { contexto },
      });

      if (res.error) throw new Error(res.error.message || "Error al generar el análisis");

      const result = res.data;
      if (result?.error) throw new Error(result.error);
      if (result?.empty) return null;

      return result as { contenido: string; cached: boolean; cached_at?: string };
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  return (
    <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] via-background to-primary/[0.06] overflow-hidden shadow-sm">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Sparkles className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wide text-foreground">CIVI</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
              IA
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Inteligencia Cívica · Análisis global
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 pt-2">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <div className="relative">
              <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
              <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-primary/10" />
            </div>
            <span className="text-sm">CIVI está analizando los datos...</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive py-6 text-center bg-destructive/5 rounded-lg">
            No se pudo generar el análisis. {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && data === null && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay suficientes datos para generar un análisis de {year}.
          </p>
        )}

        {!isLoading && !error && data?.contenido && (
          <div className="prose prose-sm max-w-none text-foreground/90 prose-headings:text-foreground prose-headings:font-bold prose-headings:text-base prose-strong:text-foreground prose-p:leading-relaxed prose-ul:mt-1 prose-li:mt-0.5">
            <ReactMarkdown>{data.contenido}</ReactMarkdown>
          </div>
        )}

        {data?.cached && (
          <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-border/50">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
            <p className="text-[11px] text-muted-foreground/60">
              Análisis en caché
              {data.cached_at && ` · Actualizado el ${formatInMadrid(data.cached_at, "d 'de' MMMM 'a las' HH:mm")}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
