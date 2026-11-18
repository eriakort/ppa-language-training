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

/* 1. Content integrity across IT & EN for all 3 variant domains */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/variants.js"), cCtx);
const V = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.VARIANTS;
check(!!V, "content/variants.js defines window.POG.content.VARIANTS");

for (const lang of ["it", "en"]) {
  const sList = V.sentence[lang] || [];
  check(sList.length === 18 && [1, 2, 3].every((lv) => sList.filter((x) => x.lv === lv).length >= 5),
    `sentence (${lang}): 18 graded items across levels 1-3`);
  for (const it of sList) {
    check(Array.isArray(it.tokens) && it.tokens.length >= 3 && it.tokens.join(" ") === it.target,
      `sentence (${lang}) ${it.id}: tokens join cleanly to exact target sentence`);
    const overlap = (it.distractors || []).filter((d) => it.tokens.indexOf(d) >= 0);
    check(overlap.length === 0, `sentence (${lang}) ${it.id}: distractors do not duplicate target tokens`);
  }

  const mList = V.semantic[lang] || [];
  check(mList.length === 18 && ["odd", "assoc", "feat"].every((k) => mList.some((x) => x.kind === k)),
    `semantic (${lang}): 18 items covering odd-one-out, associations, and feature truth`);
  for (const it of mList) {
    check(!!it.prompt && !!it.hint && !!it.explanation, `semantic (${lang}) ${it.id}: has prompt, hint, and explanation`);
    if (it.kind === "feat") {
      check(typeof it.ans === "boolean" && !!it.anchor && !!it.statement, `semantic (${lang}) ${it.id}: valid feature judgment`);
    } else {
      check(Array.isArray(it.items) && it.items.length >= 3 && it.ans >= 0 && it.ans < it.items.length,
        `semantic (${lang}) ${it.id}: valid choice items and answer index`);
    }
  }

  const pList = V.soundspan[lang] || [];
  check(pList.length === 18 && ["pair", "syll", "span"].every((k) => pList.some((x) => x.kind === k)),
    `soundspan (${lang}): 18 items covering minimal pairs, syllable assembly, and phonological span`);
  for (const it of pList) {
    if (it.kind === "pair") {
      check(Array.isArray(it.items) && it.items[it.ans] && it.items[it.ans].w === it.targetWord && !!it.clue,
        `soundspan (${lang}) ${it.id}: minimal pair answer matches targetWord`);
    } else if (it.kind === "syll") {
      check(Array.isArray(it.syllables) && it.syllables.join("") === it.word,
        `soundspan (${lang}) ${it.id}: syllables join cleanly to ${it.word}`);
    } else if (it.kind === "span") {
      const words = (it.sequence || []).map((x) => x.w);
      check(words.length >= 2 && new Set(words).size === words.length,
        `soundspan (${lang}) ${it.id}: unique phonological span sequence`);
    }
  }
}

/* 2. Queue generation, scoring, focus weighting, and isolation guarantees */
const store = {};
const listeners = {};
const mCtx = {
  window: {
    POG: {
      content: { VARIANTS: V },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "it",
        esc: (s) => String(s),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        header: () => "<header></header>",
        render: () => {},
        go: () => {},
        screen: () => "home",
        t: () => ({ level: "Livello" }),
        isLocked: () => false,
        speak: () => {},
        stopVoice: () => {}
      }
    },
    addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); }
  },
  document: { addEventListener: () => {} },
  Date, Math, JSON, Object, Array
};
vm.createContext(mCtx);
vm.runInContext(read("js/variants.js"), mCtx);

const varApi = mCtx.window.POG.variants;
check(!!varApi && varApi.DOMAINS.length === 3, "js/variants.js exposes window.POG.variants with 3 domains");
check(mCtx.window.POG.ext.home.some((h) => h.act === "var-home"), "registers targeted practice home launcher");

const qNfv = varApi.buildQueue("guided", "nfv", { sentence: 1, semantic: 2, soundspan: 2 }, "it");
check(qNfv.length === 6 && qNfv.filter((s) => s.domain === "sentence").length === 3,
  "nfvPPA focus prioritizes sentence building (3 of 6 items)");

const qSv = varApi.buildQueue("guided", "sv", { sentence: 2, semantic: 1, soundspan: 2 }, "en");
check(qSv.length === 6 && qSv.filter((s) => s.domain === "semantic").length === 3,
  "svPPA focus prioritizes semantic links (3 of 6 items)");

const qLv = varApi.buildQueue("guided", "lv", { sentence: 2, semantic: 2, soundspan: 1 }, "en");
check(qLv.length === 6 && qLv.filter((s) => s.domain === "soundspan").length === 3,
  "lvPPA focus prioritizes sound & phonological span (3 of 6 items)");

const qSingle = varApi.buildQueue("semantic", "mixed", { semantic: 2 }, "it");
check(qSingle.length === 3 && new Set(qSingle.map((s) => s.data.kind)).size === 3,
  "single-domain 3-item semantic drill spans all 3 sub-paradigms (odd, assoc, feat)");

const qSoundSingle = varApi.buildQueue("soundspan", "mixed", { soundspan: 2 }, "en");
check(qSoundSingle.length === 3 && new Set(qSoundSingle.map((s) => s.data.kind)).size === 3,
  "single-domain 3-item soundspan drill spans all 3 sub-paradigms (pair, syll, span)");

check(varApi.scoreItem(true, 0).score === 1 && varApi.scoreItem(false, 0).score === 0.5 && varApi.scoreItem(true, 1).score === 0.5,
  "scoreItem distinguishes independent first-try (1.0) vs assisted/retried (0.5)");

/* Verify Supabase therapist progress allowlist remains strictly the original 9 games */
const thCloud = read("js/therapist-cloud.js");
check(thCloud.includes('PROGRESS_GAMES=["describe","mystery","crossword","name","wordbuild","script","read","echo","seq"]') ||
  thCloud.includes('PROGRESS_GAMES = ["describe","mystery","crossword","name","wordbuild","script","read","echo","seq"]'),
  "cloud therapist PROGRESS_GAMES allowlist stays untouched");

if (fail) process.exit(1);
console.log("All variant-targeted PPA unit tests passed.");
