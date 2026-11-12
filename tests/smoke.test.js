#!/usr/bin/env node
/*
 * Browser click-through of the built page (run `npm run build` first).
 * Needs Playwright with Chromium:  npm install && npx playwright install chromium
 *
 * Covers: first-time profile with interests, the mode choice, a full assisted
 * session, and a solo session with a simulated microphone (the real one is
 * provided by the Claude artifact host and is not available here).
 *
 *   node tests/smoke.test.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const html = fs.readFileSync(path.resolve(__dirname, "../dist/parole-ogni-giorno.html"), "utf8");
const sdkSource = fs.readFileSync(path.resolve(__dirname, "../js/vendor/supabase-js-2.119.0.js"), "utf8").replace(/<\/script/gi, "<\\/script");
const sdkInline = "<script>\n" + sdkSource + "</script>";

// Stand-in for the host's dictation capability: window.__say(text) "speaks".
const MOCK_MIC = `(function(){
  var h={f:[],s:[]}, on=false;
  function st(s,r){h.s.forEach(function(f){f(r?{state:s,reason:r}:{state:s});});}
  var d={start:function(){on=true;st('starting');return new Promise(function(r){setTimeout(function(){st('listening');r();},30);});},
    stop:function(){if(!on)return Promise.resolve();on=false;return new Promise(function(r){setTimeout(function(){st('idle','stopped');r();},30);});},
    active:function(){return on;},onPartial:function(){return function(){};},
    onFinal:function(f){h.f.push(f);return function(){};},onState:function(f){h.s.push(f);return function(){};}};
  window.__say=function(t){h.f.forEach(function(f){f({text:t});});};
  window.claude={use:function(n){return Promise.resolve(n==='dictation'?d:null);}};
})();`;

const SCRIPT_CUES = { "Al bar": "Vorrei un caffè, per favore.", "Hai bisogno di una mano": "Puoi aiutarmi, per favore?", "Qualcuno ti chiede come stai": "Grazie, sto bene." };

/* The app rotates topics by calendar day. Pin the day (a multiple of 4, so the first topic of every
   list) so checks on specific topics don't depend on when the test runs. Time still moves forward. */
const FIXED_DAY = `(function(){ var real = Date.now, shift = (20400 * 86400000 + 43200000) - real(); Date.now = function(){ return real() + shift; }; })();`;

/* Account, cloud and privacy options live in the "Account and data" menu in the page header. */
async function menuClick(page, selector) {
  if ((await page.getAttribute(".util-toggle", "aria-expanded")) !== "true") await page.click(".util-toggle");
  await page.click(".util-sheet " + selector);
}

async function open(browser, withMic, supabaseStub, viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 820, height: 1180 } });
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.addInitScript(FIXED_DAY);
  if (withMic) await page.addInitScript(MOCK_MIC);
  // The test stub replaces the exact inlined local SDK; production retains its
  // separately verified asset and SRI attribute in index.html.
  const pageHtml = supabaseStub ? html.replace(sdkInline, "<script>\n" + supabaseStub + "</script>") : html;
  await page.route("http://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + pageHtml + "</body></html>" }));
  await page.goto("http://app.test/");
  return page;
}

async function spokenAnswer(page) {
  const tag = await page.textContent(".tag");
  if (/Racconto/.test(tag)) return "Mi sveglio presto, bevo il caffè, faccio colazione e poi leggo il giornale in cucina con calma";
  if (/Parole ·/.test(tag)) return "è " + (await page.getAttribute(".pic", "aria-label"));
  if (/Sequenze/.test(tag)) return (await page.$$eval(".chip", (e) => e.map((x) => x.textContent))).join(" ");
  if (await page.$(".passage")) return page.textContent(".passage");
  if (await page.$(".phrase")) return page.textContent(".phrase");
  if (await page.$(".cue")) return SCRIPT_CUES[(await page.textContent(".cue")).trim()];
  return "";
}

async function playThrough(page, solo) {
  for (let i = 0; i < 300; i++) {
    if (await page.$(".sumhead")) return;
    if (await page.$('[data-act="advance"]')) { await page.click('[data-act="advance"]'); continue; }
    if (await page.$('[data-act="reveal"]')) { await page.click('[data-act="reveal"]'); continue; }
    if ((await page.$(".cw")) || (await page.$(".slots"))) { await page.click('[data-act="hint"]'); continue; }
    if (await page.$(".maze")) { await page.click('[data-act="maze-skip"]'); continue; }
    const opts = await page.$$('[data-act="opt"]:not([disabled])');
    if (opts.length) { await opts[0].click(); await page.waitForTimeout(1700); continue; }
    if (solo && (await page.$('[data-act="mic"]'))) {
      await page.click('[data-act="mic"]'); await page.waitForTimeout(80);
      await page.evaluate((t) => window.__say(t), await spokenAnswer(page)); await page.waitForTimeout(100);
      if (await page.$('[data-act="mic-done"]')) await page.click('[data-act="mic-done"]');
      await page.waitForTimeout(150); continue;
    }
    await page.click('[data-r="good"]');
  }
  throw new Error("session did not finish");
}

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const check = (ok, msg) => { console.log((ok ? "ok   " : "FAIL ") + msg); if (!ok) failures++; };

  // Assisted session with interests
  const p = await open(browser, false);
  await p.click('[data-k="calcio"]'); await p.fill("#pf-city", "Bologna"); await p.fill("#pf-team", "Bologna FC");
  await p.click('[data-act="onboard-skip"]');
  check(/nome/.test(await p.textContent(".nudge")), "name is required");
  check((await p.getAttribute('[data-k="calcio"]', "aria-pressed")) === "true", "chosen interests survive a validation message");
  await p.fill("#pf-name", "Test"); await p.click('[data-act="onboard-skip"]'); await p.click('[data-act="home"]');
  check(/Calcio/.test(await p.textContent(".mychips")), "home shows the interests");
  await p.click('[data-act="start"]'); await p.click('[data-w="assist"]');
  check(/Bologna FC/.test(await p.textContent(".card .instr")), "story topic uses the favourite team");
  const resumePrompt = await p.textContent(".instr");
  const checkpoint = await p.evaluate(() => { const key = Object.keys(localStorage).find((k) => k.startsWith("pog_p_") && k.endsWith("_active_session")); return key ? JSON.parse(localStorage.getItem(key)) : null; });
  check(!!(checkpoint && checkpoint.session && checkpoint.session.steps.length), "active exercise checkpoint is saved locally");
  await p.reload();
  check(await p.textContent(".instr") === resumePrompt, "refresh restores the exact active exercise");
  await playThrough(p, false);
  check((await p.$$("tbody tr")).length >= 10, "assisted session completes with a summary");
  check(p.errors.length === 0, "no page errors (assisted): " + p.errors.join("; "));

  // Shared-device profiles keep each person's settings and history separate.
  await p.click('[data-act="home"]');
  await p.click('[data-act="profiles"]');
  await p.click('[data-act="profile-add"]');
  await p.fill("#pf-name", "Second");
  await p.click('[data-act="onboard-skip"]');
  await p.click('[data-act="home"]');
  check(/Second/.test(await p.textContent(".home h1")), "new learner profile becomes active");
  await p.click('[data-act="profiles"]');
  await p.click('button[data-act="profile-switch"]:has-text("Test")');
  check(/Test/.test(await p.textContent(".home h1")), "switching restores the original learner profile");
  check(/Calcio/.test(await p.textContent(".mychips")), "original learner interests remain isolated after switching");
  await p.click('[data-act="lang"][data-l="en"]');
  check((await p.textContent(".home h1")) === "Hello, Test", "English language selection updates the learner greeting");
  await p.evaluate(() => { localStorage.setItem("pog_account_signed_out", "1"); window.dispatchEvent(new CustomEvent("pog:authchange", { detail: { signedIn: false, signedOut: true } })); });
  check((await p.textContent(".home h1")) === "Welcome", "signing out removes the learner name from the greeting without deleting the profile");
  await p.evaluate(() => { localStorage.removeItem("pog_account_signed_out"); window.dispatchEvent(new CustomEvent("pog:authchange", { detail: { signedIn: true, signedOut: false } })); });
  check((await p.textContent(".home h1")) === "Hello, Test", "signing in restores the learner greeting");

  // English content and the cloud backup panel must follow the selected language.
  const en = await open(browser, false);
  await en.click('[data-act="lang"][data-l="en"]');
  await en.fill("#pf-name", "English");
  await en.click('[data-act="onboard-skip"]');
  await en.click('[data-act="home"]');
  check((await en.textContent(".home h1")) === "Hello, English", "new profile uses English interface text");
  await menuClick(en, ".cloud-launcher");
  check((await en.textContent(".cloud-card h2")) === "Cloud backup", "cloud backup opens in the selected English language");
  await en.evaluate(() => document.querySelector('[data-act="lang"][data-l="it"]').click());
  check((await en.textContent(".cloud-card h2")) === "Backup cloud", "open cloud backup panel refreshes to Italian");
  await en.evaluate(() => document.querySelector('[data-act="lang"][data-l="en"]').click());
  check((await en.textContent(".cloud-card h2")) === "Cloud backup", "open cloud backup panel refreshes back to English");
  await en.click('[data-cloud="close"]');
  await en.click('[data-act="start"]');
  await en.click('[data-w="assist"]');
  check(/Your morning/.test(await en.textContent(".instr")), "English learning session uses English exercise content");
  // The choice must survive a reload in every panel, not only in the main app.
  await en.click('[data-act="stop"]');
  await en.click('[data-act="home"]');
  await en.reload();
  check((await en.textContent(".home h1")) === "Hello, English", "English stays selected after reloading");
  await menuClick(en, ".cloud-launcher");
  check((await en.textContent(".cloud-card h2")) === "Cloud backup", "after reloading, the cloud backup panel is still in English");
  await en.click('[data-cloud="close"]');
  check(en.errors.length === 0, "no page errors (English language and logout): " + en.errors.join("; "));

  // Real sign-out through the Account dialog, with a stand-in for Supabase that remembers the sign-out.
  const SUPABASE_STUB = `window.supabase = { createClient: function () {
    var subs = [], signedIn = !sessionStorage.getItem("signedOut");
    var user = { id: "u1", email: "test@example.com", user_metadata: {} };
    var q = function () { var o = { select: function () { return o; }, eq: function () { return o; }, order: function () { return o; }, limit: function () { return o; },
      maybeSingle: function () { return Promise.resolve({ data: null, error: null }); }, single: function () { return Promise.resolve({ data: null, error: null }); },
      then: function (r) { return Promise.resolve({ data: [], error: null }).then(r); } }; return o; };
    return { auth: {
        getSession: function () { return Promise.resolve({ data: { session: signedIn ? { user: user } : null } }); },
        getUser: function () { return Promise.resolve({ data: { user: signedIn ? user : null } }); },
        onAuthStateChange: function (cb) { subs.push(cb); return { data: { subscription: { unsubscribe: function () {} } } }; },
        signOut: function () { signedIn = false; sessionStorage.setItem("signedOut", "1"); subs.forEach(function (cb) { cb("SIGNED_OUT", null); }); return Promise.resolve({ error: null }); }
      }, from: q, rpc: function () { return Promise.resolve({ data: null, error: null }); }, functions: { invoke: function () { return Promise.resolve({ data: null, error: null }); } } };
  } };`;
  const so = await open(browser, false, SUPABASE_STUB);
  await so.fill("#pf-name", "Eric"); await so.click('[data-act="onboard-skip"]'); await so.click('[data-act="home"]');
  await so.waitForTimeout(300);
  check((await so.textContent(".home h1")) === "Ciao, Eric", "signed in: the greeting uses the learner's name");
  await menuClick(so, ".account-launcher");
  await Promise.all([so.waitForNavigation(), so.click('[data-action="signout"]')]);
  await so.waitForTimeout(300);
  check(!(await so.$(".account-panel:not([hidden])")), "signing out closes the account dialog and reloads the page");
  check((await so.textContent(".home h1")) === "Benvenuto", "after signing out, the learner's name is gone");
  check(!(await so.$(".mychips")), "after signing out, the learner's interests are hidden");
  check(so.errors.length === 0, "no page errors (sign-out): " + so.errors.join("; "));

  // Phone screen: no button may float over the page; every account and data option is in the header menu.
  const ph = await open(browser, false, SUPABASE_STUB, { width: 390, height: 844 });
  const floating = () => ph.evaluate(() => [...document.querySelectorAll("button")].filter((x) => getComputedStyle(x).position === "fixed" && x.getClientRects().length).map((x) => x.textContent.trim()));
  await ph.waitForTimeout(300);
  check((await floating()).length === 0, "phone, first screen: no floating buttons cover the page");
  await ph.fill("#pf-name", "Phone"); await ph.click('[data-act="onboard-skip"]'); await ph.click('[data-act="home"]');
  await ph.click('[data-act="settings"]'); await ph.click('[data-act="home"]');
  await ph.click(".util-toggle");
  const items = await ph.$$eval(".util-sheet > button", (bs) => bs.map((x) => x.className));
  check(items.length === 7, "phone: all 7 account and data options are still in the menu after changing screens (" + items.length + ")");
  check((await floating()).length === 0, "phone, home: no floating buttons cover the page");
  await ph.click(".util-sheet .deletion-retention-launcher");
  check(await ph.isVisible(".account-panel"), "phone: an option in the menu opens its dialog");
  check((await ph.getAttribute(".util-toggle", "aria-expanded")) === "false", "phone: the menu closes when an option is chosen");
  await ph.click('[data-ret="close"]');
  await ph.click('[data-act="start"]'); await ph.click('[data-w="assist"]');
  check(!(await ph.isVisible(".util-toggle")), "phone: the account menu is hidden during exercises");
  check(ph.errors.length === 0, "no page errors (phone layout): " + ph.errors.join("; "));

  // Solo session with a simulated microphone
  const q = await open(browser, true);
  await q.fill("#pf-name", "Test"); await q.click('[data-act="onboard-skip"]'); await q.click('[data-act="home"]');
  await q.click('[data-act="start"]'); await q.click('[data-w="solo"]');
  await playThrough(q, true);
  // Spoken games only: the test reveals crossword and word-building answers on purpose.
  const spoken = await q.$$eval("tbody tr", (rows) => rows
    .filter((r) => /Racconto|Parole|Frasi|Ripetizione|Sequenze/.test(r.children[0].textContent))
    .map((r) => r.querySelector(".pill").textContent));
  check(spoken.length >= 8 && spoken.every((r) => r === "Giusto"), "solo session: spoken answers recognised (" + spoken.join(", ") + ")");
  check(q.errors.length === 0, "no page errors (solo): " + q.errors.join("; "));

  await browser.close();

  /* Website version: browser speech recognition (simulated) + real recording from Chromium's fake microphone. */
  const browser2 = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const MOCK_SR = `(function(){
    function SR(){ window.__sr = this; }
    SR.prototype.start = function(){ var s = this; setTimeout(function(){ s.onstart && s.onstart(); }, 20); };
    SR.prototype.stop = function(){ var s = this; setTimeout(function(){ s.onend && s.onend(); }, 20); };
    SR.prototype.abort = SR.prototype.stop;
    window.webkitSpeechRecognition = SR; window.SpeechRecognition = SR;
    window.__say = function(t){ var s = window.__sr; s.onspeechstart && s.onspeechstart(); var r = [{ transcript: t }]; r.isFinal = true; s.onresult && s.onresult({ resultIndex: 0, results: [r] }); };
  })();`;
  const ctx2 = await browser2.newContext({ viewport: { width: 1000, height: 1200 }, acceptDownloads: true });
  const w = await ctx2.newPage();
  w.errors = [];
  w.on("pageerror", (e) => w.errors.push(e.message));
  await w.addInitScript(MOCK_SR);
  // https, like GitHub Pages: browsers only allow the microphone on secure pages
  await w.route("https://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + html + "</body></html>" }));
  await w.goto("https://app.test/");
  await w.fill("#pf-name", "Test"); await w.click('[data-act="onboard-skip"]');
  // reading aloud at level 2 (word-by-word highlighting)
  await w.selectOption("#lv-read", "2"); await w.click('[data-act="save-settings"]');
  // consent, then PIN
  await w.click('[data-act="rec-on"]');
  await w.click('[data-act="consent-yes"]');
  check(/casella/.test(await w.textContent(".nudge")), "consent needs the box ticked");
  await w.check("#consent-ok"); await w.click('[data-act="consent-yes"]');
  check(!!(await w.$("#th-pin1")), "after consent, asks to create a PIN");
  await w.fill("#th-pin1", "1234"); await w.fill("#th-pin2", "4321"); await w.click('[data-act="pin-set"]');
  check(/coincidono/.test(await w.textContent(".nudge")), "mismatched PINs are refused");
  await w.fill("#th-pin1", "1234"); await w.fill("#th-pin2", "1234"); await w.click('[data-act="pin-set"]');
  await w.waitForSelector(".report");
  check(true, "PIN saved and therapist area opens");
  await w.click('[data-act="home"]');
  // solo session with recording
  await w.click('[data-act="start"]');
  check(/Google/.test(await w.textContent(".note")), "mode screen explains where the browser sends speech");
  await w.click('[data-w="solo"]');
  let sawRead = false;
  for (let i = 0; i < 300; i++) {
    if (await w.$(".sumhead")) break;
    if (await w.$('[data-act="advance"]')) { await w.click('[data-act="advance"]'); continue; }
    if (await w.$('[data-act="reveal"]')) { await w.click('[data-act="reveal"]'); continue; }
    if ((await w.$(".cw")) || (await w.$(".slots"))) { await w.click('[data-act="hint"]'); continue; }
    const o = await w.$$('[data-act="opt"]:not([disabled])'); if (o.length) { await o[0].click(); await w.waitForTimeout(1700); continue; }
    if (await w.$('[data-act="mic"]')) {
      if (await w.$(".passage")) sawRead = true;
      await w.click('[data-act="mic"]'); await w.waitForTimeout(700);
      if (await w.$(".passage")) check((await w.$$(".rw.on, .rw.done")).length > 0, "reading aloud highlights words while listening");
      await w.evaluate((t) => window.__say(t), await spokenAnswer(w)); await w.waitForTimeout(300);
      if (await w.$('[data-act="mic-done"]')) await w.click('[data-act="mic-done"]');
      await w.waitForTimeout(400); continue;
    }
    await w.click('[data-r="good"]');
  }
  check(sawRead, "the session includes reading aloud");
  const spoken2 = await w.$$eval("tbody tr", (rows) => rows.filter((r) => /Racconto|Parole|Frasi|Lettura|Ripetizione|Sequenze/.test(r.children[0].textContent)).map((r) => r.querySelector(".pill").textContent));
  check(spoken2.length >= 8 && spoken2.every((r) => r === "Giusto"), "browser recognition: spoken answers recognised (" + spoken2.join(", ") + ")");
  // therapist area
  await w.click('[data-act="home"]'); await w.click('[data-act="therapist"]');
  await w.fill("#th-pin", "0000"); await w.click('[data-act="pin-enter"]');
  check(/corretto/.test(await w.textContent(".nudge")), "wrong PIN is refused");
  await w.fill("#th-pin", "1234"); await w.click('[data-act="pin-enter"]');
  await w.waitForSelector(".rec", { timeout: 5000 }).catch(() => {});
  const recs = await w.$$(".rec");
  check(recs.length >= 8, "recordings are listed (" + recs.length + ")");
  check((await w.$$(".rec audio")).length === recs.length, "each recording can be played");
  const sizes = await w.evaluate(() => new Promise((res) => { const rq = indexedDB.open("pog-audio"); rq.onsuccess = () => { const g = rq.result.transaction("rec").objectStore("rec").getAll(); g.onsuccess = () => res(g.result.map((r) => r.blob ? r.blob.size : 0)); }; }));
  check(sizes.length && sizes.every((x) => x > 0), "recordings contain audio");
  check((await w.$$(".report tbody tr")).length >= 1, "speaking trends table has the session");
  check(/parole\/min|Inizio risposta/.test(await w.textContent(".rec .note")), "recordings show speaking measures");
  const [dl] = await Promise.all([w.waitForEvent("download", { timeout: 5000 }), w.click('[data-act="export"]')]);
  check(/\.csv$/.test(dl.suggestedFilename()), "CSV export downloads a file");
  // delete one recording
  await w.click('[data-act="rec-del"]'); await w.click('[data-act="rec-del-yes"]');
  await w.waitForTimeout(400);
  check((await w.$$(".rec")).length === recs.length - 1, "a recording can be deleted after confirming");
  // assisted mode with the helper recording one answer
  await w.click('[data-act="home"]'); await w.click('[data-act="start"]'); await w.click('[data-w="assist"]');
  await w.click('[data-act="arec"]'); await w.waitForTimeout(1500);
  check(/Ferma/.test(await w.textContent('[data-act="arec"]')), "assisted mode: the helper can record an answer");
  await w.click('[data-r="good"]'); await w.waitForTimeout(600);
  const assistRec = await w.evaluate(() => new Promise((res) => { const rq = indexedDB.open("pog-audio"); rq.onsuccess = () => { const g = rq.result.transaction("rec").objectStore("rec").getAll(); g.onsuccess = () => res(g.result.filter((r) => r.result === "good" && !r.heard).length); }; }));
  check(assistRec === 1, "assisted recording is saved with the helper's rating");
  check(w.errors.length === 0, "no page errors (website version): " + w.errors.join("; "));
  await browser2.close();

  if (failures) { console.error(failures + " check(s) failed."); process.exit(1); }
  console.log("All browser checks passed.");
})();
