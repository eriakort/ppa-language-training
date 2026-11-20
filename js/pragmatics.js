/*
 * Conversational Pragmatics & Non-Literal Language ("Oltre le parole / Beyond literal words").
 * Screens: `pragmatics` (interactive 3-item non-literal comprehension drill & summary).
 *
 * Interactive flow:
 *   - Displays everyday context + spoken/written utterance + slow replay + context clue (`💡`).
 *   - Shuffles 3 meanings (intended pragmatic meaning, literal trap, social context foil).
 *   - First-error attribution records `literal_trap` vs `context_slip` for clinical brief patterns.
 *   - Stored strictly locally on this device (`pragmatics_sessions`, adaptive `pragmatics_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.PRAGMATICS;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Oltre le parole",
      desc: "Cogli modi di dire, richieste gentili indirette e ironia nel contesto quotidiano.",
      lvTag: "Livello {n}",
      stepOf: "Situazione {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta frase",
      listenSlow: "🐢 Ascolta piano",
      hint: "💡 Indizio sul contesto",
      askMean: "Che cosa intende davvero chi parla?",
      wrongLiteral: "Attenzione al significato alla lettera: rileggi la situazione intorno alla frase.",
      wrongContext: "Quasi: guarda bene lo scopo sociale della frase e riprova.",
      good: "Significato colto perfettamente!",
      almost: "Corretto con un piccolo aiuto.",
      next: "Avanti",
      done: "Fatto",
      kinds: { idiom: "Modo di dire", indirect: "Richiesta indiretta", tone: "Tono e ironia" },
      sumTitle: "Pragmatica completata",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le situazioni completate.",
      colSent: "Tipo / Situazione",
      colRes: "Esito",
      resGood: "Al primo colpo",
      resAlmost: "Con aiuto",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Beyond literal words",
      desc: "Spot everyday idioms, polite indirect requests, and speaker tone in context.",
      lvTag: "Level {n}",
      stepOf: "Situation {i} of {n}",
      stop: "Stop",
      listen: "🔊 Hear phrase",
      listenSlow: "🐢 Hear slowly",
      hint: "💡 Context clue",
      askMean: "What does the speaker really mean?",
      wrongLiteral: "Watch out for the word-for-word trap — check the situation around the words.",
      wrongContext: "Not quite — look closely at the speaker's social purpose and try again.",
      good: "Intended meaning caught right away!",
      almost: "Solved with a little support.",
      next: "Next",
      done: "Finish",
      kinds: { idiom: "Idiom", indirect: "Indirect request", tone: "Tone & irony" },
      sumTitle: "Pragmatics complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All pragmatic situations finished.",
      colSent: "Type / Situation",
      colRes: "Result",
      resGood: "Clean first try",
      resAlmost: "Assisted",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("pragmatics_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("pragmatics_sessions"); return Array.isArray(s) ? s : []; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function buildDrill(lang, level, count) {
    var bank = CONTENT[lang] || CONTENT.it;
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
    return picked.map(function (it) {
      var order = shuffle([0, 1, 2]);
      return Object.assign({}, it, { shuffledOrder: order });
    });
  }

  function classifyErrorIdx(origIdx) {
    return origIdx === 1 ? "literal_trap" : "context_slip";
  }

  function computePragmaticsProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, firstTry = 0, scores = [];
    var errors = { literal_trap: 0, context_slip: 0 };
    var byKind = { idiom: { n: 0, ok: 0 }, indirect: { n: 0, ok: 0 }, tone: { n: 0, ok: 0 } };
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.firstTry) firstTry++;
        var k = byKind[it.kind] ? it.kind : "idiom";
        byKind[k].n++;
        if (it.firstTry) byKind[k].ok++;
        if (it.errType && errors[it.errType] != null) errors[it.errType]++;
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    var acc = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
    return { total: total, firstTry: firstTry, errors: errors, byKind: byKind, accuracy: acc };
  }

  function maybeAdaptLevel(lv, sessions) {
    if (!sessions.length) return lv;
    var vals = sessions.map(function (s) { return s.accuracy != null ? s.accuracy : 0.7; });
    if (vals.length >= RULE.downN) {
      var dSlice = vals.slice(-RULE.downN);
      if (dSlice.reduce(function (a, b) { return a + b; }, 0) / dSlice.length < RULE.down && lv < MAXLV) return lv + 1;
    }
    if (vals.length >= RULE.upN) {
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

  function initStep(item) {
    return {
      item: item,
      startedAt: Date.now(),
      elim: {},
      attempts: 0,
      errType: null,
      hintShown: false,
      done: false,
      firstTry: false,
      nudge: ""
    };
  }

  function startDrill() {
    stopVoice();
    var lv = getLevel();
    var queue = buildDrill(api.lang(), lv, 3);
    if (!queue.length) return;
    V = {
      id: "pg" + Date.now().toString(36),
      lv: lv,
      steps: queue,
      i: 0,
      st: initStep(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("pragmatics");
  }

  function finishSession(stopped) {
    stopVoice();
    if (!V) return;
    V.done = true;
    V.stopped = !!stopped;
    if (V.log.length && !V.saved) {
      V.saved = true;
      var acc = V.log.reduce(function (a, b) { return a + b.score; }, 0) / V.log.length;
      var sess = {
        id: V.id,
        date: new Date().toISOString(),
        who: "solo",
        lv: V.lv,
        accuracy: Math.round(acc * 1000) / 1000,
        items: V.log.slice()
      };
      var all = listSessions().concat([sess]).slice(-KEEP);
      api.save("pragmatics_sessions", all);
      var nextLv = maybeAdaptLevel(V.lv, all);
      if (nextLv !== V.lv) api.save("pragmatics_level", nextLv);
    }
    api.render();
  }

  function viewScreen() {
    if (!V) { startDrill(); if (!V) return api.header(false); }
    var t = T();
    if (V.done) {
      var rows = V.log.map(function (r) {
        return '<tr><td>' + esc((t.kinds[r.kind] || r.kind) + " · " + r.label) + '</td>' +
          '<td><span class="pill ' + esc(r.result) + '">' + esc(r.firstTry ? t.resGood : t.resAlmost) + '</span></td></tr>';
      }).join("");
      return api.header(false) + '<section class="card">' +
        '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
        '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p>' +
        (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colSent) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '') +
        '<button type="button" class="primary" data-act="prag-var-hub">' + esc(t.backVar) + '</button>' +
        '<button type="button" class="link" data-act="prag-back">' + esc(t.backHome) + '</button></section>';
    }

    var st = V.st, item = st.item;
    var bar = '<div class="bar"><span class="brand">' + esc(t.btn) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="prag-stop">' + esc(t.stop) + '</button></div>';

    var cueHtml = st.hintShown ? '<div class="hint"><b>1</b><span>' + esc(item.cue) + '</span></div>' : '';

    var optsHtml = '<div class="var-opts nr-gists">' + item.shuffledOrder.map(function (origIdx) {
      var ok = st.done && origIdx === 0;
      var dim = !!st.elim[origIdx];
      var cls = "var-opt" + (ok ? " ok" : dim ? " dim" : "");
      return '<button type="button" class="' + cls + '" data-act="prag-pick" data-i="' + origIdx + '"' + (st.done || dim ? ' disabled' : '') + '>' +
        '<span>' + esc(item.opts[origIdx]) + '</span></button>';
    }).join("") + '</div>';

    var body = "";
    if (st.done) {
      body = optsHtml +
        '<div class="var-feedback good"><p><strong>' + esc(st.firstTry ? t.good : t.almost) + '</strong> ' + esc(item.explanation) + '</p></div>' +
        '<button type="button" class="primary" data-act="prag-next">' + esc(V.i + 1 < V.steps.length ? t.next : t.done) + '</button>';
    } else {
      body = '<div class="tools">' +
        '<button type="button" class="tool" data-act="prag-say">' + esc(t.listen) + '</button>' +
        '<button type="button" class="tool" data-act="prag-slow">' + esc(t.listenSlow) + '</button>' +
        '<button type="button" class="tool" data-act="prag-hint"' + (st.hintShown ? ' disabled' : '') + '>' + esc(t.hint) + '</button>' +
        '</div>' +
        cueHtml +
        '<p class="vb-sub">' + esc(t.askMean) + '</p>' +
        optsHtml +
        (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '');
    }

    return bar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: V.lv })) + ' · ' + esc(t.kinds[item.kind] || item.kind) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + item.pic + '</div>' +
      '<p class="sub">' + esc(item.context) + '</p>' +
      '<div class="dg-bubble"><p>' + esc(item.utterance) + '</p></div>' +
      body +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.pragmatics = viewScreen;

  A["prag-home"] = function () { startDrill(); };
  A["prag-stop"] = function () { finishSession(true); };
  A["prag-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["prag-var-hub"] = function () { stopVoice(); V = null; api.go("variants"); };
  A["prag-say"] = function () { if (V && V.st && V.st.item) api.speak(V.st.item.utterance); };
  A["prag-slow"] = function () { if (V && V.st && V.st.item) speakSlow(V.st.item.slowText || V.st.item.utterance); };
  A["prag-hint"] = function () { if (!V || !V.st || V.st.done) return; V.st.hintShown = true; api.render(); };

  A["prag-pick"] = function (b) {
    if (!V || !V.st || V.st.done) return;
    var st = V.st, item = st.item, origIdx = +b.getAttribute("data-i");
    if (isNaN(origIdx) || st.elim[origIdx]) return;

    if (origIdx === 0) {
      st.done = true;
      st.firstTry = st.attempts === 0 && !st.hintShown;
      st.nudge = "";
      var sc = st.firstTry ? 1 : (st.attempts === 0 && st.hintShown ? 0.8 : Math.max(0.5, 0.85 - st.attempts * 0.15));
      V.log.push({
        game: "pragmatics",
        id: item.id,
        kind: item.kind,
        lv: V.lv,
        label: item.utterance.slice(0, 48),
        firstTry: st.firstTry,
        hintUsed: st.hintShown,
        attempts: st.attempts,
        errType: st.errType,
        result: st.firstTry ? "good" : "almost",
        score: Math.round(sc * 100) / 100,
        ms: Date.now() - st.startedAt
      });
      api.speak(item.explanation);
    } else {
      st.attempts++;
      st.elim[origIdx] = true;
      var kindErr = classifyErrorIdx(origIdx);
      if (!st.errType) st.errType = kindErr;
      st.nudge = kindErr === "literal_trap" ? T().wrongLiteral : T().wrongContext;
    }
    api.render();
  };

  A["prag-next"] = function () {
    stopVoice();
    if (!V) return;
    if (V.i + 1 < V.steps.length) {
      V.i++;
      V.st = initStep(V.steps[V.i]);
      api.render();
    } else {
      finishSession(false);
    }
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "pragmatics" && V && !V.done) startDrill();
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.pragmatics = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    level: getLevel,
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    listSessions: listSessions,
    buildDrill: buildDrill,
    classifyErrorIdx: classifyErrorIdx,
    computePragmaticsProfile: computePragmaticsProfile
  };
})();
