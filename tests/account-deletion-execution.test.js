#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

let fail = 0;
function check(ok, msg) {
  if (!ok) { console.error("FAIL " + msg); fail++; }
  else console.log("ok   " + msg);
}

/* 1. Static checks on SQL migration, Edge Function, UI, and docs */
const sql = read("supabase/migrations/202611200001_transactional_account_deletion.sql");
const api = read("supabase/functions/profile-access/index.ts");
const ui = read("js/account-deletion-review.js");
const docs = read("docs/IDENTITY-PERSISTENCE.md");

check(
  sql.includes("alter column created_by drop not null") &&
  sql.includes("references auth.users(id) on delete set null"),
  "migration relaxes learner_profiles.created_by so transferred profiles do not block user deletion"
);
check(
  sql.includes("create or replace function public.prepare_account_deletion") &&
  sql.includes("set search_path = pg_catalog, public") &&
  sql.includes("for update") &&
  sql.includes("role = 'owner'") &&
  sql.includes("profile_ownership_transfers") &&
  sql.includes("delete from public.profile_members") &&
  sql.includes("insert into public.account_deletion_audit") &&
  sql.includes("revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated") &&
  sql.includes("grant execute on function public.prepare_account_deletion(uuid) to service_role"),
  "prepare_account_deletion serializes on profiles, re-checks owners/transfers, revokes memberships, and stays service_role-only"
);
check(
  api.includes('body.action === "execute_account_deletion"') &&
  api.includes("body.confirm !== true") &&
  api.includes('rpc("prepare_account_deletion"') &&
  api.includes("admin.auth.admin.deleteUser(user.id)"),
  "profile-access requires explicit confirmation + matching email and runs prepare_account_deletion before deleteUser"
);
check(
  !ui.includes("SUPABASE_SERVICE_ROLE_KEY") && !ui.includes("service_role"),
  "client account-deletion UI never touches service-role credentials"
);
check(
  docs.includes("Transactional account deletion execution") && docs.includes("prepare_account_deletion"),
  "IDENTITY-PERSISTENCE.md documents transactional account deletion execution"
);

/* 2. Dynamic behavioral test on js/account-deletion-review.js */
const invocations = [];
let signedOutCount = 0;
const authEvents = [];
const ls = { pog_account_had_session: "1" };

function makeNode(tag) {
  return {
    tagName: String(tag || "DIV").toUpperCase(),
    className: "",
    hidden: false,
    innerHTML: "",
    textContent: "",
    _attrs: {},
    _listeners: {},
    _children: [],
    setAttribute(k, v) { this._attrs[k] = String(v); },
    appendChild(c) { this._children.push(c); return c; },
    addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    querySelector(sel) {
      if (sel === ".account-deletion-review-launcher") return this._children.find((c) => c.className.includes("account-deletion-review-launcher")) || null;
      if (sel === '[data-account-delete="execute"]') return { disabled: true };
      return null;
    }
  };
}
const rootEl = makeNode("DIV");
const bodyEl = makeNode("BODY");
const listeners = {};
let preflightReady = false;

const ctx = {
  window: {
    POG_SUPABASE_CONFIG: { url: "https://example.supabase.co", anonKey: "anon-key" },
    POG: { getLang: () => "en" },
    supabase: {
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: { user: { id: "u1", email: "carer@example.com" } } } }),
          signOut: async () => { signedOutCount++; }
        },
        functions: {
          invoke: async (fn, opts) => {
            invocations.push({ fn, body: opts.body });
            if (opts.body.action === "account_deletion_preflight") {
              return {
                data: {
                  ready: preflightReady,
                  membership_count: 1,
                  owned_profile_count: preflightReady ? 0 : 1,
                  profiles: [{ profile_id: "p1", profile_name: "Arthur", role: preflightReady ? "caregiver" : "owner", can_transfer_to_caregiver: true, deletion_pending: false, account_action: preflightReady ? "membership_will_be_revoked" : "transfer_or_delete_profile" }],
                  pending_transfers: { outgoing: 0, incoming: 0 },
                  blockers: preflightReady ? [] : [{ type: "owned_profile" }]
                }
              };
            }
            if (opts.body.action === "execute_account_deletion") {
              return { data: { deleted: true, revoked_memberships: 1 } };
            }
            return { error: { message: "unknown" } };
          }
        }
      })
    },
    addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
    dispatchEvent: (ev) => { authEvents.push(ev); }
  },
  document: {
    body: bodyEl,
    createElement: makeNode,
    getElementById: (id) => (id === "app" ? rootEl : null)
  },
  localStorage: {
    getItem: (k) => (k in ls ? ls[k] : null),
    setItem: (k, v) => { ls[k] = String(v); },
    removeItem: (k) => { delete ls[k]; }
  },
  CustomEvent: function (type, init) { this.type = type; this.detail = init && init.detail; },
  Date, Math, JSON, Object, Array
};
vm.createContext(ctx);
vm.runInContext(read("js/account-deletion-review.js"), ctx);

(async () => {
  const launcher = rootEl._children[0];
  check(!!launcher && launcher.textContent === "Account deletion review", "launcher button mounted cleanly");

  // 1) Blocked state: no danger box rendered
  preflightReady = false;
  launcher._listeners.click[0]();
  await new Promise((r) => setTimeout(r, 20));
  const panel = bodyEl._children[0];
  check(panel.innerHTML.includes("not ready for deletion") && !panel.innerHTML.includes('data-account-delete="execute"'),
    "blocked preflight hides permanent deletion controls");

  // 2) Ready state: danger box appears, requires checkbox + email, then executes deletion & signs out
  preflightReady = true;
  launcher._listeners.click[0]();
  await new Promise((r) => setTimeout(r, 20));
  check(panel.innerHTML.includes('data-account-delete="execute"') && ctx.window.POG.accountDeletion.canExecute() === false,
    "ready preflight renders closure controls with execute disabled until confirmed");

  panel._listeners.change[0]({ target: { id: "acc-del-ack", checked: true } });
  panel._listeners.input[0]({ target: { id: "acc-del-email", value: "carer@example.com" } });
  check(ctx.window.POG.accountDeletion.canExecute() === true,
    "acknowledgement checkbox + matching email enables permanent deletion action");

  panel._listeners.click[0]({ target: { closest: () => ({ dataset: { accountDelete: "execute" } }) } });
  await new Promise((r) => setTimeout(r, 30));

  const execCall = invocations.find((x) => x.body && x.body.action === "execute_account_deletion");
  check(!!execCall && execCall.body.confirm === true && execCall.body.confirm_email === "carer@example.com",
    "execute action sends explicit confirm + confirm_email to profile-access");
  check(signedOutCount === 1 && ls.pog_account_signed_out === "1" && !ls.pog_account_had_session &&
    authEvents.some((e) => e.type === "pog:authchange" && e.detail && e.detail.signedIn === false),
    "successful account deletion signs out locally and broadcasts pog:authchange");
  check(panel.innerHTML.includes("permanently deleted") && panel.innerHTML.includes("Local data and audio recordings"),
    "completion state confirms closure and reiterates device-local data boundary");

  if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
  console.log("All transactional account deletion tests passed.");
})();
