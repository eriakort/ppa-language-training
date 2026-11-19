/*
 * Spoken Message & Pragmatic Discourse Comprehension Module (bilingual IT & EN).
 *
 * Designed for lvPPA (phonological working memory) & svPPA (auditory concept comprehension):
 *   - Plays everyday multi-clause spoken messages (clinic voicemails, pharmacy dosing, family calls)
 *   - Tracks Normal first-pass comprehension vs. Slow replay (0.78x) vs. Written Keyword Anchor rescue
 *   - Adapts difficulty level (1 = hardest / 3 = most support) and saves strictly locally
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var BANK = window.POG && window.POG.content && window.POG.content.DISCOURSE;
  if (!api || !BANK) return;
  var esc = api.esc;

  var MAXLV = 3;
  var KEEP = 120;
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5 };

  var C = {
    it: {
      title: "Ascolta il messaggio",
      desc: "Comprendi avvisi vocali quotidiani con ascolto lento e parole chiave scritte.",
      lvNames: ["Impegnativo", "Intermedio", "Con più supporto"],
      lvTag: "Livello {n} · {name}",
      stepOf: "Messaggio {i} di {n}",
      stop: "Termina",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio",
      listenBtn: "🔊 Ascolta messaggio",
      slowBtn: "🐢 Ascolta più lento",
      kwBtn: "📝 Parole chiave",
      textBtn: "📄 Mostra testo completo",
      noAudioHint: "Se non senti l'audio sul dispositivo, tocca «Parole chiave» o «Mostra testo completo».",
      wrongNudge: "Non è questa: prova a riascoltare piano o ad aprire le parole chiave.",
      goodFeedback: "Compreso subito al primo ascolto!",
      almostFeedback: "Ottimo, compreso con il supporto delle parole chiave o del riascolto.",
      nextBtn: "Avanti",
      sumTitle: "Comprensione messaggi completata",
      sumDone: "Tutte le prove di ascolto sono state salvate sul dispositivo.",
      sumStopped: "Ci fermiamo qui. Le prove completate sono state salvate.",
      colMsg: "Messaggio", colRes: "Esito", colSupport: "Supporto",
      res: { good: "Primo ascolto", almost: "Con aiuto" },
      supports: { none: "Solo audio normale", slow: "Audio lento", keywords: "Parole chiave", text: "Testo visivo" }
    },
    en: {
      title: "Spoken messages",
      desc: "Catch key details in everyday voice messages using slow replay and written keywords.",
      lvNames: ["Demanding", "Standard", "More support"],
      lvTag: "Level {n} · {name}",
      stepOf: "Message {i} of {n}",
      stop: "Stop",
      backVar: "Back to targeted practice",
      backHome: "Back to home",
      listenBtn: "🔊 Play message",
      slowBtn: "🐢 Listen slowly",
      kwBtn: "📝 Written keywords",
      textBtn: "📄 Show full text",
      noAudioHint: "If audio is muted or unavailable here, tap “Written keywords” or “Show full text”.",
      wrongNudge: "Not quite that detail — try listening slowly or revealing the written keywords.",
      goodFeedback: "Understood cleanly on first listen!",
      almostFeedback: "Well done — slow replay or written keywords helped catch the detail.",
      nextBtn: "Next",
      sumTitle: "Spoken messages complete",
      sumDone: "All spoken comprehension items have been saved locally.",
      sumStopped: "Stopping here. Completed items have been saved.",
      colMsg: "Message", colRes: "Outcome", colSupport: "Support",
      res: { good: "First listen", almost: "With support" },
      supports: { none: "Normal audio only", slow: "Slow replay", keywords: "Keywords", text: "Written text" }
    }
  };

  function T() { return C[api.lang()] || C.it; }

  function shuffle(a) {
    var out = a.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function getLevel() {
    var lv = +api.load("discourse_level");
    return (lv >= 1 && lv <= MAXLV) ? lv : 2;
  }

  function listSessions() {
    var s = api.load("discourse_sessions");
    return Array.isArray(s) ? s : [];
  }

  function buildDrill(lv, langCode) {
    var lc = langCode === "en" ? "en" : "it";
    var pool = BANK[lc] || BANK.it;
    var atLv = shuffle(pool.filter(function (x) { return x.lv === lv; }));
    var other = shuffle(pool.filter(function (x) { return x.lv !== lv; }));
    return atLv.concat(other).slice(0, 3).map(function (item) {
      return { lv: item.lv, data: item };
    });
  }

  function speakRate(text, rate) {
    if (!text) return;
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = api.lang() === "it" ? "it-IT" : "en-GB";
        u.rate = rate || 1;
        window.speechSynthesis.speak(u);
        return;
      }
    } catch (e) {}
    if (api.speak) api.speak(text);
  }

  function computeDiscourseProfile(sessions) {
    var out = {
      total: 0,
      firstPass: 0,
      slowAssisted: 0,
      keywordRescued: 0,
      textAssisted: 0,
      accuracy: null
    };
    var sumScore = 0;
    (sessions || []).forEach(function (s) {
      (s && s.items || []).forEach(function (it) {
        if (!it) return;
        out.total++;
        sumScore += (+it.score || 0);
        if (it.firstPass) out.firstPass++;
        if (it.slowUsed) out.slowAssisted++;
        if (it.kwUsed && (it.result === "almost" || it.result === "good")) out.keywordRescued++;
        if (it.textUsed) out.textAssisted++;
      });
    });
    if (out.total) out.accuracy = Math.round((sumScore / out.total) * 1000) / 1000;
    return out;
  }

  var DC = null;

  function makeStepState(step) {
    return {
      startedAt: Date.now(),
      optOrder: shuffle(step.data.opts.map(function (_, i) { return i; })),
      elim: {},
      firstTry: true,
      slowUsed: false,
      kwUsed: step.lv === 3,
      textUsed: false,
      playedCount: 0,
      nudge: "",
      done: false,
      result: null
    };
  }

  function startDrill() {
    if (api.stopVoice) api.stopVoice();
    var lv = getLevel();
    var steps = buildDrill(lv, api.lang());
    if (!steps.length) return;
    DC = {
      id: "dc" + Date.now().toString(36),
      lv: lv,
      who: "solo",
      steps: steps,
      i: 0,
      st: makeStepState(steps[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false,
      levelChange: null
    };
    api.go("discourse");
    speakRate(steps[0].data.spokenText, steps[0].lv === 3 ? 0.9 : 1);
  }

  function curStep() { return DC && DC.steps[DC.i]; }

  function recordCurrent(result, scoreVal) {
    if (!DC || !curStep() || !DC.st || DC.st.recorded) return;
    DC.st.recorded = true;
    var step = curStep(), st = DC.st;
    st.done = true;
    st.result = result;
    var supportMode = st.textUsed ? "text" : st.kwUsed && step.lv < 3 ? "keywords" : st.slowUsed ? "slow" : "none";
    var firstPass = !!(st.firstTry && !st.slowUsed && !(st.kwUsed && step.lv < 3) && !st.textUsed);
    DC.log.push({
      game: "discourse",
      lv: step.lv,
      kind: step.data.kind,
      id: step.data.id,
      label: step.data.speakerTitle,
      result: result,
      support: supportMode,
      firstPass: firstPass,
      slowUsed: !!st.slowUsed,
      kwUsed: !!(st.kwUsed && step.lv < 3),
      textUsed: !!st.textUsed,
      score: scoreVal,
      hints: (st.slowUsed ? 1 : 0) + (st.kwUsed && step.lv < 3 ? 1 : 0) + (st.textUsed ? 1 : 0),
      ms: Date.now() - st.startedAt
    });
  }

  function saveAndAdapt() {
    if (!DC || !DC.log.length || DC.saved) return;
    DC.saved = true;
    var mean = DC.log.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / DC.log.length;
    var sess = {
      id: DC.id,
      date: new Date().toISOString(),
      mode: "discourse",
      who: DC.who,
      lv: DC.lv,
      accuracy: Math.round(mean * 1000) / 1000,
      items: DC.log.slice()
    };
    var all = listSessions().concat([sess]).slice(-KEEP);
    api.save("discourse_sessions", all);

    var curLv = getLevel();
    var avgs = all.map(function (s) {
      var items = s.items || [];
      return items.length ? items.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / items.length : null;
    }).filter(function (v) { return v != null; });

    if (avgs.length >= RULE.downN) {
      var r3 = avgs.slice(-RULE.downN);
      if (r3.reduce(function (a, b) { return a + b; }, 0) / r3.length < RULE.down && curLv < MAXLV) {
        api.save("discourse_level", curLv + 1);
        DC.levelChange = { from: curLv, to: curLv + 1 };
        return;
      }
    }
    var vs = api.load("variant_settings") || {};
    if (vs.allowUp !== false && avgs.length >= RULE.upN) {
      var r5 = avgs.slice(-RULE.upN);
      if (r5.reduce(function (a, b) { return a + b; }, 0) / r5.length >= RULE.up && curLv > 1) {
        api.save("discourse_level", curLv - 1);
        DC.levelChange = { from: curLv, to: curLv - 1 };
      }
    }
  }

  /* ---------- Views ---------- */
  function viewSummary() {
    var t = T();
    var rows = DC.log.map(function (r) {
      return '<tr><td>' + esc(r.label) + '</td><td><span class="pill ' + esc(r.result) + '">' + esc(t.res[r.result] || r.result) + '</span></td>' +
        '<td>' + esc(t.supports[r.support] || r.support) + '</td></tr>';
    }).join("");
    var ch = DC.levelChange ? '<ul class="changes"><li>' + esc(t.title + ": " + api.t().level + " " + DC.levelChange.from + " → " + DC.levelChange.to) + '</li></ul>' : '';
    return api.header(false) + '<section class="card">' +
      '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(DC.stopped ? t.sumStopped : t.sumDone) + '</p>' +
      (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colMsg) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colSupport) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + ch + '</div>' : '') +
      '<button type="button" class="primary" data-act="disc-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="link" data-act="disc-home-exit">' + esc(t.backHome) + '</button></section>';
  }

  function viewScreen() {
    if (!DC) { startDrill(); if (!DC) return api.header(false); }
    if (DC.done) return viewSummary();
    var t = T(), step = curStep(), st = DC.st, d = step.data;

    var bar = '<div class="bar"><span class="brand">' + esc(t.title) + ' · ' + esc(api.fill(t.stepOf, { i: DC.i + 1, n: DC.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="disc-stop">' + esc(t.stop) + '</button></div>';
    var stepsBar = '<ol class="steps" aria-label="Progress">' + DC.steps.map(function (_, idx) {
      var cls = idx < DC.i ? "past" : idx === DC.i ? "on" : "";
      return '<li class="' + cls + '">' + esc(String(idx + 1)) + '</li>';
    }).join("") + '</ol>';

    var audioPanel = '<div class="dc-panel">' +
      '<div class="fn-meta"><span>' + (d.pic || "🎧") + '</span><strong>' + esc(d.speakerTitle) + '</strong></div>' +
      '<div class="tools">' +
      '<button type="button" class="tool" data-act="disc-play">' + esc(t.listenBtn) + '</button>' +
      '<button type="button" class="tool" data-act="disc-slow">' + esc(t.slowBtn) + '</button>' +
      (!st.kwUsed ? '<button type="button" class="tool" data-act="disc-kw">' + esc(t.kwBtn) + '</button>' : '') +
      (!st.textUsed && (st.kwUsed || !st.firstTry || !("speechSynthesis" in window)) ? '<button type="button" class="tool" data-act="disc-text">' + esc(t.textBtn) + '</button>' : '') +
      '</div>' +
      (!("speechSynthesis" in window) && !st.kwUsed && !st.textUsed ? '<p class="note">' + esc(t.noAudioHint) + '</p>' : '') +
      (st.kwUsed ? '<div class="kw dc-kw">' + d.keywords.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join("") + '</div>' : '') +
      (st.textUsed || st.done ? '<p class="dc-transcript">' + esc(d.spokenText) + '</p>' : '') +
      '</div>';

    var optsHtml = '<div class="var-opts">' + st.optOrder.map(function (origIdx) {
      var optTxt = d.opts[origIdx];
      var cls = "var-opt";
      if (st.done && origIdx === d.ans) cls += " ok";
      else if (st.elim[origIdx]) cls += " dim";
      return '<button type="button" class="' + cls + '" data-act="disc-opt" data-i="' + origIdx + '"' + (st.done || st.elim[origIdx] ? ' disabled' : '') + '>' +
        '<span>' + esc(optTxt) + '</span></button>';
    }).join("") + '</div>';

    var footer = st.done
      ? '<div class="var-feedback good"><p><strong>' + esc(st.result === "good" ? t.goodFeedback : t.almostFeedback) + '</strong> ' + esc(d.explanation) + '</p></div>' +
        '<button type="button" class="primary" data-act="disc-next">' + esc(t.nextBtn) + '</button>'
      : '';

    return bar + stepsBar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: step.lv, name: t.lvNames[step.lv - 1] })) + '</p>' +
      audioPanel +
      '<p class="instr">' + esc(d.question) + '</p>' +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      optsHtml +
      footer +
      '</section>';
  }

  /* ---------- Registration ---------- */
  var ext = window.POG.ext, A = ext.actions;
  ext.screens.discourse = viewScreen;

  A["disc-home"] = startDrill;
  A["disc-back-var"] = function () { if (api.stopVoice) api.stopVoice(); DC = null; api.go("variants"); };
  A["disc-home-exit"] = function () { if (api.stopVoice) api.stopVoice(); DC = null; api.go("home"); };
  A["disc-stop"] = function () {
    if (api.stopVoice) api.stopVoice();
    if (!DC) return;
    DC.done = true; DC.stopped = true;
    saveAndAdapt();
    api.render();
  };
  A["disc-next"] = function () {
    if (api.stopVoice) api.stopVoice();
    if (!DC) return;
    if (DC.i + 1 < DC.steps.length) {
      DC.i++;
      DC.st = makeStepState(DC.steps[DC.i]);
      api.render();
      speakRate(DC.steps[DC.i].data.spokenText, DC.steps[DC.i].lv === 3 ? 0.9 : 1);
    } else {
      DC.done = true;
      saveAndAdapt();
      api.render();
    }
  };
  A["disc-play"] = function () {
    var step = curStep();
    if (!step || !DC || !DC.st) return;
    DC.st.playedCount++;
    speakRate(step.data.spokenText, 1);
  };
  A["disc-slow"] = function () {
    var step = curStep();
    if (!step || !DC || !DC.st) return;
    DC.st.slowUsed = true;
    DC.st.nudge = "";
    speakRate(step.data.spokenText, 0.78);
    api.render();
  };
  A["disc-kw"] = function () {
    if (!DC || !DC.st || DC.st.done) return;
    DC.st.kwUsed = true;
    DC.st.nudge = "";
    api.render();
  };
  A["disc-text"] = function () {
    if (!DC || !DC.st || DC.st.done) return;
    DC.st.textUsed = true;
    DC.st.nudge = "";
    api.render();
  };
  A["disc-opt"] = function (b) {
    var step = curStep(), st = DC && DC.st, t = T();
    if (!step || !st || st.done) return;
    var i = +b.getAttribute("data-i");
    if (i === step.data.ans) {
      var cleanFirst = st.firstTry && !st.slowUsed && !(st.kwUsed && step.lv < 3) && !st.textUsed;
      recordCurrent(cleanFirst ? "good" : "almost", cleanFirst ? 1 : 0.5);
      st.nudge = "";
      api.render();
    } else {
      st.elim[i] = true;
      st.firstTry = false;
      st.nudge = t.wrongNudge;
      api.render();
    }
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "discourse") {
      if (DC && !DC.done) startDrill();
      else api.render();
    }
  });
  window.addEventListener("pog:profile-change", function () {
    if (api.stopVoice) api.stopVoice();
    DC = null;
  });

  window.POG.discourse = {
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    computeDiscourseProfile: computeDiscourseProfile,
    label: function () { return T().title; },
    desc: function () { return T().desc; },
    lvTag: function () { var lv = getLevel(), t = T(); return api.fill(t.lvTag, { n: lv, name: t.lvNames[lv - 1] }); }
  };
})();
