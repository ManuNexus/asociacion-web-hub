import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Calendar, User, Clock, Share2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import logoIcon from "@/assets/logo-ahora-icon.png";

interface Noticia {
  id: string;
  titulo: string;
  extracto: string | null;
  contenido: string | null;
  imagen_url: string | null;
  fecha_publicacion: string | null;
}

const NoticiaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchNoticia = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("noticias")
        .select("id, titulo, extracto, contenido, imagen_url, fecha_publicacion")
        .eq("id", id)
        .eq("publicada", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setNoticia(data);
      }
      setLoading(false);
    };

    fetchNoticia();
  }, [id]);

  // Estimate reading time (average 200 words per minute)
  const getReadingTime = (text: string | null) => {
    if (!text) return 1;
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const handleShare = async () => {
    if (navigator.share && noticia) {
      try {
        await navigator.share({
          title: noticia.titulo,
          text: noticia.extracto || "",
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (notFound || !noticia) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Noticia no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            La noticia que buscas no existe o no está disponible.
          </p>
          <Button onClick={() => navigate("/noticias")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a noticias
          </Button>
        </div>
      </Layout>
    );
  }

  const readingTime = getReadingTime(noticia.contenido);

  return (
    <Layout>
      {/* Hero Image */}
      {noticia.imagen_url && (
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
          <img
            src={noticia.imagen_url}
            alt={noticia.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      <article className={`container max-w-4xl ${noticia.imagen_url ? '-mt-24 relative z-10' : 'pt-8'}`}>
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/noticias")}
          className="mb-6 bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a noticias
        </Button>

        {/* Article Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {/* Header */}
          <header className="p-6 md:p-10">
            {/* Category Tag */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Actualidad
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
              {noticia.titulo}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  <img src={logoIcon} alt="AHORA" className="w-5 h-5 object-contain" />
                </div>
                <span className="font-medium text-foreground">AHORA</span>
              </div>

              {/* Separator */}
              <span className="hidden md:block w-1 h-1 bg-muted-foreground/50 rounded-full"></span>

              {/* Date */}
              {noticia.fecha_publicacion && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <time>
                    {format(new Date(noticia.fecha_publicacion), "d 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </time>
                </div>
              )}

              {/* Separator */}
              <span className="hidden md:block w-1 h-1 bg-muted-foreground/50 rounded-full"></span>

              {/* Reading Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{readingTime} min de lectura</span>
              </div>

              {/* Share Button */}
              {typeof navigator.share !== 'undefined' && (
                <>
                  <span className="hidden md:block w-1 h-1 bg-muted-foreground/50 rounded-full"></span>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Compartir</span>
                  </button>
                </>
              )}
            </div>
          </header>

          {/* Extracto with visual separator */}
          {noticia.extracto && (
            <div className="px-6 md:px-10">
              <div className="relative py-6 border-y border-border">
                {/* Decorative quote */}
                <div className="absolute -top-3 left-0 text-6xl text-primary/20 font-serif leading-none">"</div>
                <p className="text-lg md:text-xl text-muted-foreground font-medium italic leading-relaxed pl-8">
                  {noticia.extracto}
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          {noticia.contenido && (
            <div className="p-6 md:p-10 pt-8">
              <div className="prose prose-lg max-w-none">
                {noticia.contenido.split("\n").map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-5 text-foreground/90 leading-relaxed text-base md:text-lg">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>

              {/* Footer decoration */}
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={logoIcon} alt="AHORA" className="w-10 h-10 object-contain opacity-50" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Asociación AHORA</p>
                      <p>Actuar en el presente para construir el futuro</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/noticias")}
                  >
                    Más noticias
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom spacing */}
        <div className="h-16"></div>
      </article>
    </Layout>
  );
};

export default NoticiaDetalle;
