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

    // Authorization: admin OR junta (presidente/tesorero)
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    const { data: isContable } = await supabase.rpc("has_cargo_contable", {
      _user_id: user.id,
    });
    if (!isAdmin && !isContable) throw new Error("No autorizado");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    // Allow syncing a single socio if id provided, otherwise all with stripe_subscription_id
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {}
    const onlySocioId: string | undefined = body?.socio_id;

    let query = supabase
      .from("socios")
      .select("id, stripe_subscription_id, stripe_customer_id")
      .not("stripe_subscription_id", "is", null);
    if (onlySocioId) query = query.eq("id", onlySocioId);

    const { data: socios, error: soErr } = await query;
    if (soErr) throw soErr;

    const results: any[] = [];

    for (const s of socios ?? []) {
      try {
        const sub = await stripe.subscriptions.retrieve(s.stripe_subscription_id!);
        const estado = sub.status; // active, trialing, past_due, canceled, unpaid, incomplete...
        // En la API actual, current_period_end vive en el item, no en la suscripción.
        const periodEnd =
          (sub as any).current_period_end ??
          sub.items?.data?.[0]?.current_period_end ??
          (sub as any).trial_end ??
          null;
        const proximo = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

        // Get last successful payment
        let ultimo: string | null = null;
        try {
          const invoices = await stripe.invoices.list({
            subscription: s.stripe_subscription_id!,
            status: "paid",
            limit: 1,
          });
          const inv = invoices.data[0];
          if (inv?.status_transitions?.paid_at) {
            ultimo = new Date(inv.status_transitions.paid_at * 1000).toISOString();
          } else if (inv?.created) {
            ultimo = new Date(inv.created * 1000).toISOString();
          }
        } catch (_e) {
          // ignore
        }

        const alCorriente = ["active", "trialing"].includes(estado);

        await supabase
          .from("socios")
          .update({
            estado_suscripcion_stripe: estado,
            ultimo_pago_tarjeta: ultimo,
            proximo_pago_tarjeta: proximo,
            ultima_sync_stripe: new Date().toISOString(),
            al_corriente_pago: alCorriente,
          })
          .eq("id", s.id);

        results.push({ id: s.id, estado, ultimo, proximo });
      } catch (e: any) {
        console.warn("[sync-stripe-socios] error socio", s.id, e?.message);
        results.push({ id: s.id, error: e?.message });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, total: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[sync-stripe-socios] ERROR", err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? "Error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
