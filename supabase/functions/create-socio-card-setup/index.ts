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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autenticado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Sesión inválida");
    const user = userData.user;
    console.log("[create-socio-card-setup] user", { id: user.id, email: user.email });

    let { data: socio, error } = await supabase
      .from("socios")
      .select("id, user_id, nombre, apellidos, email, stripe_customer_id, activo")
      .eq("user_id", user.id)
      .maybeSingle();
    console.log("[create-socio-card-setup] socio lookup by user_id", { found: !!socio, err: error?.message });

    if (error) throw new Error(`Error buscando socio: ${error.message}`);
    if (!socio && user.email) {
      const { data: byEmail } = await supabase
        .from("socios")
        .select("id, user_id, nombre, apellidos, email, stripe_customer_id, activo")
        .ilike("email", user.email)
        .maybeSingle();
      if (byEmail) {
        console.log("[create-socio-card-setup] linking socio by email", byEmail.id);
        await supabase.from("socios").update({ user_id: user.id }).eq("id", byEmail.id);
        socio = byEmail;
      }
    }
    if (!socio) throw new Error("Tu cuenta no está vinculada a un registro de socio. Contacta con la Junta.");
    if (!socio.activo) throw new Error("Tu cuenta de socio no está activa");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    let customerId = socio.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: socio.email,
        name: `${socio.nombre} ${socio.apellidos}`.trim(),
        metadata: { socio_id: socio.id },
      });
      customerId = customer.id;
      await supabase
        .from("socios")
        .update({ stripe_customer_id: customerId })
        .eq("id", socio.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${ORIGIN}/socios/tarjeta-confirmada?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ORIGIN}/socios?card_cancelled=1`,
      locale: "es",
      metadata: { socio_id: socio.id, user_id: user.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[create-socio-card-setup] ERROR", err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? "Error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
