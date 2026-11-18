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

/* 1. Validate functional reading content bank across IT & EN */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/functional.js"), cCtx);
const FN = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.FUNCTIONAL;
check(!!FN, "content/functional.js defines window.POG.content.FUNCTIONAL");

for (const lang of ["it", "en"]) {
  const list = FN[lang] || [];
  check(list.length === 12 && [1, 2, 3].every((lv) => list.filter((x) => x.lv === lv).length === 4),
    `functional (${lang}): 12 items evenly balanced across levels 1-3`);
  for (const it of list) {
    check(!!it.title && !!it.passage && !!it.question && !!it.explanation,
      `functional (${lang}) ${it.id}: complete passage, question, and explanation`);
    check(it.passage.indexOf(it.highlight) >= 0,
      `functional (${lang}) ${it.id}: exact highlight phrase exists inside passage`);
    check(Array.isArray(it.choices) && it.choices.length >= 3 && it.ans >= 0 && it.ans < it.choices.length,
      `functional (${lang}) ${it.id}: valid choices and answer index`);
  }
}

/* 2. Validate js/functional.js highlighting escaping, drill generation & adaptive state */
const store = {};
const fCtx = {
  window: {
    POG: {
      content: { FUNCTIONAL: FN },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "it",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        header: () => "",
        render: () => {},
        go: () => {},
        screen: () => "functional",
        t: () => ({ level: "Livello" }),
        speak: () => {},
        stopVoice: () => {}
      }
    },
    addEventListener: () => {}
  },
  document: { getElementById: () => null },
  Date, Math, JSON, Object, Array
};
vm.createContext(fCtx);
vm.runInContext(read("js/functional.js"), fCtx);
const fnApi = fCtx.window.POG.functional;
check(!!fnApi && fnApi.level() === 2, "js/functional.js defaults to standard level 2");
const drillIt = fnApi.buildDrill(1, "it");
check(drillIt.length === 3 && drillIt.every((d) => d.lv === 1), "buildDrill(1, 'it') selects 3 level-1 scenarios");
const escaped = fnApi.highlightPassage("Nota <script>alert(1)</script> stanza 204", "stanza 204");
check(!escaped.includes("<script>") && escaped.includes('<mark class="fn-mark">stanza 204</mark>'),
  "highlightPassage safely HTML-escapes passage text before wrapping highlight");

/* 3. Validate js/carelog.js PIN gating, score computation, and privacy guarantees */
const cgStore = {};
const cgCtx = {
  window: {
    POG: {
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s),
        load: (k) => (k in cgStore ? JSON.parse(cgStore[k]) : null),
        save: (k, v) => { cgStore[k] = JSON.stringify(v); },
        header: () => "",
        render: () => {},
        go: () => {},
        screen: () => "carelog",
        flash: () => {},
        flashText: () => "",
        therapistUnlocked: () => false,
        therapistView: () => "PIN_SCREEN"
      }
    },
    addEventListener: () => {}
  },
  document: { getElementById: () => null },
  Date, Math, JSON, Object, Array
};
vm.createContext(cgCtx);
vm.runInContext(read("js/carelog.js"), cgCtx);
const cgApi = cgCtx.window.POG.carelog;
check(!!cgApi && cgApi.DOMAINS.length === 6 && cgApi.TAGS.length === 6,
  "js/carelog.js exposes 6 functional domains and 6 context tags");
check(cgCtx.window.POG.ext.screens.carelog() === "PIN_SCREEN",
  "carelog screen enforces therapist/caregiver PIN when locked");

const scMax = cgApi.computeScores({ wordFind: 5, understand: 5, clarity: 5, readWrite: 5, aids: 5, confidence: 5 });
const scMin = cgApi.computeScores({ wordFind: 1, understand: 1, clarity: 1, readWrite: 1, aids: 1, confidence: 1 });
const scMid = cgApi.computeScores({ wordFind: 3, understand: 3, clarity: 3, readWrite: 3, aids: 3, confidence: 3 });
check(scMax.fcIndex === 1 && scMin.fcIndex === 0 && scMid.fcIndex === 0.5,
  "computeScores normalizes 1-5 domain ratings accurately to 0.0-1.0 fcIndex");
check(cgApi.computeScores({ wordFind: 5 }) === null,
  "computeScores rejects incomplete domain rating maps");

/* Verify cloud telemetry files never reference caregiver_logs or functional_sessions */
const thCloud = read("js/therapist-cloud.js");
check(!thCloud.includes("caregiver_logs") && !thCloud.includes("functional_sessions"),
  "therapist-cloud.js never accesses device-local caregiver logs or functional reading text");

if (fail) process.exit(1);
console.log("All functional reading & caregiver log unit tests passed.");
