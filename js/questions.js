/*
 * Functional Question Formulation & Repair module ("Fare domande chiare" / "Asking clear questions").
 * Screen: `questions` (interactive 3-item drill + completion summary).
 *
 * Clinically targets nfvPPA wh-question movement/syntax and everyday self-advocacy across 3 tasks:
 *   1. `wh`      : pick the right wh-question for an everyday need
 *   2. `build`   : tap word tiles in natural question order (progressive hint fills next slot)
 *   3. `clarify` : pick the clearest clarifying follow-up question after hearing a short message
 *
 * Supports slow speech synthesis, adaptive level `1..3` persisted strictly locally
 * (`questions_level`, `questions_sessions`), and `computeQuestionsProfile(sessions)`.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.QUESTIONS;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5 };

  var C = {
    it: {
      btn: "Fare domande chiare",
      desc: "Allena le parole per fare domande (chi, dove, quando, quanto), l'ordine e le richieste di chiarimento.",
      lvNames: ["Impegnativo", "Intermedio", "Con più supporto"],
      lvTag: "Livello {n} · {name}",
      stepOf: "Domanda {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta",
      listenSlow: "🐢 Ascolta piano",
      hint: "💡 Aiuto",
      clear: "Svuota",
      check: "Controlla",
      sayPractice: "Prova a fare questa domanda ad alta voce, poi continua.",
      next: "Avanti",
      done: "Fatto",
      wrongWh: "Controlla la parola iniziale della domanda (dove, quando, quanto, chi).",
      wrongBuild: "Controlla l'ordine delle parole: di solito si parte dalla parola della domanda.",
      wrongClarify: "Cerca la domanda che controlla o chiarisce proprio il dettaglio appena sentito.",
      goodFeedback: "Domanda chiara al primo colpo!",
      almostFeedback: "Ben fatto! Hai trovato la domanda giusta.",
      kinds: { wh: "Scegli la domanda", build: "Ordina la domanda", clarify: "Chiedi conferma" },
      sumTitle: "Allenamento domande completato",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le domande completate.",
      colItem: "Domanda",
      colRes: "Esito",
      res: { good: "Giusto", almost: "Quasi" },
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Asking clear questions",
      desc: "Practise wh-question words (where, when, how much), word order, and asking people to clarify.",
      lvNames: ["Demanding", "Standard", "More support"],
      lvTag: "Level {n} · {name}",
      stepOf: "Item {i} of {n}",
      stop: "Stop",
      listen: "🔊 Listen",
      listenSlow: "🐢 Listen slowly",
      hint: "💡 Hint",
      clear: "Clear",
      check: "Check",
      sayPractice: "Try asking this question aloud, then move on.",
      next: "Next",
      done: "Finish",
      wrongWh: "Check the question starter word (Where, What time, How much, Who).",
      wrongBuild: "Check the word order — most questions begin with the question word.",
      wrongClarify: "Pick the question that directly checks or clarifies what was just said.",
      goodFeedback: "Clear question on the first try!",
      almostFeedback: "Nice job finding the clearest question.",
      kinds: { wh: "Question word", build: "Build question", clarify: "Clarify & confirm" },
      sumTitle: "Asking clear questions complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All question items finished.",
      colItem: "Question",
      colRes: "Result",
      res: { good: "Right", almost: "Nearly" },
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("questions_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("questions_sessions"); return Array.isArray(s) ? s : []; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function derangedShuffle(arr) {
    var orig = arr.map(function (x) { return x.word; }).join("|");
    var out = shuffle(arr);
    if (out.length > 1 && out.map(function (x) { return x.word; }).join("|") === orig) {
      out.push(out.shift());
    }
    return out;
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

  function computeQuestionsProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, firstTry = 0, hintUsed = 0, scores = [];
    var byKind = {
      wh: { n: 0, ok: 0 },
      build: { n: 0, ok: 0 },
      clarify: { n: 0, ok: 0 }
    };
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.firstTry) firstTry++;
        if (it.hintUsed) hintUsed++;
        var k = byKind[it.kind] ? it.kind : "wh";
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

  function initStep(item) {
    var st = {
      item: item,
      startedAt: Date.now(),
      firstTry: true,
      hintUsed: false,
      elim: {},
      errType: null,
      done: false,
      result: null,
      nudge: ""
    };
    if (item.kind === "build") {
      st.pool = derangedShuffle((item.tokens || []).map(function (w) { return { word: w, used: false }; }));
      st.chosen = [];
    } else {
      st.optOrder = shuffle((item.choices || []).map(function (_, i) { return i; }));
    }
    return st;
  }

  function recordStep(st, result, scoreVal) {
    if (!V || !st || st.recorded) return;
    st.recorded = true;
    st.done = true;
    st.result = result;
    var item = st.item;
    var lbl = item.target || (item.choices && item.choices[item.ans]) || item.id;
    V.log.push({
      game: "questions",
      id: item.id,
      kind: item.kind,
      lv: item.lv,
      label: lbl,
      firstTry: !!st.firstTry && !st.hintUsed,
      hintUsed: !!st.hintUsed,
      errType: st.errType || null,
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
      id: "qs" + Date.now().toString(36),
      lv: lv,
      steps: queue,
      i: 0,
      st: initStep(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("questions");
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
      api.save("questions_sessions", all);
      var nextLv = maybeAdaptLevel(V.lv, all);
      if (nextLv !== V.lv) api.save("questions_level", nextLv);
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
        '<button type="button" class="primary" data-act="ques-var-hub">' + esc(t.backVar) + '</button>' +
        '<button type="button" class="link" data-act="ques-back">' + esc(t.backHome) + '</button></section>';
    }

    var st = V.st, item = st.item;
    var bar = '<div class="bar"><span class="brand">' + esc(t.btn) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="ques-stop">' + esc(t.stop) + '</button></div>';
    var stepsBar = '<ol class="steps" aria-label="Progress">' + V.steps.map(function (_, idx) {
      var cls = idx < V.i ? "past" : idx === V.i ? "on" : "";
      return '<li class="' + cls + '">' + esc(String(idx + 1)) + '</li>';
    }).join("") + '</ol>';

    var ctxHtml = "";
    if (item.whTag) {
      ctxHtml += '<span class="ques-wh-tag">' + esc(item.whTag) + '</span>';
    }
    if (item.situation) {
      ctxHtml += '<p class="sub">' + esc(item.situation) + '</p>';
    }
    if (item.heardMsg) {
      ctxHtml += '<div class="dg-bubble"><p>' + esc(item.heardMsg) + '</p></div>';
    }

    var bodyHtml = "";
    if (item.kind === "build") {
      var slots = '<div class="var-slots">' + item.tokens.map(function (_, idx) {
        var c = st.chosen[idx];
        var cls = "var-slot" + (c ? " has" : "") + (st.done ? " ok" : "");
        return '<button type="button" class="' + cls + '" data-act="ques-slot" data-i="' + idx + '"' + (!c || st.done ? ' disabled' : '') + '>' + (c ? esc(c.word) : "···") + '</button>';
      }).join("") + '</div>';
      var tiles = st.done ? "" : '<div class="var-tiles">' + st.pool.map(function (tl, idx) {
        return '<button type="button" class="var-tile' + (tl.used ? ' used' : '') + '" data-act="ques-tile" data-i="' + idx + '"' + (tl.used ? ' disabled aria-hidden="true"' : '') + '>' + esc(tl.word) + '</button>';
      }).join("") + '</div>';
      bodyHtml = slots + tiles;
    } else {
      bodyHtml = '<div class="var-opts">' + (st.optOrder || []).map(function (origIdx) {
        var cls = "var-opt";
        if (st.done && origIdx === item.ans) cls += " ok";
        else if (st.elim[origIdx]) cls += " dim";
        return '<button type="button" class="' + cls + '" data-act="ques-pick" data-i="' + origIdx + '"' + (st.done || st.elim[origIdx] ? ' disabled' : '') + '>' +
          '<span>' + esc(item.choices[origIdx]) + '</span></button>';
      }).join("") + '</div>';
    }

    var hintBox = st.hintUsed ? '<div class="hint"><b>1</b><span>' + esc(item.cue) + '</span></div>' : '';
    var footer = "";
    if (st.done) {
      footer = '<div class="var-feedback good"><p><strong>' + esc(st.result === "good" ? t.goodFeedback : t.almostFeedback) + '</strong> ' + esc(item.explain) + '</p></div>' +
        '<p class="sub">' + esc(t.sayPractice) + '</p>' +
        '<div class="tools"><button type="button" class="tool" data-act="ques-say">' + esc(t.listen) + '</button>' +
        '<button type="button" class="tool" data-act="ques-slow">' + esc(t.listenSlow) + '</button></div>' +
        '<button type="button" class="primary" data-act="ques-next">' + esc(V.i + 1 < V.steps.length ? t.next : t.done) + '</button>';
    } else if (item.kind === "build") {
      footer = '<div class="tools">' +
        '<button type="button" class="tool" data-act="ques-clear"' + (!st.chosen.length ? ' disabled' : '') + '>' + esc(t.clear) + '</button>' +
        '<button type="button" class="tool" data-act="ques-hint">' + esc(t.hint) + '</button></div>' +
        '<button type="button" class="primary" data-act="ques-check"' + (st.chosen.length === item.tokens.length ? '' : ' disabled') + '>' + esc(t.check) + '</button>';
    } else {
      footer = '<div class="tools">' +
        (item.heardMsg ? '<button type="button" class="tool" data-act="ques-say">' + esc(t.listen) + '</button><button type="button" class="tool" data-act="ques-slow">' + esc(t.listenSlow) + '</button>' : '') +
        '<button type="button" class="tool" data-act="ques-hint"' + (st.hintUsed ? ' disabled' : '') + '>' + esc(t.hint) + '</button></div>';
    }

    return bar + stepsBar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: item.lv, name: t.lvNames[item.lv - 1] })) + ' · ' + esc(t.kinds[item.kind] || item.kind) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + item.icon + '</div>' +
      ctxHtml +
      '<h1 class="instr">' + esc(item.prompt) + '</h1>' +
      hintBox +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      bodyHtml +
      footer + '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.questions = viewScreen;
  A["ques-home"] = startDrill;
  A["ques-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["ques-var-hub"] = function () { stopVoice(); V = null; api.go("variants"); };
  A["ques-stop"] = function () { finishSession(true); };
  A["ques-say"] = function () {
    var st = V && V.st;
    if (st && st.item) api.speak(st.done ? (st.item.target || (st.item.choices && st.item.choices[st.item.ans]) || st.item.spoken) : (st.item.spoken || st.item.heardMsg || st.item.target));
  };
  A["ques-slow"] = function () {
    var st = V && V.st;
    if (st && st.item) speakSlow(st.done ? (st.item.target || (st.item.choices && st.item.choices[st.item.ans]) || st.item.spoken) : (st.item.spoken || st.item.heardMsg || st.item.target));
  };
  A["ques-hint"] = function () {
    var st = V && V.st;
    if (!st || st.done) return;
    st.hintUsed = true;
    if (st.item.kind === "build") {
      // Fix mismatched prefix or place next target token cleanly.
      var targetTokens = st.item.tokens;
      var matched = 0;
      while (matched < st.chosen.length && st.chosen[matched].word === targetTokens[matched]) matched++;
      while (st.chosen.length > matched) {
        var popped = st.chosen.pop();
        if (st.pool[popped.idx]) st.pool[popped.idx].used = false;
      }
      if (matched < targetTokens.length) {
        var needed = targetTokens[matched];
        for (var k = 0; k < st.pool.length; k++) {
          if (!st.pool[k].used && st.pool[k].word === needed) {
            st.pool[k].used = true;
            st.chosen.push({ idx: k, word: st.pool[k].word });
            break;
          }
        }
      }
    }
    api.render();
  };
  A["ques-tile"] = function (b) {
    var st = V && V.st;
    if (!st || st.done || st.item.kind !== "build") return;
    var i = +b.getAttribute("data-i"), tl = st.pool[i];
    if (!tl || tl.used) return;
    tl.used = true;
    st.chosen.push({ idx: i, word: tl.word });
    st.nudge = "";
    api.render();
  };
  A["ques-slot"] = function (b) {
    var st = V && V.st;
    if (!st || st.done || st.item.kind !== "build") return;
    var i = +b.getAttribute("data-i"), c = st.chosen[i];
    if (!c) return;
    st.chosen.splice(i, 1);
    if (st.pool[c.idx]) st.pool[c.idx].used = false;
    st.nudge = "";
    api.render();
  };
  A["ques-clear"] = function () {
    var st = V && V.st;
    if (!st || st.done || st.item.kind !== "build") return;
    st.chosen = [];
    (st.pool || []).forEach(function (tl) { tl.used = false; });
    st.nudge = "";
    api.render();
  };
  A["ques-check"] = function () {
    var st = V && V.st, t = T();
    if (!st || st.done || st.item.kind !== "build") return;
    var attempt = st.chosen.map(function (c) { return c.word; }).join(" ");
    if (attempt === st.item.target) {
      var clean = st.firstTry && !st.hintUsed;
      recordStep(st, clean ? "good" : "almost", clean ? 1 : 0.6);
      st.nudge = "";
      api.speak(st.item.target);
      api.render();
    } else {
      st.firstTry = false;
      st.errType = "order_slip";
      st.nudge = t.wrongBuild;
      api.render();
    }
  };
  A["ques-pick"] = function (b) {
    var st = V && V.st, t = T();
    if (!st || st.done || st.item.kind === "build") return;
    var i = +b.getAttribute("data-i"), item = st.item;
    if (i === item.ans) {
      var clean = st.firstTry && !st.hintUsed;
      recordStep(st, clean ? "good" : "almost", clean ? 1 : 0.6);
      st.nudge = "";
      api.speak(item.spoken || item.choices[item.ans]);
      api.render();
    } else {
      st.elim[i] = true;
      st.firstTry = false;
      if (!st.errType) st.errType = (item.errTypes && item.errTypes[i]) || "wrong_wh";
      st.nudge = item.kind === "clarify" ? t.wrongClarify : t.wrongWh;
      api.render();
    }
  };
  A["ques-next"] = function () {
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
    if (api.screen() === "questions") {
      if (V && !V.done) startDrill();
      else api.render();
    }
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.questions = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    level: getLevel,
    lvTag: function () { var lv = getLevel(), t = T(); return api.fill(t.lvTag, { n: lv, name: t.lvNames[lv - 1] }); },
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeQuestionsProfile: computeQuestionsProfile
  };
})();
