/*
 * Receptive Syntax & Multi-Step Instruction Following ("Segui i passaggi / Follow instructions").
 * Screens: `instructions` (active 3-item multi-step comprehension drill & session summary).
 *
 * Interactive flow:
 *   - Displays spoken/written instruction + slow replay + step breakdown hint.
 *   - Learner taps 1–3 matching tokens in the required syntactic/temporal order.
 *   - Out-of-order target taps trigger a helpful sequence nudge without disabling future tokens;
 *     irrelevant/attribute foils dim cleanly and record error subtype (`order_error`, `attribute_foil`, `clause_trap`).
 *   - Stored strictly locally on this device (`instructions_sessions`, adaptive `instructions_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.INSTRUCTIONS;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Segui i passaggi",
      desc: "Allena la comprensione di istruzioni a più passi, «prima / dopo» e scelte precise.",
      lvTag: "Livello {n}",
      stepOf: "Istruzione {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta istruzione",
      listenSlow: "🐢 Ascolta piano",
      hint: "💡 Scomponi i passi",
      wrongOrder: "Questo elemento servirà dopo: controlla quale passo viene prima.",
      wrongFoil: "Controlla bene colore, misura o negazione: riprova.",
      stepOk: "Passo giusto! Prosegui con il prossimo.",
      good: "Istruzione seguita perfettamente!",
      almost: "Completata con un piccolo aiuto.",
      next: "Avanti",
      done: "Fatto",
      kinds: { sequence: "Sequenza", attribute: "Attributi", clause: "Frasi complesse" },
      sumTitle: "Istruzioni completate",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le istruzioni completate.",
      colSent: "Tipo / Istruzione",
      colRes: "Esito",
      resGood: "Al primo colpo",
      resAlmost: "Con aiuto",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Follow instructions",
      desc: "Practise multi-step commands, “before / after” clauses, and careful attribute selection.",
      lvTag: "Level {n}",
      stepOf: "Instruction {i} of {n}",
      stop: "Stop",
      listen: "🔊 Hear instruction",
      listenSlow: "🐢 Hear slowly",
      hint: "💡 Break down steps",
      wrongOrder: "That item belongs later — check which step comes first.",
      wrongFoil: "Check size, colour, or negation carefully and try again.",
      stepOk: "Right step! Tap the next item.",
      good: "Every step followed cleanly!",
      almost: "Completed with a little support.",
      next: "Next",
      done: "Finish",
      kinds: { sequence: "Sequence", attribute: "Attributes", clause: "Complex clauses" },
      sumTitle: "Instructions complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All multi-step instructions finished.",
      colSent: "Task / Instruction",
      colRes: "Result",
      resGood: "Clean first pass",
      resAlmost: "Assisted",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("instructions_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("instructions_sessions"); return Array.isArray(s) ? s : []; }

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
      return Object.assign({}, it, { shuffledTokens: shuffle(it.tokens || []) });
    });
  }

  function computeInstructionsProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, firstTry = 0, scores = [];
    var errors = { order_error: 0, attribute_foil: 0, clause_trap: 0 };
    var byKind = { sequence: { n: 0, ok: 0 }, attribute: { n: 0, ok: 0 }, clause: { n: 0, ok: 0 } };
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.firstTry) firstTry++;
        var k = byKind[it.kind] ? it.kind : "sequence";
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
      chosenIds: [],
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
      id: "inst" + Date.now().toString(36),
      lv: lv,
      steps: queue,
      i: 0,
      st: initStep(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("instructions");
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
      api.save("instructions_sessions", all);
      var nextLv = maybeAdaptLevel(V.lv, all);
      if (nextLv !== V.lv) api.save("instructions_level", nextLv);
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
        '<button type="button" class="primary" data-act="inst-var-hub">' + esc(t.backVar) + '</button>' +
        '<button type="button" class="link" data-act="inst-back">' + esc(t.backHome) + '</button></section>';
    }

    var st = V.st, item = st.item;
    var byId = {};
    item.tokens.forEach(function (tk) { byId[tk.id] = tk; });

    var bar = '<div class="bar"><span class="brand">' + esc(t.btn) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="inst-stop">' + esc(t.stop) + '</button></div>';

    var trayHtml = '<div class="inst-tray">' + item.targetIds.map(function (_, idx) {
      var cid = st.chosenIds[idx];
      var tok = cid ? byId[cid] : null;
      return '<div class="inst-step' + (tok ? ' ok' : '') + '">' +
        '<span class="nr-num">' + (idx + 1) + '</span>' +
        '<span>' + (tok ? tok.pic + ' ' + esc(tok.label) : '···') + '</span></div>';
    }).join("") + '</div>';

    var cueHtml = st.hintShown ? '<div class="hint"><b>1</b><span>' + esc(item.cue) + '</span></div>' : '';

    var body = "";
    if (st.done) {
      body = trayHtml +
        '<div class="var-feedback good"><p><strong>' + esc(st.firstTry ? t.good : t.almost) + '</strong> ' + esc(item.explanation) + '</p></div>' +
        '<button type="button" class="primary" data-act="inst-next">' + esc(V.i + 1 < V.steps.length ? t.next : t.done) + '</button>';
    } else {
      var boardHtml = '<div class="inst-board">' + item.shuffledTokens.map(function (tk) {
        var used = st.chosenIds.indexOf(tk.id) >= 0;
        var dimmed = !!st.elim[tk.id];
        var cls = "inst-tok" + (used ? " ok" : dimmed ? " dim" : "");
        return '<button type="button" class="' + cls + '" data-act="inst-pick" data-id="' + esc(tk.id) + '"' + (used || dimmed ? ' disabled' : '') + '>' +
          '<span class="var-opt-pic" aria-hidden="true">' + tk.pic + '</span><span>' + esc(tk.label) + '</span></button>';
      }).join("") + '</div>';

      body = '<div class="tools">' +
        '<button type="button" class="tool" data-act="inst-say">' + esc(t.listen) + '</button>' +
        '<button type="button" class="tool" data-act="inst-slow">' + esc(t.listenSlow) + '</button>' +
        '<button type="button" class="tool" data-act="inst-hint"' + (st.hintShown ? ' disabled' : '') + '>' + esc(t.hint) + '</button>' +
        '</div>' +
        cueHtml +
        trayHtml +
        boardHtml +
        (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '');
    }

    return bar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: V.lv })) + ' · ' + esc(t.kinds[item.kind] || item.kind) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + item.pic + '</div>' +
      '<p class="instr">' + esc(item.instruction) + '</p>' +
      body +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.instructions = viewScreen;

  A["inst-home"] = function () { startDrill(); };
  A["inst-stop"] = function () { finishSession(true); };
  A["inst-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["inst-var-hub"] = function () { stopVoice(); V = null; api.go("variants"); };
  A["inst-say"] = function () { if (V && V.st && V.st.item) api.speak(V.st.item.instruction); };
  A["inst-slow"] = function () { if (V && V.st && V.st.item) speakSlow(V.st.item.slowText || V.st.item.instruction); };
  A["inst-hint"] = function () { if (!V || !V.st || V.st.done) return; V.st.hintShown = true; api.render(); };

  A["inst-pick"] = function (b) {
    if (!V || !V.st || V.st.done) return;
    var st = V.st, item = st.item, id = b.getAttribute("data-id");
    if (!id || st.chosenIds.indexOf(id) >= 0 || st.elim[id]) return;

    var expectedId = item.targetIds[st.chosenIds.length];
    if (id === expectedId) {
      st.chosenIds.push(id);
      if (st.chosenIds.length === item.targetIds.length) {
        st.done = true;
        st.firstTry = st.attempts === 0 && !st.hintShown;
        st.nudge = "";
        var sc = st.firstTry ? 1 : (st.attempts === 0 && st.hintShown ? 0.8 : Math.max(0.5, 0.85 - st.attempts * 0.15));
        V.log.push({
          game: "instructions",
          id: item.id,
          kind: item.kind,
          lv: V.lv,
          label: item.instruction.slice(0, 48),
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
        st.nudge = T().stepOk;
      }
    } else {
      st.attempts++;
      var remaining = item.targetIds.slice(st.chosenIds.length);
      if (remaining.indexOf(id) >= 0) {
        /* Target belongs to a later step: never disable so user can pick it at the right step. */
        if (!st.errType) st.errType = "order_error";
        st.nudge = T().wrongOrder;
      } else {
        st.elim[id] = true;
        if (!st.errType) st.errType = item.errFocus || "attribute_foil";
        st.nudge = T().wrongFoil;
      }
    }
    api.render();
  };

  A["inst-next"] = function () {
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
    if (api.screen() === "instructions" && V && !V.done) startDrill();
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.instructions = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    level: getLevel,
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeInstructionsProfile: computeInstructionsProfile
  };
})();
