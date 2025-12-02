import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ChevronRight, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Noticia {
  id: string;
  titulo: string;
  extracto: string | null;
  contenido: string | null;
  imagen_url: string | null;
  fecha_publicacion: string | null;
}

const Noticias = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticias = async () => {
      const { data, error } = await supabase
        .from("noticias")
        .select("*")
        .order("fecha_publicacion", { ascending: false });

      if (error) {
        console.error("Error fetching noticias:", error);
      } else {
        setNoticias(data || []);
      }
      setLoading(false);
    };

    fetchNoticias();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Noticias
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Mantente informado sobre nuestras actividades, comunicados y novedades.
            </p>
          </div>
        </div>
      </section>

      {/* Noticias Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : noticias.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No hay noticias disponibles en este momento.
            </p>
          ) : (
            <div className="grid gap-8">
              {noticias.map((noticia, index) => (
                <article
                  key={noticia.id}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="grid md:grid-cols-[4px_1fr]">
                    <div className="bg-secondary hidden md:block" />
                    <div className="p-6 md:p-8">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <span className="px-3 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground rounded-full">
                          Institucional
                        </span>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(noticia.fecha_publicacion)}
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {noticia.titulo}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {noticia.extracto}
                      </p>
                      <Link
                        to={`/noticias/${noticia.id}`}
                        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Leer noticia completa
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Noticias;
