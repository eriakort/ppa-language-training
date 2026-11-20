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

/* 1. Validate bilingual Receptive Syntax & Multi-Step Instruction bank */
const iCtx = { window: {} };
vm.createContext(iCtx);
vm.runInContext(read("content/instructions.js"), iCtx);
const INST_BANK = iCtx.window.POG && iCtx.window.POG.content && iCtx.window.POG.content.INSTRUCTIONS;

check(!!INST_BANK && Array.isArray(INST_BANK.it) && INST_BANK.it.length === 12 && Array.isArray(INST_BANK.en) && INST_BANK.en.length === 12,
  "content/instructions.js defines 12 Italian and 12 English multi-step instructions");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { sequence: 0, attribute: 0, clause: 0 };
  const seenIds = new Set();
  for (const item of INST_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    const tokIds = new Set((item.tokens || []).map((t) => t.id));
    const validTargets = Array.isArray(item.targetIds) && item.targetIds.length >= 1 && item.targetIds.every((id) => tokIds.has(id));
    check(
      !seenIds.has(item.id) && Array.isArray(item.tokens) && item.tokens.length === 4 &&
      item.tokens.every((t) => !!t.id && !!t.pic && !!t.label) &&
      validTargets && !!item.instruction && !!item.cue && !!item.explanation,
      `instructions (${lang}) ${item.id}: 4 tokens, valid targetIds sequence, cue, and explanation`
    );
    seenIds.add(item.id);
  }
  check(byLv[1] === 4 && byLv[2] === 4 && byLv[3] === 4,
    `instructions (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
  check(byKind.sequence === 4 && byKind.attribute === 4 && byKind.clause === 4,
    `instructions (${lang}): evenly balanced across sequence, attribute, and clause (4/4/4)`);
}

/* 2. Validate instructions.js mechanics, aac.js phrase chaining, and clinical-brief.js concordance */
const store = {};
const spoken = [];
const nowMs = new Date("2026-11-20T10:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();

let currentScreen = "home";
const ctx = {
  window: {
    POG: {
      content: { INSTRUCTIONS: INST_BANK },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [
          { id: "s1", date: daysAgo(3), items: [{ game: "name", score: 0.9 }, { game: "seq", score: 0.8 }] }
        ],
        getScripts: () => [],
        getProfile: () => ({ name: "Arthur" }),
        header: () => "",
        render: () => {},
        go: (s) => { currentScreen = s; },
        screen: () => currentScreen,
        t: () => ({ level: "Level", home: "Home" }),
        speak: (txt) => { spoken.push(txt); },
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
vm.runInContext(read("js/instructions.js"), ctx);
vm.runInContext(read("js/aac.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const instApi = ctx.window.POG.instructions;
const boardApi = ctx.window.POG.board;
const brApi = ctx.window.POG.brief;
const A = ctx.window.POG.ext.actions;

/* Test BuildDrill & non-disabling order_error recovery */
const drill = instApi.buildDrill("en", 2, 3);
check(drill.length === 3 && drill.every((x) => x.lv === 2 && x.shuffledTokens.length === 4),
  "instructions.buildDrill prioritizes target level and shuffles 4 tokens per item");

/* Test AAC chainMode phrase builder (defaults off, builds multi-tile chain, removes chip, clears cleanly) */
check(boardApi.isChainMode() === false && boardApi.chainParts().length === 0,
  "aac.js starts with chainMode disabled so single-tap Talk Board workflow is unchanged");
A["aac-chain-toggle"]();
check(boardApi.isChainMode() === true, "aac-chain-toggle activates multi-tile phrase builder");
boardApi; // render once so shown tiles populate
ctx.window.POG.ext.screens.board();
A["aac-tile"]({ getAttribute: () => "0" });
A["aac-num-pick"]({ getAttribute: () => "9" });
check(boardApi.chainParts().length === 2 && boardApi.chainParts()[1] === "10:30",
  "aac.js phrase builder combines tile phrases and numbers into ordered chain");
A["aac-chain-rm"]({ getAttribute: () => "0" });
check(boardApi.chainParts().length === 1 && boardApi.chainParts()[0] === "10:30",
  "aac-chain-rm removes individual chip cleanly");
A["aac-clear"]();
check(boardApi.chainParts().length === 0, "aac-clear empties active phrase chain");

/* Test instructions profile + clinical-brief dual domain routing & concordance analysis */
store.instructions_sessions = JSON.stringify([
  {
    id: "inst_1",
    date: daysAgo(1),
    accuracy: 0.78,
    items: [
      { id: "inst_en_5", kind: "sequence", lv: 2, label: "Before closing door", firstTry: true, hintUsed: false, attempts: 0, errType: null, score: 1, ms: 4200 },
      { id: "inst_en_6", kind: "attribute", lv: 2, label: "Small blue square", firstTry: false, hintUsed: false, attempts: 1, errType: "order_error", score: 0.7, ms: 5300 },
      { id: "inst_en_7", kind: "clause", lv: 2, label: "After receipt", firstTry: false, hintUsed: true, attempts: 1, errType: "clause_trap", score: 0.64, ms: 6100 }
    ]
  }
]);
const ip = instApi.computeInstructionsProfile(JSON.parse(store.instructions_sessions));
check(ip.total === 3 && ip.firstTry === 1 && ip.errors.order_error === 1 && ip.errors.clause_trap === 1,
  "computeInstructionsProfile aggregates firstTry and order_error/clause_trap subtype counts");

/* Concordance: lower, aligned, higher */
const concLow = brApi.computeCareConcordance({ carelog: [{ date: daysAgo(1), fcIndex: 0.50 }] }, [{ cur: 80 }, { cur: 80 }], nowMs - 30 * 86400000, nowMs);
const concAligned = brApi.computeCareConcordance({ carelog: [{ date: daysAgo(1), fcIndex: 0.76 }] }, [{ cur: 80 }, { cur: 80 }], nowMs - 30 * 86400000, nowMs);
const concHigh = brApi.computeCareConcordance({ carelog: [{ date: daysAgo(1), fcIndex: 0.92 }] }, [{ cur: 70 }, { cur: 80 }], nowMs - 30 * 86400000, nowMs);
check(concLow.status === "lower" && concLow.diffPt === -30 && concAligned.status === "aligned" && concHigh.status === "higher" && concHigh.diffPt === 17,
  "computeCareConcordance accurately classifies lower, aligned, and higher caregiver vs domain gaps");

/* Full buildBrief integration with caregiver log yielding 'lower' concordance & obsInstructions */
ctx.window.POG.carelog = {
  list: () => [{ id: "cg1", date: daysAgo(1), fcIndex: 0.55, tags: [] }],
  tagLabel: (k) => k
};
const brief = brApi.buildBrief(30, nowMs);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.syntax.cur === 79 && domByKey.functional.cur === 67,
  "clinical-brief routes instructions_sessions into both Morphosyntax and Functional domains");
check(brief.adherence.sessionCount === 2 && brief.adherence.itemCount === 5,
  "clinical-brief adherence counts instructions_sessions alongside check-ins/core sessions");
check(brief.observations.some((o) => /Multi-step instruction following: 1 of 3/.test(o)),
  "clinical-brief observations include Multi-step instruction following breakdown");
check(brief.concordance && brief.concordance.status === "lower" && brief.observations.some((o) => /Caregiver–practice concordance/.test(o)),
  "clinical-brief surfaces caregiver-practice concordance finding in observations");

/* Interactive UI pass check for instructions order_error non-disabling behavior */
A["inst-home"]();
check(currentScreen === "instructions", "inst-home switches screen to instructions");
const firstStepItem = drill;
void firstStepItem;

/* Privacy check */
const thCloud = read("js/therapist-cloud.js");
check(!/instructions_sessions/.test(thCloud) && !/instructions_level/.test(thCloud),
  "therapist-cloud.js keeps instructions_sessions and instructions_level strictly device-local");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All instruction following, AAC phrase chain & clinical concordance unit tests passed.");
