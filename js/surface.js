/*
 * Surface Dyslexia & Homophone Reading Coach ("Parole irregolari e omofoni").
 * Anchors written word forms back to semantic meaning for svPPA reading preservation,
 * separating phonetic regularization errors from homophone substitutions.
 *
 * Stored strictly locally on this device (`surface_sessions`, `surface_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.SURFACE;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Parole difficili e omofoni",
      desc: "Collega il significato alla grafia esatta di parole irregolari o con lo stesso suono.",
      lvTag: "Livello {n}",
      stepOf: "Parola {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta parola",
      hint: "💡 Aiuto significato",
      wrongReg: "Sembra scritta come si pronuncia, ma la grafia corretta segue un'altra regola.",
      wrongHom: "Suona uguale, ma in questa frase ha un significato diverso.",
      good: "Esatto!",
      almost: "Trovata con aiuto.",
      next: "Avanti",
      done: "Fatto",
      kinds: { exception: "Grafia irregolare", homophone: "Omofono" },
      sumTitle: "Lettura parole difficili completata",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le parole completate.",
      colType: "Tipo / Parola",
      colRes: "Esito",
      resGood: "1° tentativo",
      resAlmost: "Con aiuto",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Surface & irregular reading",
      desc: "Match meaning to the exact spelling of irregular words and same-sound homophones.",
      lvTag: "Level {n}",
      stepOf: "Word {i} of {n}",
      stop: "Stop",
      listen: "🔊 Hear word",
      hint: "💡 Meaning clue",
      wrongReg: "That sounds the same phonetically, but the real spelling is irregular.",
      wrongHom: "That sounds alike, but has a different meaning in this sentence.",
      good: "Right!",
      almost: "Matched with a clue.",
      next: "Next",
      done: "Finish",
      kinds: { exception: "Irregular spelling", homophone: "Homophone" },
      sumTitle: "Surface & irregular reading complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All words matched cleanly.",
      colType: "Word",
      colRes: "Result",
      resGood: "First try",
      resAlmost: "Assisted",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("surface_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("surface_sessions"); return Array.isArray(s) ? s : []; }

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
          foilType: (it.foilTypes && it.foilTypes[idx]) || (idx === it.ans ? "ok" : "regularized")
        };
      });
      return Object.assign({}, it, { shuffledOpts: shuffle(tagged) });
    });
  }

  function computeSurfaceProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, firstTry = 0, regularized = 0, homophone = 0, scores = [];
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.firstTry) firstTry++;
        if (it.errType === "regularized") regularized++;
        else if (it.errType === "homophone") homophone++;
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    var acc = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
    return {
      total: total,
      firstTry: firstTry,
      errors: { regularized: regularized, homophone: homophone },
      accuracy: acc
    };
  }

  function maybeAdaptLevel(lv, sessions) {
    if (!sessions.length) return lv;
    var recent = sessions.slice(-RULE.upN).map(function (s) { return s.accuracy; }).filter(function (v) { return v != null; });
    if (recent.length >= RULE.downN && recent.slice(-RULE.downN).every(function (v) { return v < RULE.down; }) && lv < MAXLV) return lv + 1;
    if (recent.length >= RULE.upN && recent.slice(-RULE.upN).every(function (v) { return v >= RULE.up; }) && lv > 1) return lv - 1;
    return lv;
  }

  var G = null;

  function initState(item) {
    return {
      item: item,
      wrong: {},
      errType: null,
      hintUsed: false,
      solved: false,
      nudge: "",
      startedAt: Date.now()
    };
  }

  function startDrill() {
    var lv = getLevel();
    var items = buildDrill(api.lang(), lv, 4);
    G = {
      screen: "item",
      lv: lv,
      items: items,
      idx: 0,
      log: [],
      stopped: false,
      st: initState(items[0])
    };
    api.go("surface");
  }

  function finishSession() {
    var all = listSessions();
    var avgScore = G.log.length
      ? Math.round((G.log.reduce(function (a, b) { return a + b.score; }, 0) / G.log.length) * 100) / 100
      : null;
    all.push({
      id: "sr" + Date.now().toString(36),
      date: new Date().toISOString(),
      lang: api.lang(),
      lv: G.lv,
      who: api.getWho ? api.getWho() : "solo",
      accuracy: avgScore,
      stopped: G.stopped,
      items: G.log.slice()
    });
    if (all.length > KEEP) all = all.slice(-KEEP);
    api.save("surface_sessions", all);
    var nextLv = maybeAdaptLevel(G.lv, all);
    if (nextLv !== G.lv) api.save("surface_level", nextLv);
    G.screen = "sum";
    api.render();
  }

  function viewItem() {
    var t = T(), st = G.st, it = st.item;
    var kindLbl = t.kinds[it.kind] || it.kind;
    var parts = String(it.sentence || "").split("_____");
    var gapWord = st.solved ? '<span class="gr-blank ok">' + esc(it.targetWord) + '</span>' : '<span class="gr-blank">_____</span>';
    var sentHtml = parts.length >= 2
      ? '<p class="gr-sent">' + esc(parts[0]) + gapWord + esc(parts.slice(1).join("_____")) + '</p>'
      : '<p class="gr-sent">' + esc(it.sentence) + '</p>';

    var optsHtml = '<div class="var-opts">' + it.shuffledOpts.map(function (op, i) {
      var isOk = st.solved && op.ok;
      var isBad = !!st.wrong[i];
      return '<button type="button" class="var-opt' + (isOk ? ' ok' : isBad ? ' dim' : '') + '" data-act="surf-opt" data-i="' + i + '"' + (st.solved || isBad ? ' disabled' : '') + '>' + esc(op.text) + '</button>';
    }).join("") + '</div>';

    return api.header(false) +
      '<div class="bar"><span class="tag">' + esc(api.fill(t.stepOf, { i: G.idx + 1, n: G.items.length })) + '</span>' +
      '<button type="button" class="stop" data-act="surf-stop">' + esc(t.stop) + '</button></div>' +
      '<section class="card">' +
      '<div class="pic sm" aria-hidden="true">' + esc(it.icon) + '</div>' +
      '<p class="tag">' + esc(kindLbl + " · " + api.fill(t.lvTag, { n: it.lv })) + '</p>' +
      '<h1 class="instr">' + esc(it.prompt) + '</h1>' +
      sentHtml +
      '<div class="tools">' +
      '<button type="button" class="tool" data-act="surf-play">' + esc(t.listen) + '</button>' +
      (!st.solved ? '<button type="button" class="tool" data-act="surf-hint">' + esc(t.hint) + '</button>' : '') +
      '</div>' +
      (st.hintUsed && it.clue ? '<div class="wb-cuebox"><p>' + esc(it.clue) + '</p></div>' : '') +
      optsHtml +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      (st.solved ? '<button type="button" class="primary" data-act="surf-next">' + esc(G.idx + 1 < G.items.length ? t.next : t.done) + '</button>' : '') +
      '</section>';
  }

  function viewSummary() {
    var t = T();
    var rows = G.log.map(function (it) {
      return '<tr><td>' + esc(it.label) + '</td>' +
        '<td><span class="pill ' + esc(it.firstTry ? 'good' : 'almost') + '">' + esc(it.firstTry ? t.resGood : t.resAlmost) + '</span></td></tr>';
    }).join("");
    return api.header(false) + '<section class="card sum">' +
      '<div class="sumhead"><h1>' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(G.stopped ? t.sumStopped : t.sumDone) + '</p></div>' +
      '<div class="tbl"><table><thead><tr><th>' + esc(t.colType) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="row-actions"><button type="button" class="primary" data-act="surf-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="secondary" data-act="surf-home-exit">' + esc(t.backHome) + '</button></div></section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.surface = function () {
    if (!G) return viewSummary();
    return G.screen === "sum" ? viewSummary() : viewItem();
  };

  A["surf-home"] = function () { startDrill(); };
  A["surf-play"] = function () {
    if (!G || !G.st) return;
    api.speak(G.st.solved ? G.st.item.fullSentence : G.st.item.targetWord);
  };
  A["surf-hint"] = function () {
    if (!G || !G.st || G.st.solved) return;
    G.st.hintUsed = true;
    api.render();
  };
  A["surf-opt"] = function (b) {
    if (!G || !G.st || G.st.solved) return;
    var st = G.st, it = st.item, idx = +b.getAttribute("data-i"), op = it.shuffledOpts[idx];
    if (!op) return;
    if (op.ok) {
      st.solved = true;
      var firstTry = !Object.keys(st.wrong).length && !st.hintUsed;
      st.nudge = firstTry ? T().good : T().almost;
      G.log.push({
        id: it.id,
        lv: it.lv,
        kind: it.kind,
        label: it.targetWord,
        firstTry: firstTry,
        hintUsed: st.hintUsed,
        errType: st.errType,
        score: firstTry ? 1 : 0.6,
        result: firstTry ? "good" : "almost",
        ms: Date.now() - st.startedAt
      });
    } else {
      st.wrong[idx] = 1;
      if (!st.errType) st.errType = op.foilType || (it.kind === "homophone" ? "homophone" : "regularized");
      st.nudge = op.foilType === "homophone" ? T().wrongHom : T().wrongReg;
    }
    api.render();
  };
  A["surf-next"] = function () {
    if (!G) return;
    if (G.idx + 1 < G.items.length) {
      G.idx++;
      G.st = initState(G.items[G.idx]);
      api.render();
    } else {
      finishSession();
    }
  };
  A["surf-stop"] = function () {
    if (!G) return;
    G.stopped = true;
    finishSession();
  };
  A["surf-back-var"] = function () { G = null; api.go("variants"); };
  A["surf-home-exit"] = function () { G = null; api.go("home"); };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "surface") startDrill();
  });
  window.addEventListener("pog:profile-change", function () { G = null; });

  window.POG.surface = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeSurfaceProfile: computeSurfaceProfile
  };
})();
