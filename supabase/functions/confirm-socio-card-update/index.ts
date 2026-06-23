import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_PRICE_MENSUAL = "price_1TlZiSGds51tUOqDwqLQf1xQ";
const STRIPE_PRICE_ANUAL = "price_1TlZixGds51tUOqDZc30UxrY";

function calcularProximoCobroUnix(
  tipoPago: string,
  diaCobro: number,
  fechaAlta: Date
): number {
  const dia = Math.min(Math.max(diaCobro || 1, 1), 28);
  const ahora = new Date();
  const minimo = new Date(ahora.getTime() + 24 * 60 * 60 * 1000); // +24h

  let proxima: Date;
  if (tipoPago === "anual") {
    const mesAlta = fechaAlta.getMonth();
    proxima = new Date(ahora.getFullYear(), mesAlta, dia, 9, 0, 0);
    if (proxima <= minimo) {
      proxima = new Date(ahora.getFullYear() + 1, mesAlta, dia, 9, 0, 0);
    }
  } else {
    proxima = new Date(ahora.getFullYear(), ahora.getMonth(), dia, 9, 0, 0);
    if (proxima <= minimo) {
      proxima = new Date(ahora.getFullYear(), ahora.getMonth() + 1, dia, 9, 0, 0);
    }
  }
  return Math.floor(proxima.getTime() / 1000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autenticado");

    const { session_id } = await req.json();
    if (!session_id || typeof session_id !== "string") {
      throw new Error("session_id requerido");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Sesión inválida");
    const user = userData.user;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["setup_intent"],
    });

    const socioId = session.metadata?.socio_id;
    if (!socioId) throw new Error("Falta socio_id en metadata");

    const { data: socio, error } = await supabase
      .from("socios")
      .select(
        "id, user_id, tipo_pago, dia_cobro, fecha_alta, stripe_customer_id, stripe_subscription_id"
      )
      .eq("id", socioId)
      .maybeSingle();

    if (error || !socio) throw new Error("Socio no encontrado");
    if (socio.user_id !== user.id) throw new Error("No autorizado");

    const setupIntent = session.setup_intent as Stripe.SetupIntent | null;
    if (!setupIntent || setupIntent.status !== "succeeded") {
      throw new Error("La tarjeta no se ha registrado correctamente");
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;
    if (!paymentMethodId) throw new Error("Falta payment_method");

    const customerId =
      socio.stripe_customer_id ??
      (typeof session.customer === "string" ? session.customer : session.customer?.id);
    if (!customerId) throw new Error("Falta customer");

    // Attach + set default
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    } catch (_e) {
      // Already attached
    }
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Cancel previous subscription if any
    if (socio.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(socio.stripe_subscription_id);
      } catch (e: any) {
        console.warn("No se pudo cancelar suscripción previa:", e?.message);
      }
    }

    // Create new subscription anchored to next billing date
    const tipoPago = socio.tipo_pago || "mensual";
    const fechaAlta = socio.fecha_alta ? new Date(socio.fecha_alta) : new Date();
    const anchor = calcularProximoCobroUnix(tipoPago, socio.dia_cobro ?? 1, fechaAlta);
    const priceId = tipoPago === "anual" ? STRIPE_PRICE_ANUAL : STRIPE_PRICE_MENSUAL;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      trial_end: anchor,
      proration_behavior: "none",
      metadata: { socio_id: socio.id },
    });

    // Fetch card details
    let brand: string | null = null;
    let last4: string | null = null;
    try {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      brand = pm.card?.brand ?? null;
      last4 = pm.card?.last4 ?? null;
    } catch (_e) {
      // ignore
    }

    const { error: updErr } = await supabase
      .from("socios")
      .update({
        stripe_customer_id: customerId,
        stripe_payment_method_id: paymentMethodId,
        stripe_setup_intent_id: setupIntent.id,
        stripe_subscription_id: subscription.id,
        tarjeta_lista: true,
        metodo_pago_activo: "tarjeta",
        tarjeta_brand: brand,
        tarjeta_last4: last4,
      })
      .eq("id", socio.id);

    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({
        ok: true,
        next_charge: new Date(anchor * 1000).toISOString(),
        brand,
        last4,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[confirm-socio-card-update] ERROR", err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? "Error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
