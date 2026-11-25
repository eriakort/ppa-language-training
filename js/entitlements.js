/*
 * Phase 1 Client Entitlement & Access-Code Bridge.
 *
 * Talks to the trusted `access-codes` Supabase Edge Function to check plan tier
 * ("free" | "full"), redeem single-user or group access codes, and cache a
 * short-lived offline grace state for reliable offline PWA sessions.
 *
 * Strictly device-local cache key (`pog_entitlement_cache_<uid>`), never
 * included in local JSON profile backups, and never uses service-role secrets.
 */
(function () {
  "use strict";
  var cfg = window.POG_SUPABASE_CONFIG || {};
  var CACHE_PREFIX = "pog_entitlement_cache_";
  var OFFLINE_GRACE_MS = 7 * 86400000;
  var client = null;
  var state = defaultState();
  var pendingCode = captureUrlCode();
  var checkoutReturn = captureCheckoutReturn();

  function configured() {
    return !!(cfg.url && cfg.anonKey && window.supabase && window.supabase.createClient);
  }
  if (configured()) {
    try {
      client = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    } catch (e) { client = null; }
  }

  function defaultState() {
    return {
      uid: "",
      tier: "free",
      source: "free",
      activeUntil: null,
      verifiedAt: 0,
      isAdmin: false,
      hasStripeCustomer: false,
      stripeStatus: null,
      redemptions: [],
      offlineLease: ""
    };
  }

  function captureUrlCode() {
    try {
      var srch = new URLSearchParams(window.location.search || "");
      var c = srch.get("code") || srch.get("redeem") || "";
      if (!c && window.location.hash && window.location.hash.indexOf("code=") >= 0) {
        c = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("code") || "";
      }
      c = String(c || "").trim().toUpperCase();
      return /^[A-Z0-9-]{6,32}$/.test(c) ? c : "";
    } catch (e) { return ""; }
  }

  function captureCheckoutReturn() {
    try {
      var srch = new URLSearchParams(window.location.search || "");
      var chk = srch.get("checkout");
      var portal = srch.get("portal");
      var result = "";
      if (chk === "success") result = "success";
      else if (chk === "cancel") result = "cancel";
      else if (portal === "return") result = "portal";
      if (result && window.history && typeof window.history.replaceState === "function") {
        srch.delete("checkout");
        srch.delete("session_id");
        srch.delete("portal");
        var qs = srch.toString();
        var nextUrl = (window.location.pathname || "/") + (qs ? "?" + qs : "") + (window.location.hash || "");
        window.history.replaceState(null, "", nextUrl);
      }
      return result;
    } catch (e) { return ""; }
  }

  function cacheKey(uid) { return CACHE_PREFIX + uid; }

  function loadCache(uid) {
    if (!uid) return null;
    try {
      var raw = localStorage.getItem(cacheKey(uid));
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.uid === uid ? parsed : null;
    } catch (e) { return null; }
  }

  function saveCache(next) {
    if (!next || !next.uid) return;
    try {
      localStorage.setItem(cacheKey(next.uid), JSON.stringify(next));
    } catch (e) {}
  }

  function emitChange() {
    try {
      window.dispatchEvent(new CustomEvent("pog:entitlementchange", { detail: status() }));
    } catch (e) {}
  }

  function isWithinGrace(s, nowMs) {
    if (!s || s.tier !== "full" || !s.activeUntil) return false;
    var expMs = Date.parse(s.activeUntil);
    if (!isFinite(expMs) || expMs <= nowMs) return false;
    if (!s.verifiedAt) return false;
    return (nowMs - s.verifiedAt) <= OFFLINE_GRACE_MS;
  }

  function isFull(nowMs) {
    var t = nowMs == null ? Date.now() : nowMs;
    return isWithinGrace(state, t);
  }

  function status(nowMs) {
    var t = nowMs == null ? Date.now() : nowMs;
    var full = isWithinGrace(state, t);
    var stale = !!(state.uid && state.verifiedAt && (t - state.verifiedAt) > OFFLINE_GRACE_MS);
    return {
      uid: state.uid,
      tier: full ? "full" : "free",
      source: full ? state.source : "free",
      activeUntil: state.activeUntil,
      verifiedAt: state.verifiedAt,
      isAdmin: !!state.isAdmin,
      hasStripeCustomer: !!state.hasStripeCustomer,
      stripeStatus: state.stripeStatus || null,
      redemptions: Array.isArray(state.redemptions) ? state.redemptions.slice() : [],
      stale: stale,
      offlineGraceDays: 7
    };
  }

  async function requireSession() {
    if (!client) throw new Error("Online sign-in is not configured yet.");
    var r = await client.auth.getSession();
    if (r.error) throw r.error;
    var sess = r.data && r.data.session;
    if (!sess || !sess.user) throw new Error("Sign in to your account first.");
    return sess;
  }

  async function refresh() {
    if (!client) return status();
    try {
      var r = await client.auth.getSession();
      var sess = r && r.data && r.data.session;
      if (!sess || !sess.user) {
        state = defaultState();
        emitChange();
        return status();
      }
      var uid = sess.user.id;
      var cached = loadCache(uid);
      if (cached && state.uid !== uid) {
        state = Object.assign(defaultState(), cached);
      }
      var res = await client.functions.invoke("access-codes", { body: { action: "status" } });
      if (!res || res.error || !res.data || typeof res.data.tier !== "string") {
        state.uid = uid;
        emitChange();
        return status();
      }
      state = {
        uid: uid,
        tier: res.data.tier === "full" ? "full" : "free",
        source: res.data.source || "free",
        activeUntil: res.data.active_until || null,
        verifiedAt: Date.now(),
        isAdmin: !!res.data.is_admin,
        hasStripeCustomer: !!res.data.has_stripe_customer || res.data.source === "stripe",
        stripeStatus: res.data.stripe_subscription_status || null,
        redemptions: Array.isArray(res.data.redemptions) ? res.data.redemptions : [],
        offlineLease: res.data.offline_lease || ""
      };
      saveCache(state);
      emitChange();
      return status();
    } catch (e) {
      return status();
    }
  }

  async function redeemCode(rawCode) {
    var sess = await requireSession();
    var code = String(rawCode || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{6,32}$/.test(code)) {
      var err = new Error("invalid_code");
      err.code = "invalid_code";
      throw err;
    }
    var res = await client.functions.invoke("access-codes", {
      body: { action: "redeem", code: code }
    });
    if (res.error) throw res.error;
    if (!res.data || !res.data.ok) {
      var e2 = new Error((res.data && res.data.error) || "Could not redeem code");
      e2.code = (res.data && res.data.code) || "redeem_failed";
      throw e2;
    }
    if (pendingCode === code) pendingCode = "";
    state = Object.assign(defaultState(), state, {
      uid: sess.user.id,
      tier: "full",
      source: "code",
      activeUntil: res.data.active_until || res.data.expires_at || null,
      verifiedAt: Date.now()
    });
    saveCache(state);
    emitChange();
    await refresh();
    return res.data;
  }

  async function adminCreate(opts) {
    await requireSession();
    var payload = Object.assign({ action: "admin_create" }, opts || {});
    var res = await client.functions.invoke("access-codes", { body: payload });
    if (res.error) throw res.error;
    if (!res.data || !res.data.ok) throw new Error((res.data && res.data.error) || "Could not create access code");
    return res.data.codes || [];
  }

  async function adminList() {
    await requireSession();
    var res = await client.functions.invoke("access-codes", { body: { action: "admin_list" } });
    if (res.error) throw res.error;
    if (!res.data || !res.data.ok) throw new Error((res.data && res.data.error) || "Could not list access codes");
    return res.data.codes || [];
  }

  async function adminRevoke(codeId, revokeActiveGrants) {
    await requireSession();
    var res = await client.functions.invoke("access-codes", {
      body: { action: "admin_revoke", code_id: codeId, revoke_active_grants: !!revokeActiveGrants }
    });
    if (res.error) throw res.error;
    if (!res.data || !res.data.ok) throw new Error((res.data && res.data.error) || "Could not revoke code");
    return res.data;
  }

  async function adminListUsers(search) {
    await requireSession();
    var body = { action: "admin_users_list" };
    if (search) body.search = String(search).trim().slice(0, 120);
    var res = await client.functions.invoke("access-codes", { body: body });
    if (res.error) throw res.error;
    if (!res.data || !res.data.ok) throw new Error((res.data && res.data.error) || "Could not list users");
    return res.data.users || [];
  }

  async function adminSetUserRole(target, isAdminFlag, note) {
    await requireSession();
    var body = { action: "admin_set_role", is_admin: !!isAdminFlag };
    if (target && target.userId) body.user_id = String(target.userId);
    else if (target && target.email) body.email = String(target.email).trim().toLowerCase();
    else if (typeof target === "string") {
      if (target.indexOf("@") >= 0) body.email = target.trim().toLowerCase();
      else body.user_id = target;
    }
    if (note) body.note = String(note).trim().slice(0, 200);
    var res = await client.functions.invoke("access-codes", { body: body });
    if (res.error) throw res.error;
    if (!res.data || !res.data.ok) throw new Error((res.data && res.data.error) || "Could not update admin role");
    return res.data;
  }

  async function adminSetUserEntitlement(target, tier, durationDays) {
    await requireSession();
    var body = { action: "admin_set_entitlement", tier: tier === "full" ? "full" : "free" };
    if (target && target.userId) body.user_id = String(target.userId);
    else if (target && target.email) body.email = String(target.email).trim().toLowerCase();
    else if (typeof target === "string") {
      if (target.indexOf("@") >= 0) body.email = target.trim().toLowerCase();
      else body.user_id = target;
    }
    if (body.tier === "full") body.duration_days = Number(durationDays || 30);
    var res = await client.functions.invoke("access-codes", { body: body });
    if (res.error) throw res.error;
    if (!res.data || !res.data.ok) throw new Error((res.data && res.data.error) || "Could not update user plan");
    return res.data;
  }

  async function adminInviteUser(opts) {
    await requireSession();
    var payload = Object.assign({ action: "admin_invite_user" }, opts || {});
    var res = await client.functions.invoke("access-codes", { body: payload });
    if (res.error) throw res.error;
    if (!res.data || !res.data.ok) throw new Error((res.data && res.data.error) || "Could not invite user");
    return res.data;
  }

  async function extractFunctionError(res, fallbackMsg) {
    var code = (res && res.data && res.data.code) || "";
    var msg = (res && res.data && res.data.error) || "";
    if (!code && res && res.error && res.error.context && typeof res.error.context.json === "function") {
      try {
        var parsed = await res.error.context.json();
        if (parsed && parsed.code) code = String(parsed.code);
        if (parsed && parsed.error) msg = String(parsed.error);
      } catch (e) {}
    }
    if (!msg && res && res.error && res.error.message) msg = String(res.error.message);
    var err = new Error(msg || fallbackMsg || "Request failed");
    if (code) err.code = code;
    else if (msg === "stripe_not_configured" || msg === "no_stripe_customer") err.code = msg;
    return err;
  }

  async function checkBillingAvailability() {
    if (!client) return { ok: false, stripe_enabled: false, plans: { monthly: false, yearly: false }, has_portal: false };
    try {
      var r = await client.auth.getSession();
      var sess = r && r.data && r.data.session;
      if (!sess || !sess.user) return { ok: false, stripe_enabled: false, plans: { monthly: false, yearly: false }, has_portal: false };
      var res = await client.functions.invoke("stripe-billing", { body: { action: "billing_config" } });
      if (!res || res.error || !res.data || !res.data.ok) {
        return { ok: false, stripe_enabled: false, plans: { monthly: false, yearly: false }, has_portal: false };
      }
      return {
        ok: true,
        stripe_enabled: !!res.data.stripe_enabled,
        plans: res.data.plans || { monthly: false, yearly: false },
        has_portal: !!res.data.has_portal,
        subscription_status: res.data.subscription_status || null
      };
    } catch (e) {
      return { ok: false, stripe_enabled: false, plans: { monthly: false, yearly: false }, has_portal: false };
    }
  }

  async function createCheckoutSession(plan) {
    await requireSession();
    var p = plan === "yearly" ? "yearly" : (plan === "monthly" ? "monthly" : "");
    if (!p) {
      var badPlan = new Error("Invalid subscription plan");
      badPlan.code = "invalid_plan";
      throw badPlan;
    }
    var res = await client.functions.invoke("stripe-billing", {
      body: { action: "create_checkout", plan: p }
    });
    if (!res || res.error || !res.data || !res.data.ok) {
      throw await extractFunctionError(res, "Could not start Stripe checkout");
    }
    var checkoutUrl = typeof res.data.url === "string" ? res.data.url : "";
    if (checkoutUrl.indexOf("https://checkout.stripe.com/") !== 0) {
      var urlErr = new Error("Unexpected checkout redirect URL");
      urlErr.code = "invalid_redirect_url";
      throw urlErr;
    }
    return { ok: true, url: checkoutUrl, plan: p };
  }

  async function createPortalSession() {
    await requireSession();
    var res = await client.functions.invoke("stripe-billing", {
      body: { action: "create_portal" }
    });
    if (!res || res.error || !res.data || !res.data.ok) {
      throw await extractFunctionError(res, "Could not open Stripe billing portal");
    }
    var portalUrl = typeof res.data.url === "string" ? res.data.url : "";
    if (portalUrl.indexOf("https://billing.stripe.com/") !== 0) {
      var urlErr = new Error("Unexpected portal redirect URL");
      urlErr.code = "invalid_redirect_url";
      throw urlErr;
    }
    return { ok: true, url: portalUrl };
  }

  window.addEventListener("pog:authchange", function (ev) {
    var d = ev && ev.detail;
    if (d && d.signedOut) {
      state = defaultState();
      emitChange();
    } else if (d && d.signedIn) {
      if (d.uid && state.uid !== d.uid) {
        var cached = loadCache(d.uid);
        state = cached ? Object.assign(defaultState(), cached) : Object.assign(defaultState(), { uid: d.uid });
        emitChange();
      }
      refresh();
    }
  });
  window.addEventListener("online", function () { refresh(); });

  /* Hydrate from cache immediately if an account session already exists on load. */
  if (client) {
    client.auth.getSession().then(function (r) {
      var u = r && r.data && r.data.session && r.data.session.user;
      if (u && u.id) {
        var cached = loadCache(u.id);
        if (cached) {
          state = Object.assign(defaultState(), cached);
          emitChange();
        }
        if (navigator.onLine !== false) refresh();
      }
    }).catch(function () {});
  }

  window.POG = window.POG || {};
  window.POG.entitlements = {
    status: status,
    isFull: isFull,
    isAdmin: function () { return !!state.isAdmin; },
    pendingCode: function () { return pendingCode; },
    clearPendingCode: function () { pendingCode = ""; },
    checkoutStatus: function () { return checkoutReturn; },
    clearCheckoutStatus: function () { checkoutReturn = ""; },
    refresh: refresh,
    redeemCode: redeemCode,
    checkBillingAvailability: checkBillingAvailability,
    createCheckoutSession: createCheckoutSession,
    createPortalSession: createPortalSession,
    adminCreate: adminCreate,
    adminList: adminList,
    adminRevoke: adminRevoke,
    adminListUsers: adminListUsers,
    adminSetUserRole: adminSetUserRole,
    adminSetUserEntitlement: adminSetUserEntitlement,
    adminInviteUser: adminInviteUser
  };
})();
