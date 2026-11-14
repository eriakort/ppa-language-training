/*
 * Printable summary for the therapist (inside the therapist area, behind the PIN).
 * One page per period (3 or 6 months): activity, current levels against the start of the period,
 * speaking measures by month, and the speech check-ins. Printed with the browser's own print
 * dialog, which can also save as PDF. Everything is computed on this device from data already here.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  if (!api || !window.POG.charts) return;
  var esc = api.esc;

  var C = {
    it: {
      title: "Riepilogo per il logopedista", period: "Periodo", m3: "Ultimi 3 mesi", m6: "Ultimi 6 mesi",
      print: "Stampa o salva PDF", printHelp: "Si apre la finestra di stampa del browser: da lì si può anche salvare in PDF.",
      noPrint: "In questa anteprima la stampa non è disponibile: apri l'app dal suo indirizzo per stamparla.",
      back: "Torna all'area logopedista", born: "nato/a nel", from: "dal", to: "al", generated: "Creato il",
      disclaimer: "Riepilogo indicativo creato dall'app di esercizio. Non è una valutazione clinica.",
      act: "Attività", sessions: "Sessioni", days: "Giorni di esercizio", minutes: "Minuti di esercizio (circa)", last: "Ultima sessione", none: "Nessuna sessione nel periodo.",
      lv: "Livelli degli esercizi", lvHelp: "Livello 1 = il più impegnativo. Un numero più alto vuol dire più aiuti.",
      colGame: "Esercizio", colStart: "Inizio periodo", colNow: "Oggi", colChanges: "Cambi di livello", noHist: "–",
      speak: "Misure del parlato", speakHelp: "Medie delle risposte a voce misurate. Inizio = tempo prima della prima parola.",
      colMonth: "Mese", colN: "Risposte misurate", colOnset: "Inizio (s)", colWpm: "Parole/min", colPauses: "Pause", noSpeak: "Nessuna risposta a voce misurata nel periodo.",
      chOnset: "Tempo prima della prima parola", chWpm: "Parole al minuto",
      chk: "Controlli del parlato", noChk: "Nessun controllo nel periodo.",
      chkCols: ["Data", "Modalità", "Nomi (su 10)", "Ripetizione", "Animali", "Parole/min"], solo: "Da solo", assist: "Con aiuto",
      chName: "Nomi detti giusti (su 10)", chFlu: "Animali in un minuto",
      notes: "Note", notesHelp: "Spazio per le note a mano.",
      cmp: "Confronto con il periodo precedente", cmpHelp: "Mediane del periodo (B) e dei {m} mesi prima (A). «Stabile» se la differenza è entro la variazione abituale; dettagli in «Andamento e statistiche»."
    },
    en: {
      title: "Summary for the therapist", period: "Period", m3: "Last 3 months", m6: "Last 6 months",
      print: "Print or save as PDF", printHelp: "This opens the browser's print window, which can also save as PDF.",
      noPrint: "Printing isn't available in this preview: open the app from its own address to print.",
      back: "Back to the therapist area", born: "born", from: "from", to: "to", generated: "Created on",
      disclaimer: "An indicative summary made by the practice app. It is not a clinical assessment.",
      act: "Activity", sessions: "Sessions", days: "Days practised", minutes: "Minutes of practice (approx.)", last: "Last session", none: "No sessions in this period.",
      lv: "Exercise levels", lvHelp: "Level 1 = the most demanding. A higher number means more support.",
      colGame: "Exercise", colStart: "Start of period", colNow: "Today", colChanges: "Level changes", noHist: "–",
      speak: "Speaking measures", speakHelp: "Averages of the measured spoken answers. Onset = time before the first word.",
      colMonth: "Month", colN: "Measured answers", colOnset: "Onset (s)", colWpm: "Words/min", colPauses: "Pauses", noSpeak: "No measured spoken answers in this period.",
      chOnset: "Time before the first word", chWpm: "Words per minute",
      chk: "Speech check-ins", noChk: "No check-ins in this period.",
      chkCols: ["Date", "Mode", "Names (of 10)", "Repetition", "Animals", "Words/min"], solo: "On my own", assist: "With help",
      chName: "Names said correctly (of 10)", chFlu: "Animals in one minute",
      notes: "Notes", notesHelp: "Space for handwritten notes.",
      cmp: "Compared with the previous period", cmpHelp: "Medians for the period (B) and the {m} months before (A). \"Stable\" when the difference is within the usual variation; details in \"Progress and statistics\"."
    }
  };
  var months = 3;
  function T() { return C[api.lang()] || C.it; }
  function loc() { return api.lang() === "it" ? "it-IT" : "en-GB"; }
  function num(v, d) { return v == null ? "–" : Number(v).toFixed(d || 0).replace(".", api.lang() === "it" ? "," : "."); }
  function avg(a) { var v = a.filter(function (x) { return x != null && isFinite(x); }); return v.length ? v.reduce(function (x, y) { return x + y; }, 0) / v.length : null; }
  function day(d, opt) { return new Date(d).toLocaleDateString(loc(), opt || { day: "numeric", month: "long", year: "numeric" }); }
  function table(head, rows) {
    return '<div class="tbl"><table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i ? ' class="n"' : '') + '>' + esc(c) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table></div>';
  }

  /* Everything the page shows, computed from this profile's data on this device. */
  function build(now) {
    var since = new Date(now); since.setMonth(since.getMonth() - months);
    var sinceDay = since.toISOString().slice(0, 10);
    var sessions = api.sessions().filter(function (s) { return new Date(s.date) >= since; });
    var daysSet = {}, ms = 0;
    sessions.forEach(function (s) { daysSet[String(s.date).slice(0, 10)] = 1; (s.items || []).forEach(function (i) { ms += Math.min(+i.ms || 0, 10 * 60000); }); });
    var hist = api.history(), set = api.settings(), t = api.t();
    var levels = api.games().map(function (g) {
      var h = (Array.isArray(hist[g]) ? hist[g] : []).filter(function (x) { return x.d >= sinceDay; }), changes = 0;
      for (var i = 1; i < h.length; i++) if (h[i].lv !== h[i - 1].lv) changes++;
      return { g: g, name: t.game[g] || g, start: h.length ? h[0].lv : null, now: set.levels ? set.levels[g] : null, changes: h.length ? changes : null };
    });
    var byMonth = {}, perSession = [];
    sessions.forEach(function (s) {
      var sp = (s.items || []).filter(function (i) { return i.meas; }).map(function (i) { return i.meas; });
      if (!sp.length) return;
      var k = String(s.date).slice(0, 7);
      (byMonth[k] = byMonth[k] || []).push.apply(byMonth[k], sp);
      perSession.push({ t: new Date(s.date).getTime(), onset: avg(sp.map(function (m) { return m.onsetMs; })), wpm: avg(sp.map(function (m) { return m.wpm; })) });
    });
    var monthRows = Object.keys(byMonth).sort().map(function (k) {
      var m = byMonth[k];
      return { k: k, n: m.length, onset: avg(m.map(function (x) { return x.onsetMs; })), wpm: avg(m.map(function (x) { return x.wpm; })), pauses: avg(m.map(function (x) { return x.pauses; })) };
    });
    var checks = (window.POG.checkins ? window.POG.checkins.list() : []).filter(function (k) { return new Date(k.date) >= since; });
    return { since: since, now: now, sessions: sessions, days: Object.keys(daysSet).length, minutes: Math.round(ms / 60000), levels: levels, months: monthRows, perSession: perSession, checks: checks };
  }

  function view() {
    var c = T(), now = new Date(), d = build(now), prof = api.getProfile() || {}, inHost = api.inHost();
    var last = d.sessions.length ? d.sessions[d.sessions.length - 1].date : null;
    var activity = d.sessions.length
      ? '<dl class="rp-stats"><div><dt>' + esc(c.sessions) + '</dt><dd>' + d.sessions.length + '</dd></div><div><dt>' + esc(c.days) + '</dt><dd>' + d.days + '</dd></div>' +
        '<div><dt>' + esc(c.minutes) + '</dt><dd>' + d.minutes + '</dd></div><div><dt>' + esc(c.last) + '</dt><dd>' + esc(day(last, { day: "numeric", month: "short" })) + '</dd></div></dl>'
      : '<p class="sub">' + esc(c.none) + '</p>';
    var lv = table([c.colGame, c.colStart, c.colNow, c.colChanges], d.levels.map(function (l) {
      return [l.name, l.start == null ? c.noHist : String(l.start), l.now == null ? "–" : String(l.now), l.changes == null ? c.noHist : String(l.changes)];
    }));
    var speak = d.months.length
      ? table([c.colMonth, c.colN, c.colOnset, c.colWpm, c.colPauses], d.months.map(function (m) {
          return [new Date(m.k + "-15").toLocaleDateString(loc(), { month: "long", year: "numeric" }), String(m.n), num(m.onset != null ? m.onset / 1000 : null, 1), num(m.wpm), num(m.pauses, 1)];
        })) +
        '<div class="chart-row">' +
        window.POG.charts.line(d.perSession.map(function (p) { return { t: p.t, y: p.onset != null ? p.onset / 1000 : null }; }), { title: c.chOnset, unit: "s", locale: loc(), decimals: 1 }) +
        window.POG.charts.line(d.perSession.map(function (p) { return { t: p.t, y: p.wpm }; }), { title: c.chWpm, locale: loc() }) + '</div>'
      : '<p class="sub">' + esc(c.noSpeak) + '</p>';
    var chk = d.checks.length
      ? table(c.chkCols, d.checks.map(function (k) {
          return [day(k.date, { day: "numeric", month: "short", year: "numeric" }), k.who === "solo" ? c.solo : c.assist, k.naming ? String(k.naming.correct) : "–",
            k.rep && k.rep.avg != null ? Math.round(k.rep.avg * 100) + "%" : "–", k.flu ? String(k.flu.count) : "–", num(k.desc ? k.desc.wpm : null)];
        })) +
        '<div class="chart-row">' +
        window.POG.charts.line(d.checks.map(function (k) { return { t: new Date(k.date).getTime(), y: k.naming ? k.naming.correct : null }; }), { title: c.chName, max: 10, locale: loc() }) +
        window.POG.charts.line(d.checks.map(function (k) { return { t: new Date(k.date).getTime(), y: k.flu ? k.flu.count : null }; }), { title: c.chFlu, locale: loc() }) + '</div>'
      : '<p class="sub">' + esc(c.noChk) + '</p>';
    var controls = '<div class="rp-controls no-print"><div class="seg" role="group" aria-label="' + esc(c.period) + '">' +
      '<button data-act="rp-period" data-m="3" aria-pressed="' + (months === 3) + '">' + esc(c.m3) + '</button>' +
      '<button data-act="rp-period" data-m="6" aria-pressed="' + (months === 6) + '">' + esc(c.m6) + '</button></div>' +
      (inHost ? '<p class="note">' + esc(c.noPrint) + '</p>' : '<button class="primary" data-act="rp-print">' + esc(c.print) + '</button><p class="note">' + esc(c.printHelp) + '</p>') + '</div>';
    return api.header(false) + '<section class="card">' + controls +
      '<article class="print-area report">' +
      '<header class="rp-head"><h1>' + esc(c.title) + '</h1>' +
      '<p class="rp-who"><strong>' + esc(prof.name || "") + '</strong>' + (prof.year ? ' · ' + esc(c.born) + ' ' + esc(prof.year) : '') + '</p>' +
      '<p class="rp-meta">' + esc(c.period) + ': ' + esc(c.from) + ' ' + esc(day(d.since)) + ' ' + esc(c.to) + ' ' + esc(day(now)) + ' · ' + esc(c.generated) + ' ' + esc(day(now)) + '</p>' +
      '<p class="note">' + esc(c.disclaimer) + '</p></header>' +
      '<h2>' + esc(c.act) + '</h2>' + activity +
      '<h2>' + esc(c.lv) + '</h2><p class="note">' + esc(c.lvHelp) + '</p>' + lv +
      '<h2>' + esc(c.speak) + '</h2><p class="note">' + esc(c.speakHelp) + '</p>' + speak +
      (window.POG.progress ? '<h2>' + esc(c.cmp) + '</h2><p class="note">' + esc(api.fill(c.cmpHelp, { m: months })) + '</p>' +
        window.POG.progress.compareTable({ aFrom: d.since.getTime() - (now.getTime() - d.since.getTime()), aTo: d.since.getTime(), bFrom: d.since.getTime(), bTo: now.getTime() + 1 }, "all", ["ability", "onset", "wpm", "ck_naming", "ck_flu", "ck_rep"]) : '') +
      '<h2>' + esc(c.chk) + '</h2>' + chk +
      '<h2 class="print-only">' + esc(c.notes) + '</h2><div class="rp-notes print-only" aria-hidden="true"></div>' +
      '</article>' +
      '<button class="link no-print" data-act="therapist">' + esc(c.back) + '</button></section>';
  }

  var ext = window.POG.ext;
  ext.screens.report = function () { return api.therapistUnlocked() ? view() : api.therapistView(); };
  ext.actions.report = function () { api.go("report"); };
  ext.actions["rp-period"] = function (b) { months = b.getAttribute("data-m") === "6" ? 6 : 3; api.render(); };
  ext.actions["rp-print"] = function () { try { window.print(); } catch (e) {} };
  window.POG.report = { build: build, setMonths: function (m) { months = m === 6 ? 6 : 3; } };
})();
