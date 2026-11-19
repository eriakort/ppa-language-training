/*
 * Unified Clinician Domain Profile & Physician / SLP Visit Brief
 * (behind the Therapist / Caregiver PIN).
 *
 * Synthesizes all 6 device-local clinical data streams into 5 neurological language domains:
 *   1. Lexical retrieval & semantic memory (naming, associations, Word Bank, fluency)
 *   2. Morphosyntax & sentence building (sentence variants, inflection, cloze)
 *   3. Repetition, phonology & motor speech (repeat, phon, soundspan, speech rate/pauses)
 *   4. Reading & written expression / CART (reading, everyday functional reading, writing_sessions)
 *   5. Functional everyday communication (caregiver FC index, picture description ICUs, dialogue)
 *
 * Generates an inline SVG domain trajectory comparison (Current vs Prior window),
 * objective clinical pattern observations, and a one-click copyable Visit Brief.
 * Everything stays strictly on this device; indicators support clinical review, not diagnosis.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  if (!api) return;
  var esc = api.esc;
  var DAY = 86400000;

  var DOMAIN_KEYS = ["lexical", "syntax", "speech", "literacy", "functional"];

  var C = {
    it: {
      btn: "Quadro clinico e scheda visita",
      title: "Quadro clinico per domini PPA",
      intro: "Sintesi locale su 5 domini linguistici da tutte le prove del dispositivo, con confronto sul periodo precedente e scheda pronta per neurologo o logopedista.",
      windowLabel: "Finestra",
      windows: { "7": "Ultimi 7 giorni", "30": "Ultimi 30 giorni", "90": "Ultimi 90 giorni" },
      curCol: "Attuale",
      prevCol: "Precedente",
      deltaCol: "Variazione",
      noData: "Nessun dato",
      chartTitle: "Profilo per domini: attuale vs periodo precedente (%)",
      legendCur: "Periodo attuale",
      legendPrev: "Periodo precedente",
      obsTitle: "Indicatori clinici emersi",
      obsNone: "Servono più dati tra controlli, esercizi mirati, scrittura o diario per evidenziare pattern specifici.",
      briefTitle: "Scheda per visita medica / logopedica",
      briefHelp: "Testo neutro pronto da incollare in cartella clinica o inviare prima della visita.",
      copyBtn: "📋 Copia scheda visita",
      copied: "Scheda visita copiata negli appunti.",
      copyFail: "Copia dal riquadro qui sotto.",
      back: "Torna all'area logopedista",
      disclaimer: "Indicatori quantitativi locali per il confronto con lo specialista; non costituiscono una diagnosi clinica.",
      domains: {
        lexical: "Lessico e memoria semantica",
        syntax: "Morfosintassi e costruzione frasi",
        speech: "Ripetizione, suoni e fluenza motoria",
        literacy: "Lettura e scrittura funzionale (CART)",
        functional: "Comunicazione nella vita quotidiana"
      },
      domSub: {
        lexical: "Denominazione, parole da conservare, reti semantiche",
        syntax: "Ordine parole, morfologia, completamento frasi",
        speech: "Ripetizione, sillabe, memoria fonologica, velocità",
        literacy: "Lettura quotidiana, ortografia e copia-richiamo",
        functional: "Diario del familiare, descrizione scene, dialoghi"
      },
      trendUp: "In aumento",
      trendDown: "In calo",
      trendStable: "Stabile",
      trendNew: "Solo attuale",
      trendEmpty: "Dati insufficienti",
      sigCount: "{n} misure",
      obsFluDivSem: "Fluenza semantica/lettera: rapporto {r} ({a} animali vs {l} per lettera) — profilo coerente con relativa preservazione semantica o maggiore impegno fonemico.",
      obsFluDivCat: "Fluenza semantica/lettera: rapporto {r} ({a} animali vs {l} per lettera) — fluenza per categoria ridotta rispetto a quella fonemica.",
      obsCueSem: "Profilo degli aiuti: gli indizi semantici ({s}) aiutano più di quelli fonemici ({p}); autonome {i}%.",
      obsCuePhon: "Profilo degli aiuti: gli indizi fonemici/iniziali ({p}) sbloccano più parole di quelli semantici ({s}); autonome {i}%.",
      obsCueIndep: "Profilo degli aiuti: {i}% di risposte autonome su {n} prove registrate.",
      obsWrSurface: "Scrittura (CART): errori prevalentemente fonetici/superficiali ({sf} su {tot}); recupero con copia-richiamo su {ca} prove.",
      obsWrOmit: "Scrittura (CART): prevalgono omissioni o riduzioni ortografiche ({om} su {tot}); utile continuare la copia guidata.",
      obsWrSummary: "Scrittura (CART): precisione complessiva {acc}% su {tot} prove.",
      obsAlert: "Avviso andamento ({m}): ultime {n} sessioni sotto il valore abituale.",
      obsCareTags: "Contesto segnalato dal familiare negli ultimi ingressi: {tags}.",
      briefHead: "SCHEDA DI RIEPILOGO CLINICO (USO INTERNO VISITA) · {date}",
      briefPatient: "Profilo: {name} · Finestra: ultimi {days} giorni vs {days} precedenti",
      briefDomainsHead: "DOMINI LINGUISTICI (0–100%):",
      briefObsHead: "PATTERN E INDICATORI:",
      briefCareHead: "ULTIMA NOTA FAMILIARE:",
      briefFooter: "Nota: dati raccolti localmente dall'app di esercizio linguistico; non sostituisce la valutazione clinica."
    },
    en: {
      btn: "Clinical profile & visit brief",
      title: "Clinician domain profile & visit brief",
      intro: "Local synthesis of all device streams across 5 core PPA language domains, compared against the prior window with a structured brief ready for clinic visits.",
      windowLabel: "Time window",
      windows: { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" },
      curCol: "Current",
      prevCol: "Prior",
      deltaCol: "Change",
      noData: "No data",
      chartTitle: "Domain profile: current vs prior window (%)",
      legendCur: "Current window",
      legendPrev: "Prior window",
      obsTitle: "Clinical pattern highlights",
      obsNone: "Complete more check-ins, targeted drills, writing items, or caregiver notes to surface longitudinal patterns.",
      briefTitle: "Physician / SLP visit brief",
      briefHelp: "Clean plain-text summary ready to paste into clinical notes ahead of an appointment.",
      copyBtn: "📋 Copy visit brief",
      copied: "Visit brief copied to clipboard.",
      copyFail: "Copy from the box below.",
      back: "Back to the therapist area",
      disclaimer: "Local quantitative indicators to support clinician review; not a standalone diagnostic assessment.",
      domains: {
        lexical: "Lexical retrieval & semantics",
        syntax: "Morphosyntax & sentence building",
        speech: "Repetition, phonology & motor speech",
        literacy: "Reading & written expression (CART)",
        functional: "Functional everyday communication"
      },
      domSub: {
        lexical: "Naming, Word Bank retention, semantic links",
        syntax: "Word order, inflection, sentence cloze",
        speech: "Repetition, syllable span, speech timing",
        literacy: "Everyday reading, spelling & CART recall",
        functional: "Caregiver log, scene concepts, dialogue"
      },
      trendUp: "Higher",
      trendDown: "Lower",
      trendStable: "Stable",
      trendNew: "Current only",
      trendEmpty: "Insufficient data",
      sigCount: "{n} samples",
      obsFluDivSem: "Fluency ratio (animal / letter): {r} ({a} animals vs {l} letter words) — relative category strength vs phonemic initiation demand.",
      obsFluDivCat: "Fluency ratio (animal / letter): {r} ({a} animals vs {l} letter words) — category retrieval lower than phonemic fluency.",
      obsCueSem: "Cue responsiveness: semantic clues ({s}) helped more often than phonemic cues ({p}); {i}% uncued.",
      obsCuePhon: "Cue responsiveness: phonemic / first-sound cues ({p}) helped more often than semantic clues ({s}); {i}% uncued.",
      obsCueIndep: "Cue responsiveness: {i}% uncued retrieval across {n} recorded trials.",
      obsWrSurface: "Written expression (CART): primarily surface-phonetic spelling errors ({sf} of {tot} items); CART copy-recall supported {ca} items.",
      obsWrOmit: "Written expression (CART): letter/word omissions predominated ({om} of {tot} items); continue CART visual copying.",
      obsWrSummary: "Written expression (CART): {acc}% overall score across {tot} items.",
      obsAlert: "Stability alert ({m}): last {n} sessions fell below usual range.",
      obsCareTags: "Recent caregiver context tags: {tags}.",
      briefHead: "CLINICAL VISIT BRIEF (LOCAL PRACTICE SUMMARY) · {date}",
      briefPatient: "Profile: {name} · Window: last {days} days vs prior {days} days",
      briefDomainsHead: "LANGUAGE DOMAINS (0–100%):",
      briefObsHead: "PATTERN HIGHLIGHTS:",
      briefCareHead: "LATEST CAREGIVER NOTE:",
      briefFooter: "Note: locally recorded indicators from language practice software; not a diagnostic evaluation."
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function loc() { return api.lang() === "it" ? "it-IT" : "en-GB"; }

  function mean(arr) {
    var v = (arr || []).filter(function (x) { return x != null && isFinite(x); });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function inRange(dateStr, fromMs, toMs) {
    var ms = new Date(dateStr).getTime();
    return isFinite(ms) && ms >= fromMs && ms < toMs;
  }

  function scoreSessionItem(it) {
    if (!it) return null;
    if (it.score != null && isFinite(+it.score)) return clamp01(+it.score);
    if (it.result === "good" || it.result === "done") return 1;
    if (it.result === "almost" || it.result === "choice") return 0.5;
    if (it.result === "model" || it.result === "skip" || it.result === "retry") return 0;
    return null;
  }

  function collectStreams() {
    var sessions = api.sessions ? api.sessions() : [];
    var checkins = window.POG.checkins && window.POG.checkins.list ? window.POG.checkins.list() : [];
    var variants = window.POG.variants && window.POG.variants.listSessions ? window.POG.variants.listSessions() : [];
    var functional = window.POG.functional && window.POG.functional.listSessions ? window.POG.functional.listSessions() : [];
    var wordbank = window.POG.wordbank && window.POG.wordbank.listSessions ? window.POG.wordbank.listSessions() : [];
    var writing = window.POG.writing && window.POG.writing.listSessions ? window.POG.writing.listSessions() : [];
    var carelog = window.POG.carelog && window.POG.carelog.list ? window.POG.carelog.list() : [];
    return {
      sessions: sessions,
      checkins: checkins,
      variants: variants,
      functional: functional,
      wordbank: wordbank,
      writing: writing,
      carelog: carelog
    };
  }

  function windowScores(streams, fromMs, toMs) {
    var buckets = { lexical: [], syntax: [], speech: [], literacy: [], functional: [] };

    streams.sessions.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs)) return;
      (s.items || []).forEach(function (it) {
        var v = scoreSessionItem(it);
        if (v == null) return;
        var g = it.game;
        if (g === "name" || g === "describe" || g === "mystery" || g === "crossword") buckets.lexical.push(v);
        else if (g === "seq") buckets.syntax.push(v);
        else if (g === "echo" || g === "wordbuild") buckets.speech.push(v);
        else if (g === "read") buckets.literacy.push(v);
        else if (g === "script") buckets.functional.push(v);
      });
    });

    streams.variants.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs)) return;
      (s.items || []).forEach(function (it) {
        var v = scoreSessionItem(it);
        if (v == null) return;
        if (it.game === "semantic") buckets.lexical.push(v);
        else if (it.game === "sentence") buckets.syntax.push(v);
        else if (it.game === "soundspan") buckets.speech.push(v);
      });
    });

    streams.wordbank.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs)) return;
      if (s.retentionRate != null && isFinite(+s.retentionRate)) buckets.lexical.push(clamp01(+s.retentionRate));
    });

    streams.functional.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs)) return;
      (s.items || []).forEach(function (it) {
        var v = scoreSessionItem(it);
        if (v != null) buckets.literacy.push(v);
      });
    });

    streams.writing.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.literacy.push(clamp01(+s.accuracy));
    });

    streams.checkins.forEach(function (k) {
      if (!inRange(k.date, fromMs, toMs)) return;
      if (k.naming && k.naming.correct != null) buckets.lexical.push(clamp01(k.naming.correct / 10));
      if (k.rep && k.rep.avg != null) buckets.speech.push(clamp01(+k.rep.avg));
      if (k.desc && k.desc.icu != null) buckets.functional.push(clamp01(k.desc.icu / (k.desc.icuTotal || 12)));
    });

    streams.carelog.forEach(function (c) {
      if (!inRange(c.date, fromMs, toMs)) return;
      if (c.fcIndex != null && isFinite(+c.fcIndex)) buckets.functional.push(clamp01(+c.fcIndex));
    });

    var out = {};
    DOMAIN_KEYS.forEach(function (k) {
      var m = mean(buckets[k]);
      out[k] = {
        pct: m == null ? null : Math.round(m * 100),
        n: buckets[k].length
      };
    });
    return out;
  }

  function deriveObservations(streams, curFrom, curTo, t) {
    var obs = [];
    /* 1. Fluency divergence (animal vs phonemic letter) from latest check-ins */
    var recentChecks = streams.checkins.filter(function (k) { return inRange(k.date, curFrom, curTo); });
    if (!recentChecks.length) recentChecks = streams.checkins;
    var bothChecks = recentChecks.filter(function (k) {
      return k.flu && k.flu.count != null && k.letterFlu && k.letterFlu.count > 0;
    });
    if (bothChecks.length) {
      var lastK = bothChecks[bothChecks.length - 1];
      var aCnt = lastK.flu.count, lCnt = lastK.letterFlu.count;
      var ratio = Math.round((aCnt / lCnt) * 100) / 100;
      if (ratio >= 2.2) {
        obs.push(api.fill(t.obsFluDivSem, { r: String(ratio), a: aCnt, l: lCnt }));
      } else if (ratio <= 0.9) {
        obs.push(api.fill(t.obsFluDivCat, { r: String(ratio), a: aCnt, l: lCnt }));
      }
    }

    /* 2. Cue responsiveness (SFA vs PCA) via wordbank */
    var wb = window.POG.wordbank;
    if (wb && wb.computeCueErrorProfile) {
      var cuedSess = streams.sessions.filter(function (s) { return inRange(s.date, curFrom, curTo); });
      var cuedWb = streams.wordbank.filter(function (s) { return inRange(s.date, curFrom, curTo); });
      var cp = wb.computeCueErrorProfile(cuedSess.length ? cuedSess : streams.sessions, cuedWb.length ? cuedWb : streams.wordbank);
      if (cp && cp.totalCued > 0) {
        var indepPct = Math.round((cp.cues.independent / cp.totalCued) * 100);
        if (cp.cues.semantic > cp.cues.phonemic && cp.cues.semantic > 0) {
          obs.push(api.fill(t.obsCueSem, { s: cp.cues.semantic, p: cp.cues.phonemic, i: indepPct }));
        } else if (cp.cues.phonemic > cp.cues.semantic && cp.cues.phonemic > 0) {
          obs.push(api.fill(t.obsCuePhon, { s: cp.cues.semantic, p: cp.cues.phonemic, i: indepPct }));
        } else {
          obs.push(api.fill(t.obsCueIndep, { i: indepPct, n: cp.totalCued }));
        }
      }
    }

    /* 3. Written expression / dysgraphia profile */
    var wr = window.POG.writing;
    if (wr && wr.computeWritingProfile) {
      var wrSlice = streams.writing.filter(function (s) { return inRange(s.date, curFrom, curTo); });
      if (wrSlice.length) {
        var wp = wr.computeWritingProfile(wrSlice);
        if (wp.total > 0) {
          if (wp.errors.surface_phonetic >= wp.errors.omission && wp.errors.surface_phonetic > 0) {
            obs.push(api.fill(t.obsWrSurface, { sf: wp.errors.surface_phonetic, tot: wp.total, ca: wp.cartAssisted }));
          } else if (wp.errors.omission > 0) {
            obs.push(api.fill(t.obsWrOmit, { om: wp.errors.omission, tot: wp.total }));
          } else if (wp.accuracy != null) {
            obs.push(api.fill(t.obsWrSummary, { acc: Math.round(wp.accuracy * 100), tot: wp.total }));
          }
        }
      }
    }

    /* 4. Stability alerts from progress engine */
    if (window.POG.progress && window.POG.progress.localAlerts) {
      var als = window.POG.progress.localAlerts();
      als.slice(0, 2).forEach(function (al) {
        obs.push(api.fill(t.obsAlert, { m: al.m.label, n: (al.a && al.a.last ? al.a.last.length : 3) }));
      });
    }

    /* 5. Recent caregiver context tags */
    var cg = window.POG.carelog;
    var recentCare = streams.carelog.filter(function (c) { return inRange(c.date, curFrom, curTo); });
    if (recentCare.length && cg && cg.tagLabel) {
      var tagCounts = {};
      recentCare.forEach(function (e) {
        (e.tags || []).forEach(function (tg) { tagCounts[tg] = (tagCounts[tg] || 0) + 1; });
      });
      var tagKeys = Object.keys(tagCounts).sort(function (a, b) { return tagCounts[b] - tagCounts[a]; }).slice(0, 3);
      if (tagKeys.length) {
        obs.push(api.fill(t.obsCareTags, { tags: tagKeys.map(function (k) { return cg.tagLabel(k); }).join(", ") }));
      }
    }

    return obs;
  }

  function buildBrief(windowDays, nowMs) {
    var t = T();
    var days = windowDays === 7 || windowDays === 90 ? windowDays : 30;
    var end = nowMs != null ? nowMs : Date.now();
    var curFrom = end - days * DAY;
    var prevFrom = curFrom - days * DAY;
    var streams = collectStreams();
    var cur = windowScores(streams, curFrom, end);
    var prev = windowScores(streams, prevFrom, curFrom);

    var domains = DOMAIN_KEYS.map(function (k) {
      var c = cur[k], p = prev[k];
      var delta = c.pct != null && p.pct != null ? c.pct - p.pct : null;
      var status = "empty";
      if (c.pct != null && p.pct != null) {
        status = delta >= 5 ? "up" : delta <= -5 ? "down" : "stable";
      } else if (c.pct != null) {
        status = "new";
      }
      return {
        key: k,
        name: t.domains[k],
        sub: t.domSub[k],
        cur: c.pct,
        curN: c.n,
        prev: p.pct,
        prevN: p.n,
        delta: delta,
        status: status
      };
    });

    var observations = deriveObservations(streams, curFrom, end, t);
    var notesCare = streams.carelog.filter(function (c) { return c.note; });
    var latestNote = notesCare.length ? notesCare[notesCare.length - 1] : null;

    return {
      windowDays: days,
      curFrom: curFrom,
      curTo: end,
      prevFrom: prevFrom,
      domains: domains,
      observations: observations,
      latestNote: latestNote
    };
  }

  function renderDomainSvg(domains, t) {
    var w = 640, rowH = 54, padT = 18, padB = 18, labelW = 225, barMaxW = 310, h = padT + domains.length * rowH + padB;
    var rows = domains.map(function (d, idx) {
      var y = padT + idx * rowH;
      var curW = d.cur != null ? Math.max(4, Math.round((d.cur / 100) * barMaxW)) : 0;
      var prevW = d.prev != null ? Math.max(4, Math.round((d.prev / 100) * barMaxW)) : 0;
      var shortName = d.name.length > 26 ? d.name.slice(0, 25) + "…" : d.name;
      return '<g>' +
        '<text x="6" y="' + (y + 22) + '" class="br-svg-lbl">' + esc(shortName) + '</text>' +
        '<rect x="' + labelW + '" y="' + (y + 8) + '" width="' + barMaxW + '" height="12" rx="6" class="br-svg-track"/>' +
        (d.prev != null ? '<rect x="' + labelW + '" y="' + (y + 24) + '" width="' + prevW + '" height="10" rx="5" class="br-svg-prev"/>' : '') +
        (d.cur != null ? '<rect x="' + labelW + '" y="' + (y + 8) + '" width="' + curW + '" height="12" rx="6" class="br-svg-cur"/>' : '') +
        '<text x="' + (labelW + barMaxW + 14) + '" y="' + (y + 20) + '" class="br-svg-val">' + esc(d.cur != null ? d.cur + "%" : "–") + '</text>' +
        '</g>';
    }).join("");

    return '<div class="br-chartwrap">' +
      '<p class="br-chart-title">' + esc(t.chartTitle) + '</p>' +
      '<svg class="br-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(t.chartTitle) + '">' + rows + '</svg>' +
      '<div class="br-legend"><span><i class="sw cur"></i> ' + esc(t.legendCur) + '</span><span><i class="sw prev"></i> ' + esc(t.legendPrev) + '</span></div>' +
      '</div>';
  }

  function buildPlainTextBrief(brief, profile) {
    var t = T();
    var lines = [];
    var today = new Date().toLocaleDateString(loc(), { day: "numeric", month: "short", year: "numeric" });
    lines.push(api.fill(t.briefHead, { date: today }));
    lines.push(api.fill(t.briefPatient, { name: (profile && profile.name) || "—", days: brief.windowDays }));
    lines.push("");
    lines.push(t.briefDomainsHead);
    brief.domains.forEach(function (d) {
      var curTxt = d.cur != null ? d.cur + "%" : t.noData;
      var prevTxt = d.prev != null ? " (" + t.prevCol + ": " + d.prev + "%)" : "";
      var delTxt = d.delta != null ? " [" + (d.delta >= 0 ? "+" : "") + d.delta + " pt]" : "";
      lines.push("- " + d.name + ": " + curTxt + prevTxt + delTxt);
    });
    if (brief.observations.length) {
      lines.push("");
      lines.push(t.briefObsHead);
      brief.observations.forEach(function (o) { lines.push("* " + o); });
    }
    if (brief.latestNote && brief.latestNote.note) {
      lines.push("");
      lines.push(t.briefCareHead);
      lines.push(new Date(brief.latestNote.date).toLocaleDateString(loc()) + ": " + brief.latestNote.note);
    }
    lines.push("");
    lines.push(t.briefFooter);
    return lines.join("\n");
  }

  var V = { windowDays: 30 };

  function viewScreen() {
    var t = T();
    var prof = api.getProfile ? api.getProfile() : {};
    var b = buildBrief(V.windowDays);
    var briefTxt = buildPlainTextBrief(b, prof);
    var f = api.flashText ? api.flashText() : "";

    var seg = '<div class="seg" role="group" aria-label="' + esc(t.windowLabel) + '">' +
      [7, 30, 90].map(function (d) {
        return '<button type="button" data-act="br-win" data-d="' + d + '" aria-pressed="' + (V.windowDays === d) + '">' + esc(t.windows[String(d)]) + '</button>';
      }).join("") + '</div>';

    var cards = '<div class="br-grid">' + b.domains.map(function (d) {
      var badgeCls = d.status === "up" ? "good" : d.status === "down" ? "worse" : "stable";
      var badgeTxt = d.status === "up" ? "▲ " + t.trendUp :
        d.status === "down" ? "▼ " + t.trendDown :
        d.status === "stable" ? "● " + t.trendStable :
        d.status === "new" ? "· " + t.trendNew : t.trendEmpty;
      var deltaStr = d.delta != null ? ((d.delta >= 0 ? "+" : "") + d.delta + " pt") : "–";
      return '<div class="br-card">' +
        '<div class="br-card-top"><div><strong>' + esc(d.name) + '</strong><p class="note">' + esc(d.sub) + '</p></div>' +
        '<span class="pv ' + badgeCls + '">' + esc(badgeTxt) + '</span></div>' +
        '<div class="br-nums">' +
        '<div><span>' + esc(t.curCol) + '</span><strong class="br-score">' + esc(d.cur != null ? d.cur + "%" : "–") + '</strong></div>' +
        '<div><span>' + esc(t.prevCol) + '</span><strong>' + esc(d.prev != null ? d.prev + "%" : "–") + '</strong></div>' +
        '<div><span>' + esc(t.deltaCol) + '</span><strong>' + esc(deltaStr) + '</strong></div>' +
        '</div>' +
        (d.curN ? '<p class="note br-sig">' + esc(api.fill(t.sigCount, { n: d.curN })) + '</p>' : '') +
        '</div>';
    }).join("") + '</div>';

    var obsHtml = b.observations.length
      ? '<ul class="br-obs">' + b.observations.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join("") + '</ul>'
      : '<p class="sub">' + esc(t.obsNone) + '</p>';

    return api.header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.title) + '</h1>' +
      '<p class="sub">' + esc(t.intro) + '</p>' +
      seg +
      cards +
      renderDomainSvg(b.domains, t) +
      '<div class="report">' +
      '<h2>' + esc(t.obsTitle) + '</h2>' + obsHtml +
      '<h2>' + esc(t.briefTitle) + '</h2>' +
      '<p class="note">' + esc(t.briefHelp) + '</p>' +
      '<div class="row-actions"><button type="button" class="secondary" data-act="brief-copy">' + esc(t.copyBtn) + '</button></div>' +
      (f ? '<p class="nudge" role="status">' + esc(f) + '</p>' : '') +
      '<textarea readonly id="brief-text" class="br-pre" rows="8">' + esc(briefTxt) + '</textarea>' +
      '<p class="note">' + esc(t.disclaimer) + '</p>' +
      '</div>' +
      '<button type="button" class="link" data-act="br-back">' + esc(t.back) + '</button>' +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.brief = function () { return api.therapistUnlocked() ? viewScreen() : api.therapistView(); };
  A.brief = function () { api.go("brief"); };
  A["br-back"] = function () { api.go("therapist"); };
  A["br-win"] = function (b) {
    var d = +b.getAttribute("data-d");
    V.windowDays = d === 7 || d === 90 ? d : 30;
    api.render();
  };
  A["brief-copy"] = function () {
    var t = T(), el = document.getElementById("brief-text");
    var txt = el ? el.value : buildPlainTextBrief(buildBrief(V.windowDays), api.getProfile ? api.getProfile() : {});
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        if (api.flash) api.flash(t.copied);
        api.render();
      }, function () {
        if (el) { el.focus(); el.select(); }
        if (api.flash) api.flash(t.copyFail);
        api.render();
      });
    } else {
      if (el) { el.focus(); el.select(); }
      if (api.flash) api.flash(t.copied);
      api.render();
    }
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "brief") api.render();
  });
  window.addEventListener("pog:profile-change", function () {
    V = { windowDays: 30 };
  });

  window.POG.brief = {
    DOMAIN_KEYS: DOMAIN_KEYS,
    buildBrief: buildBrief,
    buildPlainTextBrief: buildPlainTextBrief,
    renderDomainSvg: renderDomainSvg,
    label: function () { return T().btn; }
  };
})();
