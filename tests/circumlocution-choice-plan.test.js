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

/* 1. Validate bilingual Circumlocution & Word-finding bridges bank */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/circumlocution.js"), cCtx);
const CR_BANK = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.CIRCUMLOCUTION;

check(!!CR_BANK && Array.isArray(CR_BANK.it) && CR_BANK.it.length === 12 && Array.isArray(CR_BANK.en) && CR_BANK.en.length === 12,
  "content/circumlocution.js defines 12 Italian and 12 English word-finding bridge items");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  for (const item of CR_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    const goodClues = (item.clues || []).filter((c) => c.ok === true);
    const badClues = (item.clues || []).filter((c) => c.ok === false);
    check(
      goodClues.length === 2 &&
      badClues.length === 2 &&
      !!item.targetWord &&
      !!item.category &&
      !!item.firstSound &&
      !!item.bridgeSentence &&
      !!item.explanation,
      `circumlocution (${lang}) ${item.id}: balanced 2/2 clues, category, sound cue, and bridgeSentence`
    );
  }
  check(byLv[1] === 4 && byLv[2] === 4 && byLv[3] === 4,
    `circumlocution (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
}

/* 2. Validate circumlocution.js, aac.js choice presets, and clinical-brief.js practice plan */
const store = {};
const nowMs = new Date("2026-11-19T10:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();

const ctx = {
  window: {
    POG: {
      content: { CIRCUMLOCUTION: CR_BANK },
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
        screen: () => "circumlocution",
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
vm.runInContext(read("content/grammar.js"), ctx);
vm.runInContext(read("js/grammar.js"), ctx);
vm.runInContext(read("js/circumlocution.js"), ctx);
vm.runInContext(read("js/aac.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const crApi = ctx.window.POG.circumlocution;
const brApi = ctx.window.POG.brief;
const boardApi = ctx.window.POG.board;

check(Array.isArray(boardApi.choicePresets()) && boardApi.choicePresets().length >= 4,
  "aac.js exposes bilingual quick two-choice presets");

const drill = crApi.buildDrill("en", 2, 3);
check(drill.length === 3 && drill.every((x) => x.lv === 2 && x.shuffledClues.length === 4),
  "circumlocution.buildDrill prioritizes target level and keeps 4 clues");

store.circumlocution_sessions = JSON.stringify([
  {
    id: "cr_cur",
    date: daysAgo(2),
    accuracy: 0.72,
    items: [
      { id: "cr_en_5", lv: 2, label: "umbrella", clueClean: true, cueUsed: false, bridgeMode: "direct_word", score: 1, ms: 4200 },
      { id: "cr_en_6", lv: 2, label: "scissors", clueClean: true, cueUsed: true, bridgeMode: "described", score: 0.8, ms: 5300 },
      { id: "cr_en_7", lv: 2, label: "mirror", clueClean: false, cueUsed: false, bridgeMode: "described", score: 0.65, ms: 6100 }
    ]
  }
]);
store.grammar_sessions = JSON.stringify([
  {
    id: "gr_cur",
    date: daysAgo(1),
    accuracy: 0.55,
    items: [
      { id: "gr_en_1", kind: "tense", lv: 2, firstTry: false, score: 0.55, ms: 4800 }
    ]
  }
]);

const cp = crApi.computeCircumlocutionProfile(JSON.parse(store.circumlocution_sessions));
check(cp.total === 3 && cp.clueClean === 2 && cp.directWords === 1 && cp.describedSuccess === 2 && cp.cueAssisted === 1,
  "computeCircumlocutionProfile separates direct word unlocks from described communicative success");

const brief = brApi.buildBrief(30, nowMs);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.lexical.cur === 72 && domByKey.syntax.cur === 55,
  "clinical-brief routes circumlocution into Lexical domain cleanly");
check(brief.observations.some((o) => /Word-finding bridges \(circumlocution\): 1 of 3 words unlocked directly; 2 communicated clearly/.test(o)),
  "clinical-brief surfaces compensatory circumlocution highlight");
check(!!brief.plan && brief.plan.recommendedFocus === "nfv" && brief.plan.items.length === 2 && /55%/.test(brief.plan.items[0].text),
  "clinical-brief recommendFocusPlan ranks lowest domain and recommends targeted profile");

const plain = brApi.buildPlainTextBrief(brief, { name: "Arthur" });
check(/SUGGESTED PRACTICE PLAN:/.test(plain) && /Sentence & morphosyntax/.test(plain),
  "plain-text clinical brief appends Suggested Practice Plan section");

const thCloud = read("js/therapist-cloud.js");
check(!/circumlocution_sessions/.test(thCloud),
  "therapist-cloud.js keeps circumlocution sessions strictly device-local");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All circumlocution, two-choice AAC & practice plan unit tests passed.");
