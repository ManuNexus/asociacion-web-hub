import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, FileText, Shield, ChevronRight, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-ahora-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const valores = [
  {
    icon: Shield,
    title: "Valores Constitucionales",
    description: "Defendemos la Constitución como marco de convivencia y garantía de derechos fundamentales.",
  },
  {
    icon: Users,
    title: "Pluralismo Ideológico",
    description: "Promovemos el respeto a la diversidad de ideas y el diálogo constructivo entre diferentes perspectivas.",
  },
  {
    icon: FileText,
    title: "Transparencia",
    description: "Nos comprometemos con la máxima transparencia en nuestra gestión y actividades.",
  },
];

interface Noticia {
  id: string;
  titulo: string;
  extracto: string | null;
  fecha_publicacion: string | null;
  imagen_url: string | null;
}

const Index = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticias = async () => {
      const { data, error } = await supabase
        .from("noticias")
        .select("id, titulo, extracto, fecha_publicacion, imagen_url")
        .order("fecha_publicacion", { ascending: false })
        .limit(3);

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
      {/* Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-ahora-yellow/5 blur-3xl" />
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-secondary/40 rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-secondary/30 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-secondary/40 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        
        {/* Yellow accent stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-secondary" />
        
        <div className="container relative z-10 py-12 md:py-0">
          <div className="flex flex-col items-center text-center">
            {/* Logo - visible and prominent on mobile */}
            <div className="mb-8 md:mb-10 animate-fade-in">
              <img 
                src={logoIcon} 
                alt="AHORA" 
                className="w-24 md:w-32 lg:w-40 drop-shadow-[0_0_30px_rgba(241,196,15,0.3)]" 
                fetchPriority="high"
              />
            </div>
            
            {/* Main content */}
            <div className="max-w-4xl animate-slide-up">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-primary-foreground leading-[1.1] mb-6">
                Actuar en el presente
                <span className="block mt-2 text-secondary">para construir el futuro</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-4">
                Somos una asociación civil que defiende los valores constitucionales, el pluralismo ideológico y los derechos fundamentales en España.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                <Button asChild variant="hero" size="xl" className="text-base md:text-lg px-8 py-6 shadow-lg shadow-secondary/20 hover:shadow-secondary/40 transition-shadow">
                  <Link to="/hazte-socio">
                    Únete a nosotros
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="hero-outline" size="xl" className="text-base md:text-lg px-8 py-6">
                  <Link to="/nosotros">Conoce más</Link>
                </Button>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Valores Section */}
      <div className="h-1 bg-secondary" />
      <section className="py-20 md:py-28 bg-muted/50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nuestros Valores
            </h2>
            <p className="text-lg text-muted-foreground">
              Los principios que guían nuestra acción y definen nuestra identidad como asociación.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {valores.map((valor, index) => (
              <div
                key={valor.title}
                className="bg-card rounded-xl p-8 shadow-card hover:shadow-elevated transition-shadow duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-lg bg-secondary/20 flex items-center justify-center mb-6">
                  <valor.icon className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{valor.title}</h3>
                <p className="text-muted-foreground">{valor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Noticias Section */}
      <div className="h-1 bg-secondary" />
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Últimas Noticias
              </h2>
              <p className="text-muted-foreground">
                Mantente informado sobre nuestras actividades y novedades.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/noticias">
                Ver todas
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {noticias.map((noticia, index) => (
                <article
                  key={noticia.id}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated hover:border-ahora-yellow/50 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {noticia.imagen_url ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={noticia.imagen_url}
                        alt={noticia.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-2 bg-secondary" />
                  )}
                  <div className="p-6">
                    <time className="text-sm text-muted-foreground">{formatDate(noticia.fecha_publicacion)}</time>
                    <h3 className="text-lg font-bold text-foreground mt-2 mb-3 group-hover:text-ahora-yellow transition-colors">
                      {noticia.titulo}
                    </h3>
                    <p className="text-muted-foreground text-sm">{noticia.extracto}</p>
                    <Link
                      to={`/noticias/${noticia.id}`}
                      className="inline-flex items-center text-sm font-medium text-primary mt-4 hover:text-primary/80 transition-colors"
                    >
                      Leer más
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <div className="h-1 bg-secondary" />
      <section className="py-20 md:py-28 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            ¿Quieres formar parte del cambio?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Únete a AHORA y contribuye a defender los valores democráticos y constitucionales de España.
          </p>
          <Button asChild variant="hero" size="xl">
            <Link to="/hazte-socio">
              Hazte socio ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
