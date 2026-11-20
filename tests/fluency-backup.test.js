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

/* 1. Validate bilingual Scaffolded Word-Finding & Category Sprint content bank */
const fCtx = { window: {} };
vm.createContext(fCtx);
vm.runInContext(read("content/fluency.js"), fCtx);
const FLU_BANK = fCtx.window.POG && fCtx.window.POG.content && fCtx.window.POG.content.FLUENCY;

check(!!FLU_BANK && Array.isArray(FLU_BANK.it) && FLU_BANK.it.length === 9 && Array.isArray(FLU_BANK.en) && FLU_BANK.en.length === 9,
  "content/fluency.js defines 9 Italian and 9 English word-finding sprint prompts");

for (const lang of ["it", "en"]) {
  const byLv = { 1: 0, 2: 0, 3: 0 };
  const byKind = { category: 0, letter: 0, situation: 0 };
  const seenIds = new Set();
  for (const item of FLU_BANK[lang]) {
    byLv[item.lv] = (byLv[item.lv] || 0) + 1;
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    check(
      !seenIds.has(item.id) &&
      !!item.pic && !!item.title && !!item.prompt && item.targetCount >= 5 &&
      !!item.cue && !!item.tip &&
      Array.isArray(item.subgroups) && item.subgroups.length === 3 &&
      item.subgroups.every((sg) => !!sg.name && Array.isArray(sg.words) && sg.words.length === 3),
      `fluency (${lang}) ${item.id}: balanced fields + 3 cluster subgroups of 3 starter words`
    );
    seenIds.add(item.id);
  }
  check(byLv[1] === 3 && byLv[2] === 3 && byLv[3] === 3,
    `fluency (${lang}): evenly balanced across levels 1-3 (3/3/3)`);
  check(byKind.category === 3 && byKind.letter === 3 && byKind.situation === 3,
    `fluency (${lang}): evenly balanced across category, letter, and situation (3/3/3)`);
}

/* 2. Validate js/fluency.js, js/variants.js hub filter, and js/clinical-brief.js integration */
const vContentCtx = { window: {} };
vm.createContext(vContentCtx);
vm.runInContext(read("content/variants.js"), vContentCtx);

const store = {};
const nowMs = Date.now();
const daysAgo = (d) => new Date(nowMs - d * 86400000).toISOString();
let currentScreen = "home";

const ctx = {
  window: {
    POG: {
      content: { FLUENCY: FLU_BANK, VARIANTS: vContentCtx.window.POG.content.VARIANTS },
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      grammar: { label: () => "Grammar", lvTag: () => "Level 2", desc: () => "Morphosyntax" },
      numbers: { label: () => "Numbers", lvTag: () => "Level 2", desc: () => "Times & prices" },
      appApi: {
        lang: () => "en",
        esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
        fill: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]),
        load: (k) => (k in store ? JSON.parse(store[k]) : null),
        save: (k, v) => { store[k] = JSON.stringify(v); },
        sessions: () => [
          { id: "s1", date: daysAgo(2), items: [{ game: "name", score: 0.9 }] }
        ],
        getScripts: () => [],
        getProfile: () => ({ name: "Arthur" }),
        header: () => "",
        render: () => {},
        go: (s) => { currentScreen = s; },
        screen: () => currentScreen,
        t: () => ({ level: "Level", home: "Home" }),
        isLocked: () => false,
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
vm.runInContext(read("js/fluency.js"), ctx);
vm.runInContext(read("js/variants.js"), ctx);
vm.runInContext(read("js/clinical-brief.js"), ctx);

const flApi = ctx.window.POG.fluency;
const brApi = ctx.window.POG.brief;
const A = ctx.window.POG.ext.actions;

check(flApi.normalizeWord("  Café!! ") === "cafe" && flApi.normalizeWord("APPLE") === "apple",
  "fluency.normalizeWord trims punctuation, folds accents, and lowercases cleanly");

const drill = flApi.buildDrill("en", 2, 2);
check(drill.length === 2 && drill.every((d) => d.lv === 2) && drill[0].kind !== drill[1].kind,
  "fluency.buildDrill builds a 2-prompt multi-kind drill prioritized by level");

/* Hub filter checks */
const allHtml = ctx.window.POG.ext.screens.variants();
check(/data-act="var-filter" data-f="all" aria-pressed="true"/.test(allHtml) &&
  /data-act="flu-home"/.test(allHtml) && /data-act="num-home"/.test(allHtml),
  "targeted hub defaults to All filter and displays fluency and daily cards together");

A["var-filter"]({ getAttribute: () => "daily" });
const dailyHtml = ctx.window.POG.ext.screens.variants();
check(/data-act="num-home"/.test(dailyHtml) && !/data-act="gram-home"/.test(dailyHtml),
  "targeted hub Everyday life filter shows daily cards and hides grammar-only card");

A["var-filter"]({ getAttribute: () => "all" });

/* Interactive 2-prompt fluency sprint */
let fakeDraft = "";
ctx.document.getElementById = (id) => (id === "fl-input" ? { value: fakeDraft, focus: () => {} } : null);

A["flu-home"]();
check(currentScreen === "fluency", "flu-home navigates to fluency screen");

/* Prompt 1: independent typed words + duplicate rejection + spoken tally */
fakeDraft = "Apple"; A["fl-add"]();
fakeDraft = "apple"; A["fl-add"](); // duplicate ignored
fakeDraft = "Bread"; A["fl-add"]();
for (let i = 0; i < 4; i++) A["fl-tally"]();
A["fl-next"]();

/* Prompt 2: open a cluster scaffold + tap starter chip + spoken tally */
A["fl-scaffold"]();
const step2Html = ctx.window.POG.ext.screens.fluency();
check(/fl-cluster/.test(step2Html) && /data-act="fl-chip"/.test(step2Html),
  "fl-scaffold reveals a subcategory cluster with clickable starter word chips");
const firstChip = (step2Html.match(/data-act="fl-chip" data-w="([^"]+)"/) || [])[1];
check(!!firstChip, "rendered cluster includes starter word chip");
A["fl-chip"]({ getAttribute: () => firstChip });
A["fl-tally"]();
A["fl-next"]();

const flSaved = JSON.parse(store.fluency_sessions || "[]");
check(flSaved.length === 1 && flSaved[0].items.length === 2,
  "completed 2-prompt fluency sprint persists locally in fluency_sessions");
check(flSaved[0].items[0].repeats === 1 && flSaved[0].items[0].producedCount === 6 && flSaved[0].items[0].independent === true,
  "fluency sprint deduplicates repeated words, totals typed+spoken production, and marks uncued trial");
check(flSaved[0].items[1].scaffoldsUsed === 1 && flSaved[0].items[1].chipTaps === 1 && flSaved[0].items[1].independent === false,
  "fluency sprint records cluster scaffold and starter chip reliance accurately");

const flProf = flApi.computeFluencyProfile(flSaved);
check(flProf.total === 2 && flProf.repeats === 1 && flProf.independentRate === 0.5 && flProf.avgProduced === 4,
  "computeFluencyProfile summarizes mean production, repeats, and independent rate");

/* Clinical brief lexical routing + observation */
const brief = brApi.buildBrief(30, Date.now() + 1000);
const domByKey = Object.fromEntries(brief.domains.map((d) => [d.key, d]));
check(domByKey.lexical.cur != null && domByKey.lexical.curN >= 2,
  "clinical-brief routes fluency_sessions into Lexical retrieval & semantics");
check(brief.observations.some((o) => /Word-finding sprint: average 4 words across 2 prompts \(50% uncued/.test(o)),
  "clinical-brief outputs Word-finding sprint clinical observation");

const thCloud = read("js/therapist-cloud.js");
check(!/fluency_sessions/.test(thCloud) && !/fluency_level/.test(thCloud),
  "therapist-cloud.js keeps fluency_sessions and fluency_level strictly device-local");

/* 3. Validate Offline Portable Local Profile Backup & Validated JSON Restore in js/app.js */
const lsMap = new Map([
  ["pog_lang", JSON.stringify("en")],
  ["pog_active_profile_id", "lp-orig"],
  ["pog_profiles", JSON.stringify([{ id: "lp-orig", name: "Alice" }])],
  ["pog_p_lp-orig_profile", JSON.stringify({ name: "Alice", year: 1954, interests: ["kitchen"] })],
  ["pog_p_lp-orig_settings", JSON.stringify({ auto: true, patientMode: false })],
  ["pog_p_lp-orig_pin", JSON.stringify("secret-pin-hash")],
  ["pog_p_lp-orig_sessions", JSON.stringify([{ id: "s-core", mode: "session", who: "solo", date: daysAgo(1), items: [] }])],
  ["pog_p_lp-orig_fluency_sessions", JSON.stringify(flSaved)],
  ["pog_p_lp-orig_passport_card", JSON.stringify({ emergencyName: "Dan", medNote: "Large print" })],
  ["pog_p_lp-orig_brief_visit_note", JSON.stringify("Bring spectacles")],
  ["pog_p_lp-orig_theme", JSON.stringify({ mode: "light", palette: "forest" })],
  ["pog_cloud_profile_lp-orig", "cloud-uuid-should-not-export"]
]);
const ssMap = new Map();
const makeStorage = (m) => ({
  get length() { return m.size; },
  key: (i) => Array.from(m.keys())[i] ?? null,
  getItem: (k) => (m.has(k) ? m.get(k) : null),
  setItem: (k, v) => m.set(String(k), String(v)),
  removeItem: (k) => m.delete(String(k))
});

const appEl = { innerHTML: "", contains: () => false, addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [] };
const appCtx = {
  window: {
    POG: {
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      createSpeech: () => ({ canSpeak: false, canListen: false, preferHost: false, speak: () => {}, stopSpeak: () => {}, listen: () => {}, stopListen: () => {} }),
      createRecorder: () => ({ supported: false, start: () => Promise.resolve(), stop: () => Promise.resolve(null), cancel: () => {} }),
      recordings: { retentionDays: 30, assignLegacy: () => Promise.resolve(0), clear: () => Promise.resolve(), purge: () => Promise.resolve(0), list: () => Promise.resolve([]) },
      albumStore: { clear: () => Promise.resolve() }
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

const appApi = appCtx.window.POG.appApi;
const backup = appApi.buildLocalProfileBackup("lp-orig");
check(backup && backup.format === "pog-local-backup" && backup.version === 1 && backup.profileName === "Alice",
  "buildLocalProfileBackup creates versioned JSON envelope for active local profile");
check(backup.data.fluency_sessions && backup.data.passport_card.emergencyName === "Dan" && backup.data.brief_visit_note === "Bring spectacles",
  "buildLocalProfileBackup includes targeted modules, passport card, and visit notes");
check(!("pin" in backup.data) && JSON.stringify(backup).indexOf("secret-pin-hash") < 0 && JSON.stringify(backup).indexOf("cloud-uuid") < 0,
  "buildLocalProfileBackup strictly excludes PIN hash and pog_cloud_* state");

/* Reject invalid backups */
check(!appApi.importLocalProfileBackup("not-json").ok && !appApi.importLocalProfileBackup({ format: "bad", data: {} }).ok,
  "importLocalProfileBackup rejects malformed JSON and invalid envelopes cleanly");

/* Restore backup with injected forbidden keys -> verify new ID created, sibling intact, forbidden keys dropped */
const injected = JSON.parse(JSON.stringify(backup));
injected.data.pin = "injected-pin-hash";
injected.data.unknown_key = "evil";
injected.data.pog_cloud_profile_lp = "bad-cloud";

const res = appApi.importLocalProfileBackup(JSON.stringify(injected));
check(res.ok && res.profileId && res.profileId !== "lp-orig" && res.ignoredKeys === 3 && res.importedKeys >= 6,
  "importLocalProfileBackup restores allowlisted sections into a fresh local profile ID and drops unknown/PIN keys");
check(lsMap.has("pog_p_lp-orig_profile") && JSON.parse(lsMap.get("pog_profiles")).length === 2,
  "importLocalProfileBackup preserves existing sibling profiles without overwriting");
check(!lsMap.has("pog_p_" + res.profileId + "_pin") && !lsMap.has("pog_p_" + res.profileId + "_unknown_key"),
  "importLocalProfileBackup never writes PIN or unknown keys to restored profile storage");
check(JSON.parse(lsMap.get("pog_p_" + res.profileId + "_passport_card")).emergencyName === "Dan" &&
  JSON.parse(lsMap.get("pog_p_" + res.profileId + "_fluency_sessions")).length === 1,
  "restored profile retains full targeted module history and passport data");

if (fail) { console.error(fail + " check(s) failed."); process.exit(1); }
console.log("All word-finding sprint, hub filter, and offline backup/restore unit tests passed.");
