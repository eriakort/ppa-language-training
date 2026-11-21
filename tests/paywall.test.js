"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const paywallJs = fs.readFileSync(path.join(root, "js/paywall.js"), "utf8");
const appJs = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
const variantsJs = fs.readFileSync(path.join(root, "js/variants.js"), "utf8");
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
check(indexHtml.indexOf('<script src="js/entitlements.js"></script>') < indexHtml.indexOf('<script src="js/paywall.js"></script>'), "index.html loads js/paywall.js after js/entitlements.js");
check(swJs.includes('"js/paywall.js"'), "sw.js precaches js/paywall.js");
check(utilityJs.includes(".account-launcher") && !utilityJs.includes("pw-launcher"), "utility-menu preserves exact 7-item sheet structure");
check(appJs.includes("paywall.recordDailySession()"), "app.js records completed daily sessions against free trial limit");
check(appJs.includes("paywall.homeBannerHtml(lang)"), "app.js renders Home plan status banner without touching .homebtn slots");
check(appJs.includes("paywall.allowAction(act, b)"), "app.js enforces paywall allowAction on click dispatch");
check(appJs.includes("paywall.guardScreen(s)"), "app.js enforces paywall guardScreen on direct navigation");
check(variantsJs.includes("lockBadgeHtml") && variantsJs.includes("allowAction(\"var-start\""), "variants.js marks gated modules and guided run with lock badges");
check(accountJs.includes('pog:open-account') && accountJs.includes('data-action="redeem"'), "account.js exposes plan card and sign-in handoff");
check(!paywallJs.includes("SUPABASE_SERVICE_ROLE_KEY") && !paywallJs.includes("eval(") && !paywallJs.includes("Function("), "paywall.js contains no secrets or dynamic eval");
check(paywallJs.includes("esc(") && stylesCss.includes(".pw-panel") && stylesCss.includes(".pw-banner"), "paywall.js HTML-escapes dynamic text and styles.css defines paywall rules");

/* 2. Dynamic behavioral tests for window.POG.paywall */
function makeElement(tag) {
  const attrs = {};
  return {
    tagName: String(tag || "div").toUpperCase(),
    className: "",
    hidden: false,
    innerHTML: "",
    textContent: "",
    disabled: false,
    _listeners: {},
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
    addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    querySelector(sel) {
      if (sel === "strong") {
        const m = this.innerHTML.match(/<strong>([^<]+)<\/strong>/);
        return m ? { textContent: m[1] } : null;
      }
      return { focus() {} };
    },
    closest() { return null; },
    focus() {}
  };
}

function makeButton(act, extraAttrs, label) {
  const b = makeElement("button");
  b.setAttribute("data-act", act);
  Object.keys(extraAttrs || {}).forEach((k) => b.setAttribute(k, extraAttrs[k]));
  b.innerHTML = label ? "<strong>" + label + "</strong>" : "";
  b.textContent = label || act;
  return b;
}

async function runBehavioralTests() {
  const store = {};
  const listeners = {};
  const dispatched = [];
  let lang = "it";
  let screen = "home";
  let locked = false;
  let tier = "free";
  let uid = "";
  let pending = "POG-DEMO-2026";
  let activeUntil = null;
  let renderCount = 0;
  let bodyChildren = [];
  let redeemBehavior = async (code) => {
    tier = "full";
    activeUntil = new Date(Date.now() + 30 * 86400000).toISOString();
    pending = "";
    return { ok: true, code, tier: "full", active_until: activeUntil };
  };

  const sandbox = {
    console,
    Date,
    Math,
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
    document: {
      body: {
        appendChild(el) { bodyChildren.push(el); }
      },
      createElement(tag) { return makeElement(tag); },
      addEventListener(ev, fn) { (listeners["doc:" + ev] = listeners["doc:" + ev] || []).push(fn); }
    },
    window: null
  };

  sandbox.window = {
    addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    dispatchEvent(ev) {
      dispatched.push(ev);
      (listeners[ev.type] || []).forEach((fn) => fn(ev));
    },
    POG: {
      getLang: () => lang,
      appApi: {
        screen: () => screen,
        go: (s) => {
          if (s !== "home" && sandbox.window.POG.paywall && !sandbox.window.POG.paywall.guardScreen(s)) return;
          screen = s;
        },
        render: () => { renderCount++; },
        isLocked: () => locked
      },
      entitlements: {
        isFull: () => tier === "full",
        pendingCode: () => pending,
        status: () => ({ uid, tier, activeUntil }),
        redeemCode: (code) => redeemBehavior(code)
      }
    }
  };

  vm.runInNewContext(paywallJs, sandbox);
  const pw = sandbox.window.POG.paywall;

  check(pw && pw.FREE_SESSION_LIMIT === 3, "paywall exposes FREE_SESSION_LIMIT === 3");
  check(pw.hasFullAccess() === false && pw.freeSessionsLeft() === 3, "starts on Free plan with 3 daily sessions remaining");

  // Always-free daily safety tools & 3 core PPA drills
  check(pw.allowAction("board", makeButton("board")) === true, "Talk Board remains allowed on Free tier");
  check(pw.allowAction("album", makeButton("album")) === true, "Personal Album remains allowed on Free tier");
  check(pw.allowAction("passport", makeButton("passport")) === true, "Communication Passport remains allowed on Free tier");
  check(pw.allowAction("local-restore", makeButton("local-restore")) === true, "JSON backup restore remains allowed on Free tier");
  check(pw.allowAction("local-wipe", makeButton("local-wipe")) === true, "Device-local erase remains allowed on Free tier");
  check(pw.allowAction("var-start", makeButton("var-start", { "data-m": "sentence" })) === true, "core PPA sentence drill allowed on Free tier");
  check(pw.allowAction("var-start", makeButton("var-start", { "data-m": "semantic" })) === true, "core PPA semantic drill allowed on Free tier");
  check(pw.allowAction("var-start", makeButton("var-start", { "data-m": "soundspan" })) === true, "core PPA soundspan drill allowed on Free tier");

  // Gated guided run + 17 specialized targeted modules + 8 pro therapist actions
  check(pw.allowAction("var-start", makeButton("var-start", { "data-m": "guided" }, "Guided run")) === false, "guided mixed run blocked on Free tier");
  const panelEl = bodyChildren.find((el) => el.className === "pw-panel");
  check(panelEl && panelEl.hidden === false && /sign in|Accedi/i.test(panelEl.innerHTML), "opening paywall signed out prompts account sign-in with pending code");
  check(panelEl.innerHTML.includes("POG-DEMO-2026"), "prefills pending ?code= in paywall modal");
  pw.closeModal();
  check(panelEl.hidden === true, "closeModal hides paywall dialog cleanly");

  const paidTargetActs = [
    "func-home", "wb-home", "wr-home", "disc-home", "pace-home", "verbs-home",
    "narr-home", "gram-home", "surf-home", "circ-home", "num-home", "dg-home",
    "inst-home", "prag-home", "flu-home", "pros-home", "ques-home"
  ];
  check(paidTargetActs.every((act) => pw.isPaidTargetedAct(act) && pw.allowAction(act, makeButton(act, {}, act)) === false), "all 17 specialized targeted modules require Full Access");

  const paidTherapistActs = ["progress", "chk-results", "report", "brief", "carelog", "wb-manage", "export", "local-backup"];
  check(paidTherapistActs.every((act) => pw.isPaidTherapistAct(act) && pw.allowAction(act, makeButton(act, {}, act)) === false), "all 8 pro clinical/reporting tools require Full Access");

  // Direct screen bypass prevention
  screen = "variants";
  check(pw.guardScreen("brief") === false && screen === "home", "guardScreen blocks direct navigation to paid screen and returns to home");
  check(pw.allowScreen("functional") === false && pw.allowScreen("board") === true, "allowScreen differentiates paid and free screens");

  // 3-session trial counter
  pw.closeModal();
  check(pw.allowAction("start", makeButton("start")) === true, "1st daily session allowed");
  pw.recordDailySession();
  check(pw.freeSessionsLeft() === 2 && pw.allowAction("pick-new", makeButton("pick-new")) === true, "2nd daily session allowed");
  pw.recordDailySession();
  check(pw.freeSessionsLeft() === 1 && pw.allowAction("pick-prev", makeButton("pick-prev")) === true, "3rd daily session allowed");
  pw.recordDailySession();
  check(pw.freeSessionsUsed() === 3 && pw.freeSessionsLeft() === 0, "trial counter stops at 3 free sessions left = 0");
  check(pw.allowAction("start", makeButton("start")) === false && panelEl.hidden === false, "4th daily session blocked and opens upgrade modal");
  check(/Sessioni gratuite completate/.test(panelEl.innerHTML), "4th daily session modal displays trial-limit title");
  check(store.pog_free_sessions_v1 === "3" && !/^pog_(p_|profiles|active_profile_id)/.test("pog_free_sessions_v1"), "trial key does not collide with local-wipe profile key assertions");

  // Patient Mode lock notice
  locked = true;
  pw.openModal({ reason: "limit" });
  check(/familiare|carer/i.test(panelEl.innerHTML) && !panelEl.innerHTML.includes('data-pw-form="redeem"'), "patient mode hides code redemption form and shows carer notice");
  locked = false;

  // XSS escaping on feature label & home banner
  const bannerFree = pw.homeBannerHtml("en");
  check(bannerFree.includes("Free plan · 3 daily sessions completed") && bannerFree.includes("POG-DEMO-2026"), "English banner displays free plan completion and pending code");
  pw.allowAction("brief", makeButton("brief", {}, "<script>alert(1)</script>"));
  check(!panelEl.innerHTML.includes("<script>alert(1)</script>") && panelEl.innerHTML.includes("&lt;script&gt;"), "paywall modal HTML-escapes feature labels cleanly");

  // Signed in + error mapping + successful redemption unlocks everything
  uid = "user-99";
  lang = "en";
  pw.openModal({ reason: "manage" });
  check(panelEl.innerHTML.includes('data-pw-form="redeem"') && panelEl.innerHTML.includes('value="POG-DEMO-2026"'), "signed-in user sees prefilled access code form");

  // Trigger Escape key closes modal
  const escHandlers = listeners["doc:keydown"] || [];
  escHandlers.forEach((fn) => fn({ key: "Escape" }));
  check(panelEl.hidden === true, "Escape key closes open paywall modal");

  // Simulate error code mapping then live redeem
  pw.openModal({ reason: "manage" });
  redeemBehavior = async () => { const e = new Error("code_exhausted"); e.code = "code_exhausted"; throw e; };
  const submitHandler = panelEl._listeners.submit[0];
  const fakeForm = {
    closest() { return fakeForm; },
    querySelector() { return { value: "pog-full-used" }; }
  };
  await submitHandler({ target: fakeForm, preventDefault() {} });
  await new Promise((r) => setTimeout(r, 15));
  check(/maximum number of users/.test(panelEl.innerHTML), "maps code_exhausted error cleanly in English");

  redeemBehavior = async (code) => {
    tier = "full";
    activeUntil = new Date(Date.now() + 30 * 86400000).toISOString();
    pending = "";
    return { ok: true, code, tier: "full", active_until: activeUntil };
  };
  await submitHandler({ target: fakeForm, preventDefault() {} });
  await new Promise((r) => setTimeout(r, 15));
  check(pw.hasFullAccess() === true && /Full access activated/.test(panelEl.innerHTML), "valid access code unlocks Full Access and renders confirmation");
  check(pw.allowAction("start", makeButton("start")) === true, "4th daily session unlocks immediately after code redemption");
  check(pw.allowAction("brief", makeButton("brief")) === true && pw.allowAction("var-start", makeButton("var-start", { "data-m": "guided" })) === true, "guided run and clinician actions unlock immediately");
  check(pw.lockBadgeHtml("en") === "" && pw.homeBannerHtml("en").includes("Full access active"), "lock badges disappear and Home banner shows active Full Access");
}

runBehavioralTests()
  .then(() => {
    if (failures) {
      console.error(failures + " check(s) failed.");
      process.exit(1);
    }
    console.log("All paywall checks passed.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
