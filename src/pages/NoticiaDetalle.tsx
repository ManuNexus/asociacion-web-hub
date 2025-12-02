import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
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

  return (
    <Layout>
      <article className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/noticias")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a noticias
        </Button>

        {noticia.imagen_url && (
          <img
            src={noticia.imagen_url}
            alt={noticia.titulo}
            className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"
          />
        )}

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {noticia.titulo}
          </h1>
          {noticia.fecha_publicacion && (
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <time>
                {format(new Date(noticia.fecha_publicacion), "d 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
              </time>
            </div>
          )}
        </header>

        {noticia.extracto && (
          <p className="text-lg text-muted-foreground mb-6 font-medium">
            {noticia.extracto}
          </p>
        )}

        {noticia.contenido && (
          <div className="prose prose-lg max-w-none">
            {noticia.contenido.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-4 text-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </article>
    </Layout>
  );
};

export default NoticiaDetalle;