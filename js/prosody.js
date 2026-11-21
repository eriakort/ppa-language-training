/*
 * Prosody, Word Stress & Spoken Intonation module ("Accento e tono" / "Word stress & intonation").
 * Screen: `prosody` (interactive 3-item drill + completion summary).
 *
 * Targets nfvPPA / apraxia of speech (PPAOS) lexical stress errors and lvPPA / prosodic flat contour:
 *   1. `stress`  : tap the stressed syllable beat in minimal stress pairs or multisyllabic words
 *   2. `focus`   : tap the sentence word that carries contrastive prosodic prominence
 *   3. `contour` : match spoken intonation (question ↗, calm statement ↘, urgent alert !)
 *
 * Includes slow speech synthesis, visual pitch-contour SVG cue on hint, adaptive level `1..3`
 * stored strictly locally (`prosody_level`, `prosody_sessions`), and `computeProsodyProfile(sessions)`.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.PROSODY;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5 };

  var C = {
    it: {
      btn: "Accento, tono e ritmo",
      desc: "Allena dove cade l'accento nelle parole, l'enfasi nella frase e il tono di domanda o avviso.",
      lvNames: ["Impegnativo", "Intermedio", "Con più supporto"],
      lvTag: "Livello {n} · {name}",
      stepOf: "Prova {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta",
      listenSlow: "🐢 Ascolta piano",
      hint: "💡 Aiuto visivo",
      sayPractice: "Prova a dirlo ad alta voce con il tono giusto, poi vai avanti.",
      next: "Avanti",
      done: "Fatto",
      wrongStress: "Quella sillaba è debole: ascolta ancora e tocca il battito più forte.",
      wrongFocus: "Prova a mettere la forza sulla parola che risponde alla domanda.",
      wrongContour: "Ascolta come sale o scende la voce alla fine e riprova.",
      goodFeedback: "Perfetto al primo ascolto!",
      almostFeedback: "Ben fatto! Hai colto il ritmo giusto.",
      kinds: { stress: "Accento nella parola", focus: "Parola chiave nella frase", contour: "Tono e intenzione" },
      contourLabels: {
        question: "Curva della domanda (sale alla fine ↗)",
        statement: "Curva della frase calma (scende alla fine ↘)",
        urgent: "Curva di avviso urgente (picco iniziale deciso !)"
      },
      sumTitle: "Allenamento di accento e tono completato",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le prove completate.",
      colItem: "Prova",
      colRes: "Esito",
      res: { good: "Giusto", almost: "Quasi" },
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Word stress & intonation",
      desc: "Practise stressed syllable beats, sentence word emphasis, and question vs statement tone.",
      lvNames: ["Demanding", "Standard", "More support"],
      lvTag: "Level {n} · {name}",
      stepOf: "Item {i} of {n}",
      stop: "Stop",
      listen: "🔊 Listen",
      listenSlow: "🐢 Listen slowly",
      hint: "💡 Visual clue",
      sayPractice: "Try saying it aloud with that beat and tone, then continue.",
      next: "Next",
      done: "Finish",
      wrongStress: "That syllable is light — listen again and tap the strongest beat.",
      wrongFocus: "Lean on the word that directly answers the question.",
      wrongContour: "Listen to whether the pitch lifts or settles at the end.",
      goodFeedback: "Spot on first try!",
      almostFeedback: "Nice job finding the right beat and tone.",
      kinds: { stress: "Word stress", focus: "Sentence focus", contour: "Pitch & intent" },
      contourLabels: {
        question: "Question contour (rises at the end ↗)",
        statement: "Statement contour (settles down gently ↘)",
        urgent: "Urgent alert contour (sharp peak !)"
      },
      sumTitle: "Word stress & intonation complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All prosody items finished.",
      colItem: "Item",
      colRes: "Result",
      res: { good: "Right", almost: "Nearly" },
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("prosody_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("prosody_sessions"); return Array.isArray(s) ? s : []; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function buildDrill(langCode, level, count) {
    var bank = CONTENT[langCode === "en" ? "en" : "it"] || CONTENT.it;
    var lv = level >= 1 && level <= MAXLV ? level : 2;
    var targetN = count || 3;
    var same = shuffle(bank.filter(function (x) { return x.lv === lv; }));
    var near = shuffle(bank.filter(function (x) { return x.lv !== lv; })).sort(function (a, b) {
      return Math.abs(a.lv - lv) - Math.abs(b.lv - lv);
    });
    var pool = same.concat(near);
    var picked = [], seenKinds = {};
    for (var i = 0; i < pool.length && picked.length < targetN; i++) {
      if (!seenKinds[pool[i].kind]) {
        picked.push(pool[i]);
        seenKinds[pool[i].kind] = true;
      }
    }
    for (var j = 0; j < pool.length && picked.length < targetN; j++) {
      if (picked.indexOf(pool[j]) < 0) picked.push(pool[j]);
    }
    return picked.map(function (it) { return Object.assign({}, it); });
  }

  function computeProsodyProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, firstTry = 0, hintUsed = 0, scores = [];
    var byKind = {
      stress: { n: 0, ok: 0 },
      focus: { n: 0, ok: 0 },
      contour: { n: 0, ok: 0 }
    };
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.firstTry) firstTry++;
        if (it.hintUsed) hintUsed++;
        var k = byKind[it.kind] ? it.kind : "stress";
        byKind[k].n++;
        if (it.firstTry) byKind[k].ok++;
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    return {
      total: total,
      firstTry: firstTry,
      hintUsed: hintUsed,
      byKind: byKind,
      accuracy: scores.length ? Math.round((scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) * 1000) / 1000 : null
    };
  }

  function maybeAdaptLevel(lv, sessions) {
    if (!sessions.length) return lv;
    var vals = sessions.map(function (s) { return s.accuracy != null ? s.accuracy : 0.75; });
    if (vals.length >= RULE.downN) {
      var dSlice = vals.slice(-RULE.downN);
      if (dSlice.reduce(function (a, b) { return a + b; }, 0) / dSlice.length < RULE.down && lv < MAXLV) return lv + 1;
    }
    var vs = api.load("variant_settings") || {};
    if (vs.allowUp !== false && vals.length >= RULE.upN) {
      var uSlice = vals.slice(-RULE.upN);
      if (uSlice.reduce(function (a, b) { return a + b; }, 0) / uSlice.length >= RULE.up && lv > 1) return lv - 1;
    }
    return lv;
  }

  var V = null;
  function stopVoice() { if (api.stopVoice) api.stopVoice(); }
  function speakSlow(text) {
    if (!text) return;
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = api.lang() === "it" ? "it-IT" : "en-US";
        u.rate = 0.78;
        window.speechSynthesis.speak(u);
        return;
      }
    } catch (e) {}
    api.speak(text);
  }

  function contourSvg(contour, t) {
    var path = contour === "question"
      ? "M 14 42 Q 70 40 120 34 T 192 12"
      : contour === "urgent"
      ? "M 14 26 L 54 10 L 96 30 L 146 24 L 192 32"
      : "M 14 20 Q 85 20 140 34 T 192 44";
    var endDot = contour === "question" ? [192, 12] : contour === "urgent" ? [54, 10] : [192, 44];
    var lbl = (t.contourLabels && t.contourLabels[contour]) || contour;
    return '<div class="pr-contour" aria-label="' + esc(lbl) + '">' +
      '<svg viewBox="0 0 206 54" role="img" aria-label="' + esc(lbl) + '">' +
      '<path d="' + path + '" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + endDot[0] + '" cy="' + endDot[1] + '" r="5" fill="currentColor"/>' +
      '</svg>' +
      '<span>' + esc(lbl) + '</span></div>';
  }

  function initStep(item) {
    return {
      item: item,
      startedAt: Date.now(),
      firstTry: true,
      hintUsed: false,
      elim: {},
      done: false,
      result: null,
      nudge: "",
      optOrder: item.kind === "contour" ? shuffle(item.choices.map(function (_, i) { return i; })) : null
    };
  }

  function recordStep(st, result, scoreVal) {
    if (!V || !st || st.recorded) return;
    st.recorded = true;
    st.done = true;
    st.result = result;
    var item = st.item;
    var lbl = item.word || item.utterance || (item.words ? item.words.join(" ") : item.id);
    V.log.push({
      game: "prosody",
      id: item.id,
      kind: item.kind,
      lv: item.lv,
      label: lbl,
      firstTry: !!st.firstTry && !st.hintUsed,
      hintUsed: !!st.hintUsed,
      result: result,
      score: scoreVal,
      ms: Date.now() - st.startedAt
    });
  }

  function startDrill() {
    stopVoice();
    var lv = getLevel();
    var queue = buildDrill(api.lang(), lv, 3);
    if (!queue.length) return;
    V = {
      id: "pr" + Date.now().toString(36),
      lv: lv,
      steps: queue,
      i: 0,
      st: initStep(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("prosody");
  }

  function finishSession(stopped) {
    stopVoice();
    if (!V) return;
    V.done = true;
    V.stopped = !!stopped;
    if (V.log.length && !V.saved) {
      V.saved = true;
      var acc = V.log.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / V.log.length;
      var sess = {
        id: V.id,
        date: new Date().toISOString(),
        who: "solo",
        lv: V.lv,
        accuracy: Math.round(acc * 1000) / 1000,
        items: V.log.slice()
      };
      var all = listSessions().concat([sess]).slice(-KEEP);
      api.save("prosody_sessions", all);
      var nextLv = maybeAdaptLevel(V.lv, all);
      if (nextLv !== V.lv) api.save("prosody_level", nextLv);
    }
    api.render();
  }

  function viewScreen() {
    if (!V) { startDrill(); if (!V) return api.header(false); }
    var t = T();
    if (V.done) {
      var rows = V.log.map(function (r) {
        return '<tr><td>' + esc((t.kinds[r.kind] || r.kind) + " · " + r.label) + '</td>' +
          '<td><span class="pill ' + esc(r.result) + '">' + esc(t.res[r.result] || r.result) + '</span></td></tr>';
      }).join("");
      return api.header(false) + '<section class="card">' +
        '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
        '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p>' +
        (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colItem) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '') +
        '<button type="button" class="primary" data-act="pros-var-hub">' + esc(t.backVar) + '</button>' +
        '<button type="button" class="link" data-act="pros-back">' + esc(t.backHome) + '</button></section>';
    }

    var st = V.st, item = st.item;
    var bar = '<div class="bar"><span class="brand">' + esc(t.btn) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="pros-stop">' + esc(t.stop) + '</button></div>';
    var stepsBar = '<ol class="steps" aria-label="Progress">' + V.steps.map(function (_, idx) {
      var cls = idx < V.i ? "past" : idx === V.i ? "on" : "";
      return '<li class="' + cls + '">' + esc(String(idx + 1)) + '</li>';
    }).join("") + '</ol>';

    var bodyHtml = "";
    if (item.kind === "stress") {
      bodyHtml = '<p class="cue">' + esc(item.word) + '</p>' +
        '<div class="pr-syls" role="group" aria-label="' + esc(item.word) + '">' +
        item.syllables.map(function (syl, idx) {
          var cls = "pr-syl";
          if (st.done && idx === item.stressIdx) cls += " ok";
          else if (st.elim[idx]) cls += " dim";
          return '<button type="button" class="' + cls + '" data-act="pros-pick" data-i="' + idx + '"' + (st.done || st.elim[idx] ? ' disabled' : '') + '>' +
            (st.done && idx === item.stressIdx ? '<span class="pr-dot" aria-hidden="true">●</span>' : '') +
            '<span>' + esc(syl) + '</span></button>';
        }).join("") + '</div>';
    } else if (item.kind === "focus") {
      bodyHtml = '<div class="wb-cuebox"><strong>' + esc(item.question) + '</strong></div>' +
        '<div class="pr-words" role="group" aria-label="' + esc(item.question) + '">' +
        item.words.map(function (w, idx) {
          var cls = "pr-word";
          if (st.done && idx === item.focusIdx) cls += " ok";
          else if (st.elim[idx]) cls += " dim";
          return '<button type="button" class="' + cls + '" data-act="pros-pick" data-i="' + idx + '"' + (st.done || st.elim[idx] ? ' disabled' : '') + '>' +
            esc(w) + '</button>';
        }).join("") + '</div>';
    } else {
      bodyHtml = '<p class="phrase">' + esc(item.utterance) + '</p>' +
        ((st.hintUsed || st.done) ? contourSvg(item.contour, t) : '') +
        '<div class="var-opts">' + (st.optOrder || []).map(function (origIdx) {
          var cls = "var-opt";
          if (st.done && origIdx === item.ans) cls += " ok";
          else if (st.elim[origIdx]) cls += " dim";
          return '<button type="button" class="' + cls + '" data-act="pros-pick" data-i="' + origIdx + '"' + (st.done || st.elim[origIdx] ? ' disabled' : '') + '>' +
            '<span>' + esc(item.choices[origIdx]) + '</span></button>';
        }).join("") + '</div>';
    }

    var hintBox = st.hintUsed ? '<div class="hint"><b>1</b><span>' + esc(item.cue) + '</span></div>' : '';
    var footer = st.done
      ? '<div class="var-feedback good"><p><strong>' + esc(st.result === "good" ? t.goodFeedback : t.almostFeedback) + '</strong> ' + esc(item.explain) + '</p></div>' +
        '<p class="sub">' + esc(t.sayPractice) + '</p>' +
        '<div class="tools"><button type="button" class="tool" data-act="pros-say">' + esc(t.listen) + '</button>' +
        '<button type="button" class="tool" data-act="pros-slow">' + esc(t.listenSlow) + '</button></div>' +
        '<button type="button" class="primary" data-act="pros-next">' + esc(V.i + 1 < V.steps.length ? t.next : t.done) + '</button>'
      : '<div class="tools"><button type="button" class="tool" data-act="pros-say">' + esc(t.listen) + '</button>' +
        '<button type="button" class="tool" data-act="pros-slow">' + esc(t.listenSlow) + '</button>' +
        '<button type="button" class="tool" data-act="pros-hint"' + (st.hintUsed ? ' disabled' : '') + '>' + esc(t.hint) + '</button></div>';

    return bar + stepsBar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: item.lv, name: t.lvNames[item.lv - 1] })) + ' · ' + esc(t.kinds[item.kind] || item.kind) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + item.icon + '</div>' +
      '<h1 class="instr">' + esc(item.prompt) + '</h1>' +
      hintBox +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      bodyHtml +
      footer + '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.prosody = viewScreen;
  A["pros-home"] = startDrill;
  A["pros-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["pros-var-hub"] = function () { stopVoice(); V = null; api.go("variants"); };
  A["pros-stop"] = function () { finishSession(true); };
  A["pros-say"] = function () {
    var st = V && V.st;
    if (st && st.item) api.speak(st.item.spoken || st.item.utterance || st.item.word);
  };
  A["pros-slow"] = function () {
    var st = V && V.st;
    if (st && st.item) speakSlow(st.item.spoken || st.item.utterance || st.item.word);
  };
  A["pros-hint"] = function () {
    if (!V || !V.st || V.st.done) return;
    V.st.hintUsed = true;
    api.render();
  };
  A["pros-pick"] = function (b) {
    var st = V && V.st, t = T();
    if (!st || st.done) return;
    var item = st.item;
    var i = +b.getAttribute("data-i");
    var targetIdx = item.kind === "stress" ? item.stressIdx : (item.kind === "focus" ? item.focusIdx : item.ans);
    if (i === targetIdx) {
      var clean = st.firstTry && !st.hintUsed;
      recordStep(st, clean ? "good" : "almost", clean ? 1 : 0.6);
      st.nudge = "";
      api.speak(item.spoken || item.utterance || item.word);
      api.render();
    } else {
      st.elim[i] = true;
      st.firstTry = false;
      st.nudge = item.kind === "stress" ? t.wrongStress : (item.kind === "focus" ? t.wrongFocus : t.wrongContour);
      api.render();
    }
  };
  A["pros-next"] = function () {
    stopVoice();
    if (!V || V.done) return;
    if (V.i + 1 < V.steps.length) {
      V.i++;
      V.st = initStep(V.steps[V.i]);
      api.render();
    } else {
      finishSession(false);
    }
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "prosody") {
      if (V && !V.done) startDrill();
      else api.render();
    }
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.prosody = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    level: getLevel,
    lvTag: function () { var lv = getLevel(), t = T(); return api.fill(t.lvTag, { n: lv, name: t.lvNames[lv - 1] }); },
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeProsodyProfile: computeProsodyProfile
  };
})();
