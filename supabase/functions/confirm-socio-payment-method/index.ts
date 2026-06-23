import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id || typeof session_id !== "string") {
      throw new Error("session_id requerido");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["setup_intent"],
    });

    const solicitudId = session.metadata?.solicitud_id;
    if (!solicitudId) throw new Error("metadata.solicitud_id no encontrado");

    const setupIntent = session.setup_intent as Stripe.SetupIntent | null;
    if (!setupIntent || setupIntent.status !== "succeeded") {
      throw new Error("La tarjeta no se ha registrado correctamente");
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    if (!paymentMethodId) throw new Error("Falta payment_method");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase
      .from("solicitudes_socio")
      .update({
        stripe_setup_intent_id: setupIntent.id,
        stripe_payment_method_id: paymentMethodId,
        tarjeta_lista: true,
      })
      .eq("id", solicitudId);

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[confirm-socio-payment-method] ERROR", err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? "Error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
