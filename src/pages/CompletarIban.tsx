import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ibanSchema = z.object({
  iban: z.string().trim().min(1, "El IBAN es obligatorio").regex(
    /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,
    "Formato de IBAN inválido"
  ),
  titularCuenta: z.string().trim().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
});

const CompletarIban = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const solicitudId = searchParams.get("id");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<{ nombre: string; apellidos: string; email: string } | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    iban: "",
    titularCuenta: "",
  });

  useEffect(() => {
    const fetchSolicitud = async () => {
      if (!solicitudId) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("solicitudes_socio")
        .select("nombre, apellidos, email, iban")
        .eq("id", solicitudId)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else if (data.iban) {
        setAlreadyCompleted(true);
        setSolicitud(data);
      } else {
        setSolicitud(data);
      }
      setIsLoading(false);
    };

    fetchSolicitud();
  }, [solicitudId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    const validationResult = ibanSchema.safeParse(formData);
    
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

    setIsSubmitting(true);
    
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
        description: "Hemos registrado tu IBAN correctamente. Te notificaremos cuando la Junta resuelva tu solicitud.",
      });

      setAlreadyCompleted(true);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-4">Solicitud no encontrada</h1>
              <p className="text-muted-foreground mb-6">
                El enlace no es válido o la solicitud ya no existe.
              </p>
              <Button onClick={() => navigate("/hazte-socio")}>
                Ir al formulario de alta
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (alreadyCompleted) {
    return (
      <Layout>
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-4">¡Datos bancarios registrados!</h1>
              <p className="text-muted-foreground mb-6">
                Ya tenemos tus datos de domiciliación bancaria. La Junta Directiva valorará tu solicitud y te comunicaremos la resolución por email.
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Volver al inicio
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Domiciliación Bancaria
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Completa tu solicitud añadiendo los datos de tu cuenta bancaria.
            </p>
          </div>
        </div>
      </section>

      <div className="h-1 bg-secondary" />
      
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
              <p className="text-muted-foreground text-sm mb-2">Solicitud de:</p>
              <p className="font-semibold text-foreground">{solicitud?.nombre} {solicitud?.apellidos}</p>
              <p className="text-sm text-muted-foreground">{solicitud?.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Datos Bancarios
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN de la cuenta bancaria *</Label>
                  <Input
                    id="iban"
                    name="iban"
                    value={formData.iban}
                    onChange={handleInputChange}
                    placeholder="ES00 0000 0000 0000 0000 0000"
                    maxLength={34}
                    className={formErrors.iban ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cuenta donde se domiciliará el cobro de la cuota
                  </p>
                  {formErrors.iban && <p className="text-sm text-destructive">{formErrors.iban}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titularCuenta">Titular de la cuenta (si es diferente al socio)</Label>
                  <Input
                    id="titularCuenta"
                    name="titularCuenta"
                    value={formData.titularCuenta}
                    onChange={handleInputChange}
                    placeholder="Nombre completo del titular"
                    maxLength={200}
                    className={formErrors.titularCuenta ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Déjalo en blanco si eres el titular de la cuenta
                  </p>
                  {formErrors.titularCuenta && <p className="text-sm text-destructive">{formErrors.titularCuenta}</p>}
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Guardando..."
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Guardar datos bancarios
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CompletarIban;
