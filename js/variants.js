/*
 * Variant-targeted PPA exercises:
 *   - sentence  (nfvPPA / agrammatism): morphosyntactic chunk & verb/preposition ordering
 *   - semantic  (svPPA / semantic): odd-one-out, associative pairs, semantic feature truth
 *   - soundspan (lvPPA & AOS): minimal-pair discrimination, syllable assembly, phonological span
 *
 * Self-contained module registered through window.POG.ext.
 * Level convention matches the main app: 1 = most demanding, 3 = most support.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.VARIANTS;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var DOMAINS = ["sentence", "semantic", "soundspan"];
  var MAXLV = 3;
  var KEEP_SESSIONS = 120;
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5 };
  var FOCUS_WEIGHTS = {
    mixed: ["sentence", "semantic", "soundspan", "sentence", "semantic", "soundspan"],
    nfv: ["sentence", "sentence", "soundspan", "sentence", "semantic", "soundspan"],
    sv: ["semantic", "semantic", "sentence", "semantic", "soundspan", "sentence"],
    lv: ["soundspan", "soundspan", "sentence", "soundspan", "semantic", "sentence"]
  };

  var C = {
    it: {
      homeBtn: "Esercizi mirati PPA",
      hubTitle: "Esercizi mirati per profilo PPA",
      hubSub: "Scegli una sessione guidata in base al profilo o allenati su un singolo dominio linguistico.",
      focusTitle: "Profilo di riferimento (facoltativo)",
      focusHelp: "Orienta la miscela degli esercizi nella sessione guidata. Non è una diagnosi.",
      focus: {
        mixed: "Equilibrato (tutti i domini)",
        nfv: "Variante non fluente (frasi, verbi, sillabe)",
        sv: "Variante semantica (categorie e significati)",
        lv: "Variante logopenica (suoni e memoria verbale)"
      },
      startGuided: "Inizia sessione mirata (6 prove)",
      orOne: "Oppure allena un dominio",
      domains: {
        sentence: "Frasi e verbi",
        semantic: "Reti semantiche",
        soundspan: "Suoni, sillabe e memoria"
      },
      domainDesc: {
        sentence: "Ordina parole e verbi per costruire frasi complete.",
        semantic: "Trova l'intruso, associa concetti e verifica caratteristiche.",
        soundspan: "Distingui suoni simili, unisci sillabe e ricorda sequenze."
      },
      lvNames: ["Impegnativo", "Intermedio", "Con più supporto"],
      lvTag: "Livello {n} · {name}",
      stepOf: "Prova {i} di {n}",
      stop: "Termina",
      back: "Torna all'inizio",
      backHub: "Torna agli esercizi mirati",
      listen: "Ascolta",
      hint: "Un aiuto",
      clear: "Svuota",
      check: "Controlla",
      reveal: "Mostra risposta",
      next: "Avanti",
      trueBtn: "Vero",
      falseBtn: "Falso",
      readyBtn: "Pronto, tocco io",
      playSeq: "Ascolta la sequenza",
      replaySlow: "Ascolta piano",
      studyHint: "Osserva o ascolta le parole nell'ordine, poi toccale nello stesso ordine.",
      sentenceWrong: "Quasi! Controlla l'ordine delle parole o una parola in più.",
      syllWrong: "Quasi! Controlla l'ordine delle sillabe.",
      optWrong: "Non è questa: riprova con calma.",
      spanWrong: "In questa posizione serve un'altra parola.",
      goodFeedback: "Ben fatto!",
      almostFeedback: "Ottimo, completato con un piccolo aiuto.",
      modelFeedback: "Ecco il modello completo. Puoi ascoltarlo o leggerlo ad alta voce.",
      speakAfter: "Se vuoi, leggila ad alta voce prima di andare avanti.",
      hintPlaced: "Ho inserito la prossima parte al posto giusto.",
      sumTitle: "Sessione mirata completata",
      sumStopped: "Ci fermiamo qui. I risultati di questa prova sono stati salvati.",
      sumDone: "Tutte le prove completate. Ottimo lavoro.",
      res: { good: "Giusto", almost: "Quasi", model: "Con modello" },
      recentNone: "Nessuna sessione mirata ancora registrata.",
      recentHead: "Ultime sessioni mirate",
      colDomain: "Dominio", colRes: "Esito", colTime: "Tempo (s)",
      autoAdapt: "Adatta i livelli automaticamente",
      noTtsHint: "Suggerimento: "
    },
    en: {
      homeBtn: "Targeted PPA practice",
      hubTitle: "Targeted PPA exercises",
      hubSub: "Start a guided mix shaped by language profile focus, or practise one targeted skill.",
      focusTitle: "Profile focus (optional)",
      focusHelp: "Adjusts which exercises appear in a guided set. For practice planning, not diagnosis.",
      focus: {
        mixed: "Balanced (all three domains)",
        nfv: "Non-fluent / agrammatic (sentences & syllables)",
        sv: "Semantic focus (categories & features)",
        lv: "Logopenic / phonological (sounds & word span)"
      },
      startGuided: "Start guided practice (6 items)",
      orOne: "Or practise one skill",
      domains: {
        sentence: "Sentence building",
        semantic: "Semantic links",
        soundspan: "Sounds, syllables & span"
      },
      domainDesc: {
        sentence: "Put words and verbs in order to build complete sentences.",
        semantic: "Spot the odd one out, match pairs, and check features.",
        soundspan: "Tell close sounds apart, join syllables, and recall word spans."
      },
      lvNames: ["Demanding", "Standard", "More support"],
      lvTag: "Level {n} · {name}",
      stepOf: "Item {i} of {n}",
      stop: "Stop",
      back: "Back to home",
      backHub: "Back to targeted practice",
      listen: "Listen",
      hint: "Hint",
      clear: "Clear",
      check: "Check",
      reveal: "Show answer",
      next: "Next",
      trueBtn: "True",
      falseBtn: "False",
      readyBtn: "Ready to answer",
      playSeq: "Play sequence",
      replaySlow: "Listen slowly",
      studyHint: "Look at or listen to the words in order, then tap them back in the same order.",
      sentenceWrong: "Nearly! Check the word order or remove an extra word.",
      syllWrong: "Nearly! Check the syllable order.",
      optWrong: "Not that one — take your time and try again.",
      spanWrong: "Another word goes in this spot.",
      goodFeedback: "Well done!",
      almostFeedback: "Completed with a little support.",
      modelFeedback: "Here is the full model. You can listen or read it aloud.",
      speakAfter: "If you like, read it aloud before moving on.",
      hintPlaced: "Placed the next piece in the right spot.",
      sumTitle: "Targeted practice complete",
      sumStopped: "Stopping here for now. What you completed has been saved.",
      sumDone: "All items finished. Well done.",
      res: { good: "Right", almost: "Nearly", model: "With model" },
      recentNone: "No targeted sessions saved yet.",
      recentHead: "Recent targeted sessions",
      colDomain: "Domain", colRes: "Result", colTime: "Time (s)",
      autoAdapt: "Adjust levels automatically",
      noTtsHint: "Clue: "
    }
  };

  function T() { return C[api.lang()] || C.it; }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function derangedShuffle(list, originalOrder) {
    var out = shuffle(list);
    if (out.length > 1 && originalOrder && out.join("|") === originalOrder.join("|")) {
      out.push(out.shift());
    }
    return out;
  }

  function getSettings() {
    var s = api.load("variant_settings") || {};
    var focus = FOCUS_WEIGHTS[s.focus] ? s.focus : "mixed";
    return { focus: focus, auto: s.auto !== false, allowUp: s.allowUp !== false };
  }

  function getLevels() {
    var lv = api.load("variant_levels") || {};
    var out = {};
    DOMAINS.forEach(function (d) {
      var n = +lv[d];
      out[d] = (n >= 1 && n <= MAXLV) ? n : 2;
    });
    return out;
  }

  function listSessions() {
    var s = api.load("variant_sessions");
    return Array.isArray(s) ? s : [];
  }

  function scoreItem(firstTry, hints) {
    if (firstTry && !hints) return { result: "good", score: 1 };
    return { result: "almost", score: 0.5 };
  }

  function pickItemsForDomain(domain, lv, count, langCode, usedIds) {
    var bank = (CONTENT[domain] && CONTENT[domain][langCode]) || [];
    var atLv = bank.filter(function (x) { return x.lv === lv && !usedIds[x.id]; });
    var near = bank.filter(function (x) { return x.lv !== lv && !usedIds[x.id]; });
    var pool = shuffle(atLv).concat(shuffle(near));
    /* Ensure variety across sub-kinds (odd/assoc/feat or pair/syll/span) when count >= 3. */
    var picked = [], seenKinds = {};
    for (var i = 0; i < pool.length && picked.length < count; i++) {
      var it = pool[i];
      if (!it.kind || !seenKinds[it.kind]) {
        picked.push(it);
        usedIds[it.id] = true;
        if (it.kind) seenKinds[it.kind] = true;
      }
    }
    for (var j = 0; j < pool.length && picked.length < count; j++) {
      if (!usedIds[pool[j].id]) {
        picked.push(pool[j]);
        usedIds[pool[j].id] = true;
      }
    }
    return picked.map(function (it) { return { domain: domain, lv: lv, data: it }; });
  }

  function buildQueue(mode, focus, levels, langCode) {
    var lvs = levels || getLevels();
    var lc = langCode === "en" ? "en" : "it";
    var used = {};
    if (DOMAINS.indexOf(mode) >= 0) {
      return pickItemsForDomain(mode, lvs[mode] || 2, 3, lc, used);
    }
    var seq = FOCUS_WEIGHTS[focus] || FOCUS_WEIGHTS.mixed;
    var counts = {};
    seq.forEach(function (d) { counts[d] = (counts[d] || 0) + 1; });
    var buckets = {};
    DOMAINS.forEach(function (d) {
      buckets[d] = counts[d] ? pickItemsForDomain(d, lvs[d] || 2, counts[d], lc, used) : [];
    });
    var idx = { sentence: 0, semantic: 0, soundspan: 0 }, out = [];
    seq.forEach(function (d) {
      var b = buckets[d];
      if (b && idx[d] < b.length) out.push(b[idx[d]++]);
    });
    return out;
  }

  /* Active state: null = Variant Hub screen; otherwise active session or summary. */
  var V = null;
  var spanTimer = null;

  function clearSpanTimer() {
    if (spanTimer) { clearTimeout(spanTimer); spanTimer = null; }
  }

  function stopVoice() {
    clearSpanTimer();
    if (api.stopVoice) api.stopVoice();
  }

  function itemLabel(step) {
    var d = step.data;
    if (step.domain === "sentence") return d.target;
    if (step.domain === "semantic") return d.anchor ? d.anchor.w : (d.items && d.items[d.ans] ? d.items[d.ans].w : d.id);
    if (d.kind === "pair") return d.targetWord;
    if (d.kind === "syll") return d.word;
    return (d.sequence || []).map(function (x) { return x.w; }).join(" · ");
  }

  function initStepState(step) {
    var d = step.data;
    var base = { startedAt: Date.now(), hints: 0, firstTry: true, done: false, result: null, nudge: "", cue: "" };
    if (step.domain === "sentence") {
      var all = d.tokens.map(function (w) { return { word: w, ok: true, used: false }; })
        .concat((d.distractors || []).map(function (w) { return { word: w, ok: false, used: false }; }));
      var shuffled = derangedShuffle(all, all.map(function (x) { return x.word; }));
      /* Ensure tiles never stay in solved prefix if distractors empty */
      if (shuffled.map(function (x) { return x.word; }).join(" ") === d.target && shuffled.length > 1) {
        var f = shuffled.shift(); shuffled.push(f);
      }
      base.pool = shuffled;
      base.chosen = [];
    } else if (step.domain === "semantic") {
      base.elim = {};
      base.picked = null;
      if (d.kind === "odd" || d.kind === "assoc") {
        var order = d.items.map(function (_, idx) { return idx; });
        base.optOrder = shuffle(order);
      }
    } else {
      if (d.kind === "pair") {
        base.elim = {};
        base.picked = null;
        base.optOrder = shuffle(d.items.map(function (_, idx) { return idx; }));
      } else if (d.kind === "syll") {
        var syls = d.syllables.map(function (s) { return { word: s, ok: true, used: false }; })
          .concat((d.distractors || []).map(function (s) { return { word: s, ok: false, used: false }; }));
        base.pool = derangedShuffle(syls, d.syllables);
        if (base.pool.map(function (x) { return x.word; }).join("") === d.word && base.pool.length > 1) {
          var first = base.pool.shift(); base.pool.push(first);
        }
        base.chosen = [];
      } else if (d.kind === "span") {
        base.spanPhase = "listen";
        base.highlightIdx = -1;
        base.chosen = [];
        base.optOrder = derangedShuffle(d.sequence.map(function (x, idx) { return { w: x.w, pic: x.pic, orig: idx }; }));
      }
    }
    return base;
  }

  function startRun(mode) {
    stopVoice();
    var set = getSettings(), lvs = getLevels(), lc = api.lang();
    var queue = buildQueue(mode, set.focus, lvs, lc);
    if (!queue.length) return;
    V = {
      id: "v" + Date.now().toString(36),
      mode: mode,
      focus: set.focus,
      who: "solo",
      levels: lvs,
      steps: queue,
      i: 0,
      st: initStepState(queue[0]),
      log: [],
      done: false,
      stopped: false,
      changes: []
    };
    api.go("variants");
  }

  function curStep() { return V && V.steps[V.i]; }

  function recordCurrent(result, scoreVal) {
    if (!V || !curStep() || !V.st || V.st.recorded) return;
    V.st.recorded = true;
    var step = curStep(), st = V.st;
    st.done = true;
    st.result = result;
    V.log.push({
      game: step.domain,
      lv: step.lv,
      kind: step.data.kind || step.domain,
      id: step.data.id,
      label: itemLabel(step),
      result: result,
      score: scoreVal != null ? scoreVal : (result === "good" ? 1 : result === "almost" ? 0.5 : 0),
      hints: st.hints,
      ms: Date.now() - st.startedAt
    });
  }

  function saveRunAndAdapt() {
    if (!V || !V.log.length || V.saved) return;
    V.saved = true;
    var sess = {
      id: V.id,
      date: new Date().toISOString(),
      mode: V.mode,
      focus: V.focus,
      who: V.who,
      levels: Object.assign({}, V.levels),
      items: V.log.slice()
    };
    var all = listSessions().concat([sess]).slice(-KEEP_SESSIONS);
    api.save("variant_sessions", all);

    var cfg = getSettings();
    if (!cfg.auto) return;
    var lvs = getLevels(), changed = false;
    DOMAINS.forEach(function (d) {
      var vals = [];
      all.forEach(function (s) {
        var matched = (s.items || []).filter(function (i) { return i.game === d; });
        if (matched.length) {
          var mean = matched.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / matched.length;
          vals.push(mean);
        }
      });
      var curLv = lvs[d];
      if (vals.length >= RULE.downN) {
        var r3 = vals.slice(-RULE.downN);
        var avg3 = r3.reduce(function (a, b) { return a + b; }, 0) / r3.length;
        if (avg3 < RULE.down && curLv < MAXLV) {
          lvs[d] = curLv + 1; changed = true;
          V.changes.push({ domain: d, from: curLv, to: lvs[d] });
          return;
        }
      }
      if (cfg.allowUp && vals.length >= RULE.upN) {
        var r5 = vals.slice(-RULE.upN);
        var avg5 = r5.reduce(function (a, b) { return a + b; }, 0) / r5.length;
        if (avg5 >= RULE.up && curLv > 1) {
          lvs[d] = curLv - 1; changed = true;
          V.changes.push({ domain: d, from: curLv, to: lvs[d] });
        }
      }
    });
    if (changed) api.save("variant_levels", lvs);
  }

  function advance() {
    stopVoice();
    if (!V) return;
    if (V.i + 1 < V.steps.length) {
      V.i++;
      V.st = initStepState(V.steps[V.i]);
      api.render();
    } else {
      V.done = true;
      saveRunAndAdapt();
      api.render();
    }
  }

  function finishEarly() {
    stopVoice();
    if (!V) return;
    V.done = true;
    V.stopped = true;
    saveRunAndAdapt();
    api.render();
  }

  function speakSlow(text) {
    if (!text) return;
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = api.lang() === "it" ? "it-IT" : "en-US";
        u.rate = 0.8;
        window.speechSynthesis.speak(u);
        return;
      }
    } catch (e) {}
    api.speak(text);
  }

  function playSpanSequence(seq) {
    clearSpanTimer();
    if (!V || !V.st || !seq || !seq.length) return;
    var idx = 0;
    function step() {
      if (!V || !V.st || V.st.spanPhase !== "listen") return;
      V.st.highlightIdx = idx;
      api.render();
      speakSlow(seq[idx].w);
      idx++;
      if (idx < seq.length) {
        spanTimer = setTimeout(step, 1100);
      } else {
        spanTimer = setTimeout(function () {
          if (V && V.st) { V.st.highlightIdx = -1; api.render(); }
        }, 900);
      }
    }
    step();
  }

  /* ---------- Views ---------- */
  function viewHub() {
    var t = T(), cfg = getSettings(), lvs = getLevels(), locked = api.isLocked(), hist = listSessions().slice().reverse();
    var focusSeg = !locked
      ? '<div class="var-panel"><h2>' + esc(t.focusTitle) + '</h2><p class="note">' + esc(t.focusHelp) + '</p>' +
        '<div class="var-focus" role="group" aria-label="' + esc(t.focusTitle) + '">' +
        ["mixed", "nfv", "sv", "lv"].map(function (k) {
          return '<button type="button" class="var-fbtn" data-act="var-focus" data-f="' + k + '" aria-pressed="' + (cfg.focus === k) + '">' + esc(t.focus[k]) + '</button>';
        }).join("") + '</div>' +
        '<label class="check"><input type="checkbox" id="var-auto"' + (cfg.auto ? ' checked' : '') + '>' + esc(t.autoAdapt) + '</label></div>'
      : '';

    var domainCards = '<div class="var-grid">' + DOMAINS.map(function (d) {
      var lv = lvs[d], icon = d === "sentence" ? "🧩" : d === "semantic" ? "🧠" : "🔊";
      return '<button class="modecard var-dcard" data-act="var-start" data-m="' + d + '">' +
        '<span class="ico" aria-hidden="true">' + icon + '</span>' +
        '<strong>' + esc(t.domains[d]) + '</strong>' +
        '<span class="var-badge">' + esc(api.fill(t.lvTag, { n: lv, name: t.lvNames[lv - 1] })) + '</span>' +
        '<span>' + esc(t.domainDesc[d]) + '</span></button>';
    }).join("") +
      (window.POG.functional ? '<button class="modecard var-dcard" data-act="func-home">' +
        '<span class="ico" aria-hidden="true">📖</span>' +
        '<strong>' + esc(window.POG.functional.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.functional.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.functional.desc()) + '</span></button>' : '') +
      (window.POG.wordbank ? '<button class="modecard var-dcard" data-act="wb-home">' +
        '<span class="ico" aria-hidden="true">🗂️</span>' +
        '<strong>' + esc(window.POG.wordbank.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.wordbank.badge()) + '</span>' +
        '<span>' + esc(window.POG.wordbank.desc()) + '</span></button>' : '') +
      (window.POG.writing ? '<button class="modecard var-dcard" data-act="wr-home">' +
        '<span class="ico" aria-hidden="true">✍️</span>' +
        '<strong>' + esc(window.POG.writing.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.writing.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.writing.desc()) + '</span></button>' : '') +
      (window.POG.discourse ? '<button class="modecard var-dcard" data-act="disc-home">' +
        '<span class="ico" aria-hidden="true">🎧</span>' +
        '<strong>' + esc(window.POG.discourse.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.discourse.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.discourse.desc()) + '</span></button>' : '') +
      (window.POG.pacing ? '<button class="modecard var-dcard" data-act="pace-home">' +
        '<span class="ico" aria-hidden="true">🥁</span>' +
        '<strong>' + esc(window.POG.pacing.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.pacing.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.pacing.desc()) + '</span></button>' : '') +
      (window.POG.verbs ? '<button class="modecard var-dcard" data-act="verbs-home">' +
        '<span class="ico" aria-hidden="true">🤝</span>' +
        '<strong>' + esc(window.POG.verbs.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.verbs.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.verbs.desc()) + '</span></button>' : '') +
      (window.POG.narrative ? '<button class="modecard var-dcard" data-act="narr-home">' +
        '<span class="ico" aria-hidden="true">📚</span>' +
        '<strong>' + esc(window.POG.narrative.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.narrative.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.narrative.desc()) + '</span></button>' : '') +
      (window.POG.grammar ? '<button class="modecard var-dcard" data-act="gram-home">' +
        '<span class="ico" aria-hidden="true">⚖️</span>' +
        '<strong>' + esc(window.POG.grammar.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.grammar.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.grammar.desc()) + '</span></button>' : '') +
      (window.POG.surface ? '<button class="modecard var-dcard" data-act="surf-home">' +
        '<span class="ico" aria-hidden="true">🔍</span>' +
        '<strong>' + esc(window.POG.surface.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.surface.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.surface.desc()) + '</span></button>' : '') +
      (window.POG.circumlocution ? '<button class="modecard var-dcard" data-act="circ-home">' +
        '<span class="ico" aria-hidden="true">🌉</span>' +
        '<strong>' + esc(window.POG.circumlocution.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.circumlocution.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.circumlocution.desc()) + '</span></button>' : '') +
      (window.POG.numbers ? '<button class="modecard var-dcard" data-act="num-home">' +
        '<span class="ico" aria-hidden="true">🕒</span>' +
        '<strong>' + esc(window.POG.numbers.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.numbers.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.numbers.desc()) + '</span></button>' : '') +
      (window.POG.dialogue ? '<button class="modecard var-dcard" data-act="dg-home">' +
        '<span class="ico" aria-hidden="true">🗣️</span>' +
        '<strong>' + esc(window.POG.dialogue.label()) + '</strong>' +
        '<span class="var-badge">' + esc(window.POG.dialogue.lvTag()) + '</span>' +
        '<span>' + esc(window.POG.dialogue.desc()) + '</span></button>' : '') +
      '</div>';

    var recentHtml = hist.length
      ? '<div class="var-recent"><h2>' + esc(t.recentHead) + '</h2><div class="tbl"><table><thead><tr><th>' + esc(t.colDomain) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colTime) + '</th></tr></thead><tbody>' +
        hist.slice(0, 4).map(function (s) {
          return (s.items || []).map(function (it) {
            return '<tr><td>' + esc(t.domains[it.game] || it.game) + ' · ' + esc(it.label) + '</td>' +
              '<td><span class="pill ' + esc(it.result) + '">' + esc(t.res[it.result] || it.result) + '</span></td>' +
              '<td class="n">' + (it.ms != null ? Math.round(it.ms / 1000) : "–") + '</td></tr>';
          }).join("");
        }).join("") + '</tbody></table></div></div>'
      : '<p class="note">' + esc(t.recentNone) + '</p>';

    return api.header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.hubTitle) + '</h1>' +
      '<p class="sub">' + esc(t.hubSub) + '</p>' +
      '<button class="primary" data-act="var-start" data-m="guided">' + esc(t.startGuided) + '</button>' +
      '<h2>' + esc(t.orOne) + '</h2>' +
      domainCards +
      focusSeg +
      recentHtml +
      '<button class="link" data-act="var-back">' + esc(t.back) + '</button></section>';
  }

  function viewSentence(step, st, t) {
    var d = step.data;
    var slots = '<div class="var-slots">' + d.tokens.map(function (_, i) {
      var c = st.chosen[i];
      var cls = "var-slot" + (c ? " has" : "") + (st.done ? " ok" : "");
      return '<button type="button" class="' + cls + '" data-act="var-sslot" data-i="' + i + '"' + (!c || st.done ? ' disabled' : '') + '>' + (c ? esc(c.word) : "···") + '</button>';
    }).join("") + '</div>';

    /* Show extra slots if user tapped more tokens than target length (when distractors present) */
    var extra = st.chosen.length > d.tokens.length
      ? '<div class="var-slots extra">' + st.chosen.slice(d.tokens.length).map(function (c, k) {
          var idx = d.tokens.length + k;
          return '<button type="button" class="var-slot has" data-act="var-sslot" data-i="' + idx + '"' + (st.done ? ' disabled' : '') + '>' + esc(c.word) + '</button>';
        }).join("") + '</div>' : '';

    var tiles = st.done ? "" : '<div class="var-tiles">' + st.pool.map(function (tl, i) {
      return '<button type="button" class="var-tile' + (tl.used ? ' used' : '') + '" data-act="var-stile" data-i="' + i + '"' + (tl.used ? ' disabled aria-hidden="true"' : '') + '>' + esc(tl.word) + '</button>';
    }).join("") + '</div>';

    var canCheck = !st.done && st.chosen.length > 0;
    var tools = st.done
      ? '<div class="tools"><button type="button" class="tool" data-act="var-speak">' + esc(t.listen) + '</button></div>' +
        '<p class="sub">' + esc(t.speakAfter) + '</p>' +
        '<button type="button" class="primary" data-act="var-next">' + esc(t.next) + '</button>'
      : '<div class="tools">' +
        '<button type="button" class="tool" data-act="var-sclear"' + (!st.chosen.length ? ' disabled' : '') + '>' + esc(t.clear) + '</button>' +
        '<button type="button" class="tool" data-act="var-hint">' + esc(t.hint) + '</button>' +
        (st.hints >= 2 ? '<button type="button" class="tool" data-act="var-reveal">' + esc(t.reveal) + '</button>' : '') +
        '</div>' +
        '<button type="button" class="primary" data-act="var-scheck"' + (!canCheck ? ' disabled' : '') + '>' + esc(t.check) + '</button>';

    return '<div class="pic sm" aria-hidden="true">' + d.pic + '</div>' +
      '<p class="instr">' + esc(d.prompt) + '</p>' +
      slots + extra +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      tiles + tools;
  }

  function viewSemantic(step, st, t) {
    var d = step.data;
    var anchorHtml = d.anchor
      ? '<div class="var-anchor"><span class="pic sm" aria-hidden="true">' + d.anchor.pic + '</span><strong class="phrase">' + esc(d.anchor.w) + '</strong></div>'
      : '';
    var stmtHtml = d.statement ? '<p class="cue">' + esc(d.statement) + '</p>' : '';
    var hintHtml = st.hints >= 1 ? '<div class="hint"><b>1</b><span>' + esc(d.hint) + '</span></div>' : '';

    var optsHtml = "";
    if (d.kind === "feat") {
      optsHtml = '<div class="var-opts two">' +
        [true, false].map(function (val) {
          var cls = "var-opt";
          if (st.done && val === d.ans) cls += " ok";
          else if (st.elim[String(val)]) cls += " dim";
          return '<button type="button" class="' + cls + '" data-act="var-feat" data-ans="' + val + '"' + (st.done || st.elim[String(val)] ? ' disabled' : '') + '>' + esc(val ? t.trueBtn : t.falseBtn) + '</button>';
        }).join("") + '</div>';
    } else {
      optsHtml = '<div class="var-opts">' + (st.optOrder || []).map(function (origIdx) {
        var it = d.items[origIdx];
        var cls = "var-opt";
        if (st.done && origIdx === d.ans) cls += " ok";
        else if (st.elim[origIdx]) cls += " dim";
        return '<button type="button" class="' + cls + '" data-act="var-sopt" data-i="' + origIdx + '"' + (st.done || st.elim[origIdx] ? ' disabled' : '') + '>' +
          '<span class="var-opt-pic" aria-hidden="true">' + it.pic + '</span><span>' + esc(it.w) + '</span></button>';
      }).join("") + '</div>';
    }

    var footer = st.done
      ? '<div class="var-feedback good"><p><strong>' + esc(st.result === "good" ? t.goodFeedback : t.almostFeedback) + '</strong> ' + esc(d.explanation) + '</p></div>' +
        '<button type="button" class="primary" data-act="var-next">' + esc(t.next) + '</button>'
      : '<div class="tools"><button type="button" class="tool" data-act="var-hint">' + esc(t.hint) + '</button></div>';

    return '<p class="instr">' + esc(d.prompt) + '</p>' +
      anchorHtml + stmtHtml + hintHtml +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      optsHtml + footer;
  }

  function viewSoundSpan(step, st, t) {
    var d = step.data;
    if (d.kind === "pair") {
      var hasTts = "speechSynthesis" in window;
      var showClue = st.hints >= 1 || !hasTts;
      var hintHtml = showClue ? '<div class="hint"><b>1</b><span>' + esc(d.clue) + '</span></div>' : '';
      var opts = '<div class="var-opts">' + (st.optOrder || []).map(function (origIdx) {
        var it = d.items[origIdx], cls = "var-opt";
        if (st.done && origIdx === d.ans) cls += " ok";
        else if (st.elim[origIdx]) cls += " dim";
        return '<button type="button" class="' + cls + '" data-act="var-popt" data-i="' + origIdx + '"' + (st.done || st.elim[origIdx] ? ' disabled' : '') + '>' +
          '<span class="var-opt-pic" aria-hidden="true">' + it.pic + '</span><span>' + esc(it.w) + '</span></button>';
      }).join("") + '</div>';
      var footer = st.done
        ? '<div class="var-feedback good"><p><strong>' + esc(st.result === "good" ? t.goodFeedback : t.almostFeedback) + '</strong> ' + esc(d.targetWord) + '</p></div>' +
          '<button type="button" class="primary" data-act="var-next">' + esc(t.next) + '</button>'
        : '<div class="tools"><button type="button" class="tool" data-act="var-play">' + esc(t.listen) + '</button>' +
          '<button type="button" class="tool" data-act="var-hint">' + esc(t.hint) + '</button></div>';
      return '<p class="instr">' + esc(d.prompt) + '</p>' + hintHtml +
        (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
        opts + footer;
    }

    if (d.kind === "syll") {
      var slots = '<div class="var-slots">' + d.syllables.map(function (_, i) {
        var c = st.chosen[i], cls = "var-slot" + (c ? " has" : "") + (st.done ? " ok" : "");
        return '<button type="button" class="' + cls + '" data-act="var-sslot" data-i="' + i + '"' + (!c || st.done ? ' disabled' : '') + '>' + (c ? esc(c.word) : "···") + '</button>';
      }).join("") + '</div>';
      var tiles = st.done ? "" : '<div class="var-tiles">' + st.pool.map(function (tl, i) {
        return '<button type="button" class="var-tile' + (tl.used ? ' used' : '') + '" data-act="var-stile" data-i="' + i + '"' + (tl.used ? ' disabled aria-hidden="true"' : '') + '>' + esc(tl.word) + '</button>';
      }).join("") + '</div>';
      var sFooter = st.done
        ? '<p class="phrase">' + esc(d.word) + '</p>' +
          '<div class="tools"><button type="button" class="tool" data-act="var-speak">' + esc(t.listen) + '</button></div>' +
          '<button type="button" class="primary" data-act="var-next">' + esc(t.next) + '</button>'
        : '<div class="tools"><button type="button" class="tool" data-act="var-speak">' + esc(t.replaySlow) + '</button>' +
          '<button type="button" class="tool" data-act="var-sclear"' + (!st.chosen.length ? ' disabled' : '') + '>' + esc(t.clear) + '</button>' +
          '<button type="button" class="tool" data-act="var-hint">' + esc(t.hint) + '</button>' +
          (st.hints >= 2 ? '<button type="button" class="tool" data-act="var-reveal">' + esc(t.reveal) + '</button>' : '') + '</div>' +
          '<button type="button" class="primary" data-act="var-scheck"' + (!st.chosen.length ? ' disabled' : '') + '>' + esc(t.check) + '</button>';
      return '<div class="pic sm" aria-hidden="true">' + d.pic + '</div>' +
        '<p class="instr">' + esc(d.prompt) + '</p>' +
        slots +
        (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
        tiles + sFooter;
    }

    /* Span phase */
    if (st.spanPhase === "listen") {
      var seqCards = '<div class="chips var-span-seq">' + d.sequence.map(function (x, i) {
        return '<span class="chip' + (st.highlightIdx === i ? ' hl' : '') + '">' + x.pic + ' ' + esc(x.w) + '</span>';
      }).join("") + '</div>';
      return '<p class="instr">' + esc(d.prompt) + '</p>' +
        '<p class="sub">' + esc(t.studyHint) + '</p>' +
        seqCards +
        '<div class="tools"><button type="button" class="tool" data-act="var-span-play">' + esc(t.playSeq) + '</button></div>' +
        '<button type="button" class="primary" data-act="var-span-ready">' + esc(t.readyBtn) + '</button>';
    }

    var spanSlots = '<div class="var-slots">' + d.sequence.map(function (_, i) {
      var c = st.chosen[i], cls = "var-slot" + (c ? " has ok" : "");
      return '<span class="' + cls + '">' + (c ? c.pic + ' ' + esc(c.w) : String(i + 1)) + '</span>';
    }).join("") + '</div>';
    var poolCards = st.done ? "" : '<div class="var-opts">' + (st.optOrder || []).map(function (c, i) {
      var used = st.chosen.some(function (x) { return x.w === c.w; });
      return '<button type="button" class="var-opt' + (used ? ' dim' : '') + '" data-act="var-span-pick" data-i="' + i + '"' + (used ? ' disabled' : '') + '>' +
        '<span class="var-opt-pic" aria-hidden="true">' + c.pic + '</span><span>' + esc(c.w) + '</span></button>';
    }).join("") + '</div>';
    var spFooter = st.done
      ? '<div class="var-feedback good"><p><strong>' + esc(st.result === "good" ? t.goodFeedback : t.almostFeedback) + '</strong></p></div>' +
        '<button type="button" class="primary" data-act="var-next">' + esc(t.next) + '</button>'
      : '<div class="tools"><button type="button" class="tool" data-act="var-hint">' + esc(t.hint) + '</button></div>';

    return '<p class="instr">' + esc(d.prompt) + '</p>' +
      spanSlots +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      poolCards + spFooter;
  }

  function viewSummary() {
    var t = T();
    var rows = V.log.map(function (r) {
      return '<tr><td>' + esc(t.domains[r.game] || r.game) + ' · ' + esc(r.label) + '</td>' +
        '<td><span class="pill ' + esc(r.result) + '">' + esc(t.res[r.result] || r.result) + '</span></td>' +
        '<td class="n">' + (r.ms != null ? Math.round(r.ms / 1000) : "–") + '</td></tr>';
    }).join("");
    var ch = V.changes.length
      ? '<ul class="changes">' + V.changes.map(function (c) {
          return '<li>' + esc(t.domains[c.domain] + ": " + api.t().level + " " + c.from + " → " + c.to) + '</li>';
        }).join("") + '</ul>' : '';
    return api.header(false) + '<section class="card">' +
      '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p>' +
      (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colDomain) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colTime) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + ch + '</div>' : '') +
      '<button type="button" class="primary" data-act="var-hub">' + esc(t.backHub) + '</button>' +
      '<button type="button" class="link" data-act="var-back">' + esc(t.back) + '</button></section>';
  }

  function viewScreen() {
    if (!V) return viewHub();
    if (V.done) return viewSummary();
    var t = T(), step = curStep(), st = V.st;
    var bar = '<div class="bar"><span class="brand">' + esc(t.domains[step.domain]) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="var-stop">' + esc(t.stop) + '</button></div>';
    var stepsBar = '<ol class="steps" aria-label="Progress">' + V.steps.map(function (s, idx) {
      var cls = idx < V.i ? "past" : idx === V.i ? "on" : "";
      return '<li class="' + cls + '">' + esc(t.domains[s.domain]) + '</li>';
    }).join("") + '</ol>';
    var lvLine = '<p class="tag">' + esc(api.fill(t.lvTag, { n: step.lv, name: t.lvNames[step.lv - 1] })) + '</p>';
    var inner = "";
    if (step.domain === "sentence") inner = viewSentence(step, st, t);
    else if (step.domain === "semantic") inner = viewSemantic(step, st, t);
    else inner = viewSoundSpan(step, st, t);
    return bar + stepsBar + '<section class="card">' + lvLine + inner + '</section>';
  }

  /* ---------- Actions ---------- */
  var ext = window.POG.ext, A = ext.actions;
  ext.screens.variants = viewScreen;
  ext.home.push({ act: "var-home", icon: "🎯", label: { it: C.it.homeBtn, en: C.en.homeBtn }, standalone: true });

  A["var-home"] = function () { stopVoice(); V = null; api.go("variants"); };
  A["var-hub"] = function () { stopVoice(); V = null; api.render(); };
  A["var-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["var-stop"] = finishEarly;
  A["var-next"] = advance;

  A["var-focus"] = function (b) {
    if (api.isLocked()) return;
    var f = b.getAttribute("data-f");
    if (!FOCUS_WEIGHTS[f]) return;
    var cfg = getSettings(); cfg.focus = f;
    api.save("variant_settings", cfg);
    api.render();
  };

  A["var-start"] = function (b) {
    startRun(b.getAttribute("data-m") || "guided");
  };

  A["var-stile"] = function (b) {
    var step = curStep(), st = V && V.st;
    if (!step || !st || st.done) return;
    var i = +b.getAttribute("data-i"), tl = st.pool[i];
    if (!tl || tl.used) return;
    tl.used = true;
    st.chosen.push({ idx: i, word: tl.word });
    st.nudge = "";
    /* For syllable assembly, auto-verify as soon as target length is reached and matches. */
    if (step.domain === "soundspan" && step.data.kind === "syll" && st.chosen.length === step.data.syllables.length) {
      if (st.chosen.map(function (c) { return c.word; }).join("") === step.data.word) {
        var sc = scoreItem(st.firstTry, st.hints);
        recordCurrent(sc.result, sc.score);
        api.speak(step.data.word.toLowerCase());
      }
    }
    api.render();
  };

  A["var-sslot"] = function (b) {
    var st = V && V.st;
    if (!st || st.done) return;
    var i = +b.getAttribute("data-i");
    var c = st.chosen[i];
    if (!c) return;
    st.chosen.splice(i, 1);
    if (st.pool[c.idx]) st.pool[c.idx].used = false;
    st.nudge = "";
    api.render();
  };

  A["var-sclear"] = function () {
    var st = V && V.st;
    if (!st || st.done) return;
    st.chosen = [];
    (st.pool || []).forEach(function (tl) { tl.used = false; });
    st.nudge = "";
    api.render();
  };

  A["var-scheck"] = function () {
    var step = curStep(), st = V && V.st, t = T();
    if (!step || !st || st.done) return;
    if (step.domain === "sentence") {
      var attempt = st.chosen.map(function (c) { return c.word; }).join(" ");
      if (attempt === step.data.target) {
        var sc = scoreItem(st.firstTry, st.hints);
        recordCurrent(sc.result, sc.score);
        api.speak(step.data.target);
        api.render();
      } else {
        st.firstTry = false;
        st.nudge = t.sentenceWrong;
        api.render();
      }
    } else if (step.domain === "soundspan" && step.data.kind === "syll") {
      var joined = st.chosen.map(function (c) { return c.word; }).join("");
      if (joined === step.data.word) {
        var sc2 = scoreItem(st.firstTry, st.hints);
        recordCurrent(sc2.result, sc2.score);
        api.speak(step.data.word.toLowerCase());
        api.render();
      } else {
        st.firstTry = false;
        st.nudge = t.syllWrong;
        api.render();
      }
    }
  };

  A["var-speak"] = function () {
    var step = curStep();
    if (!step) return;
    if (step.domain === "sentence") api.speak(step.data.target);
    else if (step.domain === "soundspan" && step.data.kind === "syll") speakSlow(step.data.word.toLowerCase());
  };

  A["var-play"] = function () {
    var step = curStep();
    if (step && step.data && step.data.targetWord) speakSlow(step.data.targetWord);
  };

  A["var-sopt"] = function (b) {
    var step = curStep(), st = V && V.st, t = T();
    if (!step || !st || st.done) return;
    var i = +b.getAttribute("data-i");
    if (i === step.data.ans) {
      var sc = scoreItem(st.firstTry, st.hints);
      recordCurrent(sc.result, sc.score);
      st.nudge = "";
      api.speak(step.data.items[i].w);
      api.render();
    } else {
      st.elim[i] = true;
      st.firstTry = false;
      st.nudge = t.optWrong;
      api.render();
    }
  };

  A["var-feat"] = function (b) {
    var step = curStep(), st = V && V.st, t = T();
    if (!step || !st || st.done) return;
    var ans = b.getAttribute("data-ans") === "true";
    if (ans === step.data.ans) {
      var sc = scoreItem(st.firstTry, st.hints);
      recordCurrent(sc.result, sc.score);
      st.nudge = "";
      api.render();
    } else {
      st.elim[String(ans)] = true;
      st.firstTry = false;
      st.nudge = t.optWrong;
      api.render();
    }
  };

  A["var-popt"] = function (b) {
    var step = curStep(), st = V && V.st, t = T();
    if (!step || !st || st.done) return;
    var i = +b.getAttribute("data-i");
    if (i === step.data.ans) {
      var sc = scoreItem(st.firstTry, st.hints);
      recordCurrent(sc.result, sc.score);
      st.nudge = "";
      api.speak(step.data.targetWord);
      api.render();
    } else {
      st.elim[i] = true;
      st.firstTry = false;
      st.nudge = t.optWrong;
      api.render();
    }
  };

  A["var-span-play"] = function () {
    var step = curStep();
    if (step && step.data && step.data.sequence) playSpanSequence(step.data.sequence);
  };

  A["var-span-ready"] = function () {
    clearSpanTimer();
    if (!V || !V.st) return;
    V.st.spanPhase = "recall";
    V.st.highlightIdx = -1;
    api.render();
  };

  A["var-span-pick"] = function (b) {
    var step = curStep(), st = V && V.st, t = T();
    if (!step || !st || st.done) return;
    var card = st.optOrder[+b.getAttribute("data-i")];
    if (!card) return;
    var expected = step.data.sequence[st.chosen.length];
    if (expected && card.w === expected.w) {
      st.chosen.push(card);
      st.nudge = "";
      if (st.chosen.length === step.data.sequence.length) {
        var sc = scoreItem(st.firstTry, st.hints);
        recordCurrent(sc.result, sc.score);
      }
      api.render();
    } else {
      st.firstTry = false;
      st.nudge = t.spanWrong;
      api.render();
    }
  };

  A["var-hint"] = function () {
    var step = curStep(), st = V && V.st, t = T();
    if (!step || !st || st.done) return;
    st.hints++;
    if (step.domain === "sentence" || (step.domain === "soundspan" && step.data.kind === "syll")) {
      var expectedTokens = step.domain === "sentence" ? step.data.tokens : step.data.syllables;
      /* Keep valid matching prefix, return mismatching tail back to pool */
      var k = 0;
      while (k < st.chosen.length && k < expectedTokens.length && st.chosen[k].word === expectedTokens[k]) k++;
      for (var r = st.chosen.length - 1; r >= k; r--) {
        if (st.pool[st.chosen[r].idx]) st.pool[st.chosen[r].idx].used = false;
        st.chosen.pop();
      }
      if (k < expectedTokens.length) {
        var want = expectedTokens[k], poolIdx = -1;
        for (var p = 0; p < st.pool.length; p++) {
          if (!st.pool[p].used && st.pool[p].word === want) { poolIdx = p; break; }
        }
        if (poolIdx >= 0) {
          st.pool[poolIdx].used = true;
          st.chosen.push({ idx: poolIdx, word: want });
        }
      }
      st.nudge = t.hintPlaced;
      if (step.domain === "sentence" && st.hints >= 2) api.speak(step.data.target);
      if (step.domain === "soundspan" && st.chosen.length === step.data.syllables.length &&
          st.chosen.map(function (c) { return c.word; }).join("") === step.data.word) {
        recordCurrent("almost", 0.5);
      }
      api.render();
    } else if (step.domain === "semantic") {
      if (st.hints >= 2 && step.data.items) {
        for (var oi = 0; oi < step.data.items.length; oi++) {
          if (oi !== step.data.ans && !st.elim[oi]) { st.elim[oi] = true; break; }
        }
      }
      api.render();
    } else if (step.domain === "soundspan") {
      if (step.data.kind === "pair") {
        speakSlow(step.data.targetWord);
        api.render();
      } else if (step.data.kind === "span") {
        var nextItem = step.data.sequence[st.chosen.length];
        if (nextItem) {
          st.chosen.push({ w: nextItem.w, pic: nextItem.pic, orig: st.chosen.length });
          st.nudge = t.hintPlaced;
          if (st.chosen.length === step.data.sequence.length) recordCurrent("almost", 0.5);
        }
        api.render();
      }
    }
  };

  A["var-reveal"] = function () {
    var step = curStep(), st = V && V.st, t = T();
    if (!step || !st || st.done) return;
    if (step.domain === "sentence" || (step.domain === "soundspan" && step.data.kind === "syll")) {
      var expectedTokens = step.domain === "sentence" ? step.data.tokens : step.data.syllables;
      st.chosen = expectedTokens.map(function (w, i) { return { idx: i, word: w }; });
      st.nudge = t.modelFeedback;
      recordCurrent("model", 0);
      if (step.domain === "sentence") api.speak(step.data.target);
      else speakSlow(step.data.word.toLowerCase());
      api.render();
    }
  };

  document.addEventListener("change", function (e) {
    if (api.screen() !== "variants" || !e.target) return;
    if (e.target.id === "var-auto") {
      var cfg = getSettings(); cfg.auto = !!e.target.checked;
      api.save("variant_settings", cfg);
    }
  });

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() !== "variants") return;
    if (V && !V.done) {
      /* Reset active queue cleanly to the new language so bilingual prompts never mix languages. */
      startRun(V.mode);
    } else {
      api.render();
    }
  });

  window.addEventListener("pog:profile-change", function () {
    stopVoice();
    V = null;
  });

  window.POG.variants = {
    DOMAINS: DOMAINS,
    FOCUS: Object.keys(FOCUS_WEIGHTS),
    MAXLV: MAXLV,
    buildQueue: buildQueue,
    scoreItem: scoreItem,
    settings: getSettings,
    levels: getLevels,
    listSessions: listSessions,
    label: function (d) { return (T().domains && T().domains[d]) || d; }
  };

  if (api.screen() === "home") api.render();
})();
