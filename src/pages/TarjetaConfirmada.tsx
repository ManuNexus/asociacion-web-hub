import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TarjetaConfirmada = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Falta el identificador de sesión.");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "confirm-socio-payment-method",
          { body: { session_id: sessionId } }
        );
        if (error || data?.error) throw new Error(data?.error || "Error");
        setStatus("ok");
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e?.message || "No se pudo confirmar la tarjeta.");
      }
    })();
  }, [sessionId]);

  return (
    <Layout>
      <SEO title="Tarjeta registrada" description="Confirmación de registro de tarjeta" canonical="/hazte-socio/tarjeta-confirmada" />
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
              <p className="text-muted-foreground mb-6">
                Hemos guardado tu método de pago de forma segura. <strong>No se ha realizado ningún cargo todavía.</strong>
                La Junta Directiva revisará tu solicitud en los próximos días y, si es aprobada, se procesará el primer cobro de tu cuota.
                Si no es aprobada, no se cobrará nada.
              </p>
              <Button asChild>
                <Link to="/">Volver al inicio</Link>
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
                <Link to="/hazte-socio">Volver al formulario</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default TarjetaConfirmada;
