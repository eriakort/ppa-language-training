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

/* 1. Validate bilingual Numbers, Times & Prices bank */
const nCtx = { window: {} };
vm.createContext(nCtx);
vm.runInContext(read("content/numbers.js"), nCtx);
const NM_BANK = nCtx.window.POG && nCtx.window.POG.content && nCtx.window.POG.content.NUMBERS;

check(!!NM_BANK && Array.isArray(NM_BANK.it) && NM_BANK.it.length === 12 && Array.isArray(NM_BANK.en) && NM_BANK.en.length === 12,
  "content/numbers.js defines 12 Italian and 12 English functional numbers items");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { time: 0, price: 0, dosage: 0 };
  for (const item of NM_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    check(
      Array.isArray(item.opts) && item.opts.length === 3 &&
      Array.isArray(item.foilTypes) && item.foilTypes.length === 3 &&
      item.foilTypes[item.ans] === "target" &&
      !!item.prompt && !!item.spoken && !!item.cue &&
      !!item.fullSentence && !!item.explanation,
      `numbers (${lang}) ${item.id}: 3 options, valid target foilType, cue, and fullSentence`
    );
  }
  check(byLv[1] === 4 && byLv[2] === 4 && byLv[3] === 4,
    `numbers (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
  check(byKind.time === 4 && byKind.price === 4 && byKind.dosage === 4,
    `numbers (${lang}): evenly balanced across time, price, and dosage (4/4/4)`);
}

/* 2. Validate numbers.js, aac.js numberTokens, passport.js print button, and clinical-brief.js visit note */
const store = {};
const nowMs = new Date("2026-11-19T10:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();
let printed = 0;

const ctx = {
  window: {
    print: () => { printed++; },
    POG: {
      content: { NUMBERS: NM_BANK },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [],
        getScripts: () => [],
        getProfile: () => ({ name: "Arthur" }),
        header: () => "",
        render: () => {},
        go: () => {},
        screen: () => "numbers",
        t: () => ({ level: "Level", home: "Home" }),
        speak: () => {},
        stopVoice: () => {},
        flash: () => {},
        flashText: () => "",
        therapistUnlocked: () => true,
        therapistView: () => "PIN_REQUIRED",
        inHost: () => false
      }
    },
    addEventListener: () => {}
  },
  document: { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} },
  setTimeout, clearTimeout, Date, Math, JSON, Object, Array
};
vm.createContext(ctx);
vm.runInContext(read("js/numbers.js"), ctx);
vm.runInContext(read("js/aac.js"), ctx);
vm.runInContext(read("js/passport.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const nmApi = ctx.window.POG.numbers;
const brApi = ctx.window.POG.brief;
const boardApi = ctx.window.POG.board;

check(Array.isArray(boardApi.numberTokens()) && boardApi.numberTokens().includes("10:30") && boardApi.numberTokens().includes("£10"),
  "aac.js exposes localized quick numbers, times & currency tokens");

const drill = nmApi.buildDrill("en", 2, 4);
check(drill.length === 4 && drill.every((x) => x.lv === 2 && x.shuffledOpts.length === 3),
  "numbers.buildDrill prioritizes target level and keeps 3 transcoding choices");

store.numbers_sessions = JSON.stringify([
  {
    id: "nm_cur",
    date: daysAgo(1),
    accuracy: 0.78,
    items: [
      { id: "nm_en_5", kind: "time", lv: 2, label: "09:15", firstTry: true, hintUsed: false, errType: null, score: 1, ms: 3100 },
      { id: "nm_en_6", kind: "price", lv: 2, label: "£3.20", firstTry: false, hintUsed: false, errType: "transposition", score: 0.6, ms: 4400 },
      { id: "nm_en_7", kind: "dosage", lv: 2, label: "Day 15 · Room 4", firstTry: false, hintUsed: true, errType: "magnitude", score: 0.6, ms: 5200 },
      { id: "nm_en_8", kind: "time", lv: 2, label: "16:45", firstTry: true, hintUsed: false, errType: null, score: 0.92, ms: 2900 }
    ]
  }
]);
store.brief_visit_note = JSON.stringify("Ask about evening medication clock cards");

const np = nmApi.computeNumbersProfile(JSON.parse(store.numbers_sessions));
check(np.total === 4 && np.firstTry === 2 && np.errors.transposition === 1 && np.errors.magnitude === 1,
  "computeNumbersProfile tracks first-try rate and transposition vs magnitude errors");

const ppHtml = ctx.window.POG.ext.screens.passport();
check(/data-act="pp-print"/.test(ppHtml), "passport screen renders printable wallet card button");
ctx.window.POG.ext.actions["pp-print"]();
check(printed === 1, "pp-print action invokes browser print cleanly");

const brief = brApi.buildBrief(30, nowMs);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.functional.cur === 78,
  "clinical-brief routes numbers_sessions into Functional everyday communication domain");
check(brief.observations.some((o) => /Functional numbers, times & prices: 2 of 4 clean first-try matches \(transposition errors: 1, magnitude foils: 1\)/.test(o)),
  "clinical-brief surfaces functional numbers & foil highlight");

const plain = brApi.buildPlainTextBrief(brief, { name: "Arthur" });
check(/QUESTIONS \/ GOALS FOR NEXT VISIT:/.test(plain) && /Ask about evening medication clock cards/.test(plain),
  "plain-text clinical brief includes saved clinic visit questions/goals note");

const thCloud = read("js/therapist-cloud.js");
check(!/numbers_sessions|brief_visit_note/.test(thCloud),
  "therapist-cloud.js keeps numbers_sessions and brief_visit_note strictly device-local");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All functional numbers, quick AAC numbers & visit goal note unit tests passed.");
