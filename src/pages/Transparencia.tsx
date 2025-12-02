import { Layout } from "@/components/layout/Layout";
import { FileText, Users, Wallet, Building, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
const documentos = [{
  title: "Estatutos de la Asociación",
  description: "Documento fundacional que recoge los fines, organización y funcionamiento de la asociación.",
  icon: FileText,
  available: true,
  url: "/documentos/estatutos-fundacionales.pdf"
}, {
  title: "Acta Fundacional",
  description: "Acta de constitución de la Asociación AHORA, firmada el 13 de junio de 2025.",
  icon: FileText,
  available: true,
  url: "/documentos/acta-constitucion.pdf"
}, {
  title: "Resolución de Inscripción",
  description: "Resolución del Ministerio del Interior inscribiendo la asociación en el Registro Nacional.",
  icon: Building,
  available: false,
  url: null
}];
const organos = [{
  cargo: "Presidente",
  nombre: "Pendiente de publicación",
  descripcion: "Representa legalmente a la asociación y preside los órganos colegiados."
}, {
  cargo: "Vicepresidente",
  nombre: "Pendiente de publicación",
  descripcion: "Sustituye al presidente en caso de ausencia y colabora en sus funciones."
}, {
  cargo: "Secretario",
  nombre: "Pendiente de publicación",
  descripcion: "Custodia la documentación y certifica los acuerdos de los órganos."
}, {
  cargo: "Tesorero",
  nombre: "Pendiente de publicación",
  descripcion: "Gestiona los recursos económicos y elabora los presupuestos."
}];
const Transparencia = () => {
  return <Layout>
      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Transparencia
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Nuestro compromiso con la transparencia y la rendición de cuentas ante los socios y la ciudadanía.
            </p>
          </div>
        </div>
      </section>

      {/* Introducción */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-lg text-muted-foreground">
              La Asociación AHORA está comprometida con los más altos estándares de transparencia. En esta sección encontrarás toda la información relevante sobre nuestra organización, estructura, documentación y gestión económica.
            </p>
          </div>

          {/* Documentos */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
              <FileText className="h-6 w-6 text-secondary" />
              Documentación Oficial
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {documentos.map(doc => <div key={doc.title} className="bg-card rounded-xl border border-border p-6">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <doc.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{doc.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>
                  {doc.available && doc.url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Próximamente
                    </Button>
                  )}
                </div>)}
            </div>
          </div>

          {/* Órganos de Gobierno */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
              <Users className="h-6 w-6 text-secondary" />
              Órganos de Gobierno
            </h2>
            <div className="bg-muted/50 rounded-xl p-6 md:p-8">
              <p className="text-muted-foreground mb-6">
                La Asociación AHORA está gobernada por la Asamblea General de socios y la Junta Directiva. A continuación se detallan los miembros de la Junta Directiva:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {organos.map(organo => <div key={organo.cargo} className="bg-card rounded-lg p-4 border border-border">
                    <div className="font-semibold text-secondary text-sm mb-1">{organo.cargo}</div>
                    <div className="font-bold text-foreground mb-1">{organo.nombre}</div>
                    <div className="text-sm text-muted-foreground">{organo.descripcion}</div>
                  </div>)}
              </div>
            </div>
          </div>

          {/* Información Económica */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-secondary" />
              Información Económica
            </h2>
            <div className="bg-card rounded-xl border border-border p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-bold text-foreground mb-4">Cuentas Anuales</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Las cuentas anuales de la asociación se aprueban por la Asamblea General y se publican en esta sección una vez auditadas.
                  </p>
                  <div className="text-sm text-muted-foreground italic">
                    Al ser una asociación de reciente constitución (2025), las primeras cuentas anuales se publicarán tras el cierre del ejercicio.
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-4">Fuentes de Financiación</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2" />
                      Cuotas de los socios
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2" />
                      Donaciones y legados
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2" />
                      Subvenciones públicas y privadas
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2" />
                      Rendimientos de actividades
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Datos Registrales */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
              <Building className="h-6 w-6 text-secondary" />
              Datos Registrales
            </h2>
            <div className="bg-primary rounded-xl p-6 md:p-8 text-primary-foreground">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-primary-foreground/60 text-sm mb-1">Denominación</div>
                  <div className="font-bold">ASOCIACIÓN AHORA</div>
                </div>
                <div>
                  <div className="text-primary-foreground/60 text-sm mb-1">Número Nacional</div>
                  <div className="font-bold">631679</div>
                </div>
                <div>
                  <div className="text-primary-foreground/60 text-sm mb-1">Sección</div>
                  <div className="font-bold">1ª</div>
                </div>
                <div>
                  <div className="text-primary-foreground/60 text-sm mb-1">Fecha de Inscripción</div>
                  <div className="font-bold">03/10/2025</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-primary-foreground/20">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <div className="text-primary-foreground/60 text-sm mb-1">Domicilio Social</div>
                    <div className="font-medium">C/ Aragón 578, 08026 Barcelona</div>
                  </div>
                  <Button variant="hero" size="sm" asChild>
                    <a target="_blank" rel="noopener noreferrer" href="https://sede.interior.gob.es/portal/sede/asociaciones/detalle?legacy=true&numeroNacional=631.679&codigoSeccion=1&codigoDenominacion=81.499.831&paginaActual=1">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Verificar inscripción
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>;
};
export default Transparencia;