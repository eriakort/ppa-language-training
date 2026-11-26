/*
 * Places & items — optional generative listing exercise.
 * Screen: `places`
 *
 * Given a location, list things typically found there.
 * Soft goal (more is better). Accepts canonical + aliases / synonyms.
 * Adaptive levels (higher number = easier). Typed input or spoken tally.
 * Registers as an optional extra via window.POG.ext where possible.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.PLACES;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Luoghi e oggetti",
      desc: "Nomina le cose che si trovano in un luogo (cucina, bagno, giardino…).",
      lvTag: "Livello {n}",
      stepOf: "Prova {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta consegna",
      hint: "💡 Suggerimento",
      hintText: "Pensa alle cose tipiche: mobili, utensili, oggetti di uso quotidiano.",
      inputPh: "Scrivi un oggetto…",
      addBtn: "Aggiungi",
      tallyBtn: "+1 Detto a voce",
      spokenLabel: "A voce: {n}",
      targetBadge: "Obiettivo: {cur} / {target}",
      goalHit: "Obiettivo raggiunto!",
      dupWord: "«{w}» c'è già.",
      emptyWord: "Scrivi una parola o usa «+1 Detto a voce».",
      notMatch: "Non riconosciuto — prova un altro oggetto tipico.",
      removeAria: "Rimuovi",
      next: "Avanti",
      done: "Fatto",
      sumTitle: "Luoghi e oggetti completato",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le prove completate.",
      colPrompt: "Luogo",
      colRes: "Oggetti trovati",
      resGood: "Buono",
      resAlmost: "Parziale",
      resModel: "Solo ascolto",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Places & items",
      desc: "Name things found in a place (kitchen, bathroom, garden…).",
      lvTag: "Level {n}",
      stepOf: "Prompt {i} of {n}",
      stop: "Stop",
      listen: "🔊 Hear prompt",
      hint: "💡 Hint",
      hintText: "Think of typical things: furniture, tools, everyday objects.",
      inputPh: "Type an item…",
      addBtn: "Add",
      tallyBtn: "+1 Said aloud",
      spokenLabel: "Said aloud: {n}",
      targetBadge: "Goal: {cur} / {target}",
      goalHit: "Target reached!",
      dupWord: "“{w}” is already listed.",
      emptyWord: "Type a word or tap “+1 Said aloud”.",
      notMatch: "Not recognised — try another typical item.",
      removeAria: "Remove",
      next: "Next",
      done: "Finish",
      sumTitle: "Places & items complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All prompts finished.",
      colPrompt: "Place",
      colRes: "Items found",
      resGood: "Good",
      resAlmost: "Partial",
      resModel: "Guided",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("places_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("places_sessions"); return Array.isArray(s) ? s : []; }

  function normalizeWord(raw) {
    var s = String(raw == null ? "" : raw).trim().toLowerCase();
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return s.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "").replace(/\s+/g, " ");
  }

  function matchesItem(norm, item) {
    if (normalizeWord(item.canonical) === norm) return true;
    return (item.aliases || []).some(function (a) { return normalizeWord(a) === norm; });
  }

  function findMatch(norm, items) {
    for (var i = 0; i < items.length; i++) {
      if (matchesItem(norm, items[i])) return items[i];
    }
    return null;
  }

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
    var targetN = count || 2;
    var same = shuffle(bank.filter(function (x) { return x.lv === lv; }));
    var near = shuffle(bank.filter(function (x) { return x.lv !== lv; })).sort(function (a, b) {
      return Math.abs(a.lv - lv) - Math.abs(b.lv - lv);
    });
    var pool = same.concat(near);
    var picked = [];
    for (var i = 0; i < pool.length && picked.length < targetN; i++) {
      if (picked.indexOf(pool[i]) < 0) picked.push(pool[i]);
    }
    return picked.map(function (it) { return Object.assign({}, it); });
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
      words: [],
      seen: {},
      spokenTally: 0,
      scaffolds: 0,
      repeats: 0,
      hintShown: false,
      draft: "",
      nudge: ""
    };
  }

  function recordStep(st) {
    var item = st.item;
    var produced = st.words.length + st.spokenTally;
    var ratio = Math.min(1, produced / Math.max(1, item.softGoal || 5));
    var assisted = st.scaffolds > 0 || st.hintShown;
    var independent = produced > 0 && !assisted;
    var score = produced === 0
      ? 0
      : Math.round(Math.max(0.35, Math.min(1, ratio - st.scaffolds * 0.08 - (st.hintShown ? 0.05 : 0))) * 100) / 100;
    var result = produced === 0 ? "model" : (independent && produced >= item.softGoal ? "good" : "almost");
    V.log.push({
      game: "places",
      id: item.id,
      lv: V.lv,
      label: item.place,
      softGoal: item.softGoal,
      producedCount: produced,
      typedCount: st.words.length,
      spokenCount: st.spokenTally,
      scaffoldsUsed: st.scaffolds,
      repeats: st.repeats,
      hintUsed: st.hintShown,
      independent: independent,
      result: result,
      score: score,
      ms: Date.now() - st.startedAt
    });
  }

  function startDrill() {
    stopVoice();
    var lv = getLevel();
    var queue = buildDrill(api.lang(), lv, 2);
    if (!queue.length) return;
    V = {
      id: "pl" + Date.now().toString(36),
      lv: lv,
      steps: queue,
      i: 0,
      st: initStep(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("places");
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
      api.save("places_sessions", all);
      var nextLv = maybeAdaptLevel(V.lv, all);
      if (nextLv !== V.lv) api.save("places_level", nextLv);
    }
    api.render();
  }

  function addWordValue(raw) {
    if (!V || !V.st || V.done) return false;
    var st = V.st, t = T();
    var text = String(raw == null ? "" : raw).trim();
    var norm = normalizeWord(text);
    if (!norm) {
      st.nudge = t.emptyWord;
      return false;
    }
    if (st.seen[norm]) {
      st.repeats++;
      st.nudge = api.fill(t.dupWord, { w: text });
      st.draft = "";
      return false;
    }
    var matched = findMatch(norm, st.item.items || []);
    if (!matched) {
      st.nudge = t.notMatch;
      st.draft = "";
      return false;
    }
    st.seen[norm] = true;
    st.words.push({ text: text, norm: norm, canonical: matched.canonical });
    st.draft = "";
    st.nudge = "";
    return true;
  }

  function viewScreen() {
    if (!V) { startDrill(); if (!V) return api.header(false); }
    var t = T();
    if (V.done) {
      var rows = V.log.map(function (r) {
        var label = r.label + " (" + r.producedCount + "/" + r.softGoal + ")";
        var badge = r.result === "good" ? t.resGood : (r.result === "model" ? t.resModel : t.resAlmost);
        return '<tr><td>' + esc(label) + '</td>' +
          '<td><span class="pill ' + esc(r.result) + '">' + esc(badge) + '</span></td></tr>';
      }).join("");
      return api.header(false) + '<section class="card">' +
        '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
        '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p>' +
        (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colPrompt) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '') +
        '<button type="button" class="primary" data-act="pl-back">' + esc(t.backHome) + '</button></section>';
    }

    var st = V.st, item = st.item;
    var curCount = st.words.length + st.spokenTally;
    var targetHit = curCount >= item.softGoal;
    var bar = '<div class="bar"><span class="brand">' + esc(t.btn) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="pl-stop">' + esc(t.stop) + '</button></div>';

    var countBadge = '<div class="fl-meter">' +
      '<span class="var-badge' + (targetHit ? ' ok' : '') + '">' + esc(api.fill(t.targetBadge, { cur: curCount, target: item.softGoal })) + (targetHit ? ' ✓ ' + esc(t.goalHit) : '') + '</span>' +
      (st.spokenTally > 0 ? '<span class="var-badge">' + esc(api.fill(t.spokenLabel, { n: st.spokenTally })) + '</span>' : '') +
      '</div>';

    var wordsList = st.words.length
      ? '<div class="fl-words" aria-live="polite">' + st.words.map(function (w, idx) {
          return '<button type="button" class="fl-wpill" data-act="pl-rem" data-i="' + idx + '" aria-label="' + esc(t.removeAria + ": " + w.text) + '">' + esc(w.text) + ' <span aria-hidden="true">×</span></button>';
        }).join("") + '</div>'
      : '';

    var cueHtml = st.hintShown ? '<div class="hint"><b>1</b><span>' + esc(t.hintText) + '</span></div>' : '';

    return bar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: V.lv })) + ' · ' + esc(item.place) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + item.pic + '</div>' +
      '<h1 class="instr">' + esc(item.prompt) + '</h1>' +
      countBadge +
      '<div class="fl-entry">' +
      '<input id="pl-input" type="text" autocomplete="off" value="' + esc(st.draft) + '" placeholder="' + esc(t.inputPh) + '" aria-label="' + esc(t.inputPh) + '">' +
      '<button type="button" class="secondary" data-act="pl-add">' + esc(t.addBtn) + '</button>' +
      '<button type="button" class="secondary" data-act="pl-tally">' + esc(t.tallyBtn) + '</button>' +
      '</div>' +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      wordsList +
      '<div class="tools">' +
      '<button type="button" class="tool" data-act="pl-say">' + esc(t.listen) + '</button>' +
      '<button type="button" class="tool" data-act="pl-hint"' + (st.hintShown ? ' disabled' : '') + '>' + esc(t.hint) + '</button>' +
      '</div>' +
      cueHtml +
      '<button type="button" class="primary" data-act="pl-next">' + esc(V.i + 1 < V.steps.length ? t.next : t.done) + '</button>' +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.places = viewScreen;

  A["places-home"] = function () { startDrill(); };
  A["pl-stop"] = function () {
    if (V && V.st) {
      var curCount = V.st.words.length + V.st.spokenTally;
      if (curCount > 0) recordStep(V.st);
    }
    finishSession(true);
  };
  A["pl-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["pl-say"] = function () { if (V && V.st && V.st.item) api.speak(V.st.item.prompt); };
  A["pl-hint"] = function () { if (!V || !V.st || V.done) return; V.st.hintShown = true; api.render(); };

  A["pl-add"] = function () {
    if (!V || !V.st || V.done) return;
    var el = typeof document !== "undefined" ? document.getElementById("pl-input") : null;
    var val = el ? el.value : V.st.draft;
    addWordValue(val);
    api.render();
    var nextEl = typeof document !== "undefined" ? document.getElementById("pl-input") : null;
    if (nextEl) { nextEl.value = V.st.draft; try { nextEl.focus(); } catch (e) {} }
  };

  A["pl-tally"] = function () {
    if (!V || !V.st || V.done) return;
    V.st.spokenTally++;
    V.st.nudge = "";
    api.render();
  };

  A["pl-rem"] = function (b) {
    if (!V || !V.st || V.done) return;
    var idx = +b.getAttribute("data-i");
    var removed = V.st.words.splice(idx, 1)[0];
    if (removed) delete V.st.seen[removed.norm];
    V.st.nudge = "";
    api.render();
  };

  A["pl-next"] = function () {
    stopVoice();
    if (!V || V.done) return;
    recordStep(V.st);
    if (V.i + 1 < V.steps.length) {
      V.i++;
      V.st = initStep(V.steps[V.i]);
      api.render();
    } else {
      finishSession(false);
    }
  };

  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("input", function (e) {
      if (api.screen() === "places" && V && V.st && e.target && e.target.id === "pl-input") {
        V.st.draft = e.target.value;
      }
    });
    document.addEventListener("keydown", function (e) {
      if (api.screen() === "places" && V && V.st && !V.done && e.target && e.target.id === "pl-input" && e.key === "Enter") {
        e.preventDefault();
        A["pl-add"]();
      }
    });
  }

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "places" && V && !V.done) startDrill();
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.places = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    level: getLevel,
    start: startDrill,
    listSessions: listSessions
  };
})();
