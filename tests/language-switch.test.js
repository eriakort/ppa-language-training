#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const fail = [];
const app = read("js/app.js");
if (!app.includes('window.dispatchEvent(new CustomEvent("pog:languagechange"')) fail.push("app does not broadcast language changes");
if (!app.includes('save("lang", lang)')) fail.push("selected language is not persisted");
for (const file of [
  "js/account.js",
  "js/cloud-sync.js",
  "js/therapist-cloud.js",
  "js/deletion-retention.js",
  "js/profile-lifecycle.js",
  "js/ownership-transfer.js",
  "js/account-deletion-review.js"
]) {
  const source = read(file);
  if (!source.includes('window.addEventListener("pog:languagechange"')) fail.push(file + " does not refresh on language changes");
  if (!source.includes('ev.detail && ev.detail.lang === "en"')) fail.push(file + " does not validate the selected language");
  if (!source.includes("T = ") && !source.includes("copy = translations[lang]")) fail.push(file + " does not update its translation dictionary");
  if (source.includes("translations[lang]") && !/var\s+translations\s*=/.test(source)) fail.push(file + " references an undeclared translations dictionary");
  if (!/if\s*\(panel/.test(source) || !source.includes("render()")) fail.push(file + " does not rerender an open panel");
}
if (!app.includes('window.addEventListener("pog:authchange"')) fail.push("main app does not react to account sign-out");
if (!app.includes("accountSignedOut ? t.helloGuest")) fail.push("signed-out home greeting still exposes the learner name");
const account = read("js/account.js");
if (!account.includes('localStorage.setItem("pog_account_signed_out", "1")')) fail.push("account sign-out is not remembered across refreshes");
if (!account.includes('window.dispatchEvent(new CustomEvent("pog:authchange"')) fail.push("account state is not broadcast to the main app");
// The app saves the language as JSON ("\"en\""). Panels must read it through POG.getLang, never by comparing the raw value.
for (const file of fs.readdirSync(path.join(root, "js")).filter((f) => f.endsWith(".js") && f !== "strings.js")) {
  if (/getItem\(\s*["']pog_lang["']\s*\)/.test(read("js/" + file))) fail.push("js/" + file + " reads the saved language directly instead of POG.getLang()");
}
{
  const vm = require("vm");
  const store = {};
  const ctx = { window: {}, localStorage: { getItem: (k) => (k in store ? store[k] : null) } };
  vm.createContext(ctx);
  vm.runInContext(read("js/strings.js"), ctx);
  const get = ctx.window.POG.getLang;
  store.pog_lang = JSON.stringify("en"); if (get() !== "en") fail.push("getLang does not read the JSON-saved English setting");
  store.pog_lang = "en"; if (get() !== "en") fail.push("getLang does not read a plain English setting");
  store.pog_lang = JSON.stringify("it"); if (get() !== "it") fail.push("getLang does not read the Italian setting");
  delete store.pog_lang; if (get() !== "it") fail.push("getLang does not default to Italian");
}
if (!account.includes("window.location.reload()")) fail.push("signing out does not reload the app");
if (!account.includes("pog_account_had_session")) fail.push("an ended session (expired or other tab) is not treated as signed out");
if (fail.length) { fail.forEach((x) => console.error("FAIL " + x)); process.exit(1); }
console.log("OK: main app and all account/profile panels refresh to the selected language.");
