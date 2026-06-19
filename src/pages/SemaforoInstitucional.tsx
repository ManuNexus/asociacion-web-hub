import { Layout } from "@/components/layout/Layout";
import { SEO, breadcrumbSchema } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wrench, ArrowLeft, Mail } from "lucide-react";

const SemaforoInstitucional = () => {
  return (
    <Layout>
      <SEO
        title="Semáforo Institucional · En mantenimiento | AHORA"
        description="El Semáforo Institucional está temporalmente en mantenimiento. Volveremos pronto con mejoras."
        canonical="/semaforo-institucional"
        noindex
        jsonLd={[breadcrumbSchema([
          { name: "Inicio", url: "/" },
          { name: "Semáforo Institucional", url: "/semaforo-institucional" },
        ])]}
      />
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[700px] h-[700px] rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-ahora-yellow/5 blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-secondary" />

        <div className="container relative z-10 py-16">
          <div className="max-w-2xl mx-auto text-center text-primary-foreground animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary/20 ring-1 ring-secondary/40 mb-8">
              <Wrench className="h-10 w-10 text-secondary" />
            </div>

            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-6">
              En mantenimiento
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              Estamos mejorando el
              <span className="block mt-2 text-secondary">Semáforo Institucional</span>
            </h1>

            <p className="text-base md:text-lg text-primary-foreground/80 leading-relaxed mb-10">
              Esta sección está temporalmente fuera de servicio mientras realizamos mejoras
              para ofrecerte un análisis más claro y completo sobre la integridad institucional.
              Volveremos muy pronto. Gracias por tu paciencia.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="hero" size="xl">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Volver al inicio
                </Link>
              </Button>
              <Button asChild variant="hero-outline" size="xl">
                <a href="mailto:info@ahoraorg.es">
                  <Mail className="mr-2 h-5 w-5" />
                  Contactar
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SemaforoInstitucional;
