import { Layout } from "@/components/layout/Layout";

const PoliticaPrivacidad = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">Política de Privacidad</h1>
            <p className="text-xl text-primary-foreground/80">
              Información sobre el tratamiento de tus datos personales
            </p>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <p className="text-muted-foreground mb-8">
              Última actualización: 10 de enero de 2025
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Responsable del Tratamiento</h2>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <p>
                    <strong>Identidad:</strong> ASOCIACIÓN AHORA
                  </p>
                  <p>
                    <strong>NIF:</strong> G24999484
                  </p>
                  <p>
                    <strong>Dirección:</strong> C/ Aragón 458, 08013 Barcelona
                  </p>
                  <p>
                    <strong>Email:</strong> info@ahoraorg.es
                  </p>
                  <p>
                    <strong>Registro:</strong> Registro Nacional de Asociaciones Nº 631679
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Datos que Recopilamos</h2>
                <p className="text-muted-foreground mb-4">
                  La Asociación AHORA puede recopilar los siguientes datos personales:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Datos identificativos:</strong> nombre, apellidos, DNI/NIE
                  </li>
                  <li>
                    <strong>Datos de contacto:</strong> dirección postal, email, teléfono
                  </li>
                  <li>
                    <strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Finalidad del Tratamiento</h2>
                <p className="text-muted-foreground mb-4">
                  Los datos personales que nos proporciones serán tratados con las siguientes finalidades:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Gestionar tu solicitud de alta como socio de la asociación</li>
                  <li>Mantener actualizado el registro de socios</li>
                  <li>Enviarte comunicaciones relacionadas con las actividades de la asociación</li>
                  <li>Gestionar el cobro de las cuotas de socio</li>
                  <li>Cumplir con las obligaciones legales aplicables</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Legitimación</h2>
                <p className="text-muted-foreground">La base legal para el tratamiento de tus datos es:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>
                    <strong>Consentimiento:</strong> al completar el formulario de inscripción y aceptar esta política
                  </li>
                  <li>
                    <strong>Ejecución de contrato:</strong> para la gestión de tu condición de socio
                  </li>
                  <li>
                    <strong>Obligación legal:</strong> para el cumplimiento de obligaciones legales aplicables
                  </li>
                  <li>
                    <strong>Interés legítimo:</strong> para el envío de comunicaciones sobre actividades de la
                    asociación
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Conservación de Datos</h2>
                <p className="text-muted-foreground">
                  Los datos personales se conservarán mientras se mantenga la relación de socio y, una vez finalizada,
                  durante los plazos legalmente establecidos. Los datos de navegación se conservan durante un máximo de
                  2 años.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Destinatarios</h2>
                <p className="text-muted-foreground">
                  Los datos personales no serán cedidos a terceros, salvo obligación legal. Podrán tener acceso a los
                  datos los encargados del tratamiento que presten servicios a la asociación (entidades bancarias para
                  la gestión de cobros, proveedores de servicios informáticos, etc.).
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Derechos del Interesado</h2>
                <p className="text-muted-foreground mb-4">
                  Puedes ejercer los siguientes derechos en relación con tus datos personales:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Acceso:</strong> conocer qué datos personales tenemos sobre ti
                  </li>
                  <li>
                    <strong>Rectificación:</strong> modificar datos inexactos o incompletos
                  </li>
                  <li>
                    <strong>Supresión:</strong> solicitar la eliminación de tus datos
                  </li>
                  <li>
                    <strong>Oposición:</strong> oponerte al tratamiento de tus datos
                  </li>
                  <li>
                    <strong>Limitación:</strong> solicitar la limitación del tratamiento
                  </li>
                  <li>
                    <strong>Portabilidad:</strong> recibir tus datos en formato estructurado
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Para ejercer estos derechos, puedes contactar con nosotros en{" "}
                  <a href="mailto:info@ahoraorg.es" className="text-primary hover:underline">
                    info@ahoraorg.es
                  </a>
                  .
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Medidas de Seguridad</h2>
                <p className="text-muted-foreground">
                  La Asociación AHORA ha adoptado las medidas técnicas y organizativas necesarias para garantizar la
                  seguridad de los datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Cookies</h2>
                <p className="text-muted-foreground">
                  Este sitio web utiliza cookies técnicas necesarias para su funcionamiento. No utilizamos cookies de
                  seguimiento ni publicitarias.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">10. Reclamaciones</h2>
                <p className="text-muted-foreground">
                  Si consideras que el tratamiento de tus datos no es adecuado, puedes presentar una reclamación ante la
                  Agencia Española de Protección de Datos (
                  <a
                    href="https://www.aepd.es"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    www.aepd.es
                  </a>
                  ).
                </p>
              </div>

              <div className="bg-primary/10 rounded-xl p-6 mt-8">
                <p className="text-sm text-muted-foreground">
                  La Asociación AHORA se reserva el derecho a modificar esta política de privacidad para adaptarla a
                  novedades legislativas o jurisprudenciales. En caso de introducir modificaciones sustanciales, se
                  comunicará a los socios a través del email proporcionado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PoliticaPrivacidad;
