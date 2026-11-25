"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const migrationSql = fs.readFileSync(path.join(root, "supabase/migrations/202611230001_stripe_billing.sql"), "utf8");
const stripeFnTs = fs.readFileSync(path.join(root, "supabase/functions/stripe-billing/index.ts"), "utf8");
const accessCodesTs = fs.readFileSync(path.join(root, "supabase/functions/access-codes/index.ts"), "utf8");
const configToml = fs.readFileSync(path.join(root, "supabase/config.toml"), "utf8");
const entitlementsJs = fs.readFileSync(path.join(root, "js/entitlements.js"), "utf8");
const paywallJs = fs.readFileSync(path.join(root, "js/paywall.js"), "utf8");
const accountJs = fs.readFileSync(path.join(root, "js/account.js"), "utf8");
const stylesCss = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
const swJs = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
const docsMd = fs.readFileSync(path.join(root, "docs/IDENTITY-PERSISTENCE.md"), "utf8");

let failures = 0;
function check(ok, label) {
  if (!ok) {
    console.error("FAIL " + label);
    failures++;
  } else {
    console.log("ok   " + label);
  }
}

/* 1. Static SQL, Edge Function & Secret Boundary Checks */
check(
  migrationSql.includes("create table if not exists public.stripe_webhook_events") &&
  migrationSql.includes("enable row level security") &&
  migrationSql.includes("revoke all on public.stripe_webhook_events from public, anon, authenticated"),
  "migration creates RLS-locked stripe_webhook_events table revoked from browser roles"
);
check(
  migrationSql.includes("create or replace function public.sync_stripe_entitlement") &&
  migrationSql.includes("security definer") &&
  migrationSql.includes("set search_path = pg_catalog, public") &&
  migrationSql.includes("grant execute on function public.sync_stripe_entitlement(text, text, uuid, text, text, text, timestamptz) to service_role") &&
  migrationSql.includes("revoke all on function public.sync_stripe_entitlement(text, text, uuid, text, text, text, timestamptz) from public, anon, authenticated"),
  "sync_stripe_entitlement RPC is SECURITY DEFINER with safe search_path and restricted to service_role"
);
check(
  migrationSql.includes("where event_id = trim(p_event_id)") &&
  migrationSql.includes("source = 'stripe'"),
  "sync_stripe_entitlement deduplicates webhook event_id and only downgrades Stripe-sourced grants"
);

check(
  stripeFnTs.includes("verifyStripeSignature") &&
  stripeFnTs.includes('name: "HMAC", hash: "SHA-256"') &&
  stripeFnTs.includes("constantTimeEqual") &&
  stripeFnTs.includes("toleranceSec = 300"),
  "stripe-billing verifies Stripe webhook HMAC-SHA256 signatures with constant-time compare and replay window"
);
check(
  stripeFnTs.includes("allowedOrigin || origin !== allowedOrigin") &&
  stripeFnTs.includes("userClient.auth.getUser(token)") &&
  stripeFnTs.includes("client_reference_id: user.id") &&
  stripeFnTs.includes("STRIPE_PRICE_MONTHLY") &&
  stripeFnTs.includes("STRIPE_PRICE_YEARLY"),
  "stripe-billing enforces origin, JWT auth, server-side price mapping, and user-bound checkout"
);
check(
  stripeFnTs.includes('startsWith("https://checkout.stripe.com/")') &&
  stripeFnTs.includes('startsWith("https://billing.stripe.com/")') &&
  configToml.includes("[functions.stripe-billing]") &&
  accessCodesTs.includes("has_stripe_customer") &&
  !accessCodesTs.includes('stripe_customer_id: ent'),
  "stripe-billing validates Stripe domains, config.toml registers function, and access-codes status hides raw stripe_customer_id"
);
check(
  envExample.includes("STRIPE_SECRET_KEY=") &&
  envExample.includes("STRIPE_WEBHOOK_SECRET=") &&
  envExample.includes("STRIPE_PRICE_MONTHLY=") &&
  envExample.includes("STRIPE_PRICE_YEARLY=") &&
  !/STRIPE_SECRET_KEY\s*=[^\S\r\n]*\S/.test(envExample) &&
  !/STRIPE_WEBHOOK_SECRET\s*=[^\S\r\n]*\S/.test(envExample),
  ".env.example lists empty Stripe secret placeholders with no values committed"
);
check(
  !/sk_live_|sk_test_|whsec_|rk_live_|rk_test_/.test(entitlementsJs + paywallJs + accountJs + stripeFnTs + envExample) &&
  !entitlementsJs.includes("STRIPE_SECRET_KEY") &&
  !paywallJs.includes("STRIPE_SECRET_KEY") &&
  !accountJs.includes("STRIPE_SECRET_KEY"),
  "client JS and repo contain no Stripe secret literals or env secret names"
);
check(
  stylesCss.includes(".pw-plans") &&
  stylesCss.includes(".pw-plan-btn") &&
  swJs.includes('pog-shell-v29') &&
  docsMd.includes("202611230001_stripe_billing.sql") &&
  docsMd.includes("sync_stripe_entitlement"),
  "styles, service worker cache bump, and docs are updated for Phase 4"
);

/* 2. Dynamic Behavioral Tests for entitlements.js + paywall.js + account.js */
function makeElement(tag) {
  const attrs = {};
  return {
    tagName: String(tag || "div").toUpperCase(),
    className: "",
    id: "",
    hidden: false,
    innerHTML: "",
    textContent: "",
    disabled: false,
    _listeners: {},
    setAttribute(k, v) {
      attrs[k] = String(v);
      if (k === "class") this.className = String(v);
      if (k === "id") this.id = String(v);
    },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
    addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    querySelector(sel) {
      if (sel === ".account-launcher") return null;
      return { focus() {} };
    },
    closest() { return null; },
    appendChild() {},
    focus() {}
  };
}

async function runBehavioralTests() {
  const store = {};
  const listeners = {};
  const docListeners = {};
  const invokeCalls = [];
  const replacedUrls = [];
  const assignedUrls = [];
  const bodyChildren = [];
  let lang = "en";
  let signedIn = true;
  let tier = "free";
  let source = "free";
  let hasCustomer = false;
  let checkoutInvokeMode = "ok";
  let portalInvokeMode = "ok";

  const fakeRoot = makeElement("div");
  fakeRoot.id = "app";

  const sandbox = {
    console,
    Date,
    Math,
    URLSearchParams,
    parseInt,
    isFinite,
    isNaN,
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); },
      removeItem(k) { delete store[k]; }
    },
    navigator: { onLine: true },
    document: {
      body: { appendChild(el) { bodyChildren.push(el); } },
      getElementById(id) { return id === "app" ? fakeRoot : null; },
      createElement(tag) { return makeElement(tag); },
      addEventListener(ev, fn) { (docListeners[ev] = docListeners[ev] || []).push(fn); }
    },
    window: null
  };

  const sessionUser = { id: "u-phase4", email: "buyer@example.com", user_metadata: {} };

  sandbox.window = {
    POG_SUPABASE_CONFIG: { url: "https://proj.supabase.co", anonKey: "anon-public-key" },
    supabase: {
      createClient() {
        return {
          auth: {
            getSession: async () => ({ data: { session: signedIn ? { user: sessionUser } : null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
            signOut: async () => ({ error: null })
          },
          functions: {
            invoke: async (fn, opts) => {
              const body = (opts && opts.body) || {};
              invokeCalls.push({ fn, body });
              if (fn === "access-codes" && body.action === "status") {
                return {
                  data: {
                    tier,
                    source,
                    active_until: tier === "full" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
                    is_admin: false,
                    has_stripe_customer: hasCustomer,
                    stripe_subscription_status: hasCustomer ? "active" : null,
                    redemptions: []
                  },
                  error: null
                };
              }
              if (fn === "stripe-billing") {
                if (body.action === "billing_config") {
                  return {
                    data: {
                      ok: true,
                      stripe_enabled: checkoutInvokeMode === "ok",
                      plans: { monthly: true, yearly: true },
                      has_portal: hasCustomer,
                      subscription_status: hasCustomer ? "active" : null
                    },
                    error: null
                  };
                }
                if (body.action === "create_checkout") {
                  if (checkoutInvokeMode === "not_configured") {
                    return {
                      data: null,
                      error: {
                        message: "Edge Function returned a non-2xx status code",
                        context: { json: async () => ({ error: "stripe_not_configured", code: "stripe_not_configured" }) }
                      }
                    };
                  }
                  if (checkoutInvokeMode === "rogue_url") {
                    return { data: { ok: true, url: "https://evil.example.com/phish", plan: body.plan }, error: null };
                  }
                  return {
                    data: { ok: true, url: "https://checkout.stripe.com/c/pay/cs_test_" + body.plan, plan: body.plan },
                    error: null
                  };
                }
                if (body.action === "create_portal") {
                  if (portalInvokeMode === "no_customer") {
                    return {
                      data: { error: "no_stripe_customer", code: "no_stripe_customer" },
                      error: { message: "no_stripe_customer" }
                    };
                  }
                  if (portalInvokeMode === "rogue_url") {
                    return { data: { ok: true, url: "https://phish.example.com/portal" }, error: null };
                  }
                  return { data: { ok: true, url: "https://billing.stripe.com/p/session/bps_test_123" }, error: null };
                }
              }
              return { data: null, error: null };
            }
          }
        };
      }
    },
    location: {
      pathname: "/app/",
      search: "?checkout=success&session_id=cs_test_999&foo=1",
      hash: "#home",
      assign(u) { assignedUrls.push(u); }
    },
    history: {
      replaceState(_st, _t, u) { replacedUrls.push(u); }
    },
    addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    dispatchEvent(ev) { (listeners[ev.type] || []).forEach((fn) => fn(ev)); },
    POG: {
      getLang: () => lang,
      appApi: { screen: () => "home", go() {}, render() {}, isLocked: () => false }
    }
  };
  sandbox.location = sandbox.window.location;
  sandbox.history = sandbox.window.history;

  vm.runInNewContext(entitlementsJs, sandbox);
  await new Promise((r) => setTimeout(r, 20));

  const ent = sandbox.window.POG.entitlements;
  check(
    ent.checkoutStatus() === "success" &&
    replacedUrls.length === 1 &&
    replacedUrls[0] === "/app/?foo=1#home",
    "entitlements.js captures ?checkout=success and cleans checkout/session_id query params cleanly"
  );

  // Validate Checkout & Portal security checks
  const okCheckout = await ent.createCheckoutSession("monthly");
  check(
    okCheckout.ok === true &&
    okCheckout.url === "https://checkout.stripe.com/c/pay/cs_test_monthly",
    "createCheckoutSession returns validated Stripe Checkout URL"
  );

  checkoutInvokeMode = "rogue_url";
  let rogueBlocked = false;
  try { await ent.createCheckoutSession("yearly"); } catch (e) { rogueBlocked = e && e.code === "invalid_redirect_url"; }
  check(rogueBlocked, "createCheckoutSession blocks non-Stripe redirect URLs");

  checkoutInvokeMode = "not_configured";
  let notConfiguredCode = "";
  try { await ent.createCheckoutSession("monthly"); } catch (e) { notConfiguredCode = e && e.code; }
  check(notConfiguredCode === "stripe_not_configured", "createCheckoutSession extracts stripe_not_configured code from Edge Function error");

  checkoutInvokeMode = "ok";
  portalInvokeMode = "rogue_url";
  let roguePortalBlocked = false;
  try { await ent.createPortalSession(); } catch (e) { roguePortalBlocked = e && e.code === "invalid_redirect_url"; }
  check(roguePortalBlocked, "createPortalSession blocks non-billing.stripe.com redirect URLs");

  portalInvokeMode = "ok";
  const okPortal = await ent.createPortalSession();
  check(okPortal.url === "https://billing.stripe.com/p/session/bps_test_123", "createPortalSession returns validated Customer Portal URL");

  // Load paywall.js & account.js
  vm.runInNewContext(paywallJs, sandbox);
  vm.runInNewContext(accountJs, sandbox);
  await new Promise((r) => setTimeout(r, 20));

  const pwPanel = bodyChildren.find((el) => el.className === "pw-panel");
  check(
    pwPanel && pwPanel.hidden === false &&
    /Payment received|Payment completed/.test(pwPanel.innerHTML) &&
    ent.checkoutStatus() === "",
    "paywall.js automatically displays ?checkout=success return notice and clears flag"
  );
  check(
    pwPanel.innerHTML.includes('data-pw="checkout" data-plan="monthly"') &&
    pwPanel.innerHTML.includes('data-pw="checkout" data-plan="yearly"') &&
    pwPanel.innerHTML.includes('data-pw-form="redeem"'),
    "paywall modal displays both Monthly & Yearly Stripe checkout buttons alongside access code form"
  );

  // Trigger Monthly checkout button click in paywall.js -> verify window.location.assign called
  assignedUrls.length = 0;
  const pwClick = pwPanel._listeners.click[0];
  await pwClick({
    target: {
      closest(sel) {
        if (sel === "[data-pw]") {
          return {
            disabled: false,
            getAttribute(k) { return k === "data-pw" ? "checkout" : (k === "data-plan" ? "monthly" : null); }
          };
        }
        return null;
      }
    }
  });
  await new Promise((r) => setTimeout(r, 20));
  check(
    assignedUrls[0] === "https://checkout.stripe.com/c/pay/cs_test_monthly",
    "clicking Monthly Checkout button validates URL and calls window.location.assign"
  );

  // Simulate stripe_not_configured error from clicking Yearly
  checkoutInvokeMode = "not_configured";
  await pwClick({
    target: {
      closest(sel) {
        if (sel === "[data-pw]") {
          return {
            disabled: false,
            getAttribute(k) { return k === "data-pw" ? "checkout" : (k === "data-plan" ? "yearly" : null); }
          };
        }
        return null;
      }
    }
  });
  await new Promise((r) => setTimeout(r, 20));
  check(
    /Online card checkout is not enabled on this server yet/.test(pwPanel.innerHTML),
    "paywall displays localized fallback error when Stripe secrets are not configured"
  );

  // Simulate active Stripe customer: Portal appears in both Paywall modal & Account panel
  tier = "full";
  source = "stripe";
  hasCustomer = true;
  await ent.refresh();
  sandbox.window.POG.paywall.openModal({ reason: "manage" });
  check(
    pwPanel.innerHTML.includes('data-pw="portal"') && !pwPanel.innerHTML.includes('data-pw="checkout"'),
    "active Stripe subscriber sees Manage subscription Portal button cleanly"
  );

  sandbox.window.dispatchEvent(new sandbox.CustomEvent("pog:open-account"));
  const accPanel = bodyChildren.find((el) => el.className === "account-panel");
  check(
    accPanel && accPanel.hidden === false && accPanel.innerHTML.includes('data-action="stripe-portal"'),
    "account dialog renders Manage Stripe subscription button when hasStripeCustomer is true"
  );

  assignedUrls.length = 0;
  const accClick = accPanel._listeners.click[0];
  accClick({
    target: {
      closest(sel) {
        if (sel === "[data-action]") return { dataset: { action: "stripe-portal" } };
        return null;
      }
    }
  });
  await new Promise((r) => setTimeout(r, 20));
  check(
    assignedUrls[0] === "https://billing.stripe.com/p/session/bps_test_123",
    "clicking Manage Stripe subscription in Account dialog redirects cleanly to billing.stripe.com"
  );
}

runBehavioralTests()
  .then(() => {
    if (failures) {
      console.error(failures + " check(s) failed.");
      process.exit(1);
    }
    console.log("All Stripe billing checks passed.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
