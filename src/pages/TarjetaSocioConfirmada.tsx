import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatInMadrid } from "@/lib/timezone";

const TarjetaSocioConfirmada = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [nextCharge, setNextCharge] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<{ brand?: string | null; last4?: string | null }>({});

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Falta el identificador de sesión.");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "confirm-socio-card-update",
          { body: { session_id: sessionId } }
        );
        if (error || data?.error) throw new Error(data?.error || error?.message || "Error");
        setNextCharge(data?.next_charge ?? null);
        setCardInfo({ brand: data?.brand, last4: data?.last4 });
        setStatus("ok");
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e?.message || "No se pudo confirmar la tarjeta.");
      }
    })();
  }, [sessionId]);

  return (
    <Layout>
      <SEO
        title="Tarjeta registrada"
        description="Confirmación de actualización de método de pago"
        canonical="/socios/tarjeta-confirmada"
      />
      <section className="py-20">
        <div className="container max-w-xl text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Confirmando tu tarjeta…</p>
            </>
          )}

          {status === "ok" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold mb-3">¡Tarjeta registrada!</h1>
              <p className="text-muted-foreground mb-2">
                Tu método de pago se ha actualizado a tarjeta de crédito/débito.
                {cardInfo.brand && cardInfo.last4 && (
                  <> ({cardInfo.brand.toUpperCase()} •••• {cardInfo.last4})</>
                )}
              </p>
              {nextCharge && (
                <p className="text-foreground font-medium mb-6">
                  Primer cobro: <strong>{formatInMadrid(nextCharge, "d 'de' MMMM yyyy")}</strong>
                </p>
              )}
              <Button asChild>
                <Link to="/socios">Volver a mi panel</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold mb-3">No hemos podido confirmar tu tarjeta</h1>
              <p className="text-muted-foreground mb-6">{errorMsg}</p>
              <Button asChild variant="outline">
                <Link to="/socios">Volver al panel</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default TarjetaSocioConfirmada;
