"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const app = fs.readFileSync(path.join(__dirname, "..", "js/app.js"), "utf8");
const start = app.indexOf("  function csvCell(value) {");
const close = app.indexOf("\n  }", start);
if (start < 0 || close < 0) throw new Error("CSV cell formatter was not found");
const csvCell = vm.runInNewContext("(function () {\n" + app.slice(start, close + 4) + "\nreturn csvCell; })()");

function check(ok, label) {
  if (!ok) { console.error("FAIL " + label); process.exitCode = 1; }
  else console.log("ok   " + label);
}

check(csvCell("=1+1") === "'=1+1", "formula cells beginning with equals are treated as text");
check(csvCell(" +SUM(1,1)") === "\"' +SUM(1,1)\"", "leading whitespace and formula prefixes are neutralized before CSV quoting");
check(csvCell("@cmd") === "'@cmd" && csvCell("-cmd") === "'-cmd", "at-sign and plus/minus formula prefixes are neutralized");
check(csvCell("\t=1+1") === "'\t=1+1", "leading control characters do not bypass formula neutralization");
check(csvCell(-2) === "-2", "numeric values remain numeric");
check(csvCell('say "hello", world') === '"say ""hello"", world"', "ordinary CSV quoting remains intact");
