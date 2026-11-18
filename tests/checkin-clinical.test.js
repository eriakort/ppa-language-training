#!/usr/bin/env node
/*
 * Unit checks for bilingual clinical check-in scoring (js/checkin-lexicon.js)
 * and longitudinal clinical/acoustic integration (js/progress.js).
 *
 *   node tests/checkin-clinical.test.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
let failures = 0;
const check = (ok, msg) => { console.log((ok ? "ok   " : "FAIL ") + msg); if (!ok) failures++; };

const ctx = { window: { POG: {} } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js/checkin-lexicon.js"), "utf8"), ctx);
const lex = ctx.window.POG.checkinLexicon;

/* ---- 1. Kitchen scene ICU scoring ---- */
const icuIt = lex.scoreIcu("it", "Una signora cucina la minestra vicino alla finestra, c'è il sole, un tavolo con pane caffè e mela, e il gatto beve il latte mentre il bambino guarda l'orologio.");
check(icuIt.total === 12 && icuIt.count === 12, "ICU Italian recognizes all 12 concepts (got " + icuIt.count + "/" + icuIt.total + ")");

const icuNear = lex.scoreIcu("it", "una cuca vicino al tavlo con il gatto");
check(icuNear.matched.includes("table") && icuNear.matched.includes("cat"), "ICU tolerates ASR near-matches like tavlo->tavolo");

const icuNoFalse = lex.scoreIcu("it", "minestra");
check(icuNoFalse.count === 1 && icuNoFalse.matched[0] === "pot", "ICU does not confuse rhyming words like minestra with finestra (got " + JSON.stringify(icuNoFalse.matched) + ")");

const icuEn = lex.scoreIcu("en", "The woman is cooking soup on the stove while the sun shines through the window and a boy looks at the cat drinking milk near bread and an apple.");
check(icuEn.count >= 9 && icuEn.matched.includes("cook") && icuEn.matched.includes("pot") && icuEn.matched.includes("child") && icuEn.matched.includes("milk"), "ICU English recognizes scene concepts (got " + icuEn.count + ")");
check(lex.scoreIcu("en", "").count === 0, "ICU empty transcript scores 0");

/* ---- 2. Animal fluency lexicon scoring ---- */
const stopIt = ["e", "ehm", "un", "una", "il", "la"];
const fluIt = lex.scoreAnimals("it", "cane gatto ehm cagnolino cavallo mucca sedia cane gatti tavolo", stopIt);
check(fluIt.count === 4, "Italian animal fluency collapses singular/plural & diminutives and excludes non-animals (got " + fluIt.count + ")");
check(fluIt.repeats === 3, "Italian animal fluency counts perseverations accurately (cagnolino, cane, gatti -> " + fluIt.repeats + ")");
check(fluIt.intrusions === 2, "Italian animal fluency counts non-animal intrusions (sedia, tavolo -> " + fluIt.intrusions + ")");

const stopEn = ["and", "the", "a", "um"];
const fluEn = lex.scoreAnimals("en", "dog um cat puppy horses lion car dogs fish", stopEn);
check(fluEn.count === 5 && fluEn.repeats === 2 && fluEn.intrusions === 1, "English animal fluency validates animals, repeats, and intrusions (got " + JSON.stringify(fluEn) + ")");

/* ---- 3. Order-aware sentence repetition ---- */
const repExact = lex.scoreRepetition("Domani andiamo al mercato.", "Domani andiamo al mercato");
check(repExact.score === 1 && repExact.coverage === 1 && repExact.order === 1, "exact repetition scores 1.00");

const repScrambled = lex.scoreRepetition("Domani andiamo al mercato.", "mercato al andiamo domani");
check(repScrambled.coverage === 1 && repScrambled.order < 1 && repScrambled.score < 1, "scrambled word order lowers repetition score despite full word coverage (" + JSON.stringify(repScrambled) + ")");

const repPartial = lex.scoreRepetition("La signora con il cappello rosso ha comprato il pane.", "la signora con il cappello ha comprato il pane");
check(repPartial.coverage < 1 && repPartial.score < 1 && repPartial.score > 0.7, "omitted word reduces coverage and composite score (" + JSON.stringify(repPartial) + ")");
check(lex.scoreRepetition("Il gatto dorme.", "").score === 0, "empty repetition scores 0");

/* ---- 4. Phonemic letter fluency ---- */
const letIt = lex.scoreLetterFluency("it", "F", "fiore finestra ehm fuoco fiore casa palla", stopIt);
check(letIt.letter === "F" && letIt.count === 3 && letIt.repeats === 1 && letIt.intrusions === 2, "Italian F-fluency validates F words, repeats, and intrusions (" + JSON.stringify(letIt) + ")");

const letEn = lex.scoreLetterFluency("en", "A", "apple and ant anchor apple dog", stopEn);
check(letEn.letter === "A" && letEn.count === 3 && letEn.repeats === 1 && letEn.intrusions === 1, "English A-fluency validates A words, repeats, and intrusions (" + JSON.stringify(letEn) + ")");

/* ---- 5. Progress integration & graceful handling of sparse fields ---- */
const store = {
  checkins: [
    { id: "k1", date: "2026-10-01T10:00:00Z", who: "solo", desc: { wpm: 95, icu: 8, icuPerMin: 11.2 }, naming: { correct: 8 }, flu: { count: 12, repeats: 1 }, letterFlu: { letter: "F", count: 8 }, rep: { avg: 0.9 } },
    { id: "k2", date: "2026-10-15T10:00:00Z", who: "solo", desc: { wpm: 102 }, naming: { correct: 9 }, flu: { count: 14 }, rep: { avg: 0.95 } }
  ]
};
const pCtx = {
  window: {
    POG: {
      ext: { screens: {}, actions: {}, home: [] },
      charts: { line: () => "<svg></svg>" },
      checkins: { list: () => store.checkins },
      appApi: {
        lang: () => "it",
        t: () => ({ game: { name: "Parole", echo: "Ripetizione" }, level: "Livello" }),
        esc: (s) => String(s),
        fill: (s, d) => Object.keys(d).reduce((a, k) => a.replace("{" + k + "}", d[k]), s),
        load: (k) => store[k] || null,
        save: (k, v) => { store[k] = v; },
        sessions: () => [],
        games: () => ["name", "echo"],
        maxLevels: () => ({ name: 4, echo: 3 }),
        therapistUnlocked: () => true,
        therapistView: () => "",
        go: () => {},
        render: () => {},
        screen: () => "home",
        flash: () => {},
        flashText: () => "",
        header: () => ""
      }
    },
    addEventListener: () => {}
  },
  document: { addEventListener: () => {} }
};
vm.createContext(pCtx);
vm.runInContext(fs.readFileSync(path.join(root, "js/stats.js"), "utf8"), pCtx);
vm.runInContext(fs.readFileSync(path.join(root, "js/progress.js"), "utf8"), pCtx);

const sum = pCtx.window.POG.progress.summarise({
  id: "s10",
  date: "2026-10-20T10:00:00Z",
  mode: "session",
  who: "solo",
  items: [
    { game: "name", lv: 1, result: "good", ms: 4000, meas: { onsetMs: 1100, wpm: 112, phonationRatio: 0.64, syllRate: 3.4, longPauses: 1 } },
    { game: "echo", lv: 1, result: "good", ms: 3000, meas: { onsetMs: 900, wpm: 120, phonationRatio: 0.72, syllRate: 4.0, longPauses: 0 } }
  ]
});
check(sum.g.name.phon === 0.64 && sum.g.name.syl === 3.4 && sum.g.name.lp === 1, "progress.summarise preserves phonation, syllRate, and longPauses");

const tbl = pCtx.window.POG.progress.compareTable({ aFrom: 0, aTo: Date.now() - 1e10, bFrom: Date.now() - 1e10, bTo: Date.now() + 86400000 }, "all");
check(tbl.includes("concetti cucina") && tbl.includes("fluenza per lettera") && tbl.includes("rapporto animali / lettera"), "progress compareTable surfaces new clinical check-in measures when present");

if (failures) { console.error(failures + " check(s) failed."); process.exit(1); }
console.log("All clinical check-in checks passed.");
