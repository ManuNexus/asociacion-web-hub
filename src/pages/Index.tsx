import { Link } from "react-router-dom";
import { ArrowRight, Users, FileText, Shield, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-ahora-icon.png";

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

const noticias = [
  {
    id: 1,
    title: "Constitución de la Asociación AHORA",
    excerpt: "El 13 de junio de 2025 se constituyó formalmente la Asociación AHORA en Barcelona.",
    date: "13 Jun 2025",
  },
  {
    id: 2,
    title: "Inscripción en el Registro Nacional",
    excerpt: "La asociación ha sido inscrita oficialmente en el Registro Nacional de Asociaciones con el número 631679.",
    date: "03 Oct 2025",
  },
  {
    id: 3,
    title: "Lanzamiento de la web oficial",
    excerpt: "Presentamos nuestra nueva página web con toda la información sobre la asociación.",
    date: "02 Dic 2025",
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container relative py-20 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="space-y-6 animate-slide-up">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight">
                Actuar en el presente para construir el futuro
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg">
                AHORA es una asociación civil que nace para defender los valores constitucionales, el pluralismo ideológico y los derechos fundamentales en España.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild variant="hero" size="xl">
                  <Link to="/hazte-socio">
                    Únete a nosotros
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="hero-outline" size="xl">
                  <Link to="/nosotros">Conoce más</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <img src={logoIcon} alt="" className="w-72 lg:w-96 opacity-40 drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Valores Section */}
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
          <div className="grid gap-6 md:grid-cols-3">
            {noticias.map((noticia, index) => (
              <article
                key={noticia.id}
                className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-2 bg-secondary" />
                <div className="p-6">
                  <time className="text-sm text-muted-foreground">{noticia.date}</time>
                  <h3 className="text-lg font-bold text-foreground mt-2 mb-3 group-hover:text-primary transition-colors">
                    {noticia.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{noticia.excerpt}</p>
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
        </div>
      </section>

      {/* CTA Section */}
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
