/*
 * Written Expression, Irregular Orthography & Copy-and-Recall Treatment (CART) Module
 * (bilingual IT & EN).
 *
 * Addresses written communication & dysgraphia patterns across PPA subtypes:
 *   - Surface dysgraphia probes (irregular orthography, silent letters, Italian c/q/gli clusters)
 *   - Copy and Recall Treatment (CART): copy model cleanly once -> hide model -> delayed recall
 *   - Practical short written replies (SMS/notes backup channel when spoken speech tires)
 *
 * Level convention matches the main app: 1 = most demanding, 3 = most support.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var BANK = window.POG && window.POG.content && window.POG.content.WRITING;
  if (!api || !BANK) return;
  var esc = api.esc;

  var MAXLV = 3;
  var KEEP = 120;
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5 };

  var C = {
    it: {
      title: "Scrivi per ricordare (CART)",
      desc: "Copia e riscrivi parole utili, ortografia e brevi messaggi quotidiani.",
      lvNames: ["Impegnativo", "Intermedio", "Con più supporto"],
      lvTag: "Livello {n} · {name}",
      stepOf: "Prova {i} di {n}",
      stop: "Termina",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio",
      kinds: { orth: "Ortografia", cart: "Parola utile", phrase: "Messaggio breve" },
      inputLabel: "Scrivi qui la parola o la frase",
      inputPh: "Tocca e scrivi…",
      copyPrompt: "Fase 1 (Copia): osserva il modello e copialo qui sotto per fissarlo.",
      recallPrompt: "Fase 2 (A memoria): ora il modello è nascosto — riscrivilo da solo!",
      checkBtn: "Controlla",
      copyDoneBtn: "Copiato, passo a memoria",
      cartBtn: "✍️ Copia e poi ricorda (CART)",
      hintBtn: "💡 Aiuto",
      tilesBtn: "🔤 Mostra pezzi",
      clearTiles: "Svuota",
      listenBtn: "🔊 Ascolta",
      revealBtn: "Mostra modello",
      nextBtn: "Avanti",
      surfaceHint: "Suona quasi giusto, ma controlla l'ortografia: {c}",
      omissionHint: "Manca qualche lettera o una parola rispetto al modello.",
      subHint: "Non corrisponde ancora: usa l'aiuto, i pezzi o «Copia e poi ricorda».",
      copyWrong: "Copia esattamente il modello lettera per lettera prima di nasconderlo.",
      needText: "Scrivi qualcosa o tocca i pezzi prima di controllare.",
      goodFeedback: "Scritto bene al primo tentativo!",
      cartFeedback: "Ottimo recupero dopo la copia (CART)!",
      modelFeedback: "Ecco il modello: leggerlo e ricopiarlo aiuta la memoria visiva.",
      sumTitle: "Esercizio di scrittura completato",
      sumDone: "Tutte le prove di scrittura sono state salvate.",
      sumStopped: "Ci fermiamo qui. I risultati completati sono stati salvati.",
      colItem: "Parola / Frase", colRes: "Esito", colMode: "Supporto",
      res: { good: "Autonomo", almost: "Con CART / aiuto", model: "Con modello" },
      modes: { none: "Senza aiuti", cart: "CART (copia)", hint: "Indizio", model: "Modello" }
    },
    en: {
      title: "Write to keep (CART)",
      desc: "Copy-and-recall practice for tricky spellings, core words, and short texts.",
      lvNames: ["Demanding", "Standard", "More support"],
      lvTag: "Level {n} · {name}",
      stepOf: "Item {i} of {n}",
      stop: "Stop",
      backVar: "Back to targeted practice",
      backHome: "Back to home",
      kinds: { orth: "Spelling", cart: "Core word", phrase: "Short text" },
      inputLabel: "Type the word or short message",
      inputPh: "Tap and type…",
      copyPrompt: "Step 1 (Copy): look at the model and type it once below.",
      recallPrompt: "Step 2 (Recall): the model is now hidden — type it from memory!",
      checkBtn: "Check",
      copyDoneBtn: "Copied — hide & recall",
      cartBtn: "✍️ Copy & Recall (CART)",
      hintBtn: "💡 Hint",
      tilesBtn: "🔤 Word / letter pieces",
      clearTiles: "Clear",
      listenBtn: "🔊 Listen",
      revealBtn: "Show model",
      nextBtn: "Next",
      surfaceHint: "Sounds right, check the silent or irregular letters: {c}",
      omissionHint: "A letter or word seems missing compared with the target.",
      subHint: "Not quite yet — try a hint, letter pieces, or Copy & Recall.",
      copyWrong: "Copy the exact spelling cleanly before hiding the model.",
      needText: "Type an answer or tap the pieces before checking.",
      goodFeedback: "Spelled accurately on your own!",
      cartFeedback: "Great delayed recall with Copy & Recall (CART)!",
      modelFeedback: "Here is the written model — visual copying builds lasting recall.",
      sumTitle: "Written practice complete",
      sumDone: "All writing items have been saved locally.",
      sumStopped: "Stopping here. Completed writing items have been saved.",
      colItem: "Word / Phrase", colRes: "Outcome", colMode: "Support",
      res: { good: "Uncued", almost: "CART / cue", model: "Model" },
      modes: { none: "Uncued", cart: "CART copy", hint: "Hint", model: "Model" }
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function compact(s) { return norm(s).replace(/\s+/g, ""); }

  function shuffle(a) {
    var out = a.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function consonantSkeleton(s) {
    return compact(s)
      .replace(/ph/g, "f")
      .replace(/gh/g, "")
      .replace(/kn/g, "n")
      .replace(/qu/g, "k")
      .replace(/cq/g, "k")
      .replace(/c([ei])/g, "s$1")
      .replace(/[ckq]+/g, "k")
      .replace(/(.)\1+/g, "$1")
      .replace(/[aeiou]/g, "");
  }

  function classifyWritingAttempt(attempt, item) {
    var aNorm = norm(attempt);
    var tNorm = norm(item && item.target);
    if (!aNorm || !tNorm) return { match: false, errKind: "empty" };
    if (aNorm === tNorm) return { match: true, errKind: null };

    var aComp = compact(attempt), tComp = compact(item.target);
    var skels = (item.phoneticSkeletons || []).map(compact);
    if (skels.indexOf(aComp) >= 0) {
      return { match: false, errKind: "surface_phonetic" };
    }
    var aCons = consonantSkeleton(attempt), tCons = consonantSkeleton(item.target);
    if (aCons && tCons && aCons === tCons && aComp !== tComp) {
      return { match: false, errKind: "surface_phonetic" };
    }
    if (aComp.length < Math.floor(tComp.length * 0.78)) {
      return { match: false, errKind: "omission" };
    }
    return { match: false, errKind: "substitution" };
  }

  function getLevel() {
    var lv = +api.load("writing_level");
    return (lv >= 1 && lv <= MAXLV) ? lv : 2;
  }

  function listSessions() {
    var s = api.load("writing_sessions");
    return Array.isArray(s) ? s : [];
  }

  function buildDrill(lv, langCode) {
    var lc = langCode === "en" ? "en" : "it";
    var pool = BANK[lc] || BANK.it;
    var atLv = shuffle(pool.filter(function (x) { return x.lv === lv; }));
    var other = shuffle(pool.filter(function (x) { return x.lv !== lv; }));
    var combined = atLv.concat(other);
    var picked = [], seenKind = {};
    for (var i = 0; i < combined.length && picked.length < 4; i++) {
      if (!seenKind[combined[i].kind]) {
        picked.push(combined[i]);
        seenKind[combined[i].kind] = 1;
      }
    }
    for (var j = 0; j < combined.length && picked.length < 4; j++) {
      if (picked.indexOf(combined[j]) < 0) picked.push(combined[j]);
    }
    return picked.map(function (it) { return { lv: it.lv, data: it }; });
  }

  function computeWritingProfile(sessions) {
    var out = {
      total: 0, independent: 0, cartAssisted: 0, modelOnly: 0,
      accuracy: null,
      errors: { surface_phonetic: 0, omission: 0, substitution: 0 },
      byKind: { orth: { n: 0, ok: 0 }, cart: { n: 0, ok: 0 }, phrase: { n: 0, ok: 0 } }
    };
    (sessions || []).forEach(function (s) {
      (s && s.items || []).forEach(function (it) {
        if (!it) return;
        out.total++;
        if (it.result === "good") out.independent++;
        else if (it.result === "almost") out.cartAssisted++;
        else out.modelOnly++;
        if (it.errKind && out.errors[it.errKind] != null) out.errors[it.errKind]++;
        var k = it.kind || "cart";
        if (out.byKind[k]) {
          out.byKind[k].n++;
          if (it.result === "good" || it.result === "almost") out.byKind[k].ok++;
        }
      });
    });
    if (out.total) {
      var pts = (sessions || []).reduce(function (sum, s) {
        return sum + (s && s.items || []).reduce(function (a, x) { return a + (+x.score || 0); }, 0);
      }, 0);
      out.accuracy = Math.round((pts / out.total) * 1000) / 1000;
    }
    return out;
  }

  var WR = null;

  function makeStepState(step) {
    var d = step.data;
    var tilePool = (d.tiles || []).map(function (ch, idx) { return { ch: ch, used: false, idx: idx }; });
    return {
      startedAt: Date.now(),
      input: "",
      hints: 0,
      firstTry: true,
      cartPhase: "none", /* "none" | "copy" | "recall" */
      cartUsed: false,
      tilesOpen: step.lv === 3,
      pool: shuffle(tilePool),
      chosenTiles: [],
      lastErrKind: null,
      nudge: "",
      done: false,
      result: null,
      supportMode: "none"
    };
  }

  function startDrill() {
    if (api.stopVoice) api.stopVoice();
    var lv = getLevel();
    var steps = buildDrill(lv, api.lang());
    if (!steps.length) return;
    WR = {
      id: "wr" + Date.now().toString(36),
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
    api.go("writing");
  }

  function curStep() { return WR && WR.steps[WR.i]; }

  function recordCurrent(result, scoreVal, supportMode) {
    if (!WR || !curStep() || !WR.st || WR.st.recorded) return;
    WR.st.recorded = true;
    var step = curStep(), st = WR.st;
    st.done = true;
    st.result = result;
    st.supportMode = supportMode || (st.cartUsed ? "cart" : st.hints > 0 ? "hint" : "none");
    WR.log.push({
      game: "writing",
      lv: step.lv,
      kind: step.data.kind,
      id: step.data.id,
      label: step.data.target,
      result: result,
      support: st.supportMode,
      cartUsed: !!st.cartUsed,
      errKind: st.lastErrKind || null,
      score: scoreVal,
      hints: st.hints,
      ms: Date.now() - st.startedAt
    });
    api.speak(step.data.target);
  }

  function saveAndAdapt() {
    if (!WR || !WR.log.length || WR.saved) return;
    WR.saved = true;
    var mean = WR.log.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / WR.log.length;
    var sess = {
      id: WR.id,
      date: new Date().toISOString(),
      mode: "writing",
      who: WR.who,
      lv: WR.lv,
      accuracy: Math.round(mean * 1000) / 1000,
      items: WR.log.slice()
    };
    var all = listSessions().concat([sess]).slice(-KEEP);
    api.save("writing_sessions", all);

    var curLv = getLevel();
    var avgs = all.map(function (s) {
      var items = s.items || [];
      return items.length ? items.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / items.length : null;
    }).filter(function (v) { return v != null; });

    if (avgs.length >= RULE.downN) {
      var r3 = avgs.slice(-RULE.downN);
      if (r3.reduce(function (a, b) { return a + b; }, 0) / r3.length < RULE.down && curLv < MAXLV) {
        api.save("writing_level", curLv + 1);
        WR.levelChange = { from: curLv, to: curLv + 1 };
        return;
      }
    }
    var vs = api.load("variant_settings") || {};
    if (vs.allowUp !== false && avgs.length >= RULE.upN) {
      var r5 = avgs.slice(-RULE.upN);
      if (r5.reduce(function (a, b) { return a + b; }, 0) / r5.length >= RULE.up && curLv > 1) {
        api.save("writing_level", curLv - 1);
        WR.levelChange = { from: curLv, to: curLv - 1 };
      }
    }
  }

  function syncInput() {
    var el = document.getElementById("wr-input");
    if (el && WR && WR.st) WR.st.input = el.value;
  }

  /* ---------- Views ---------- */
  function viewSummary() {
    var t = T();
    var rows = WR.log.map(function (r) {
      return '<tr><td>' + esc(r.label) + '</td><td><span class="pill ' + esc(r.result) + '">' + esc(t.res[r.result] || r.result) + '</span></td>' +
        '<td>' + esc(t.modes[r.support] || r.support) + '</td></tr>';
    }).join("");
    var ch = WR.levelChange ? '<ul class="changes"><li>' + esc(t.title + ": " + api.t().level + " " + WR.levelChange.from + " → " + WR.levelChange.to) + '</li></ul>' : '';
    return api.header(false) + '<section class="card">' +
      '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(WR.stopped ? t.sumStopped : t.sumDone) + '</p>' +
      (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colItem) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colMode) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + ch + '</div>' : '') +
      '<button type="button" class="primary" data-act="wr-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="link" data-act="wr-home-exit">' + esc(t.backHome) + '</button></section>';
  }

  function viewScreen() {
    if (!WR) { startDrill(); if (!WR) return api.header(false); }
    if (WR.done) return viewSummary();
    var t = T(), step = curStep(), st = WR.st, d = step.data;

    var bar = '<div class="bar"><span class="brand">' + esc(t.title) + ' · ' + esc(api.fill(t.stepOf, { i: WR.i + 1, n: WR.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="wr-stop">' + esc(t.stop) + '</button></div>';
    var stepsBar = '<ol class="steps" aria-label="Progress">' + WR.steps.map(function (_, idx) {
      var cls = idx < WR.i ? "past" : idx === WR.i ? "on" : "";
      return '<li class="' + cls + '">' + esc(String(idx + 1)) + '</li>';
    }).join("") + '</ol>';

    var hintHtml = "";
    if (st.hints >= 1) {
      hintHtml += '<div class="hint"><b>1</b><span>' + esc(d.clue) + '</span></div>';
    }
    if (st.hints >= 2) {
      var firstMask = d.target.split(" ").map(function (w) {
        return w.charAt(0).toUpperCase() + " " + w.slice(1).replace(/./g, "_ ").trim();
      }).join("   ");
      hintHtml += '<div class="hint"><b>2</b><span class="pattern">' + esc(firstMask) + '</span></div>';
    }

    var cartBox = "";
    if (st.cartPhase === "copy") {
      cartBox = '<div class="wr-cartbox"><p class="sub">' + esc(t.copyPrompt) + '</p>' +
        '<p class="wr-model">' + esc(d.target) + '</p></div>';
    } else if (st.cartPhase === "recall") {
      cartBox = '<div class="wr-cartbox"><p class="sub">' + esc(t.recallPrompt) + '</p></div>';
    }

    var tilesHtml = "";
    if (st.tilesOpen && !st.done && st.pool && st.pool.length) {
      tilesHtml = '<div class="var-tiles">' + st.pool.map(function (tl, i) {
        return '<button type="button" class="var-tile' + (tl.used ? ' used' : '') + '" data-act="wr-tile" data-i="' + i + '"' + (tl.used ? ' disabled' : '') + '>' + esc(tl.ch) + '</button>';
      }).join("") + '</div>';
    }

    var body = "";
    if (st.done) {
      var fbMsg = st.result === "good" ? t.goodFeedback : st.result === "almost" ? t.cartFeedback : t.modelFeedback;
      body = '<p class="phrase">' + esc(d.target) + '</p>' +
        '<div class="var-feedback good"><p><strong>' + esc(fbMsg) + '</strong></p></div>' +
        '<div class="tools"><button type="button" class="tool" data-act="wr-listen">' + esc(t.listenBtn) + '</button></div>' +
        '<button type="button" class="primary" data-act="wr-next">' + esc(t.nextBtn) + '</button>';
    } else {
      var mainBtn = st.cartPhase === "copy"
        ? '<button type="button" class="primary" data-act="wr-copy-done">' + esc(t.copyDoneBtn) + '</button>'
        : '<button type="button" class="primary" data-act="wr-check">' + esc(t.checkBtn) + '</button>';
      body = '<div class="field wr-field"><label for="wr-input">' + esc(t.inputLabel) + '</label>' +
        '<input type="text" id="wr-input" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" maxlength="60" placeholder="' + esc(t.inputPh) + '" value="' + esc(st.input) + '"></div>' +
        tilesHtml +
        '<div class="tools">' +
        '<button type="button" class="tool" data-act="wr-listen">' + esc(t.listenBtn) + '</button>' +
        (st.cartPhase === "none" ? '<button type="button" class="tool" data-act="wr-cart">' + esc(t.cartBtn) + '</button>' : '') +
        (!st.tilesOpen && st.pool.length ? '<button type="button" class="tool" data-act="wr-tiles">' + esc(t.tilesBtn) + '</button>' : '') +
        (st.input ? '<button type="button" class="tool" data-act="wr-clear">' + esc(t.clearTiles) + '</button>' : '') +
        '<button type="button" class="tool" data-act="wr-hint">' + esc(t.hintBtn) + '</button>' +
        (st.hints >= 1 || !st.firstTry || st.cartPhase !== "none" ? '<button type="button" class="tool" data-act="wr-reveal">' + esc(t.revealBtn) + '</button>' : '') +
        '</div>' +
        mainBtn;
    }

    return bar + stepsBar + '<section class="card">' +
      '<p class="tag">' + esc((t.kinds[d.kind] || d.kind) + " · " + api.fill(t.lvTag, { n: step.lv, name: t.lvNames[step.lv - 1] })) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + (d.pic || "✍️") + '</div>' +
      '<p class="instr">' + esc(d.prompt) + '</p>' +
      cartBox +
      (hintHtml ? '<div class="hints">' + hintHtml + '</div>' : '') +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      body + '</section>';
  }

  /* ---------- Registration ---------- */
  var ext = window.POG.ext, A = ext.actions;
  ext.screens.writing = viewScreen;

  A["wr-home"] = startDrill;
  A["wr-back-var"] = function () { if (api.stopVoice) api.stopVoice(); WR = null; api.go("variants"); };
  A["wr-home-exit"] = function () { if (api.stopVoice) api.stopVoice(); WR = null; api.go("home"); };
  A["wr-stop"] = function () {
    if (api.stopVoice) api.stopVoice();
    if (!WR) return;
    WR.done = true; WR.stopped = true;
    saveAndAdapt();
    api.render();
  };
  A["wr-next"] = function () {
    if (api.stopVoice) api.stopVoice();
    if (!WR) return;
    if (WR.i + 1 < WR.steps.length) {
      WR.i++;
      WR.st = makeStepState(WR.steps[WR.i]);
      api.render();
    } else {
      WR.done = true;
      saveAndAdapt();
      api.render();
    }
  };
  A["wr-listen"] = function () {
    var step = curStep();
    if (step && step.data) api.speak(step.data.target);
  };
  A["wr-cart"] = function () {
    syncInput();
    if (!WR || !WR.st || WR.st.done) return;
    WR.st.cartPhase = "copy";
    WR.st.cartUsed = true;
    WR.st.nudge = "";
    api.render();
  };
  A["wr-copy-done"] = function () {
    syncInput();
    var step = curStep(), st = WR && WR.st, t = T();
    if (!step || !st || st.done) return;
    var check = classifyWritingAttempt(st.input, step.data);
    if (!check.match) {
      st.nudge = t.copyWrong;
      api.render();
      return;
    }
    st.cartPhase = "recall";
    st.input = "";
    st.chosenTiles = [];
    (st.pool || []).forEach(function (tl) { tl.used = false; });
    st.nudge = "";
    api.render();
  };
  A["wr-tiles"] = function () {
    syncInput();
    if (!WR || !WR.st || WR.st.done) return;
    WR.st.tilesOpen = true;
    api.render();
  };
  A["wr-tile"] = function (b) {
    syncInput();
    var step = curStep(), st = WR && WR.st;
    if (!step || !st || st.done) return;
    var i = +b.getAttribute("data-i"), tl = st.pool[i];
    if (!tl || tl.used) return;
    tl.used = true;
    var sep = step.data.kind === "phrase" && st.input ? " " : "";
    st.input = (st.input + sep + tl.ch).trimStart();
    st.nudge = "";
    api.render();
  };
  A["wr-clear"] = function () {
    if (!WR || !WR.st || WR.st.done) return;
    WR.st.input = "";
    WR.st.nudge = "";
    (WR.st.pool || []).forEach(function (tl) { tl.used = false; });
    api.render();
  };
  A["wr-hint"] = function () {
    syncInput();
    if (!WR || !WR.st || WR.st.done) return;
    WR.st.hints++;
    WR.st.nudge = "";
    api.render();
  };
  A["wr-reveal"] = function () {
    if (!WR || !WR.st || WR.st.done) return;
    WR.st.nudge = "";
    recordCurrent("model", 0, "model");
    api.render();
  };
  A["wr-check"] = function () {
    syncInput();
    var step = curStep(), st = WR && WR.st, t = T();
    if (!step || !st || st.done) return;
    if (!String(st.input || "").trim()) {
      st.nudge = t.needText;
      api.render();
      return;
    }
    var res = classifyWritingAttempt(st.input, step.data);
    if (res.match) {
      var indep = st.firstTry && st.hints === 0 && !st.cartUsed;
      recordCurrent(indep ? "good" : "almost", indep ? 1 : 0.5, st.cartUsed ? "cart" : st.hints > 0 ? "hint" : "none");
      st.nudge = "";
      api.render();
    } else {
      st.firstTry = false;
      st.lastErrKind = res.errKind;
      if (res.errKind === "surface_phonetic") {
        st.nudge = api.fill(t.surfaceHint, { c: step.data.clue });
      } else if (res.errKind === "omission") {
        st.nudge = t.omissionHint;
      } else {
        st.nudge = t.subHint;
      }
      api.render();
    }
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "writing") {
      if (WR && !WR.done) startDrill();
      else api.render();
    }
  });
  window.addEventListener("pog:profile-change", function () { WR = null; });

  window.POG.writing = {
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    classifyWritingAttempt: classifyWritingAttempt,
    computeWritingProfile: computeWritingProfile,
    label: function () { return T().title; },
    desc: function () { return T().desc; },
    lvTag: function () { var lv = getLevel(), t = T(); return api.fill(t.lvTag, { n: lv, name: t.lvNames[lv - 1] }); }
  };
})();
