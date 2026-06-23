import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ORIGIN = "https://ahoraorg.es";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { solicitud_id } = await req.json();
    if (!solicitud_id || typeof solicitud_id !== "string") {
      throw new Error("solicitud_id requerido");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: sol, error } = await supabase
      .from("solicitudes_socio")
      .select("id, nombre, apellidos, email, dni, tipo_pago, metodo_pago, created_at, stripe_customer_id")
      .eq("id", solicitud_id)
      .single();

    if (error || !sol) throw new Error("Solicitud no encontrada");
    if (sol.metodo_pago !== "tarjeta") throw new Error("Esta solicitud no es de pago con tarjeta");

    const ageSec = (Date.now() - new Date(sol.created_at).getTime()) / 1000;
    if (ageSec > 60 * 60 * 24) throw new Error("Solicitud caducada (más de 24h)");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    // Reuse existing customer if any, otherwise create one
    let customerId = sol.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: sol.email,
        name: `${sol.nombre} ${sol.apellidos}`.trim(),
        metadata: { solicitud_id: sol.id, dni: sol.dni, tipo_pago: sol.tipo_pago },
      });
      customerId = customer.id;
      await supabase
        .from("solicitudes_socio")
        .update({ stripe_customer_id: customerId })
        .eq("id", sol.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${ORIGIN}/hazte-socio/tarjeta-confirmada?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ORIGIN}/hazte-socio?cancelled=1`,
      locale: "es",
      metadata: { solicitud_id: sol.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[create-socio-setup] ERROR", err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? "Error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
