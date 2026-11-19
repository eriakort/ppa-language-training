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

/* 1. Validate bilingual Discourse & Speech Pacing content banks */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/discourse.js"), cCtx);
vm.runInContext(read("content/pacing.js"), cCtx);
const DC_BANK = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.DISCOURSE;
const PC_BANK = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.PACING;

check(!!DC_BANK && Array.isArray(DC_BANK.it) && DC_BANK.it.length === 12 && Array.isArray(DC_BANK.en) && DC_BANK.en.length === 12,
  "content/discourse.js defines 12 Italian and 12 English spoken vignettes");
check(!!PC_BANK && Array.isArray(PC_BANK.it) && PC_BANK.it.length === 12 && Array.isArray(PC_BANK.en) && PC_BANK.en.length === 12,
  "content/pacing.js defines 12 Italian and 12 English syllable pacing targets");

for (const lang of ["it", "en"]) {
  const dLv = { 1: 0, 2: 0, 3: 0 }, pLv = { 1: 0, 2: 0, 3: 0 };
  for (const item of DC_BANK[lang]) {
    dLv[item.lv] = (dLv[item.lv] || 0) + 1;
    check(!!item.spokenText && Array.isArray(item.keywords) && item.keywords.length >= 2 && Array.isArray(item.opts) && item.opts.length === 4 && item.ans >= 0 && item.ans < 4,
      `discourse (${lang}) ${item.id}: complete spoken text, keyword anchors, 4 options, valid answer`);
  }
  for (const item of PC_BANK[lang]) {
    pLv[item.lv] = (pLv[item.lv] || 0) + 1;
    const joined = item.syllables.join("").replace(/\s+/g, "").toLowerCase();
    const target = item.word.replace(/\s+/g, "").toLowerCase();
    check(joined === target && item.syllables.length >= 2 && !!item.cue,
      `pacing (${lang}) ${item.id}: syllables join cleanly to target word ('${item.word}')`);
  }
  check(dLv[1] === 4 && dLv[2] === 4 && dLv[3] === 4,
    `discourse (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
  check(pLv[1] === 4 && pLv[2] === 4 && pLv[3] === 4,
    `pacing (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
}

/* 2. Validate discourse.js, pacing.js, and clinical-brief.js synthesis */
const store = {};
const nowMs = new Date("2026-11-19T10:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();

const ctx = {
  window: {
    POG: {
      content: { DISCOURSE: DC_BANK, PACING: PC_BANK },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [],
        getProfile: () => ({ name: "Eric" }),
        header: () => "",
        render: () => {},
        go: () => {},
        screen: () => "discourse",
        t: () => ({ level: "Level" }),
        speak: () => {},
        stopVoice: () => {},
        flash: () => {},
        flashText: () => "",
        therapistUnlocked: () => true,
        therapistView: () => "PIN_REQUIRED"
      }
    },
    addEventListener: () => {}
  },
  document: { getElementById: () => null },
  setTimeout, clearTimeout, Date, Math, JSON, Object, Array
};
vm.createContext(ctx);
vm.runInContext(read("js/discourse.js"), ctx);
vm.runInContext(read("js/pacing.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const dcApi = ctx.window.POG.discourse;
const pcApi = ctx.window.POG.pacing;
const brApi = ctx.window.POG.brief;

const dDrill = dcApi.buildDrill(2, "en");
const pDrill = pcApi.buildDrill(1, "en");
check(dDrill.length === 3, "discourse.buildDrill selects 3 items prioritizing current level");
check(pDrill.length === 4 && pDrill[0].lv === 1, "pacing.buildDrill selects 4 items starting at requested level");

const dProf = dcApi.computeDiscourseProfile([
  {
    id: "d1",
    date: daysAgo(1),
    accuracy: 0.667,
    items: [
      { firstPass: true, slowUsed: false, kwUsed: false, textUsed: false, result: "good", score: 1 },
      { firstPass: false, slowUsed: true, kwUsed: true, textUsed: false, result: "almost", score: 0.5 },
      { firstPass: false, slowUsed: false, kwUsed: true, textUsed: false, result: "almost", score: 0.5 }
    ]
  }
]);
check(dProf.total === 3 && dProf.firstPass === 1 && dProf.keywordRescued === 2 && dProf.slowAssisted === 1,
  "computeDiscourseProfile tracks first-pass comprehension, slow replay, and keyword anchor rescue");

const pProf = pcApi.computePacingProfile([
  {
    id: "p1",
    date: daysAgo(1),
    fluency: 0.75,
    items: [
      { result: "good", score: 1, tempo: "steady" },
      { result: "good", score: 1, tempo: "slow" },
      { result: "almost", score: 0.5, tempo: "slow" },
      { result: "almost", score: 0.5, tempo: "slow" }
    ]
  }
]);
check(pProf.total === 4 && pProf.smooth === 2 && pProf.effortful === 2 && pProf.tempos.slow === 3 && pProf.fluency === 0.75,
  "computePacingProfile summarizes smooth vs effortful beats and preferred tempo distribution");

/* Seed local storage so clinical-brief synthesizes discourse & pacing streams */
store.discourse_sessions = JSON.stringify([
  {
    id: "d_cur", date: daysAgo(2), accuracy: 0.667,
    items: [
      { firstPass: true, kwUsed: false, result: "good", score: 1 },
      { firstPass: false, kwUsed: true, result: "almost", score: 0.5 },
      { firstPass: false, kwUsed: true, result: "almost", score: 0.5 }
    ]
  }
]);
store.pacing_sessions = JSON.stringify([
  {
    id: "p_cur", date: daysAgo(1), fluency: 0.75,
    items: [
      { result: "good", score: 1, tempo: "slow" },
      { result: "good", score: 1, tempo: "slow" },
      { result: "almost", score: 0.5, tempo: "steady" },
      { result: "almost", score: 0.5, tempo: "slow" }
    ]
  }
]);

const brief = brApi.buildBrief(30, nowMs);
const speechDom = brief.domains.find((d) => d.key === "speech");
const funcDom = brief.domains.find((d) => d.key === "functional");
check(speechDom && speechDom.cur === 75 && funcDom && funcDom.cur === 67,
  "clinical-brief integrates pacing fluency into Speech domain and spoken discourse into Functional domain");
check(brief.observations.some((o) => /written keywords rescued 2/i.test(o)),
  "clinical-brief observation highlights written-keyword rescue count in spoken message comprehension");
check(brief.observations.some((o) => /2 of 4.*slow/i.test(o)),
  "clinical-brief observation highlights smooth beat fluency and most-used pacing tempo");

/* 3. Privacy check: therapist-cloud.js never uploads discourse_sessions or pacing_sessions */
const thCloud = read("js/therapist-cloud.js");
check(!thCloud.includes("discourse_sessions") && !thCloud.includes("pacing_sessions"),
  "therapist-cloud.js never reads or uploads local discourse or pacing sessions");

if (fail) process.exit(1);
console.log("All discourse & speech pacing unit tests passed.");
