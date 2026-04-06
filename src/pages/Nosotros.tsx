import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Target, Eye, Users, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO, breadcrumbSchema } from "@/components/SEO";

const cargoLabels: Record<string, string> = {
  presidente: "Presidente",
  vicepresidente: "Vicepresidenta",
  secretario: "Secretario",
  tesorero: "Tesorero",
  vocal: "Vocal",
};

const objetivos = [
  "Defender los valores constitucionales y los derechos fundamentales reconocidos en la Constitución Española.",
  "Promover el pluralismo ideológico y el respeto a la diversidad de opiniones.",
  "Fomentar la convivencia democrática y el diálogo constructivo entre diferentes sectores de la sociedad.",
  "Impulsar la participación ciudadana en los asuntos públicos.",
  "Velar por la calidad de las instituciones democráticas y el Estado de Derecho.",
];

const Nosotros = () => {
  const [miembros, setMiembros] = useState<any[]>([]);

  useEffect(() => {
    const fetchMiembros = async () => {
      const { data } = await supabase
        .from("socios")
        .select("nombre, apellidos, cargo_junta, foto_url, bio, social_x, social_instagram, social_linkedin")
        .not("cargo_junta", "is", null)
        .eq("activo", true);
      
      if (data) {
        const order = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];
        data.sort((a, b) => order.indexOf(a.cargo_junta!) - order.indexOf(b.cargo_junta!));
        setMiembros(data);
      }
    };
    fetchMiembros();
  }, []);
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Quiénes Somos
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Conoce nuestra historia, misión y los valores que nos definen como asociación.
            </p>
          </div>
        </div>
      </section>

      {/* Introducción */}
      <div className="h-1 bg-secondary" />
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Asociación AHORA
              </h2>
              <p className="text-lg text-muted-foreground">
                AHORA es una asociación civil de ámbito nacional que nace con el objetivo de defender los valores constitucionales, el pluralismo ideológico, la convivencia y los derechos fundamentales en España.
              </p>
              <p className="text-muted-foreground">
                El nombre "AHORA" transmite la idea de actuar en el presente, de urgencia constructiva y de impulso para abordar los retos sociales, institucionales y democráticos de nuestro tiempo.
              </p>
              <p className="text-muted-foreground">
                Constituida formalmente el 13 de junio de 2025 en Barcelona, nuestra asociación fue inscrita en el Registro Nacional de Asociaciones el 3 de octubre de 2025, con el número 631679.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-secondary mb-2">2025</div>
                <div className="text-sm text-muted-foreground">Año de fundación</div>
              </div>
              <div className="bg-muted rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-secondary mb-2">631679</div>
                <div className="text-sm text-muted-foreground">Nº Registro Nacional</div>
              </div>
              <div className="bg-muted rounded-xl p-6 text-center col-span-2">
                <div className="text-4xl font-bold text-secondary mb-2">Nacional</div>
                <div className="text-sm text-muted-foreground">Ámbito de actuación</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Junta Directiva */}
      <div className="h-1 bg-secondary" />
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestro Equipo</h2>
            <p className="text-muted-foreground">
              Las personas detrás de AHORA que trabajan cada día por hacer realidad nuestra misión.
            </p>
          </div>
          {miembros.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {miembros.map((m, i) => (
                <div key={i} className="bg-card rounded-xl p-6 shadow-card text-center flex flex-col">
                  <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden bg-muted border-4 border-secondary/30">
                    {m.foto_url ? (
                      <img
                        src={m.foto_url}
                        alt={`${m.nombre} ${m.apellidos}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-secondary text-lg uppercase tracking-wide">
                    {m.nombre} {m.apellidos}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {cargoLabels[m.cargo_junta] || m.cargo_junta}
                  </p>
                  {m.bio && (
                    <p className="text-muted-foreground text-sm mt-4 leading-relaxed flex-1">
                      {m.bio}
                    </p>
                  )}
                  {(m.social_x || m.social_instagram || m.social_linkedin) && (
                    <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-border">
                      {m.social_x && (
                        <a href={m.social_x} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-secondary/20 transition-colors" aria-label="X (Twitter)">
                          <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                      )}
                      {m.social_instagram && (
                        <a href={m.social_instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-secondary/20 transition-colors" aria-label="Instagram">
                          <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        </a>
                      )}
                      {m.social_linkedin && (
                        <a href={m.social_linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-secondary/20 transition-colors" aria-label="LinkedIn">
                          <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Misión y Visión */}
      <div className="h-1 bg-secondary" />
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-card rounded-xl p-8 shadow-card">
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Nuestra Misión</h3>
              <p className="text-muted-foreground">
                Defender activamente los valores constitucionales, promover el pluralismo ideológico y fomentar la convivencia democrática en España, actuando como voz ciudadana comprometida con los derechos fundamentales y la calidad institucional.
              </p>
            </div>
            <div className="bg-card rounded-xl p-8 shadow-card">
              <div className="w-14 h-14 rounded-lg bg-secondary/20 flex items-center justify-center mb-6">
                <Eye className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Nuestra Visión</h3>
              <p className="text-muted-foreground">
                Ser una asociación de referencia en la defensa de los valores democráticos, contribuyendo a una sociedad española más plural, tolerante y comprometida con el Estado de Derecho y los principios constitucionales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Objetivos */}
      <div className="h-1 bg-secondary" />
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Nuestros Objetivos</h2>
              <p className="text-muted-foreground">
                Los fines que guían nuestra actividad como asociación.
              </p>
            </div>
            <div className="space-y-4">
              {objetivos.map((objetivo, index) => (
                <div key={index} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-foreground">{objetivo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <div className="h-1 bg-secondary" />
      <section className="py-16 md:py-24 bg-primary">
        <div className="container">
          <h2 className="text-3xl font-bold text-primary-foreground text-center mb-12">
            Nuestros Valores
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Scale, title: "Democracia", desc: "Compromiso con los principios democráticos" },
              { icon: Users, title: "Pluralismo", desc: "Respeto a la diversidad de ideas" },
              { icon: Target, title: "Transparencia", desc: "Actuación abierta y responsable" },
              { icon: Eye, title: "Rigor", desc: "Seriedad institucional en nuestra acción" },
            ].map((valor) => (
              <div key={valor.title} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                  <valor.icon className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-primary-foreground mb-2">{valor.title}</h3>
                <p className="text-primary-foreground/70 text-sm">{valor.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Nosotros;
