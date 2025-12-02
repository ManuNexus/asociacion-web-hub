import { Layout } from "@/components/layout/Layout";
import { ChevronRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const noticias = [
  {
    id: 1,
    title: "Constitución de la Asociación AHORA",
    excerpt: "El pasado 13 de junio de 2025 se constituyó formalmente la Asociación AHORA en Barcelona, marcando el inicio de un proyecto comprometido con la defensa de los valores constitucionales y democráticos en España.",
    content: "La Asociación AHORA nace con la vocación de actuar en el presente para construir un futuro mejor. Con sede en Barcelona, nuestra organización se ha constituido como una entidad de ámbito nacional dedicada a la promoción del pluralismo ideológico y la convivencia democrática.",
    date: "13 Jun 2025",
    category: "Institucional",
  },
  {
    id: 2,
    title: "Inscripción en el Registro Nacional de Asociaciones",
    excerpt: "El Ministerio del Interior ha resuelto inscribir oficialmente a la Asociación AHORA en el Registro Nacional de Asociaciones, otorgándole el número 631679 en la Sección 1ª.",
    content: "Con fecha 3 de octubre de 2025, el Ministerio del Interior, a través de la Secretaría General Técnica, ha resuelto la inscripción de la Asociación AHORA en el Registro Nacional de Asociaciones. Este paso representa un hito importante en la consolidación legal de nuestra entidad.",
    date: "03 Oct 2025",
    category: "Institucional",
  },
  {
    id: 3,
    title: "Lanzamiento de la página web oficial",
    excerpt: "Presentamos nuestra nueva página web, un espacio digital para informar sobre nuestras actividades, facilitar la participación ciudadana y promover la transparencia.",
    content: "La Asociación AHORA estrena su página web oficial, diseñada para ser un punto de encuentro para todos aquellos ciudadanos comprometidos con los valores constitucionales y la calidad democrática. A través de este portal, los interesados podrán conocer nuestra labor, acceder a documentación importante y hacerse socios.",
    date: "02 Dic 2025",
    category: "Comunicación",
  },
];

const Noticias = () => {
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
                        {noticia.category}
                      </span>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {noticia.date}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {noticia.title}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {noticia.excerpt}
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
        </div>
      </section>
    </Layout>
  );
};

export default Noticias;
