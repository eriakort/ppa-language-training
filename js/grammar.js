/*
 * Agrammatic Morphosyntax & Closed-Class Function-Word Cloze ("Morfologia e parole ponte").
 * Complements word ordering in variants.js by drilling verb tenses, prepositions/relators,
 * and grammatical agreement for non-fluent (nfvPPA) morphosyntactic support.
 *
 * Stored strictly locally on this device (`grammar_sessions`, `grammar_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.GRAMMAR;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Morfologia e preposizioni",
      desc: "Allena tempi verbali, accordi e piccole parole ponte dentro la frase.",
      lvTag: "Livello {n}",
      stepOf: "Frase {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta frase",
      hint: "💡 Aiuto",
      wrong: "Non è questa forma: leggi il suggerimento o prova un'altra scelta.",
      good: "Esatto!",
      almost: "Completata con un piccolo aiuto.",
      next: "Avanti",
      done: "Fatto",
      kinds: { tense: "Tempo verbale", prep: "Preposizione", agreement: "Accordo" },
      sumTitle: "Esercizi di morfologia completati",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le frasi completate.",
      colSent: "Frase / Tipo",
      colRes: "Esito",
      resGood: "1° tentativo",
      resAlmost: "Con aiuto",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Grammar & word endings",
      desc: "Practise verb tenses, prepositions, and word agreement inside everyday sentences.",
      lvTag: "Level {n}",
      stepOf: "Sentence {i} of {n}",
      stop: "Stop",
      listen: "🔊 Hear sentence",
      hint: "💡 Clue",
      wrong: "Not quite that form — try another choice.",
      good: "Right!",
      almost: "Completed with a small clue.",
      next: "Next",
      done: "Finish",
      kinds: { tense: "Verb tense", prep: "Preposition", agreement: "Agreement" },
      sumTitle: "Grammar & word endings complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All sentences completed cleanly.",
      colSent: "Type",
      colRes: "Result",
      resGood: "First try",
      resAlmost: "Assisted",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("grammar_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("grammar_sessions"); return Array.isArray(s) ? s : []; }

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
      var tagged = it.opts.map(function (txt, idx) { return { text: txt, ok: idx === it.ans }; });
      return Object.assign({}, it, { shuffledOpts: shuffle(tagged) });
    });
  }

  function computeGrammarProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, firstTry = 0, scores = [];
    var byKind = {
      tense: { n: 0, ok: 0 },
      prep: { n: 0, ok: 0 },
      agreement: { n: 0, ok: 0 }
    };
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.firstTry) firstTry++;
        var k = byKind[it.kind] ? it.kind : "tense";
        byKind[k].n++;
        if (it.firstTry) byKind[k].ok++;
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    var acc = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
    return { total: total, firstTry: firstTry, byKind: byKind, accuracy: acc };
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
      hintUsed: false,
      solved: false,
      chosenText: "",
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
    api.go("grammar");
  }

  function finishSession() {
    var all = listSessions();
    var avgScore = G.log.length
      ? Math.round((G.log.reduce(function (a, b) { return a + b.score; }, 0) / G.log.length) * 100) / 100
      : null;
    all.push({
      id: "gr" + Date.now().toString(36),
      date: new Date().toISOString(),
      lang: api.lang(),
      lv: G.lv,
      who: api.getWho ? api.getWho() : "solo",
      accuracy: avgScore,
      stopped: G.stopped,
      items: G.log.slice()
    });
    if (all.length > KEEP) all = all.slice(-KEEP);
    api.save("grammar_sessions", all);
    var nextLv = maybeAdaptLevel(G.lv, all);
    if (nextLv !== G.lv) api.save("grammar_level", nextLv);
    G.screen = "sum";
    api.render();
  }

  function viewItem() {
    var t = T(), st = G.st, it = st.item;
    var kindLbl = t.kinds[it.kind] || it.kind;
    var gapText = st.solved ? st.chosenText : "_____";
    var sentenceHtml = '<p class="gr-sent">' + esc(it.before) + ' <span class="gr-blank' + (st.solved ? ' ok' : '') + '">' + esc(gapText) + '</span> ' + esc(it.after) + '</p>';

    var optsHtml = '<div class="var-opts">' + it.shuffledOpts.map(function (op, i) {
      var isOk = st.solved && op.ok;
      var isBad = !!st.wrong[i];
      return '<button type="button" class="var-opt' + (isOk ? ' ok' : isBad ? ' dim' : '') + '" data-act="gram-opt" data-i="' + i + '"' + (st.solved || isBad ? ' disabled' : '') + '>' + esc(op.text) + '</button>';
    }).join("") + '</div>';

    return api.header(false) +
      '<div class="bar"><span class="tag">' + esc(api.fill(t.stepOf, { i: G.idx + 1, n: G.items.length })) + '</span>' +
      '<button type="button" class="stop" data-act="gram-stop">' + esc(t.stop) + '</button></div>' +
      '<section class="card">' +
      '<div class="pic sm" aria-hidden="true">' + esc(it.icon) + '</div>' +
      '<p class="tag">' + esc(kindLbl + " · " + api.fill(t.lvTag, { n: it.lv })) + '</p>' +
      '<h1 class="instr">' + esc(it.prompt) + '</h1>' +
      sentenceHtml +
      '<div class="tools">' +
      '<button type="button" class="tool" data-act="gram-play">' + esc(t.listen) + '</button>' +
      (!st.solved ? '<button type="button" class="tool" data-act="gram-hint">' + esc(t.hint) + '</button>' : '') +
      '</div>' +
      (st.hintUsed && it.clue ? '<div class="wb-cuebox"><p>' + esc(it.clue) + '</p></div>' : '') +
      optsHtml +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      (st.solved ? '<button type="button" class="primary" data-act="gram-next">' + esc(G.idx + 1 < G.items.length ? t.next : t.done) + '</button>' : '') +
      '</section>';
  }

  function viewSummary() {
    var t = T();
    var rows = G.log.map(function (it) {
      return '<tr><td>' + esc(t.kinds[it.kind] || it.kind) + '</td>' +
        '<td><span class="pill ' + esc(it.firstTry ? 'good' : 'almost') + '">' + esc(it.firstTry ? t.resGood : t.resAlmost) + '</span></td></tr>';
    }).join("");
    return api.header(false) + '<section class="card sum">' +
      '<div class="sumhead"><h1>' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(G.stopped ? t.sumStopped : t.sumDone) + '</p></div>' +
      '<div class="tbl"><table><thead><tr><th>' + esc(t.colSent) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="row-actions"><button type="button" class="primary" data-act="gram-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="secondary" data-act="gram-home-exit">' + esc(t.backHome) + '</button></div></section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.grammar = function () {
    if (!G) return viewSummary();
    return G.screen === "sum" ? viewSummary() : viewItem();
  };

  A["gram-home"] = function () { startDrill(); };
  A["gram-play"] = function () {
    if (!G || !G.st) return;
    var it = G.st.item;
    api.speak(G.st.solved ? it.fullSentence : it.before + " ... " + it.after);
  };
  A["gram-hint"] = function () {
    if (!G || !G.st || G.st.solved) return;
    G.st.hintUsed = true;
    api.render();
  };
  A["gram-opt"] = function (b) {
    if (!G || !G.st || G.st.solved) return;
    var st = G.st, it = st.item, idx = +b.getAttribute("data-i"), op = it.shuffledOpts[idx];
    if (!op) return;
    if (op.ok) {
      st.solved = true;
      st.chosenText = op.text;
      var firstTry = !Object.keys(st.wrong).length && !st.hintUsed;
      st.nudge = firstTry ? T().good : T().almost;
      G.log.push({
        id: it.id,
        lv: it.lv,
        kind: it.kind,
        firstTry: firstTry,
        hintUsed: st.hintUsed,
        score: firstTry ? 1 : 0.6,
        result: firstTry ? "good" : "almost",
        ms: Date.now() - st.startedAt
      });
    } else {
      st.wrong[idx] = 1;
      st.nudge = T().wrong;
    }
    api.render();
  };
  A["gram-next"] = function () {
    if (!G) return;
    if (G.idx + 1 < G.items.length) {
      G.idx++;
      G.st = initState(G.items[G.idx]);
      api.render();
    } else {
      finishSession();
    }
  };
  A["gram-stop"] = function () {
    if (!G) return;
    G.stopped = true;
    finishSession();
  };
  A["gram-back-var"] = function () { G = null; api.go("variants"); };
  A["gram-home-exit"] = function () { G = null; api.go("home"); };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "grammar") startDrill();
  });
  window.addEventListener("pog:profile-change", function () { G = null; });

  window.POG.grammar = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeGrammarProfile: computeGrammarProfile
  };
})();
