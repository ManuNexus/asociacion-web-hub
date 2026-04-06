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
import { CheckCircle2, Users, Heart, Shield, CreditCard, Lock, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


// Validation schema for membership form - Step 1 (personal data)
const membershipSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  apellidos: z.string().trim().min(1, "Los apellidos son obligatorios").max(100, "Máximo 100 caracteres"),
  dni: z.string().trim().min(1, "El DNI/NIE es obligatorio").regex(
    /^[0-9]{8}[A-Za-z]$|^[XYZ][0-9]{7}[A-Za-z]$/,
    "Formato de DNI/NIE inválido (ej: 12345678A o X1234567A)"
  ),
  email: z.string().trim().min(1, "El email es obligatorio").email("Email inválido").max(255, "Máximo 255 caracteres"),
  telefono: z.string().trim().min(1, "El teléfono es obligatorio").max(20, "Máximo 20 caracteres").regex(/^[0-9+\s()-]+$/, "Formato de teléfono inválido"),
  tipoPago: z.enum(["mensual", "anual"], { errorMap: () => ({ message: "Selecciona un tipo de pago" }) }),
  aceptaEstatutos: z.literal(true, { errorMap: () => ({ message: "Debes aceptar los estatutos" }) }),
  aceptaPrivacidad: z.literal(true, { errorMap: () => ({ message: "Debes aceptar la política de privacidad" }) }),
  aceptaCondiciones: z.literal(true, { errorMap: () => ({ message: "Debes aceptar las condiciones de afiliación" }) }),
});

// Validation schema for IBAN (Step 2)
const ibanSchema = z.object({
  iban: z.string().trim().min(1, "El IBAN es obligatorio").regex(
    /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,
    "Formato de IBAN inválido"
  ),
  titularCuenta: z.string().trim().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
});

type MembershipFormData = z.infer<typeof membershipSchema>;

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [isSubmittingIban, setIsSubmittingIban] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    dni: "",
    email: "",
    telefono: "",
    tipoPago: "mensual" as "mensual" | "anual",
    aceptaEstatutos: false,
    aceptaPrivacidad: false,
    aceptaCondiciones: false,
  });

  const [ibanData, setIbanData] = useState({
    iban: "",
    titularCuenta: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setIbanData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    const validationResult = membershipSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      toast({
        title: "Error de validación",
        description: "Por favor, revisa los campos marcados en rojo.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validData = validationResult.data;

      // Capture IP for consent proof
      let ipAddress = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip || '';
      } catch {
        console.warn('Could not fetch IP address');
      }

      const { data: insertedData, error } = await supabase.from("solicitudes_socio").insert({
        nombre: validData.nombre,
        apellidos: validData.apellidos,
        dni: validData.dni.toUpperCase(),
        email: validData.email,
        telefono: validData.telefono,
        tipo_pago: validData.tipoPago,
        ip_address: ipAddress,
        version_documento: '2025-02-14-v1',
      }).select('id').single();

      if (error) throw error;

      setSolicitudId(insertedData.id);

      // Send notification email to admin and confirmation to user
      supabase.functions.invoke('notify-new-solicitud', {
        body: {
          nombre: validData.nombre,
          apellidos: validData.apellidos,
          email: validData.email,
          dni: validData.dni.toUpperCase(),
          telefono: validData.telefono,
        },
      }).catch(err => console.error('Error sending notification:', err));

      toast({
        title: "¡Solicitud enviada!",
        description: "Ahora completa tus datos bancarios para finalizar el proceso.",
      });

      setStep(2);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIbanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    const validationResult = ibanSchema.safeParse(ibanData);
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    if (!solicitudId) return;

    setIsSubmittingIban(true);
    
    try {
      const validData = validationResult.data;
      const { error } = await supabase
        .from("solicitudes_socio")
        .update({
          iban: validData.iban.replace(/\s/g, '').toUpperCase(),
          titular_cuenta: validData.titularCuenta || null,
          iban_submitted_at: new Date().toISOString(),
        })
        .eq("id", solicitudId);

      if (error) throw error;

      toast({
        title: "¡Datos bancarios guardados!",
        description: "Tu solicitud está completa. Te notificaremos cuando la Junta resuelva.",
      });

      // Reset everything
      setFormData({
        nombre: "",
        apellidos: "",
        dni: "",
        email: "",
        telefono: "",
        tipoPago: "mensual",
        aceptaEstatutos: false,
        aceptaPrivacidad: false,
        aceptaCondiciones: false,
      });
      setIbanData({ iban: "", titularCuenta: "" });
      setStep(1);
      setSolicitudId(null);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos bancarios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingIban(false);
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
      <div className="h-1 bg-secondary" />
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
      <div className="h-1 bg-secondary" />
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Cuotas de Socio
            </h2>
            <p className="text-muted-foreground">
              Elige la modalidad de pago que prefieras
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            {/* Cuota Mensual */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-xl font-bold text-foreground mb-2">Pago Mensual</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">5€</span>
                <span className="text-muted-foreground">/ mes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cuota mensual domiciliada en tu cuenta bancaria.
              </p>
            </div>

            {/* Cuota Anual */}
            <div className="bg-card rounded-xl border-2 border-secondary p-6 relative">
              <div className="absolute -top-3 left-6 bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Ahorra 10€
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Pago Anual</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold text-secondary">50€</span>
                <span className="text-muted-foreground">/ año</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Equivale a <strong>4,16€/mes</strong>. Pago único anual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <div className="h-1 bg-secondary" />
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            {step === 1 ? (
              <>
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
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dni">DNI/NIE *</Label>
                        <Input
                          id="dni"
                          name="dni"
                          value={formData.dni}
                          onChange={handleInputChange}
                          placeholder="12345678A"
                          maxLength={9}
                          className={formErrors.dni ? "border-destructive" : ""}
                        />
                        {formErrors.dni && <p className="text-sm text-destructive">{formErrors.dni}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          type="tel"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          placeholder="600 000 000"
                          maxLength={20}
                          className={formErrors.telefono ? "border-destructive" : ""}
                        />
                        {formErrors.telefono && <p className="text-sm text-destructive">{formErrors.telefono}</p>}
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
                  </div>

                  {/* Pago */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Modalidad de Pago
                    </h3>
                    
                    <div className="space-y-3">
                      <Label>Elige tu modalidad de pago *</Label>
                      <RadioGroup 
                        value={formData.tipoPago} 
                        onValueChange={(value: "mensual" | "anual") => {
                          setFormData(prev => ({ ...prev, tipoPago: value }));
                          if (formErrors.tipoPago) {
                            setFormErrors(prev => ({ ...prev, tipoPago: "" }));
                          }
                        }}
                        className="grid gap-3 md:grid-cols-2"
                      >
                        <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${formData.tipoPago === 'mensual' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                          <RadioGroupItem value="mensual" id="mensual" />
                          <Label htmlFor="mensual" className="cursor-pointer flex-1">
                            <span className="font-semibold">Mensual</span>
                            <span className="text-muted-foreground ml-2">5€/mes</span>
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${formData.tipoPago === 'anual' ? 'border-secondary bg-secondary/5' : 'border-border hover:border-muted-foreground'}`}>
                          <RadioGroupItem value="anual" id="anual" />
                          <Label htmlFor="anual" className="cursor-pointer flex-1">
                            <span className="font-semibold">Anual</span>
                            <span className="text-muted-foreground ml-2">50€/año</span>
                            <span className="text-xs text-secondary ml-1">(ahorra 10€)</span>
                          </Label>
                        </div>
                      </RadioGroup>
                      {formErrors.tipoPago && <p className="text-sm text-destructive">{formErrors.tipoPago}</p>}
                    </div>
                  </div>

                  {/* Aceptaciones */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="aceptaEstatutos"
                          checked={formData.aceptaEstatutos}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("aceptaEstatutos", checked as boolean)
                          }
                          className={formErrors.aceptaEstatutos ? "border-destructive" : ""}
                        />
                        <Label htmlFor="aceptaEstatutos" className="text-sm text-muted-foreground leading-relaxed">
                          He leído y acepto los <a href="/documentos/estatutos-fundacionales.pdf" download className="text-primary hover:underline">estatutos</a> de la Asociación AHORA y me comprometo a cumplirlos. *
                        </Label>
                      </div>
                      {formErrors.aceptaEstatutos && <p className="text-sm text-destructive ml-6">{formErrors.aceptaEstatutos}</p>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="aceptaPrivacidad"
                          checked={formData.aceptaPrivacidad}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("aceptaPrivacidad", checked as boolean)
                          }
                          className={formErrors.aceptaPrivacidad ? "border-destructive" : ""}
                        />
                        <Label htmlFor="aceptaPrivacidad" className="text-sm text-muted-foreground leading-relaxed">
                          Acepto la <Link to="/politica-privacidad" className="text-primary hover:underline">política de privacidad</Link> y el tratamiento de mis datos personales para la gestión de mi condición de socio. *
                        </Label>
                      </div>
                      {formErrors.aceptaPrivacidad && <p className="text-sm text-destructive ml-6">{formErrors.aceptaPrivacidad}</p>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="aceptaCondiciones"
                          checked={formData.aceptaCondiciones}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("aceptaCondiciones", checked as boolean)
                          }
                          className={formErrors.aceptaCondiciones ? "border-destructive" : ""}
                        />
                        <Label htmlFor="aceptaCondiciones" className="text-sm text-muted-foreground leading-relaxed">
                          Acepto las <Link to="/condiciones-afiliacion" className="text-primary hover:underline">condiciones de afiliación y cuotas de socio</Link>, incluyendo la autorización de domiciliación bancaria SEPA. *
                        </Label>
                      </div>
                      {formErrors.aceptaCondiciones && <p className="text-sm text-destructive ml-6">{formErrors.aceptaCondiciones}</p>}
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
              </>
            ) : (
              <>
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    ¡Solicitud Enviada!
                  </h2>
                  <p className="text-muted-foreground">
                    Hemos notificado a la Junta Directiva. Mientras valoramos tu solicitud, completa tus datos bancarios:
                  </p>
                </div>

                <div className="bg-card rounded-2xl border-2 border-border shadow-lg overflow-hidden">
                  {/* Payment Gateway Header */}
                  <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 p-2 rounded-lg">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Domiciliación Bancaria</h3>
                        <p className="text-white/70 text-sm">Pago seguro mediante SEPA</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleIbanSubmit} className="p-6 space-y-6">
                    {/* Bank Info Notice */}
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">
                            Gestión de cobros con Banco Sabadell
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Todos los pagos se realizan mediante domiciliación bancaria SEPA, gestionados de forma segura a través de Banco Sabadell. Tus datos están protegidos bajo la normativa europea de protección de datos.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="iban" className="text-sm font-medium">IBAN de la cuenta bancaria *</Label>
                        <div className="relative">
                          <Input
                            id="iban"
                            name="iban"
                            value={ibanData.iban}
                            onChange={handleIbanChange}
                            placeholder="ES00 0000 0000 0000 0000 0000"
                            maxLength={34}
                            className={`h-12 text-base font-mono pl-4 ${formErrors.iban ? "border-destructive" : "border-border"}`}
                          />
                        </div>
                        {formErrors.iban && <p className="text-sm text-destructive">{formErrors.iban}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="titularCuenta" className="text-sm font-medium">Titular de la cuenta <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                        <Input
                          id="titularCuenta"
                          name="titularCuenta"
                          value={ibanData.titularCuenta}
                          onChange={handleIbanChange}
                          placeholder="Solo si es diferente al socio"
                          maxLength={200}
                          className={`h-12 ${formErrors.titularCuenta ? "border-destructive" : ""}`}
                        />
                        {formErrors.titularCuenta && <p className="text-sm text-destructive">{formErrors.titularCuenta}</p>}
                      </div>
                    </div>

                    <Button type="submit" size="xl" className="w-full" disabled={isSubmittingIban}>
                      {isSubmittingIban ? (
                        "Procesando..."
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Confirmar domiciliación
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center">
                        Conexión segura · Datos encriptados · Normativa SEPA
                      </p>
                    </div>
                  </form>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-6">
                  Si no puedes completar este paso ahora, te enviaremos un recordatorio por email con un enlace para hacerlo más tarde.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HazteSocio;
