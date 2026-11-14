#!/usr/bin/env node
/*
 * Checks the progress statistics against values worked out by hand or with standard formulas.
 *   node tests/stats.test.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ctx = { window: {}, Math, isFinite, Object };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js/stats.js"), "utf8"), ctx);
const S = ctx.window.POG.stats;
let failures = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) failures++; };
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9);
const DAY = 86400000;

ok(S.median([3, 1, 2]) === 2 && S.median([4, 1, 3, 2]) === 2.5 && S.median([]) === null, "median of odd, even and empty lists");
ok(S.median([1, null, 3, undefined, NaN]) === 2, "median ignores missing values");
// MAD of 1..9 is 2 -> spread 2 * 1.4826
ok(near(S.spread([1, 2, 3, 4, 5, 6, 7, 8, 9]), 2 * 1.4826), "spread = MAD × 1.4826");
ok(near(S.spread([5, 5, 5, 5, 6]), S.sd([5, 5, 5, 5, 6])), "spread falls back to the standard deviation when MAD is 0");
// Standard normal CDF
ok(near(S.phi(0), 0.5, 1e-7) && near(S.phi(1.96), 0.975, 1e-4) && near(S.phi(-1), 0.158655, 1e-4), "normal CDF matches tables");
// Theil–Sen on an exact line y = 2 per day
const line = [0, 1, 2, 3, 4, 5].map((d) => ({ t: d * DAY, y: 1 + 2 * d }));
const ts = S.theilSen(line);
ok(near(ts.slope, 2) && near(ts.intercept, 1), "Theil–Sen recovers an exact line");
// one wild outlier barely moves it
const noisy = line.map((p, i) => i === 3 ? { t: p.t, y: 100 } : p);
ok(near(S.theilSen(noisy).slope, 2), "Theil–Sen ignores a single outlier");
// Mann–Kendall: strictly increasing, n = 10: S = 45, var = 10*9*25/18 = 125, z = 44/sqrt(125)
const mk = S.mannKendall([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
ok(mk.S === 45 && near(mk.varS, 125) && near(mk.z, 44 / Math.sqrt(125)), "Mann–Kendall S, variance and z for a rising series");
ok(near(mk.p, 2 * (1 - S.phi(44 / Math.sqrt(125)))) && mk.p < 0.001, "Mann–Kendall p-value is small for a clear trend (" + mk.p.toExponential(2) + ")");
// ties: [1,1,2,2,3,3]: S = 12, tie groups of 2 -> var = (6*5*17 - 3*2*1*9)/18 = (510-54)/18
const mt = S.mannKendall([1, 1, 2, 2, 3, 3]);
ok(mt.S === 12 && near(mt.varS, (510 - 54) / 18), "Mann–Kendall corrects the variance for ties");
ok(S.mannKendall([5, 1, 4, 2, 3, 3, 2, 4, 1, 5]).p > 0.5, "Mann–Kendall finds no trend in flat noise");
// trend verdicts
const down = Array.from({ length: 12 }, (_, i) => ({ t: i * 2 * DAY, y: 0.9 - i * 0.02 + (i % 2 ? 0.01 : -0.01) }));
const td = S.trend(down, { better: "up" });
ok(td.verdict === "worse" && td.slopePerMonth < 0, "trend: a steady fall is reported as worse");
ok(S.trend(down, { better: "down" }).verdict === "better", "trend: direction respects which way is better");
ok(S.trend(down.slice(0, 5)).verdict === "insufficient", "trend: fewer than 8 values is not enough");
const flat = Array.from({ length: 12 }, (_, i) => ({ t: i * DAY, y: [0.7, 0.72, 0.69, 0.71][i % 4] }));
ok(S.trend(flat).verdict === "none", "trend: flat data shows no trend");
// period comparison
const A = [0.70, 0.72, 0.68, 0.71, 0.69, 0.73, 0.70];
ok(S.compare(A, [0.71, 0.70, 0.72, 0.69], { better: "up" }).verdict === "stable", "compare: similar periods are stable");
ok(S.compare(A, [0.50, 0.52, 0.49, 0.51], { better: "up" }).verdict === "worse", "compare: a clear drop is worse");
ok(S.compare(A, [0.90, 0.91, 0.92], { better: "up" }).verdict === "better", "compare: a clear rise is better");
ok(S.compare([2.0, 2.1, 1.9, 2.0, 2.2, 2.1], [3.5, 3.4, 3.6], { better: "down" }).verdict === "worse", "compare: slower onset (higher is worse) is worse");
ok(S.compare([1, 2, 3], [1, 2, 3]).verdict === "insufficient", "compare: too few values is not enough");
const c = S.compare(A, [0.71, 0.70, 0.72, 0.69], { minChange: 0.05 });
ok(near(c.threshold, Math.max(2 * S.spread(A), 0.05)), "compare: threshold is k × spread, at least the minimum change");
// rolling median
const rm = S.rollingMedian([1, 9, 2, 8, 3].map((y, i) => ({ t: i, y })), 3);
ok(rm.length === 5 && rm[2].y === 8 && rm[0].y === 2, "rolling median smooths a zig-zag");
// alerts
const base = Array.from({ length: 12 }, (_, i) => ({ t: i * DAY, y: 0.7 + (i % 3) * 0.01 }));
ok(S.alert(base) === null, "alert: no alert for usual values");
const dropped = base.concat([0.4, 0.42, 0.41].map((y, i) => ({ t: (12 + i) * DAY, y })));
const al = S.alert(dropped, { better: "up", run: 3 });
ok(al && near(al.since, 12 * DAY), "alert: three sessions well below usual raise an alert");
ok(S.alert(base.concat([{ t: 13 * DAY, y: 0.4 }, { t: 14 * DAY, y: 0.71 }, { t: 15 * DAY, y: 0.4 }])) === null, "alert: one bad day in between doesn't");

if (failures) { console.error(failures + " check(s) failed."); process.exit(1); }
console.log("All statistics checks passed.");
