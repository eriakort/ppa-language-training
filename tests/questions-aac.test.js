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

/* 1. Validate bilingual Asking Clear Questions content bank */
const qCtx = { window: {} };
vm.createContext(qCtx);
vm.runInContext(read("content/questions.js"), qCtx);
const Q_BANK = qCtx.window.POG && qCtx.window.POG.content && qCtx.window.POG.content.QUESTIONS;

check(!!Q_BANK && Array.isArray(Q_BANK.it) && Q_BANK.it.length === 9 && Array.isArray(Q_BANK.en) && Q_BANK.en.length === 9,
  "content/questions.js defines 9 Italian and 9 English question formulation items");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { wh: 0, build: 0, clarify: 0 };
  const seenIds = new Set();
  for (const item of Q_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    let validShape = !seenIds.has(item.id) && !!item.icon && !!item.prompt && !!item.cue && !!item.explain && !!item.spoken;
    if (item.kind === "build") {
      validShape = validShape && !!item.situation && Array.isArray(item.tokens) && item.tokens.length >= 4 &&
        item.tokens.join(" ") === item.target;
    } else if (item.kind === "wh" || item.kind === "clarify") {
      validShape = validShape && Array.isArray(item.choices) && item.choices.length === 3 && item.ans === 0 &&
        Array.isArray(item.errTypes) && item.errTypes.length === 3;
      if (item.kind === "wh") validShape = validShape && !!item.whTag && !!item.situation;
      else validShape = validShape && !!item.heardMsg;
    } else {
      validShape = false;
    }
    check(validShape, `questions (${lang}) ${item.id}: valid fields, answer index, and metadata`);
    seenIds.add(item.id);
  }
  check(byLv[1] === 3 && byLv[2] === 3 && byLv[3] === 3,
    `questions (${lang}): evenly balanced across levels 1-3 (3/3/3)`);
  check(byKind.wh === 3 && byKind.build === 3 && byKind.clarify === 3,
    `questions (${lang}): evenly balanced across wh, build, and clarify (3/3/3)`);
}

/* 2. Validate js/questions.js drill, js/variants.js hub today-strip & badges, js/aac.js slow & recents, and clinical-brief routing */
const vContentCtx = { window: {} };
vm.createContext(vContentCtx);
vm.runInContext(read("content/variants.js"), vContentCtx);

const store = {};
const nowMs = Date.now();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();
let currentScreen = "home";
const listeners = {};
const spokenNormal = [];
const spokenSlow = [];

function SpeechSynthesisUtteranceMock(text) {
  this.text = text;
  this.lang = "en-US";
  this.rate = 1;
}

const ctx = {
  window: {
    SpeechSynthesisUtterance: SpeechSynthesisUtteranceMock,
    speechSynthesis: {
      cancel: () => {},
      speak: (u) => { spokenSlow.push({ text: u.text, rate: u.rate, lang: u.lang }); }
    },
    POG: {
      content: { QUESTIONS: Q_BANK, VARIANTS: vContentCtx.window.POG.content.VARIANTS },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      functional: { label: () => "Functional reading", lvTag: () => "Level 2", desc: () => "Notices", listSessions: () => [{ id: "fn1", date: daysAgo(0), items: [{ game: "functional", score: 1 }] }] },
      grammar: { label: () => "Grammar", lvTag: () => "Level 2", desc: () => "Morphosyntax", listSessions: () => [] },
      numbers: { label: () => "Numbers", lvTag: () => "Level 2", desc: () => "Times & prices", listSessions: () => [] },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [{ id: "s1", date: daysAgo(1), items: [{ game: "seq", score: 0.8 }] }],
        getScripts: () => [],
        getProfile: () => ({ name: "Clara" }),
        header: () => "",
        render: () => {},
        go: (s) => { currentScreen = s; },
        screen: () => currentScreen,
        t: () => ({ level: "Level", home: "Home" }),
        isLocked: () => false,
        speak: (txt) => { spokenNormal.push(txt); },
        stopVoice: () => {},
        flash: () => {},
        flashText: () => "",
        therapistUnlocked: () => true,
        therapistView: () => "PIN_REQUIRED",
        inHost: () => false
      }
    },
    addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); }
  },
  document: { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} },
  SpeechSynthesisUtterance: SpeechSynthesisUtteranceMock,
  setTimeout, clearTimeout, Date, Math, JSON, Object, Array
};
vm.createContext(ctx);
vm.runInContext(read("js/questions.js"), ctx);
vm.runInContext(read("js/variants.js"), ctx);
vm.runInContext(read("js/aac.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const qsApi = ctx.window.POG.questions;
const brApi = ctx.window.POG.brief;
const boardApi = ctx.window.POG.board;
const A = ctx.window.POG.ext.actions;

const drill = qsApi.buildDrill("en", 2, 3);
check(drill.length === 3 && drill.every((d) => d.lv === 2) &&
  new Set(drill.map((d) => d.kind)).size === 3,
  "questions.buildDrill returns a 3-item drill covering wh, build, and clarify at level 2");

const hubBefore = ctx.window.POG.ext.screens.variants();
check(/data-act="ques-home"/.test(hubBefore) && /var-today-strip/.test(hubBefore) && /Today: 1 completed/.test(hubBefore),
  "targeted hub shows universal Done-today summary strip (covering functional card too) before questions run");

A["ques-home"]();
check(currentScreen === "questions", "ques-home navigates to questions screen");

/* Walk through all 3 items cleanly, testing wrong pick on MC and progressive hint on build */
let sawBuild = false, sawChoice = false;
for (let stepIdx = 0; stepIdx < 3; stepIdx++) {
  const html = ctx.window.POG.ext.screens.questions();
  const item = Q_BANK.en.find((x) => html.includes(x.prompt));
  check(!!item, `questions step ${stepIdx + 1} renders recognizable prompt`);
  if (item.kind === "build") {
    sawBuild = true;
    /* Use progressive hint for every token to assemble cleanly (records hintUsed = true) */
    for (let tIdx = 0; tIdx < item.tokens.length; tIdx++) {
      A["ques-hint"]();
    }
    A["ques-check"]();
    const afterBuild = ctx.window.POG.ext.screens.questions();
    check(/var-feedback good/.test(afterBuild) && /data-act="ques-slow"/.test(afterBuild),
      "questions build item resolves via progressive hint & check and offers slow listen playback");
    A["ques-slow"]();
  } else {
    if (!sawChoice) {
      sawChoice = true;
      A["ques-pick"]({ getAttribute: () => "1" });
      const afterWrong = ctx.window.POG.ext.screens.questions();
      check(/nudge/.test(afterWrong) && /disabled/.test(afterWrong),
        "questions wrong pick dims distractor and shows supportive wh/clarify nudge");
    }
    A["ques-pick"]({ getAttribute: () => "0" });
    const afterRight = ctx.window.POG.ext.screens.questions();
    check(/var-feedback good/.test(afterRight),
      `questions ${item.kind} item resolves cleanly on target choice`);
  }
  A["ques-next"]();
}
check(sawBuild && sawChoice && spokenSlow.some((s) => s.rate < 0.85),
  "questions drill covers build + choice items and exercises slow speech playback");

const qsSaved = JSON.parse(store.questions_sessions || "[]");
check(qsSaved.length === 1 && qsSaved[0].items.length === 3 && qsSaved[0].accuracy > 0.5,
  "completed 3-item questions session persists locally in questions_sessions");

const qsProf = qsApi.computeQuestionsProfile(qsSaved);
check(qsProf.total === 3 && qsProf.firstTry === 1 && qsProf.hintUsed >= 1 &&
  qsProf.byKind.wh.n === 1 && qsProf.byKind.build.n === 1 && qsProf.byKind.clarify.n === 1,
  "computeQuestionsProfile tracks total, firstTry, hintUsed, and wh/build/clarify counts");

/* Verify Targeted Hub reflects Today: 2 completed */
const hubAfter = ctx.window.POG.ext.screens.variants();
check(/Today: 2 completed/.test(hubAfter),
  "targeted hub updates today summary badge cleanly after completing questions");

/* Verify Talk Board slow playback and recent phrases strip */
A.board();
ctx.window.POG.ext.screens.board();
A["aac-tile"]({ getAttribute: () => "0" }); // Yes
A["aac-tile"]({ getAttribute: () => "6" }); // I'm thirsty
A["aac-repair"]({ getAttribute: () => "1" }); // Could you repeat slowly?
A["aac-tile"]({ getAttribute: () => "6" }); // deduplicate I'm thirsty -> moves to front
const boardHtml = ctx.window.POG.ext.screens.board();
check(/data-act="aac-slow"/.test(boardHtml) && /aac-recents/.test(boardHtml) &&
  boardApi.recentPhrases().length === 3 && boardApi.recentPhrases()[0] === "I'm thirsty",
  "Talk Board renders Slow button and deduplicated 3-item recent phrases strip");

const slowBefore = spokenSlow.length;
A["aac-slow"]();
check(spokenSlow.length === slowBefore + 1 && spokenSlow[spokenSlow.length - 1].rate <= 0.8 &&
  spokenSlow[spokenSlow.length - 1].text === "I'm thirsty",
  "Talk Board Slow button speaks active phrase cleanly at ~0.76x rate");

A["aac-recent"]({ getAttribute: () => "2" });
check(boardApi.recentPhrases()[0] === "Yes", "tapping an item in Talk Board recents promotes and speaks it");

(listeners["pog:profile-change"] || []).forEach((fn) => fn());
check(boardApi.recentPhrases().length === 0, "Talk Board recents clear automatically on profile switch");

/* Verify clinical-brief routing */
const brief = brApi.buildBrief(30, Date.now() + 1000);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.syntax.cur != null && domByKey.functional.cur != null,
  "clinical-brief routes questions_sessions into Morphosyntax and Functional everyday communication");
check(brief.observations.some((o) => /Asking clear questions: 1 of 3 clean first passes/.test(o)),
  "clinical-brief outputs Asking clear questions longitudinal observation");

/* 3. Verify app.js, progress.js, report.js, sw.js / index.html, and therapist-cloud.js boundary */
const appSrc = read("js/app.js");
check(/"questions_level"/.test(appSrc) && /"questions_sessions"/.test(appSrc) &&
  /UI_FREE = .*questions: 1/.test(appSrc) && /"questions"/.test(appSrc),
  "js/app.js registers questions in UI_FREE, BACKUP_KEYS, and CSV export");

const thCloud = read("js/therapist-cloud.js");
check(!/questions_sessions/.test(thCloud) && !/questions_level/.test(thCloud),
  "therapist-cloud.js keeps questions_sessions and questions_level strictly device-local");

const progSrc = read("js/progress.js");
const repSrc = read("js/report.js");
check(/ques_ask/.test(progSrc) && /questionsSessions/.test(progSrc) && /var qsApi = window\.POG\.questions/.test(repSrc),
  "progress.js and report.js wire questions analytics and printable summary row");

const swSrc = read("sw.js");
const idxSrc = read("index.html");
check(/"pog-shell-v24"/.test(swSrc) && /"content\/questions\.js"/.test(swSrc) && /"js\/questions\.js"/.test(swSrc) &&
  /content\/questions\.js/.test(idxSrc) && /js\/questions\.js/.test(idxSrc),
  "index.html and sw.js include content/questions.js and js/questions.js and bump cache version");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All questions, targeted hub today-strip, and Talk Board slow/recents unit tests passed.");
