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

/* 1. Validate bilingual Morphosyntax Cloze bank */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/grammar.js"), cCtx);
const GR_BANK = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.GRAMMAR;

check(!!GR_BANK && Array.isArray(GR_BANK.it) && GR_BANK.it.length === 12 && Array.isArray(GR_BANK.en) && GR_BANK.en.length === 12,
  "content/grammar.js defines 12 Italian and 12 English morphosyntax cloze items");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { tense: 0, prep: 0, agreement: 0 };
  for (const item of GR_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    check(
      item.opts.length === 3 &&
      item.ans === 0 &&
      !!item.before &&
      !!item.after &&
      !!item.clue &&
      item.fullSentence.includes(item.opts[item.ans]),
      `grammar (${lang}) ${item.id}: valid 3-choice cloze, contrast hint, and fullSentence`
    );
  }
  check(byLv[1] === 4 && byLv[2] === 4 && byLv[3] === 4,
    `grammar (${lang}): balanced across levels 1-3 (4/4/4)`);
  check(byKind.tense === 4 && byKind.prep === 4 && byKind.agreement === 4,
    `grammar (${lang}): balanced across tense, prep, and agreement (4/4/4)`);
}

/* 2. Validate grammar.js, passport.js, and clinical-brief.js synthesis */
const store = {};
const nowMs = new Date("2026-11-19T10:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();

const ctx = {
  window: {
    POG: {
      content: { GRAMMAR: GR_BANK },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [],
        getProfile: () => ({ name: "Arthur" }),
        header: () => "",
        render: () => {},
        go: () => {},
        screen: () => "grammar",
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
  document: { getElementById: () => null, querySelectorAll: () => [] },
  setTimeout, clearTimeout, Date, Math, JSON, Object, Array
};
vm.createContext(ctx);
vm.runInContext(read("js/grammar.js"), ctx);
vm.runInContext(read("js/passport.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const grApi = ctx.window.POG.grammar;
const ppApi = ctx.window.POG.passport;
const brApi = ctx.window.POG.brief;

const drill = grApi.buildDrill("en", 1, 4);
check(drill.length === 4 && drill.every((x) => x.lv === 1 && x.shuffledOpts.filter((o) => o.ok).length === 1),
  "grammar.buildDrill prioritizes target level and preserves one valid cloze choice");

store.grammar_sessions = JSON.stringify([
  {
    id: "gr1",
    date: daysAgo(1),
    accuracy: 0.9,
    items: [
      { id: "gr_en_1", kind: "tense", firstTry: true, score: 1 },
      { id: "gr_en_3", kind: "prep", firstTry: false, score: 0.6 },
      { id: "gr_en_4", kind: "agreement", firstTry: true, score: 1 },
      { id: "gr_en_6", kind: "tense", firstTry: true, score: 1 }
    ]
  }
]);

const gp = grApi.computeGrammarProfile(JSON.parse(store.grammar_sessions));
check(gp.total === 4 && gp.firstTry === 3 && gp.byKind.tense.ok === 2 && gp.byKind.prep.n === 1 && gp.byKind.prep.ok === 0,
  "computeGrammarProfile aggregates total items, first-try accuracy, and tense/prep/agreement breakdown");

check(ctx.window.POG.ext.locked["passport-edit"] === 1,
  "passport-edit respects Patient Mode therapist lock while passport view stays freely accessible");

ppApi.saveCard({
  message: "Please give me extra time to reply.",
  strategies: ["extra_time", "two_choices", "invalid_key"],
  emergencyName: "Clare (wife)",
  emergencyPhone: "+44 7700 900111",
  medNote: "Carries printed clinic card"
});
const savedCard = ppApi.get();
check(
  savedCard.message === "Please give me extra time to reply." &&
  savedCard.strategies.join(",") === "extra_time,two_choices" &&
  savedCard.emergencyName === "Clare (wife)" &&
  savedCard.medNote === "Carries printed clinic card",
  "passport.saveCard validates strategies and stores fields strictly locally"
);

const brief = brApi.buildBrief(30, nowMs);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.syntax.cur === 90 && domByKey.syntax.curN === 1,
  "clinical-brief routes grammar cloze sessions into Morphosyntax & sentence building domain");
check(brief.observations.some((o) => /Morphosyntax & cloze: 3 of 4 clean first-try inflections\/relators/.test(o)),
  "clinical-brief surfaces tense/prep/agreement observation highlight");

const plain = brApi.buildPlainTextBrief(brief, { name: "Arthur" });
check(/COMMUNICATION SUPPORTS \(PASSPORT\):/.test(plain) && /extra response time/.test(plain) && /two-choice questions/.test(plain) && /Carries printed clinic card/.test(plain),
  "clinical-brief plain-text brief includes saved Communication Passport support preferences and medical note");

const thCloud = read("js/therapist-cloud.js");
check(!/grammar_sessions|passport_card/.test(thCloud),
  "therapist-cloud.js keeps grammar sessions and passport card strictly device-local");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All morphosyntax cloze & communication passport unit tests passed.");
