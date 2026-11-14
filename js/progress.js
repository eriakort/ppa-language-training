/*
 * Progress and regress for the therapist and carers (inside the therapist area, behind the PIN).
 *
 * Data: a compact copy of every daily session (one line per game) kept for much longer than the
 * full session records, plus the speech check-ins. Levels change over time, so raw accuracy can't be
 * compared across months: each game gets an ability index that combines level and accuracy,
 *   ability = (number of levels − level + accuracy) / number of levels      (0 to 1, higher = more independent)
 * so stepping down to an easier level shows as a dip, not as an improvement.
 *
 * Views: today compared with the usual of the last 30 days; two periods compared; the trend over the
 * period (Theil–Sen slope, Mann–Kendall test); and a notice when several sessions in a row fall clearly
 * below the usual range. Indicators for following change, not a clinical assessment.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi, ST = window.POG && window.POG.stats;
  if (!api || !ST || !window.POG.charts) return;
  var esc = api.esc, DAY = 86400000, KEY = "progress_log", KEEP = 800;

  var C = {
    it: {
      btn: "Andamento e statistiche", title: "Andamento e statistiche",
      intro: "Confronta i risultati nel tempo. L'indice di autonomia unisce livello e precisione, così passare a un livello più facile si vede come un calo e non come un miglioramento.",
      period: "Periodo", who: "Modalità", whoAll: "Tutte", whoSolo: "Da solo", whoAssist: "Con aiuto",
      p4w: "Ultime 4 settimane e le 4 precedenti", pMonth: "Questo mese e il mese scorso", p3m: "Ultimi 3 mesi e i 3 precedenti", pCustom: "Scegli le date",
      aFrom: "Periodo A dal", aTo: "al", bFrom: "Periodo B dal", bTo: "al", apply: "Aggiorna",
      today: "Ultima giornata di esercizi", todayOf: "{d} confrontata con i 30 giorni precedenti", noToday: "Nessuna sessione ancora.",
      colGame: "Esercizio", colAcc: "Precisione", colHints: "Aiuti", colTime: "Tempo per risposta (s)", colOnset: "Inizio risposta (s)", colToday: "Oggi", colUsual: "Di solito", colHow: "",
      dBetter: "Meglio del solito", dSame: "Come di solito", dWorse: "Più difficile del solito", dNew: "Poco storico",
      cmp: "Confronto tra periodi", cmpOf: "A: {a} · B: {b}", colMeasure: "Misura", colA: "A", colB: "B", colChange: "Cambiamento", colVerdict: "Esito",
      vBetter: "Migliorato", vStable: "Stabile", vWorse: "Peggiorato", vNone: "Dati insufficienti",
      trend: "Tendenza nel tempo", measure: "Misura", trendOf: "Dal {a} al {b}",
      tBetter: "Tendenza al miglioramento", tWorse: "Tendenza al peggioramento", tNone: "Nessuna tendenza chiara", tShort: "Servono almeno 8 valori",
      tDetail: "{s} al mese · Mann–Kendall p = {p} · {n} valori", levelChange: "Cambio di livello: {a} → {b}",
      alerts: "Da guardare", alertText: "{m}: le ultime {n} sessioni sono sotto il solito (di solito {u}, ultime {l}).", noAlerts: "Nessun calo improvviso nelle ultime sessioni.",
      activity: "Attività", sessions: "Sessioni", days: "Giorni di esercizio", minutes: "Minuti",
      ability: "Indice di autonomia (tutti gli esercizi)", abilityOf: "Indice di autonomia: {g}", onset: "Tempo prima della prima parola", wpm: "Parole al minuto",
      ckNaming: "Controllo: nomi giusti (su 10)", ckFlu: "Controllo: animali in un minuto", ckRep: "Controllo: ripetizione", ckWpm: "Controllo: parole al minuto",
      settings: "Soglie", kLabel: "Un cambiamento conta se supera", kOpt: "{k} volte la variazione abituale", runLabel: "Avviso dopo", runOpt: "{n} sessioni di fila sotto il solito", save: "Salva le soglie", saved: "Soglie salvate.",
      method: "Come si calcola: si usano le mediane, così un giorno storto pesa poco. «Variazione abituale» è la dispersione robusta del periodo A (MAD × 1,4826). Un cambiamento conta solo se è più grande della soglia; la tendenza usa la pendenza di Theil–Sen e il test di Mann–Kendall (p < 0,05). I controlli del parlato sono la misura più affidabile, perché sono sempre uguali e usano parole che non compaiono negli esercizi. Con meno di 5 sessioni (2 controlli) per periodo il risultato è «dati insufficienti». Valori indicativi, non una valutazione clinica: le soglie vanno decise dal logopedista.",
      back: "Torna all'area logopedista", backCloud: "Torna allo storico condiviso", remote: "Dati dal cloud: {n} (sola lettura)", none: "–", perMonth: "al mese", unitS: "s", pct: "%"
    },
    en: {
      btn: "Progress and statistics", title: "Progress and statistics",
      intro: "Compare results over time. The ability index combines level and accuracy, so moving to an easier level shows as a dip, not as an improvement.",
      period: "Period", who: "Mode", whoAll: "All", whoSolo: "On my own", whoAssist: "With help",
      p4w: "Last 4 weeks and the 4 before", pMonth: "This month and last month", p3m: "Last 3 months and the 3 before", pCustom: "Choose dates",
      aFrom: "Period A from", aTo: "to", bFrom: "Period B from", bTo: "to", apply: "Update",
      today: "Latest day of practice", todayOf: "{d} compared with the previous 30 days", noToday: "No sessions yet.",
      colGame: "Exercise", colAcc: "Accuracy", colHints: "Hints", colTime: "Time per answer (s)", colOnset: "Answer onset (s)", colToday: "Today", colUsual: "Usual", colHow: "",
      dBetter: "Better than usual", dSame: "As usual", dWorse: "Harder than usual", dNew: "Little history",
      cmp: "Comparing two periods", cmpOf: "A: {a} · B: {b}", colMeasure: "Measure", colA: "A", colB: "B", colChange: "Change", colVerdict: "Result",
      vBetter: "Improved", vStable: "Stable", vWorse: "Declined", vNone: "Not enough data",
      trend: "Trend over time", measure: "Measure", trendOf: "From {a} to {b}",
      tBetter: "Trending better", tWorse: "Trending worse", tNone: "No clear trend", tShort: "At least 8 values are needed",
      tDetail: "{s} a month · Mann–Kendall p = {p} · {n} values", levelChange: "Level change: {a} → {b}",
      alerts: "Worth a look", alertText: "{m}: the last {n} sessions are below usual (usually {u}, latest {l}).", noAlerts: "No sudden drop in recent sessions.",
      activity: "Activity", sessions: "Sessions", days: "Days practised", minutes: "Minutes",
      ability: "Ability index (all exercises)", abilityOf: "Ability index: {g}", onset: "Time before the first word", wpm: "Words per minute",
      ckNaming: "Check-in: names correct (of 10)", ckFlu: "Check-in: animals in one minute", ckRep: "Check-in: repetition", ckWpm: "Check-in: words per minute",
      settings: "Thresholds", kLabel: "A change counts when it exceeds", kOpt: "{k} times the usual variation", runLabel: "Notice after", runOpt: "{n} sessions in a row below usual", save: "Save thresholds", saved: "Thresholds saved.",
      method: "How it's worked out: medians are used, so one bad day counts for little. \"Usual variation\" is the robust spread of period A (MAD × 1.4826). A change counts only when it is larger than the threshold; the trend uses the Theil–Sen slope and the Mann–Kendall test (p < 0.05). Speech check-ins are the most reliable measure, because they are always the same and use words that don't appear in the exercises. With fewer than 5 sessions (2 check-ins) in a period the result is \"not enough data\". These are indicators, not a clinical assessment: the therapist should decide the thresholds.",
      back: "Back to the therapist area", backCloud: "Back to the shared history", remote: "Cloud data: {n} (read-only)", none: "–", perMonth: "a month", unitS: "s", pct: "%"
    }
  };
  function T() { return C[api.lang()] || C.it; }
  function loc() { return api.lang() === "it" ? "it-IT" : "en-GB"; }
  function num(v, d) { return v == null || !isFinite(v) ? "–" : Number(v).toFixed(d == null ? 0 : d).replace(".", api.lang() === "it" ? "," : "."); }
  function sign(v, d) { return v == null ? "–" : (v > 0 ? "+" : v < 0 ? "−" : "±") + num(Math.abs(v), d); }
  function dstr(t, o) { return new Date(t).toLocaleDateString(loc(), o || { day: "numeric", month: "short", year: "numeric" }); }
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

  /* ---------- the long-term log ---------- */
  var BASE = { good: 1, almost: 0.5, choice: 0.5, model: 0, done: 1, skip: 0, retry: 0 };
  function summarise(sess) {
    if (!sess || sess.mode !== "session" || !Array.isArray(sess.items)) return null;
    var g = {};
    sess.items.forEach(function (it) {
      var x = g[it.game] = g[it.game] || { lv: it.lv, sc: [], hints: [], ms: [], on: [], wpm: [] };
      x.lv = it.lv;
      x.sc.push(it.score != null ? it.score : (BASE[it.result] != null ? BASE[it.result] : null));
      if (it.hints != null) x.hints.push(it.hints);
      if (it.ms != null) x.ms.push(it.ms);
      if (it.meas) { x.on.push(it.meas.onsetMs); x.wpm.push(it.meas.wpm); }
    });
    var out = {};
    Object.keys(g).forEach(function (k) {
      var x = g[k];
      out[k] = { lv: x.lv, n: x.sc.length, s: round(ST.mean(x.sc), 3), hints: round(ST.mean(x.hints), 2), ms: round(ST.median(x.ms), 0),
        on: round(ST.median(x.on), 0), wpm: round(ST.median(x.wpm), 0), msTot: x.ms.reduce(function (a, b) { return a + Math.min(+b || 0, 600000); }, 0) };
    });
    return { id: sess.id, t: new Date(sess.date).getTime(), who: sess.who, g: out };
  }
  function round(v, d) { if (v == null || !isFinite(v)) return null; var p = Math.pow(10, d); return Math.round(v * p) / p; }
  /* SRC: null = this device's data; otherwise data loaded from the cloud for a shared learner (read-only). */
  var SRC = null;
  function localLog() { var l = api.load(KEY); return Array.isArray(l) ? l : []; }
  function log() { return SRC ? SRC.log : localLog(); }
  function upsert(list, e) {
    var i = -1; for (var j = 0; j < list.length; j++) if (list[j].id === e.id) { i = j; break; }
    if (i >= 0) list[i] = e; else list.push(e);
  }
  function record(sess) {
    var e = summarise(sess); if (!e) return;
    var l = localLog(); upsert(l, e); l.sort(function (a, b) { return a.t - b.t; }); api.save(KEY, l.slice(-KEEP));
  }
  /* Older sessions saved before this log existed are added once. */
  function backfill() {
    var l = localLog(), have = {}, n = l.length;
    l.forEach(function (e) { have[e.id] = 1; });
    api.sessions().forEach(function (s) { if (!have[s.id]) { var e = summarise(s); if (e) l.push(e); } });
    if (l.length !== n) { l.sort(function (a, b) { return a.t - b.t; }); api.save(KEY, l.slice(-KEEP)); }
  }

  /* ---------- measures ---------- */
  function abilityOf(game, x) {
    var max = api.maxLevels()[game];
    if (!max || x == null || x.lv == null || x.s == null) return null;
    return (max - x.lv + x.s) / max;
  }
  function langGames() { return api.games(); }
  function measures() {
    var t = T(), list = [
      { key: "ability", label: t.ability, better: "up", min: 0.05, dec: 2, src: "s", get: function (e) { return ST.mean(langGames().map(function (g) { return abilityOf(g, e.g[g]); })); } },
      { key: "onset", label: t.onset, unit: t.unitS, better: "down", min: 0.3, dec: 1, src: "s", get: function (e) { var v = ST.median(Object.keys(e.g).map(function (g) { return e.g[g].on; })); return v == null ? null : v / 1000; } },
      { key: "wpm", label: t.wpm, better: "up", min: 8, dec: 0, src: "s", get: function (e) { return ST.median(Object.keys(e.g).map(function (g) { return e.g[g].wpm; })); } }
    ];
    langGames().forEach(function (g) {
      list.push({ key: "ab_" + g, game: g, label: api.fill(t.abilityOf, { g: api.t().game[g] }), better: "up", min: 0.05, dec: 2, src: "s", get: function (e) { return abilityOf(g, e.g[g]); } });
    });
    list.push(
      { key: "ck_naming", label: t.ckNaming, better: "up", min: 2, dec: 0, src: "c", get: function (k) { return k.naming ? k.naming.correct : null; } },
      { key: "ck_flu", label: t.ckFlu, better: "up", min: 3, dec: 0, src: "c", get: function (k) { return k.flu ? k.flu.count : null; } },
      { key: "ck_rep", label: t.ckRep, better: "up", min: 0.15, dec: 0, pct: true, src: "c", get: function (k) { return k.rep ? k.rep.avg : null; } },
      { key: "ck_wpm", label: t.ckWpm, better: "up", min: 15, dec: 0, src: "c", get: function (k) { return k.desc ? k.desc.wpm : null; } });
    return list;
  }
  function settingsP() { var s = api.load("progress_settings") || {}; return { k: [1.5, 2, 3].indexOf(+s.k) >= 0 ? +s.k : 2, run: [2, 3, 4, 5].indexOf(+s.run) >= 0 ? +s.run : 3 }; }
  function checkins() { return SRC ? SRC.checkins : window.POG.checkins ? window.POG.checkins.list() : []; }
  function pointsFor(m, who, from, to) {
    var src = m.src === "c" ? checkins().map(function (k) { return { t: new Date(k.date).getTime(), who: k.who, raw: k }; })
      : log().map(function (e) { return { t: e.t, who: e.who, raw: e }; });
    return src.filter(function (p) { return (who === "all" || p.who === who) && (from == null || p.t >= from) && (to == null || p.t < to); })
      .map(function (p) { return { t: p.t, y: m.get(p.raw), raw: p.raw }; }).filter(function (p) { return p.y != null && isFinite(p.y); });
  }
  function fmtVal(m, v) { return v == null ? "–" : m.pct ? Math.round(v * 100) + "%" : num(v, m.dec); }
  function fmtDiff(m, v) { return v == null ? "–" : m.pct ? sign(v * 100, 0) + " pt" : sign(v, m.dec); }

  /* ---------- periods ---------- */
  var V = { preset: "4w", who: "all", measure: "ability", custom: null };
  function ranges() {
    var now = new Date(), end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    if (V.preset === "month") {
      var b0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime(), a0 = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      return { aFrom: a0, aTo: b0, bFrom: b0, bTo: end };
    }
    if (V.preset === "3m") {
      var m3 = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate() + 1).getTime(), m6 = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate() + 1).getTime();
      return { aFrom: m6, aTo: m3, bFrom: m3, bTo: end };
    }
    if (V.preset === "custom" && V.custom) return V.custom;
    return { aFrom: end - 56 * DAY, aTo: end - 28 * DAY, bFrom: end - 28 * DAY, bTo: end };
  }
  function rangeText(from, to) { return dstr(from, { day: "numeric", month: "short" }) + "–" + dstr(to - 1, { day: "numeric", month: "short", year: "numeric" }); }

  /* ---------- comparison ---------- */
  function compareRow(m, r, who, k) {
    var A = pointsFor(m, who, r.aFrom, r.aTo).map(function (p) { return p.y; }), B = pointsFor(m, who, r.bFrom, r.bTo).map(function (p) { return p.y; });
    var minN = m.src === "c" ? 2 : 5;
    return ST.compare(A, B, { better: m.better, k: k, minN: minN, minChange: m.min });
  }
  function verdictPill(v) {
    var t = T(), txt = { better: t.vBetter, stable: t.vStable, worse: t.vWorse, insufficient: t.vNone }[v];
    var cls = { better: "good", stable: "stable", worse: "worse", insufficient: "none" }[v];
    return '<span class="pv ' + cls + '">' + (v === "better" ? "▲ " : v === "worse" ? "▼ " : v === "stable" ? "● " : "") + esc(txt) + '</span>';
  }
  function trendPill(v) {
    var t = T(), txt = { better: t.tBetter, none: t.tNone, worse: t.tWorse, insufficient: t.tShort }[v];
    var cls = { better: "good", none: "stable", worse: "worse", insufficient: "none" }[v];
    return '<span class="pv ' + cls + '">' + (v === "better" ? "▲ " : v === "worse" ? "▼ " : v === "none" ? "● " : "") + esc(txt) + '</span>';
  }
  function compareTable(r, who, keys) {
    var t = T(), k = settingsP().k;
    var rows = measures().filter(function (m) { return !keys || keys.indexOf(m.key) >= 0; }).map(function (m) {
      var c = compareRow(m, r, who, k);
      if (!c.nA && !c.nB) return "";
      return '<tr><td>' + esc(m.label) + '</td><td class="n">' + fmtVal(m, c.medA) + ' <small>(' + c.nA + ')</small></td><td class="n">' + fmtVal(m, c.medB) + ' <small>(' + c.nB + ')</small></td>' +
        '<td class="n">' + fmtDiff(m, c.diff) + '</td><td>' + verdictPill(c.verdict) + '</td></tr>';
    }).join("");
    return '<div class="tbl"><table><thead><tr><th>' + esc(t.colMeasure) + '</th><th>' + esc(t.colA) + '</th><th>' + esc(t.colB) + '</th><th>' + esc(t.colChange) + '</th><th>' + esc(t.colVerdict) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function activityRow(r, who) {
    var t = T();
    function act(from, to) {
      var es = log().filter(function (e) { return e.t >= from && e.t < to && (who === "all" || e.who === who); }), days = {}, ms = 0;
      es.forEach(function (e) { days[dayKey(e.t)] = 1; Object.keys(e.g).forEach(function (g) { ms += e.g[g].msTot || 0; }); });
      return { n: es.length, d: Object.keys(days).length, min: Math.round(ms / 60000) };
    }
    var a = act(r.aFrom, r.aTo), b = act(r.bFrom, r.bTo);
    return '<dl class="rp-stats"><div><dt>' + esc(t.sessions) + '</dt><dd>' + a.n + ' → ' + b.n + '</dd></div><div><dt>' + esc(t.days) + '</dt><dd>' + a.d + ' → ' + b.d + '</dd></div><div><dt>' + esc(t.minutes) + '</dt><dd>' + a.min + ' → ' + b.min + '</dd></div></dl>';
  }

  /* ---------- daily report ---------- */
  function dailyReport(who) {
    var t = T(), l = log().filter(function (e) { return who === "all" || e.who === who; });
    if (!l.length) return '<p class="sub">' + esc(t.noToday) + '</p>';
    var last = l[l.length - 1], key = dayKey(last.t), today = l.filter(function (e) { return dayKey(e.t) === key; });
    var dayStart = new Date(new Date(last.t).toDateString()).getTime();
    var prev = l.filter(function (e) { return e.t < dayStart && e.t >= dayStart - 30 * DAY; }), k = settingsP().k;
    var cols = [
      { key: "s", label: t.colAcc, better: "up", min: 0.1, f: function (v) { return v == null ? "–" : Math.round(v * 100) + "%"; } },
      { key: "hints", label: t.colHints, better: "down", min: 0.5, f: function (v) { return num(v, 1); } },
      { key: "ms", label: t.colTime, better: "down", min: 2000, f: function (v) { return v == null ? "–" : num(v / 1000, 1); } },
      { key: "on", label: t.colOnset, better: "down", min: 300, f: function (v) { return v == null ? "–" : num(v / 1000, 1); } }
    ];
    var games = [];
    today.forEach(function (e) { Object.keys(e.g).forEach(function (g) { if (games.indexOf(g) < 0 && api.t().game[g]) games.push(g); }); });
    var rows = games.map(function (g) {
      var cells = cols.map(function (c) {
        var tv = ST.mean(today.map(function (e) { return e.g[g] ? e.g[g][c.key] : null; }));
        var pv = prev.map(function (e) { return e.g[g] ? e.g[g][c.key] : null; }).filter(function (v) { return v != null; });
        var usual = ST.median(pv), how = "";
        if (tv != null && pv.length >= 5) {
          var thr = Math.max(k * (ST.spread(pv) || 0), c.min), d = tv - usual;
          how = Math.abs(d) <= thr ? "same" : (d > 0) === (c.better === "up") ? "better" : "worse";
        } else if (tv != null) how = "new";
        var mark = { same: "●", better: "▲", worse: "▼", new: "·" }[how] || "";
        var title = { same: t.dSame, better: t.dBetter, worse: t.dWorse, new: t.dNew }[how] || "";
        return '<td class="n"><span class="dv ' + how + '" title="' + esc(title) + '">' + esc(mark) + ' ' + esc(c.f(tv)) + '</span><small>' + esc(t.colUsual.toLowerCase()) + ' ' + esc(c.f(usual)) + '</small></td>';
      }).join("");
      var lv = today[today.length - 1].g[g] && today[today.length - 1].g[g].lv;
      return '<tr><td>' + esc(api.t().game[g] || g) + (lv ? ' <small>· ' + esc(api.t().level) + ' ' + lv + '</small>' : '') + '</td>' + cells + '</tr>';
    }).join("");
    return '<p class="sub">' + esc(api.fill(t.todayOf, { d: dstr(last.t, { weekday: "long", day: "numeric", month: "long" }) })) + '</p>' +
      '<p class="legend"><span class="dv better">▲ ' + esc(t.dBetter) + '</span><span class="dv same">● ' + esc(t.dSame) + '</span><span class="dv worse">▼ ' + esc(t.dWorse) + '</span><span class="dv new">· ' + esc(t.dNew) + '</span></p>' +
      '<div class="tbl"><table><thead><tr><th>' + esc(t.colGame) + '</th>' + cols.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join("") + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ---------- alerts ---------- */
  function alerts(who) {
    var ps = settingsP(), t = T(), out = [];
    measures().filter(function (m) { return m.src === "s"; }).forEach(function (m) {
      var pts = pointsFor(m, who || "all", null, null);
      var a = ST.alert(pts, { better: m.better, k: ps.k, run: ps.run, minBase: 8, window: 30, minChange: m.min });
      if (a) out.push({ m: m, a: a, text: api.fill(t.alertText, { m: m.label, n: ps.run, u: fmtVal(m, a.usual), l: a.last.map(function (p) { return fmtVal(m, p.y); }).join(", ") }) });
    });
    return out;
  }

  /* ---------- trend ---------- */
  function trendBlock(r, who) {
    var t = T(), ms = measures(), m = ms.filter(function (x) { return x.key === V.measure; })[0] || ms[0];
    var pts = pointsFor(m, who, r.aFrom, r.bTo);
    var tr = ST.trend(pts, { better: m.better, minChange: m.min / 2 });
    var marks = [];
    if (m.game) pts.forEach(function (p, i) { if (i && pts[i - 1].raw.g[m.game].lv !== p.raw.g[m.game].lv) marks.push({ t: p.t, label: api.fill(t.levelChange, { a: pts[i - 1].raw.g[m.game].lv, b: p.raw.g[m.game].lv }) }); });
    var smooth = pts.length >= 8 && m.src === "s" ? ST.rollingMedian(pts, 7) : null;
    /* The axis is fitted to the data (with some room), so a real change is visible; its range is printed on the axis. */
    var ys = pts.map(function (p) { return m.pct ? p.y * 100 : p.y; }), lo = Math.min.apply(null, ys.length ? ys : [0]), hi = Math.max.apply(null, ys.length ? ys : [1]);
    var top = m.key.indexOf("ab") === 0 || m.key === "ability" ? 1 : m.key === "ck_naming" ? 10 : m.pct ? 100 : null;
    var pad = Math.max((hi - lo) * 0.25, top === 1 ? 0.05 : 1), axisMin = Math.max(0, lo - pad), axisMax = top != null ? Math.min(top, hi + pad) : null;
    if (top === 1) { axisMin = Math.floor(axisMin * 10) / 10; axisMax = Math.ceil(axisMax * 10) / 10; }
    var chart = window.POG.charts.line(pts.map(function (p) { return { t: p.t, y: m.pct ? p.y * 100 : p.y }; }),
      { title: m.label, unit: m.pct ? "%" : m.unit, locale: loc(), decimals: m.pct ? 0 : m.dec, max: axisMax, min: axisMin,
        smooth: smooth && smooth.map(function (p) { return { t: p.t, y: m.pct ? p.y * 100 : p.y }; }), marks: marks });
    var verdict = { better: t.tBetter, worse: t.tWorse, none: t.tNone, insufficient: t.tShort }[tr.verdict];
    var detail = tr.slopePerMonth != null ? api.fill(t.tDetail, { s: fmtDiff(m, tr.slopePerMonth), p: tr.p < 0.001 ? "< " + num(0.001, 3) : num(tr.p, 3), n: tr.n }) : "";
    var opts = ms.map(function (x) { return '<option value="' + x.key + '"' + (x.key === m.key ? ' selected' : '') + '>' + esc(x.label) + '</option>'; }).join("");
    return '<div class="setrow"><label for="pr-measure">' + esc(t.measure) + '</label><select id="pr-measure">' + opts + '</select></div>' +
      '<p class="sub">' + esc(api.fill(t.trendOf, { a: dstr(r.aFrom), b: dstr(r.bTo - 1) })) + '</p>' +
      '<div class="chart-row one">' + chart + '</div>' +
      '<p class="trend-verdict">' + trendPill(tr.verdict) + (detail ? ' <small>' + esc(detail) + '</small>' : '') + '</p>';
  }

  /* ---------- screen ---------- */
  function view() {
    var t = T(), r = ranges(), who = V.who, ps = settingsP(), al = alerts(who), f = api.flashText();
    var presets = [["4w", t.p4w], ["month", t.pMonth], ["3m", t.p3m], ["custom", t.pCustom]].map(function (p) { return '<option value="' + p[0] + '"' + (V.preset === p[0] ? ' selected' : '') + '>' + esc(p[1]) + '</option>'; }).join("");
    var whos = [["all", t.whoAll], ["solo", t.whoSolo], ["assist", t.whoAssist]].map(function (p) { return '<option value="' + p[0] + '"' + (V.who === p[0] ? ' selected' : '') + '>' + esc(p[1]) + '</option>'; }).join("");
    var iso = function (ms) { var d = new Date(ms); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
    var custom = V.preset === "custom" ? '<div class="pr-dates">' +
      [["pr-af", t.aFrom, r.aFrom], ["pr-at", t.aTo, r.aTo - DAY], ["pr-bf", t.bFrom, r.bFrom], ["pr-bt", t.bTo, r.bTo - DAY]].map(function (x) {
        return '<label>' + esc(x[1]) + ' <input type="date" id="' + x[0] + '" value="' + iso(x[2]) + '"></label>';
      }).join("") + '<button class="secondary" data-act="pr-apply">' + esc(t.apply) + '</button></div>' : '';
    var kOpts = [1.5, 2, 3].map(function (k) { return '<option value="' + k + '"' + (ps.k === k ? ' selected' : '') + '>' + esc(api.fill(t.kOpt, { k: num(k, k % 1 ? 1 : 0) })) + '</option>'; }).join("");
    var rOpts = [2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (ps.run === n ? ' selected' : '') + '>' + esc(api.fill(t.runOpt, { n: n })) + '</option>'; }).join("");
    return api.header(false) + '<section class="card"><h1 class="instr">' + esc(t.title) + '</h1>' +
      (SRC ? '<p class="tag">' + esc(api.fill(t.remote, { n: SRC.name || "" })) + '</p>' : '') + '<p class="sub">' + esc(t.intro) + '</p>' +
      '<div class="report">' +
      '<h2>' + esc(t.alerts) + '</h2>' + (al.length ? '<ul class="alerts">' + al.map(function (a) { return '<li>⚠ ' + esc(a.text) + '</li>'; }).join("") + '</ul>' : '<p class="note">' + esc(t.noAlerts) + '</p>') +
      '<div class="pr-controls"><div class="setrow"><label for="pr-period">' + esc(t.period) + '</label><select id="pr-period">' + presets + '</select></div>' +
      '<div class="setrow"><label for="pr-who">' + esc(t.who) + '</label><select id="pr-who">' + whos + '</select></div>' + custom + '</div>' +
      '<h2>' + esc(t.today) + '</h2>' + dailyReport(who) +
      '<h2>' + esc(t.cmp) + '</h2><p class="sub">' + esc(api.fill(t.cmpOf, { a: rangeText(r.aFrom, r.aTo), b: rangeText(r.bFrom, r.bTo) })) + '</p>' +
      activityRow(r, who) + compareTable(r, who) +
      '<h2>' + esc(t.trend) + '</h2>' + trendBlock(r, who) +
      '<h2>' + esc(t.settings) + '</h2>' +
      '<div class="setrow"><label for="pr-k">' + esc(t.kLabel) + '</label><select id="pr-k">' + kOpts + '</select></div>' +
      '<div class="setrow"><label for="pr-run">' + esc(t.runLabel) + '</label><select id="pr-run">' + rOpts + '</select></div>' +
      (f ? '<p class="nudge">' + esc(f) + '</p>' : '') +
      '<div class="row-actions"><button class="secondary" data-act="pr-save">' + esc(t.save) + '</button></div>' +
      '<p class="note">' + esc(t.method) + '</p></div>' +
      '<button class="link" data-act="pr-back">' + esc(SRC ? t.backCloud : t.back) + '</button></section>';
  }

  var ext = window.POG.ext;
  /* Local data needs the therapist PIN; cloud data was already checked by the database (shared profiles only). */
  ext.screens.progress = function () { return SRC || api.therapistUnlocked() ? view() : api.therapistView(); };
  ext.actions.progress = function () { SRC = null; backfill(); api.go("progress"); };
  ext.actions["pr-back"] = function () {
    if (SRC) { SRC = null; api.go("home"); if (window.POG.therapistCloud) window.POG.therapistCloud.show(); return; }
    api.go("therapist");
  };
  ext.actions["pr-apply"] = function () {
    var g = function (id) { var el = document.getElementById(id); return el && el.value ? new Date(el.value + "T00:00:00").getTime() : null; };
    var af = g("pr-af"), at = g("pr-at"), bf = g("pr-bf"), bt = g("pr-bt");
    if (af != null && at != null && bf != null && bt != null && at >= af && bt >= bf) V.custom = { aFrom: af, aTo: at + DAY, bFrom: bf, bTo: bt + DAY };
    api.render();
  };
  ext.actions["pr-save"] = function () {
    var k = document.getElementById("pr-k"), r = document.getElementById("pr-run");
    api.save("progress_settings", { k: k ? +k.value : 2, run: r ? +r.value : 3 }); api.flash(T().saved); api.render();
  };
  document.addEventListener("change", function (e) {
    if (api.screen() !== "progress" || !e.target) return;
    var id = e.target.id;
    if (id === "pr-period") { V.preset = e.target.value; if (V.preset === "custom" && !V.custom) { var r = ranges(); V.custom = null; V.custom = { aFrom: r.aFrom, aTo: r.aTo, bFrom: r.bFrom, bTo: r.bTo }; } api.render(); }
    if (id === "pr-who") { V.who = e.target.value; api.render(); }
    if (id === "pr-measure") { V.measure = e.target.value; api.render(); }
  });
  window.addEventListener("pog:profile-change", function () { SRC = null; V = { preset: "4w", who: "all", measure: "ability", custom: null }; });

  function openRemote(data) { SRC = { name: data.name, log: data.log || [], checkins: data.checkins || [] }; V = { preset: "4w", who: "all", measure: "ability", custom: null }; api.go("progress"); }
  function localAlerts() { var keep = SRC; SRC = null; try { return alerts("all"); } finally { SRC = keep; } }
  window.POG.progress = { record: record, backfill: backfill, log: log, alerts: alerts, localAlerts: localAlerts, openRemote: openRemote, compareTable: compareTable, activityRow: activityRow, summarise: summarise, label: function () { return T().btn; } };
  try { backfill(); } catch (e) {}
})();
