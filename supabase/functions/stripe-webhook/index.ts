import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Stripe calls this after a payment. It must be deployed with verify_jwt = false,
// because Stripe does not send a Supabase login. Instead, every call is checked
// against STRIPE_WEBHOOK_SECRET. Credits are added once per checkout session:
// grant_purchased_credits() ignores a session it has already handled.

const TOLERANCE_SECONDS = 300;

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k?.trim() === "t") timestamp = (v ?? "").trim();
    if (k?.trim() === "v1" && v) signatures.push(v.trim());
  }
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const expected = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
  return signatures.some((s) => safeEqual(s, expected));
}

function reply(status: number, message: string) {
  return new Response(JSON.stringify({ message }), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, "Method not allowed");

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return reply(500, "Not configured");
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  if (!(await verifyStripeSignature(payload, signature, secret))) {
    console.warn("Rejected webhook call: bad or missing Stripe signature");
    return reply(400, "Invalid signature");
  }

  let event: any;
  try { event = JSON.parse(payload); } catch { return reply(400, "Invalid JSON"); }

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  const type: string = event?.type ?? "";
  const session = event?.data?.object ?? {};

  // Card payments arrive paid in checkout.session.completed.
  // OXXO and bank transfers complete later, in checkout.session.async_payment_succeeded.
  const isPaid =
    (type === "checkout.session.completed" && session.payment_status === "paid") ||
    type === "checkout.session.async_payment_succeeded";

  if (isPaid) {
    const userId: string = session.metadata?.user_id || session.client_reference_id || "";
    const packKey: string = session.metadata?.pack_key || "";
    if (!userId || !packKey) {
      console.error(`Paid session ${session.id} has no user or pack — needs a manual check`);
      return reply(200, "Missing user or pack");
    }

    const { data: added, error } = await supabase.rpc("grant_purchased_credits", {
      p_user_id: userId,
      p_pack_key: packKey,
      p_session_id: session.id,
      p_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      p_amount_total: session.amount_total ?? null,
      p_currency: session.currency ?? null,
      p_livemode: !!event.livemode,
    });
    if (error) {
      // 500 makes Stripe retry the event later, so a paying customer is never left without credits.
      console.error(`Adding credits failed for session ${session.id}:`, error);
      return reply(500, "Could not add credits");
    }
    console.log(added
      ? `Credits added: user ${userId}, pack ${packKey}, session ${session.id}`
      : `Session ${session.id} was already handled — no credits added again`);
  } else if (type === "checkout.session.async_payment_failed") {
    console.log(`Delayed payment failed for session ${session.id} (no credits added)`);
  }

  const { error: logError } = await supabase
    .from("stripe_events")
    .upsert({ event_id: event.id, event_type: type }, { onConflict: "event_id", ignoreDuplicates: true });
  if (logError) console.error("stripe_events log failed (non-fatal):", logError);

  return reply(200, "ok");
});
