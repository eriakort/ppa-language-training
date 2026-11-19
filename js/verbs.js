/*
 * VNeST Action-Verb & Thematic Role Studio ("Azioni e frasi / Action & sentence network").
 * Targets verb-retrieval and predicate-argument deficits (nfvPPA & svPPA):
 *   1. Match Agent (Who) + Action Verb + Patient (What) + Context
 *   2. Quick thematic plausibility check (Yes / No everyday sense check)
 *   3. Full functional sentence readout & spoken rehearsal
 *
 * Stored strictly locally on this device (`verbs_sessions`, `verbs_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.VERBS;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Azioni e verbi (VNeST)",
      desc: "Abbina chi compie l'azione, oggetto e contesto attorno al verbo.",
      lvTag: "Livello {n}",
      title: "Rete del verbo",
      stepOf: "Verbo {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta",
      hint: "💡 Aiuto",
      whoAsk: "1 · Chi compie questa azione?",
      whatAsk: "2 · Su che cosa o verso chi?",
      whereLbl: "Dove / come:",
      triadWrong: "Quasi: prova un abbinamento diverso con questo verbo.",
      triadOk: "Ottimo abbinamento! Ora verifica se la frase ha senso.",
      plausTitle: "Ha senso questa situazione?",
      yes: "Sì, ha senso",
      no: "No, non ha senso",
      plausWrong: "Ripensa all'azione di questo verbo.",
      sentTitle: "Frase completa da dire ad alta voce",
      listenSent: "🔊 Ascolta frase",
      speakPrompt: "Prova a leggerla o ripeterla con calma.",
      next: "Avanti",
      done: "Fatto",
      sumTitle: "Rete dei verbi completata",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le reti verbali completate. Ottimo lavoro.",
      colVerb: "Verbo",
      colRes: "Esito",
      colPlaus: "Controllo senso",
      resGood: "Autonomo",
      resAlmost: "Con aiuto",
      resOk: "Chiaro",
      resHelp: "Rivisto",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Actions & verbs (VNeST)",
      desc: "Link who acts, what receives the action, and everyday setting around key verbs.",
      lvTag: "Level {n}",
      title: "Verb network studio",
      stepOf: "Verb {i} of {n}",
      stop: "Stop",
      listen: "🔊 Listen",
      hint: "💡 Hint",
      whoAsk: "1 · Who performs this action?",
      whatAsk: "2 · On what or for whom?",
      whereLbl: "Where / how:",
      triadWrong: "Close — try another match that fits this everyday action.",
      triadOk: "Great match! Quick everyday sense check next.",
      plausTitle: "Does this everyday scenario make sense?",
      yes: "Yes, makes sense",
      no: "No, makes no sense",
      plausWrong: "Think about what this verb normally goes with.",
      sentTitle: "Complete sentence to say aloud",
      listenSent: "🔊 Hear sentence",
      speakPrompt: "Read or say the full sentence calmly aloud.",
      next: "Next",
      done: "Finish",
      sumTitle: "Verb network practice finished",
      sumStopped: "Progress saved up to here.",
      sumDone: "All action networks finished. Well done.",
      colVerb: "Verb",
      colRes: "Triad",
      colPlaus: "Sense check",
      resGood: "Clean",
      resAlmost: "Assisted",
      resOk: "Clear",
      resHelp: "Reviewed",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("verbs_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("verbs_sessions"); return Array.isArray(s) ? s : []; }

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
    return same.concat(near).slice(0, targetN).map(function (item) {
      return Object.assign({}, item, {
        agents: shuffle(item.agents),
        patients: shuffle(item.patients)
      });
    });
  }

  function computeVerbsProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, triadClean = 0, plausClean = 0, hintsUsed = 0, scores = [];
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.triadClean) triadClean++;
        if (it.plausClean) plausClean++;
        if (it.hintUsed) hintsUsed++;
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    var acc = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
    return { total: total, triadClean: triadClean, plausClean: plausClean, hintsUsed: hintsUsed, accuracy: acc };
  }

  function maybeAdaptLevel(lv, sessions) {
    if (!sessions.length) return lv;
    var recent = sessions.slice(-RULE.upN).map(function (s) { return s.accuracy; }).filter(function (v) { return v != null; });
    if (recent.length >= RULE.downN && recent.slice(-RULE.downN).every(function (v) { return v < RULE.down; }) && lv < MAXLV) return lv + 1;
    if (recent.length >= RULE.upN && recent.slice(-RULE.upN).every(function (v) { return v >= RULE.up; }) && lv > 1) return lv - 1;
    return lv;
  }

  var V = null;

  function initState(item) {
    return {
      item: item,
      stage: "triad", // "triad" | "plaus" | "done"
      agentPicked: null,
      patientPicked: null,
      wrongAgents: {},
      wrongPatients: {},
      plausWrong: false,
      hintUsed: false,
      nudge: "",
      explain: "",
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
    api.go("verbs");
  }

  function recordCurrent() {
    var st = V.st, it = st.item;
    var triadClean = !Object.keys(st.wrongAgents).length && !Object.keys(st.wrongPatients).length && !st.hintUsed;
    var plausClean = !st.plausWrong;
    var sc = (triadClean && plausClean) ? 1 : (plausClean || triadClean) ? 0.65 : 0.35;
    V.log.push({
      id: it.id,
      lv: it.lv,
      verb: it.verb,
      triadClean: triadClean,
      plausClean: plausClean,
      hintUsed: st.hintUsed,
      result: triadClean && plausClean ? "good" : "almost",
      score: sc,
      ms: Date.now() - st.startedAt
    });
  }

  function finishSession() {
    var all = listSessions();
    var avgScore = V.log.length
      ? Math.round((V.log.reduce(function (a, b) { return a + b.score; }, 0) / V.log.length) * 100) / 100
      : null;
    all.push({
      id: "vb" + Date.now().toString(36),
      date: new Date().toISOString(),
      lang: api.lang(),
      lv: V.lv,
      who: api.getWho ? api.getWho() : "solo",
      accuracy: avgScore,
      stopped: V.stopped,
      items: V.log.slice()
    });
    if (all.length > KEEP) all = all.slice(-KEEP);
    api.save("verbs_sessions", all);
    var nextLv = maybeAdaptLevel(V.lv, all);
    if (nextLv !== V.lv) api.save("verbs_level", nextLv);
    V.screen = "sum";
    api.render();
  }

  function viewItem() {
    var t = T(), st = V.st, it = st.item;
    var agentDone = st.agentPicked != null;
    var patientDone = st.patientPicked != null;

    var slotHtml = '<div class="vb-frame" aria-live="polite">' +
      '<span class="vb-slot' + (agentDone ? ' ok' : '') + '">' + esc(agentDone ? it.agents[st.agentPicked].text : "…") + '</span>' +
      '<span class="vb-verb">' + esc(it.verb) + '</span>' +
      '<span class="vb-slot' + (patientDone ? ' ok' : '') + '">' + esc(patientDone ? it.patients[st.patientPicked].text : "…") + '</span>' +
      '<span class="vb-where">' + esc(it.where) + '</span>' +
      '</div>';

    var body = "";
    if (st.stage === "triad") {
      body = '<div class="vb-group"><p class="vb-sub">' + esc(t.whoAsk) + '</p><div class="var-tiles">' +
        it.agents.map(function (ag, idx) {
          var isOk = st.agentPicked === idx;
          var isBad = !!st.wrongAgents[idx];
          return '<button type="button" class="var-tile' + (isOk ? ' ok' : isBad ? ' dim' : '') + '" data-act="vb-agent" data-i="' + idx + '"' + (agentDone || isBad ? ' disabled' : '') + '>' + esc(ag.text) + '</button>';
        }).join("") + '</div></div>' +
        '<div class="vb-group"><p class="vb-sub">' + esc(t.whatAsk) + '</p><div class="var-tiles">' +
        it.patients.map(function (pt, idx) {
          var isOk = st.patientPicked === idx;
          var isBad = !!st.wrongPatients[idx];
          return '<button type="button" class="var-tile' + (isOk ? ' ok' : isBad ? ' dim' : '') + '" data-act="vb-patient" data-i="' + idx + '"' + (patientDone || isBad ? ' disabled' : '') + '>' + esc(pt.text) + '</button>';
        }).join("") + '</div></div>';
    } else if (st.stage === "plaus") {
      body = '<div class="wb-cuebox"><p><strong>' + esc(t.plausTitle) + '</strong></p><p>' + esc(it.plausibility.text) + '</p></div>' +
        '<div class="var-opts two">' +
        '<button type="button" class="var-opt" data-act="vb-plaus" data-ans="true"' + (st.plausWrong && !it.plausibility.ok ? ' disabled' : '') + '>' + esc(t.yes) + '</button>' +
        '<button type="button" class="var-opt" data-act="vb-plaus" data-ans="false"' + (st.plausWrong && it.plausibility.ok ? ' disabled' : '') + '>' + esc(t.no) + '</button>' +
        '</div>';
    } else {
      body = '<div class="var-feedback good"><p><strong>' + esc(t.sentTitle) + '</strong></p>' +
        '<p class="phrase">' + esc(it.sentence) + '</p>' +
        '<p class="note">' + esc(t.speakPrompt) + '</p>' +
        '<div class="row-actions"><button type="button" class="tool" data-act="vb-play-sent">' + esc(t.listenSent) + '</button></div>' +
        '</div>';
    }

    return api.header(false) +
      '<div class="bar"><span class="tag">' + esc(api.fill(t.stepOf, { i: V.idx + 1, n: V.items.length })) + '</span>' +
      '<button type="button" class="stop" data-act="vb-stop">' + esc(t.stop) + '</button></div>' +
      '<section class="card">' +
      '<div class="pic sm" aria-hidden="true">' + esc(it.icon) + '</div>' +
      '<p class="tag">' + esc(t.title + " · " + api.fill(t.lvTag, { n: it.lv })) + '</p>' +
      '<h1 class="instr">' + esc(it.prompt) + '</h1>' +
      slotHtml +
      '<div class="tools">' +
      '<button type="button" class="tool" data-act="vb-play">' + esc(t.listen) + '</button>' +
      (st.stage === "triad" ? '<button type="button" class="tool" data-act="vb-hint">' + esc(t.hint) + '</button>' : '') +
      '</div>' +
      (st.hintUsed && it.cue ? '<div class="wb-cuebox"><p>' + esc(it.cue) + '</p></div>' : '') +
      body +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      (st.explain ? '<p class="note" role="status">' + esc(st.explain) + '</p>' : '') +
      (st.stage === "done" ? '<button type="button" class="primary" data-act="vb-next">' + esc(V.idx + 1 < V.items.length ? t.next : t.done) + '</button>' : '') +
      '</section>';
  }

  function viewSummary() {
    var t = T();
    var rows = V.log.map(function (it) {
      return '<tr><td>' + esc(it.verb) + '</td>' +
        '<td><span class="pill ' + esc(it.triadClean ? 'good' : 'almost') + '">' + esc(it.triadClean ? t.resGood : t.resAlmost) + '</span></td>' +
        '<td><span class="pill ' + esc(it.plausClean ? 'good' : 'almost') + '">' + esc(it.plausClean ? t.resOk : t.resHelp) + '</span></td></tr>';
    }).join("");
    return api.header(false) + '<section class="card sum">' +
      '<div class="sumhead"><h1>' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p></div>' +
      '<div class="tbl"><table><thead><tr><th>' + esc(t.colVerb) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colPlaus) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="row-actions"><button type="button" class="primary" data-act="vb-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="secondary" data-act="vb-home-exit">' + esc(t.backHome) + '</button></div></section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.verbs = function () {
    if (!V) return viewSummary();
    return V.screen === "sum" ? viewSummary() : viewItem();
  };

  A["verbs-home"] = function () { startDrill(); };
  A["vb-play"] = function () { if (V && V.st) api.speak(V.st.item.verb + ". " + V.st.item.prompt); };
  A["vb-play-sent"] = function () { if (V && V.st) api.speak(V.st.item.sentence); };
  A["vb-hint"] = function () {
    if (!V || !V.st || V.st.stage !== "triad") return;
    var st = V.st, it = st.item;
    st.hintUsed = true;
    if (st.agentPicked == null) {
      for (var i = 0; i < it.agents.length; i++) if (it.agents[i].ok) { st.agentPicked = i; break; }
    } else if (st.patientPicked == null) {
      for (var j = 0; j < it.patients.length; j++) if (it.patients[j].ok) { st.patientPicked = j; break; }
    }
    if (st.agentPicked != null && st.patientPicked != null) {
      st.stage = "plaus";
      st.nudge = T().triadOk;
    }
    api.render();
  };
  A["vb-agent"] = function (b) {
    if (!V || !V.st || V.st.stage !== "triad") return;
    var st = V.st, idx = +b.getAttribute("data-i"), ag = st.item.agents[idx];
    if (!ag) return;
    if (ag.ok) {
      st.agentPicked = idx;
      st.nudge = "";
      if (st.patientPicked != null) { st.stage = "plaus"; st.nudge = T().triadOk; }
    } else {
      st.wrongAgents[idx] = 1;
      st.nudge = T().triadWrong;
    }
    api.render();
  };
  A["vb-patient"] = function (b) {
    if (!V || !V.st || V.st.stage !== "triad") return;
    var st = V.st, idx = +b.getAttribute("data-i"), pt = st.item.patients[idx];
    if (!pt) return;
    if (pt.ok) {
      st.patientPicked = idx;
      st.nudge = "";
      if (st.agentPicked != null) { st.stage = "plaus"; st.nudge = T().triadOk; }
    } else {
      st.wrongPatients[idx] = 1;
      st.nudge = T().triadWrong;
    }
    api.render();
  };
  A["vb-plaus"] = function (b) {
    if (!V || !V.st || V.st.stage !== "plaus") return;
    var st = V.st, ans = b.getAttribute("data-ans") === "true";
    if (ans === !!st.item.plausibility.ok) {
      st.explain = st.item.plausibility.explain;
      st.nudge = "";
      st.stage = "done";
      recordCurrent();
    } else {
      st.plausWrong = true;
      st.nudge = T().plausWrong + " " + st.item.plausibility.explain;
    }
    api.render();
  };
  A["vb-next"] = function () {
    if (!V) return;
    if (V.idx + 1 < V.items.length) {
      V.idx++;
      V.st = initState(V.items[V.idx]);
      api.render();
    } else {
      finishSession();
    }
  };
  A["vb-stop"] = function () {
    if (!V) return;
    V.stopped = true;
    finishSession();
  };
  A["vb-back-var"] = function () { V = null; api.go("variants"); };
  A["vb-home-exit"] = function () { V = null; api.go("home"); };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "verbs") startDrill();
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.verbs = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeVerbsProfile: computeVerbsProfile
  };
})();
