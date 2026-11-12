/*
 * Small trend charts for the check-in results and the printable summary.
 * One measure per chart (one line, one y-axis), drawn as inline SVG with the app's colour tokens.
 * Each point carries a <title>, so hovering shows its date and value; every chart is shown next to a
 * table of the same numbers, so nothing depends on reading the line alone.
 */
window.POG = window.POG || {};
window.POG.charts = (function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function niceMax(v) {
    if (!(v > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }
  /*
   * points: [{ t: ms timestamp, y: number|null, label: tooltip text }]
   * opts: { title, unit, max (fixed top of the axis), locale, decimals }
   */
  function line(points, opts) {
    opts = opts || {};
    var pts = (points || []).filter(function (p) { return p.y != null && isFinite(p.y); }).sort(function (a, b) { return a.t - b.t; });
    var W = 340, H = 150, L = 40, R = 14, Tp = 14, B = 26;
    var head = '<figure class="mini-chart"><figcaption>' + esc(opts.title || "") + (opts.unit ? ' <span>(' + esc(opts.unit) + ')</span>' : '') + '</figcaption>';
    if (!pts.length) return head + '<p class="note">–</p></figure>';
    var ymax = opts.max != null ? opts.max : niceMax(Math.max.apply(null, pts.map(function (p) { return p.y; })));
    var t0 = pts[0].t, t1 = pts[pts.length - 1].t, span = Math.max(1, t1 - t0);
    var x = function (t) { return pts.length === 1 ? L + (W - L - R) / 2 : L + (t - t0) / span * (W - L - R); };
    var y = function (v) { return Tp + (1 - Math.min(v, ymax) / ymax) * (H - Tp - B); };
    var dec = opts.decimals == null ? 0 : opts.decimals;
    var fmt = function (v) { return Number(v).toFixed(dec).replace(".", opts.locale === "it-IT" ? "," : "."); };
    var day = function (t) { return new Date(t).toLocaleDateString(opts.locale || "it-IT", { day: "numeric", month: "short" }); };
    var grid = [0, ymax / 2, ymax].map(function (v) {
      return '<line class="mc-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text class="mc-axis" x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + esc(fmt(v)) + '</text>';
    }).join("");
    var path = pts.map(function (p, i) { return (i ? "L" : "M") + x(p.t).toFixed(1) + " " + y(p.y).toFixed(1); }).join(" ");
    /* With many points only the line and the last point are drawn; the others stay hoverable. */
    var dense = pts.length > 12;
    var dots = pts.map(function (p) {
      return '<circle class="' + (dense && p !== pts[pts.length - 1] ? 'mc-hit' : 'mc-dot') + '" cx="' + x(p.t).toFixed(1) + '" cy="' + y(p.y).toFixed(1) + '" r="' + (dense && p !== pts[pts.length - 1] ? 6 : 4) + '"><title>' + esc(day(p.t) + ": " + fmt(p.y) + (opts.unit ? " " + opts.unit : "") + (p.label ? " · " + p.label : "")) + '</title></circle>';
    }).join("");
    var xl = '<text class="mc-axis" x="' + L + '" y="' + (H - 6) + '" text-anchor="start">' + esc(day(t0)) + '</text>' +
      (pts.length > 1 ? '<text class="mc-axis" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(day(t1)) + '</text>' : '');
    var last = pts[pts.length - 1];
    var lastLabel = '<text class="mc-last" x="' + Math.min(W - R, x(last.t) + 0).toFixed(1) + '" y="' + Math.max(10, y(last.y) - 9).toFixed(1) + '" text-anchor="end">' + esc(fmt(last.y)) + '</text>';
    return head + '<svg class="mc" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc((opts.title || "") + ": " + pts.map(function (p) { return day(p.t) + " " + fmt(p.y); }).join(", ")) + '">' +
      grid + (pts.length > 1 ? '<path class="mc-line" d="' + path + '"/>' : '') + dots + lastLabel + xl + '</svg></figure>';
  }
  return { line: line };
})();
