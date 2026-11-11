#!/usr/bin/env node
/*
 * Checks the content files without a browser:
 *  - every crossword word is capitals only (no accents, no spaces)
 *  - every crossword the generator can build from each interest has correct
 *    crossings and no letters touching outside a crossing
 *  - the hand-made base crosswords are valid too
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
const end = app.indexOf("\n  }\n", start) + 4;
vm.runInContext(app.slice(start, end) + "\nthis.genCross = genCross;", ctx);
const genCross = ctx.genCross;

let failures = 0;
const fail = (msg) => { failures++; console.error("FAIL " + msg); };

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
      const p = genCross(pk.cw[lang], seed, pk.icon);
      generated++;
      if (!p) { fail(k + "/" + lang + ": no crossword for seed " + seed); continue; }
      checkGrid(p, k + "/" + lang + "/seed " + seed);
    }
  }
}
for (const lang of ["it", "en"]) C.CROSS[lang].forEach((p, i) => checkGrid(p, "base/" + lang + "/" + i));

if (failures) { console.error(failures + " problem(s) found."); process.exit(1); }
console.log("OK: " + generated + " generated crosswords and " + (C.CROSS.it.length + C.CROSS.en.length) + " base crosswords are valid; all interests complete.");
