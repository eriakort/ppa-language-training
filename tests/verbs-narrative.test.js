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

/* 1. Validate bilingual VNeST Action-Verb & Narrative Retell content banks */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/verbs.js"), cCtx);
vm.runInContext(read("content/narrative.js"), cCtx);
const VB_BANK = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.VERBS;
const NR_BANK = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.NARRATIVE;

check(!!VB_BANK && Array.isArray(VB_BANK.it) && VB_BANK.it.length === 12 && Array.isArray(VB_BANK.en) && VB_BANK.en.length === 12,
  "content/verbs.js defines 12 Italian and 12 English everyday action-verb networks");
check(!!NR_BANK && Array.isArray(NR_BANK.it) && NR_BANK.it.length === 9 && Array.isArray(NR_BANK.en) && NR_BANK.en.length === 9,
  "content/narrative.js defines 9 Italian and 9 English 3-beat everyday stories");

for (const lang of ["it", "en"]) {
  const vLv = { 1: 0, 2: 0, 3: 0 }, nLv = { 1: 0, 2: 0, 3: 0 };
  let plausTrue = 0, plausFalse = 0;
  for (const item of VB_BANK[lang]) {
    vLv[item.lv] = (vLv[item.lv] || 0) + 1;
    const okAgents = item.agents.filter((a) => a.ok).length;
    const okPatients = item.patients.filter((p) => p.ok).length;
    if (item.plausibility.ok) plausTrue++; else plausFalse++;
    check(okAgents === 1 && item.agents.length === 3 && okPatients === 1 && item.patients.length === 3 && !!item.sentence && !!item.cue && typeof item.plausibility.ok === "boolean",
      `verbs (${lang}) ${item.id}: valid Agent/Patient options, functional sentence, cue, and plausibility rule`);
  }
  check(vLv[1] === 4 && vLv[2] === 4 && vLv[3] === 4,
    `verbs (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
  check(plausTrue >= 4 && plausFalse >= 4,
    `verbs (${lang}): balanced true and false plausibility checks (${plausTrue}T/${plausFalse}F)`);

  for (const st of NR_BANK[lang]) {
    nLv[st.lv] = (nLv[st.lv] || 0) + 1;
    const steps = st.beats.map((b) => b.step).join(",");
    const okSummaries = st.summaryChoices.filter((c) => c.ok).length;
    check(!!st.story && steps === "1,2,3" && st.concepts.length >= 4 && okSummaries === 1 && st.summaryChoices.length === 3,
      `narrative (${lang}) ${st.id}: complete story, 3 ordered beats, concepts, and 1 valid summary`);
  }
  check(nLv[1] === 3 && nLv[2] === 3 && nLv[3] === 3,
    `narrative (${lang}): evenly balanced across levels 1-3 (3/3/3)`);
}

/* 2. Validate verbs.js, narrative.js, and clinical-brief.js synthesis */
const store = {};
const nowMs = new Date("2026-11-19T10:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();

const ctx = {
  window: {
    POG: {
      content: { VERBS: VB_BANK, NARRATIVE: NR_BANK },
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
        screen: () => "verbs",
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
vm.runInContext(read("js/verbs.js"), ctx);
vm.runInContext(read("js/narrative.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const vbApi = ctx.window.POG.verbs;
const nrApi = ctx.window.POG.narrative;
const brApi = ctx.window.POG.brief;

const vDrill = vbApi.buildDrill("en", 1, 3);
const nDrill = nrApi.buildDrill("en", 2, 3);
check(vDrill.length === 3 && vDrill[0].lv === 1, "verbs.buildDrill prioritizes active level");
check(nDrill.length === 3 && nDrill.every((s) => s.shuffledBeats.length === 3), "narrative.buildDrill returns 3-beat stories");

const cov = nrApi.scoreConcepts("Arthur brings his card and medication to the clinic before picking up prescriptions", ["card", "medication", "clinic", "check", "prescription"]);
check(cov.matched === 4 && cov.total === 5 && Math.abs(cov.ratio - 0.8) < 0.01,
  "scoreConcepts performs inflection-tolerant main-concept ICU matching");

store.verbs_sessions = JSON.stringify([
  {
    id: "vb1",
    date: daysAgo(1),
    accuracy: 0.88,
    items: [
      { id: "vb_en_5", triadClean: true, plausClean: true, hintUsed: false, score: 1 },
      { id: "vb_en_6", triadClean: true, plausClean: false, hintUsed: false, score: 0.65 },
      { id: "vb_en_7", triadClean: false, plausClean: true, hintUsed: true, score: 0.65 }
    ]
  }
]);
store.narrative_sessions = JSON.stringify([
  {
    id: "nr1",
    date: daysAgo(1),
    accuracy: 0.85,
    items: [
      { id: "nr_en_4", seqFirstTry: true, anchorsUsed: false, conceptCoverage: 0.8, score: 0.9 },
      { id: "nr_en_5", seqFirstTry: false, anchorsUsed: true, conceptCoverage: 0.6, score: 0.6 },
      { id: "nr_en_6", seqFirstTry: true, anchorsUsed: false, conceptCoverage: 1, score: 1 }
    ]
  }
]);

const vp = vbApi.computeVerbsProfile(JSON.parse(store.verbs_sessions));
const np = nrApi.computeNarrativeProfile(JSON.parse(store.narrative_sessions));
check(vp.total === 3 && vp.triadClean === 2 && vp.plausClean === 2,
  "computeVerbsProfile accurately aggregates triad and plausibility integrity");
check(np.total === 3 && np.seqClean === 2 && np.anchorsUsed === 1 && Math.abs(np.meanConcepts - 0.8) < 0.01,
  "computeNarrativeProfile aggregates chronological sequence accuracy and main-concept coverage");

const brief = brApi.buildBrief(30, nowMs);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.syntax.cur === 88 && domByKey.lexical.cur === 88 && domByKey.functional.cur === 85,
  "clinical-brief routes VNeST into Syntax/Lexical and Narrative retell into Functional domain");
check(brief.observations.some((o) => /Verb networks \(VNeST\): 2 of 3 clean Agent-Verb-Object triads/.test(o)),
  "clinical-brief surfaces VNeST triad and plausibility insight");
check(brief.observations.some((o) => /Connected story retell: 2 of 3 sequenced cleanly on first pass; 80% main-concept coverage/.test(o)),
  "clinical-brief surfaces narrative sequencing and main-concept coverage insight");

const thCloud = read("js/therapist-cloud.js");
check(!/verbs_sessions|narrative_sessions/.test(thCloud),
  "therapist-cloud.js keeps VNeST verb and narrative retell sessions strictly device-local");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All VNeST verb & narrative retell unit tests passed.");
