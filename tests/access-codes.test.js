"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/202611210001_access_codes_and_entitlements.sql"),
  "utf8"
);
const fn = fs.readFileSync(
  path.join(root, "supabase/functions/access-codes/index.ts"),
  "utf8"
);
const configToml = fs.readFileSync(
  path.join(root, "supabase/config.toml"),
  "utf8"
);
const entitlementsJs = fs.readFileSync(
  path.join(root, "js/entitlements.js"),
  "utf8"
);
const appJs = fs.readFileSync(
  path.join(root, "js/app.js"),
  "utf8"
);
const indexHtml = fs.readFileSync(
  path.join(root, "index.html"),
  "utf8"
);
const swJs = fs.readFileSync(
  path.join(root, "sw.js"),
  "utf8"
);

let failures = 0;
function check(ok, label) {
  if (!ok) {
    console.error("FAIL " + label);
    failures++;
  } else {
    console.log("ok   " + label);
  }
}

/* 1. Static SQL migration & RLS security checks */
check(migration.includes("create table if not exists public.access_admins"), "migration defines access_admins table");
check(migration.includes("create table if not exists public.access_codes"), "migration defines access_codes table");
check(migration.includes("create table if not exists public.code_redemptions"), "migration defines code_redemptions table");
check(migration.includes("create table if not exists public.user_entitlements"), "migration defines user_entitlements table");

check(
  migration.includes("alter table public.access_admins enable row level security") &&
    migration.includes("alter table public.access_codes enable row level security") &&
    migration.includes("alter table public.code_redemptions enable row level security") &&
    migration.includes("alter table public.user_entitlements enable row level security"),
  "RLS enabled on all four Phase 1 tables"
);

check(
  migration.includes("revoke all on public.access_admins from public, anon, authenticated") &&
    migration.includes("revoke all on public.access_codes from public, anon, authenticated") &&
    migration.includes("revoke all on public.code_redemptions from public, anon, authenticated") &&
    migration.includes("revoke all on public.user_entitlements from public, anon, authenticated"),
  "direct client writes revoked on all four Phase 1 tables"
);

check(migration.includes("unique (code_id, user_id)"), "same user cannot redeem the same code twice");
check(migration.includes("access_codes_type_cap_chk"), "single vs group max_uses constraint enforced in schema");
check(migration.includes("for update;"), "redeem_access_code locks code row with FOR UPDATE");
check(
  (migration.match(/set search_path = pg_catalog, public/g) || []).length >= 3,
  "all three SECURITY DEFINER RPCs harden search_path"
);
check(
  migration.includes("revoke all on function public.redeem_access_code(uuid, text, text) from public, anon, authenticated") &&
    migration.includes("grant execute on function public.redeem_access_code(uuid, text, text) to service_role") &&
    migration.includes("revoke all on function public.revoke_access_code_grant(uuid, boolean) from public, anon, authenticated") &&
    migration.includes("grant execute on function public.revoke_access_code_grant(uuid, boolean) to service_role"),
  "redeem and revoke RPCs execute strictly under service_role"
);
check(
  migration.includes("on delete cascade") && migration.includes("on delete set null"),
  "foreign keys cascade or nullify cleanly on account deletion"
);

/* 2. Static Edge Function & deployment config security checks */
check(configToml.includes("[functions.access-codes]") && configToml.includes("verify_jwt = false"), "config.toml registers access-codes function");
check(fn.includes("APP_SITE_URL") && fn.includes("origin !== allowedOrigin"), "access-codes enforces APP_SITE_URL CORS origin check");
check(fn.includes("userClient.auth.getUser(token)"), "access-codes verifies Bearer JWT server-side");
check(fn.includes("isAdminUser") && fn.includes("ACCESS_ADMIN_EMAILS") && fn.includes("user.email_confirmed_at"), "admin actions require access_admins or confirmed ACCESS_ADMIN_EMAILS");
check(
  fn.includes('const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"') &&
    !/[0O1IL]/.test(fn.match(/const CODE_ALPHABET = "([^"]+)"/)[1]),
  "generated codes exclude ambiguous characters (0, O, 1, I, L)"
);
check(fn.includes("signOfflineLease") && fn.includes("HMAC"), "access-codes signs offline lease with HMAC-SHA256");
check(
  fn.includes("SUPABASE_SERVICE_ROLE_KEY") &&
    !entitlementsJs.includes("SUPABASE_SERVICE_ROLE_KEY") &&
    !appJs.includes("SUPABASE_SERVICE_ROLE_KEY"),
  "service-role key stays strictly server-side"
);
check(!entitlementsJs.includes("innerHTML") && !entitlementsJs.includes("eval("), "client entitlement bridge contains no unsafe HTML or eval sinks");
check(!appJs.includes("pog_entitlement_cache_"), "entitlement cache is excluded from local JSON profile BACKUP_KEYS");
check(indexHtml.includes('<script src="js/entitlements.js"></script>'), "index.html loads js/entitlements.js");
check(swJs.includes('"js/entitlements.js"'), "sw.js precaches js/entitlements.js");

/* 3. Dynamic behavioral tests for window.POG.entitlements */
function makeStorage(seed) {
  const store = Object.assign({}, seed || {});
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    _dump() { return store; }
  };
}

async function runBehavioralTests() {
  let invokeCalls = [];
  let currentSession = { user: { id: "user-1", email: "learner@example.com" } };
  let invokeHandler = async () => ({ data: null, error: null });
  const storage = makeStorage();
  const listeners = {};
  const dispatched = [];

  const sandbox = {
    console,
    Date,
    Math,
    JSON,
    URLSearchParams,
    navigator: { onLine: true },
    localStorage: storage,
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    window: null
  };
  sandbox.window = {
    location: { search: "?code=pog-ab23-cd45", hash: "" },
    POG_SUPABASE_CONFIG: { url: "https://example.supabase.co", anonKey: "anon-key-stub" },
    supabase: {
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: currentSession }, error: null })
        },
        functions: {
          invoke: async (name, opts) => {
            invokeCalls.push({ name, body: opts && opts.body });
            return invokeHandler(name, opts);
          }
        }
      })
    },
    addEventListener: (ev, fnCb) => {
      listeners[ev] = listeners[ev] || [];
      listeners[ev].push(fnCb);
    },
    dispatchEvent: (ev) => {
      dispatched.push(ev);
      (listeners[ev.type] || []).forEach((fnCb) => fnCb(ev));
    }
  };

  // Scenario A: Initial URL code capture & default free state when backend returns null
  vm.runInNewContext(entitlementsJs, sandbox);
  await new Promise((r) => setTimeout(r, 15));
  const ent = sandbox.window.POG.entitlements;
  check(!!ent, "window.POG.entitlements API initialized");
  check(ent.pendingCode() === "POG-AB23-CD45", "captures ?code= parameter cleanly");
  check(ent.status().tier === "free" && ent.isFull() === false, "defaults to free tier when unverified");

  // Scenario B: Refresh hydrates full tier + admin flag + caches locally
  const futureIso = new Date(Date.now() + 30 * 86400000).toISOString();
  invokeHandler = async (_name, opts) => {
    if (opts.body.action === "status") {
      return {
        data: {
          tier: "full",
          source: "code",
          active_until: futureIso,
          is_admin: true,
          redemptions: [{ id: "r1" }],
          offline_lease: "abc.def"
        },
        error: null
      };
    }
    return { data: null, error: null };
  };
  const refreshed = await ent.refresh();
  check(refreshed.tier === "full" && ent.isFull() === true, "refresh sets full tier when server confirms active grant");
  check(ent.isAdmin() === true && refreshed.isAdmin === true, "refresh sets admin flag from server response");
  check(!!storage.getItem("pog_entitlement_cache_user-1"), "writes per-user offline grace cache to localStorage");

  // Scenario C: 7-day offline grace window & expiry boundary
  const nowMs = Date.now();
  check(ent.isFull(nowMs + 6 * 86400000) === true, "offline grace allows full access within 7 days of last check");
  check(ent.isFull(nowMs + 8 * 86400000) === false, "offline grace expires cleanly past 7 days without re-verification");
  check(ent.status(nowMs + 8 * 86400000).stale === true, "marks status stale past 7-day offline grace");
  const pastExpiryMs = Date.parse(futureIso) + 60000;
  check(ent.isFull(pastExpiryMs) === false, "full access stops cleanly after activeUntil passes");

  // Scenario D: Invalid format rejected before hitting Edge Function
  const countBefore = invokeCalls.length;
  let badCodeRejected = false;
  try {
    await ent.redeemCode("bad!");
  } catch (e) {
    badCodeRejected = e && e.code === "invalid_code";
  }
  check(badCodeRejected && invokeCalls.length === countBefore, "invalid code format rejected locally before network call");

  // Scenario E: Valid redeemCode invokes Edge Function, clears pendingCode, and refreshes
  invokeHandler = async (_name, opts) => {
    if (opts.body.action === "redeem") {
      return {
        data: {
          ok: true,
          code: opts.body.code,
          code_type: "single",
          tier: "full",
          active_until: futureIso
        },
        error: null
      };
    }
    if (opts.body.action === "status") {
      return {
        data: {
          tier: "full",
          source: "code",
          active_until: futureIso,
          is_admin: true,
          redemptions: [{ id: "r2" }],
          offline_lease: "lease2"
        },
        error: null
      };
    }
    if (opts.body.action === "admin_create") {
      return { data: { ok: true, codes: [{ id: "c1", code: "POG-2345-6789" }] }, error: null };
    }
    if (opts.body.action === "admin_list") {
      return { data: { ok: true, codes: [{ id: "c1", code: "POG-2345-6789", used_count: 1 }] }, error: null };
    }
    if (opts.body.action === "admin_revoke") {
      return { data: { ok: true, code_id: opts.body.code_id, revoked_active: 1 }, error: null };
    }
    return { data: null, error: null };
  };

  const redeemed = await ent.redeemCode("pog-ab23-cd45");
  check(redeemed.ok === true && ent.pendingCode() === "", "redeemCode succeeds and clears matching pendingCode");

  const created = await ent.adminCreate({ code_type: "group", duration_days: 30, max_uses: 5 });
  const listed = await ent.adminList();
  const revoked = await ent.adminRevoke("00000000-0000-0000-0000-000000000001", true);
  check(
    created.length === 1 && listed.length === 1 && revoked.revoked_active === 1,
    "adminCreate, adminList, and adminRevoke forward payloads cleanly"
  );

  // Scenario F: Sign-out event resets entitlement state
  sandbox.window.dispatchEvent(new sandbox.CustomEvent("pog:authchange", { detail: { signedOut: true } }));
  check(ent.status().tier === "free" && ent.isAdmin() === false && ent.status().uid === "", "pog:authchange signedOut resets entitlement state to free");
}

runBehavioralTests()
  .then(() => {
    if (failures) {
      console.error(failures + " check(s) failed.");
      process.exit(1);
    }
    console.log("All access-codes checks passed.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
