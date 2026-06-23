import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawAmount = Number(body?.amount);
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!Number.isFinite(rawAmount) || rawAmount < MIN_AMOUNT || rawAmount > MAX_AMOUNT) {
      return new Response(
        JSON.stringify({ error: `Importe inválido. Mínimo ${MIN_AMOUNT}€.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const amountCents = Math.round(rawAmount * 100);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://ahoraorg.es";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: "Donación a Asociación AHORA",
              description: "Donación puntual para apoyar la actividad de la asociación.",
            },
          },
        },
      ],
      submit_type: "donate",
      metadata: { type: "donation_one_off" },
      success_url: `${origin}/dona?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dona?status=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-donation error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Error inesperado" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
