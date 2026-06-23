import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO, breadcrumbSchema } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Copy, CheckCircle2, CreditCard, Landmark, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AMOUNTS = [20, 40, 50] as const;
const MIN_AMOUNT = 1;
const BANK_ACCOUNT = "ES82 0081 0057 3500 0307 5110";
const BENEFICIARY = "Asociación AHORA";
const BIC_SWIFT = "BSAB ESBB";
const CONCEPT = "Donación puntual - Asociación AHORA";

const Dona = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "cancel" | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success" || status === "cancel") {
      setPaymentStatus(status);
      // Clean URL
      searchParams.delete("status");
      searchParams.delete("session_id");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const isCustom = selectedAmount === null && customAmount !== "";

  const finalAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.,]/g, "");
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  const isBelowMinimum = finalAmount > 0 && finalAmount < MIN_AMOUNT;

  const validateAmount = () => {
    if (finalAmount <= 0) {
      toast({
        title: "Selecciona una cantidad",
        description: "Por favor, elige o introduce una cantidad para donar.",
        variant: "destructive",
      });
      return false;
    }
    if (finalAmount < MIN_AMOUNT) {
      toast({
        title: "Cantidad mínima no alcanzada",
        description: `Debido a las comisiones bancarias, no podemos aceptar donaciones inferiores a ${MIN_AMOUNT}€.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleDonateBank = () => {
    if (!validateAmount()) return;
    setShowBankDetails(true);
  };

  const handleDonateCard = async () => {
    if (!validateAmount()) return;
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: { amount: finalAmount },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No se pudo iniciar el pago.");
      const win = window.open(data.url, "_blank", "noopener,noreferrer");
      if (!win) {
        // Popup bloqueado o iframe restringido: navega en el mismo contexto
        window.top ? (window.top.location.href = data.url) : (window.location.href = data.url);
      }
      setStripeLoading(false);
    } catch (err) {
      toast({
        title: "Error al iniciar el pago",
        description: err instanceof Error ? err.message : "Inténtalo de nuevo en unos minutos.",
        variant: "destructive",
      });
      setStripeLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado`, description: text });
  };

  if (paymentStatus === "success") {
    return (
      <Layout>
        <SEO title="Donación recibida" description="Gracias por tu donación a AHORA." canonical="/dona" noindex />
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-lg mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-secondary" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground">¡Gracias por tu donación!</h1>
              <p className="text-muted-foreground">
                Hemos recibido tu donación correctamente. Recibirás un email de confirmación de Stripe en breve.
              </p>
              <Button onClick={() => setPaymentStatus(null)}>Volver</Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }


  if (showBankDetails) {
    return (
      <Layout>
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-lg mx-auto text-center space-y-8">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-secondary" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground">
                ¡Gracias por tu generosidad!
              </h1>
              <p className="text-muted-foreground">
                Para completar tu donación de <strong className="text-foreground">{finalAmount.toFixed(2)} €</strong>, realiza una transferencia bancaria con los siguientes datos:
              </p>

              <div className="bg-card rounded-xl border border-border p-6 text-left space-y-5">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Beneficiario</Label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{BENEFICIARY}</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BENEFICIARY, "Beneficiario")} className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Cuenta bancaria (IBAN)</Label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-foreground text-lg">{BANK_ACCOUNT}</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BANK_ACCOUNT.replace(/\s/g, ""), "IBAN")} className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">BIC/SWIFT</Label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-foreground">{BIC_SWIFT}</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BIC_SWIFT.replace(/\s/g, ""), "BIC/SWIFT")} className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Concepto</Label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{CONCEPT}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(CONCEPT, "Concepto")}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Cantidad</Label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground text-lg">{finalAmount.toFixed(2)} €</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(finalAmount.toFixed(2), "Cantidad")} className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Una vez realizada la transferencia, la recibiremos en nuestras cuentas. No necesitas hacer nada más. ¡Muchas gracias!
              </p>

              <Button
                variant="outline"
                onClick={() => {
                  setShowBankDetails(false);
                  setSelectedAmount(null);
                  setCustomAmount("");
                }}
              >
                Hacer otra donación
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Dona"
        description="Haz una donación a AHORA y contribuye a la defensa de los valores constitucionales y la democracia en España. Donación mínima de 1€."
        canonical="/dona"
        jsonLd={breadcrumbSchema([
          { name: "Inicio", url: "/" },
          { name: "Dona", url: "/dona" },
        ])}
      />
      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Dona
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Tu aportación nos ayuda a seguir defendiendo los valores constitucionales y democráticos. Cada euro cuenta.
            </p>
          </div>
        </div>
      </section>

      <div className="h-1 bg-secondary" />

      {/* Selector de cantidad */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-lg mx-auto text-center space-y-10">
            <div>
              <Heart className="h-10 w-10 text-secondary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Elige la cantidad
              </h2>
              <p className="text-muted-foreground">
                Selecciona una de las cantidades predefinidas o introduce la que desees.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleSelectAmount(amount)}
                  className={`rounded-xl border-2 p-6 text-center transition-all ${
                    selectedAmount === amount
                      ? "border-secondary bg-secondary/10 ring-2 ring-secondary/30"
                      : "border-border hover:border-secondary/50"
                  }`}
                >
                  <span className="text-3xl font-extrabold text-foreground">{amount}€</span>
                </button>
              ))}

              {/* Custom amount */}
              <div
                className={`rounded-xl border-2 p-4 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                  isCustom
                    ? "border-secondary bg-secondary/10 ring-2 ring-secondary/30"
                    : "border-border"
                }`}
              >
                <Label className="text-sm text-muted-foreground">Otra cantidad</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={handleCustomChange}
                    placeholder="0"
                    className="w-28 text-center text-3xl font-extrabold border-none bg-transparent focus-visible:ring-0 p-0 h-auto"
                  />
                  <span className="text-3xl font-extrabold text-foreground">€</span>
                </div>
              </div>
            </div>

            {isBelowMinimum && isCustom && (
              <p className="text-sm text-destructive font-medium text-center">
                Debido a las comisiones bancarias, no podemos aceptar donaciones inferiores a {MIN_AMOUNT}€.
              </p>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleDonateCard}
                disabled={finalAmount <= 0 || stripeLoading}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-lg py-6"
              >
                {stripeLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Donar con tarjeta {finalAmount > 0 ? `${finalAmount.toFixed(2)} €` : ""}
                  </>
                )}
              </Button>

              <Button
                onClick={handleDonateBank}
                disabled={finalAmount <= 0 || stripeLoading}
                variant="outline"
                className="w-full font-semibold text-lg py-6"
              >
                <Landmark className="h-5 w-5 mr-2" />
                Donar por transferencia
              </Button>
            </div>

            {paymentStatus === "cancel" && (
              <p className="text-sm text-muted-foreground text-center">
                Has cancelado el pago. Puedes intentarlo de nuevo cuando quieras.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              El pago con tarjeta se procesa de forma segura a través de Stripe. La transferencia bancaria es una alternativa sin comisiones.
            </p>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Dona;
