/*
 * Scaffolded Word-Finding & Category Sprint ("Scatto di parole / Word-finding sprint").
 * Screen: `fluency` (interactive 2-prompt generative naming / fluency sprint & summary).
 *
 * Interactive flow:
 *   - Displays everyday category, initial-letter, or routine situation prompt with a gentle target count.
 *   - Supports typed/pasted words (`#fl-input` + `fl-add` or Enter), carer/self spoken-aloud tallies (`fl-tally`),
 *     and progressive subcategory scaffold reveal (`fl-scaffold`) with clickable starter chips (`fl-chip`).
 *   - Deduplicates repeated entries cleanly (`normalizeWord`) and tracks cluster coverage, scaffold count,
 *     and independent vs assisted retrieval (`computeFluencyProfile`) strictly on device (`fluency_sessions`).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var CONTENT = window.POG && window.POG.content && window.POG.content.FLUENCY;
  if (!api || !CONTENT) return;
  var esc = api.esc;

  var KEEP = 120;
  var MAXLV = 3;
  var RULE = { down: 0.65, downN: 2, up: 0.9, upN: 3 };

  var C = {
    it: {
      btn: "Scatto di parole",
      desc: "Trova più parole possibili per categoria, lettera o situazione con aiuti a tappe.",
      lvTag: "Livello {n}",
      stepOf: "Prova {i} di {n}",
      stop: "Termina",
      listen: "🔊 Ascolta consegna",
      hint: "💡 Strategia",
      scaffoldBtn: "🪜 Apri un suggerimento per gruppo",
      scaffoldAll: "Tutti i gruppi aperti",
      inputPh: "Scrivi una parola…",
      addBtn: "Aggiungi",
      tallyBtn: "+1 Detto a voce",
      spokenLabel: "A voce: {n}",
      targetBadge: "Obiettivo: {cur} / {target} parole",
      goalHit: "Obiettivo raggiunto!",
      dupWord: "«{w}» c'è già: provane un'altra.",
      emptyWord: "Scrivi una parola o usa «+1 Detto a voce».",
      removeAria: "Rimuovi parola",
      next: "Avanti",
      done: "Fatto",
      kinds: { category: "Categoria", letter: "Lettera iniziale", situation: "Situazione" },
      sumTitle: "Scatto di parole completato",
      sumStopped: "Sessione salvata fin qui.",
      sumDone: "Tutte le prove completate.",
      colPrompt: "Tipo / Tema",
      colRes: "Parole trovate",
      resGood: "Autonomo",
      resAlmost: "Con gruppi/aiuti",
      resModel: "Solo ascolto",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio"
    },
    en: {
      btn: "Word-finding sprint",
      desc: "Generate everyday words by category, starting letter, or situation with staged cluster clues.",
      lvTag: "Level {n}",
      stepOf: "Prompt {i} of {n}",
      stop: "Stop",
      listen: "🔊 Hear prompt",
      hint: "💡 Strategy clue",
      scaffoldBtn: "🪜 Show a cluster starter",
      scaffoldAll: "All clusters open",
      inputPh: "Type a word…",
      addBtn: "Add word",
      tallyBtn: "+1 Said aloud",
      spokenLabel: "Said aloud: {n}",
      targetBadge: "Goal: {cur} / {target} words",
      goalHit: "Target reached!",
      dupWord: "“{w}” is already listed — try another word.",
      emptyWord: "Type a word or tap “+1 Said aloud”.",
      removeAria: "Remove word",
      next: "Next",
      done: "Finish",
      kinds: { category: "Category", letter: "First letter", situation: "Situation" },
      sumTitle: "Word-finding sprint complete",
      sumStopped: "Progress saved up to here.",
      sumDone: "All word-finding prompts finished.",
      colPrompt: "Type / Topic",
      colRes: "Words retrieved",
      resGood: "Uncued",
      resAlmost: "With clusters",
      resModel: "Guided",
      backVar: "Back to targeted practice",
      backHome: "Back to home"
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function getLevel() { var lv = +api.load("fluency_level"); return lv >= 1 && lv <= MAXLV ? lv : 2; }
  function listSessions() { var s = api.load("fluency_sessions"); return Array.isArray(s) ? s : []; }

  function normalizeWord(raw) {
    var s = String(raw == null ? "" : raw).trim().toLowerCase();
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return s.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "").replace(/\s+/g, " ");
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
    var picked = [], seenKinds = {};
    for (var i = 0; i < pool.length && picked.length < targetN; i++) {
      if (!seenKinds[pool[i].kind]) {
        picked.push(pool[i]);
        seenKinds[pool[i].kind] = true;
      }
    }
    for (var j = 0; j < pool.length && picked.length < targetN; j++) {
      if (picked.indexOf(pool[j]) < 0) picked.push(pool[j]);
    }
    return picked.map(function (it) { return Object.assign({}, it); });
  }

  function computeFluencyProfile(sessions) {
    var list = Array.isArray(sessions) ? sessions : [];
    var total = 0, sumProduced = 0, targetsHit = 0, uncuedCount = 0;
    var sumClusters = 0, sumScaffolds = 0, repeats = 0, scores = [];
    var byKind = {
      category: { n: 0, produced: 0 },
      letter: { n: 0, produced: 0 },
      situation: { n: 0, produced: 0 }
    };
    list.forEach(function (s) {
      (s.items || []).forEach(function (it) {
        total++;
        var prod = +(it.producedCount != null ? it.producedCount : 0);
        var target = +(it.targetCount || 1);
        sumProduced += prod;
        if (prod >= target) targetsHit++;
        if (it.independent) uncuedCount++;
        sumClusters += +(it.clusterCount || 0);
        sumScaffolds += +(it.scaffoldsUsed || 0);
        repeats += +(it.repeats || 0);
        var k = byKind[it.kind] ? it.kind : "category";
        byKind[k].n++;
        byKind[k].produced += prod;
        if (it.score != null && isFinite(+it.score)) scores.push(+it.score);
      });
    });
    return {
      total: total,
      avgProduced: total ? Math.round((sumProduced / total) * 10) / 10 : null,
      targetHitRate: total ? Math.round((targetsHit / total) * 100) / 100 : null,
      independentRate: total ? Math.round((uncuedCount / total) * 100) / 100 : null,
      meanClusters: total ? Math.round((sumClusters / total) * 10) / 10 : 0,
      meanScaffolds: total ? Math.round((sumScaffolds / total) * 10) / 10 : 0,
      repeats: repeats,
      accuracy: scores.length ? Math.round((scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) * 1000) / 1000 : null,
      byKind: byKind
    };
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
      chipTaps: 0,
      repeats: 0,
      hintShown: false,
      draft: "",
      nudge: ""
    };
  }

  function inferClusterHits(st) {
    var subs = (st.item && st.item.subgroups) || [];
    var hits = 0;
    subs.forEach(function (sg) {
      var match = (sg.words || []).some(function (w) { return !!st.seen[normalizeWord(w)]; });
      if (match) hits++;
    });
    if (hits === 0 && (st.words.length > 0 || st.spokenTally > 0)) return 1;
    return hits;
  }

  function recordStep(st) {
    var item = st.item;
    var produced = st.words.length + st.spokenTally;
    var ratio = Math.min(1, produced / Math.max(1, item.targetCount || 5));
    var assisted = st.scaffolds > 0 || st.hintShown || st.chipTaps > 0;
    var independent = produced > 0 && !assisted;
    var score = produced === 0
      ? 0
      : Math.round(Math.max(0.35, Math.min(1, ratio - st.scaffolds * 0.08 - st.chipTaps * 0.04 - (st.hintShown ? 0.05 : 0))) * 100) / 100;
    var result = produced === 0 ? "model" : (independent && produced >= item.targetCount ? "good" : "almost");
    V.log.push({
      game: "fluency",
      id: item.id,
      kind: item.kind,
      lv: V.lv,
      label: item.title,
      targetCount: item.targetCount,
      producedCount: produced,
      typedCount: st.words.length,
      spokenCount: st.spokenTally,
      clusterCount: inferClusterHits(st),
      scaffoldsUsed: st.scaffolds,
      chipTaps: st.chipTaps,
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
      id: "fl" + Date.now().toString(36),
      lv: lv,
      steps: queue,
      i: 0,
      st: initStep(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("fluency");
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
      api.save("fluency_sessions", all);
      var nextLv = maybeAdaptLevel(V.lv, all);
      if (nextLv !== V.lv) api.save("fluency_level", nextLv);
    }
    api.render();
  }

  function addWordValue(raw, fromChip) {
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
    st.seen[norm] = true;
    st.words.push({ text: text, norm: norm, fromChip: !!fromChip });
    if (fromChip) st.chipTaps++;
    st.draft = "";
    st.nudge = "";
    return true;
  }

  function viewScreen() {
    if (!V) { startDrill(); if (!V) return api.header(false); }
    var t = T();
    if (V.done) {
      var rows = V.log.map(function (r) {
        var label = (t.kinds[r.kind] || r.kind) + " · " + r.label + " (" + r.producedCount + "/" + r.targetCount + ")";
        var badge = r.result === "good" ? t.resGood : (r.result === "model" ? t.resModel : t.resAlmost);
        return '<tr><td>' + esc(label) + '</td>' +
          '<td><span class="pill ' + esc(r.result) + '">' + esc(badge) + '</span></td></tr>';
      }).join("");
      return api.header(false) + '<section class="card">' +
        '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
        '<p class="sub">' + esc(V.stopped ? t.sumStopped : t.sumDone) + '</p>' +
        (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colPrompt) + '</th><th>' + esc(t.colRes) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '') +
        '<button type="button" class="primary" data-act="fl-var-hub">' + esc(t.backVar) + '</button>' +
        '<button type="button" class="link" data-act="fl-back">' + esc(t.backHome) + '</button></section>';
    }

    var st = V.st, item = st.item;
    var curCount = st.words.length + st.spokenTally;
    var targetHit = curCount >= item.targetCount;
    var bar = '<div class="bar"><span class="brand">' + esc(t.btn) + ' · ' + esc(api.fill(t.stepOf, { i: V.i + 1, n: V.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="fl-stop">' + esc(t.stop) + '</button></div>';

    var countBadge = '<div class="fl-meter">' +
      '<span class="var-badge' + (targetHit ? ' ok' : '') + '">' + esc(api.fill(t.targetBadge, { cur: curCount, target: item.targetCount })) + (targetHit ? ' ✓ ' + esc(t.goalHit) : '') + '</span>' +
      (st.spokenTally > 0 ? '<span class="var-badge">' + esc(api.fill(t.spokenLabel, { n: st.spokenTally })) + '</span>' : '') +
      '</div>';

    var wordsList = st.words.length
      ? '<div class="fl-words" aria-live="polite">' + st.words.map(function (w, idx) {
          return '<button type="button" class="fl-wpill" data-act="fl-rem" data-i="' + idx + '" aria-label="' + esc(t.removeAria + ": " + w.text) + '">' + esc(w.text) + ' <span aria-hidden="true">×</span></button>';
        }).join("") + '</div>'
      : '';

    var scaffoldsMax = (item.subgroups || []).length;
    var scaffoldsHtml = st.scaffolds > 0
      ? '<div class="fl-scaffolds">' + item.subgroups.slice(0, st.scaffolds).map(function (sg) {
          return '<div class="fl-cluster"><strong>' + esc(sg.name) + '</strong><div class="fl-chips">' +
            (sg.words || []).map(function (w) {
              var used = !!st.seen[normalizeWord(w)];
              return '<button type="button" class="var-tile fl-chip' + (used ? ' ok' : '') + '" data-act="fl-chip" data-w="' + esc(w) + '"' + (used ? ' disabled' : '') + '>' + esc(w) + '</button>';
            }).join("") + '</div></div>';
        }).join("") + '</div>'
      : '';

    var cueHtml = st.hintShown ? '<div class="hint"><b>1</b><span>' + esc(item.cue) + '</span></div>' : '';

    return bar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: V.lv })) + ' · ' + esc(t.kinds[item.kind] || item.kind) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + item.pic + '</div>' +
      '<h1 class="instr">' + esc(item.prompt) + '</h1>' +
      countBadge +
      '<div class="fl-entry">' +
      '<input id="fl-input" type="text" autocomplete="off" value="' + esc(st.draft) + '" placeholder="' + esc(t.inputPh) + '" aria-label="' + esc(t.inputPh) + '">' +
      '<button type="button" class="secondary" data-act="fl-add">' + esc(t.addBtn) + '</button>' +
      '<button type="button" class="secondary" data-act="fl-tally">' + esc(t.tallyBtn) + '</button>' +
      '</div>' +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      wordsList +
      '<div class="tools">' +
      '<button type="button" class="tool" data-act="fl-say">' + esc(t.listen) + '</button>' +
      '<button type="button" class="tool" data-act="fl-hint"' + (st.hintShown ? ' disabled' : '') + '>' + esc(t.hint) + '</button>' +
      '<button type="button" class="tool" data-act="fl-scaffold"' + (st.scaffolds >= scaffoldsMax ? ' disabled' : '') + '>' + esc(st.scaffolds >= scaffoldsMax ? t.scaffoldAll : t.scaffoldBtn) + '</button>' +
      '</div>' +
      cueHtml +
      scaffoldsHtml +
      '<button type="button" class="primary" data-act="fl-next">' + esc(V.i + 1 < V.steps.length ? t.next : t.done) + '</button>' +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.fluency = viewScreen;

  A["flu-home"] = function () { startDrill(); };
  A["fl-stop"] = function () {
    if (V && V.st) {
      var curCount = V.st.words.length + V.st.spokenTally;
      if (curCount > 0) recordStep(V.st);
    }
    finishSession(true);
  };
  A["fl-back"] = function () { stopVoice(); V = null; api.go("home"); };
  A["fl-var-hub"] = function () { stopVoice(); V = null; api.go("variants"); };
  A["fl-say"] = function () { if (V && V.st && V.st.item) api.speak(V.st.item.prompt); };
  A["fl-hint"] = function () { if (!V || !V.st || V.done) return; V.st.hintShown = true; api.render(); };

  A["fl-scaffold"] = function () {
    if (!V || !V.st || V.done) return;
    var max = (V.st.item.subgroups || []).length;
    if (V.st.scaffolds < max) V.st.scaffolds++;
    api.render();
  };

  A["fl-add"] = function () {
    if (!V || !V.st || V.done) return;
    var el = typeof document !== "undefined" ? document.getElementById("fl-input") : null;
    var val = el ? el.value : V.st.draft;
    addWordValue(val, false);
    api.render();
    var nextEl = typeof document !== "undefined" ? document.getElementById("fl-input") : null;
    if (nextEl) { nextEl.value = V.st.draft; try { nextEl.focus(); } catch (e) {} }
  };

  A["fl-chip"] = function (b) {
    if (!V || !V.st || V.done) return;
    var w = b.getAttribute("data-w");
    if (addWordValue(w, true)) api.speak(w);
    api.render();
  };

  A["fl-tally"] = function () {
    if (!V || !V.st || V.done) return;
    V.st.spokenTally++;
    V.st.nudge = "";
    api.render();
  };

  A["fl-rem"] = function (b) {
    if (!V || !V.st || V.done) return;
    var idx = +b.getAttribute("data-i");
    var removed = V.st.words.splice(idx, 1)[0];
    if (removed) delete V.st.seen[removed.norm];
    V.st.nudge = "";
    api.render();
  };

  A["fl-next"] = function () {
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
      if (api.screen() === "fluency" && V && V.st && e.target && e.target.id === "fl-input") {
        V.st.draft = e.target.value;
      }
    });
    document.addEventListener("keydown", function (e) {
      if (api.screen() === "fluency" && V && V.st && !V.done && e.target && e.target.id === "fl-input" && e.key === "Enter") {
        e.preventDefault();
        A["fl-add"]();
      }
    });
  }

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "fluency" && V && !V.done) startDrill();
  });
  window.addEventListener("pog:profile-change", function () { V = null; });

  window.POG.fluency = {
    label: function () { return T().btn; },
    desc: function () { return T().desc; },
    level: getLevel,
    lvTag: function () { return api.fill(T().lvTag, { n: getLevel() }); },
    listSessions: listSessions,
    buildDrill: buildDrill,
    normalizeWord: normalizeWord,
    computeFluencyProfile: computeFluencyProfile
  };
})();
