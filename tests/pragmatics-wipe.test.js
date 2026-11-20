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

/* 1. Validate bilingual Conversational Pragmatics & Non-Literal Language bank */
const pCtx = { window: {} };
vm.createContext(pCtx);
vm.runInContext(read("content/pragmatics.js"), pCtx);
const PRAG_BANK = pCtx.window.POG && pCtx.window.POG.content && pCtx.window.POG.content.PRAGMATICS;

check(!!PRAG_BANK && Array.isArray(PRAG_BANK.it) && PRAG_BANK.it.length === 12 && Array.isArray(PRAG_BANK.en) && PRAG_BANK.en.length === 12,
  "content/pragmatics.js defines 12 Italian and 12 English non-literal language items");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { idiom: 0, indirect: 0, tone: 0 };
  const seenIds = new Set();
  for (const item of PRAG_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    check(
      !seenIds.has(item.id) &&
      Array.isArray(item.opts) && item.opts.length === 3 &&
      item.opts.every((o) => typeof o === "string" && o.trim().length > 0) &&
      !!item.pic && !!item.context && !!item.utterance && !!item.cue && !!item.explanation &&
      (item.errFocus === "literal_trap" || item.errFocus === "context_slip"),
      `pragmatics (${lang}) ${item.id}: 3 unique options, context, utterance, cue, errFocus, explanation`
    );
    seenIds.add(item.id);
  }
  check(byLv[1] === 4 && byLv[2] === 4 && byLv[3] === 4,
    `pragmatics (${lang}): evenly balanced across levels 1-3 (4/4/4)`);
  check(byKind.idiom === 4 && byKind.indirect === 4 && byKind.tone === 4,
    `pragmatics (${lang}): evenly balanced across idiom, indirect, and tone (4/4/4)`);
}

/* 2. Validate js/pragmatics.js drill builder, literal_trap vs context_slip error attribution & clinical-brief synthesis */
const store = {};
const spoken = [];
const nowMs = Date.now();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();
let currentScreen = "home";

const ctx = {
  window: {
    POG: {
      content: { PRAGMATICS: PRAG_BANK },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [
          { id: "s1", date: daysAgo(3), items: [{ game: "name", score: 0.9 }, { game: "script", score: 0.85 }] }
        ],
        getScripts: () => [],
        getProfile: () => ({ name: "Arthur" }),
        header: () => "",
        render: () => {},
        go: (s) => { currentScreen = s; },
        screen: () => currentScreen,
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
vm.runInContext(read("js/pragmatics.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const pgApi = ctx.window.POG.pragmatics;
const brApi = ctx.window.POG.brief;
const A = ctx.window.POG.ext.actions;

const drill = pgApi.buildDrill("en", 2, 3);
check(drill.length === 3 && drill.every((x) => x.lv === 2 && Array.isArray(x.shuffledOrder) && x.shuffledOrder.length === 3),
  "pragmatics.buildDrill prioritizes target level and builds 3-item mixed pragmatic queue");
check(pgApi.classifyErrorIdx(1) === "literal_trap" && pgApi.classifyErrorIdx(2) === "context_slip",
  "pragmatics error classifier distinguishes literal_trap (idx 1) vs context_slip (idx 2)");

A["prag-home"]();
check(currentScreen === "pragmatics", "prag-home navigates to pragmatics screen");
/* Item 1: hit literal trap (1) before solving (0) */
A["prag-pick"]({ getAttribute: () => "1" });
A["prag-pick"]({ getAttribute: () => "0" });
A["prag-next"]();
/* Item 2: solve cleanly on first try */
A["prag-pick"]({ getAttribute: () => "0" });
A["prag-next"]();
/* Item 3: hit context slip (2) before solving (0) */
A["prag-pick"]({ getAttribute: () => "2" });
A["prag-pick"]({ getAttribute: () => "0" });
A["prag-next"]();

const pgSaved = JSON.parse(store.pragmatics_sessions || "[]");
check(pgSaved.length === 1 && pgSaved[0].items.length === 3,
  "interactive pragmatics flow persists completed 3-item session locally");
const prof = pgApi.computePragmaticsProfile(pgSaved);
check(prof.total === 3 && prof.firstTry === 1 && prof.errors.literal_trap === 1 && prof.errors.context_slip === 1,
  "computePragmaticsProfile tracks firstTry and literal_trap / context_slip subtypes");

/* Dual domain routing + observations in clinical-brief.js */
const brief = brApi.buildBrief(30, Date.now() + 1000);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.lexical.cur != null && domByKey.functional.cur != null && domByKey.lexical.curN >= 2 && domByKey.functional.curN >= 2,
  "clinical-brief routes pragmatics_sessions into both Lexical/Semantics and Functional Everyday Communication domains");
check(brief.adherence.sessionCount === 2 && brief.adherence.itemCount === 5,
  "clinical-brief adherence counter includes pragmatics_sessions alongside core streams");
check(brief.observations.some((o) => /Non-literal & pragmatics: 1 of 3/.test(o) && /literal traps: 1, context slips: 1/.test(o)),
  "clinical-brief observations report Non-literal & pragmatics pattern and error subtypes");

/* Strict device-local privacy check */
const thCloud = read("js/therapist-cloud.js");
check(!/pragmatics_sessions/.test(thCloud) && !/pragmatics_level/.test(thCloud),
  "therapist-cloud.js keeps pragmatics_sessions and pragmatics_level strictly device-local");

/* 3 & 4. Validate albumStore.clear(profileId) and app.js wipeLocalProfileData(pid) */
(async () => {
  /* 3. IndexedDB mock for js/album-store.js */
  const albumRecords = [
    { id: "a1", profileId: "lp-a", kind: "person", name: "Anna" },
    { id: "a2", profileId: "lp-a", kind: "voice", name: "Hello" },
    { id: "b1", profileId: "lp-b", kind: "person", name: "Bruno" }
  ];
  const makeFakeIndexedDb = (recordsRef) => ({
    open: () => {
      const rq = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null };
      setTimeout(() => {
        rq.result = {
          transaction: () => {
            const tx = { oncomplete: null, onerror: null, onabort: null };
            const finishTx = () => setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
            tx.objectStore = () => ({
              getAll: () => {
                const gr = { result: recordsRef.slice(), onsuccess: null };
                setTimeout(() => { gr.onsuccess && gr.onsuccess(); finishTx(); }, 0);
                return gr;
              },
              put: (obj) => {
                const idx = recordsRef.findIndex((r) => r.id === obj.id);
                if (idx >= 0) recordsRef[idx] = obj; else recordsRef.push(obj);
                const pr = { result: obj.id };
                finishTx();
                return pr;
              },
              delete: (id) => {
                const idx = recordsRef.findIndex((r) => r.id === id);
                if (idx >= 0) recordsRef.splice(idx, 1);
                finishTx();
                return {};
              },
              clear: () => {
                recordsRef.length = 0;
                finishTx();
                return {};
              }
            });
            return tx;
          }
        };
        rq.onsuccess && rq.onsuccess();
      }, 0);
      return rq;
    }
  });

  const albCtx = {
    window: { POG: {}, indexedDB: makeFakeIndexedDb(albumRecords) },
    indexedDB: makeFakeIndexedDb(albumRecords),
    setTimeout, clearTimeout, Date, Math, Promise, Error
  };
  vm.createContext(albCtx);
  vm.runInContext(read("js/album-store.js"), albCtx);

  await albCtx.window.POG.albumStore.clear("lp-a");
  check(albumRecords.length === 1 && albumRecords[0].id === "b1" && albumRecords[0].profileId === "lp-b",
    "albumStore.clear(profileId) removes only that profile's IndexedDB album/voice items and keeps other profiles intact");

  /* 4. Full app.js wipeLocalProfileData(pid) multi-profile isolation test */
  const lsMap = new Map([
    ["pog_lang", JSON.stringify("en")],
    ["pog_active_profile_id", "lp-a"],
    ["pog_profiles", JSON.stringify([{ id: "lp-a", name: "Alice" }, { id: "lp-b", name: "Bob" }])],
    ["pog_p_lp-a_profile", JSON.stringify({ name: "Alice", interests: [] })],
    ["pog_p_lp-a_sessions", JSON.stringify([{ id: "s1", items: [] }])],
    ["pog_p_lp-a_history", JSON.stringify({ name: [{ lv: 1 }] })],
    ["pog_p_lp-a_settings", JSON.stringify({ auto: true })],
    ["pog_p_lp-a_pin", JSON.stringify("hash")],
    ["pog_p_lp-a_wordbank_deck", JSON.stringify([{ id: "wb1" }])],
    ["pog_p_lp-a_wordbank_sessions", JSON.stringify([{ id: "wbs1" }])],
    ["pog_p_lp-a_writing_sessions", JSON.stringify([{ id: "wr1" }])],
    ["pog_p_lp-a_caregiver_logs", JSON.stringify([{ id: "cg1" }])],
    ["pog_p_lp-a_functional_sessions", JSON.stringify([{ id: "fn1" }])],
    ["pog_p_lp-a_discourse_sessions", JSON.stringify([{ id: "dc1" }])],
    ["pog_p_lp-a_pacing_sessions", JSON.stringify([{ id: "pc1" }])],
    ["pog_p_lp-a_verbs_sessions", JSON.stringify([{ id: "vb1" }])],
    ["pog_p_lp-a_narrative_sessions", JSON.stringify([{ id: "nr1" }])],
    ["pog_p_lp-a_grammar_sessions", JSON.stringify([{ id: "gr1" }])],
    ["pog_p_lp-a_surface_sessions", JSON.stringify([{ id: "sr1" }])],
    ["pog_p_lp-a_circumlocution_sessions", JSON.stringify([{ id: "cr1" }])],
    ["pog_p_lp-a_numbers_sessions", JSON.stringify([{ id: "nm1" }])],
    ["pog_p_lp-a_dialogue_sessions", JSON.stringify([{ id: "dg1" }])],
    ["pog_p_lp-a_instructions_sessions", JSON.stringify([{ id: "inst1" }])],
    ["pog_p_lp-a_pragmatics_sessions", JSON.stringify([{ id: "pg1" }])],
    ["pog_p_lp-a_passport_card", JSON.stringify({ emergencyName: "Dan" })],
    ["pog_p_lp-a_brief_visit_note", JSON.stringify("Medication note")],
    ["pog_p_lp-a_board_phrases", JSON.stringify(["Help"])],
    ["pog_p_lp-a_active_session", JSON.stringify({ screen: "item" })],
    ["pog_cloud_profile_lp-a", "cloud-1"],
    ["pog_cloud_consent_lp-a", "1"],
    ["pog_cloud_revision_lp-a", "4"],
    ["pog_cloud_dirty_lp-a", "0"],
    ["pog_p_lp-b_profile", JSON.stringify({ name: "Bob", interests: [] })],
    ["pog_p_lp-b_sessions", JSON.stringify([{ id: "sb1", items: [] }])],
    ["pog_cloud_profile_lp-b", "cloud-2"]
  ]);
  const ssMap = new Map([["pog_ui", JSON.stringify({ p: "lp-a", s: "therapist" })]]);
  const makeStorage = (m) => ({
    get length() { return m.size; },
    key: (i) => Array.from(m.keys())[i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(String(k), String(v)),
    removeItem: (k) => m.delete(String(k))
  });

  const recsCleared = [];
  const albumCleared = [];
  const appEl = { innerHTML: "", contains: () => false, addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [] };
  const appCtx = {
    window: {
      POG: {
        ext: { screens: {}, actions: {}, locked: {}, home: [] },
        createSpeech: () => ({
          canSpeak: false, canListen: false, preferHost: false,
          speak: () => {}, stopSpeak: () => {}, listen: () => {}, stopListen: () => {}
        }),
        createRecorder: () => ({
          supported: false, start: () => Promise.resolve(), stop: () => Promise.resolve(null), cancel: () => {}
        }),
        recordings: {
          retentionDays: 30,
          assignLegacy: () => Promise.resolve(0),
          clear: (pid) => { recsCleared.push(pid); return Promise.resolve(); },
          purge: () => Promise.resolve(0),
          list: () => Promise.resolve([])
        },
        albumStore: {
          clear: (pid) => { albumCleared.push(pid); return Promise.resolve(); }
        }
      },
      addEventListener: () => {},
      dispatchEvent: () => {},
      scrollTo: () => {},
      matchMedia: () => ({ matches: false }),
      location: { hostname: "example.test", protocol: "https:" }
    },
    document: {
      documentElement: { lang: "en", setAttribute: () => {}, removeAttribute: () => {} },
      body: {},
      readyState: "complete",
      getElementById: (id) => (id === "app" ? appEl : null),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    localStorage: makeStorage(lsMap),
    sessionStorage: makeStorage(ssMap),
    navigator: {},
    CustomEvent: function (name, opts) { return { type: name, detail: opts && opts.detail }; },
    setTimeout, clearTimeout, Date, Math, JSON, Object, Array, Promise
  };
  vm.createContext(appCtx);
  vm.runInContext(read("js/strings.js"), appCtx);
  vm.runInContext(read("content/base.js"), appCtx);
  vm.runInContext(read("content/interests.js"), appCtx);
  vm.runInContext(read("js/app.js"), appCtx);

  const res = await appCtx.window.POG.appApi.wipeLocalProfileData("lp-a");
  const leftAKeys = Array.from(lsMap.keys()).filter((k) => k.indexOf("lp-a") >= 0);
  check(leftAKeys.length === 0 && res.clearedKeys >= 25,
    "wipeLocalProfileData deletes every pog_p_<id>_* and pog_cloud_*_<id> localStorage key (" + res.clearedKeys + " removed)");
  check(recsCleared[0] === "lp-a" && albumCleared[0] === "lp-a",
    "wipeLocalProfileData invokes IndexedDB clear(profileId) on both recordings and albumStore");
  check(lsMap.has("pog_p_lp-b_profile") && lsMap.has("pog_p_lp-b_sessions") && lsMap.has("pog_cloud_profile_lp-b") && lsMap.get("pog_active_profile_id") === "lp-b",
    "wipeLocalProfileData preserves sibling profile Bob (lp-b) and switches active profile cleanly");

  await appCtx.window.POG.appApi.wipeLocalProfileData("lp-b");
  check(!lsMap.has("pog_p_lp-b_profile") && !lsMap.has("pog_profiles") && !lsMap.has("pog_active_profile_id") && lsMap.has("pog_lang"),
    "wipeLocalProfileData removes pog_profiles & pog_active_profile_id when erasing last local profile while keeping language preference");

  if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
  console.log("All pragmatics & complete device-local profile wipe unit tests passed.");
})().catch((err) => { console.error(err); process.exit(1); });
