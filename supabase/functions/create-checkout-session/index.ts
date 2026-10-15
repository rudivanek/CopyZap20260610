import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Opens a Stripe Checkout page for one CopyZap credit pack.
// Only signed-in users who may use the paywall (admins, testers, or everyone once
// app_settings.paywall_public = 'true') get a checkout link. Credits are added later
// by the stripe-webhook function, never here.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeKey) return json({ error: "Payments are not set up yet." }, 503);
    const isLiveKey = stripeKey.startsWith("sk_live_") || stripeKey.startsWith("rk_live_");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in first." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Client acting as the signed-in user (needed so is_app_admin() and auth.uid() work)
    const asUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await asUser.auth.getUser();
    if (userError || !user) return json({ error: "Please sign in first." }, 401);

    const { data: allowed, error: allowedError } = await asUser.rpc("can_use_paywall");
    if (allowedError) {
      console.error("can_use_paywall failed:", allowedError);
      return json({ error: "Please try again in a moment." }, 503);
    }
    if (allowed !== true) return json({ error: "Buying credits is not available yet." }, 403);

    let body: { pack_key?: string } = {};
    try { body = await req.json(); } catch { /* empty body */ }
    const packKey = typeof body.pack_key === "string" ? body.pack_key : "";

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: pack, error: packError } = await admin
      .from("credit_packs")
      .select("pack_key, pack_name, credits, stripe_price_id_test, stripe_price_id_live, is_active")
      .eq("pack_key", packKey)
      .maybeSingle();
    if (packError) {
      console.error("credit_packs read failed:", packError);
      return json({ error: "Please try again in a moment." }, 503);
    }
    if (!pack || !pack.is_active) return json({ error: "This pack is not available." }, 400);

    const priceId = isLiveKey ? pack.stripe_price_id_live : pack.stripe_price_id_test;
    if (!priceId) {
      console.error(`No ${isLiveKey ? "live" : "test"} Stripe price set for pack ${pack.pack_key}`);
      return json({ error: "This pack is not available yet." }, 503);
    }

    const appUrl = (Deno.env.get("APP_URL") ?? "https://app.copyzap.app").replace(/\/$/, "");

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("client_reference_id", user.id);
    if (user.email) form.set("customer_email", user.email);
    form.set("metadata[user_id]", user.id);
    form.set("metadata[pack_key]", pack.pack_key);
    form.set("payment_intent_data[metadata][user_id]", user.id);
    form.set("payment_intent_data[metadata][pack_key]", pack.pack_key);
    form.set("allow_promotion_codes", "true");
    form.set("success_url", `${appUrl}/buy?status=success&session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${appUrl}/buy?status=cancelled`);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok || !session?.url) {
      console.error("Stripe checkout error:", stripeRes.status, JSON.stringify(session?.error ?? session));
      return json({ error: "The payment page could not be opened. Please try again." }, 502);
    }

    console.log(`Checkout opened: user ${user.id}, pack ${pack.pack_key}, session ${session.id}`);
    return json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session failed:", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
