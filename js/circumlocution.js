/*
 * Expressive Word-Finding Bridges & Circumlocution Coach ("Aggirare la parola").
 * Trains compensatory semantic description when lexical retrieval stalls:
 *   - Phase 1 ("build"): select 2 valid category/function/feature clues from 4 choices
 *   - Phase 2 ("bridge"): review/speak the assembled description sentence, optionally reveal initial-sound cue,
 *     and resolve either direct word retrieval ("direct_word") or communicative success via clues ("described")
 *
 * Stored strictly locally on this device (`circumlocution_sessions`, `circ_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.CIRCUMLOCUTION;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Aggirare la parola",
      desc: "Descrivi uso e caratteristiche di un oggetto quando il nome non viene subito.",
      lvTag: "Livello {n}",
      stepOf: "Parola {i} di {n}",
      stop: "Termina",
      buildInstr: "La parola è sulla punta della lingua? Scegli 2 indizi utili per descriverla.",
      clueHint: "Tocca 2 frasi che descrivono questo oggetto ({k} su 2 scelte).",
      wrongClue: "Questo indizio non c'entra: guarda la figura e riprova.",
      bridgeInstr: "Ecco la tua descrizione pronta da dire o mostrare:",
      sayDesc: "🔊 Ascolta la descrizione",
      cueBtn: "💡 Aiuto iniziale",
      cueShow: "Suono iniziale: «{s}» ({len} lettere)",
      knowBtn: "✅ Mi è venuta la parola!",
      descBtn: "💬 Mi sono fatto capire così",
      sayWord: "🔊 Ascolta la parola",
      goodDirect: "Ottimo! Gli indizi hanno sbloccato la parola.",
      goodBridge: "Benissimo! Sei riuscito a farti capire comunque.",
      next: "Avanti",
      done: "Fatto",
      sumTitle: "Esercizio di aggiramento completato",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le parole completate.",
      colWord: "Parola",
      colRes: "Modalità",
      resDirect: "Parola detta",
      resBridge: "Con descrizione",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Word-finding bridges",
      desc: "Talk around a tricky word using use, place, and features when the name stalls.",
      lvTag: "Level {n}",
      stepOf: "Item {i} of {n}",
      stop: "Stop",
      buildInstr: "Word on the tip of your tongue? Pick 2 helpful clues to describe it.",
      clueHint: "Tap 2 clues that describe this item ({k} of 2 picked).",
      wrongClue: "That clue doesn't fit this picture — try another one.",
      bridgeInstr: "Here is your ready-to-say description:",
      sayDesc: "🔊 Hear description",
      cueBtn: "💡 Sound clue",
      cueShow: "Starts with: “{s}” ({len} letters)",
      knowBtn: "✅ I got the word!",
      descBtn: "💬 Got it across with clues",
      sayWord: "🔊 Hear the word",
      goodDirect: "Great! Your clues unlocked the word.",
      goodBridge: "Well done! Describing around it gets the message across cleanly.",
      next: "Next",
      done: "Finish",
      sumTitle: "Word-finding bridges complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All items finished cleanly.",
      colWord: "Word",
      colRes: "Outcome",
      resDirect: "Said word",
      resBridge: "Described",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("circ_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("circumlocution_sessions"); return Array.isArray(s) ? s : []; }

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
    return same.concat(near).slice(0, targetN).map(function (it) {
      return Object.assign({}, it, { shuffledClues: shuffle(it.clues || []) });
    });
  }

  function computeCircumlocutionProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, clueClean = 0, directWords = 0, describedSuccess = 0, cueAssisted = 0, scores = [];
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.clueClean) clueClean++;
        if (it.bridgeMode === "direct_word") directWords++;
        else if (it.bridgeMode === "described") describedSuccess++;
        if (it.cueUsed) cueAssisted++;
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    var acc = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
    return {
      total: total,
      clueClean: clueClean,
      directWords: directWords,
      describedSuccess: describedSuccess,
      cueAssisted: cueAssisted,
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
      phase: "build", /* build | bridge | done */
      picked: {},
      wrong: {},
      clueClean: true,
      cueUsed: false,
      bridgeMode: null,
      nudge: "",
      startedAt: Date.now()
    };
  }

  function startDrill() {
    var lv = getLevel();
    var items = buildDrill(api.lang(), lv, 3);
    G = {
      screen: "item",
      lv: lv,
      items: items,
      idx: 0,
      log: [],
      stopped: false,
      st: initState(items[0])
    };
    api.go("circumlocution");
  }

  function finishSession() {
    var all = listSessions();
    var avgScore = G.log.length
      ? Math.round((G.log.reduce(function (a, b) { return a + b.score; }, 0) / G.log.length) * 100) / 100
      : null;
    all.push({
      id: "cr" + Date.now().toString(36),
      date: new Date().toISOString(),
      lang: api.lang(),
      lv: G.lv,
      who: api.getWho ? api.getWho() : "solo",
      accuracy: avgScore,
      stopped: G.stopped,
      items: G.log.slice()
    });
    if (all.length > KEEP) all = all.slice(-KEEP);
    api.save("circumlocution_sessions", all);
    var nextLv = maybeAdaptLevel(G.lv, all);
    if (nextLv !== G.lv) api.save("circ_level", nextLv);
    G.screen = "sum";
    api.render();
  }

  function viewItem() {
    var t = T(), st = G.st, it = st.item;
    var pickedCount = Object.keys(st.picked).length;
    var headerBar = '<div class="bar"><span class="tag">' + esc(api.fill(t.stepOf, { i: G.idx + 1, n: G.items.length })) + '</span>' +
      '<button type="button" class="stop" data-act="circ-stop">' + esc(t.stop) + '</button></div>';

    var body = "";
    if (st.phase === "build") {
      var clueGrid = '<div class="cr-clues">' + it.shuffledClues.map(function (c, i) {
        var ok = !!st.picked[i], bad = !!st.wrong[i];
        return '<button type="button" class="cr-clue' + (ok ? ' ok' : bad ? ' dim' : '') + '" data-act="circ-clue" data-i="' + i + '"' + (ok || bad ? ' disabled' : '') + '>' +
          esc(c.text) + '</button>';
      }).join("") + '</div>';
      body = '<h1 class="instr">' + esc(t.buildInstr) + '</h1>' +
        '<p class="sub">' + esc(api.fill(t.clueHint, { k: pickedCount })) + '</p>' +
        clueGrid +
        (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '');
    } else if (st.phase === "bridge") {
      body = '<h1 class="instr">' + esc(t.bridgeInstr) + '</h1>' +
        '<div class="wb-cuebox"><p><strong>' + esc(it.bridgeSentence) + '</strong></p></div>' +
        '<div class="tools">' +
        '<button type="button" class="tool" data-act="circ-say-desc">' + esc(t.sayDesc) + '</button>' +
        (!st.cueUsed ? '<button type="button" class="tool" data-act="circ-cue">' + esc(t.cueBtn) + '</button>' : '') +
        '</div>' +
        (st.cueUsed ? '<p class="nudge" role="status">' + esc(api.fill(t.cueShow, { s: it.firstSound, len: it.targetWord.length })) + '</p>' : '') +
        '<div class="row-actions">' +
        '<button type="button" class="primary" data-act="circ-know">' + esc(t.knowBtn) + '</button>' +
        '<button type="button" class="secondary" data-act="circ-desc">' + esc(t.descBtn) + '</button>' +
        '</div>';
    } else {
      body = '<p class="phrase">' + esc(it.targetWord) + '</p>' +
        '<div class="var-feedback good"><p><strong>' + esc(st.nudge) + '</strong> ' + esc(it.explanation) + '</p></div>' +
        '<div class="tools"><button type="button" class="tool" data-act="circ-say-word">' + esc(t.sayWord) + '</button></div>' +
        '<button type="button" class="primary" data-act="circ-next">' + esc(G.idx + 1 < G.items.length ? t.next : t.done) + '</button>';
    }

    return api.header(false) + headerBar + '<section class="card">' +
      '<div class="pic sm" aria-hidden="true">' + esc(it.icon) + '</div>' +
      '<p class="tag">' + esc(it.category + " · " + api.fill(t.lvTag, { n: it.lv })) + '</p>' +
      body + '</section>';
  }

  function viewSummary() {
    var t = T();
    var rows = G.log.map(function (it) {
      var isDirect = it.bridgeMode === "direct_word";
      return '<tr><td>' + esc(it.label) + '</td>' +
        '<td><span class="pill ' + esc(isDirect ? 'good' : 'almost') + '">' + esc(isDirect ? t.resDirect : t.resBridge) + '</span></td></tr>';
    }).join("");
    return api.header(false) + '<section class="card sum">' +
      '<div class="sumhead"><h1>' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(G.stopped ? t.sumStopped : t.sumDone) + '</p></div>' +
      '<div class="tbl"><table><thead><tr><th>' + esc(t.colWord) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="row-actions"><button type="button" class="primary" data-act="circ-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="secondary" data-act="circ-home-exit">' + esc(t.backHome) + '</button></div></section>';
  }

  function resolveItem(mode) {
    if (!G || !G.st || G.st.phase !== "bridge") return;
    var st = G.st, it = st.item, t = T();
    st.phase = "done";
    st.bridgeMode = mode;
    var sc = mode === "direct_word"
      ? (st.clueClean ? (st.cueUsed ? 0.85 : 1) : 0.7)
      : (st.clueClean ? 0.8 : 0.65);
    st.nudge = mode === "direct_word" ? t.goodDirect : t.goodBridge;
    G.log.push({
      id: it.id,
      lv: it.lv,
      label: it.targetWord,
      clueClean: st.clueClean,
      cueUsed: st.cueUsed,
      bridgeMode: mode,
      score: sc,
      result: mode === "direct_word" ? "good" : "almost",
      ms: Date.now() - st.startedAt
    });
    api.speak(it.targetWord);
    api.render();
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.circumlocution = function () {
    if (!G) return viewSummary();
    return G.screen === "sum" ? viewSummary() : viewItem();
  };

  A["circ-home"] = function () { startDrill(); };
  A["circ-clue"] = function (b) {
    if (!G || !G.st || G.st.phase !== "build") return;
    var st = G.st, it = st.item, idx = +b.getAttribute("data-i"), cl = it.shuffledClues[idx];
    if (!cl) return;
    if (cl.ok) {
      st.picked[idx] = 1;
      st.nudge = "";
      if (Object.keys(st.picked).length >= 2) {
        st.phase = "bridge";
        api.speak(it.bridgeSentence);
      }
    } else {
      st.wrong[idx] = 1;
      st.clueClean = false;
      st.nudge = T().wrongClue;
    }
    api.render();
  };
  A["circ-say-desc"] = function () {
    if (G && G.st) api.speak(G.st.item.bridgeSentence);
  };
  A["circ-cue"] = function () {
    if (!G || !G.st || G.st.phase !== "bridge") return;
    G.st.cueUsed = true;
    api.render();
  };
  A["circ-know"] = function () { resolveItem("direct_word"); };
  A["circ-desc"] = function () { resolveItem("described"); };
  A["circ-say-word"] = function () {
    if (G && G.st) api.speak(G.st.item.targetWord);
  };
  A["circ-next"] = function () {
    if (!G) return;
    if (G.idx + 1 < G.items.length) {
      G.idx++;
      G.st = initState(G.items[G.idx]);
      api.render();
    } else {
      finishSession();
    }
  };
  A["circ-stop"] = function () {
    if (!G) return;
    G.stopped = true;
    finishSession();
  };
  A["circ-back-var"] = function () { G = null; api.go("variants"); };
  A["circ-home-exit"] = function () { G = null; api.go("home"); };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "circumlocution") startDrill();
  });
  window.addEventListener("pog:profile-change", function () { G = null; });

  window.POG.circumlocution = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeCircumlocutionProfile: computeCircumlocutionProfile
  };
})();
