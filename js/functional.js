/*
 * Everyday functional reading & written communication module (bilingual: IT & EN).
 * Practises real-world reading comprehension (clinic cards, medicine labels, household notes,
 * schedules, and message replies) with visual phrase-anchoring hints and audio read-aloud.
 * Level convention matches the main app: 1 = most demanding, 3 = most support.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var BANK = window.POG && window.POG.content && window.POG.content.FUNCTIONAL;
  if (!api || !BANK) return;
  var esc = api.esc;

  var MAXLV = 3;
  var KEEP = 120;
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5 };

  var C = {
    it: {
      title: "Lettura nella vita quotidiana",
      desc: "Avvisi, messaggi, orari e istruzioni pratiche con aiuto visivo.",
      lvNames: ["Impegnativo", "Intermedio", "Con più supporto"],
      lvTag: "Livello {n} · {name}",
      stepOf: "Testo {i} di {n}",
      stop: "Termina",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio",
      listen: "Ascolta il testo",
      hint: "Evidenzia il punto chiave",
      next: "Avanti",
      wrong: "Non è questa: rileggi con calma o usa l'aiuto.",
      goodFeedback: "Esatto!",
      almostFeedback: "Ben fatto, trovato con l'aiuto.",
      sumTitle: "Lettura quotidiana completata",
      sumDone: "Tutte le prove completate. I risultati sono stati salvati.",
      sumStopped: "Ci fermiamo qui. Le risposte date sono state salvate.",
      colTitle: "Testo", colRes: "Esito", colTime: "Tempo (s)",
      res: { good: "Giusto", almost: "Quasi" }
    },
    en: {
      title: "Everyday functional reading",
      desc: "Appointment cards, medicine labels, short messages, and practical replies.",
      lvNames: ["Demanding", "Standard", "More support"],
      lvTag: "Level {n} · {name}",
      stepOf: "Text {i} of {n}",
      stop: "Stop",
      backVar: "Back to targeted practice",
      backHome: "Back to home",
      listen: "Read aloud",
      hint: "Highlight key clue",
      next: "Next",
      wrong: "Not quite — take another look or highlight the key clue.",
      goodFeedback: "Right!",
      almostFeedback: "Well done, solved with a clue.",
      sumTitle: "Everyday reading complete",
      sumDone: "All texts finished and saved.",
      sumStopped: "Stopping here. Completed answers have been saved.",
      colTitle: "Text", colRes: "Result", colTime: "Time (s)",
      res: { good: "Right", almost: "Nearly" }
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
    var lv = +api.load("functional_level");
    return (lv >= 1 && lv <= MAXLV) ? lv : 2;
  }

  function listSessions() {
    var s = api.load("functional_sessions");
    return Array.isArray(s) ? s : [];
  }

  function buildDrill(lv, langCode) {
    var lc = langCode === "en" ? "en" : "it";
    var pool = BANK[lc] || BANK.it;
    var atLv = shuffle(pool.filter(function (x) { return x.lv === lv; }));
    var other = shuffle(pool.filter(function (x) { return x.lv !== lv; }));
    var picked = atLv.concat(other).slice(0, 3);
    return picked.map(function (item) {
      return { lv: item.lv, data: item };
    });
  }

  function highlightPassage(passage, highlight) {
    if (!highlight) return esc(passage);
    var idx = passage.indexOf(highlight);
    if (idx < 0) return esc(passage);
    return esc(passage.slice(0, idx)) + '<mark class="fn-mark">' + esc(highlight) + '</mark>' + esc(passage.slice(idx + highlight.length));
  }

  var F = null;

  function initStep(step) {
    return {
      startedAt: Date.now(),
      hints: 0,
      firstTry: true,
      elim: {},
      done: false,
      result: null,
      nudge: "",
      optOrder: shuffle(step.data.choices.map(function (_, i) { return i; }))
    };
  }

  function startDrill() {
    if (api.stopVoice) api.stopVoice();
    var lv = getLevel();
    var steps = buildDrill(lv, api.lang());
    if (!steps.length) return;
    F = {
      id: "fn" + Date.now().toString(36),
      lv: lv,
      who: "solo",
      steps: steps,
      i: 0,
      st: initStep(steps[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false,
      levelChange: null
    };
    api.go("functional");
  }

  function curStep() { return F && F.steps[F.i]; }

  function recordCurrent(result, scoreVal) {
    if (!F || !curStep() || !F.st || F.st.recorded) return;
    F.st.recorded = true;
    var step = curStep(), st = F.st;
    st.done = true;
    st.result = result;
    F.log.push({
      game: "functional",
      lv: step.lv,
      kind: step.data.tag,
      id: step.data.id,
      label: step.data.title,
      result: result,
      score: scoreVal,
      hints: st.hints,
      ms: Date.now() - st.startedAt
    });
  }

  function saveAndAdapt() {
    if (!F || !F.log.length || F.saved) return;
    F.saved = true;
    var sess = {
      id: F.id,
      date: new Date().toISOString(),
      mode: "functional",
      who: F.who,
      lv: F.lv,
      items: F.log.slice()
    };
    var all = listSessions().concat([sess]).slice(-KEEP);
    api.save("functional_sessions", all);

    var curLv = getLevel();
    var avgs = all.map(function (s) {
      var items = s.items || [];
      return items.length ? items.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / items.length : null;
    }).filter(function (v) { return v != null; });

    if (avgs.length >= RULE.downN) {
      var r3 = avgs.slice(-RULE.downN);
      if (r3.reduce(function (a, b) { return a + b; }, 0) / r3.length < RULE.down && curLv < MAXLV) {
        api.save("functional_level", curLv + 1);
        F.levelChange = { from: curLv, to: curLv + 1 };
        return;
      }
    }
    var vs = api.load("variant_settings") || {};
    if (vs.allowUp !== false && avgs.length >= RULE.upN) {
      var r5 = avgs.slice(-RULE.upN);
      if (r5.reduce(function (a, b) { return a + b; }, 0) / r5.length >= RULE.up && curLv > 1) {
        api.save("functional_level", curLv - 1);
        F.levelChange = { from: curLv, to: curLv - 1 };
      }
    }
  }

  function viewSummary() {
    var t = T();
    var rows = F.log.map(function (r) {
      return '<tr><td>' + esc(r.label) + '</td><td><span class="pill ' + esc(r.result) + '">' + esc(t.res[r.result] || r.result) + '</span></td><td class="n">' + Math.round((r.ms || 0) / 1000) + '</td></tr>';
    }).join("");
    var ch = F.levelChange ? '<ul class="changes"><li>' + esc(t.title + ": " + api.t().level + " " + F.levelChange.from + " → " + F.levelChange.to) + '</li></ul>' : '';
    return api.header(false) + '<section class="card">' +
      '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(F.stopped ? t.sumStopped : t.sumDone) + '</p>' +
      (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colTitle) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colTime) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + ch + '</div>' : '') +
      '<button type="button" class="primary" data-act="fn-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="link" data-act="fn-home">' + esc(t.backHome) + '</button></section>';
  }

  function viewScreen() {
    if (!F) { startDrill(); if (!F) return api.header(false); }
    if (F.done) return viewSummary();
    var t = T(), step = curStep(), st = F.st, d = step.data;
    var bar = '<div class="bar"><span class="brand">' + esc(t.title) + ' · ' + esc(api.fill(t.stepOf, { i: F.i + 1, n: F.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="fn-stop">' + esc(t.stop) + '</button></div>';
    var stepsBar = '<ol class="steps" aria-label="Progress">' + F.steps.map(function (_, idx) {
      var cls = idx < F.i ? "past" : idx === F.i ? "on" : "";
      return '<li class="' + cls + '">' + esc(String(idx + 1)) + '</li>';
    }).join("") + '</ol>';
    var passageHtml = st.hints >= 1 || st.done ? highlightPassage(d.passage, d.highlight) : esc(d.passage);
    var opts = '<div class="var-opts">' + st.optOrder.map(function (origIdx) {
      var cls = "var-opt";
      if (st.done && origIdx === d.ans) cls += " ok";
      else if (st.elim[origIdx]) cls += " dim";
      return '<button type="button" class="' + cls + '" data-act="fn-opt" data-i="' + origIdx + '"' + (st.done || st.elim[origIdx] ? ' disabled' : '') + '>' +
        '<span>' + esc(d.choices[origIdx]) + '</span></button>';
    }).join("") + '</div>';
    var footer = st.done
      ? '<div class="var-feedback good"><p><strong>' + esc(st.result === "good" ? t.goodFeedback : t.almostFeedback) + '</strong> ' + esc(d.explanation) + '</p></div>' +
        '<button type="button" class="primary" data-act="fn-next">' + esc(t.next) + '</button>'
      : '<div class="tools"><button type="button" class="tool" data-act="fn-listen">' + esc(t.listen) + '</button>' +
        '<button type="button" class="tool" data-act="fn-hint">' + esc(t.hint) + '</button></div>';

    return bar + stepsBar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: step.lv, name: t.lvNames[step.lv - 1] })) + '</p>' +
      '<article class="fn-card"><div class="fn-meta"><span aria-hidden="true">' + d.icon + '</span><strong>' + esc(d.tag + " · " + d.title) + '</strong></div>' +
      '<p class="fn-passage">' + passageHtml + '</p></article>' +
      '<p class="instr">' + esc(d.question) + '</p>' +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      opts + footer + '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.functional = viewScreen;
  A["func-home"] = startDrill;
  A["fn-home"] = function () { if (api.stopVoice) api.stopVoice(); F = null; api.go("home"); };
  A["fn-back-var"] = function () { if (api.stopVoice) api.stopVoice(); F = null; api.go("variants"); };
  A["fn-stop"] = function () { if (api.stopVoice) api.stopVoice(); if (!F) return; F.done = true; F.stopped = true; saveAndAdapt(); api.render(); };
  A["fn-next"] = function () {
    if (api.stopVoice) api.stopVoice();
    if (!F) return;
    if (F.i + 1 < F.steps.length) {
      F.i++;
      F.st = initStep(F.steps[F.i]);
      api.render();
    } else {
      F.done = true;
      saveAndAdapt();
      api.render();
    }
  };
  A["fn-listen"] = function () {
    var step = curStep();
    if (step && step.data) api.speak(step.data.title + ". " + step.data.passage);
  };
  A["fn-hint"] = function () {
    var step = curStep(), st = F && F.st;
    if (!step || !st || st.done) return;
    st.hints++;
    if (st.hints >= 2) {
      for (var i = 0; i < step.data.choices.length; i++) {
        if (i !== step.data.ans && !st.elim[i]) { st.elim[i] = true; break; }
      }
    }
    api.render();
  };
  A["fn-opt"] = function (b) {
    var step = curStep(), st = F && F.st, t = T();
    if (!step || !st || st.done) return;
    var i = +b.getAttribute("data-i");
    if (i === step.data.ans) {
      var okFirst = st.firstTry && st.hints === 0;
      recordCurrent(okFirst ? "good" : "almost", okFirst ? 1 : 0.5);
      st.nudge = "";
      api.speak(step.data.choices[i]);
      api.render();
    } else {
      st.elim[i] = true;
      st.firstTry = false;
      st.nudge = t.wrong;
      api.render();
    }
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "functional") {
      if (F && !F.done) startDrill();
      else api.render();
    }
  });
  window.addEventListener("pog:profile-change", function () { F = null; });

  window.POG.functional = {
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    highlightPassage: highlightPassage,
    label: function () { return T().title; },
    desc: function () { return T().desc; },
    lvTag: function () { var lv = getLevel(), t = T(); return api.fill(t.lvTag, { n: lv, name: t.lvNames[lv - 1] }); }
  };
})();
