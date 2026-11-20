/*
 * Conversational Script Training & Pragmatic Repair Drill ("Dialoghi quotidiani / Everyday dialogues").
 * Two-turn pragmatic interaction (initial response + follow-up clarification/repair) across phone,
 * errand, and social settings with audio playback, social clue scaffolding, and adaptive leveling.
 *
 * Stored strictly locally on this device (`dialogue_sessions`, `dialogue_level`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.DIALOGUE;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Dialoghi quotidiani",
      desc: "Allena brevi conversazioni al telefono, al bar, in farmacia e con chi incontri.",
      lvTag: "Livello {n}",
      stepOf: "Dialogo {i} di {n}",
      turnReply: "Turno 1 · Risposta",
      turnRepair: "Turno 2 · Chiarimento",
      stop: "Termina",
      listenPartner: "🔊 Ascolta chi parla",
      listenFull: "🔊 Riascolta il dialogo",
      hint: "💡 Suggerimento",
      wrong: "Rileggi ciò che chiede l'altra persona e scegli la risposta più adatta.",
      replyOk: "Risposta chiara! Ora rispondi al seguito del dialogo.",
      good: "Dialogo naturale e chiaro!",
      almost: "Dialogo completato con un aiuto.",
      next: "Avanti",
      done: "Fatto",
      kinds: { phone: "Telefono", errand: "Commissioni", social: "Incontri" },
      sumTitle: "Dialoghi quotidiani completati",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutti i dialoghi completati.",
      colSent: "Contesto / Turno",
      colRes: "Esito",
      resGood: "Autonomo",
      resAlmost: "Con aiuto",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Everyday dialogues",
      desc: "Practise natural two-turn conversations on the phone, at shops, and with friends.",
      lvTag: "Level {n}",
      stepOf: "Dialogue {i} of {n}",
      turnReply: "Turn 1 · Reply",
      turnRepair: "Turn 2 · Follow-up",
      stop: "Stop",
      listenPartner: "🔊 Hear speaker",
      listenFull: "🔊 Hear full dialogue",
      hint: "💡 Clue",
      wrong: "Check what the speaker asked and choose the clearest natural reply.",
      replyOk: "Clear reply! Now handle their follow-up question.",
      good: "Natural two-turn conversation!",
      almost: "Completed with a little support.",
      next: "Next",
      done: "Finish",
      kinds: { phone: "Phone call", errand: "Errand / counter", social: "Social chat" },
      sumTitle: "Everyday dialogues complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All two-turn dialogues finished cleanly.",
      colSent: "Setting",
      colRes: "Result",
      resGood: "Clean turns",
      resAlmost: "Assisted",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("dialogue_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("dialogue_sessions"); return Array.isArray(s) ? s : []; }

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
      var replyTagged = shuffle(it.opts.map(function (txt, idx) { return { text: txt, ok: idx === it.ans }; }));
      var repairTagged = shuffle(it.repairOpts.map(function (txt, idx) { return { text: txt, ok: idx === it.repairAns }; }));
      return Object.assign({}, it, { shuffledReply: replyTagged, shuffledRepair: repairTagged });
    });
  }

  function computeDialogueProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, cleanBoth = 0, scores = [];
    var byKind = { phone: { n: 0, ok: 0 }, errand: { n: 0, ok: 0 }, social: { n: 0, ok: 0 } };
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        if (it.cleanBoth) cleanBoth++;
        var k = byKind[it.kind] ? it.kind : "errand";
        byKind[k].n++;
        if (it.cleanBoth) byKind[k].ok++;
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    var acc = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : null;
    return { total: total, cleanBoth: cleanBoth, byKind: byKind, accuracy: acc };
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

  function initStep(item) {
    return {
      item: item,
      startedAt: Date.now(),
      phase: "reply", /* reply -> repair -> done */
      elimReply: {},
      elimRepair: {},
      attempts: 0,
      hintShown: false,
      nudge: ""
    };
  }

  function startDrill() {
    stopVoice();
    var lv = getLevel();
    var queue = buildDrill(api.lang(), lv, 3);
    if (!queue.length) return;
    V = {
      id: "dg" + Date.now().toString(36),
      lv: lv,
      steps: queue,
      i: 0,
      st: initStep(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("dialogue");
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
      api.save("dialogue_sessions", all);
      var nextLv = maybeAdaptLevel(V.lv, all);
      if (nextLv !== V.lv) api.save("dialogue_level", nextLv);
    }
    api.render();
  }

  function viewScreen() {
    if (!V) { startDrill(); if (!V) return api.header(false); }
    var t = T();
    if (V.done) {
      var rows = V.log.map(function (r) {
        return '<tr><td>' + esc((t.kinds[r.kind] || r.kind) + " · " + r.label) + '</td>' +
          '<td><span class="pill ' + esc(r.result) + '">' + esc(r.cleanBoth ? t.resGood : t.resAlmost) + '</span></td></tr>';
      }).join("");
      return api.header(false) + '<section class="card">' +
        '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
        '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p>' +
        (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colSent) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '') +
        '<button type="button" class="primary" data-act="dg-var-hub">' + esc(t.backVar) + '</button>' +
        '<button type="button" class="link" data-act="dg-back">' + esc(t.backHome) + '</button></section>';
    }

    var st = V.st, item = st.item;
    var bar = '<div class="bar"><span class="brand">' + esc(t.btn) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="dg-stop">' + esc(t.stop) + '</button></div>';

    var turnTag = st.phase === "reply" ? t.turnReply : t.turnRepair;
    var promptBubble = '<div class="dg-bubble"><p>' + esc(st.phase === "reply" ? item.partner : item.followUp) + '</p></div>';
    var cueHtml = st.hintShown ? '<div class="hint"><b>1</b><span>' + esc(item.cue) + '</span></div>' : '';

    var body = "";
    if (st.phase === "done") {
      body = '<div class="var-feedback good"><p><strong>' + esc(st.cleanBoth ? t.good : t.almost) + '</strong> ' + esc(item.explanation) + '</p></div>' +
        '<p class="phrase">' + esc(item.fullDialogue) + '</p>' +
        '<div class="tools"><button type="button" class="tool" data-act="dg-say-full">' + esc(t.listenFull) + '</button></div>' +
        '<button type="button" class="primary" data-act="dg-next">' + esc(V.i + 1 < V.steps.length ? t.next : t.done) + '</button>';
    } else {
      var list = st.phase === "reply" ? item.shuffledReply : item.shuffledRepair;
      var elim = st.phase === "reply" ? st.elimReply : st.elimRepair;
      var optsHtml = '<div class="nr-gists">' + list.map(function (opt, idx) {
        var cls = "var-opt";
        if (elim[idx]) cls += " dim";
        return '<button type="button" class="' + cls + '" data-act="dg-pick" data-i="' + idx + '"' + (elim[idx] ? ' disabled' : '') + '>' + esc(opt.text) + '</button>';
      }).join("") + '</div>';

      body = '<div class="tools">' +
        '<button type="button" class="tool" data-act="dg-say">' + esc(t.listenPartner) + '</button>' +
        '<button type="button" class="tool" data-act="dg-hint"' + (st.hintShown ? ' disabled' : '') + '>' + esc(t.hint) + '</button>' +
        '</div>' +
        cueHtml +
        optsHtml +
        (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '');
    }

    return bar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: V.lv })) + ' · ' + esc(t.kinds[item.kind] || item.kind) + ' · ' + esc(turnTag) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + item.pic + '</div>' +
      promptBubble +
      body +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.dialogue = viewScreen;

  A["dg-home"] = function () { startDrill(); };
  A["dg-stop"] = function () { finishSession(true); };
  A["dg-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["dg-var-hub"] = function () { stopVoice(); V = null; api.go("variants"); };
  A["dg-say"] = function () {
    if (!V || !V.st || !V.st.item) return;
    var it = V.st.item;
    api.speak(V.st.phase === "reply" ? it.partner : it.followUp);
  };
  A["dg-say-full"] = function () {
    if (V && V.st && V.st.item) api.speak(V.st.item.fullDialogue);
  };
  A["dg-hint"] = function () {
    if (!V || !V.st || V.st.phase === "done") return;
    V.st.hintShown = true;
    api.render();
  };
  A["dg-pick"] = function (b) {
    if (!V || !V.st || V.st.phase === "done") return;
    var st = V.st, item = st.item, idx = +b.getAttribute("data-i");
    var isReply = st.phase === "reply";
    var list = isReply ? item.shuffledReply : item.shuffledRepair;
    var elim = isReply ? st.elimReply : st.elimRepair;
    var opt = list[idx];
    if (!opt || elim[idx]) return;

    if (opt.ok) {
      if (isReply) {
        st.phase = "repair";
        st.nudge = T().replyOk;
        api.speak(item.followUp);
      } else {
        st.phase = "done";
        st.cleanBoth = st.attempts === 0 && !st.hintShown;
        st.nudge = "";
        var sc = st.cleanBoth ? 1 : (st.attempts === 0 && st.hintShown ? 0.8 : Math.max(0.5, 0.85 - st.attempts * 0.15));
        V.log.push({
          game: "dialogue",
          id: item.id,
          kind: item.kind,
          lv: V.lv,
          label: item.fullDialogue.slice(0, 48),
          cleanBoth: st.cleanBoth,
          hintUsed: st.hintShown,
          attempts: st.attempts,
          result: st.cleanBoth ? "good" : "almost",
          score: Math.round(sc * 100) / 100,
          ms: Date.now() - st.startedAt
        });
        api.speak(item.fullDialogue);
      }
    } else {
      st.attempts++;
      elim[idx] = true;
      st.nudge = T().wrong;
    }
    api.render();
  };
  A["dg-next"] = function () {
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
    if (api.screen() === "dialogue" && V && !V.done) startDrill();
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.dialogue = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    level: getLevel,
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeDialogueProfile: computeDialogueProfile
  };
})();
