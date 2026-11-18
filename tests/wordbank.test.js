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

/* 1. Validate core wordbank content (IT & EN parity, SFA + PCA completeness) */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/wordbank.js"), cCtx);
const WB = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.WORDBANK;
check(Array.isArray(WB) && WB.length === 18, "content/wordbank.js defines 18 core bilingual vocabulary items");

for (const it of WB) {
  check(!!it.id && !!it.cat && !!it.pic, `wordbank ${it.id}: has id, category, and picture`);
  for (const lang of ["it", "en"]) {
    const d = it[lang];
    check(!!d && !!d.w && Array.isArray(d.sfa) && d.sfa.length === 3,
      `wordbank (${lang}) ${it.id}: has target word and 3 Semantic Feature Analysis (SFA) cues`);
    check(!!d.pca && !!d.pca.syl && !!d.pca.first && typeof d.pca.len === "number",
      `wordbank (${lang}) ${it.id}: has complete Phonemic Component Analysis (PCA) breakdown`);
  }
}

/* 2. Validate spaced repetition, session auto-harvesting, PIN gating, and cue/error analytics */
const store = {};
const day0 = new Date("2026-11-10T10:00:00Z").getTime();
const sampleSessions = [
  {
    id: "s1", mode: "session", date: "2026-11-09T10:00:00Z", who: "solo",
    items: [
      { game: "name", lv: 2, label: "martello", result: "almost", hints: 1, cue: "semantic", errType: "semantic", score: 0.5 },
      { game: "name", lv: 1, label: "chiave", result: "retry", hints: 2, cue: "phonemic", errType: "phonemic", score: 0 },
      { game: "name", lv: 1, label: "pane", result: "good", hints: 0, cue: "none", errType: null, score: 1 }
    ]
  }
];
const wCtx = {
  window: {
    POG: {
      content: { WORDBANK: WB },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "it",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => sampleSessions,
        header: () => "",
        render: () => {},
        go: () => {},
        screen: () => "wordbank",
        t: () => ({ level: "Livello" }),
        speak: () => {},
        stopVoice: () => {},
        flash: () => {},
        flashText: () => "",
        therapistUnlocked: () => false,
        therapistView: () => "PIN_REQUIRED"
      }
    },
    addEventListener: () => {}
  },
  document: { getElementById: () => null },
  Date, Math, JSON, Object, Array
};
vm.createContext(wCtx);
vm.runInContext(read("js/wordbank.js"), wCtx);
const wbApi = wCtx.window.POG.wordbank;

check(!!wbApi && wbApi.INTERVALS.join(",") === "1,2,5,12,28",
  "js/wordbank.js exposes Leitner intervals [1, 2, 5, 12, 28]");
check(wCtx.window.POG.ext.screens["wb-manage"]() === "PIN_REQUIRED",
  "wordbank curator screen (wb-manage) enforces therapist PIN when locked");

/* Spaced-repetition box promotion & reset mechanics */
let card = { id: "c1", box: 1, intervalDays: 1, attempts: 0, independentCount: 0, cueCounts: { sfa: 0, pca: 0, model: 0 }, dueAt: day0 };
card = wbApi.reviewCard(card, "good", day0);
check(card.box === 2 && card.intervalDays === 2 && card.independentCount === 1,
  "independent retrieval promotes card from Box 1 -> Box 2 (2 days)");
card = wbApi.reviewCard(card, "good", day0);
check(card.box === 3 && card.intervalDays === 5 && wbApi.classifyCard(card) === "maintaining",
  "consecutive independent recall promotes Box 2 -> Box 3 (maintaining)");
card = wbApi.reviewCard(card, "sfa", day0);
check(card.box === 2 && card.cueCounts.sfa === 1,
  "SFA-cued retrieval caps box progression gently at Box 2 and logs semantic cue reliance");
card = wbApi.reviewCard(card, "model", day0);
check(card.box === 1 && card.intervalDays === 1 && wbApi.classifyCard(card) === "fragile",
  "model-required retrieval resets card to Box 1 (fragile, due tomorrow)");

/* Auto-harvesting struggled words from daily sessions */
const seededAtDay0 = wbApi.listDeck().map((c) => Object.assign({}, c, { lastHarvestedAt: null, lastErr: null, dueAt: day0 + 5 * 86400000 }));
const hRes = wbApi.harvestFromSessions(sampleSessions, seededAtDay0, day0);
const harvestedNew = hRes.deck.find((c) => c.id.startsWith("hv_martello"));
const flaggedCore = hRes.deck.find((c) => c.id === "wb2"); // chiave
check(!!harvestedNew && harvestedNew.lastErr === "semantic" && harvestedNew.box === 1,
  "auto-harvests unseen struggled naming word ('martello') into Box 1 with semantic error tag");
check(!!flaggedCore && flaggedCore.lastErr === "phonemic" && flaggedCore.dueAt <= day0,
  "flags matching core deck word ('chiave') as due with phonemic error metadata");
const hResAgain = wbApi.harvestFromSessions(sampleSessions, hRes.deck, day0);
check(hResAgain.synced === 0 && hResAgain.deck.length === hRes.deck.length,
  "session auto-harvesting is idempotent across repeated syncs");

/* Cue effectiveness & error profile aggregation */
const cueProf = wbApi.computeCueErrorProfile(sampleSessions, [
  { items: [{ cue: "sfa", result: "almost" }, { cue: "none", result: "good" }] }
]);
check(cueProf.totalCued === 5 && cueProf.cues.independent === 2 && cueProf.cues.semantic === 2 && cueProf.cues.phonemic === 1,
  "computeCueErrorProfile accurately totals independent vs semantic vs phonemic cues across daily + wordbank sessions");
check(cueProf.errs.phonemic === 1 && cueProf.errs.semantic === 1 && cueProf.helpfulCue === "semantic",
  "computeCueErrorProfile summarizes phonemic/semantic error counts and identifies helpful cue modality");

/* Privacy check: therapist-cloud.js never uploads wordbank words or caregiver-curated deck items */
const thCloud = read("js/therapist-cloud.js");
check(!thCloud.includes("wordbank_deck") && !thCloud.includes("wordbank_sessions"),
  "therapist-cloud.js never reads or uploads local wordbank deck or custom words");

if (fail) process.exit(1);
console.log("All wordbank & cue-profile unit tests passed.");
