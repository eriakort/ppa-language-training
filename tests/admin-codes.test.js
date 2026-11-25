"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const adminJs = fs.readFileSync(path.join(root, "js/admin-codes.js"), "utf8");
const accountJs = fs.readFileSync(path.join(root, "js/account.js"), "utf8");
const utilityJs = fs.readFileSync(path.join(root, "js/utility-menu.js"), "utf8");
const stylesCss = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const swJs = fs.readFileSync(path.join(root, "sw.js"), "utf8");

let failures = 0;
function check(ok, label) {
  if (!ok) {
    console.error("FAIL " + label);
    failures++;
  } else {
    console.log("ok   " + label);
  }
}

/* 1. Static integration & security hygiene checks */
check(
  indexHtml.indexOf('<script src="js/paywall.js"></script>') <
    indexHtml.indexOf('<script src="js/admin-codes.js"></script>'),
  "index.html loads js/admin-codes.js after js/paywall.js"
);
check(swJs.includes('"js/admin-codes.js"') && !swJs.includes('"pog-shell-v26"'), "sw.js bumps VERSION and precaches js/admin-codes.js");
check(utilityJs.includes(".account-launcher") && !utilityJs.includes("admin-codes"), "utility-menu preserves exact 7-item sheet");
check(accountJs.includes('data-action="admin-codes"') && accountJs.includes("window.POG.adminCodes.openModal()"), "account.js exposes admin-codes trigger inside account plan box only");
check(
  !adminJs.includes("SUPABASE_SERVICE_ROLE_KEY") &&
    !adminJs.includes("eval(") &&
    !adminJs.includes("Function(") &&
    !adminJs.includes("window.alert") &&
    !adminJs.includes("window.confirm") &&
    !adminJs.includes("window.prompt"),
  "admin-codes.js has zero secrets, eval, or native browser dialogs"
);
const migration2 = fs.readFileSync(path.join(root, "supabase/migrations/202611220001_admin_user_management.sql"), "utf8");
const edgeFn = fs.readFileSync(path.join(root, "supabase/functions/access-codes/index.ts"), "utf8");

check(
  adminJs.includes("esc(") && stylesCss.includes(".adc-panel") && stylesCss.includes(".adc-item"),
  "admin-codes.js HTML-escapes dynamic fields and styles.css defines .adc-* classes"
);
check(
  migration2.includes("admin_list_users") &&
    migration2.includes("admin_set_user_role") &&
    migration2.includes("admin_set_user_entitlement") &&
    migration2.includes("cannot_demote_self") &&
    migration2.includes("email_not_confirmed") &&
    migration2.includes("grant execute on function public.admin_list_users(text, integer) to service_role") &&
    migration2.includes("grant execute on function public.admin_set_user_role(uuid, text, boolean, text, uuid) to service_role") &&
    migration2.includes("grant execute on function public.admin_set_user_entitlement(uuid, text, text, integer) to service_role"),
  "user & admin SQL RPCs harden search_path, block self-demotion/unconfirmed admins, and restrict execution to service_role"
);
check(
  edgeFn.includes("admin_users_list") &&
    edgeFn.includes("admin_set_role") &&
    edgeFn.includes("admin_set_entitlement") &&
    edgeFn.includes("admin_invite_user") &&
    edgeFn.includes("inviteUserByEmail"),
  "access-codes Edge Function exposes server-verified user & admin management actions"
);

/* 2. Dynamic behavioral VM tests for window.POG.adminCodes */
function makeElement(tag) {
  const attrs = {};
  return {
    tagName: String(tag || "div").toUpperCase(),
    className: "",
    hidden: false,
    innerHTML: "",
    textContent: "",
    _listeners: {},
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
    addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    querySelector() { return { focus() {}, setSelectionRange() {} }; },
    focus() {}
  };
}

async function runBehavioralTests() {
  const listeners = {};
  const docListeners = {};
  const bodyChildren = [];
  let lang = "it";
  let isAdminFlag = false;
  let listCalls = 0;
  let createCalls = [];
  let revokeCalls = [];
  let refreshEntitlementCalls = 0;
  let copyValue = "";
  let userRoleCalls = [];
  let userEntCalls = [];
  let inviteUserCalls = [];
  let mockUsers = [
    {
      user_id: "adm-self",
      email: "admin@example.com",
      display_name: "Admin Self",
      email_confirmed: true,
      tier: "full",
      source: "admin",
      active_until: new Date(Date.now() + 60 * 86400000).toISOString(),
      is_db_admin: true,
      is_env_admin: true,
      is_admin: true,
      admin_note: "Owner"
    },
    {
      user_id: "usr-normal",
      email: "patient@example.com",
      display_name: "Patient <svg/onload=alert(1)>",
      email_confirmed: true,
      tier: "free",
      source: "free",
      active_until: null,
      is_db_admin: false,
      is_env_admin: false,
      is_admin: false,
      admin_note: ""
    }
  ];

  const now = Date.now();
  let mockCodes = [
    {
      id: "code-1",
      code: "POG-SINGLE-1",
      code_type: "single",
      max_uses: 1,
      used_count: 1,
      duration_days: 30,
      recipient_note: 'Dr. <script>alert(1)</script> Rossi',
      created_at: new Date(now - 86400000).toISOString(),
      redeem_by: new Date(now + 10 * 86400000).toISOString(),
      fixed_expires_at: null,
      revoked_at: null,
      code_redemptions: [
        {
          id: "red-1",
          user_id: "usr-11112222",
          user_email: "patient+<xss>@example.com",
          redeemed_at: new Date(now - 3600000).toISOString(),
          expires_at: new Date(now + 29 * 86400000).toISOString()
        }
      ]
    },
    {
      id: "code-2",
      code: "POG-GROUP-20",
      code_type: "group",
      max_uses: 20,
      used_count: 2,
      duration_days: 90,
      recipient_note: "Clinica Roma",
      created_at: new Date(now - 2 * 86400000).toISOString(),
      redeem_by: null,
      fixed_expires_at: null,
      revoked_at: null,
      code_redemptions: []
    },
    {
      id: "code-3",
      code: "POG-OLD-REV",
      code_type: "group",
      max_uses: null,
      used_count: 4,
      duration_days: 30,
      recipient_note: "Expired cohort",
      created_at: new Date(now - 10 * 86400000).toISOString(),
      redeem_by: null,
      fixed_expires_at: null,
      revoked_at: new Date(now - 86400000).toISOString(),
      code_redemptions: []
    }
  ];

  const sandbox = {
    console,
    Date,
    Math,
    Number,
    Array,
    String,
    Object,
    encodeURIComponent,
    isFinite,
    isNaN,
    navigator: {
      clipboard: {
        writeText: async (txt) => { copyValue = txt; }
      }
    },
    window: {
      location: { origin: "https://app.example", pathname: "/parole/" },
      addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
      dispatchEvent(ev) {
        (listeners[ev.type] || []).forEach((fn) => fn(ev));
      },
      POG: {
        getLang: () => lang,
        entitlements: {
          status: () => ({ uid: "adm-self" }),
          isAdmin: () => isAdminFlag,
          refresh: async () => { refreshEntitlementCalls++; },
          adminList: async () => {
            listCalls++;
            return mockCodes.map((c) => Object.assign({}, c));
          },
          adminCreate: async (opts) => {
            createCalls.push(opts);
            const created = {
              id: "code-new-" + createCalls.length,
              code: opts.custom_code || ("POG-GEN-" + createCalls.length),
              code_type: opts.code_type,
              max_uses: opts.code_type === "single" ? 1 : (opts.uncapped ? null : opts.max_uses),
              used_count: 0,
              duration_days: opts.duration_days,
              recipient_note: opts.recipient_note || "",
              created_at: new Date().toISOString(),
              code_redemptions: []
            };
            mockCodes.unshift(created);
            return [created];
          },
          adminRevoke: async (id, revokeActiveGrants) => {
            revokeCalls.push({ id, revokeActiveGrants });
            const target = mockCodes.find((c) => c.id === id);
            if (target) target.revoked_at = new Date().toISOString();
            return { ok: true, code_id: id, revoked_active: revokeActiveGrants ? 2 : 0 };
          },
          adminListUsers: async () => mockUsers.map((u) => Object.assign({}, u)),
          adminSetUserRole: async (userId, makeAdmin, note) => {
            userRoleCalls.push({ userId, makeAdmin, note });
            const target = mockUsers.find((u) => u.user_id === userId);
            if (target) {
              target.is_db_admin = !!makeAdmin;
              target.is_admin = !!makeAdmin || !!target.is_env_admin;
              if (makeAdmin && note) target.admin_note = note;
              if (!makeAdmin) target.admin_note = "";
            }
            return { ok: true, user_id: userId, is_db_admin: !!makeAdmin, env_admin_protected: false };
          },
          adminSetUserEntitlement: async (userId, tier, days) => {
            userEntCalls.push({ userId, tier, days });
            const target = mockUsers.find((u) => u.user_id === userId);
            if (target) {
              target.tier = tier;
              target.source = tier === "full" ? "admin" : "free";
              target.active_until = tier === "full" ? new Date(Date.now() + Number(days) * 86400000).toISOString() : null;
            }
            return { ok: true, user_id: userId, tier };
          },
          adminInviteUser: async (opts) => {
            inviteUserCalls.push(opts);
            mockUsers.push({
              user_id: "usr-inv-" + inviteUserCalls.length,
              email: opts.email,
              display_name: "",
              email_confirmed: false,
              tier: opts.grant_days > 0 ? "full" : "free",
              source: opts.grant_days > 0 ? "admin" : "free",
              active_until: opts.grant_days > 0 ? new Date(Date.now() + opts.grant_days * 86400000).toISOString() : null,
              is_db_admin: false,
              is_env_admin: false,
              is_admin: false,
              admin_note: ""
            });
            return { ok: true, email: opts.email, grant_days: opts.grant_days };
          }
        }
      }
    },
    document: {
      body: {
        appendChild(el) { bodyChildren.push(el); return el; },
        removeChild() {}
      },
      createElement: makeElement,
      addEventListener(ev, fn) { (docListeners[ev] = docListeners[ev] || []).push(fn); }
    }
  };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(adminJs, sandbox);

  const api = sandbox.window.POG.adminCodes;
  check(!!api && typeof api.openModal === "function", "window.POG.adminCodes API registered");
  check(api.inviteUrl("pog-clinic-1") === "https://app.example/parole/?code=POG-CLINIC-1", "inviteUrl formats clean ?code= share link");

  check(api.classifyCode({ revoked_at: null, max_uses: 10, used_count: 2 }, now) === "active", "classifyCode identifies active code");
  check(api.classifyCode({ revoked_at: "2026-01-01T00:00:00Z" }, now) === "revoked", "classifyCode identifies revoked code");
  check(api.classifyCode({ revoked_at: null, max_uses: 5, used_count: 5 }, now) === "full", "classifyCode identifies full code");
  check(api.classifyCode({ revoked_at: null, redeem_by: new Date(now - 1000).toISOString() }, now) === "expired", "classifyCode identifies past redeem_by as expired");

  // 2a. Non-admin guard
  api.openModal();
  const panel = bodyChildren[0];
  check(!!panel && panel.hidden === false && /amministratori/i.test(panel.innerHTML) && listCalls === 0,
    "non-admin user sees access-required alert and never invokes adminList");

  // 2b. Admin open & XSS escaping
  isAdminFlag = true;
  api.openModal();
  await new Promise((r) => setTimeout(r, 15));
  check(listCalls === 1 && panel.innerHTML.includes("POG-SINGLE-1") && panel.innerHTML.includes("POG-GROUP-20"),
    "admin openModal loads access codes list");
  check(!panel.innerHTML.includes("<script>alert(1)</script>") && panel.innerHTML.includes("&lt;script&gt;alert(1)&lt;/script&gt;"),
    "recipient_note dynamic HTML/XSS payload is escaped");

  // 2c. Toggle redemptions & verify escaped user_email
  const fireClick = (attrs) => {
    const btn = {
      getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
      closest() { return btn; }
    };
    (panel._listeners.click || []).forEach((fn) => fn({ target: btn }));
  };
  fireClick({ "data-adc": "toggle-redemptions", "data-id": "code-1" });
  check(panel.innerHTML.includes("patient+&lt;xss&gt;@example.com"),
    "redemptions drawer renders escaped user_email");

  // 2d. Validation rejects bad custom_code & past date without invoking adminCreate
  const fireInput = (name, value, type) => {
    const inp = { name, value, checked: !!value, type: type || "text", getAttribute() { return null; } };
    (panel._listeners.input || []).forEach((fn) => fn({ target: inp }));
  };
  const submitForm = () => {
    const form = { tagName: "FORM" };
    const wrap = { closest(sel) { return sel.includes("data-adc-form") ? form : null; } };
    (panel._listeners.submit || []).forEach((fn) => fn({ target: wrap, preventDefault() {} }));
  };
  fireInput("custom_code", "BAD");
  submitForm();
  await new Promise((r) => setTimeout(r, 10));
  check(createCalls.length === 0 && /6–32/.test(panel.innerHTML),
    "invalid short custom code fails validation client-side without calling backend");

  fireInput("custom_code", "CLINIC-OK1");
  fireInput("redeem_by", "2020-01-01");
  submitForm();
  await new Promise((r) => setTimeout(r, 10));
  check(createCalls.length === 0 && /futuro/i.test(panel.innerHTML),
    "past redeem_by date fails validation client-side without calling backend");

  // 2e. Valid Single custom code creation
  fireInput("redeem_by", "");
  fireInput("recipient_note", "Maria Cohort");
  submitForm();
  await new Promise((r) => setTimeout(r, 15));
  check(
    createCalls.length === 1 &&
      createCalls[0].code_type === "single" &&
      createCalls[0].custom_code === "CLINIC-OK1" &&
      createCalls[0].count === 1 &&
      createCalls[0].recipient_note === "Maria Cohort" &&
      panel.innerHTML.includes("https://app.example/parole/?code=CLINIC-OK1"),
    "valid custom single-user code submits normalized payload and shows ?code= invite link"
  );

  // 2f. Copy invite link
  fireClick({ "data-adc": "copy-link", "data-code": "CLINIC-OK1" });
  await new Promise((r) => setTimeout(r, 10));
  check(copyValue === "https://app.example/parole/?code=CLINIC-OK1", "copy-link copies full invite URL");

  // 2g. Group capped vs uncapped creation
  fireClick({ "data-adc": "set-type", "data-type": "group" });
  fireInput("max_uses", "15");
  fireClick({ "data-adc": "preset-days", "data-days": "90" });
  submitForm();
  await new Promise((r) => setTimeout(r, 15));
  check(
    createCalls.length === 2 &&
      createCalls[1].code_type === "group" &&
      createCalls[1].max_uses === 15 &&
      createCalls[1].uncapped === false &&
      createCalls[1].duration_days === 90,
    "group capped code sends expected max_uses and duration_days"
  );

  fireInput("uncapped", true, "checkbox");
  submitForm();
  await new Promise((r) => setTimeout(r, 15));
  check(
    createCalls.length === 3 &&
      createCalls[2].code_type === "group" &&
      createCalls[2].uncapped === true &&
      createCalls[2].max_uses === undefined,
    "group uncapped code sends uncapped:true without max_uses"
  );

  // 2h. Filter & Search
  fireClick({ "data-adc": "filter", "data-filter": "group" });
  check(!panel.innerHTML.includes("POG-SINGLE-1") && panel.innerHTML.includes("POG-GROUP-20"),
    "group filter hides single codes and shows group codes");
  fireClick({ "data-adc": "filter", "data-filter": "all" });

  // 2i. Inline 2-step revoke (soft & hard)
  fireClick({ "data-adc": "ask-revoke", "data-id": "code-2" });
  check(panel.innerHTML.includes('data-adc="revoke-soft"') && panel.innerHTML.includes('data-adc="revoke-hard"'),
    "ask-revoke opens inline confirmation with soft & hard revoke options");
  fireClick({ "data-adc": "revoke-hard", "data-id": "code-2" });
  await new Promise((r) => setTimeout(r, 15));
  check(
    revokeCalls.length === 1 &&
      revokeCalls[0].id === "code-2" &&
      revokeCalls[0].revokeActiveGrants === true &&
      refreshEntitlementCalls >= 1,
    "hard revoke calls adminRevoke(id, true) and refreshes entitlement state"
  );

  // 2j. Language switch IT -> EN
  lang = "en";
  sandbox.window.dispatchEvent({ type: "pog:languagechange", detail: { lang: "en" } });
  check(/Admin panel/.test(panel.innerHTML) && /Redemptions/.test(panel.innerHTML),
    "language switch updates admin panel copy to English immediately");

  // 2k. Users & Admins management tab
  fireClick({ "data-adc": "main-tab", "data-tab": "users" });
  await new Promise((r) => setTimeout(r, 15));
  check(panel.innerHTML.includes("patient@example.com") && panel.innerHTML.includes("Patient &lt;svg/onload=alert(1)&gt;"),
    "users tab loads accounts and HTML-escapes display names");

  const submitInvite = () => {
    const form = { tagName: "FORM" };
    const wrap = { closest(sel) { return sel.includes('invite') ? form : null; } };
    (panel._listeners.submit || []).forEach((fn) => fn({ target: wrap, preventDefault() {} }));
  };
  fireInput("invite_email", "newdoc@clinic.org");
  fireInput("invite_days", "60");
  submitInvite();
  await new Promise((r) => setTimeout(r, 15));
  check(
    inviteUserCalls.length === 1 && inviteUserCalls[0].email === "newdoc@clinic.org" && inviteUserCalls[0].grant_days === 60 &&
      panel.innerHTML.includes("newdoc@clinic.org"),
    "inviting user sends invite payload with initial Full Access days and refreshes users list"
  );

  fireClick({ "data-adc": "u-ask-grant", "data-id": "usr-normal", "data-email": "patient@example.com" });
  fireInput("u_grant_days", "90");
  fireClick({ "data-adc": "u-confirm" });
  await new Promise((r) => setTimeout(r, 15));
  check(userEntCalls.length === 1 && userEntCalls[0].tier === "full" && userEntCalls[0].days === 90,
    "granting Full Access to normal user sends adminSetUserEntitlement('full', 90)");

  fireClick({ "data-adc": "u-ask-promote", "data-id": "usr-normal", "data-email": "patient@example.com" });
  fireInput("u_promote_note", "Clinic coordinator");
  fireClick({ "data-adc": "u-confirm" });
  await new Promise((r) => setTimeout(r, 15));
  check(userRoleCalls.length === 1 && userRoleCalls[0].userId === "usr-normal" && userRoleCalls[0].makeAdmin === true && userRoleCalls[0].note === "Clinic coordinator",
    "promoting confirmed normal user to Admin sends role change and note");

  fireClick({ "data-adc": "u-ask-demote", "data-id": "usr-normal", "data-email": "patient@example.com" });
  fireClick({ "data-adc": "u-confirm" });
  await new Promise((r) => setTimeout(r, 15));
  check(userRoleCalls.length === 2 && userRoleCalls[1].makeAdmin === false,
    "removing DB Admin role calls adminSetUserRole(id, false)");

  // 2l. Sign-out clears in-memory codes, users & emails and closes dialog
  sandbox.window.dispatchEvent({ type: "pog:authchange", detail: { signedOut: true } });
  check(panel.hidden === true && !panel.innerHTML.includes("patient@example.com"),
    "sign-out closes admin dialog and clears rendered sensitive emails/codes");

  if (failures) process.exit(1);
  console.log("All admin-codes checks passed.");
}

runBehavioralTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
