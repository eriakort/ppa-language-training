/*
 * Functional Numbers, Times, Prices & Dosage Drill ("Numeri, orari e prezzi").
 * Supports everyday numerical transcoding (appointment times, shop totals, medication schedules)
 * with audio replay, written cue support, and transposition vs magnitude foil tracking.
 *
 * Stored strictly locally on this device (`numbers_sessions`, `numbers_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.NUMBERS;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Numeri, orari e prezzi",
      desc: "Allena orari di visita, prezzi al negozio e dosi delle medicine.",
      lvTag: "Livello {n}",
      stepOf: "Prova {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta",
      hint: "💡 Indizio",
      wrong: "Attenzione alle cifre o all'ordine: guarda bene il suggerimento e riprova.",
      good: "Esatto!",
      almost: "Completata con un piccolo indizio.",
      next: "Avanti",
      done: "Fatto",
      kinds: { time: "Orario", price: "Prezzo", dosage: "Dose / Numero" },
      sumTitle: "Numeri e orari completati",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le prove completate.",
      colSent: "Tipo / Voce",
      colRes: "Esito",
      resGood: "1° tentativo",
      resAlmost: "Con indizio",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Numbers, times & prices",
      desc: "Practise clinic times, shop totals, and medicine schedules.",
      lvTag: "Level {n}",
      stepOf: "Item {i} of {n}",
      stop: "Stop",
      listen: "🔊 Hear",
      hint: "💡 Clue",
      wrong: "Check the digits and place value carefully — try another match.",
      good: "Spot on!",
      almost: "Completed with a small clue.",
      next: "Next",
      done: "Finish",
      kinds: { time: "Clock time", price: "Price", dosage: "Dose / Number" },
      sumTitle: "Numbers & times complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All numerical items completed cleanly.",
      colSent: "Type",
      colRes: "Result",
      resGood: "First try",
      resAlmost: "Assisted",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("numbers_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("numbers_sessions"); return Array.isArray(s) ? s : []; }

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
    var targetN = count || 4;
    var same = shuffle(bank.filter(function (x) { return x.lv === lv; }));
    var near = shuffle(bank.filter(function (x) { return x.lv !== lv; })).sort(function (a, b) {
      return Math.abs(a.lv - lv) - Math.abs(b.lv - lv);
    });
    return same.concat(near).slice(0, targetN).map(function (it) {
      var tagged = it.opts.map(function (txt, idx) {
        return {
          text: txt,
          ok: idx === it.ans,
          foilType: (it.foilTypes && it.foilTypes[idx]) || (idx === it.ans ? "target" : "transposition")
        };
      });
      return Object.assign({}, it, { shuffledOpts: shuffle(tagged) });
    });
  }

  function computeNumbersProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, firstTry = 0, scores = [];
    var errors = { transposition: 0, magnitude: 0 };
    var byKind = { time: { n: 0, ok: 0 }, price: { n: 0, ok: 0 }, dosage: { n: 0, ok: 0 } };
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.firstTry) firstTry++;
        var k = byKind[it.kind] ? it.kind : "time";
        byKind[k].n++;
        if (it.firstTry) byKind[k].ok++;
        if (it.errType === "transposition") errors.transposition++;
        else if (it.errType === "magnitude") errors.magnitude++;
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

  function stopVoice() {
    if (api.stopVoice) api.stopVoice();
  }

  function initStep(item) {
    return {
      item: item,
      startedAt: Date.now(),
      elim: {},
      attempts: 0,
      firstErrType: null,
      hintShown: false,
      done: false,
      firstTry: false,
      nudge: ""
    };
  }

  function startDrill() {
    stopVoice();
    var lv = getLevel();
    var queue = buildDrill(api.lang(), lv, 4);
    if (!queue.length) return;
    V = {
      id: "nm" + Date.now().toString(36),
      lv: lv,
      steps: queue,
      i: 0,
      st: initStep(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("numbers");
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
      api.save("numbers_sessions", all);
      var nextLv = maybeAdaptLevel(V.lv, all);
      if (nextLv !== V.lv) api.save("numbers_level", nextLv);
    }
    api.render();
  }

  function viewScreen() {
    if (!V) { startDrill(); if (!V) return api.header(false); }
    var t = T();
    if (V.done) {
      var rows = V.log.map(function (r) {
        return '<tr><td>' + esc((t.kinds[r.kind] || r.kind) + ": " + r.label) + '</td>' +
          '<td><span class="pill ' + esc(r.result) + '">' + esc(r.firstTry ? t.resGood : t.resAlmost) + '</span></td></tr>';
      }).join("");
      return api.header(false) + '<section class="card">' +
        '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
        '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p>' +
        (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colSent) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '') +
        '<button type="button" class="primary" data-act="num-var-hub">' + esc(t.backVar) + '</button>' +
        '<button type="button" class="link" data-act="num-back">' + esc(t.backHome) + '</button></section>';
    }

    var st = V.st, item = st.item;
    var bar = '<div class="bar"><span class="brand">' + esc(t.btn) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="num-stop">' + esc(t.stop) + '</button></div>';

    var optsHtml = '<div class="var-opts nm-opts">' + item.shuffledOpts.map(function (opt, idx) {
      var cls = "var-opt nm-opt";
      if (st.done && opt.ok) cls += " ok";
      else if (st.elim[idx]) cls += " dim";
      return '<button type="button" class="' + cls + '" data-act="num-pick" data-i="' + idx + '"' +
        (st.done || st.elim[idx] ? ' disabled' : '') + '>' + esc(opt.text) + '</button>';
    }).join("") + '</div>';

    var cueHtml = st.hintShown ? '<div class="hint"><b>1</b><span>' + esc(item.cue) + '</span></div>' : '';

    var footer = st.done
      ? '<div class="var-feedback good"><p><strong>' + esc(st.firstTry ? t.good : t.almost) + '</strong> ' +
          esc(item.explanation) + '</p></div>' +
        '<p class="phrase">' + esc(item.fullSentence) + '</p>' +
        '<div class="tools"><button type="button" class="tool" data-act="num-say-full">' + esc(t.listen) + '</button></div>' +
        '<button type="button" class="primary" data-act="num-next">' + esc(V.i + 1 < V.steps.length ? t.next : t.done) + '</button>'
      : '<div class="tools">' +
        '<button type="button" class="tool" data-act="num-say">' + esc(t.listen) + '</button>' +
        '<button type="button" class="tool" data-act="num-hint"' + (st.hintShown ? ' disabled' : '') + '>' + esc(t.hint) + '</button>' +
        '</div>';

    return bar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: V.lv })) + ' · ' + esc(t.kinds[item.kind] || item.kind) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + item.pic + '</div>' +
      '<p class="instr">' + esc(item.prompt) + '</p>' +
      cueHtml +
      optsHtml +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      footer +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.numbers = viewScreen;

  A["num-home"] = function () { startDrill(); };
  A["num-stop"] = function () { finishSession(true); };
  A["num-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["num-var-hub"] = function () { stopVoice(); V = null; api.go("variants"); };
  A["num-say"] = function () {
    if (V && V.st && V.st.item) api.speak(V.st.item.spoken);
  };
  A["num-say-full"] = function () {
    if (V && V.st && V.st.item) api.speak(V.st.item.fullSentence);
  };
  A["num-hint"] = function () {
    if (!V || !V.st || V.st.done) return;
    V.st.hintShown = true;
    api.render();
  };
  A["num-pick"] = function (b) {
    if (!V || !V.st || V.st.done) return;
    var st = V.st, item = st.item, idx = +b.getAttribute("data-i");
    var opt = item.shuffledOpts[idx];
    if (!opt || st.elim[idx]) return;
    if (opt.ok) {
      st.done = true;
      st.firstTry = st.attempts === 0 && !st.hintShown;
      st.nudge = "";
      var score = st.firstTry ? 1 : (st.attempts === 0 && st.hintShown ? 0.8 : 0.6);
      var result = st.firstTry ? "good" : "almost";
      V.log.push({
        game: "numbers",
        id: item.id,
        kind: item.kind,
        lv: V.lv,
        label: opt.text,
        firstTry: st.firstTry,
        hintUsed: st.hintShown,
        errType: st.firstErrType,
        result: result,
        score: score,
        ms: Date.now() - st.startedAt
      });
      api.speak(item.fullSentence);
    } else {
      st.attempts++;
      if (!st.firstErrType) st.firstErrType = opt.foilType || "transposition";
      st.elim[idx] = true;
      st.nudge = T().wrong;
    }
    api.render();
  };
  A["num-next"] = function () {
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
    if (api.screen() === "numbers" && V && !V.done) startDrill();
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.numbers = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    level: getLevel,
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeNumbersProfile: computeNumbersProfile
  };
})();
