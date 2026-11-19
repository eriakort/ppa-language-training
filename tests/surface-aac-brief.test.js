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

/* 1. Validate bilingual Surface Dyslexia & Homophone Reading bank */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/surface.js"), cCtx);
const SF_BANK = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.SURFACE;

check(!!SF_BANK && Array.isArray(SF_BANK.it) && SF_BANK.it.length === 12 && Array.isArray(SF_BANK.en) && SF_BANK.en.length === 12,
  "content/surface.js defines 12 Italian and 12 English surface-reading / homophone items");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { exception: 0, homophone: 0 };
  for (const item of SF_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    check(
      item.opts.length === 3 &&
      item.ans === 0 &&
      Array.isArray(item.foilTypes) &&
      item.foilTypes.length === 3 &&
      item.sentence.includes("_____") &&
      !!item.clue &&
      item.fullSentence.includes(item.targetWord),
      `surface (${lang}) ${item.id}: valid 3-choice contrast, foil taxonomy, cloze blank, and fullSentence`
    );
  }
  check(byLv[1] === 4 && byLv[2] === 4 && byLv[3] === 4,
    `surface (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
  check(byKind.exception === 6 && byKind.homophone === 6,
    `surface (${lang}): evenly balanced across exception words and homophones (6/6)`);
}

/* 2. Validate surface.js, aac.js quick-packs, and clinical-brief.js latency + surface insights */
const store = {};
const nowMs = new Date("2026-11-19T10:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();

const ctx = {
  window: {
    POG: {
      content: { SURFACE: SF_BANK },
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
        screen: () => "surface",
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
vm.runInContext(read("js/surface.js"), ctx);
vm.runInContext(read("js/aac.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const sfApi = ctx.window.POG.surface;
const brApi = ctx.window.POG.brief;
const boardApi = ctx.window.POG.board;

check(Array.isArray(boardApi.contextTabs()) && boardApi.contextTabs().includes("clinic") && boardApi.contextTabs().includes("shop"),
  "aac.js registers clinic and shop contextual quick-pack tabs");

const drill = sfApi.buildDrill("en", 1, 4);
check(drill.length === 4 && drill.every((x) => x.lv === 1 && x.shuffledOpts.filter((o) => o.ok).length === 1),
  "surface.buildDrill prioritizes target level and keeps valid target option");

store.surface_sessions = JSON.stringify([
  {
    id: "sr_prev",
    date: daysAgo(40),
    accuracy: 0.9,
    items: [
      { id: "sf_en_1", kind: "exception", firstTry: true, errType: null, score: 1, ms: 2100 },
      { id: "sf_en_2", kind: "exception", firstTry: true, errType: null, score: 1, ms: 2200 },
      { id: "sf_en_3", kind: "homophone", firstTry: false, errType: "homophone", score: 0.6, ms: 2500 }
    ]
  },
  {
    id: "sr_cur",
    date: daysAgo(2),
    accuracy: 0.8,
    items: [
      { id: "sf_en_1", kind: "exception", firstTry: true, errType: null, score: 1, ms: 5400 },
      { id: "sf_en_2", kind: "exception", firstTry: false, errType: "regularized", score: 0.6, ms: 6100 },
      { id: "sf_en_3", kind: "homophone", firstTry: false, errType: "homophone", score: 0.6, ms: 5800 },
      { id: "sf_en_4", kind: "exception", firstTry: true, errType: null, score: 1, ms: 5200 }
    ]
  }
]);

const sp = sfApi.computeSurfaceProfile(JSON.parse(store.surface_sessions).slice(1));
check(sp.total === 4 && sp.firstTry === 2 && sp.errors.regularized === 1 && sp.errors.homophone === 1,
  "computeSurfaceProfile separates phonetic regularizations from homophone substitutions");

const brief = brApi.buildBrief(30, nowMs);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.literacy.cur === 80 && domByKey.literacy.prev === 90,
  "clinical-brief routes surface reading sessions into Literacy domain for Current vs Prior comparison");
check(brief.observations.some((o) => /Surface & irregular reading: 2 of 4 clean first-try matches/.test(o)),
  "clinical-brief surfaces regularization and homophone error profile");
check(brief.observations.some((o) => /Targeted response speed: median 5\.6 s per item \(\+3\.4 s slower vs prior window\)/.test(o)),
  "clinical-brief surfaces targeted module response-latency slowing across windows");

const thCloud = read("js/therapist-cloud.js");
check(!/surface_sessions/.test(thCloud),
  "therapist-cloud.js keeps surface reading sessions strictly device-local");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All surface reading, AAC quick-packs & clinical latency unit tests passed.");
