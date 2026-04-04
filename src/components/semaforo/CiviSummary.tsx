import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bot } from "lucide-react";

import ReactMarkdown from "react-markdown";

interface CiviSummaryProps {
  year: string;
}

export function CiviSummary({ year }: CiviSummaryProps) {
  const contexto = `semaforo_${year}`;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["civi-summary", contexto],
    queryFn: async () => {
      const res = await supabase.functions.invoke("civi-summary", {
        body: { contexto },
      });

      if (res.error) throw new Error(res.error.message || "Error al generar el análisis");

      const result = res.data;
      if (result?.error) throw new Error(result.error);
      if (result?.empty) return null;

      return result as { contenido: string; cached: boolean };
    },
    staleTime: 1000 * 60 * 30, // 30 min client cache
    retry: 1,
  });

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">CIVI</span>
            <span className="text-xs text-muted-foreground ml-2">Inteligencia Cívica · Análisis {year}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isLoading && (
          <div className="flex items-center gap-3 py-6 justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">CIVI está analizando los datos...</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive py-4 text-center">
            No se pudo generar el análisis. {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && data === null && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay suficientes datos para generar un análisis de {year}.
          </p>
        )}

        {!isLoading && !error && data?.contenido && (
          <div className="prose prose-sm max-w-none text-foreground/90 prose-headings:text-foreground prose-strong:text-foreground">
            <ReactMarkdown>{data.contenido}</ReactMarkdown>
          </div>
        )}

        {data?.cached && (
          <p className="text-[11px] text-muted-foreground/60 mt-4 text-right">
            Análisis en caché · Se actualiza cada 24h
          </p>
        )}
      </div>
    </div>
  );
}
