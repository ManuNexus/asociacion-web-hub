import { Layout } from "@/components/layout/Layout";
import { SEO, breadcrumbSchema } from "@/components/SEO";

const CondicionesAfiliacion = () => {
  return (
    <Layout>
      <SEO
        title="Condiciones de Afiliación"
        description="Condiciones que regulan la afiliación y cuotas de socio en la Asociación AHORA. Derechos, obligaciones y proceso de alta."
        canonical="/condiciones-afiliacion"
        jsonLd={breadcrumbSchema([
          { name: "Inicio", url: "/" },
          { name: "Condiciones de Afiliación", url: "/condiciones-afiliacion" },
        ])}
      />
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Condiciones de Afiliación y Cuotas de Socio
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Condiciones que regulan la relación entre el socio y la Asociación AHORA
            </p>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <p className="text-muted-foreground mb-8">
              Última actualización:{" "}
              {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Objeto</h2>
                <p className="text-muted-foreground mb-4">
                  Las presentes condiciones regulan la relación entre la persona solicitante de alta como socio/a (en
                  adelante, el socio) y la ASOCIACIÓN AHORA, con NIF G24999484, inscrita en el Registro Nacional de
                  Asociaciones nº 631679.
                </p>
                <p className="text-muted-foreground">
                  La solicitud de alta como socio implica la aceptación plena de estas condiciones y la adquisición de
                  los derechos y obligaciones previstos en los Estatutos de la Asociación.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Procedimiento de Alta</h2>
                <p className="text-muted-foreground mb-4">El alta como socio se formaliza mediante:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>La cumplimentación del formulario de inscripción online</li>
                  <li>La aceptación expresa de las presentes condiciones</li>
                  <li>La facilitación de los datos personales y bancarios requeridos</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  La asociación podrá verificar la identidad del solicitante cuando lo considere necesario.
                </p>
                <p className="text-muted-foreground mt-2">
                  La Asociación se reserva el derecho de admisión conforme a sus Estatutos.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Cuotas de Socio</h2>
                <p className="text-muted-foreground mb-4">
                  La condición de socio está sujeta al pago de una cuota periódica aprobada por la Asociación.
                </p>
                <p className="text-muted-foreground mb-4">El socio acepta expresamente que:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>La cuota tiene carácter periódico</li>
                  <li>Su importe podrá ser actualizado por acuerdo de los órganos competentes de la Asociación</li>
                  <li>La Asociación comunicará cualquier modificación con al menos 15 días de antelación</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  El impago de cuotas podrá suponer la suspensión de la condición de socio conforme a los Estatutos.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Forma de Pago y Autorización SEPA</h2>
                <p className="text-muted-foreground mb-4">
                  El pago de las cuotas se realizará mediante domiciliación bancaria (SEPA).
                </p>
                <p className="text-muted-foreground mb-4">
                  Al facilitar su número de cuenta (IBAN) y aceptar estas condiciones, el socio:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Autoriza expresamente a la ASOCIACIÓN AHORA a emitir recibos domiciliados en la cuenta indicada para
                    el cobro de las cuotas periódicas de socio.
                  </li>
                  <li>
                    Esta autorización constituye un mandato SEPA electrónico válido, conforme a la normativa europea de
                    pagos.
                  </li>
                  <li>El socio declara ser titular o autorizado de la cuenta facilitada.</li>
                  <li>
                    Al introducir tus datos bancarios y aceptar estas condiciones, autorizas a la ASOCIACIÓN AHORA
                    (acreedor) a enviar instrucciones a tu entidad bancaria para adeudar en tu cuenta los recibos
                    correspondientes a las cuotas de socio, y a tu entidad bancaria para efectuar los adeudos en tu
                    cuenta siguiendo las instrucciones de la ASOCIACIÓN AHORA, conforme al esquema SEPA Core. Puedes
                    solicitar el reembolso a tu entidad bancaria en los términos y plazos previstos en la normativa de
                    servicios de pago.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  5. Mandato Electrónico y Prueba de Consentimiento
                </h2>
                <p className="text-muted-foreground mb-4">
                  La aceptación de estas condiciones mediante el formulario web constituye contrato válido entre las
                  partes.
                </p>
                <p className="text-muted-foreground mb-4">La Asociación conservará, como prueba del consentimiento:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Fecha y hora de la aceptación</li>
                  <li>Dirección IP</li>
                  <li>Email utilizado</li>
                  <li>Datos bancarios facilitados</li>
                  <li>Versión del documento aceptado</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Estos datos podrán ser utilizados exclusivamente para acreditar la autorización de cobro ante
                  entidades bancarias o autoridades competentes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Derecho de Baja</h2>
                <p className="text-muted-foreground mb-4">El socio podrá darse de baja en cualquier momento.</p>
                <p className="text-muted-foreground mb-4">La baja deberá solicitarse desde el espacio de socio.</p>
                <p className="text-muted-foreground mb-4">
                  La baja surtirá efecto en el siguiente periodo de facturación siempre que se solicite con al menos 5
                  días naturales de antelación al siguiente cobro.
                </p>
                <p className="text-muted-foreground">
                  Las solicitudes posteriores podrán generar la emisión del siguiente recibo.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Devolución de Recibos</h2>
                <p className="text-muted-foreground mb-4">
                  La devolución injustificada de recibos no extingue la obligación de pago de las cuotas devengadas.
                </p>
                <p className="text-muted-foreground mb-4">La Asociación podrá:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Reclamar las cantidades pendientes</li>
                  <li>Suspender temporalmente la condición de socio</li>
                  <li>Proceder a la baja conforme a los Estatutos</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Comunicaciones</h2>
                <p className="text-muted-foreground mb-4">
                  Las comunicaciones relativas a la condición de socio se realizarán preferentemente por medios
                  electrónicos al email facilitado.
                </p>
                <p className="text-muted-foreground">
                  El socio se compromete a mantener actualizados sus datos de contacto.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Modificación de Condiciones</h2>
                <p className="text-muted-foreground mb-4">
                  La Asociación podrá modificar las presentes condiciones por motivos organizativos o legales.
                </p>
                <p className="text-muted-foreground">
                  Las modificaciones serán notificadas con al menos 15 días de antelación y se entenderán aceptadas si
                  el socio no solicita la baja.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">10. Legislación Aplicable</h2>
                <p className="text-muted-foreground mb-4">
                  La relación entre el socio y la Asociación se regirá por la legislación española.
                </p>
                <p className="text-muted-foreground">
                  Para cualquier conflicto, las partes se someten a los juzgados y tribunales del domicilio del socio,
                  conforme a la normativa de consumidores y usuarios.
                </p>
              </div>

              <div className="bg-primary/10 rounded-xl p-6 mt-8">
                <p className="text-sm text-muted-foreground">
                  La Asociación AHORA se reserva el derecho a modificar estas condiciones para adaptarlas a novedades
                  legislativas o jurisprudenciales. En caso de introducir modificaciones sustanciales, se comunicará a
                  los socios a través del email proporcionado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CondicionesAfiliacion;
