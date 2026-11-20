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

/* 1. Validate bilingual Everyday Dialogues bank */
const dCtx = { window: {} };
vm.createContext(dCtx);
vm.runInContext(read("content/dialogue.js"), dCtx);
const DG_BANK = dCtx.window.POG && dCtx.window.POG.content && dCtx.window.POG.content.DIALOGUE;

check(!!DG_BANK && Array.isArray(DG_BANK.it) && DG_BANK.it.length === 12 && Array.isArray(DG_BANK.en) && DG_BANK.en.length === 12,
  "content/dialogue.js defines 12 Italian and 12 English two-turn dialogue scripts");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { phone: 0, errand: 0, social: 0 };
  for (const item of DG_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    check(
      Array.isArray(item.opts) && item.opts.length === 3 &&
      Array.isArray(item.repairOpts) && item.repairOpts.length === 3 &&
      !!item.partner && !!item.followUp && !!item.cue &&
      !!item.fullDialogue && !!item.explanation,
      `dialogue (${lang}) ${item.id}: balanced 3 reply + 3 follow-up choices, cue, and fullDialogue`
    );
  }
  check(byLv[1] === 4 && byLv[2] === 4 && byLv[3] === 4,
    `dialogue (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
  check(byKind.phone === 4 && byKind.errand === 4 && byKind.social === 4,
    `dialogue (${lang}): evenly balanced across phone, errand, and social (4/4/4)`);
}

/* 2. Validate dialogue.js, aac.js repairCues, and clinical-brief.js adherence synthesis */
const store = {};
const spoken = [];
const nowMs = new Date("2026-11-20T10:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();

const ctx = {
  window: {
    POG: {
      content: { DIALOGUE: DG_BANK },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [
          { id: "s1", date: daysAgo(3), items: [{ game: "name", score: 1 }, { game: "seq", score: 1 }] }
        ],
        getScripts: () => [],
        getProfile: () => ({ name: "Arthur" }),
        header: () => "",
        render: () => {},
        go: () => {},
        screen: () => "dialogue",
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
vm.runInContext(read("js/dialogue.js"), ctx);
vm.runInContext(read("js/aac.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const dgApi = ctx.window.POG.dialogue;
const brApi = ctx.window.POG.brief;
const boardApi = ctx.window.POG.board;

check(Array.isArray(boardApi.repairCues()) && boardApi.repairCues().length === 3,
  "aac.js exposes 3 one-tap conversational repair cues");
ctx.window.POG.ext.actions["aac-repair"]({ getAttribute: () => "0" });
check(spoken.some((s) => /One moment/i.test(s)),
  "aac-repair speaks conversational floor-holding phrase with emoji stripped");

const drill = dgApi.buildDrill("en", 2, 3);
check(drill.length === 3 && drill.every((x) => x.lv === 2 && x.shuffledReply.length === 3 && x.shuffledRepair.length === 3),
  "dialogue.buildDrill prioritizes target level and keeps 3 reply & 3 repair choices");

store.dialogue_sessions = JSON.stringify([
  {
    id: "dg_cur",
    date: daysAgo(1),
    accuracy: 0.88,
    items: [
      { id: "dg_en_5", kind: "social", lv: 2, label: "Park chat", cleanBoth: true, hintUsed: false, score: 1, ms: 4100 },
      { id: "dg_en_6", kind: "errand", lv: 2, label: "Bakery scone", cleanBoth: true, hintUsed: false, score: 1, ms: 3800 },
      { id: "dg_en_7", kind: "phone", lv: 2, label: "Four o'clock", cleanBoth: false, hintUsed: true, score: 0.65, ms: 5900 }
    ]
  }
]);

const dp = dgApi.computeDialogueProfile(JSON.parse(store.dialogue_sessions));
check(dp.total === 3 && dp.cleanBoth === 2 && dp.byKind.social.ok === 1 && dp.byKind.phone.ok === 0,
  "computeDialogueProfile tracks clean two-turn dialogues and context breakdown");

const brief = brApi.buildBrief(30, nowMs);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.functional.cur === 88,
  "clinical-brief routes dialogue_sessions into Functional everyday communication domain");
check(brief.observations.some((o) => /Everyday dialogues: 2 of 3 two-turn exchanges handled cleanly on first pass/.test(o)),
  "clinical-brief surfaces everyday conversational repair highlight");
check(!!brief.adherence && brief.adherence.activeDays === 2 && brief.adherence.sessionCount === 2 && brief.adherence.itemCount === 5,
  "clinical-brief computeAdherenceSummary counts active days, sessions, and items across streams");

const plain = brApi.buildPlainTextBrief(brief, { name: "Arthur" });
check(/PRACTICE ACTIVITY: 2 active days · 2 sessions · 5 items/.test(plain),
  "plain-text clinical brief includes aggregated practice activity summary");

const thCloud = read("js/therapist-cloud.js");
check(!/dialogue_sessions/.test(thCloud),
  "therapist-cloud.js keeps dialogue_sessions strictly device-local");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All everyday dialogues, AAC repair cues & clinical adherence unit tests passed.");
