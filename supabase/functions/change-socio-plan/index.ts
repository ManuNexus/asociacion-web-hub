import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_MENSUAL = "price_1TlZiSGds51tUOqDwqLQf1xQ";
const PRICE_ANUAL = "price_1TlZixGds51tUOqDZc30UxrY";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autenticado");

    const { nuevo_tipo } = await req.json();
    if (nuevo_tipo !== "mensual" && nuevo_tipo !== "anual") {
      throw new Error("nuevo_tipo inválido");
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

    const { data: socio, error } = await supabase
      .from("socios")
      .select("id, user_id, tipo_pago, stripe_subscription_id, metodo_pago_activo")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !socio) throw new Error("Socio no encontrado");
    if (socio.metodo_pago_activo !== "tarjeta" || !socio.stripe_subscription_id) {
      throw new Error("Necesitas tener una tarjeta activa para cambiar de plan");
    }
    if (socio.tipo_pago === nuevo_tipo) {
      throw new Error(`Ya tienes el plan ${nuevo_tipo}`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const newPrice = nuevo_tipo === "anual" ? PRICE_ANUAL : PRICE_MENSUAL;

    const sub = await stripe.subscriptions.retrieve(socio.stripe_subscription_id);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) throw new Error("Suscripción sin items");

    const updated = await stripe.subscriptions.update(socio.stripe_subscription_id, {
      items: [{ id: itemId, price: newPrice }],
      proration_behavior: "none",
      billing_cycle_anchor: "unchanged",
    });

    const proximo = updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null;

    await supabase
      .from("socios")
      .update({
        tipo_pago: nuevo_tipo,
        proximo_pago_tarjeta: proximo,
        estado_suscripcion_stripe: updated.status,
        ultima_sync_stripe: new Date().toISOString(),
      })
      .eq("id", socio.id);

    return new Response(
      JSON.stringify({
        ok: true,
        nuevo_tipo,
        proximo_pago: proximo,
        importe: nuevo_tipo === "anual" ? 50 : 5,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[change-socio-plan] ERROR", err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? "Error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
