/*
 * Everyday Narrative Sequencing & Main-Concept Retell Studio ("Storie in sequenza / Narrative retell").
 * Supports connected-speech coherence across PPA profiles:
 *   - Stage 1: Listen / read calm everyday story
 *   - Stage 2: Order 3 chronological story beats (lvPPA sequencing + nfvPPA temporal coherence)
 *   - Stage 3: Retell key concepts aloud / in writing or verify gist with optional keyword anchors (svPPA/lvPPA)
 *
 * Stored strictly locally on this device (`narrative_sessions`, `narrative_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.NARRATIVE;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Racconto e sequenze",
      desc: "Ascolta brevi storie di vita reale, metti in ordine i momenti e racconta l'essenziale.",
      lvTag: "Livello {n}",
      stepOf: "Storia {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta storia",
      slow: "🐢 Ascolta piano",
      showTxt: "Mostra testo",
      hideTxt: "Nascondi testo",
      startSeq: "Pronto · Metti in ordine",
      seqAsk: "Metti i tre momenti nell'ordine giusto",
      hint: "💡 Aiuto",
      clear: "Svuota",
      checkSeq: "Controlla ordine",
      seqWrong: "Quasi: controlla quale fatto succede prima o dopo.",
      seqOk: "Sequenza giusta! Ora prova a raccontarla in breve.",
      retellAsk: "Racconta con parole tue (o scegli l'idea principale)",
      anchorsBtn: "🏷️ Parole chiave",
      micBtn: "🎤 Racconta a voce",
      micStop: "⏹️ Ferma microfono",
      retellLabel: "Cosa è successo nella storia?",
      retellPh: "Scrivi o pronuncia qualche parola chiave della storia…",
      gistLabel: "Oppure conferma l'idea giusta:",
      finishItem: "Conferma racconto",
      next: "Storia successiva",
      done: "Fatto",
      conceptsFound: "Concetti chiave coperti: {c} su {n}",
      needRetell: "Scrivi alcune parole, usa il microfono o scegli un riassunto.",
      sumTitle: "Storie completate",
      sumStopped: "Storie completate salvate fin qui.",
      sumDone: "Tutte le storie completate con successo.",
      colStory: "Storia",
      colSeq: "Ordine",
      colConc: "Concetti",
      seqFirst: "1° tentativo",
      seqGuide: "Con aiuto",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Story & sequence retell",
      desc: "Listen to everyday events, put three steps in order, and retell key concepts.",
      lvTag: "Level {n}",
      stepOf: "Story {i} of {n}",
      stop: "Stop",
      listen: "🔊 Hear story",
      slow: "🐢 Hear slowly",
      showTxt: "Show story text",
      hideTxt: "Hide text",
      startSeq: "Ready · Put events in order",
      seqAsk: "Put the three moments in order from first to last",
      hint: "💡 Hint",
      clear: "Clear",
      checkSeq: "Check order",
      seqWrong: "Nearly! Check which event happened earlier or later.",
      seqOk: "Great sequence! Now summarize the key points.",
      retellAsk: "Tell what happened in your own words (or confirm summary)",
      anchorsBtn: "🏷️ Key concepts",
      micBtn: "🎤 Speak retell",
      micStop: "⏹️ Stop mic",
      retellLabel: "What happened in the story?",
      retellPh: "Type or speak the main events…",
      gistLabel: "Or pick the accurate summary:",
      finishItem: "Save retell",
      next: "Next story",
      done: "Finish",
      conceptsFound: "Main concepts covered: {c} of {n}",
      needRetell: "Write a few words, speak into the mic, or pick a summary.",
      sumTitle: "Story retell practice complete",
      sumStopped: "Completed stories saved up to here.",
      sumDone: "All stories completed. Well done.",
      colStory: "Story",
      colSeq: "Sequence",
      colConc: "Concepts",
      seqFirst: "First pass",
      seqGuide: "Guided",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("narrative_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("narrative_sessions"); return Array.isArray(s) ? s : []; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function norm(s) {
    return String(s || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9'\s]/g, " ")
      .replace(/\s+/g, " ").trim();
  }

  function scoreConcepts(text, concepts) {
    var list = Array.isArray(concepts) ? concepts : [];
    if (!list.length) return { matched: 0, total: 0, ratio: 1 };
    var words = norm(text).split(" ").filter(Boolean);
    var matched = 0;
    list.forEach(function (c) {
      var root = norm(c);
      if (!root) return;
      var stem = root.length >= 5 ? root.slice(0, root.length - 1) : root;
      var hit = words.some(function (w) { return w === root || w.indexOf(stem) === 0 || (w.length >= 4 && root.indexOf(w) === 0); });
      if (hit) matched++;
    });
    return { matched: matched, total: list.length, ratio: matched / list.length };
  }

  function buildDrill(lang, level, count) {
    var bank = CONTENT[lang] || CONTENT.it;
    var lv = level >= 1 && level <= MAXLV ? level : 2;
    var targetN = count || 3;
    var same = shuffle(bank.filter(function (x) { return x.lv === lv; }));
    var near = shuffle(bank.filter(function (x) { return x.lv !== lv; })).sort(function (a, b) {
      return Math.abs(a.lv - lv) - Math.abs(b.lv - lv);
    });
    return same.concat(near).slice(0, targetN).map(function (st) {
      var pool = shuffle(st.beats.slice());
      // avoid already completely ordered if possible
      if (pool.every(function (b, i) { return b.step === i + 1; }) && pool.length >= 2) {
        var tmp = pool[0]; pool[0] = pool[1]; pool[1] = tmp;
      }
      return Object.assign({}, st, {
        shuffledBeats: pool,
        summaryChoices: shuffle(st.summaryChoices)
      });
    });
  }

  function computeNarrativeProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, seqClean = 0, anchorsUsed = 0, coverages = [], scores = [];
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.seqFirstTry) seqClean++;
        if (it.anchorsUsed) anchorsUsed++;
        if (it.conceptCoverage != null && isFinite(+it.conceptCoverage)) coverages.push(+it.conceptCoverage);
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    var meanCov = coverages.length ? coverages.reduce(function (a, b) { return a + b; }, 0) / coverages.length : null;
    var acc = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
    return { total: total, seqClean: seqClean, anchorsUsed: anchorsUsed, meanConcepts: meanCov, accuracy: acc };
  }

  function maybeAdaptLevel(lv, sessions) {
    if (!sessions.length) return lv;
    var recent = sessions.slice(-RULE.upN).map(function (s) { return s.accuracy; }).filter(function (v) { return v != null; });
    if (recent.length >= RULE.downN && recent.slice(-RULE.downN).every(function (v) { return v < RULE.down; }) && lv < MAXLV) return lv + 1;
    if (recent.length >= RULE.upN && recent.slice(-RULE.upN).every(function (v) { return v >= RULE.up; }) && lv > 1) return lv - 1;
    return lv;
  }

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

  var speechMod = window.POG.createSpeech ? window.POG.createSpeech({
    onText: function (finalTxt) {
      if (V && V.st && finalTxt) {
        V.st.retellDraft = [V.st.retellBase || "", finalTxt].filter(Boolean).join(" ");
        if (api.screen() === "narrative") api.render();
      }
    },
    onState: function () { if (V && api.screen() === "narrative") api.render(); },
    onReady: function () { if (V && api.screen() === "narrative") api.render(); }
  }) : null;

  var V = null;

  function initState(item) {
    return {
      item: item,
      stage: "listen", // "listen" | "seq" | "retell" | "done"
      showText: true,
      picked: [], // indices into item.shuffledBeats
      seqTries: 0,
      hintUsed: false,
      anchorsUsed: false,
      retellDraft: "",
      gistPicked: null,
      gistOk: false,
      wrongGists: {},
      nudge: "",
      coverageInfo: null,
      startedAt: Date.now()
    };
  }

  function startDrill() {
    var lv = getLevel();
    var items = buildDrill(api.lang(), lv, 3);
    V = {
      screen: "item",
      lv: lv,
      items: items,
      idx: 0,
      log: [],
      stopped: false,
      st: initState(items[0])
    };
    api.go("narrative");
  }

  function recordCurrent() {
    var st = V.st, it = st.item;
    var seqFirstTry = st.seqTries === 1 && !st.hintUsed;
    var cov = st.coverageInfo ? st.coverageInfo.ratio : (st.gistOk ? 0.8 : 0.4);
    var sc = Math.round(((seqFirstTry ? 0.5 : 0.3) + (0.5 * Math.min(1, cov))) * 100) / 100;
    V.log.push({
      id: it.id,
      lv: it.lv,
      title: it.title,
      seqFirstTry: seqFirstTry,
      anchorsUsed: st.anchorsUsed,
      conceptCoverage: Math.round(cov * 100) / 100,
      score: sc,
      result: seqFirstTry && cov >= 0.6 ? "good" : "almost",
      ms: Date.now() - st.startedAt
    });
  }

  function finishSession() {
    if (speechMod && speechMod.stop) speechMod.stop();
    var all = listSessions();
    var avgScore = V.log.length
      ? Math.round((V.log.reduce(function (a, b) { return a + b.score; }, 0) / V.log.length) * 100) / 100
      : null;
    all.push({
      id: "nr" + Date.now().toString(36),
      date: new Date().toISOString(),
      lang: api.lang(),
      lv: V.lv,
      who: api.getWho ? api.getWho() : "solo",
      accuracy: avgScore,
      stopped: V.stopped,
      items: V.log.slice()
    });
    if (all.length > KEEP) all = all.slice(-KEEP);
    api.save("narrative_sessions", all);
    var nextLv = maybeAdaptLevel(V.lv, all);
    if (nextLv !== V.lv) api.save("narrative_level", nextLv);
    V.screen = "sum";
    api.render();
  }

  function viewItem() {
    var t = T(), st = V.st, it = st.item;
    var hasMic = !!(speechMod && speechMod.provider && speechMod.provider !== "none");
    var listening = speechMod && speechMod.active && speechMod.active();

    var body = "";
    if (st.stage === "listen") {
      body = '<div class="dc-panel">' +
        '<div class="tools">' +
        '<button type="button" class="tool" data-act="narr-play">' + esc(t.listen) + '</button>' +
        '<button type="button" class="tool" data-act="narr-slow">' + esc(t.slow) + '</button>' +
        '<button type="button" class="tool" data-act="narr-toggle-txt">' + esc(st.showText ? t.hideTxt : t.showTxt) + '</button>' +
        '</div>' +
        (st.showText ? '<p class="dc-transcript">' + esc(it.story) + '</p>' : '') +
        '</div>' +
        '<button type="button" class="primary" data-act="narr-start-seq">' + esc(t.startSeq) + '</button>';
    } else if (st.stage === "seq") {
      var slots = [0, 1, 2].map(function (slotIdx) {
        var bIdx = st.picked[slotIdx];
        var beat = bIdx != null ? it.shuffledBeats[bIdx] : null;
        return '<button type="button" class="nr-slot' + (beat ? ' has' : '') + '" data-act="narr-slot" data-i="' + slotIdx + '">' +
          '<span class="nr-num">' + (slotIdx + 1) + '</span>' +
          '<span>' + esc(beat ? beat.text : "…") + '</span></button>';
      }).join("");
      var pool = it.shuffledBeats.map(function (b, idx) {
        var used = st.picked.indexOf(idx) >= 0;
        return '<button type="button" class="nr-card" data-act="narr-pick" data-i="' + idx + '"' + (used ? ' disabled' : '') + '>' + esc(b.text) + '</button>';
      }).join("");
      body = '<p class="vb-sub">' + esc(t.seqAsk) + '</p>' +
        '<div class="nr-slots">' + slots + '</div>' +
        '<div class="nr-pool">' + pool + '</div>' +
        '<div class="tools">' +
        '<button type="button" class="tool" data-act="narr-hint">' + esc(t.hint) + '</button>' +
        '<button type="button" class="tool" data-act="narr-clear">' + esc(t.clear) + '</button>' +
        '</div>' +
        '<button type="button" class="primary" data-act="narr-check-seq"' + (st.picked.length < 3 ? ' disabled' : '') + '>' + esc(t.checkSeq) + '</button>';
    } else {
      var done = st.stage === "done";
      var anchorHtml = st.anchorsUsed
        ? '<div class="kw dc-kw">' + it.concepts.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join("") + '</div>'
        : '';
      var gistsHtml = '<div class="nr-gists"><p class="note">' + esc(t.gistLabel) + '</p>' +
        it.summaryChoices.map(function (g, idx) {
          var picked = st.gistPicked === idx;
          var bad = !!st.wrongGists[idx];
          return '<button type="button" class="var-opt' + (picked && g.ok ? ' ok' : bad ? ' dim' : '') + '" data-act="narr-gist" data-i="' + idx + '"' + (done || bad ? ' disabled' : '') + '>' + esc(g.text) + '</button>';
        }).join("") + '</div>';
      body = '<p class="vb-sub">' + esc(t.retellAsk) + '</p>' +
        '<div class="tools">' +
        '<button type="button" class="tool" data-act="narr-anchors">' + esc(t.anchorsBtn) + '</button>' +
        (hasMic ? '<button type="button" class="tool" data-act="narr-mic">' + esc(listening ? t.micStop : t.micBtn) + '</button>' : '') +
        '</div>' +
        anchorHtml +
        '<div class="wr-field"><label class="field"><span>' + esc(t.retellLabel) + '</span>' +
        '<textarea id="narr-retell" rows="3" placeholder="' + esc(t.retellPh) + '"' + (done ? ' readonly' : '') + '>' + esc(st.retellDraft) + '</textarea></label></div>' +
        gistsHtml +
        (st.coverageInfo ? '<div class="var-feedback good"><p>' + esc(api.fill(t.conceptsFound, { c: st.coverageInfo.matched, n: st.coverageInfo.total })) + '</p></div>' : '') +
        (!done ? '<button type="button" class="primary" data-act="narr-finish-item">' + esc(t.finishItem) + '</button>'
          : '<button type="button" class="primary" data-act="narr-next">' + esc(V.idx + 1 < V.items.length ? t.next : t.done) + '</button>');
    }

    return api.header(false) +
      '<div class="bar"><span class="tag">' + esc(api.fill(t.stepOf, { i: V.idx + 1, n: V.items.length })) + '</span>' +
      '<button type="button" class="stop" data-act="narr-stop">' + esc(t.stop) + '</button></div>' +
      '<section class="card">' +
      '<div class="pic sm" aria-hidden="true">' + esc(it.icon) + '</div>' +
      '<p class="tag">' + esc(t.btn + " · " + api.fill(t.lvTag, { n: it.lv })) + '</p>' +
      '<h1 class="instr">' + esc(it.title) + '</h1>' +
      body +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      '</section>';
  }

  function viewSummary() {
    var t = T();
    var rows = V.log.map(function (it) {
      return '<tr><td>' + esc(it.title) + '</td>' +
        '<td><span class="pill ' + esc(it.seqFirstTry ? 'good' : 'almost') + '">' + esc(it.seqFirstTry ? t.seqFirst : t.seqGuide) + '</span></td>' +
        '<td class="n">' + Math.round((it.conceptCoverage || 0) * 100) + '%</td></tr>';
    }).join("");
    return api.header(false) + '<section class="card sum">' +
      '<div class="sumhead"><h1>' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p></div>' +
      '<div class="tbl"><table><thead><tr><th>' + esc(t.colStory) + '</th><th>' + esc(t.colSeq) + '</th><th>' + esc(t.colConc) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="row-actions"><button type="button" class="primary" data-act="narr-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="secondary" data-act="narr-home-exit">' + esc(t.backHome) + '</button></div></section>';
  }

  function syncDraft() {
    if (!V || !V.st) return;
    var el = document.getElementById("narr-retell");
    if (el) V.st.retellDraft = el.value;
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.narrative = function () {
    if (!V) return viewSummary();
    return V.screen === "sum" ? viewSummary() : viewItem();
  };

  A["narr-home"] = function () { startDrill(); };
  A["narr-play"] = function () { if (V && V.st) api.speak(V.st.item.story); };
  A["narr-slow"] = function () { if (V && V.st) speakSlow(V.st.item.story); };
  A["narr-toggle-txt"] = function () { if (V && V.st) { V.st.showText = !V.st.showText; api.render(); } };
  A["narr-start-seq"] = function () { if (V && V.st) { V.st.stage = "seq"; V.st.nudge = ""; api.render(); } };
  A["narr-pick"] = function (b) {
    if (!V || !V.st || V.st.stage !== "seq") return;
    var idx = +b.getAttribute("data-i");
    if (V.st.picked.length < 3 && V.st.picked.indexOf(idx) < 0) V.st.picked.push(idx);
    V.st.nudge = "";
    api.render();
  };
  A["narr-slot"] = function (b) {
    if (!V || !V.st || V.st.stage !== "seq") return;
    var slot = +b.getAttribute("data-i");
    if (V.st.picked[slot] != null) V.st.picked.splice(slot, 1);
    api.render();
  };
  A["narr-clear"] = function () {
    if (!V || !V.st || V.st.stage !== "seq") return;
    V.st.picked = [];
    V.st.nudge = "";
    api.render();
  };
  A["narr-hint"] = function () {
    if (!V || !V.st || V.st.stage !== "seq") return;
    var st = V.st, it = st.item;
    st.hintUsed = true;
    var targetStep = st.picked.length + 1;
    if (targetStep <= 3) {
      var rightIdx = -1;
      for (var i = 0; i < it.shuffledBeats.length; i++) if (it.shuffledBeats[i].step === targetStep) { rightIdx = i; break; }
      if (rightIdx >= 0 && st.picked.indexOf(rightIdx) < 0) st.picked.push(rightIdx);
    }
    api.render();
  };
  A["narr-check-seq"] = function () {
    if (!V || !V.st || V.st.stage !== "seq" || V.st.picked.length < 3) return;
    var st = V.st, it = st.item;
    st.seqTries++;
    var ok = st.picked.every(function (idx, pos) { return it.shuffledBeats[idx].step === pos + 1; });
    if (ok) {
      st.stage = "retell";
      st.nudge = T().seqOk;
    } else {
      st.nudge = T().seqWrong;
    }
    api.render();
  };
  A["narr-anchors"] = function () {
    if (!V || !V.st) return;
    syncDraft();
    V.st.anchorsUsed = true;
    api.render();
  };
  A["narr-mic"] = function () {
    if (!V || !V.st || !speechMod) return;
    syncDraft();
    if (speechMod.active()) {
      speechMod.stop();
    } else {
      V.st.retellBase = V.st.retellDraft || "";
      speechMod.start(api.lang());
    }
    api.render();
  };
  A["narr-gist"] = function (b) {
    if (!V || !V.st || V.st.stage !== "retell") return;
    syncDraft();
    var st = V.st, idx = +b.getAttribute("data-i"), ch = st.item.summaryChoices[idx];
    if (!ch) return;
    if (ch.ok) {
      st.gistPicked = idx;
      st.gistOk = true;
      st.nudge = "";
    } else {
      st.wrongGists[idx] = 1;
      st.nudge = T().seqWrong;
    }
    api.render();
  };
  A["narr-finish-item"] = function () {
    if (!V || !V.st || V.st.stage !== "retell") return;
    syncDraft();
    var st = V.st, it = st.item;
    var textPool = [st.retellDraft, st.gistOk && st.gistPicked != null ? it.summaryChoices[st.gistPicked].text : ""].filter(Boolean).join(" ");
    if (!textPool.trim()) {
      st.nudge = T().needRetell;
      api.render();
      return;
    }
    st.coverageInfo = scoreConcepts(textPool, it.concepts);
    st.stage = "done";
    st.nudge = "";
    recordCurrent();
    api.render();
  };
  A["narr-next"] = function () {
    if (!V) return;
    if (V.idx + 1 < V.items.length) {
      V.idx++;
      V.st = initState(V.items[V.idx]);
      api.render();
    } else {
      finishSession();
    }
  };
  A["narr-stop"] = function () {
    if (!V) return;
    V.stopped = true;
    finishSession();
  };
  A["narr-back-var"] = function () { V = null; api.go("variants"); };
  A["narr-home-exit"] = function () { V = null; api.go("home"); };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "narrative") startDrill();
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.narrative = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    scoreConcepts: scoreConcepts,
    computeNarrativeProfile: computeNarrativeProfile
  };
})();
