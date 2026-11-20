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
  check(k1.rep.items.length === 3 && k1.rep.items[0].score === 1 && k1.rep.items[0].order === 1 && k1.rep.orderAvg != null && k1.rep.items[2].score < 1, "check-in: repetition scored by coverage and sequence order");
  check(k1.flu.count === 4 && k1.flu.repeats === 1 && k1.flu.intrusions === 0, "check-in: animals count distinct lexicon words, repeats and intrusions - got " + JSON.stringify(k1.flu));
  check(k1.desc.words === 14 && k1.desc.icu === 5, "check-in: description words and kitchen ICU concepts counted - got words=" + k1.desc.words + ", icu=" + k1.desc.icu);
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
  await ck.emulateMedia({ media: "screen" });
  // Standalone 1-minute letter fluency from check-in picker
  await ck.click('[data-act="therapist"]');
  await ck.click('[data-act="chk-results"]');
  await ck.click('[data-act="chk-start"]');
  await ck.click('[data-act="chk-letter-only"]');
  await ck.click('[data-act="chk-let-who"][data-w="solo"]');
  check(!!(await ck.$(".chk-letter")) && (await ck.textContent(".chk-letter")).trim() === "F", "check-in: standalone letter fluency starts on letter F");
  await ck.click('[data-act="chk-let-start"]'); await ck.waitForTimeout(60);
  await ck.evaluate(() => window.__say("fiore finestra fuoco fiore casa"));
  await ck.click('[data-act="chk-done"]'); await ck.waitForTimeout(120);
  await ck.click('[data-act="chk-let-end"]'); await ck.waitForTimeout(150);
  const k3 = (await ck.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_checkins")); return JSON.parse(localStorage.getItem(k)); }))[2];
  check(k3 && k3.kind === "letter" && k3.letterFlu && k3.letterFlu.letter === "F" && k3.letterFlu.count === 3 && k3.letterFlu.repeats === 1 && k3.letterFlu.intrusions === 1, "check-in: standalone letter fluency saves F count, repeats, and intrusions - got " + JSON.stringify(k3 && k3.letterFlu));
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

  /* Progress and statistics: ability index, period comparison, trend, daily report, alerts. */
  const browser7 = await chromium.launch();
  const ctx7 = await browser7.newContext({ viewport: { width: 1000, height: 1200 } });
  await ctx7.route("https://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + html + "</body></html>" }));
  const pr = await ctx7.newPage();
  pr.errors = []; pr.on("pageerror", (e) => pr.errors.push(e.message));
  await pr.goto("https://app.test/");
  await pr.fill("#pf-name", "Test"); await pr.click('[data-act="onboard-skip"]');
  if (await pr.$('[data-act="home"]')) await pr.click('[data-act="home"]');
  // one real session, to check that it reaches the long-term log
  await startSession(pr); await pr.click('[data-w="assist"]');
  for (let i = 0; i < 3; i++) await pr.click('[data-r="good"]'); // telling and the two mystery words
  await pr.click('[data-act="stop"]');
  const logged = await pr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_progress_log")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(logged.length === 1 && logged[0].g.describe && logged[0].g.mystery && logged[0].g.mystery.s === 1, "progress: a finished session is added to the long-term log with its scores");
  // 50 example sessions over 100 days: steady at level 1, then three clearly worse sessions
  await pr.evaluate(() => {
    const pre = Object.keys(localStorage).find((x) => /^pog_p_.+_profile$/.test(x)).replace(/_profile$/, "");
    const D = 86400000, now = Date.now(), log = [];
    for (let i = 0; i < 50; i++) {
      const t = now - (100 - i * 2) * D, bad = i >= 47, s = bad ? 0.3 : 0.8 + (i % 3) * 0.02;
      log.push({ id: "x" + i, t, who: "assist", g: { name: { lv: bad ? 2 : 1, n: 4, s, hints: 1, ms: 8000, on: bad ? 3500 : 1500 + (i % 3) * 50, wpm: 100, msTot: 60000 }, echo: { lv: 1, n: 2, s, hints: null, ms: 5000, on: 1200, wpm: 110, msTot: 20000 } } });
    }
    localStorage.setItem(pre + "_progress_log", JSON.stringify(log));
  });
  await pr.click('[data-act="home"]'); await pr.click('[data-act="therapist"]'); await pr.fill("#th-pin1", "2468"); await pr.fill("#th-pin2", "2468"); await pr.click('[data-act="pin-set"]');
  check(/calo da guardare/.test(await pr.textContent(".card")), "progress: the therapist area points out a drop");
  await pr.click('[data-act="progress"]');
  const alertsText = await pr.textContent(".alerts");
  check(/Indice di autonomia/.test(alertsText) && /ultime 3 sessioni/.test(alertsText), "progress: three sessions well below usual raise a notice");
  check(/Più difficile del solito/.test(await pr.innerHTML(".report")), "progress: the daily report compares the latest day with the usual");
  const rows = await pr.$$eval(".report table", (tbls) => tbls[1] ? [...tbls[1].querySelectorAll("tbody tr")].map((r) => r.textContent) : []);
  // medians are robust: three bad sessions out of 14 don't change the period's median (the notice above catches them)
  check(rows.some((r) => /Indice di autonomia \(tutti/.test(r) && /Stabile/.test(r)), "progress: the period comparison uses medians, so a few bad days don't flip it");
  check(rows.some((r) => /Controllo/.test(r) && /Dati insufficienti/.test(r)) || !rows.some((r) => /Controllo/.test(r)), "progress: measures without enough data say so");
  check(!!(await pr.$(".chart-row.one .mc-line")), "progress: the trend chart draws a line");
  await pr.selectOption("#pr-measure", "ab_name"); await pr.waitForTimeout(100);
  check(!!(await pr.$(".mc-mark")), "progress: level changes are marked on the chart");
  await pr.selectOption("#pr-period", "3m"); await pr.waitForTimeout(100);
  check(/Tendenza|Nessuna tendenza/.test(await pr.textContent(".trend-verdict")), "progress: the trend has a verdict");
  await pr.selectOption("#pr-period", "custom"); await pr.waitForTimeout(100);
  check((await pr.$$('.pr-dates input[type="date"]')).length === 4, "progress: custom dates can be chosen");
  await pr.click('[data-act="pr-apply"]');
  await pr.selectOption("#pr-k", "3"); await pr.selectOption("#pr-run", "4"); await pr.click('[data-act="pr-save"]');
  const ps = await pr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_progress_settings")); return JSON.parse(localStorage.getItem(k)); });
  check(ps.k === 3 && ps.run === 4, "progress: thresholds can be changed and are saved");
  check(!(await pr.$(".alerts")), "progress: with a 4-session rule the 3 low sessions no longer raise a notice");
  await pr.click('[data-act="pr-back"]'); await pr.click('[data-act="report"]');
  check(/Confronto con il periodo precedente/.test(await pr.textContent(".print-area")), "printable summary includes the comparison with the previous period");
  check(pr.errors.length === 0, "no page errors (progress): " + pr.errors.join("; "));
  await browser7.close();

  /* Cloud statistics: per-exercise aggregates are published (numbers only) and a shared learner's
     statistics open read-only for a therapist on another device. */
  const CLOUD_STUB = `window.__rpc = [];
  window.supabase = { createClient: function () {
    var user = { id: "t1", email: "therapist@example.com", user_metadata: {} }, D = 86400000, now = Date.now();
    var ses = [], games = [], cks = [];
    for (var i = 0; i < 40; i++) {
      var id = "s" + (1000 + i).toString(36), t = new Date(now - (80 - i * 2) * D).toISOString(), late = i >= 37;
      ses.push({ profile_id: "cloud-1", session_id: id, started_at: t, mode: "session", player_mode: i % 2 ? "solo" : "assisted", item_count: 6, spoken_count: 4, avg_onset_ms: 1500, avg_wpm: 100, avg_pauses: 1, avg_longest_pause_ms: 900 });
      games.push({ session_id: id, game: "name", level: 1, item_count: 4, accuracy: late ? 0.25 : 0.8 + (i % 3) * 0.02, avg_hints: 1, median_item_ms: 8000, median_onset_ms: 1500, median_wpm: null });
    }
    for (var k = 0; k < 4; k++) cks.push({ checkin_id: "k" + k, started_at: new Date(now - (70 - k * 14) * D).toISOString(), player_mode: "solo", naming_correct: 9 - k, naming_total: 10, fluency_count: 14 - k, repetition: 0.9, description_wpm: 100 });
    var tables = { profile_members: [{ profile_id: "cloud-1", role: "therapist" }], learner_profiles: [{ id: "cloud-1", display_name: "Maria" }],
      therapist_session_metrics: ses, therapist_game_metrics: games, therapist_checkin_metrics: cks };
    var q = function (name) { var from = 0, to = 1e9, desc = false, o = {
        select: function () { return o; }, eq: function () { return o; }, in: function () { return o; }, order: function (c, op) { desc = op && op.ascending === false; return o; },
        limit: function (n) { to = n - 1; return o; }, range: function (a, b) { from = a; to = b; return o; },
        maybeSingle: function () { return Promise.resolve({ data: null, error: null }); }, single: function () { return Promise.resolve({ data: null, error: null }); },
        then: function (r, j) { var d = (tables[name] || []).slice(); if (desc) d.reverse(); return Promise.resolve({ data: d.slice(from, to + 1), error: null }).then(r, j); } }; return o; };
    return { auth: {
        getSession: function () { return Promise.resolve({ data: { session: { user: user } } }); },
        getUser: function () { return Promise.resolve({ data: { user: user } }); },
        onAuthStateChange: function (cb) { return { data: { subscription: { unsubscribe: function () {} } } }; },
        signOut: function () { return Promise.resolve({ error: null }); }
      }, from: q, rpc: function (name, args) { window.__rpc.push({ name: name, args: JSON.parse(JSON.stringify(args)) }); return Promise.resolve({ data: null, error: null }); },
      functions: { invoke: function () { return Promise.resolve({ data: null, error: null }); } } };
  } };`;
  const browser8 = await chromium.launch();
  const cl = await open(browser8, false, CLOUD_STUB, { width: 1000, height: 1200 });
  await cl.fill("#pf-name", "Test"); await cl.click('[data-act="onboard-skip"]');
  if (await cl.$('[data-act="home"]')) await cl.click('[data-act="home"]');
  // this device's learner is linked to the cloud profile with consent
  await cl.evaluate(() => { const id = localStorage.getItem("pog_active_profile_id"); localStorage.setItem("pog_cloud_consent_" + id, new Date().toISOString()); localStorage.setItem("pog_cloud_profile_" + id, "cloud-1"); });
  await startSession(cl); await cl.click('[data-w="assist"]');
  for (let i = 0; i < 3; i++) await cl.click('[data-r="good"]');
  await cl.click('[data-act="stop"]'); await cl.waitForTimeout(400);
  const sent = await cl.evaluate(() => window.__rpc.filter((r) => r.name === "upsert_therapist_progress_metrics").pop());
  check(sent && sent.args.p_games.some((g) => g.game === "mystery" && g.level === 1 && g.accuracy === 1), "cloud: per-exercise level and accuracy are published after a session");
  check(sent && !/heard|label|transcript/.test(JSON.stringify(sent.args)), "cloud: the published exercise rows contain numbers only");
  // a therapist opens the shared learner's statistics
  await cl.click('[data-act="home"]');
  await menuClick(cl, ".therapist-cloud-launcher");
  await cl.waitForSelector('[data-thcloud="progress"]');
  await cl.click('[data-thcloud="progress"]');
  await cl.waitForSelector(".pr-controls");
  const remoteText = await cl.textContent(".card");
  check(/Dati dal cloud: Maria/.test(remoteText), "cloud: statistics open for the shared learner, marked read-only");
  check(/Indice di autonomia: Parole/.test(remoteText) && /Controllo: nomi giusti/.test(remoteText), "cloud: exercise ability and check-ins are shown");
  check(/Indice di autonomia/.test(await cl.textContent(".alerts")), "cloud: a recent drop in the shared learner's sessions raises a notice");
  await cl.click('[data-act="pr-back"]');
  check(await cl.isVisible(".therapist-cloud-panel"), "cloud: going back returns to the shared history");
  check(cl.errors.length === 0, "no page errors (cloud statistics): " + cl.errors.join("; "));
  await browser8.close();

  /* The language can be switched from the top bar on any screen, also in the middle of a session. */
  const browser9 = await chromium.launch();
  const lg = await open(browser9, false, null, { width: 900, height: 1100 });
  await lg.fill("#pf-name", "Test"); await lg.click('[data-act="onboard-skip"]');
  // settings screen (after onboarding): switch keeps what was typed
  await lg.fill("#set-name", "Prova");
  await lg.click('.langmini [data-l="en"]');
  check(/Levels and settings|Profile/.test(await lg.textContent(".card")) && (await lg.inputValue("#set-name")) === "Prova", "language: switching on the settings screen keeps what was typed");
  await lg.click('.langmini [data-l="it"]');
  await lg.click('[data-act="home"]');
  check(!!(await lg.$(".bar .langmini")) && !(await lg.$(".home .seg")), "language: the switch is in the top bar of the home screen");
  await startSession(lg); await lg.click('[data-w="assist"]');
  await lg.click('[data-r="good"]'); // telling
  const before = await lg.$$eval(".clues .chip", (c) => c.map((x) => x.textContent));
  await lg.click('.langmini [data-l="en"]');
  const after = await lg.$$eval(".clues .chip", (c) => c.map((x) => x.textContent));
  const tagEn = await lg.textContent(".tag");
  check(/Mystery word/.test(tagEn) && after.length === 5 && after.join() !== before.join(), "language: in the middle of a session the current exercise switches to English (" + after.join(", ") + ")");
  check(/Telling/.test(await lg.textContent(".steps")) && /Stop for today/.test(await lg.textContent(".bar")), "language: progress steps and buttons follow the new language");
  for (let i = 0; i < 2; i++) await lg.click('[data-r="good"]');
  check(/Crossword|Word building/.test(await lg.textContent(".tag")), "language: the session carries on in English");
  await lg.click('[data-act="stop"]');
  const logRows = await lg.$$eval("tbody tr td:first-child", (x) => x.map((td) => td.textContent));
  check(logRows.length >= 3, "language: answers given before the switch are kept (" + logRows.length + ")");
  check(lg.errors.length === 0, "no page errors (language switch): " + lg.errors.join("; "));
  await browser9.close();

  /* A refresh keeps you where you were; a finished session or a new tab starts from home. */
  const browser10 = await chromium.launch();
  const ctx10 = await browser10.newContext({ viewport: { width: 900, height: 700 } });
  await ctx10.route("http://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + html + "</body></html>" }));
  const rf = await ctx10.newPage();
  rf.errors = []; rf.on("pageerror", (e) => rf.errors.push(e.message));
  await rf.goto("http://app.test/");
  await rf.fill("#pf-name", "Test"); await rf.click('[data-act="onboard-skip"]');
  // settings, scrolled down
  await rf.evaluate(() => window.scrollTo(0, 600)); await rf.waitForTimeout(400);
  await rf.reload(); await rf.waitForTimeout(300);
  check(!!(await rf.$("#set-name")), "refresh: the settings screen stays open");
  check((await rf.evaluate(() => window.scrollY)) > 300, "refresh: the scroll position comes back");
  // a screen added by a module
  await rf.click('[data-act="home"]'); await rf.click('[data-act="board"]'); await rf.reload(); await rf.waitForTimeout(300);
  check(!!(await rf.$(".aac-grid")), "refresh: the communication board stays open");
  // the game checklist
  await rf.click('[data-act="home"]'); await rf.click('[data-act="start"]'); await rf.reload(); await rf.waitForTimeout(300);
  check(!!(await rf.$(".picklist")), "refresh: the game checklist stays open");
  // in the middle of an exercise: same exercise
  await rf.click('[data-act="pick-next"]'); await rf.click('[data-w="assist"]'); await rf.click('[data-r="good"]');
  const tagBefore = await rf.textContent(".tag");
  await rf.reload(); await rf.waitForTimeout(300);
  check((await rf.textContent(".tag")) === tagBefore, "refresh: an exercise in progress continues where it was");
  // a finished session goes back to home
  await rf.click('[data-act="stop"]'); check(!!(await rf.$(".sumhead")), "refresh: (session ended)");
  await rf.reload(); await rf.waitForTimeout(300);
  check(!!(await rf.$('[data-act="start"]')) && !(await rf.$(".sumhead")), "refresh: after a session has ended you start from home");
  // behind the therapist PIN: asks again, then continues to the same screen
  await rf.click('[data-act="therapist"]'); await rf.fill("#th-pin1", "2468"); await rf.fill("#th-pin2", "2468"); await rf.click('[data-act="pin-set"]');
  await rf.click('[data-act="progress"]'); await rf.reload(); await rf.waitForTimeout(300);
  check(!!(await rf.$("#th-pin")), "refresh: screens behind the therapist PIN ask for it again");
  await rf.fill("#th-pin", "2468"); await rf.click('[data-act="pin-enter"]'); await rf.waitForTimeout(200);
  check(!!(await rf.$(".pr-controls")), "refresh: after the PIN you are back on the same screen");
  // patient mode: a locked screen is not reopened by a refresh
  await rf.click('[data-act="pr-back"]'); await rf.click('[data-act="home"]'); await rf.click('[data-act="settings"]');
  await rf.check("#set-patient"); await rf.click('[data-act="save-settings"]');
  await rf.click('[data-act="home"]'); await rf.click('[data-act="relock"]');
  await rf.evaluate(() => { const u = JSON.parse(sessionStorage.getItem("pog_ui")); u.s = "settings"; sessionStorage.setItem("pog_ui", JSON.stringify(u)); });
  await rf.reload(); await rf.waitForTimeout(300);
  check(!(await rf.$("#set-name")) && !!(await rf.$('[data-act="caregiver"]')), "refresh: in patient mode a locked screen is not reopened without the PIN");
  // a new tab starts from home
  const rf2 = await ctx10.newPage(); await rf2.goto("http://app.test/"); await rf2.waitForTimeout(300);
  check(!!(await rf2.$('[data-act="start"]')), "refresh: a new tab starts from the home screen");
  check(rf.errors.length === 0, "no page errors (refresh): " + rf.errors.join("; "));
  await browser10.close();

  /* Colour themes: light/dark/automatic and palettes, per person, from any screen. */
  const browser11 = await chromium.launch();
  const th = await open(browser11, false, null, { width: 900, height: 1000 });
  await th.fill("#pf-name", "Anna"); await th.click('[data-act="onboard-skip"]'); await th.click('[data-act="home"]');
  const attrs = () => th.evaluate(() => ({ t: document.documentElement.getAttribute("data-theme"), p: document.documentElement.getAttribute("data-palette"), bg: getComputedStyle(document.body).backgroundColor, meta: document.querySelector('meta[name="theme-color"]') && document.querySelector('meta[name="theme-color"]').content }));
  check((await attrs()).t === null && (await attrs()).p === null, "themes: by default the app follows the device, in the Sea colours");
  await th.click('[data-act="theme-open"]');
  check(!!(await th.$(".theme-panel")), "themes: the palette button opens the appearance panel");
  await th.click('[data-act="theme-pal"][data-v="forest"]'); await th.click('[data-act="theme-mode"][data-v="dark"]');
  let a1 = await attrs();
  check(a1.t === "dark" && a1.p === "forest" && a1.bg === "rgb(15, 26, 18)", "themes: choosing Forest and Dark recolours the app (" + a1.bg + ")");
  await th.click('[data-act="theme-close"]');
  await th.reload(); await th.waitForTimeout(200);
  a1 = await attrs();
  check(a1.t === "dark" && a1.p === "forest", "themes: the choice is kept after a refresh");
  // during an exercise
  await startSession(th); await th.click('[data-w="assist"]');
  await th.click('[data-act="theme-open"]'); await th.click('[data-act="theme-pal"][data-v="sunset"]'); await th.click('[data-act="theme-mode"][data-v="light"]'); await th.click('[data-act="theme-close"]');
  a1 = await attrs();
  check(a1.p === "sunset" && a1.t === "light" && !!(await th.$('[data-r="good"]')), "themes: can be changed in the middle of an exercise without leaving it");
  await th.click('[data-act="stop"]'); await th.click('[data-act="home"]');
  // each person keeps their own
  await th.click('[data-act="profiles"]'); await th.click('[data-act="profile-add"]');
  await th.fill("#pf-name", "Bruno"); await th.click('[data-act="onboard-skip"]');
  a1 = await attrs();
  check(a1.p === null && a1.t === null, "themes: another person starts with the default look");
  // settings has the same controls
  check(!!(await th.$('.settings-theme [data-act="theme-pal"]')), "themes: the settings screen has the appearance choices too");
  // patient mode: still allowed
  await th.click('[data-act="home"]'); await th.click('[data-act="therapist"]'); await th.fill("#th-pin1", "1111"); await th.fill("#th-pin2", "1111"); await th.click('[data-act="pin-set"]');
  await th.click('[data-act="home"]'); await th.click('[data-act="settings"]'); await th.check("#set-patient"); await th.click('[data-act="save-settings"]');
  await th.click('[data-act="home"]'); await th.click('[data-act="relock"]');
  await th.click('[data-act="theme-open"]'); await th.click('[data-act="theme-pal"][data-v="lavender"]');
  check((await attrs()).p === "lavender" && !(await th.$("#un-pin")), "themes: in patient mode the person can change colours without the PIN");
  check(th.errors.length === 0, "no page errors (themes): " + th.errors.join("; "));
  await browser11.close();

  /* Variant-targeted PPA exercises: nfvPPA sentence building, svPPA semantic links, lvPPA sounds/syllables/span. */
  const browser12 = await chromium.launch();
  const vr = await open(browser12, false, null, { width: 900, height: 1000 });
  await vr.fill("#pf-name", "Giulia"); await vr.click('[data-act="onboard-skip"]'); await vr.click('[data-act="home"]');
  check(!!(await vr.$('[data-act="var-home"]')), "variants: launcher appears on home screen");
  await vr.click('[data-act="var-home"]');
  check(!!(await vr.$('[data-act="var-focus"][data-f="nfv"]')), "variants: hub shows PPA profile focus choices and 3 domain drills");
  await vr.click('[data-act="var-focus"][data-f="nfv"]');
  check((await vr.getAttribute('[data-act="var-focus"][data-f="nfv"]', "aria-pressed")) === "true", "variants: focus selection persists");

  // Play all 3 items of sentence building (nfvPPA) using Hint + Check + Next
  await vr.click('[data-act="var-start"][data-m="sentence"]');
  for (let item = 0; item < 3; item++) {
    // First item tests placing wrong/one tile then using hints to place remaining tokens cleanly
    if (item === 0) {
      await vr.click('[data-act="var-stile"][data-i="0"]');
      await vr.click('[data-act="var-sslot"][data-i="0"]'); // tap slot returns tile to pool
      check((await vr.$$(".var-slot.has")).length === 0, "variants sentence: tapping placed slot removes token cleanly");
    }
    for (let h = 0; h < 10 && !(await vr.$('[data-act="var-next"]')); h++) {
      const targetBtn = await vr.$('[data-act="var-scheck"]:not([disabled])');
      await vr.click('[data-act="var-hint"]');
      const nextNow = await vr.$('[data-act="var-next"]');
      if (nextNow) break;
      if (h >= 2 && targetBtn) {
        await vr.click('[data-act="var-scheck"]');
        if (await vr.$('[data-act="var-next"]')) break;
      }
    }
    if (!(await vr.$('[data-act="var-next"]'))) await vr.click('[data-act="var-scheck"]');
    check(!!(await vr.$('[data-act="var-next"]')), "variants sentence: item " + (item + 1) + " solved cleanly");
    await vr.click('[data-act="var-next"]');
  }
  check(!!(await vr.$(".sumhead")) && /sentence|Frasi/i.test(await vr.textContent(".card")), "variants sentence: summary screen records completed drill");
  await vr.click('[data-act="var-hub"]');

  // Play all 3 items of semantic links (svPPA: odd, assoc, feat)
  await vr.click('[data-act="var-start"][data-m="semantic"]');
  for (let item = 0; item < 3; item++) {
    await vr.click('[data-act="var-hint"]');
    if (await vr.$('[data-act="var-feat"]')) {
      for (const ans of ["true", "false"]) {
        if (await vr.$('[data-act="var-next"]')) break;
        await vr.click('[data-act="var-feat"][data-ans="' + ans + '"]');
      }
    } else {
      const opts = await vr.$$('[data-act="var-sopt"]');
      for (let i = 0; i < opts.length; i++) {
        if (await vr.$('[data-act="var-next"]')) break;
        const sel = '[data-act="var-sopt"][data-i="' + i + '"]:not([disabled])';
        if (await vr.$(sel)) await vr.click(sel);
      }
    }
    check(!!(await vr.$(".var-feedback.good")) && !!(await vr.$('[data-act="var-next"]')), "variants semantic: item " + (item + 1) + " displays explanation feedback");
    await vr.click('[data-act="var-next"]');
  }
  await vr.click('[data-act="var-hub"]');

  // Switch to English mid-hub and play 3 items of sound & span (lvPPA/AOS: pair, syll, span)
  await vr.click('[data-act="lang"][data-l="en"]');
  check(/Targeted PPA exercises/.test(await vr.textContent(".card")), "variants: switching to EN updates hub immediately");
  await vr.click('[data-act="var-start"][data-m="soundspan"]');
  for (let item = 0; item < 3; item++) {
    if (await vr.$('[data-act="var-span-ready"]')) {
      await vr.click('[data-act="var-span-play"]');
      await vr.click('[data-act="var-span-ready"]');
      for (let h = 0; h < 6 && !(await vr.$('[data-act="var-next"]')); h++) await vr.click('[data-act="var-hint"]');
    } else if (await vr.$('[data-act="var-popt"]')) {
      const opts = await vr.$$('[data-act="var-popt"]');
      for (let i = 0; i < opts.length; i++) {
        if (await vr.$('[data-act="var-next"]')) break;
        const sel = '[data-act="var-popt"][data-i="' + i + '"]:not([disabled])';
        if (await vr.$(sel)) await vr.click(sel);
      }
    } else {
      for (let h = 0; h < 6 && !(await vr.$('[data-act="var-next"]')); h++) await vr.click('[data-act="var-hint"]');
    }
    check(!!(await vr.$('[data-act="var-next"]')), "variants soundspan: item " + (item + 1) + " solved cleanly");
    await vr.click('[data-act="var-next"]');
  }
  await vr.click('[data-act="var-hub"]');

  // Check local persistence + functional reading drill + caregiver log + therapist report display
  const vSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_variant_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(vSaved.length === 3 && vSaved.map((s) => s.mode).join(",") === "sentence,semantic,soundspan", "variants: all three targeted domain sessions persisted locally");

  // Launch Everyday functional reading from the hub
  check(!!(await vr.$('[data-act="func-home"]')), "functional reading: card is offered in targeted practice hub");
  await vr.click('[data-act="func-home"]');
  for (let item = 0; item < 3; item++) {
    await vr.click('[data-act="fn-hint"]');
    if (item === 0) check(!!(await vr.$(".fn-mark")), "functional reading: hint highlights the exact key clue inline");
    const opts = await vr.$$('[data-act="fn-opt"]');
    for (let i = 0; i < opts.length; i++) {
      if (await vr.$('[data-act="fn-next"]')) break;
      const sel = '[data-act="fn-opt"][data-i="' + i + '"]:not([disabled])';
      if (await vr.$(sel)) await vr.click(sel);
    }
    check(!!(await vr.$('[data-act="fn-next"]')), "functional reading: item " + (item + 1) + " solved cleanly");
    await vr.click('[data-act="fn-next"]');
  }
  const fnSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_functional_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(fnSaved.length === 1 && fnSaved[0].items.length === 3, "functional reading: completed 3-item session saved locally");

  await vr.click('[data-act="fn-home"]');
  await vr.click('[data-act="var-home"]');

  // Launch Spaced-Retrieval Word Preservation ("Words to keep alive") from the targeted practice hub
  check(!!(await vr.$('[data-act="wb-home"]')), "wordbank: card is offered in targeted practice hub");
  await vr.click('[data-act="wb-home"]');
  for (let item = 0; item < 5; item++) {
    if (item === 0) {
      await vr.click('[data-act="wb-sfa"]');
      check(!!(await vr.$(".wb-cuebox")), "wordbank: semantic feature analysis (SFA) cue opens cleanly");
      await vr.click('[data-act="wb-got"]');
    } else if (item === 1) {
      await vr.click('[data-act="wb-pca"]');
      check(!!(await vr.$(".wb-cuebox")), "wordbank: phonemic component analysis (PCA) cue opens cleanly");
      await vr.click('[data-act="wb-choices"]');
      const opts = await vr.$$('[data-act="wb-opt"]');
      for (let oi = 0; oi < opts.length; oi++) {
        if (await vr.$('[data-act="wb-next"]')) break;
        const sel = '[data-act="wb-opt"][data-i="' + oi + '"]:not([disabled])';
        if (await vr.$(sel)) await vr.click(sel);
      }
    } else {
      await vr.click('[data-act="wb-got"]');
    }
    check(!!(await vr.$('[data-act="wb-next"]')), "wordbank: item " + (item + 1) + " retrieved and saved cleanly");
    await vr.click('[data-act="wb-next"]');
  }
  const wbSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_wordbank_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(wbSaved.length === 1 && wbSaved[0].items.length === 5, "wordbank: completed 5-word spaced-retrieval session saved locally");

  await vr.click('[data-act="wb-home-exit"]');
  await vr.click('[data-act="var-home"]');

  // Launch Write to keep (CART) from the targeted practice hub
  check(!!(await vr.$('[data-act="wr-home"]')), "writing: Write to keep (CART) card is offered in targeted practice hub");
  await vr.click('[data-act="wr-home"]');
  for (let item = 0; item < 4; item++) {
    if (item === 0) {
      // Test hint + phonetic nudge on first item, then CART Copy -> Hide -> Recall via tiles
      const targetMeta = await vr.evaluate(() => {
        const promptText = document.querySelector(".instr") ? document.querySelector(".instr").textContent : "";
        const bank = (window.POG.content.WRITING && window.POG.content.WRITING.en) || [];
        const match = bank.find((x) => x.prompt === promptText);
        return match || null;
      });
      if (targetMeta && targetMeta.phoneticSkeletons && targetMeta.phoneticSkeletons[0]) {
        await vr.fill("#wr-input", targetMeta.phoneticSkeletons[0]);
        await vr.click('[data-act="wr-check"]');
        check(!!(await vr.$('.nudge[role="status"]')), "writing: phonetic spelling attempt displays helpful orthographic nudge");
        await vr.click('[data-act="wr-clear"]');
      }
      await vr.click('[data-act="wr-cart"]');
      check(!!(await vr.$(".wr-model")), "writing: CART Step 1 shows written model for clean copying");
      const modelTxt = (await vr.textContent(".wr-model")).trim();
      await vr.fill("#wr-input", modelTxt);
      await vr.click('[data-act="wr-copy-done"]');
      check(!(await vr.$(".wr-model")) && !!(await vr.$(".wr-cartbox")), "writing: CART Step 2 hides model for delayed recall");
      await vr.fill("#wr-input", modelTxt);
      await vr.click('[data-act="wr-check"]');
    } else {
      const targetTxt = await vr.evaluate(() => {
        const promptText = document.querySelector(".instr") ? document.querySelector(".instr").textContent : "";
        const bank = (window.POG.content.WRITING && window.POG.content.WRITING.en) || [];
        const match = bank.find((x) => x.prompt === promptText);
        return match ? match.target : "";
      });
      await vr.fill("#wr-input", targetTxt);
      await vr.click('[data-act="wr-check"]');
    }
    check(!!(await vr.$('[data-act="wr-next"]')), "writing: item " + (item + 1) + " verified and ready for next");
    await vr.click('[data-act="wr-next"]');
  }
  const wrSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_writing_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(wrSaved.length === 1 && wrSaved[0].items.length === 4, "writing: completed 4-item CART session saved locally");

  await vr.click('[data-act="wr-back-var"]');

  // Launch Spoken messages (disc-home) from targeted practice hub
  check(!!(await vr.$('[data-act="disc-home"]')), "discourse: Spoken messages card is offered in targeted practice hub");
  await vr.click('[data-act="disc-home"]');
  for (let item = 0; item < 3; item++) {
    if (item === 0) {
      await vr.click('[data-act="disc-slow"]');
      await vr.click('[data-act="disc-kw"]');
      check(!!(await vr.$(".dc-kw")), "discourse: written keyword anchors reveal cleanly");
    }
    const opts = await vr.$$('[data-act="disc-opt"]');
    for (let i = 0; i < opts.length; i++) {
      if (await vr.$('[data-act="disc-next"]')) break;
      const sel = '[data-act="disc-opt"][data-i="' + i + '"]:not([disabled])';
      if (await vr.$(sel)) await vr.click(sel);
    }
    check(!!(await vr.$('[data-act="disc-next"]')), "discourse: message " + (item + 1) + " verified cleanly");
    await vr.click('[data-act="disc-next"]');
  }
  const dcSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_discourse_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(dcSaved.length === 1 && dcSaved[0].items.length === 3, "discourse: completed 3-message comprehension session saved locally");
  await vr.click('[data-act="disc-back-var"]');

  // Launch Speech pacing coach (pace-home) from targeted practice hub
  check(!!(await vr.$('[data-act="pace-home"]')), "pacing: Speech pacing coach card is offered in targeted practice hub");
  await vr.click('[data-act="pace-home"]');
  for (let item = 0; item < 4; item++) {
    if (item === 0) {
      await vr.click('[data-act="pace-retry"]');
      check((await vr.getAttribute('[data-act="pace-tempo"][data-v="slow"]', "aria-pressed")) === "true",
        "pacing: slow down & retry sets beat tempo cleanly to slow");
      await vr.click('[data-act="pace-tap"][data-i="0"]');
      check(!!(await vr.$(".pc-syl.on")), "pacing: tapping a syllable highlights the active beat");
    }
    await vr.click('[data-act="pace-rate"][data-r="good"]');
    check(!!(await vr.$('[data-act="pace-next"]')), "pacing: item " + (item + 1) + " rated cleanly");
    await vr.click('[data-act="pace-next"]');
  }
  const pcSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_pacing_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(pcSaved.length === 1 && pcSaved[0].items.length === 4, "pacing: completed 4-item speech pacing session saved locally");

  await vr.click('[data-act="pace-back-var"]');

  // Launch Actions & verbs (VNeST: verbs-home) from targeted practice hub
  check(!!(await vr.$('[data-act="verbs-home"]')), "verbs: VNeST Actions & verbs card is offered in targeted practice hub");
  await vr.click('[data-act="verbs-home"]');
  for (let item = 0; item < 3; item++) {
    // Use hint twice on first verb item (Agent + Patient) or click right tiles directly
    if (item === 0) {
      await vr.click('[data-act="vb-hint"]');
      check((await vr.$$(".vb-slot.ok")).length >= 1, "verbs: VNeST progressive hint reveals Agent/Patient cleanly");
    }
    while (await vr.$('[data-act="vb-agent"]:not([disabled]), [data-act="vb-patient"]:not([disabled])')) {
      if (await vr.$('[data-act="vb-plaus"]')) break;
      const agents = await vr.$$('[data-act="vb-agent"]:not([disabled])');
      if (agents.length) await agents[0].click();
      if (await vr.$('[data-act="vb-plaus"]')) break;
      const patients = await vr.$$('[data-act="vb-patient"]:not([disabled])');
      if (patients.length) await patients[0].click();
    }
    check(!!(await vr.$('[data-act="vb-plaus"]')), "verbs: item " + (item + 1) + " builds Agent-Verb-Patient frame");
    for (const ans of ["true", "false"]) {
      if (await vr.$('[data-act="vb-next"]')) break;
      const pSel = '[data-act="vb-plaus"][data-ans="' + ans + '"]:not([disabled])';
      if (await vr.$(pSel)) await vr.click(pSel);
    }
    check(!!(await vr.$('[data-act="vb-next"]')), "verbs: item " + (item + 1) + " checks plausibility and shows full sentence");
    await vr.click('[data-act="vb-next"]');
  }
  const vbSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_verbs_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(vbSaved.length === 1 && vbSaved[0].items.length === 3, "verbs: completed 3-verb VNeST session saved locally");
  await vr.click('[data-act="vb-back-var"]');

  // Launch Story & sequence retell (narr-home) from targeted practice hub
  check(!!(await vr.$('[data-act="narr-home"]')), "narrative: Story & sequence retell card is offered in targeted practice hub");
  await vr.click('[data-act="narr-home"]');
  for (let item = 0; item < 3; item++) {
    await vr.click('[data-act="narr-start-seq"]');
    for (let h = 0; h < 3; h++) await vr.click('[data-act="narr-hint"]');
    await vr.click('[data-act="narr-check-seq"]');
    check(!!(await vr.$("#narr-retell")), "narrative: story " + (item + 1) + " advances cleanly from 3-beat sequencing to retell");
    if (item === 0) {
      await vr.click('[data-act="narr-anchors"]');
      check(!!(await vr.$(".dc-kw")), "narrative: optional key concept anchor chips reveal cleanly");
    }
    const gists = await vr.$$('[data-act="narr-gist"]');
    for (let gi = 0; gi < gists.length; gi++) {
      if (await vr.$('[data-act="narr-gist"].ok')) break;
      const gSel = '[data-act="narr-gist"][data-i="' + gi + '"]:not([disabled])';
      if (await vr.$(gSel)) await vr.click(gSel);
    }
    await vr.click('[data-act="narr-finish-item"]');
    check(!!(await vr.$('[data-act="narr-next"]')), "narrative: story " + (item + 1) + " scores concept coverage cleanly");
    await vr.click('[data-act="narr-next"]');
  }
  const nrSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_narrative_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(nrSaved.length === 1 && nrSaved[0].items.length === 3, "narrative: completed 3-story sequence & retell session saved locally");

  await vr.click('[data-act="narr-back-var"]');

  // Launch Grammar & word endings (gram-home) from targeted practice hub
  check(!!(await vr.$('[data-act="gram-home"]')), "grammar: Grammar & word endings card is offered in targeted practice hub");
  await vr.click('[data-act="gram-home"]');
  for (let item = 0; item < 4; item++) {
    if (item === 0) {
      await vr.click('[data-act="gram-hint"]');
      check(!!(await vr.$(".wb-cuebox")), "grammar: syntactic clue box reveals cleanly");
    }
    const gOpts = await vr.$$('[data-act="gram-opt"]');
    for (let gi = 0; gi < gOpts.length; gi++) {
      if (await vr.$('[data-act="gram-next"]')) break;
      const gSel = '[data-act="gram-opt"][data-i="' + gi + '"]:not([disabled])';
      if (await vr.$(gSel)) await vr.click(gSel);
    }
    check(!!(await vr.$(".gr-blank.ok")) && !!(await vr.$('[data-act="gram-next"]')),
      "grammar: item " + (item + 1) + " fills sentence blank cleanly");
    await vr.click('[data-act="gram-next"]');
  }
  const grSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_grammar_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(grSaved.length === 1 && grSaved[0].items.length === 4, "grammar: completed 4-sentence morphosyntax cloze session saved locally");

  await vr.click('[data-act="gram-back-var"]');

  // Launch Surface & irregular reading (surf-home) from targeted practice hub
  check(!!(await vr.$('[data-act="surf-home"]')), "surface: Surface & irregular reading card is offered in targeted practice hub");
  await vr.click('[data-act="surf-home"]');
  for (let item = 0; item < 4; item++) {
    if (item === 0) {
      await vr.click('[data-act="surf-hint"]');
      check(!!(await vr.$(".wb-cuebox")), "surface: meaning clue box reveals cleanly");
    }
    const sOpts = await vr.$$('[data-act="surf-opt"]');
    for (let si = 0; si < sOpts.length; si++) {
      if (await vr.$('[data-act="surf-next"]')) break;
      const sSel = '[data-act="surf-opt"][data-i="' + si + '"]:not([disabled])';
      if (await vr.$(sSel)) await vr.click(sSel);
    }
    check(!!(await vr.$(".gr-blank.ok")) && !!(await vr.$('[data-act="surf-next"]')),
      "surface: item " + (item + 1) + " fills sentence blank cleanly");
    await vr.click('[data-act="surf-next"]');
  }
  const srSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_surface_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(srSaved.length === 1 && srSaved[0].items.length === 4, "surface: completed 4-word surface/homophone session saved locally");

  await vr.click('[data-act="surf-back-var"]');

  // Launch Word-finding bridges / circumlocution (circ-home) from targeted practice hub
  check(!!(await vr.$('[data-act="circ-home"]')), "circumlocution: Word-finding bridges card is offered in targeted practice hub");
  await vr.click('[data-act="circ-home"]');
  for (let item = 0; item < 3; item++) {
    const clueCount = (await vr.$$('[data-act="circ-clue"]')).length;
    for (let ci = 0; ci < clueCount; ci++) {
      if (await vr.$('[data-act="circ-know"]')) break;
      const cSel = '[data-act="circ-clue"][data-i="' + ci + '"]:not([disabled])';
      if (await vr.$(cSel)) await vr.click(cSel);
    }
    if (item === 0) {
      await vr.click('[data-act="circ-cue"]');
      check(!!(await vr.$(".wb-cuebox")), "circumlocution: assembled description & sound clue appear cleanly");
    }
    if (item % 2 === 0) await vr.click('[data-act="circ-know"]');
    else await vr.click('[data-act="circ-desc"]');
    check(!!(await vr.$('[data-act="circ-next"]')),
      "circumlocution: item " + (item + 1) + " completes bridge phase cleanly");
    await vr.click('[data-act="circ-next"]');
  }
  const crSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_circumlocution_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(crSaved.length === 1 && crSaved[0].items.length === 3, "circumlocution: completed 3-item compensatory session saved locally");

  await vr.click('[data-act="circ-back-var"]');

  // Launch Numbers, times & prices (num-home) from targeted practice hub
  check(!!(await vr.$('[data-act="num-home"]')), "numbers: Numbers, times & prices card is offered in targeted practice hub");
  await vr.click('[data-act="num-home"]');
  for (let item = 0; item < 4; item++) {
    if (item === 0) {
      await vr.click('[data-act="num-hint"]');
      check(!!(await vr.$(".hint")), "numbers: place-value / time clue box reveals cleanly");
    }
    const optCount = (await vr.$$('[data-act="num-pick"]')).length;
    for (let oi = 0; oi < optCount; oi++) {
      if (await vr.$('[data-act="num-next"]')) break;
      const oSel = '[data-act="num-pick"][data-i="' + oi + '"]:not([disabled])';
      if (await vr.$(oSel)) await vr.click(oSel);
    }
    check(!!(await vr.$('[data-act="num-next"]')), "numbers: item " + (item + 1) + " resolves cleanly");
    await vr.click('[data-act="num-next"]');
  }
  const nmSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_numbers_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(nmSaved.length === 1 && nmSaved[0].items.length === 4, "numbers: completed 4-item numbers/time session saved locally");

  await vr.click('[data-act="num-var-hub"]');

  // Launch Everyday dialogues (dg-home) from targeted practice hub
  check(!!(await vr.$('[data-act="dg-home"]')), "dialogue: Everyday dialogues card is offered in targeted practice hub");
  await vr.click('[data-act="dg-home"]');
  for (let item = 0; item < 3; item++) {
    if (item === 0) {
      await vr.click('[data-act="dg-hint"]');
      check(!!(await vr.$(".hint")), "dialogue: social intent clue box reveals cleanly");
    }
    const rCount = (await vr.$$('[data-act="dg-pick"]')).length;
    for (let ri = 0; ri < rCount; ri++) {
      if (await vr.$('[data-act="dg-next"]')) break;
      const rSel = '[data-act="dg-pick"][data-i="' + ri + '"]:not([disabled])';
      if (await vr.$(rSel)) {
        const prevTag = await vr.textContent(".tag");
        await vr.click(rSel);
        if ((await vr.textContent(".tag")) !== prevTag) break;
      }
    }
    const fCount = (await vr.$$('[data-act="dg-pick"]')).length;
    for (let fi = 0; fi < fCount; fi++) {
      if (await vr.$('[data-act="dg-next"]')) break;
      const fSel = '[data-act="dg-pick"][data-i="' + fi + '"]:not([disabled])';
      if (await vr.$(fSel)) await vr.click(fSel);
    }
    check(!!(await vr.$('[data-act="dg-next"]')), "dialogue: item " + (item + 1) + " completes two-turn exchange cleanly");
    await vr.click('[data-act="dg-next"]');
  }
  const dgSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_dialogue_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(dgSaved.length === 1 && dgSaved[0].items.length === 3, "dialogue: completed 3-dialogue session saved locally");

  await vr.click('[data-act="dg-var-hub"]');
  check(!!(await vr.$('[data-act="inst-home"]')), "variants hub: exposes Follow instructions module");
  await vr.click('[data-act="inst-home"]');
  for (let item = 0; item < 3; item++) {
    await vr.click('[data-act="inst-hint"]');
    for (let pass = 0; pass < 4; pass++) {
      if (await vr.$('[data-act="inst-next"]')) break;
      const tokIds = await vr.evaluate(() =>
        Array.from(document.querySelectorAll('[data-act="inst-pick"]:not([disabled])')).map((b) => b.getAttribute("data-id"))
      );
      for (const id of tokIds) {
        if (await vr.$('[data-act="inst-next"]')) break;
        const sel = '[data-act="inst-pick"][data-id="' + id + '"]:not([disabled])';
        if (await vr.$(sel)) await vr.click(sel);
      }
    }
    check(!!(await vr.$('[data-act="inst-next"]')), "instructions: item " + (item + 1) + " completes multi-step instruction cleanly");
    await vr.click('[data-act="inst-next"]');
  }
  const instSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_instructions_sessions")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(instSaved.length === 1 && instSaved[0].items.length === 3, "instructions: completed 3-instruction session saved locally");

  await vr.click('[data-act="inst-back"]');

  // Verify Talk Board context quick-packs, live keyword slate, two-choice A/B overlay, numbers quick picker, repair cues, and Communication Passport
  await vr.click('[data-act="board"]');
  check((await vr.$$('[data-act="aac-repair"]')).length === 3, "aac: 3 one-tap conversational repair cues appear on Talk Board");
  await vr.click('[data-act="aac-repair"][data-i="0"]');
  check(/One moment/i.test(await vr.textContent(".aac-msg")), "aac: tapping repair cue updates message bar cleanly");
  check(!!(await vr.$('[data-act="aac-tab"][data-t="clinic"]')) && !!(await vr.$('[data-act="aac-tab"][data-t="shop"]')),
    "aac: clinic and shop situational quick-packs are available on Talk Board");
  await vr.click('[data-act="aac-tab"][data-t="clinic"]');
  check((await vr.$$(".aac-tile")).length >= 6, "aac: clinic quick-pack loads ready-to-tap situation phrases");
  await vr.click('[data-act="aac-slate-toggle"]');
  await vr.fill("#aac-slate-in", "14:30 clinic");
  await vr.click('[data-act="aac-slate-big"]');
  check(/14:30 clinic/.test(await vr.textContent(".aac-big")), "aac: live keyword slate shows typed keyword in fullscreen card");
  await vr.click('[data-act="aac-big-close"]');

  await vr.click('[data-act="aac-choice-toggle"]');
  await vr.click('[data-act="aac-choice-preset"][data-i="2"]');
  await vr.click('[data-act="aac-choice-show"]');
  check((await vr.$$('[data-act="aac-ab-pick"]')).length === 2, "aac: two-choice split A/B overlay opens with 2 large choices");
  await vr.click('[data-act="aac-ab-pick"][data-pick="b"]');
  check(/Later/i.test(await vr.textContent(".aac-msg")), "aac: tapping two-choice option updates message bar cleanly");

  await vr.click('[data-act="aac-num-toggle"]');
  check((await vr.$$('[data-act="aac-num-pick"]')).length >= 10, "aac: numbers & time quick picker opens cleanly");
  await vr.click('[data-act="aac-num-pick"][data-i="9"]');
  check(/10:30/.test(await vr.textContent(".aac-msg")), "aac: tapping quick time updates Talk Board message bar");

  await vr.click('[data-act="aac-clear"]');
  await vr.click('[data-act="aac-chain-toggle"]');
  await vr.click('[data-act="aac-tab"][data-t="need"]');
  await vr.click('[data-act="aac-tile"][data-i="0"]');
  await vr.click('[data-act="aac-num-pick"][data-i="9"]');
  check((await vr.$$(".aac-chain-chip")).length === 2 && /10:30/.test(await vr.textContent(".aac-msg")),
    "aac: multi-tile phrase builder chains tiles across tabs & numbers picker");
  await vr.click('[data-act="aac-chain-toggle"]');
  await vr.click('[data-act="aac-clear"]');

  check(!!(await vr.$('[data-act="passport"]')), "passport: Help card shortcut appears on Talk Board");
  await vr.click('[data-act="passport"]');
  check(!!(await vr.$(".pp-msg")) && !!(await vr.$('[data-act="pp-print"]')), "passport: renders high-contrast communication help message and Print button");
  await vr.click('[data-act="pp-big"]');
  check(!!(await vr.$(".aac-big")), "passport: fullscreen help card opens cleanly");
  await vr.click('[data-act="pp-big-close"]');
  await vr.click('[data-act="board"]');
  await vr.click('[data-act="home"]');

  await vr.click('[data-act="therapist"]');
  await vr.fill("#th-pin1", "1234"); await vr.fill("#th-pin2", "1234"); await vr.click('[data-act="pin-set"]');

  // Customise Communication Passport behind therapist PIN
  check(!!(await vr.$('[data-act="passport"]')), "passport: Therapist area exposes Communication passport button");
  await vr.click('[data-act="passport"]');
  await vr.click('[data-act="pp-edit"]');
  await vr.fill("#pp-cname", "Sarah (daughter)");
  await vr.fill("#pp-cphone", "+44 7700 900123");
  await vr.fill("#pp-med", "Prefers written appointment times");
  await vr.click('[data-act="pp-save"]');
  const ppSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_passport_card")); return JSON.parse(localStorage.getItem(k) || "null"); });
  check(!!ppSaved && ppSaved.emergencyName === "Sarah (daughter)" && ppSaved.medNote === "Prefers written appointment times",
    "passport: customised emergency contact and medical note saved strictly locally");
  await vr.click('[data-act="therapist"]');

  // Open Caregiver communication log behind PIN
  await vr.click('[data-act="carelog"]');
  await vr.click('[data-act="cg-rate"][data-k="wordFind"][data-v="4"]');
  await vr.click('[data-act="cg-tag"][data-k="strategy_helped"]');
  await vr.fill("#cg-note", "Ordered tea calmly using two-choice question.");
  await vr.click('[data-act="cg-save"]');
  const cgSaved = await vr.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.endsWith("_caregiver_logs")); return JSON.parse(localStorage.getItem(k) || "[]"); });
  check(cgSaved.length === 1 && cgSaved[0].ratings.wordFind === 4 && cgSaved[0].tags.includes("strategy_helped"), "carelog: structured ratings, context tag, and local note saved");
  await vr.click('[data-act="cg-tab"][data-t="tips"]');
  check((await vr.$$(".cg-tip")).length === 4, "carelog: partner strategy tips render all 4 clinical cards");
  await vr.click('[data-act="therapist"]');

  // Open Word Preservation Curator & Cue Profile behind PIN and add a custom word
  await vr.click('[data-act="wb-manage"]');
  await vr.fill("#wb-new-word", "pharmacy");
  await vr.fill("#wb-new-sfa", "Where you pick up prescriptions");
  await vr.click('[data-act="wb-add"]');
  check(/pharmacy/i.test(await vr.textContent(".card")), "wordbank curator: custom everyday word added to personal deck");
  await vr.click('[data-act="therapist"]');

  // Open Unified Clinician Domain Profile & Visit Brief behind PIN
  await vr.click('[data-act="brief"]');
  check((await vr.$$(".br-card")).length === 5 && !!(await vr.$(".br-adherence")) && !!(await vr.$("svg.br-svg")) && !!(await vr.$('[data-act="brief-print"]')) && !!(await vr.$('[data-act="br-apply-focus"]')) && !!(await vr.$("#br-visit-note")),
    "clinical brief: renders adherence bar, all 5 domain summary cards, SVG comparison, practice plan button, visit goal note, and Print button");
  await vr.fill("#br-visit-note", "Ask about large-print medication schedule card");
  await vr.click('[data-act="br-save-note"]');
  await vr.click('[data-act="br-apply-focus"]');
  check(/updated/i.test(await vr.textContent(".br-printarea")),
    "clinical brief: one-click focus preset applies cleanly to targeted hub settings");
  await vr.click('[data-act="br-win"][data-d="7"]');
  check((await vr.getAttribute('[data-act="br-win"][data-d="7"]', "aria-pressed")) === "true",
    "clinical brief: switches comparison time window cleanly");
  await vr.click('[data-act="brief-copy"]');
  const briefTxtVal = await vr.inputValue("#brief-text");
  check(/CLINICAL VISIT BRIEF/.test(briefTxtVal) && /PRACTICE ACTIVITY:/.test(briefTxtVal) && /SUGGESTED PRACTICE PLAN:/.test(briefTxtVal) && /QUESTIONS \/ GOALS FOR NEXT VISIT:/.test(briefTxtVal) && /Ask about large-print medication schedule card/.test(briefTxtVal) && /Word-finding bridges/.test(briefTxtVal) && /Functional numbers, times & prices/.test(briefTxtVal) && /Everyday dialogues:/.test(briefTxtVal) && /Multi-step instruction following:/.test(briefTxtVal) && /Caregiver–practice concordance:/.test(briefTxtVal) && /written/i.test(briefTxtVal) && /pacing|Spoken message/i.test(briefTxtVal) && /VNeST/.test(briefTxtVal) && /Connected story retell/i.test(briefTxtVal) && /Morphosyntax & cloze/.test(briefTxtVal) && /Surface & irregular reading/.test(briefTxtVal) && /COMMUNICATION SUPPORTS \(PASSPORT\):/.test(briefTxtVal) && /Prefers written appointment times/.test(briefTxtVal),
    "clinical brief: generates structured plain-text visit brief and triggers copy");
  await vr.click('[data-act="br-back"]');

  await vr.click('[data-act="report"]');
  const rpVar = await vr.textContent(".print-area");
  check(/Targeted PPA practice/.test(rpVar) && /Sentence building/.test(rpVar) && /Everyday functional reading/.test(rpVar) && /Spoken messages/.test(rpVar) && /Speech pacing coach/.test(rpVar) && /Actions & verbs \(VNeST\)/.test(rpVar) && /Story & sequence retell/.test(rpVar) && /Grammar & word endings/.test(rpVar) && /Surface & irregular reading/.test(rpVar) && /Word-finding bridges/.test(rpVar) && /Numbers, times & prices/.test(rpVar) && /Everyday dialogues/.test(rpVar) && /Follow instructions/.test(rpVar) && /Word preservation & cue profile/.test(rpVar) && /Written expression & CART/.test(rpVar) && /Caregiver observations/.test(rpVar) && /Strategy helped/.test(rpVar),
    "variants & carelog & wordbank & writing & discourse & pacing & verbs & narrative & grammar & surface & circumlocution & numbers & dialogue & instructions: printable therapist summary lists all new modalities");
  check(vr.errors.length === 0, "no page errors (all modalities, passport, brief): " + vr.errors.join("; "));
  await browser12.close();

  if (failures) { console.error(failures + " check(s) failed."); process.exit(1); }
  console.log("All browser checks passed.");
})();
