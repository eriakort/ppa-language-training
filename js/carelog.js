/*
 * Caregiver Weekly Functional Communication Journal & Partner Strategy Guide
 * (behind the Caregiver / Therapist PIN).
 *
 * Captures real-world everyday communication beyond tablet practice:
 *   - 6 structured domains rated 1..5 (word-finding, spoken comprehension, speech clarity,
 *     everyday reading/writing, communication aids/gestures, confidence & ease)
 *   - Context factors (good day, tired, poor sleep, medication change, strategy helped, noisy setting)
 *   - Brief optional caregiver note (stored strictly on this device; never sent to Supabase)
 *   - Evidence-based Communication Partner Tips tailored by PPA presentation
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  if (!api) return;
  var esc = api.esc;

  var KEEP = 120;
  var DOMAINS = ["wordFind", "understand", "clarity", "readWrite", "aids", "confidence"];
  var TAGS = ["good_day", "tired", "poor_sleep", "med_change", "strategy_helped", "noisy_env"];

  var C = {
    it: {
      btn: "Diario del familiare",
      title: "Diario del familiare e strategie",
      intro: "Registra come va la comunicazione nella vita di tutti i giorni. I voti restano su questo dispositivo e aiutano il neurologo e il logopedista a vedere cosa cambia tra una visita e l'altra.",
      tabLog: "Nuova osservazione",
      tabTips: "Consigli per comunicare",
      dateLabel: "Data",
      scaleNote: "1 = con molto aiuto · 3 = a metà · 5 = come al solito / autonomo",
      domains: {
        wordFind: "Trovare le parole parlando",
        understand: "Capire ciò che gli altri dicono",
        clarity: "Chiarezza e sforzo nel parlare",
        readWrite: "Leggere e scrivere cose di ogni giorno",
        aids: "Uso di tabella, gesti o foto per farsi capire",
        confidence: "Serenità e voglia di comunicare"
      },
      tagsLabel: "Contesto di oggi (facoltativo)",
      tags: {
        good_day: "Giornata serena",
        tired: "Stanchezza",
        poor_sleep: "Sonno scarso",
        med_change: "Cambio terapia",
        strategy_helped: "Una strategia ha aiutato",
        noisy_env: "Ambiente rumoroso"
      },
      noteLabel: "Nota per la visita medica o logopedica (facoltativa)",
      notePh: "Esempio: ha ordinato il caffè usando la tabella, più fatica la sera…",
      saveBtn: "Salva osservazione",
      saved: "Osservazione salvata nel diario.",
      needRatings: "Scegli un voto da 1 a 5 per ogni voce.",
      histTitle: "Ultime osservazioni registrate",
      histNone: "Nessuna osservazione ancora registrata.",
      colDate: "Data", colScore: "Indice globale", colTags: "Contesto / Note",
      del: "Elimina", delConfirm: "Confermi?", yes: "Sì", no: "Annulla", deleted: "Voce eliminata.",
      back: "Torna all'area logopedista",
      tipsIntro: "Piccoli accorgimenti quotidiani riducono la frustrazione e mantengono attiva la conversazione.",
      tips: [
        {
          title: "Se fa fatica a iniziare o articolare (variante non fluente)",
          points: [
            "Lascia 5–10 secondi in più dopo una domanda senza finire la frase al posto suo.",
            "Fai domande brevi o con due scelte chiare («Tè o caffè?»).",
            "Conferma di aver capito il messaggio prima di chiedere altri dettagli."
          ]
        },
        {
          title: "Se fatica a riconoscere il significato delle parole (variante semantica)",
          points: [
            "Affianca sempre alla parola un gesto, una foto dell'album o l'oggetto reale.",
            "Usa parole concrete e familiari invece di termini generici.",
            "Non correggere: ripeti con naturalezza la parola giusta nella frase."
          ]
        },
        {
          title: "Se perde il filo di frasi lunghe (variante logopenica)",
          points: [
            "Riduci rumori di fondo (TV o radio) mentre vi parlate.",
            "Parla con frasi brevi e fai una domanda per volta.",
            "Scrivi su un foglio o mostra 1–2 parole chiave per fissare il discorso."
          ]
        },
        {
          title: "Uso pratico della tabella «Comunica»",
          points: [
            "Tieni la tabella a portata di mano nei momenti di stanchezza serale.",
            "Usa la funzione «Mostra grande» per ordinare al bar o in farmacia.",
            "Annota qui sotto quando una strategia visiva ha aiutato la conversazione."
          ]
        }
      ]
    },
    en: {
      btn: "Caregiver communication log",
      title: "Caregiver log & communication tips",
      intro: "Record how everyday communication goes outside practice games. Ratings stay on this device and give clinicians a clear week-by-week picture between visits.",
      tabLog: "Weekly observation",
      tabTips: "Partner communication tips",
      dateLabel: "Date",
      scaleNote: "1 = needs full support · 3 = half-independent · 5 = as usual / independent",
      domains: {
        wordFind: "Finding words in conversation",
        understand: "Understanding spoken conversation",
        clarity: "Speaking clarity and effort",
        readWrite: "Reading & writing everyday notes",
        aids: "Using board, gestures or photos to get across",
        confidence: "Confidence and ease talking"
      },
      tagsLabel: "Context today (optional)",
      tags: {
        good_day: "Good day",
        tired: "Tiredness / fatigue",
        poor_sleep: "Poor sleep",
        med_change: "Medication change",
        strategy_helped: "Strategy helped",
        noisy_env: "Noisy environment"
      },
      noteLabel: "Note for clinic visit (optional)",
      notePh: "Example: ordered coffee with the talk board, more effort in the evening…",
      saveBtn: "Save observation",
      saved: "Observation saved to caregiver log.",
      needRatings: "Pick a 1–5 rating for each domain.",
      histTitle: "Recent caregiver observations",
      histNone: "No observations recorded yet.",
      colDate: "Date", colScore: "Overall index", colTags: "Context / Note",
      del: "Delete", delConfirm: "Delete?", yes: "Yes", no: "Cancel", deleted: "Entry deleted.",
      back: "Back to the therapist area",
      tipsIntro: "Small adjustments by communication partners cut frustration and keep everyday conversation going.",
      tips: [
        {
          title: "When starting words or grammar takes effort (non-fluent PPA)",
          points: [
            "Allow 5–10 extra seconds after asking a question without finishing sentences for them.",
            "Offer clear two-choice questions (“Tea or coffee?”) when stuck.",
            "Acknowledge the message first rather than correcting grammar."
          ]
        },
        {
          title: "When word meanings feel unfamiliar (semantic PPA)",
          points: [
            "Pair spoken words with pointing, an album photo, or the real object.",
            "Keep phrasing concrete and familiar rather than abstract.",
            "Model the right word naturally inside your reply instead of quizzing."
          ]
        },
        {
          title: "When long sentences slip away (logopenic PPA)",
          points: [
            "Lower background noise (TV or radio) during important conversations.",
            "Keep sentences short and ask one question at a time.",
            "Jot down 1–2 anchor words on paper so the topic stays visible."
          ]
        },
        {
          title: "Using the Talk board and Everyday reading",
          points: [
            "Keep the Talk board handy in the evening when fatigue peaks.",
            "Use “Show large” at the counter, pharmacy, or clinic desk.",
            "Tag entries here when a visual or pacing strategy helped."
          ]
        }
      ]
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function loc() { return api.lang() === "it" ? "it-IT" : "en-GB"; }

  function listEntries() {
    var rows = api.load("caregiver_logs");
    return Array.isArray(rows) ? rows : [];
  }

  function computeScores(ratings) {
    var vals = DOMAINS.map(function (d) { return +ratings[d]; }).filter(function (v) { return v >= 1 && v <= 5; });
    if (vals.length !== DOMAINS.length) return null;
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    var expr = (+ratings.wordFind + +ratings.clarity + +ratings.aids) / 3;
    var comp = (+ratings.understand + +ratings.readWrite) / 2;
    return {
      avgRating: Math.round(mean * 10) / 10,
      fcIndex: Math.round(((mean - 1) / 4) * 1000) / 1000,
      exprAvg: Math.round(expr * 10) / 10,
      compAvg: Math.round(comp * 10) / 10
    };
  }

  var tab = "log";
  var confirmId = "";
  var draft = null;

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function ensureDraft() {
    if (!draft) {
      draft = { date: todayIso(), ratings: { wordFind: 3, understand: 4, clarity: 3, readWrite: 4, aids: 4, confidence: 3 }, tags: {}, note: "" };
    }
    return draft;
  }

  function domainRatingsHtml(t, d) {
    return '<div class="cg-domains">' + DOMAINS.map(function (k) {
      var cur = d.ratings[k] || 3;
      return '<div class="cg-row"><div class="cg-lbl">' + esc(t.domains[k]) + '</div>' +
        '<div class="cg-scale" role="group" aria-label="' + esc(t.domains[k]) + '">' +
        [1, 2, 3, 4, 5].map(function (n) {
          return '<button type="button" class="cg-num" data-act="cg-rate" data-k="' + k + '" data-v="' + n + '" aria-pressed="' + (cur === n) + '">' + n + '</button>';
        }).join("") + '</div></div>';
    }).join("") + '</div>';
  }

  function historyHtml(t) {
    var entries = listEntries().slice().reverse();
    if (!entries.length) return '<p class="note">' + esc(t.histNone) + '</p>';
    return '<div class="tbl"><table><thead><tr><th>' + esc(t.colDate) + '</th><th>' + esc(t.colScore) + '</th><th>' + esc(t.colTags) + '</th><th></th></tr></thead><tbody>' +
      entries.slice(0, 20).map(function (e) {
        var dt = new Date(e.date).toLocaleDateString(loc(), { day: "numeric", month: "short", year: "numeric" });
        var pct = Math.round((e.fcIndex != null ? e.fcIndex : 0) * 100) + "% (" + String(e.avgRating).replace(".", api.lang() === "it" ? "," : ".") + "/5)";
        var tagsTxt = (e.tags || []).map(function (k) { return t.tags[k] || k; }).join(" · ");
        var detail = [tagsTxt, e.note].filter(Boolean).join(" — ");
        var delBtn = confirmId === e.id
          ? '<button type="button" class="secondary danger" data-act="cg-del-yes" data-id="' + esc(e.id) + '">' + esc(t.yes) + '</button> <button type="button" class="secondary" data-act="cg-del-no">' + esc(t.no) + '</button>'
          : '<button type="button" class="secondary" data-act="cg-del" data-id="' + esc(e.id) + '">' + esc(t.del) + '</button>';
        return '<tr><td>' + esc(dt) + '</td><td class="n">' + esc(pct) + '</td><td>' + esc(detail || "–") + '</td><td>' + delBtn + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function viewScreen() {
    var t = T(), f = api.flashText(), d = ensureDraft();
    var tabs = '<div class="seg" role="tablist">' +
      '<button type="button" role="tab" data-act="cg-tab" data-t="log" aria-selected="' + (tab === "log") + '" aria-pressed="' + (tab === "log") + '">' + esc(t.tabLog) + '</button>' +
      '<button type="button" role="tab" data-act="cg-tab" data-t="tips" aria-selected="' + (tab === "tips") + '" aria-pressed="' + (tab === "tips") + '">' + esc(t.tabTips) + '</button></div>';

    var body = "";
    if (tab === "tips") {
      body = '<p class="sub">' + esc(t.tipsIntro) + '</p><div class="cg-tips">' +
        t.tips.map(function (card) {
          return '<article class="cg-tip"><h2>' + esc(card.title) + '</h2><ul>' +
            card.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join("") + '</ul></article>';
        }).join("") + '</div>';
    } else {
      body = '<div class="setrow"><label for="cg-date">' + esc(t.dateLabel) + '</label><input type="date" id="cg-date" value="' + esc(d.date) + '"></div>' +
        '<p class="note">' + esc(t.scaleNote) + '</p>' +
        domainRatingsHtml(t, d) +
        '<div class="field"><span class="flabel">' + esc(t.tagsLabel) + '</span><div class="cg-tags">' +
        TAGS.map(function (k) {
          return '<button type="button" class="cg-tag" data-act="cg-tag" data-k="' + k + '" aria-pressed="' + (!!d.tags[k]) + '">' + esc(t.tags[k]) + '</button>';
        }).join("") + '</div></div>' +
        '<div class="field"><label for="cg-note">' + esc(t.noteLabel) + '</label><textarea id="cg-note" rows="3" maxlength="300" placeholder="' + esc(t.notePh) + '">' + esc(d.note) + '</textarea></div>' +
        (f ? '<p class="nudge" role="status">' + esc(f) + '</p>' : '') +
        '<button type="button" class="primary" data-act="cg-save">' + esc(t.saveBtn) + '</button>' +
        '<h2>' + esc(t.histTitle) + '</h2>' +
        historyHtml(t);
    }

    return api.header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.title) + '</h1>' +
      '<p class="sub">' + esc(t.intro) + '</p>' +
      tabs +
      '<div class="report">' + body + '</div>' +
      '<button type="button" class="link" data-act="therapist">' + esc(t.back) + '</button></section>';
  }

  function syncTextDraft() {
    var dt = document.getElementById("cg-date"), nt = document.getElementById("cg-note");
    var d = ensureDraft();
    if (dt && dt.value) d.date = dt.value;
    if (nt) d.note = nt.value.slice(0, 300);
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.carelog = function () { return api.therapistUnlocked() ? viewScreen() : api.therapistView(); };
  A.carelog = function () { confirmId = ""; api.go("carelog"); };
  A["cg-tab"] = function (b) { syncTextDraft(); tab = b.getAttribute("data-t") === "tips" ? "tips" : "log"; api.render(); };
  A["cg-rate"] = function (b) {
    syncTextDraft();
    var k = b.getAttribute("data-k"), v = +b.getAttribute("data-v");
    if (DOMAINS.indexOf(k) >= 0 && v >= 1 && v <= 5) ensureDraft().ratings[k] = v;
    api.render();
  };
  A["cg-tag"] = function (b) {
    syncTextDraft();
    var k = b.getAttribute("data-k");
    if (TAGS.indexOf(k) >= 0) ensureDraft().tags[k] = !ensureDraft().tags[k];
    api.render();
  };
  A["cg-save"] = function () {
    syncTextDraft();
    var t = T(), d = ensureDraft(), sc = computeScores(d.ratings);
    if (!sc) { api.flash(t.needRatings); api.render(); return; }
    var chosenTags = TAGS.filter(function (k) { return !!d.tags[k]; });
    var entryDate = d.date && d.date !== todayIso() ? new Date(d.date + "T12:00:00") : new Date();
    var entry = {
      id: "cg" + Date.now().toString(36),
      date: entryDate.toISOString(),
      ratings: Object.assign({}, d.ratings),
      tags: chosenTags,
      note: String(d.note || "").trim().slice(0, 300),
      fcIndex: sc.fcIndex,
      avgRating: sc.avgRating,
      exprAvg: sc.exprAvg,
      compAvg: sc.compAvg
    };
    var all = listEntries().concat([entry]).sort(function (a, b) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }).slice(-KEEP);
    api.save("caregiver_logs", all);
    draft = null;
    api.flash(t.saved);
    api.render();
  };
  A["cg-del"] = function (b) { confirmId = b.getAttribute("data-id") || ""; api.render(); };
  A["cg-del-no"] = function () { confirmId = ""; api.render(); };
  A["cg-del-yes"] = function (b) {
    var id = b.getAttribute("data-id");
    var next = listEntries().filter(function (e) { return e.id !== id; });
    api.save("caregiver_logs", next);
    confirmId = "";
    api.flash(T().deleted);
    api.render();
  };

  window.addEventListener("pog:languagechange", function () { if (api.screen() === "carelog") api.render(); });
  window.addEventListener("pog:profile-change", function () { draft = null; confirmId = ""; tab = "log"; });

  window.POG.carelog = {
    DOMAINS: DOMAINS,
    TAGS: TAGS,
    list: listEntries,
    computeScores: computeScores,
    label: function () { return T().btn; },
    domainLabel: function (k) { return (T().domains && T().domains[k]) || k; },
    tagLabel: function (k) { return (T().tags && T().tags[k]) || k; }
  };
})();
