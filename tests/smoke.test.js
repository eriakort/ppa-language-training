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
/* Start a session: continue with last time's games if asked, otherwise accept the suggested selection. */
async function startSession(page) {
  await page.click('[data-act="start"]');
  if (await page.$('[data-act="pick-prev"]')) await page.click('[data-act="pick-prev"]');
  else await page.click('[data-act="pick-next"]');
}

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
  if (/Parola misteriosa|Mystery word/.test(tag)) return "non lo so"; // wrong on purpose: hints, then the choice of words
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
  await startSession(p); await p.click('[data-w="assist"]');
  check(/Bologna FC/.test(await p.textContent(".card .instr")), "story topic uses the favourite team");
  const resumePrompt = await p.textContent(".instr");
  const checkpoint = await p.evaluate(() => { const key = Object.keys(localStorage).find((k) => k.startsWith("pog_p_") && k.endsWith("_active_session")); return key ? JSON.parse(localStorage.getItem(key)) : null; });
  check(!!(checkpoint && checkpoint.session && checkpoint.session.steps.length), "active exercise checkpoint is saved locally");
  await p.reload();
  check(await p.textContent(".instr") === resumePrompt, "refresh restores the exact active exercise");
  await playThrough(p, false);
  const gameLengths = await p.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("pog_p_") && k.endsWith("_sessions"));
    const sessions = key ? JSON.parse(localStorage.getItem(key)) : [];
    const items = sessions.length ? sessions[sessions.length - 1].items : [];
    return {
      crossword: items.filter((item) => item.game === "crossword").length,
      readings: items.filter((item) => item.game === "read").map((item) => item.label.trim().split(/\s+/).length)
    };
  });
  check(gameLengths.crossword >= 8 && gameLengths.crossword <= 10, "crossword session solves 8–10 clue words (" + gameLengths.crossword + ")");
  check(gameLengths.readings.length === 4 && gameLengths.readings.every((words) => words >= 24), "reading session includes four longer passages (" + gameLengths.readings.join(", ") + " words)");
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
  await startSession(en);
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
  await startSession(ph); await ph.click('[data-w="assist"]');
  check(!(await ph.isVisible(".util-toggle")), "phone: the account menu is hidden during exercises");
  // telling, then the two mystery words, then the crossword
  for (let i = 0; i < 3; i++) await ph.click('[data-r="good"]');
  await ph.locator(".kb").scrollIntoViewIfNeeded();
  const keyboardTop = await ph.evaluate(() => window.scrollY);
  await ph.click('.key[data-ch="A"]');
  const keyboardAfterKey = await ph.evaluate(() => ({
    scrollY: window.scrollY,
    focused: document.activeElement && document.activeElement.getAttribute("data-ch"),
    keyboard: { top: document.querySelector(".kb").getBoundingClientRect().top, bottom: document.querySelector(".kb").getBoundingClientRect().bottom },
    viewport: window.innerHeight
  }));
  check(Math.abs(keyboardAfterKey.scrollY - keyboardTop) < 3, "phone: entering a crossword letter keeps the keyboard at the same scroll position");
  check(keyboardAfterKey.focused === "A" && keyboardAfterKey.keyboard.top >= 0 && keyboardAfterKey.keyboard.bottom <= keyboardAfterKey.viewport + 1, "phone: the crossword keyboard stays visible and keeps focus after a letter " + JSON.stringify(keyboardAfterKey));
  check(ph.errors.length === 0, "no page errors (phone layout): " + ph.errors.join("; "));

  // Solo session with a simulated microphone
  const q = await open(browser, true);
  await q.fill("#pf-name", "Test"); await q.click('[data-act="onboard-skip"]'); await q.click('[data-act="home"]');
  await startSession(q); await q.click('[data-w="solo"]');
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
  await startSession(w);
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
  await w.click('[data-act="home"]'); await startSession(w); await w.click('[data-w="assist"]');
  await w.click('[data-act="arec"]'); await w.waitForTimeout(1500);
  check(/Ferma/.test(await w.textContent('[data-act="arec"]')), "assisted mode: the helper can record an answer");
  await w.click('[data-r="good"]'); await w.waitForTimeout(600);
  const assistRec = await w.evaluate(() => new Promise((res) => { const rq = indexedDB.open("pog-audio"); rq.onsuccess = () => { const g = rq.result.transaction("rec").objectStore("rec").getAll(); g.onsuccess = () => res(g.result.filter((r) => r.result === "good" && !r.heard).length); }; }));
  check(assistRec === 1, "assisted recording is saved with the helper's rating");
  check(w.errors.length === 0, "no page errors (website version): " + w.errors.join("; "));
  await browser2.close();

  /* Patient mode, communication board, album and family voices (fake microphone, test photo). */
  const browser3 = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const ctx3 = await browser3.newContext({ viewport: { width: 900, height: 1100 } });
  const SPEECH_SPY = `window.__said = []; window.__played = [];
    (function () {
      var RealAudio = window.Audio;
      window.Audio = function (src) { var a = new RealAudio(src); window.__played.push(src); a.play = function () { var me = this; setTimeout(function () { me.onended && me.onended(); }, 30); return Promise.resolve(); }; return a; };
      if (window.speechSynthesis) window.speechSynthesis.speak = function (u) { window.__said.push(u.text); setTimeout(function () { u.onend && u.onend(); }, 20); };
    })();`;
  await ctx3.addInitScript(FIXED_DAY); await ctx3.addInitScript(SPEECH_SPY);
  await ctx3.route("https://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + html + "</body></html>" }));
  const pa = await ctx3.newPage();
  pa.errors = []; pa.on("pageerror", (e) => pa.errors.push(e.message));
  await pa.goto("https://app.test/");
  await pa.fill("#pf-name", "Eric"); await pa.click('[data-act="onboard-skip"]'); await pa.click('[data-act="home"]');
  check((await pa.$$eval(".homebtn", (bs) => bs.length)) === 2, "home offers the communication board and the album");
  // Board
  await pa.click('[data-act="board"]');
  await pa.click('.aac-tile:has-text("Ho sete")');
  check((await pa.textContent(".aac-msg")) === "Ho sete", "board: tapping a picture shows the phrase");
  check((await pa.evaluate(() => window.__said.slice(-1)[0])) === "Ho sete", "board: tapping a picture says the phrase");
  await pa.click('[data-act="aac-big"]');
  check((await pa.textContent(".aac-big p")) === "Ho sete", "board: the phrase can be shown full screen");
  await pa.click(".aac-big");
  // Album entry with photo and voice
  await pa.click('[data-act="home"]'); await pa.click('[data-act="album"]'); await pa.click('[data-act="alb-edit"]'); await pa.click('[data-act="alb-new"]');
  await pa.fill("#alb-name", "Anna"); await pa.fill("#alb-note", "tua figlia");
  const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAQElEQVR4nO3PQQ0AAAjEMM6/aMDGPqSGlcwBs0YKNVKokUKNFGqkUCOFGinUSKFGCjVSqJFCjRRqpFAjhRop1EjxrnUBAWUgcn8AAAAASUVORK5CYII=", "base64");
  await pa.setInputFiles("#alb-photo", { name: "anna.png", mimeType: "image/png", buffer: PNG });
  await pa.waitForSelector(".alb-preview");
  check((await pa.inputValue("#alb-name")) === "Anna", "album: choosing a photo keeps what was typed");
  await pa.click('[data-act="alb-rec"]'); await pa.waitForTimeout(1200); await pa.click('[data-act="alb-rec-stop"]'); await pa.waitForSelector(".card audio");
  await pa.click('[data-act="alb-save"]');
  check(/consenso/.test(await pa.textContent(".nudge")), "album: a photo or voice can't be saved without consent");
  await pa.check("#alb-consent"); await pa.click('[data-act="alb-save"]'); await pa.waitForSelector(".alb-row");
  const stored = await pa.evaluate(() => new Promise((res) => { const rq = indexedDB.open("pog-album"); rq.onsuccess = () => { const g = rq.result.transaction("items").objectStore("items").getAll(); g.onsuccess = () => { const x = g.result[0] || {}; res({ photoType: x.photo && x.photo.type, audioSize: x.audio ? x.audio.size : 0 }); }; }; }));
  check(stored.photoType === "image/jpeg" && stored.audioSize > 0, "album: photo (re-encoded as JPEG) and voice are stored on the device");
  await pa.click('[data-act="album"]');
  const playedBefore = await pa.evaluate(() => window.__played.length);
  await pa.click(".album-card");
  check((await pa.evaluate(() => window.__played.length)) > playedBefore, "album: tapping a photo plays the family voice");
  // Family voice for a board phrase
  await pa.click('[data-act="alb-edit"]'); await pa.click('[data-act="alb-voices"]');
  await pa.check("#alb-vconsent-ok"); await pa.click('[data-act="alb-vconsent"]');
  await pa.click('.voice-row:has-text("Ho sete") [data-act="alb-rec"]'); await pa.waitForTimeout(1000); await pa.click('[data-act="alb-rec-stop"]'); await pa.waitForSelector(".voice-row audio");
  const playedBoard = await pa.evaluate(() => window.__played.length);
  await pa.click('[data-act="home"]'); await pa.click('[data-act="board"]'); await pa.click('.aac-tile:has-text("Ho sete")');
  check((await pa.evaluate(() => window.__played.length)) > playedBoard, "board: a phrase recorded by a relative plays in their voice");
  await pa.click('[data-act="aac-tab"][data-t="people"]');
  check(!!(await pa.$(".aac-tile img")) && /Anna/.test(await pa.textContent(".aac-grid")), "board: people from the album appear with their photo");
  // Album photo in the games
  await pa.click('[data-act="home"]'); await startSession(pa); await pa.click('[data-w="assist"]');
  let sawAlbumPhoto = false;
  for (let i = 0; i < 120 && !sawAlbumPhoto; i++) {
    if (await pa.$(".pic img")) { sawAlbumPhoto = true; break; }
    if (await pa.$('[data-act="advance"]')) { await pa.click('[data-act="advance"]'); continue; }
    if (await pa.$('[data-act="reveal"]')) { await pa.click('[data-act="reveal"]'); continue; }
    if ((await pa.$(".cw")) || (await pa.$(".slots"))) { await pa.click('[data-act="hint"]'); continue; }
    const o = await pa.$$('[data-act="opt"]:not([disabled])'); if (o.length) { await o[0].click(); await pa.waitForTimeout(1700); continue; }
    if (await pa.$(".sumhead")) break;
    await pa.click('[data-r="good"]');
  }
  check(sawAlbumPhoto, "games: album photos are used in the exercises");
  await pa.click('[data-act="stop"]'); await pa.click('[data-act="home"]');
  // Patient mode
  await pa.click('[data-act="settings"]'); await pa.check("#set-patient"); await pa.click('[data-act="save-settings"]');
  check(!!(await pa.$("#th-pin1")), "patient mode: asks for a PIN first when there is none");
  await pa.fill("#th-pin1", "2468"); await pa.fill("#th-pin2", "2468"); await pa.click('[data-act="pin-set"]');
  await pa.click('[data-act="home"]'); await pa.click('[data-act="settings"]'); await pa.check("#set-patient"); await pa.click('[data-act="save-settings"]');
  await pa.click('[data-act="home"]'); await pa.click('[data-act="relock"]');
  const lockedLinks = await pa.$$eval(".links button", (bs) => bs.map((x) => x.getAttribute("data-act")));
  check(lockedLinks.length === 1 && lockedLinks[0] === "caregiver", "patient mode: only the carer link remains on home");
  check(!(await pa.$(".seg")) && !(await pa.isVisible(".util-toggle")), "patient mode: language switch and account menu are hidden");
  await pa.click('[data-act="board"]'); await pa.click('[data-act="aac-edit"]');
  check(!!(await pa.$("#un-pin")), "patient mode: editing the board asks for the PIN");
  await pa.fill("#un-pin", "1111"); await pa.click('[data-act="unlock-try"]'); await pa.waitForTimeout(100);
  check(/corretto/.test(await pa.textContent(".nudge")), "patient mode: a wrong PIN is refused");
  await pa.fill("#un-pin", "2468"); await pa.click('[data-act="unlock-try"]'); await pa.waitForTimeout(150);
  check(!!(await pa.$("#aac-text")), "patient mode: the right PIN continues to what was asked for");
  await pa.reload(); await pa.waitForTimeout(200);
  await pa.click('[data-act="album"]'); await pa.click('[data-act="alb-edit"]');
  check(!!(await pa.$("#un-pin")), "patient mode: after a reload, editing the album asks for the PIN again");
  check(pa.errors.length === 0, "no page errors (patient mode, board, album): " + pa.errors.join("; "));
  await browser3.close();

  /* Speech check-in (alone with simulated recognition, then with a helper) and the printable summary. */
  const browser4 = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const ctx4 = await browser4.newContext({ viewport: { width: 900, height: 1100 } });
  await ctx4.addInitScript(MOCK_SR);
  await ctx4.route("https://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + html + "</body></html>" }));
  const ck = await ctx4.newPage();
  ck.errors = []; ck.on("pageerror", (e) => ck.errors.push(e.message));
  await ck.goto("https://app.test/");
  await ck.fill("#pf-name", "Eric"); await ck.click('[data-act="onboard-skip"]'); await ck.click('[data-act="home"]');
  check(!(await ck.$('.homebtn[data-act="chk-start"]')), "check-in: not offered before the first session");
  await ck.evaluate(() => { const k = Object.keys(localStorage).find((x) => /^pog_p_.+_profile$/.test(x)).replace(/_profile$/, "_sessions"); localStorage.setItem(k, JSON.stringify([{ id: "s1", date: new Date().toISOString(), mode: "daily", who: "solo", items: [{ game: "name", lv: 1, result: "good", ms: 4000, meas: { onsetMs: 1200, wpm: 110, pauses: 1 } }] }])); });
  await ck.reload();
  check(!!(await ck.$('.homebtn[data-act="chk-start"]')), "check-in: offered on the home screen once due");
  await ck.click('.homebtn[data-act="chk-start"]'); await ck.click('[data-act="chk-who"][data-w="solo"]');
  check(!!(await ck.$(".chk-scene")), "check-in: starts with the picture to describe");
  const say = async (txt, done) => { await ck.click('[data-act="chk-mic"]'); await ck.waitForTimeout(60); await ck.evaluate((t) => window.__say(t), txt); if (done) await ck.click('[data-act="chk-done"]'); await ck.waitForTimeout(120); };
  // a microphone failure is not scored as an answer
  await ck.click('[data-act="chk-mic"]'); await ck.waitForTimeout(60);
  await ck.evaluate(() => { const s = window.__sr; s.onerror && s.onerror({ error: "not-allowed" }); s.onend && s.onend(); });
  await ck.waitForTimeout(80);
  check(!!(await ck.$(".chk-scene")) && /microfono/.test(await ck.textContent(".card")), "check-in: a microphone error asks to try again instead of moving on");
  await say("una signora cucina la minestra e il gatto beve il latte vicino al tavolo", true);
  check(/1 \/ 10/.test(await ck.textContent(".tag")), "check-in: after the description come the 10 names");
  const answers = ["bici", "pesce", "banana", "martello", "candela", "calzini", "carota", "palloncino", "farfalla"];
  for (const a of answers) await say(a, false);
  await ck.click('[data-act="chk-skip"]'); // "non lo so" for the bell
  check(/1 \/ 3/.test(await ck.textContent(".tag")), "check-in: then the sentences to repeat");
  check(!/gatto dorme/i.test(await ck.textContent(".card")), "check-in: sentences to repeat are not shown");
  for (const r of ["il gatto dorme", "domani andiamo al mercato", "la signora con il cappello ha comprato il pane"]) await say(r, true);
  await ck.click('[data-act="chk-flu-start"]'); await ck.waitForTimeout(60);
  await ck.evaluate(() => window.__say("cane gatto cavallo ehm mucca cane"));
  await ck.click('[data-act="chk-done"]'); await ck.waitForTimeout(120);
  check(!!(await ck.$('[data-act="chk-flu-more"]')), "check-in: if listening stops early the minute can continue");
  await ck.click('[data-act="chk-flu-end"]'); await ck.waitForTimeout(150);
  check(/Grazie/.test(await ck.textContent(".card")) && !/\d+ \/ 10|su 10/.test(await ck.textContent(".card")), "check-in: ends with thanks and no score");
  const saved = await ck.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_checkins")); return JSON.parse(localStorage.getItem(k)); });
  const k1 = saved[0];
  check(k1.naming.correct === 9 && k1.naming.total === 10, "check-in: 9 of 10 names recognised (alternatives accepted, skip counted) - got " + k1.naming.correct);
  check(k1.rep.items.length === 3 && k1.rep.items[0].score === 1 && k1.rep.items[2].score < 1, "check-in: repetition scored by coverage");
  check(k1.flu.count === 4, "check-in: animals count distinct words without fillers - got " + k1.flu.count);
  check(k1.desc.words === 14, "check-in: description words counted - got " + k1.desc.words);
  await ck.click('[data-act="chk-home"]');
  check(!(await ck.$('.homebtn[data-act="chk-start"]')), "check-in: not offered again until the next one is due");
  // With a helper
  await ck.evaluate(() => window.POG.appApi.go("checkin"));
  await ck.click('[data-act="chk-who"][data-w="assist"]');
  await ck.click('[data-act="chk-desc-start"]'); await ck.click('[data-act="chk-desc-end"]'); await ck.waitForTimeout(100);
  for (let i = 0; i < 10; i++) await ck.click('[data-act="chk-name"][data-ok="' + (i < 7 ? 1 : 0) + '"]');
  for (const sc of ["1", "0.5", "0"]) await ck.click('[data-act="chk-rep"][data-s="' + sc + '"]');
  await ck.click('[data-act="chk-flu-start"]');
  for (let i = 0; i < 6; i++) await ck.click('[data-act="chk-plus"]');
  await ck.click('[data-act="chk-minus"]'); await ck.click('[data-act="chk-flu-end"]'); await ck.waitForTimeout(150);
  const k2 = (await ck.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_checkins")); return JSON.parse(localStorage.getItem(k)); }))[1];
  check(k2 && k2.who === "assist" && k2.naming.correct === 7 && k2.rep.avg === 0.5 && k2.flu.count === 5, "check-in with a helper: ratings and count saved");
  // Results and summary are behind the PIN
  await ck.evaluate(() => window.POG.appApi.go("report"));
  check(!!(await ck.$("#th-pin1")), "summary: without the PIN, the therapist area opens instead");
  await ck.fill("#th-pin1", "1234"); await ck.fill("#th-pin2", "1234"); await ck.click('[data-act="pin-set"]');
  await ck.click('[data-act="chk-results"]');
  const resInfo = { rows: (await ck.$$("tbody tr")).length, charts: (await ck.$$(".mini-chart")).length };
  check(resInfo.rows === 2 && resInfo.charts === 3, "check-in results: table of both and three charts " + JSON.stringify(resInfo));
  await ck.selectOption("#chk-every", "28"); await ck.click('[data-act="chk-freq"]');
  check((await ck.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_checkin_settings")); return JSON.parse(localStorage.getItem(k)).every; })) === 28, "check-in frequency saved");
  await ck.click('[data-act="therapist"]'); await ck.click('[data-act="report"]');
  const rp = await ck.textContent(".print-area");
  check(/Eric/.test(rp) && /Sessioni/.test(rp) && /Controlli del parlato/.test(rp) && /non è una valutazione clinica/i.test(rp), "summary: name, activity, check-ins and disclaimer: " + rp.slice(0, 400));
  check((await ck.$$(".print-area .mini-chart")).length === 4 && (await ck.$$(".print-area .mini-chart svg")).length >= 3, "summary: two speaking charts and two check-in charts");
  await ck.click('[data-act="rp-period"][data-m="6"]');
  check((await ck.getAttribute('[data-act="rp-period"][data-m="6"]', "aria-pressed")) === "true", "summary: period can be 6 months");
  await ck.emulateMedia({ media: "print" });
  const printVis = await ck.evaluate(() => ({ menu: [...document.querySelectorAll(".no-print, .bar")].some((x) => getComputedStyle(x).visibility === "visible"), area: getComputedStyle(document.querySelector(".print-area h2")).visibility }));
  check(!printVis.menu && printVis.area === "visible", "summary: printing shows only the summary");
  await ck.emulateMedia({ media: "screen" });
  await ck.screenshot({ path: path.join(__dirname, "..", "dist", "report-screen.png"), fullPage: true });
  await ck.emulateMedia({ media: "print" });
  await ck.pdf({ path: path.join(__dirname, "..", "dist", "report-print.pdf") }).catch(() => {});
  check(ck.errors.length === 0, "no page errors (check-in, summary): " + ck.errors.join("; "));
  await browser4.close();

  /* Mystery word, month anagrams, optional calculations and letter path (a word-building day). */
  const browser5 = await chromium.launch();
  const ctx5 = await browser5.newContext({ viewport: { width: 900, height: 1100 } });
  await ctx5.addInitScript(FIXED_DAY.replace("20400 * 86400000", "20401 * 86400000"));
  await ctx5.route("https://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + html + "</body></html>" }));
  const g5 = await ctx5.newPage();
  g5.errors = []; g5.on("pageerror", (e) => g5.errors.push(e.message));
  await g5.goto("https://app.test/");
  await g5.fill("#pf-name", "Test"); await g5.click('[data-act="onboard-skip"]');
  if (await g5.$('[data-act="home"]')) await g5.click('[data-act="home"]');
  await g5.click('[data-act="settings"]');
  await g5.check("#set-calc"); await g5.selectOption("#set-clevel", "3");
  await g5.check("#set-path"); await g5.selectOption("#set-psize", "4");
  await g5.click('[data-act="save-settings"]');
  if (!(await g5.$('[data-act="start"]'))) await g5.click('[data-act="home"]');
  const plan = await g5.textContent(".plan");
  check(/Parola misteriosa/.test(plan) && /Calcoli/.test(plan) && /Percorso di lettere/.test(plan) && /Componi la parola/.test(plan), "home plan lists mystery word, calculations and letter path");
  await startSession(g5); await g5.click('[data-w="assist"]');
  await g5.click('[data-r="good"]'); // telling
  check((await g5.$$(".clues .chip")).length === 5, "mystery word: five clue words are shown");
  await g5.click('[data-r="retry"]');
  check(/Inizia con/.test(await g5.textContent(".hints")), "mystery word: first hint gives the first letter and length");
  await g5.click('[data-r="retry"]');
  const pattern = (await g5.textContent(".hints .pattern")).trim();
  check(/_/.test(pattern), "mystery word: second hint shows some letters (" + pattern + ")");
  await g5.click('[data-r="retry"]');
  const myOpts = await g5.$$eval('[data-act="opt"]', (bs) => bs.map((b) => b.textContent));
  check(myOpts.length === 3, "mystery word: third hint offers three words");
  const rx = new RegExp("^" + pattern.split(" ").map((c) => c === "_" ? "." : c === " " ? " " : c).join("") + "$", "i");
  const pick = myOpts.findIndex((w) => rx.test(w.toUpperCase()));
  check(pick >= 0, "mystery word: one option matches the letters shown");
  await g5.click('[data-act="opt"] >> nth=' + Math.max(0, pick)); await g5.waitForTimeout(1800);
  let sawAnagram = false, calcDone = 0, pathDone = false;
  for (let i = 0; i < 200; i++) {
    if (await g5.$(".sumhead")) break;
    const tag = (await g5.$(".tag")) ? await g5.textContent(".tag") : "";
    if (/Componi la parola/.test(tag) && /📅/.test(await g5.textContent(".card"))) sawAnagram = true;
    if (/Calcoli/.test(tag)) {
      const q = await g5.textContent(".cue"), m = q.match(/(doppio|metà) di ([\d,]+)/);
      const x = parseFloat(m[2].replace(",", ".")), ans = m[1] === "doppio" ? x * 2 : x / 2;
      const opts = await g5.$$eval('[data-act="opt"]', (bs) => bs.map((b) => parseFloat(b.textContent.replace(",", "."))));
      const k = opts.findIndex((v) => Math.abs(v - ans) < 1e-9);
      if (k < 0) { check(false, "calculations: the right answer is among the options (" + q + " " + opts + ")"); break; }
      await g5.click('[data-act="opt"] >> nth=' + k); await g5.waitForTimeout(1700); calcDone++; continue;
    }
    if (await g5.$(".pgrid")) {
      const cells = await g5.$$(".pc"); await cells[(await g5.$$eval(".pc", (c) => c.findIndex((x) => !x.classList.contains("start"))))].click();
      check(/freccia/.test(await g5.textContent(".nudge")), "letter path: it starts from the arrow");
      for (let j = 0; j < 12 && !(await g5.$(".pc.ok")); j++) { await g5.click('[data-act="path-hint"]'); await g5.click(".pc.phint"); }
      check(!!(await g5.$(".pc.ok")) && /Trovata/.test(await g5.textContent(".instr")), "letter path: following the path spells the word");
      pathDone = true; await g5.waitForTimeout(1700); continue;
    }
    if (await g5.$('[data-act="advance"]')) { await g5.click('[data-act="advance"]'); continue; }
    if (await g5.$('[data-act="reveal"]')) { await g5.click('[data-act="reveal"]'); continue; }
    if (await g5.$(".slots")) { await g5.click('[data-act="hint"]'); continue; }
    if (await g5.$(".maze")) { await g5.click('[data-act="maze-skip"]'); continue; }
    const o = await g5.$$('[data-act="opt"]:not([disabled])'); if (o.length) { await o[0].click(); await g5.waitForTimeout(1700); continue; }
    await g5.click('[data-r="good"]');
  }
  check(sawAnagram, "word building includes a month or day to unscramble");
  check(calcDone === 5, "calculations: five questions, each with the right answer among four (" + calcDone + ")");
  check(pathDone, "letter path appears in the session");
  check(!!(await g5.$(".sumhead")), "session with the new games finishes");
  const hist = await g5.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_history")); return JSON.parse(localStorage.getItem(k)); });
  check(hist.mystery && !hist.calc && !hist.path, "levels: mystery word counts, calculations and letter path don't");
  check(g5.errors.length === 0, "no page errors (new games): " + g5.errors.join("; "));
  await browser5.close();

  /* Choosing the games: a checklist, then "continue with last time's games" or a new selection. */
  const browser6 = await chromium.launch();
  const ctx6 = await browser6.newContext({ viewport: { width: 900, height: 1100 } });
  await ctx6.addInitScript(FIXED_DAY);
  await ctx6.route("https://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + html + "</body></html>" }));
  const c6 = await ctx6.newPage();
  c6.errors = []; c6.on("pageerror", (e) => c6.errors.push(e.message));
  await c6.goto("https://app.test/");
  await c6.fill("#pf-name", "Test"); await c6.click('[data-act="onboard-skip"]');
  if (await c6.$('[data-act="home"]')) await c6.click('[data-act="home"]');
  await c6.click('[data-act="start"]');
  check((await c6.$$(".pickitem")).length === 12, "game choice: the checklist lists all 12 games and extras");
  const preset = await c6.$$eval(".pickitem.on", (x) => x.map((b) => b.getAttribute("data-g")));
  check(preset.includes("describe") && preset.includes("seq") && !preset.includes("calc"), "game choice: today's usual plan is ticked to start with");
  await c6.click('[data-act="pick-none"]'); await c6.click('[data-act="pick-next"]');
  check(/almeno un gioco/.test(await c6.textContent(".nudge")), "game choice: at least one game is needed");
  for (const g of ["seq", "calc", "echo"]) await c6.click('.pickitem[data-g="' + g + '"]');
  check((await c6.getAttribute('.pickitem[data-g="calc"]', "aria-checked")) === "true", "game choice: ticking marks the game as chosen");
  await c6.click('[data-act="pick-next"]'); await c6.click('[data-w="assist"]');
  const steps6 = await c6.$$eval(".steps li", (x) => x.map((li) => li.textContent));
  check(JSON.stringify(steps6) === JSON.stringify(["Ripetizione", "Calcoli", "Sequenze"]), "game choice: the session has only the chosen games, hardest first (" + steps6 + ")");
  await c6.click('[data-act="stop"]'); await c6.click('[data-act="home"]');
  check(/Ripetizione/.test(await c6.textContent(".plan")) && !/Racconto/.test(await c6.textContent(".plan")), "game choice: the home plan shows the chosen games");
  await c6.click('[data-act="start"]');
  check(/Ripetizione · Calcoli · Sequenze/.test(await c6.textContent('[data-act="pick-prev"]')), "game choice: next time it offers to continue with last time's games");
  await c6.click('[data-act="pick-new"]');
  check((await c6.$$(".pickitem.on")).length === 3, "game choice: a new selection starts from last time's games");
  await c6.click('[data-act="pick-all"]'); await c6.click('[data-act="pick-next"]'); await c6.click('[data-w="assist"]');
  check((await c6.$$(".steps li")).length === 12, "game choice: 'All' plays every game");
  await c6.click('[data-act="stop"]'); await c6.click('[data-act="home"]');
  // patient mode: the player can still choose
  await c6.click('[data-act="therapist"]'); await c6.fill("#th-pin1", "1357"); await c6.fill("#th-pin2", "1357"); await c6.click('[data-act="pin-set"]');
  await c6.click('[data-act="home"]'); await c6.click('[data-act="settings"]'); await c6.check("#set-patient"); await c6.click('[data-act="save-settings"]');
  await c6.click('[data-act="home"]'); await c6.click('[data-act="relock"]');
  await c6.click('[data-act="start"]'); await c6.click('[data-act="pick-new"]');
  check(!!(await c6.$(".picklist")) && !(await c6.$("#un-pin")), "game choice: in patient mode the player can choose games without the PIN");
  check(c6.errors.length === 0, "no page errors (game choice): " + c6.errors.join("; "));
  await browser6.close();

  if (failures) { console.error(failures + " check(s) failed."); process.exit(1); }
  console.log("All browser checks passed.");
})();
