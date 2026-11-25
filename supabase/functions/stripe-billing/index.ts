// Supabase Edge Function: stripe-billing
// Handles Stripe Checkout Session creation, Stripe Customer Portal creation,
// and cryptographically verified, idempotent Stripe Webhook processing.
// Required secrets for live payments:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, APP_SITE_URL,
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_SITE_URL") ?? "null",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  webhookSecret: string,
  toleranceSec = 300,
): Promise<boolean> {
  if (!sigHeader || !webhookSecret) return false;
  let timestamp = 0;
  const signatures: string[] = [];
  for (const part of sigHeader.split(",")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t") timestamp = Number(v);
    else if (k === "v1" && v) signatures.push(v);
  }
  if (!Number.isFinite(timestamp) || timestamp <= 0 || signatures.length === 0) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestamp) > toleranceSec) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const macBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = new Uint8Array(macBuf);

  for (const hex of signatures) {
    const candidate = hexToBytes(hex);
    if (candidate && constantTimeEqual(expected, candidate)) return true;
  }
  return false;
}

async function stripeRequest(
  secretKey: string,
  method: "GET" | "POST",
  path: string,
  params?: Record<string, string>,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const url = `https://api.stripe.com${path}`;
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
  };
  if (method === "POST" && params) {
    init.body = new URLSearchParams(params).toString();
  }
  const resp = await fetch(url, init);
  let data: Record<string, unknown> = {};
  try {
    data = await resp.json();
  } catch {
    data = {};
  }
  return { ok: resp.ok, status: resp.status, data };
}

function getPriceConfig() {
  return {
    monthly: (Deno.env.get("STRIPE_PRICE_MONTHLY") ?? "").trim(),
    yearly: (Deno.env.get("STRIPE_PRICE_YEARLY") ?? "").trim(),
  };
}

function extractUserId(obj: Record<string, unknown> | undefined): string | null {
  if (!obj) return null;
  const meta = (obj.metadata as Record<string, unknown> | undefined) ?? {};
  const raw = (typeof obj.client_reference_id === "string" && obj.client_reference_id) ||
    (typeof meta.supabase_user_id === "string" && meta.supabase_user_id) ||
    "";
  return /^[0-9a-f-]{36}$/i.test(raw) ? raw : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const stripeKey = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim();
  const webhookSecret = (Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "").trim();

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /* ---------- Path A: Server-to-Server Stripe Webhook ---------- */
  const stripeSig = req.headers.get("stripe-signature");
  const reqUrl = new URL(req.url);
  if (stripeSig || reqUrl.pathname.endsWith("/webhook")) {
    if (!stripeSig || !webhookSecret) {
      return json({ error: "Webhook signature verification unavailable" }, 401);
    }
    const rawBody = await req.text();
    const valid = await verifyStripeSignature(rawBody, stripeSig, webhookSecret);
    if (!valid) {
      return json({ error: "Invalid Stripe webhook signature" }, 400);
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON payload" }, 400);
    }

    const eventId = typeof event.id === "string" ? event.id : "";
    const eventType = typeof event.type === "string" ? event.type : "";
    const obj = ((event.data as Record<string, unknown> | undefined)?.object as Record<string, unknown> | undefined) ?? {};

    let uid = extractUserId(obj);
    const customerId = typeof obj.customer === "string" ? obj.customer : null;
    let subscriptionId: string | null = null;
    let status = "inactive";
    let periodEndIso: string | null = null;

    if (eventType === "checkout.session.completed") {
      subscriptionId = typeof obj.subscription === "string" ? obj.subscription : null;
      if (subscriptionId && stripeKey) {
        const subRes = await stripeRequest(stripeKey, "GET", `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`);
        if (subRes.ok) {
          uid = uid ?? extractUserId(subRes.data);
          status = typeof subRes.data.status === "string" ? subRes.data.status : "active";
          const endUnix = Number(subRes.data.current_period_end || 0);
          if (Number.isFinite(endUnix) && endUnix > 0) {
            periodEndIso = new Date(endUnix * 1000).toISOString();
          }
        }
      } else if (obj.payment_status === "paid") {
        status = "active";
        periodEndIso = new Date(Date.now() + 31 * 86400000).toISOString();
      }
    } else if (
      eventType === "customer.subscription.created" ||
      eventType === "customer.subscription.updated" ||
      eventType === "customer.subscription.deleted"
    ) {
      subscriptionId = typeof obj.id === "string" ? obj.id : null;
      status = eventType === "customer.subscription.deleted"
        ? "deleted"
        : (typeof obj.status === "string" ? obj.status : "inactive");
      const endUnix = Number(obj.current_period_end || 0);
      if (Number.isFinite(endUnix) && endUnix > 0) {
        periodEndIso = new Date(endUnix * 1000).toISOString();
      }
    } else if (eventType === "invoice.payment_failed") {
      subscriptionId = typeof obj.subscription === "string" ? obj.subscription : null;
      status = "past_due";
    } else {
      return json({ received: true, ignored: true, type: eventType });
    }

    const { data, error } = await admin.rpc("sync_stripe_entitlement", {
      p_event_id: eventId,
      p_event_type: eventType,
      p_user_id: uid,
      p_customer_id: customerId,
      p_subscription_id: subscriptionId,
      p_status: status,
      p_current_period_end: periodEndIso,
    });
    if (error) {
      return json({ error: "Could not persist Stripe entitlement update" }, 500);
    }
    return json({ received: true, ...(data || {}) });
  }

  /* ---------- Path B: Browser User Checkout & Customer Portal ---------- */
  const origin = req.headers.get("origin");
  const allowedOrigin = Deno.env.get("APP_SITE_URL");
  if (!allowedOrigin || origin !== allowedOrigin) {
    return json({ error: "Origin not allowed" }, 403);
  }

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "Sign-in required" }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401);
  const user = userData.user;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const prices = getPriceConfig();
  const stripeEnabled = Boolean(stripeKey && (prices.monthly || prices.yearly));

  if (body.action === "billing_config") {
    const { data: ent } = await admin
      .from("user_entitlements")
      .select("stripe_customer_id,stripe_subscription_status,source")
      .eq("user_id", user.id)
      .maybeSingle();
    return json({
      ok: true,
      stripe_enabled: stripeEnabled,
      plans: {
        monthly: Boolean(prices.monthly),
        yearly: Boolean(prices.yearly),
      },
      has_portal: Boolean(stripeKey && ent?.stripe_customer_id),
      subscription_status: ent?.stripe_subscription_status ?? null,
    });
  }

  if (!stripeKey) {
    return json({ error: "stripe_not_configured", code: "stripe_not_configured" }, 503);
  }

  const baseSite = allowedOrigin.replace(/\/+$/, "");

  if (body.action === "create_checkout") {
    const plan = body.plan === "yearly" ? "yearly" : (body.plan === "monthly" ? "monthly" : "");
    if (!plan) return json({ error: "plan must be 'monthly' or 'yearly'" }, 400);
    const priceId = plan === "yearly" ? prices.yearly : prices.monthly;
    if (!priceId) {
      return json({ error: "stripe_not_configured", code: "stripe_not_configured" }, 503);
    }

    const { data: ent } = await admin
      .from("user_entitlements")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const params: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      allow_promotion_codes: "true",
      client_reference_id: user.id,
      "metadata[supabase_user_id]": user.id,
      "subscription_data[metadata][supabase_user_id]": user.id,
      success_url: `${baseSite}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseSite}/?checkout=cancel`,
    };
    if (ent?.stripe_customer_id) {
      params.customer = String(ent.stripe_customer_id);
    } else if (user.email) {
      params.customer_email = user.email;
    }

    const sessionRes = await stripeRequest(stripeKey, "POST", "/v1/checkout/sessions", params);
    const sessionUrl = typeof sessionRes.data.url === "string" ? sessionRes.data.url : "";
    if (!sessionRes.ok || !sessionUrl.startsWith("https://checkout.stripe.com/")) {
      return json({ error: "Could not start Stripe checkout session" }, 502);
    }
    return json({ ok: true, url: sessionUrl, plan });
  }

  if (body.action === "create_portal") {
    const { data: ent } = await admin
      .from("user_entitlements")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!ent?.stripe_customer_id) {
      return json({ error: "no_stripe_customer", code: "no_stripe_customer" }, 404);
    }

    const portalRes = await stripeRequest(stripeKey, "POST", "/v1/billing_portal/sessions", {
      customer: String(ent.stripe_customer_id),
      return_url: `${baseSite}/?portal=return`,
    });
    const portalUrl = typeof portalRes.data.url === "string" ? portalRes.data.url : "";
    if (!portalRes.ok || !portalUrl.startsWith("https://billing.stripe.com/")) {
      return json({ error: "Could not open Stripe billing portal" }, 502);
    }
    return json({ ok: true, url: portalUrl });
  }

  return json({ error: "Unknown action" }, 400);
});
