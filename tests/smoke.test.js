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

async function open(browser, withMic) {
  const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  if (withMic) await page.addInitScript(MOCK_MIC);
  await page.route("http://app.test/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + html + "</body></html>" }));
  await page.goto("http://app.test/");
  return page;
}

async function spokenAnswer(page) {
  const tag = await page.textContent(".tag");
  if (/Racconto/.test(tag)) return "Mi sveglio presto, bevo il caffè, faccio colazione e poi leggo il giornale in cucina con calma";
  if (/Parole ·/.test(tag)) return "è " + (await page.getAttribute(".pic", "aria-label"));
  if (/Sequenze/.test(tag)) return (await page.$$eval(".chip", (e) => e.map((x) => x.textContent))).join(" ");
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
  await playThrough(p, false);
  check((await p.$$("tbody tr")).length >= 10, "assisted session completes with a summary");
  check(p.errors.length === 0, "no page errors (assisted): " + p.errors.join("; "));

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
  if (failures) { console.error(failures + " check(s) failed."); process.exit(1); }
  console.log("All browser checks passed.");
})();
