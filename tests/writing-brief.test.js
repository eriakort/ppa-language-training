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

/* 1. Validate bilingual Writing & CART content bank */
const cCtx = { window: {} };
vm.createContext(cCtx);
vm.runInContext(read("content/writing.js"), cCtx);
const WR_BANK = cCtx.window.POG && cCtx.window.POG.content && cCtx.window.POG.content.WRITING;

check(!!WR_BANK && Array.isArray(WR_BANK.it) && WR_BANK.it.length === 12,
  "content/writing.js defines 12 Italian writing/CART items");
check(!!WR_BANK && Array.isArray(WR_BANK.en) && WR_BANK.en.length === 12,
  "content/writing.js defines 12 English writing/CART items");

for (const lang of ["it", "en"]) {
  const items = WR_BANK[lang];
  const byLv = { 1: 0, 2: 0, 3: 0 }, byKind = { orth: 0, cart: 0, phrase: 0 };
  for (const it of items) {
    byLv[it.lv] = (byLv[it.lv] || 0) + 1;
    byKind[it.kind] = (byKind[it.kind] || 0) + 1;
    const joined = it.kind === "phrase" ? it.tiles.join(" ") : it.tiles.join("");
    check(joined === it.target,
      `writing (${lang}) ${it.id}: tiles reconstruct exact target ('${it.target}')`);
    check(!!it.prompt && !!it.clue && Array.isArray(it.phoneticSkeletons) && it.phoneticSkeletons.length >= 2,
      `writing (${lang}) ${it.id}: has prompt, clue, and phonetic error skeletons`);
  }
  check(byLv[1] === 4 && byLv[2] === 4 && byLv[3] === 4,
    `writing (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
  check(byKind.orth >= 3 && byKind.cart >= 3 && byKind.phrase >= 3,
    `writing (${lang}): covers orth, cart, and phrase tasks`);
}

/* 2. Validate writing.js classification, CART analytics, and adaptive level */
const store = {};
let unlocked = false;
const appCtx = {
  window: {
    POG: {
      content: { WRITING: WR_BANK },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "it",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => appCtx._streams.sessions,
        getProfile: () => ({ name: "Giulia" }),
        header: () => "",
        render: () => {},
        go: () => {},
        screen: () => "writing",
        t: () => ({ level: "Livello" }),
        speak: () => {},
        stopVoice: () => {},
        flash: () => {},
        flashText: () => "",
        therapistUnlocked: () => unlocked,
        therapistView: () => "PIN_REQUIRED"
      },
      checkins: { list: () => appCtx._streams.checkins },
      variants: { listSessions: () => appCtx._streams.variants },
      functional: { listSessions: () => appCtx._streams.functional },
      wordbank: {
        listSessions: () => appCtx._streams.wordbank,
        computeCueErrorProfile: () => ({
          totalCued: 10,
          cues: { independent: 4, semantic: 5, phonemic: 1, model: 0 },
          errs: { phonemic: 1, semantic: 2 },
          totalErrors: 3,
          helpfulCue: "semantic"
        })
      },
      carelog: {
        list: () => appCtx._streams.carelog,
        tagLabel: (k) => k
      },
      progress: {
        localAlerts: () => [{ m: { label: "Ability index" }, a: { last: [0.4, 0.4, 0.35] } }]
      }
    },
    addEventListener: () => {}
  },
  document: { getElementById: () => null },
  navigator: {},
  _streams: { sessions: [], checkins: [], variants: [], functional: [], wordbank: [], carelog: [] },
  Date, Math, JSON, Object, Array
};
vm.createContext(appCtx);
vm.runInContext(read("js/writing.js"), appCtx);
const wrApi = appCtx.window.POG.writing;

const drillIt = wrApi.buildDrill(2, "it");
check(drillIt.length === 4 && new Set(drillIt.map((x) => x.data.kind)).size === 3,
  "writing.buildDrill selects 4 balanced items covering orth, cart, and phrase");

const itemReceipt = WR_BANK.en.find((x) => x.target === "receipt");
const itemAcqua = WR_BANK.it.find((x) => x.target === "acqua");
const itemCuore = WR_BANK.it.find((x) => x.target === "cuore");

check(wrApi.classifyWritingAttempt("  RECEIPT ", itemReceipt).match === true,
  "classifyWritingAttempt ignores outer spaces and case for exact match");
check(wrApi.classifyWritingAttempt("receit", itemReceipt).errKind === "surface_phonetic",
  "classifyWritingAttempt flags 'receit' -> 'receipt' as surface_phonetic error");
check(wrApi.classifyWritingAttempt("aqua", itemAcqua).errKind === "surface_phonetic",
  "classifyWritingAttempt flags 'aqua' -> 'acqua' as surface_phonetic error");
check(wrApi.classifyWritingAttempt("qore", itemCuore).errKind === "surface_phonetic",
  "classifyWritingAttempt flags 'qore' -> 'cuore' via phonetic skeleton");
check(wrApi.classifyWritingAttempt("rec", itemReceipt).errKind === "omission",
  "classifyWritingAttempt flags severely truncated attempt as omission");

const profWr = wrApi.computeWritingProfile([
  {
    id: "w1",
    date: "2026-11-16T10:00:00Z",
    accuracy: 0.625,
    items: [
      { kind: "orth", result: "almost", score: 0.5, errKind: "surface_phonetic" },
      { kind: "orth", result: "good", score: 1, errKind: null },
      { kind: "cart", result: "almost", score: 0.5, errKind: null },
      { kind: "phrase", result: "almost", score: 0.5, errKind: "omission" }
    ]
  }
]);
check(profWr.total === 4 && profWr.independent === 1 && profWr.cartAssisted === 3 && profWr.errors.surface_phonetic === 1 && profWr.errors.omission === 1 && profWr.accuracy === 0.625,
  "computeWritingProfile computes accuracy, CART-assisted resolution, and error breakdown");

/* 3. Validate clinical-brief.js synthesis across all 6 streams & PIN protection */
vm.runInContext(read("js/clinical-brief.js"), appCtx);
const brApi = appCtx.window.POG.brief;
check(appCtx.window.POG.ext.screens.brief() === "PIN_REQUIRED",
  "clinical brief screen enforces therapist PIN when locked");

const nowMs = new Date("2026-11-18T12:00:00Z").getTime();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();

store.writing_sessions = JSON.stringify([
  { id: "wr1", date: daysAgo(2), accuracy: 0.75, items: [{ kind: "orth", result: "almost", score: 0.5, errKind: "surface_phonetic" }, { kind: "cart", result: "good", score: 1 }] },
  { id: "wr_old", date: daysAgo(45), accuracy: 0.5, items: [{ kind: "orth", result: "almost", score: 0.5, errKind: "surface_phonetic" }] }
]);
appCtx._streams = {
  sessions: [
    { id: "s_cur", date: daysAgo(3), mode: "session", who: "solo", items: [{ game: "name", score: 0.9 }, { game: "seq", score: 0.8 }, { game: "echo", score: 0.7 }, { game: "read", score: 0.9 }, { game: "script", score: 0.8 }] },
    { id: "s_prev", date: daysAgo(40), mode: "session", who: "solo", items: [{ game: "name", score: 0.6 }, { game: "seq", score: 0.7 }, { game: "echo", score: 0.7 }] }
  ],
  checkins: [
    { id: "c_cur", date: daysAgo(4), naming: { correct: 8 }, flu: { count: 14 }, letterFlu: { letter: "F", count: 5 }, rep: { avg: 0.85 }, desc: { icu: 9, icuTotal: 12 } }
  ],
  variants: [
    { id: "v_cur", date: daysAgo(5), items: [{ game: "sentence", score: 0.85 }, { game: "semantic", score: 0.9 }, { game: "soundspan", score: 0.75 }] }
  ],
  functional: [
    { id: "f_cur", date: daysAgo(6), items: [{ game: "functional", score: 0.8 }] }
  ],
  wordbank: [
    { id: "wb_cur", date: daysAgo(4), retentionRate: 0.8 }
  ],
  carelog: [
    { id: "cg_cur", date: daysAgo(2), fcIndex: 0.72, avgRating: 3.9, tags: ["strategy_helped", "tired"], note: "Usato il foglio scritto in farmacia." }
  ]
};

const brief30 = brApi.buildBrief(30, nowMs);
const domMap = {};
brief30.domains.forEach((d) => { domMap[d.key] = d; });

check(brief30.domains.length === 5 && brApi.DOMAIN_KEYS.join(",") === "lexical,syntax,speech,literacy,functional",
  "clinical-brief computes all 5 neurological PPA domains");
check(domMap.lexical.cur > domMap.lexical.prev && domMap.lexical.status === "up",
  "clinical-brief detects improvement between prior and current 30-day lexical score");
check(domMap.literacy.cur != null && domMap.syntax.cur != null && domMap.speech.cur != null && domMap.functional.cur != null,
  "clinical-brief synthesizes syntax, speech, literacy (incl. CART), and functional domains");

const brief7 = brApi.buildBrief(7, nowMs);
const brief90 = brApi.buildBrief(90, nowMs);
check(brief7.domains.find((d) => d.key === "lexical").prev === null && brief90.domains.find((d) => d.key === "lexical").prev === null,
  "window selection (7d / 90d) correctly shifts window boundary relative to 40-day-old prior session");

check(brief30.observations.some((o) => /14.*5|2\.8/.test(o)),
  "pattern observations surface animal vs letter fluency divergence (14 vs 5)");
check(brief30.observations.some((o) => /semantic/i.test(o)),
  "pattern observations detect semantic vs phonemic cue responsiveness");
check(brief30.observations.some((o) => /CART|fonetici|surface/i.test(o)),
  "pattern observations report writing/CART surface-phonetic dysgraphia trend");
check(brief30.observations.some((o) => /strategy_helped/.test(o)),
  "pattern observations include frequent caregiver context tags");

const plain = brApi.buildPlainTextBrief(brief30, { name: "Giulia" });
check(/Giulia/.test(plain) && /Usato il foglio scritto in farmacia/.test(plain) && /Lessico/.test(plain),
  "buildPlainTextBrief formats complete clinician visit note with profile, 5 domains, and caregiver note");

const svg = brApi.renderDomainSvg(brief30.domains, { chartTitle: "Test Chart", legendCur: "Cur", legendPrev: "Prev" });
check(svg.includes('<svg class="br-svg"') && !svg.includes("mini-chart"),
  "renderDomainSvg generates accessible SVG trajectory chart using isolated br-svg class");

/* 4. Privacy & Report Invariant Checks */
const thCloud = read("js/therapist-cloud.js");
check(!thCloud.includes("writing_sessions") && !thCloud.includes("writing_level"),
  "therapist-cloud.js never reads or uploads local writing_sessions");

const reportSrc = read("js/report.js");
check((reportSrc.match(/charts\.line/g) || []).length === 4,
  "report.js preserves exact 4 charts.line graphs inside printable summary");

if (fail) process.exit(1);
console.log("All writing, CART & clinical-brief unit tests passed.");
