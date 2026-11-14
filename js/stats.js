/*
 * Small, robust statistics for the progress reports. Plain functions, no dependencies.
 *
 *   median, spread       robust centre and spread (MAD × 1.4826, a standard deviation estimate that
 *                        one bad day can't pull far)
 *   compare              two periods: medians, the change, and whether the change is bigger than the
 *                        person's usual day-to-day variation (k × spread of the earlier period)
 *   theilSen             trend slope: the median of all pairwise slopes (robust to outliers)
 *   mannKendall          is there a consistent upward or downward trend? (two-sided p-value, normal
 *                        approximation with the correction for ties)
 *   rollingMedian        a steady line through noisy sessions
 *   alert                the last few values all clearly below the person's usual range
 *
 * These are indicators for following change, not clinical tests. Thresholds are adjustable.
 */
window.POG = window.POG || {};
window.POG.stats = (function () {
  "use strict";
  function nums(a) { return (a || []).filter(function (x) { return x != null && isFinite(x); }); }
  function median(a) {
    var v = nums(a).slice().sort(function (x, y) { return x - y; });
    if (!v.length) return null;
    var m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  }
  function mean(a) { var v = nums(a); return v.length ? v.reduce(function (x, y) { return x + y; }, 0) / v.length : null; }
  function sd(a) {
    var v = nums(a); if (v.length < 2) return null;
    var m = mean(v); return Math.sqrt(v.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (v.length - 1));
  }
  /* Robust spread: MAD × 1.4826; falls back to the standard deviation when most values are identical. */
  function spread(a) {
    var v = nums(a); if (v.length < 2) return null;
    var m = median(v), mad = median(v.map(function (x) { return Math.abs(x - m); })) * 1.4826;
    return mad > 0 ? mad : (sd(v) || 0);
  }
  /*
   * a: earlier period values, b: later period values.
   * opts: { better: "up"|"down", k: 2, minN: 5, minChange: smallest change worth reporting }
   * verdict: "insufficient" | "stable" | "better" | "worse"
   */
  function compare(a, b, opts) {
    opts = opts || {};
    var A = nums(a), B = nums(b), k = opts.k || 2, minN = opts.minN || 5;
    var out = { nA: A.length, nB: B.length, medA: median(A), medB: median(B), diff: null, spread: null, threshold: null, verdict: "insufficient" };
    if (A.length < minN || B.length < Math.min(minN, 3)) return out;
    out.diff = out.medB - out.medA;
    out.spread = spread(A);
    out.threshold = Math.max(k * (out.spread || 0), opts.minChange || 0);
    if (Math.abs(out.diff) <= out.threshold) out.verdict = "stable";
    else out.verdict = (out.diff > 0) === ((opts.better || "up") === "up") ? "better" : "worse";
    return out;
  }
  /* points: [{t: ms, y}]. Slope in y per day. */
  function theilSen(points) {
    var p = (points || []).filter(function (q) { return q && q.y != null && isFinite(q.y) && isFinite(q.t); });
    if (p.length < 2) return null;
    var slopes = [];
    for (var i = 0; i < p.length; i++) for (var j = i + 1; j < p.length; j++) {
      var dt = (p[j].t - p[i].t) / 86400000;
      if (dt !== 0) slopes.push((p[j].y - p[i].y) / dt);
    }
    if (!slopes.length) return null;
    var slope = median(slopes), t0 = p[0].t;
    var intercept = median(p.map(function (q) { return q.y - slope * (q.t - t0) / 86400000; }));
    return { slope: slope, intercept: intercept, t0: t0 };
  }
  /* Standard normal cumulative distribution (Abramowitz–Stegun 7.1.26 approximation of erf). */
  function phi(z) {
    var x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
    var erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
  }
  /* ys in time order. Returns { n, S, varS, z, p } or null when fewer than 3 values. */
  function mannKendall(ys) {
    var y = nums(ys), n = y.length;
    if (n < 3) return null;
    var S = 0, i, j;
    for (i = 0; i < n - 1; i++) for (j = i + 1; j < n; j++) S += Math.sign(y[j] - y[i]);
    var groups = {}; y.forEach(function (v) { groups[v] = (groups[v] || 0) + 1; });
    var tie = 0; Object.keys(groups).forEach(function (k) { var t = groups[k]; if (t > 1) tie += t * (t - 1) * (2 * t + 5); });
    var varS = (n * (n - 1) * (2 * n + 5) - tie) / 18;
    var z = varS > 0 ? (S > 0 ? (S - 1) / Math.sqrt(varS) : S < 0 ? (S + 1) / Math.sqrt(varS) : 0) : 0;
    return { n: n, S: S, varS: varS, z: z, p: 2 * (1 - phi(Math.abs(z))) };
  }
  /*
   * Trend over a period. opts: { better: "up"|"down", minN: 8, alpha: 0.05, minChange (per 30 days) }
   * verdict: "insufficient" | "none" | "better" | "worse"
   */
  function trend(points, opts) {
    opts = opts || {};
    var p = (points || []).filter(function (q) { return q && q.y != null && isFinite(q.y); }).sort(function (a, b) { return a.t - b.t; });
    var out = { n: p.length, slopePerMonth: null, p: null, verdict: "insufficient" };
    if (p.length < (opts.minN || 8)) return out;
    var ts = theilSen(p), mk = mannKendall(p.map(function (q) { return q.y; }));
    out.slopePerMonth = ts ? ts.slope * 30 : null; out.p = mk ? mk.p : null;
    var real = mk && mk.p < (opts.alpha || 0.05) && out.slopePerMonth != null && Math.abs(out.slopePerMonth) >= (opts.minChange || 0) && out.slopePerMonth !== 0;
    out.verdict = !real ? "none" : (out.slopePerMonth > 0) === ((opts.better || "up") === "up") ? "better" : "worse";
    return out;
  }
  function rollingMedian(points, w) {
    w = w || 7;
    var p = (points || []).filter(function (q) { return q && q.y != null && isFinite(q.y); }).sort(function (a, b) { return a.t - b.t; });
    return p.map(function (q, i) {
      var from = Math.max(0, i - Math.floor(w / 2)), to = Math.min(p.length, from + w);
      from = Math.max(0, to - w);
      return { t: q.t, y: median(p.slice(from, to).map(function (x) { return x.y; })) };
    });
  }
  /*
   * Sudden change: the last `run` values are all worse than the usual level by more than k × spread.
   * The usual level comes from up to `window` earlier values (at least `minBase`).
   * opts: { better, k: 2, run: 3, minBase: 8, window: 30, minChange }
   */
  function alert(points, opts) {
    opts = opts || {};
    var p = (points || []).filter(function (q) { return q && q.y != null && isFinite(q.y); }).sort(function (a, b) { return a.t - b.t; });
    var run = opts.run || 3, k = opts.k || 2, minBase = opts.minBase || 8;
    if (p.length < run + minBase) return null;
    var last = p.slice(-run), base = p.slice(0, -run).slice(-(opts.window || 30)).map(function (q) { return q.y; });
    var m = median(base), s = spread(base), thr = Math.max(k * (s || 0), opts.minChange || 0), up = (opts.better || "up") === "up";
    var all = last.every(function (q) { return up ? q.y < m - thr : q.y > m + thr; });
    return all ? { usual: m, threshold: thr, last: last, since: last[0].t } : null;
  }
  return { median: median, mean: mean, sd: sd, spread: spread, compare: compare, theilSen: theilSen, phi: phi,
    mannKendall: mannKendall, trend: trend, rollingMedian: rollingMedian, alert: alert };
})();
