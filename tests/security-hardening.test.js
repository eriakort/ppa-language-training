#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

let fail = 0;
function check(ok, label) {
  if (!ok) {
    console.error("FAIL " + label);
    fail++;
  } else {
    console.log("ok   " + label);
  }
}

/* 1. Express static server allowlist */
const serverSrc = read("server.js");
check(
  !serverSrc.includes("express.static(__dirname") &&
    serverSrc.includes('for (const dir of ["css", "js", "content", "assets"])') &&
    serverSrc.includes('app.disable("x-powered-by")') &&
    serverSrc.includes('res.status(404).send("Not found")'),
  "server.js restricts static serving to public web directories and disables directory leakage"
);

/* 2. Worker secret constant-time verification */
const workerSrc = read("supabase/functions/profile-lifecycle-worker/index.ts");
check(
  workerSrc.includes("async function constantTimeEqual") &&
    workerSrc.includes('crypto.subtle.digest("SHA-256"') &&
    !workerSrc.includes("supplied !== expected"),
  "profile-lifecycle-worker verifies LIFECYCLE_WORKER_SECRET in constant time"
);

/* 3. Normalized origin check across Edge Functions */
for (const fn of ["profile-access", "access-codes", "stripe-billing"]) {
  const src = read(`supabase/functions/${fn}/index.ts`);
  check(
    src.includes("normalizedSiteOrigin") &&
      src.includes("const allowedOrigin = normalizedSiteOrigin;"),
    `${fn} normalizes APP_SITE_URL for CORS and origin comparison`
  );
}

/* 4. Stored XSS & photo URL scheme validation + strict backup envelope in app.js / aac.js / wordbank.js */
const lsMap = new Map([
  ["pog_lang", JSON.stringify("en")],
  ["pog_active_profile_id", "lp-1"],
  ["pog_profiles", JSON.stringify([{ id: "lp-1", name: "Test" }])],
  ["pog_p_lp-1_profile", JSON.stringify({ name: "Test", interests: [] })],
  [
    "pog_p_lp-1_board_phrases",
    JSON.stringify({ en: [["<img src=x onerror=alert(1)>", "Hello"]] })
  ],
  [
    "pog_p_lp-1_wordbank_deck",
    JSON.stringify([
      {
        id: "cust_xss",
        cat: "home",
        pic: "<svg onload=alert(1)>",
        photo: "javascript:alert(1)",
        source: "custom",
        it: { w: "casa", alts: [], sfa: ["Dove vivi"], pca: { first: "CA", syl: "ca · sa", rhyme: "", len: 4 } },
        en: { w: "house", alts: [], sfa: ["Where you live"], pca: { first: "HO", syl: "hou · se", rhyme: "", len: 5 } },
        box: 1,
        dueAt: 0
      }
    ])
  ]
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
const ctx = {
  window: {
    POG: {
      ext: { screens: {}, actions: {}, locked: {}, home: [] },
      createSpeech: () => ({ provider: "none", start: () => {}, stop: () => {}, cancel: () => {}, candidates: () => [], timing: () => ({}) }),
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
vm.createContext(ctx);
vm.runInContext(read("js/strings.js"), ctx);
vm.runInContext(read("content/base.js"), ctx);
vm.runInContext(read("content/interests.js"), ctx);
vm.runInContext(read("content/wordbank.js"), ctx);
vm.runInContext(read("js/app.js"), ctx);
vm.runInContext(read("js/aac.js"), ctx);
vm.runInContext(read("js/wordbank.js"), ctx);

const appApi = ctx.window.POG.appApi;
check(
  appApi.safePhotoUrl("blob:https://app.test/1234") === "blob:https://app.test/1234" &&
    appApi.safePhotoUrl("data:image/png;base64,AAAA") === "data:image/png;base64,AAAA" &&
    appApi.safePhotoUrl("javascript:alert(1)") === "" &&
    appApi.safePhotoUrl("https://tracker.invalid/px.png") === "",
  "safePhotoUrl allows only local blob/data-image URLs and rejects javascript/remote URLs"
);

check(
  !appApi.importLocalProfileBackup({ version: 1, data: { profile: { name: "Fake" } } }).ok &&
    !appApi.importLocalProfileBackup({ format: "pog-local-backup", version: 2, data: { profile: { name: "Fake" } } }).ok,
  "importLocalProfileBackup requires both format === 'pog-local-backup' and version === 1"
);

const boardHtml = ctx.window.POG.ext.screens.board();
check(
  boardHtml.includes("&lt;img src=x onerror=alert(1)&gt;") && !boardHtml.includes("<img src=x"),
  "Talk Board escapes stored tile icons to prevent HTML injection"
);

ctx.window.POG.ext.actions["wb-home"]();
const wbHtml = ctx.window.POG.ext.screens.wordbank();
check(
  !wbHtml.includes("javascript:alert(1)") && !wbHtml.includes("<svg onload"),
  "Wordbank rejects unsafe photo URLs and escapes stored card pic values"
);

if (fail) {
  console.error(fail + " check(s) failed.");
  process.exit(1);
}
console.log("All security hardening regression checks passed.");
