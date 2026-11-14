#!/usr/bin/env node
/*
 * Checks the content files without a browser:
 *  - every crossword word is capitals only (no accents, no spaces)
 *  - every generated crossword has at least eight words with correct
 *    crossings and no letters touching outside a crossing
 *  - both base answer banks can generate valid large crosswords
 *  - every interest has the parts each game needs, in both languages
 *
 *   node tests/content.test.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["content/base.js", "content/interests.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const C = ctx.window.POG.content;

// genCross lives in the app code; load just that function.
const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
const start = app.indexOf("  function genCross(");
const end = app.indexOf("  var lang = load", start);
vm.runInContext(app.slice(start, end) + "\nthis.genCross = genCross;", ctx);
const genCross = ctx.genCross;

let failures = 0;
const fail = (msg) => { failures++; console.error("FAIL " + msg); };

for (const lang of ["it", "en"]) {
  if (C.READ[lang].long.length < 4) fail(lang + ": long reading needs at least four passages");
  C.READ[lang].long.forEach((passage, i) => {
    if (passage.trim().split(/\s+/).length < 24) fail(lang + ": long reading passage " + i + " is too short");
  });
}

function checkGrid(p, label) {
  const g = {}, owner = {};
  p.forEach((wd, wi) => {
    for (let i = 0; i < wd.w.length; i++) {
      const r = wd.d === "a" ? wd.r : wd.r + i, c = wd.d === "a" ? wd.c + i : wd.c, k = r + "," + c;
      if (r < 0 || c < 0) fail(label + ": negative coordinates");
      if (g[k] && g[k] !== wd.w[i]) fail(label + ": crossing mismatch at " + k);
      g[k] = wd.w[i];
      (owner[k] = owner[k] || []).push(wi);
    }
  });
  for (const k in g) {
    const [r, c] = k.split(",").map(Number);
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const k2 = (r + dr) + "," + (c + dc);
      if (g[k2] && !owner[k].some((x) => owner[k2].includes(x))) fail(label + ": letters touch at " + k + " / " + k2);
    }
  }
  const crossings = Object.values(owner).filter((o) => o.length > 1).length;
  if (crossings !== p.length - 1) fail(label + ": expected " + (p.length - 1) + " crossings, got " + crossings);
}

let generated = 0;
for (const k of C.PACK_KEYS) {
  const pk = C.PACKS[k];
  for (const lang of ["it", "en"]) {
    if (!pk.describe.length || !pk.name.length) fail(k + "/" + lang + ": missing describe or name items");
    if (!pk.echo[lang] || pk.echo[lang].length !== 3) fail(k + "/" + lang + ": echo needs 3 levels");
    pk.name.forEach((n) => { if (!n[lang] || n[lang].length !== 3) fail(k + "/" + lang + ": name item needs [word, hint, first sound]"); });
    for (const [w] of pk.cw[lang]) if (!/^[A-Z]+$/.test(w)) fail(k + "/" + lang + ": bad crossword word " + w);
    for (let seed = 0; seed < 60; seed++) {
      const p = genCross(pk.cw[lang], seed, pk.icon, C.CROSS_WORDS[lang]);
      generated++;
      if (!p) { fail(k + "/" + lang + ": no crossword for seed " + seed); continue; }
      if (p.length < 8) fail(k + "/" + lang + ": expected at least 8 words, got " + p.length);
      checkGrid(p, k + "/" + lang + "/seed " + seed);
    }
  }
}
for (const lang of ["it", "en"]) {
  for (let seed = 0; seed < 60; seed++) {
    const p = genCross(C.CROSS_WORDS[lang], seed, "");
    if (!p || p.length < 8) fail("base/" + lang + ": expected a crossword with at least 8 words for seed " + seed);
    else checkGrid(p, "base/" + lang + "/seed " + seed);
  }
}

// Mystery word: five clues, none of which gives the answer away
const plain = (w) => w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
for (const lang of ["it", "en"]) {
  const seen = new Set();
  if (C.MYSTERY[lang].length < 20) fail(lang + ": mystery needs at least 20 sets");
  for (const [w, clues, alts] of C.MYSTERY[lang]) {
    if (seen.has(w)) fail(lang + ": duplicate mystery word " + w);
    seen.add(w);
    if (clues.length !== 5) fail(lang + ": mystery " + w + " needs five clues");
    if (new Set(clues).size !== 5) fail(lang + ": mystery " + w + " repeats a clue");
    for (const c of clues) for (const t of [w].concat(alts)) {
      if (plain(c).includes(plain(t)) || plain(t).includes(plain(c))) fail(lang + ": clue «" + c + "» gives away «" + t + "»");
    }
  }
}
// Month and day anagrams fit Word building (one word, 8 letters at most)
for (const a of C.ANAGRAMS) for (const lang of ["it", "en"]) {
  if (!/^[a-z]{3,8}$/.test(a[lang][0])) fail(lang + ": bad anagram word " + a[lang][0]);
  if (!a[lang][1] || !a[lang][2]) fail(lang + ": anagram " + a[lang][0] + " needs a clue and a first sound");
}
// Letter path words: capitals only, short enough for the small grid
for (const lang of ["it", "en"]) for (const [cat, words] of C.PATH_WORDS[lang]) {
  if (!cat) fail(lang + ": path category without a name");
  if (words.filter((w) => w.length <= 7).length < 3) fail(lang + ": path category " + cat + " needs short words for the 4x4 grid");
  for (const w of words) if (!/^[A-Z]{3,10}$/.test(w)) fail(lang + ": bad path word " + w);
}

if (failures) { console.error(failures + " problem(s) found."); process.exit(1); }
console.log("OK: " + generated + " generated 8+ word crosswords and both base answer banks are valid; all interests complete; mystery, anagram and letter-path content valid.");
