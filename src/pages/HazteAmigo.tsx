import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { SEO, breadcrumbSchema } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Heart, Mail, Megaphone, Users, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const friendSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellidos: z.string().trim().min(1, "Los apellidos son obligatorios").max(100),
  email: z.string().trim().min(1, "El email es obligatorio").email("Email inválido").max(255),
  telefono: z.string().trim().max(20).optional().or(z.literal("")),
  aceptaPrivacidad: z.literal(true, { errorMap: () => ({ message: "Debes aceptar la política de privacidad" }) }),
});

const ventajas = [
  {
    icon: Mail,
    title: "Boletín informativo",
    description: "Recibe nuestras noticias y comunicaciones directamente en tu correo.",
  },
  {
    icon: Megaphone,
    title: "Eventos abiertos",
    description: "Entérate de todos los actos públicos y eventos que organizamos.",
  },
  {
    icon: Users,
    title: "Comunidad",
    description: "Forma parte de una red de personas comprometidas con los valores democráticos.",
  },
];

const HazteAmigo = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    aceptaPrivacidad: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = friendSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const validData = result.data;

      // Insert into amigos table
      const { error } = await supabase.from("amigos").insert({
        nombre: validData.nombre,
        apellidos: validData.apellidos,
        email: validData.email,
        telefono: formData.telefono || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Ya estás registrado/a",
            description: "Este email ya está en nuestra base de datos de amigos.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Send confirmation email
      supabase.functions.invoke("notify-new-amigo", {
        body: {
          nombre: validData.nombre,
          apellidos: validData.apellidos,
          email: validData.email,
          telefono: formData.telefono || undefined,
        },
      }).catch((err) => console.error("Error sending amigo notification:", err));

      setSubmitted(true);
      toast({
        title: "¡Bienvenido/a!",
        description: "Te has registrado como amigo/a de AHORA. Recibirás un correo de confirmación.",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo enviar. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <section className="py-24 md:py-32">
          <div className="container">
            <div className="max-w-lg mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-secondary" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground">¡Gracias por unirte!</h1>
              <p className="text-muted-foreground">
                Ya formas parte de la comunidad de amigos de AHORA. Te mantendremos informado/a de todas nuestras actividades y novedades.
              </p>
              <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link to="/">Volver al inicio</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Hazte Amigo
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Apoya a AHORA sin compromiso. Regístrate como simpatizante y mantente al día de todo lo que hacemos.
            </p>
          </div>
        </div>
      </section>

      {/* Ventajas */}
      <div className="h-1 bg-secondary" />
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {ventajas.map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <v.icon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferencia */}
      <div className="h-1 bg-secondary" />
      <section className="py-16">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              ¿En qué se diferencia de ser socio?
            </h2>
            <p className="text-muted-foreground">
              Ser amigo es <strong>totalmente gratuito</strong>. No requiere cuota ni datos bancarios. Recibirás nuestras comunicaciones y podrás asistir a eventos públicos, pero no tendrás derecho a voto ni participación en las decisiones internas de la asociación.
            </p>
            <p className="text-muted-foreground mt-4">
              Si quieres una participación más activa, puedes{" "}
              <Link to="/hazte-socio" className="text-secondary font-semibold hover:underline">
                hacerte socio
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <div className="h-1 bg-secondary" />
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-12">
              <Heart className="h-10 w-10 text-secondary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Regístrate como Amigo
              </h2>
              <p className="text-muted-foreground">
                Solo necesitamos unos datos básicos para mantenerte informado/a.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    maxLength={100}
                    className={formErrors.nombre ? "border-destructive" : ""}
                  />
                  {formErrors.nombre && <p className="text-sm text-destructive">{formErrors.nombre}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    placeholder="Tus apellidos"
                    maxLength={100}
                    className={formErrors.apellidos ? "border-destructive" : ""}
                  />
                  {formErrors.apellidos && <p className="text-sm text-destructive">{formErrors.apellidos}</p>}
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
                  placeholder="tu@email.com"
                  maxLength={255}
                  className={formErrors.email ? "border-destructive" : ""}
                />
                {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono (opcional)</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="600 000 000"
                  maxLength={20}
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="aceptaPrivacidad"
                  checked={formData.aceptaPrivacidad}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({ ...prev, aceptaPrivacidad: checked === true }));
                    if (formErrors.aceptaPrivacidad) setFormErrors((prev) => ({ ...prev, aceptaPrivacidad: "" }));
                  }}
                  className={formErrors.aceptaPrivacidad ? "border-destructive" : ""}
                />
                <Label htmlFor="aceptaPrivacidad" className="text-sm leading-relaxed cursor-pointer">
                  Acepto la{" "}
                  <Link to="/politica-privacidad" className="text-secondary hover:underline" target="_blank">
                    política de privacidad
                  </Link>{" "}
                  y el tratamiento de mis datos para recibir comunicaciones de AHORA. *
                </Label>
              </div>
              {formErrors.aceptaPrivacidad && <p className="text-sm text-destructive">{formErrors.aceptaPrivacidad}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-lg py-6"
              >
                {isSubmitting ? "Enviando..." : "Registrarme como Amigo"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HazteAmigo;
