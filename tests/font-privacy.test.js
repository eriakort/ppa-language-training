#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
const fontDir = path.join(root, "assets/fonts");

function check(condition, label) {
  if (!condition) {
    console.error("not ok " + label);
    process.exitCode = 1;
  } else {
    console.log("ok   " + label);
  }
}

check(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html + css), "page does not request fonts from Google");
check((css.match(/@font-face\s*\{/g) || []).length === 4, "regular and bold font faces include Latin and extended Latin subsets");
for (const file of ["atkinson-regular-latin.woff2", "atkinson-regular-latin-ext.woff2", "atkinson-bold-latin.woff2", "atkinson-bold-latin-ext.woff2"]) {
  const asset = path.join(fontDir, file);
  check(fs.existsSync(asset) && fs.statSync(asset).size > 0 && css.includes(file), `${file} is present and referenced locally`);
}
check(fs.readFileSync(path.join(fontDir, "OFL.txt"), "utf8").includes("SIL OPEN FONT LICENSE"), "font license is included with bundled font assets");
