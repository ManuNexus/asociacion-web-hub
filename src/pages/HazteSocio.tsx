import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Users, Heart, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const beneficios = [
  {
    icon: Users,
    title: "Participación activa",
    description: "Voz y voto en las Asambleas Generales de la asociación.",
  },
  {
    icon: Heart,
    title: "Compromiso compartido",
    description: "Forma parte de una comunidad comprometida con los valores democráticos.",
  },
  {
    icon: Shield,
    title: "Información exclusiva",
    description: "Acceso a comunicaciones y eventos reservados para socios.",
  },
];

const HazteSocio = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
    codigoPostal: "",
    ciudad: "",
    provincia: "",
    motivacion: "",
    aceptaEstatutos: false,
    aceptaPrivacidad: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.aceptaEstatutos || !formData.aceptaPrivacidad) {
      toast({
        title: "Error",
        description: "Debes aceptar los estatutos y la política de privacidad.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("solicitudes_socio").insert({
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        dni: formData.dni,
        email: formData.email,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        codigo_postal: formData.codigoPostal || null,
        ciudad: formData.ciudad || null,
        provincia: formData.provincia || null,
        motivacion: formData.motivacion || null,
      });

      if (error) throw error;

      toast({
        title: "¡Solicitud enviada!",
        description: "Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto.",
      });

      setFormData({
        nombre: "",
        apellidos: "",
        dni: "",
        email: "",
        telefono: "",
        direccion: "",
        codigoPostal: "",
        ciudad: "",
        provincia: "",
        motivacion: "",
        aceptaEstatutos: false,
        aceptaPrivacidad: false,
      });
    } catch (error: any) {
      console.error("Error submitting:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Hazte Socio
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Únete a AHORA y forma parte de un proyecto comprometido con los valores constitucionales y democráticos.
            </p>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {beneficios.map((beneficio) => (
              <div key={beneficio.title} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <beneficio.icon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{beneficio.title}</h3>
                  <p className="text-sm text-muted-foreground">{beneficio.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cuotas */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Cuotas de Socio
            </h2>
            <p className="text-muted-foreground">
              Elige la cuota que mejor se adapte a tu situación
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            {/* Cuota Normal */}
            <div className="bg-card rounded-xl border-2 border-primary p-6 relative">
              <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Recomendada
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Cuota Normal</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">5€</span>
                <span className="text-muted-foreground">/ mes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cuota estándar para todos los socios que deseen apoyar la asociación.
              </p>
            </div>

            {/* Cuota Reducida */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-xl font-bold text-foreground mb-2">Cuota Reducida</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-secondary">2,50€</span>
                <span className="text-muted-foreground">/ mes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Para <strong>estudiantes</strong> y <strong>personas en situación de desempleo</strong>. Se requerirá acreditación.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Formulario de Inscripción
              </h2>
              <p className="text-muted-foreground">
                Completa el siguiente formulario para solicitar tu alta como socio de la Asociación AHORA.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Datos Personales */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Datos Personales
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      required
                      placeholder="Tus apellidos"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI/NIE *</Label>
                    <Input
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      required
                      placeholder="12345678A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="600 000 000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Dirección
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    placeholder="Calle, número, piso..."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="codigoPostal">Código Postal</Label>
                    <Input
                      id="codigoPostal"
                      name="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={handleInputChange}
                      placeholder="08000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      placeholder="Barcelona"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input
                      id="provincia"
                      name="provincia"
                      value={formData.provincia}
                      onChange={handleInputChange}
                      placeholder="Barcelona"
                    />
                  </div>
                </div>
              </div>

              {/* Motivación */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Motivación
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="motivacion">¿Por qué quieres unirte a AHORA?</Label>
                  <Textarea
                    id="motivacion"
                    name="motivacion"
                    value={formData.motivacion}
                    onChange={handleInputChange}
                    placeholder="Cuéntanos brevemente qué te motiva a formar parte de nuestra asociación..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Aceptaciones */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="aceptaEstatutos"
                    checked={formData.aceptaEstatutos}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("aceptaEstatutos", checked as boolean)
                    }
                  />
                  <Label htmlFor="aceptaEstatutos" className="text-sm text-muted-foreground leading-relaxed">
                    He leído y acepto los estatutos de la Asociación AHORA y me comprometo a cumplirlos. *
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="aceptaPrivacidad"
                    checked={formData.aceptaPrivacidad}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("aceptaPrivacidad", checked as boolean)
                    }
                  />
                  <Label htmlFor="aceptaPrivacidad" className="text-sm text-muted-foreground leading-relaxed">
                    Acepto la <Link to="/politica-privacidad" className="text-primary hover:underline">política de privacidad</Link> y el tratamiento de mis datos personales para la gestión de mi condición de socio. *
                  </Label>
                </div>
              </div>

              <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Enviando solicitud..."
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Enviar solicitud de alta
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Una vez enviada tu solicitud, la Junta Directiva estudiará tu candidatura y te comunicará la resolución por email.
              </p>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HazteSocio;
