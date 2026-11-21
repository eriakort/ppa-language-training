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

/* 1. Validate bilingual Prosody, Word Stress & Spoken Intonation content bank */
const pCtx = { window: {} };
vm.createContext(pCtx);
vm.runInContext(read("content/prosody.js"), pCtx);
const PROS_BANK = pCtx.window.POG && pCtx.window.POG.content && pCtx.window.POG.content.PROSODY;

check(!!PROS_BANK && Array.isArray(PROS_BANK.it) && PROS_BANK.it.length === 9 && Array.isArray(PROS_BANK.en) && PROS_BANK.en.length === 9,
  "content/prosody.js defines 9 Italian and 9 English prosody, stress & intonation items");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { stress: 0, focus: 0, contour: 0 };
  const seenIds = new Set();
  for (const item of PROS_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    let validShape = !seenIds.has(item.id) && !!item.icon && !!item.prompt && !!item.cue && !!item.explain && !!item.spoken;
    if (item.kind === "stress") {
      validShape = validShape && !!item.word && Array.isArray(item.syllables) && item.syllables.length >= 2 &&
        item.stressIdx >= 0 && item.stressIdx < item.syllables.length;
    } else if (item.kind === "focus") {
      validShape = validShape && !!item.question && Array.isArray(item.words) && item.words.length >= 3 &&
        item.focusIdx >= 0 && item.focusIdx < item.words.length;
    } else if (item.kind === "contour") {
      validShape = validShape && !!item.utterance && ["question", "statement", "urgent"].includes(item.contour) &&
        Array.isArray(item.choices) && item.choices.length === 3 && item.ans === 0;
    } else {
      validShape = false;
    }
    check(validShape, `prosody (${lang}) ${item.id}: valid fields and answer indices`);
    seenIds.add(item.id);
  }
  check(byLv[1] === 3 && byLv[2] === 3 && byLv[3] === 3,
    `prosody (${lang}): evenly balanced across levels 1-3 (3/3/3)`);
  check(byKind.stress === 3 && byKind.focus === 3 && byKind.contour === 3,
    `prosody (${lang}): evenly balanced across stress, focus, and contour (3/3/3)`);
}

/* 2. Validate js/prosody.js interactive drill, variants.js Done-today badge, clinical-brief & progress/report integration */
const vContentCtx = { window: {} };
vm.createContext(vContentCtx);
vm.runInContext(read("content/variants.js"), vContentCtx);

const store = {};
const nowMs = Date.now();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();
let currentScreen = "home";

const ctx = {
  window: {
    POG: {
      content: { PROSODY: PROS_BANK, VARIANTS: vContentCtx.window.POG.content.VARIANTS },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      grammar: { label: () => "Grammar", lvTag: () => "Level 2", desc: () => "Morphosyntax" },
      numbers: { label: () => "Numbers", lvTag: () => "Level 2", desc: () => "Times & prices" },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [{ id: "s1", date: daysAgo(1), items: [{ game: "echo", score: 0.9 }] }],
        getScripts: () => [],
        getProfile: () => ({ name: "Clara" }),
        header: () => "",
        render: () => {},
        go: (s) => { currentScreen = s; },
        screen: () => currentScreen,
        t: () => ({ level: "Level", home: "Home" }),
        isLocked: () => false,
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
vm.runInContext(read("js/prosody.js"), ctx);
vm.runInContext(read("js/variants.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const prApi = ctx.window.POG.prosody;
const brApi = ctx.window.POG.brief;
const A = ctx.window.POG.ext.actions;

const drill = prApi.buildDrill("en", 2, 3);
check(drill.length === 3 && drill.every((d) => d.lv === 2) &&
  new Set(drill.map((d) => d.kind)).size === 3,
  "prosody.buildDrill returns a 3-item drill covering stress, focus, and contour at level 2");

const hubBefore = ctx.window.POG.ext.screens.variants();
check(/data-act="pros-home"/.test(hubBefore) && !/Done today/.test(hubBefore),
  "targeted hub displays prosody card without done-today badge before practice");

A["pros-home"]();
check(currentScreen === "prosody", "pros-home navigates to prosody screen");

/* Play through all 3 items; fail first attempt on item 0 to test dimming, nudge & hint */
for (let stepIdx = 0; stepIdx < 3; stepIdx++) {
  const html = ctx.window.POG.ext.screens.prosody();
  const item = (PROS_BANK.en).find((x) => html.includes(x.prompt));
  check(!!item, `prosody step ${stepIdx + 1} renders recognizable prompt`);
  const target = item.kind === "stress" ? item.stressIdx : (item.kind === "focus" ? item.focusIdx : item.ans);
  if (stepIdx === 0) {
    const wrongIdx = target === 0 ? 1 : 0;
    A["pros-pick"]({ getAttribute: () => String(wrongIdx) });
    A["pros-hint"]();
    const afterWrong = ctx.window.POG.ext.screens.prosody();
    check(/nudge/.test(afterWrong) && /disabled/.test(afterWrong),
      "prosody wrong attempt shows helpful nudge, dims distractor, and opens visual hint cleanly");
  }
  A["pros-pick"]({ getAttribute: () => String(target) });
  const feedbackHtml = ctx.window.POG.ext.screens.prosody();
  check(/var-feedback good/.test(feedbackHtml),
    `prosody step ${stepIdx + 1} resolves cleanly with explanation feedback`);
  A["pros-next"]();
}

const prSaved = JSON.parse(store.prosody_sessions || "[]");
check(prSaved.length === 1 && prSaved[0].items.length === 3 && prSaved[0].accuracy > 0.75,
  "completed 3-item prosody session persists locally in prosody_sessions");

const prProf = prApi.computeProsodyProfile(prSaved);
check(prProf.total === 3 && prProf.firstTry === 2 && prProf.hintUsed === 1 &&
  prProf.byKind.stress.n === 1 && prProf.byKind.focus.n === 1 && prProf.byKind.contour.n === 1,
  "computeProsodyProfile computes firstTry, hintUsed, and stress/focus/contour counts");

/* Verify Targeted Hub now marks prosody card with Done today badge */
const hubAfter = ctx.window.POG.ext.screens.variants();
check(/✓ Done today/.test(hubAfter),
  "targeted hub displays ✓ Done today badge on modules practised today");

/* Verify clinical brief integration */
const brief = brApi.buildBrief(30, Date.now() + 1000);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.speech.cur != null && domByKey.speech.curN >= 2,
  "clinical-brief routes prosody_sessions into Repetition, phonology & motor speech domain");
check(brief.observations.some((o) => /Word stress & intonation: 2 of 3 clean first passes/.test(o)),
  "clinical-brief outputs Word stress & intonation longitudinal observation");

/* 3. Verify strings.js non-destructive restore copy, app.js backup/CSV, therapist-cloud boundary, sw/index parity */
const strCtx = { window: {} };
vm.createContext(strCtx);
vm.runInContext(read("js/strings.js"), strCtx);
check(/new local profile/i.test(strCtx.window.POG.strings.en.dRestoreJson) &&
  /nuovo profilo locale/i.test(strCtx.window.POG.strings.it.dRestoreJson),
  "strings.js dRestoreJson accurately clarifies restoration into a new local profile");

const appSrc = read("js/app.js");
check(/"prosody_level"/.test(appSrc) && /"prosody_sessions"/.test(appSrc) &&
  /UI_FREE = .*prosody: 1/.test(appSrc) && /"prosody"/.test(appSrc),
  "js/app.js registers prosody in UI_FREE, BACKUP_KEYS, and CSV export");

const thCloud = read("js/therapist-cloud.js");
check(!/prosody_sessions/.test(thCloud) && !/prosody_level/.test(thCloud),
  "therapist-cloud.js keeps prosody_sessions and prosody_level strictly device-local");

const progSrc = read("js/progress.js");
const repSrc = read("js/report.js");
check(/pros_stress/.test(progSrc) && /prosodySessions/.test(progSrc) && /var prApi = window\.POG\.prosody/.test(repSrc),
  "progress.js and report.js wire prosody analytics and printable summary row");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All prosody, done-today hub badge, and sync boundary unit tests passed.");
