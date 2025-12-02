import { Layout } from "@/components/layout/Layout";
import { Target, Eye, Users, Scale } from "lucide-react";

const objetivos = [
  "Defender los valores constitucionales y los derechos fundamentales reconocidos en la Constitución Española.",
  "Promover el pluralismo ideológico y el respeto a la diversidad de opiniones.",
  "Fomentar la convivencia democrática y el diálogo constructivo entre diferentes sectores de la sociedad.",
  "Impulsar la participación ciudadana en los asuntos públicos.",
  "Velar por la calidad de las instituciones democráticas y el Estado de Derecho.",
];

const Nosotros = () => {
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
