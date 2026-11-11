(function () {
  "use strict";
  var app = document.getElementById("app");

  function save(k, v) { try { localStorage.setItem("pog_" + k, JSON.stringify(v)); } catch (e) {} }
  function load(k) { try { var v = localStorage.getItem("pog_" + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  /* Language games, hardest first. The maze is optional and sits outside language scoring. */
  var GAMES = ["describe", "crossword", "name", "wordbuild", "script", "echo", "seq"];
  var MAXLV = { describe: 3, crossword: 4, name: 4, wordbuild: 4, script: 3, echo: 3, seq: 3 };
  var PLACE_N = { describe: 1, crossword: 2, name: 2, wordbuild: 2, script: 2, echo: 2, seq: 1 };
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5, flag: 0.4, place: 0.6 };

  var T = window.POG.strings, C = window.POG.content;
  var DESCRIBE = C.DESCRIBE, NAMING = C.NAMING, CROSS = C.CROSS, ECHO = C.ECHO, SEQ = C.SEQ, DEFAULT_SCRIPTS = C.DEFAULT_SCRIPTS;
  var PACKS = C.PACKS, PACK_KEYS = C.PACK_KEYS;
  var ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var ALL_NAMES = NAMING.concat.apply(NAMING, PACK_KEYS.map(function (k) { return PACKS[k].name; }));

  /* Builds a 3-word crossword: word 1 across, word 2 down through it, word 3 across through word 2
     at least two rows away, so no letters touch except at the crossings. */
  function genCross(list, seed, icon) {
    var res = [], n = list.length;
    for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) for (var c = 0; c < n; c++) {
      if (a === b || b === c || a === c) continue;
      var w1 = list[a][0], w2 = list[b][0], w3 = list[c][0];
      for (var i = 0; i < w1.length; i++) for (var j = 0; j < w2.length; j++) {
        if (w1[i] !== w2[j]) continue;
        for (var k = 0; k < w2.length; k++) {
          if (Math.abs(k - j) < 2) continue;
          for (var m = 0; m < w3.length; m++) {
            if (w3[m] !== w2[k]) continue;
            var ws = [
              { w: w1, r: 0, c: 0, d: "a", clue: list[a][1] },
              { w: w2, r: -j, c: i, d: "d", clue: list[b][1] },
              { w: w3, r: k - j, c: i - m, d: "a", clue: list[c][1] }
            ];
            var minR = Math.min(0, -j, k - j), minC = Math.min(0, i - m);
            var maxR = Math.max(0, w2.length - 1 - j, k - j), maxC = Math.max(w1.length - 1, i, i - m + w3.length - 1);
            if (maxC - minC + 1 > 9 || maxR - minR + 1 > 8) continue;
            ws.forEach(function (x) { x.r -= minR; x.c -= minC; x.pic = icon; });
            res.push(ws);
          }
        }
      }
    }
    if (!res.length) return null;
    var p = res[Math.abs(seed * 7919) % res.length];
    return p.slice().sort(function (x, y) { return x.r - y.r || x.c - y.c; });
  }

  var lang = load("lang") === "en" ? "en" : "it";
  var screen = "home";
  var S = null, flash = "", confirmAsk = "", busy = false, pending = "start";

  function getSettings() {
    var s = load("settings") || {};
    var lv = s.levels || {};
    GAMES.forEach(function (g) { var n = +lv[g]; lv[g] = (n >= 1 && n <= MAXLV[g]) ? n : 1; });
    var size = [4, 6, 8].indexOf(+s.mazeSize) >= 0 ? +s.mazeSize : 4;
    return { levels: lv, auto: s.auto !== false, allowUp: s.allowUp !== false, maze: s.maze === true, mazeSize: size };
  }
  function getHistory() { var h = load("history"); return (h && typeof h === "object") ? h : {}; }
  function getProfile() { var p = load("profile"); return (p && p.name) ? p : null; }
  function getPlacement() { var p = load("placement"); return (p && p.status) ? p : { status: "none", levels: {}, flags: [] }; }

  /* ---------- voice ---------- */
  var tts = ("speechSynthesis" in window) && typeof window.SpeechSynthesisUtterance !== "undefined";
  if (tts) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = function () {}; } catch (e) { tts = false; } }
  function pickVoice() {
    try {
      var pre = lang === "it" ? "it" : "en", vs = speechSynthesis.getVoices() || [];
      for (var i = 0; i < vs.length; i++) { if (vs[i].lang && vs[i].lang.toLowerCase().indexOf(pre) === 0) return vs[i]; }
    } catch (e) {}
    return null;
  }
  function speak(text, onend) {
    if (!tts) { if (onend) setTimeout(onend, 900); return; }
    var fired = false;
    function fin() { if (!fired) { fired = true; if (onend) onend(); } }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "it" ? "it-IT" : "en-GB";
      var v = pickVoice(); if (v) u.voice = v;
      u.rate = 0.8; u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
      setTimeout(fin, 1500 + text.length * 140);
    } catch (e) { fin(); }
  }
  function stopVoice() { if (tts) { try { speechSynthesis.cancel(); } catch (e) {} } }
  var ICON_SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
  var ICON_MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15zm6-3.5a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.9V22h2v-2.6a8 8 0 0 0 7-7.9h-2z"/></svg>';

  /* ---------- dictation (solo mode) ----------
     The platform turns speech into text; the page never gets audio. null on Safari/iPad, Firefox and mobile apps. */
  var D = null, micDenied = false, langRetry = false;
  var L = { on: false, state: "idle", text: "", partial: "", step: null, timer: null };
  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("dictation").then(function (d) {
      if (!d) return;
      D = d;
      d.onPartial(function (e) { if (!L.on) return; L.partial = e.text; updateHeard(); armSilence(); });
      d.onFinal(function (e) {
        if (!L.on) return;
        L.text = L.text ? L.text + e.text : e.text.replace(/^\s+/, "");
        L.partial = ""; updateHeard(); armSilence(); liveCheck();
      });
      d.onState(function (e) {
        L.state = e.state;
        if (e.state !== "idle") { if (L.on) render(); return; }
        var was = L.on; L.on = false; clearTimeout(L.timer);
        if (!was) return;
        if (e.reason === "stopped" || e.reason === "viewer_stopped" || e.reason === "time_limit") { evaluateSpoken(); return; }
        if (e.reason === "not_granted") { micDenied = true; if (S) S.nudge = T[lang].micDenied; }
        else if (e.reason === "unavailable") { if (!langRetry) { langRetry = true; if (S) S.nudge = T[lang].tapAgain; } else { micDenied = true; if (S) S.nudge = T[lang].micDenied; } }
        else if (e.reason === "dismissed") { if (S) S.nudge = T[lang].micDismissed; }
        else if (e.reason !== "hidden") { if (S) S.nudge = T[lang].micBusy; }
        if (screen === "item") render();
      });
      if (screen === "mode" || screen === "item") render();
    }, function () {});
  }
  function micReady() { return !!D && !micDenied; }
  function micStart() {
    if (!micReady()) return;
    stopVoice();
    L.on = true; L.text = ""; L.partial = ""; L.step = cur(); L.state = "starting";
    S.nudge = "";
    var p;
    try { p = langRetry ? D.start() : D.start({ language: lang }); } catch (err) { p = Promise.reject({ code: "upstream_error" }); }
    p.catch(function (err) {
      var code = err && err.code, t = T[lang];
      L.on = false; clearTimeout(L.timer);
      if (code === "not_granted") { micDenied = true; S.nudge = t.micDenied; }
      else if (code === "dismissed") S.nudge = t.micDismissed;
      else if (code === "unavailable") { if (!langRetry) { langRetry = true; S.nudge = t.tapAgain; } else { micDenied = true; S.nudge = t.micDenied; } }
      else if (code === "stopped") return;
      else S.nudge = t.micBusy;
      if (screen === "item") render();
    });
    render();
  }
  function micStop() { if (D && L.on) { try { D.stop().catch(function () {}); } catch (e) {} } }
  function micCancel() { if (D && L.on) { L.on = false; clearTimeout(L.timer); try { D.stop().catch(function () {}); } catch (e) {} } }
  function armSilence() {
    clearTimeout(L.timer);
    var st = L.step, ms = st && st.game === "describe" ? 20000 : 10000;
    L.timer = setTimeout(function () { if (L.on) micStop(); }, ms);
  }
  function updateHeard() {
    var el = document.getElementById("heard"); if (!el) return;
    el.innerHTML = '<span class="lbl">' + esc(T[lang].heardLabel) + '</span>' + esc(L.text) + (L.partial ? ' <em>' + esc(L.partial) + '</em>' : '');
  }
  function liveCheck() {
    var st = L.step;
    if (!st || !S || cur() !== st || st.game === "describe") return;
    if (judge(st, L.text) === "good") micStop();
  }
  function evaluateSpoken() {
    var st = L.step;
    if (!S || screen !== "item" || cur() !== st) return;
    var text = (L.text + (L.partial ? " " + L.partial : "")).trim();
    L.partial = "";
    if (!text) { S.nudge = T[lang].heardNothing; render(); return; }
    S.heard.push(text);
    var v = judge(st, text);
    if (v === "good" || v === "almost") { record(v); return; }
    rateAction("retry");
    if (S && cur() === st) { S.nudge = T[lang].tryHelp; render(); }
  }

  /* ---------- answer checking ---------- */
  var DIGITS = { it: ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci"], en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"] };
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function toks(s) {
    return norm(s).split(" ").filter(Boolean).map(function (w) { return /^\d+$/.test(w) && +w <= 10 ? DIGITS[lang][+w] : w; });
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  /* Lenient on purpose: speech-to-text often mishears slow or effortful speech, so near spellings count. */
  function hit(word, heard) {
    for (var i = 0; i < heard.length; i++) {
      var h = heard[i];
      if (h === word) return true;
      if (word.length >= 4 && lev(word, h) <= (word.length >= 7 ? 2 : 1)) return true;
    }
    return false;
  }
  function coverage(target, heard, minLen) {
    var tw = target.filter(function (w) { return w.length >= (minLen || 2); });
    if (!tw.length) tw = target;
    var n = tw.filter(function (w) { return hit(w, heard); }).length;
    return tw.length ? n / tw.length : 0;
  }
  function grade(c, good, almost) { return c >= good ? "good" : c >= almost ? "almost" : "retry"; }
  function judge(st, text) {
    var heard = toks(text);
    if (!heard.length) return "none";
    if (st.game === "name") return coverage(toks(st.data[lang][0]), heard) >= 1 ? "good" : "retry";
    if (st.game === "seq") return grade(coverage(toks(st.data.items.join(" ")), heard, 1), 0.8, 0.5);
    if (st.game === "echo") return grade(coverage(toks(st.data), heard), 0.8, 0.5);
    if (st.game === "script") return st.lv === 1 && S.support === 0
      ? grade(coverage(toks(st.data.phrase), heard, 4), 0.6, 0.3)
      : grade(coverage(toks(st.data.phrase), heard), 0.8, 0.5);
    if (st.game === "describe") {
      /* Open answers can't be checked for correctness: this only measures how much was said. */
      var kw = coverage(toks(st.data[lang][3].join(" ")), heard) > 0 ? 3 : 0;
      var n = heard.length + kw;
      return n >= 12 ? "good" : n >= 5 ? "almost" : "retry";
    }
    return "retry";
  }

  /* ---------- content for steps ---------- */
  function getScripts() {
    var s = load("scripts_" + lang);
    var lines = (Array.isArray(s) && s.length) ? s : DEFAULT_SCRIPTS[lang];
    return lines.map(function (l) {
      var i = l.indexOf("|");
      return i >= 0 ? { cue: l.slice(0, i).trim(), phrase: l.slice(i + 1).trim() } : { cue: "", phrase: l.trim() };
    }).filter(function (x) { return x.phrase; });
  }
  /* ---------- interest-based content ---------- */
  function myPacks() { var p = getProfile(); return ((p && p.interests) || []).filter(function (k) { return PACKS[k]; }); }
  function fmtTitle(x) {
    if (typeof x === "string") return x;
    var p = getProfile() || {};
    if (x.c && p.city) return x.c.replace("{city}", p.city);
    if (x.t && p.team) return x.t.replace("{team}", p.team);
    return x.n;
  }
  function otherTopic() {
    var p = getProfile(); if (!p || !p.other) return null;
    return { pic: "💬",
      it: ["Parlami di: " + p.other, "Cosa ti piace di questo interesse?", ["Da quanto tempo ti interessa?", "Con chi lo condividi?", "Cosa ti piace di più?"], ["piace", "tempo", "insieme", "ricordo"]],
      en: ["Tell me about: " + p.other, "What do you like about this interest?", ["How long have you liked it?", "Who do you share it with?", "What do you like most?"], ["like", "time", "together", "remember"]] };
  }
  function describePool() {
    var list = [];
    myPacks().forEach(function (k) { list = list.concat(PACKS[k].describe); });
    var o = otherTopic(); if (o) list.push(o);
    return list.length ? list : DESCRIBE;
  }
  function interestNames() { var list = []; myPacks().forEach(function (k) { list = list.concat(PACKS[k].name); }); return list; }
  /* Mostly the person's interests, plus one everyday object so the vocabulary stays broad. */
  function pickNames(n, off) {
    var I = interestNames(), out = [], i;
    if (!I.length) { for (i = 0; i < n; i++) out.push(NAMING[(off + i) % NAMING.length]); return out; }
    var fromI = Math.min(n - 1, I.length);
    for (i = 0; i < fromI; i++) out.push(I[(off + i) % I.length]);
    for (i = 0; out.length < n; i++) out.push(NAMING[(off + i) % NAMING.length]);
    return out;
  }
  function pickBuild(n, off) {
    var ok = function (x) { var w = x[lang][0]; return w.length <= 8 && !/\s/.test(w); };
    var I = interestNames().filter(ok), G = NAMING.filter(ok), out = [], i;
    var fromI = I.length ? Math.min(n - 1, I.length) : 0;
    for (i = 0; i < fromI; i++) out.push(I[(off + 2 + i) % I.length]);
    for (i = 0; out.length < n; i++) out.push(G[(off + 5 + i) % G.length]);
    return out;
  }
  function pickCross(off) {
    var ks = myPacks();
    if (ks.length) {
      var k = ks[off % ks.length], gen = genCross(PACKS[k].cw[lang], off, PACKS[k].icon);
      if (gen) return gen;
    }
    return CROSS[lang][off % CROSS[lang].length];
  }
  function pickEcho(lv, n, off) {
    var ks = myPacks();
    var src = ks.length ? PACKS[ks[off % ks.length]].echo[lang] : ECHO[lang];
    return src[lv - 1].slice(0, n);
  }

  function makeSteps(g, lv, n, off) {
    var out = [], i;
    if (g === "describe") { var dp = describePool(); for (i = 0; i < n; i++) out.push({ game: g, lv: lv, data: dp[(off + i) % dp.length] }); }
    if (g === "crossword") {
      var pz = { p: pickCross(off), letters: {} };
      for (i = 0; i < Math.min(n, pz.p.length); i++) out.push({ game: g, lv: lv, data: { pz: pz, wi: i } });
    }
    if (g === "name") pickNames(n, off).forEach(function (x) { out.push({ game: g, lv: lv, data: x }); });
    if (g === "wordbuild") pickBuild(n, off).forEach(function (x) { out.push({ game: g, lv: lv, data: x }); });
    if (g === "script") {
      var sc = getScripts();
      for (i = 0; i < Math.min(n, sc.length); i++) { var p = sc[(off + i) % sc.length]; out.push({ game: g, lv: (lv === 1 && !p.cue) ? 2 : lv, data: p }); }
    }
    if (g === "echo") pickEcho(lv, n, off).forEach(function (p) { out.push({ game: g, lv: lv, data: p }); });
    if (g === "seq") {
      var sq = SEQ[lang][off % SEQ[lang].length];
      if (lv === 3) sq = { label: sq.label, items: sq.items.slice(0, 5), show: sq.show ? sq.show.slice(0, 5) : null };
      out.push({ game: g, lv: lv, data: sq });
    }
    return out;
  }
  function todayPlan() {
    var day = Math.floor(Date.now() / 86400000), set = getSettings();
    var letters = day % 2 ? "wordbuild" : "crossword";
    var list = ["describe", letters, "name", "script", "echo"];
    if (set.maze) list.push("maze");
    list.push("seq");
    return { day: day, list: list, set: set };
  }
  function buildSession(who) {
    var tp = todayPlan(), L = tp.set.levels, d = tp.day, steps = [];
    tp.list.forEach(function (g) {
      if (g === "maze") { steps.push({ game: "maze", lv: null, data: { n: tp.set.mazeSize } }); return; }
      var n = { describe: 1, crossword: 3, wordbuild: 3, name: 4, script: 2, echo: 3, seq: 1 }[g];
      steps = steps.concat(makeSteps(g, L[g], n, d));
    });
    return { mode: "session", who: who, steps: steps, i: -1, log: [], stopped: false, started: new Date(), levels: L, games: tp.list };
  }
  function buildPlacement(who) {
    var pl = getPlacement();
    if (pl.status !== "in_progress") { pl = { status: "in_progress", levels: {}, flags: [] }; save("placement", pl); }
    var queue = GAMES.filter(function (g) { return !pl.levels[g]; });
    S = { mode: "place", who: who, steps: [], i: -1, log: [], stopped: false, started: new Date(), queue: queue, pg: null, plv: 1, blockLog: 0, off: Math.floor(Math.random() * 8), games: GAMES.slice(), results: [] };
    return placeNextBlock();
  }
  /* Adds the next block of placement items; returns false when every game has a level. */
  function placeNextBlock() {
    if (!S.pg) { S.pg = S.queue.shift() || null; S.plv = 1; }
    if (!S.pg) return false;
    S.blockLog = S.log.length;
    S.steps = S.steps.concat(makeSteps(S.pg, S.plv, PLACE_N[S.pg], S.off++));
    return true;
  }
  function placeEvaluate() {
    var rows = S.log.slice(S.blockLog);
    var avg = rows.length ? rows.reduce(function (a, r) { return a + r.score; }, 0) / rows.length : 0;
    if (avg >= RULE.place || S.plv >= MAXLV[S.pg]) {
      var pl = getPlacement(), set = getSettings();
      pl.levels[S.pg] = S.plv; set.levels[S.pg] = S.plv;
      var flagged = avg < RULE.place;
      if (flagged && pl.flags.indexOf(S.pg) < 0) pl.flags.push(S.pg);
      S.results.push({ g: S.pg, lv: S.plv, flag: flagged });
      save("placement", pl); save("settings", set);
      S.pg = null;
    } else { S.plv++; }
  }

  /* ---------- step state ---------- */
  function cur() { return S.steps[S.i]; }
  function enterStep() {
    var st = cur();
    S.support = 0; S.max = 0; S.start = 0; S.replayed = false; S.opts = null; S.nudge = ""; S.firstTry = true;
    S.slots = null; S.pool = null; S.wrongs = 0; S.solved = false; S.revealed = false; S.t0 = Date.now(); S.heard = [];
    if (st.game === "describe") { S.support = st.lv - 1; S.max = 2; }
    if (st.game === "name") { if (st.lv <= 2) { S.support = st.lv - 1; S.max = 3; } else makeOpts(st); }
    if (st.game === "script") { S.support = st.lv - 1; S.max = 2; }
    if (st.game === "seq") { S.support = st.lv >= 2 ? 1 : 0; S.max = 1; }
    if (st.game === "crossword") { S.support = Math.min(st.lv - 1, 2); S.max = 2; setupCross(st); }
    if (st.game === "wordbuild") { S.support = st.lv - 1; S.max = 3; setupBuild(st); }
    if (st.game === "maze") { setupMaze(st.data.n); }
    S.start = S.support;
  }
  function makeOpts(st) {
    var others = shuffle(ALL_NAMES.filter(function (n) { return n !== st.data && n.pic !== st.data.pic; })).slice(0, 2);
    S.opts = shuffle([st.data].concat(others)).map(function (n) { return { n: n, ok: n === st.data }; });
  }
  function target(st) {
    if (st.game === "crossword") return st.data.pz.p[st.data.wi].w;
    return st.data[lang][0].toUpperCase();
  }
  function cells(word) {
    var out = [];
    for (var i = 0; i < word.w.length; i++) out.push(word.d === "a" ? [word.r, word.c + i] : [word.r + i, word.c]);
    return out;
  }
  function makePool(word, slots, extra) {
    var need = [];
    slots.forEach(function (s, i) { if (!s) need.push(word[i]); });
    var others = ALPHA.filter(function (ch) { return word.indexOf(ch) < 0; });
    shuffle(others);
    return shuffle(need.concat(others.slice(0, extra))).map(function (ch) { return { ch: ch, used: false }; });
  }
  function setupCross(st) {
    var w = st.data.pz.p[st.data.wi], L = st.data.pz.letters;
    S.slots = cells(w).map(function (rc) { var k = rc[0] + "," + rc[1]; return L[k] ? { ch: L[k], lock: true } : null; });
    applyCrossSupport(st);
    if (st.lv === 4) S.pool = makePool(w.w, S.slots, 2);
  }
  function applyCrossSupport(st) {
    var w = target(st);
    if (S.support >= 1 && !(S.slots[0] && S.slots[0].lock)) { freeSlot(0); S.slots[0] = { ch: w[0], lock: true }; removeFromPool(w[0]); }
  }
  function setupBuild(st) {
    var w = target(st);
    S.slots = w.split("").map(function () { return null; });
    S.pool = shuffle(w.split("")).map(function (ch) { return { ch: ch, used: false }; });
    applyBuildSupport(st);
  }
  function applyBuildSupport(st) {
    var w = target(st);
    if (S.support >= 2 && !(S.slots[0] && S.slots[0].lock)) {
      freeSlot(0);
      var ti = -1;
      for (var i = 0; i < S.pool.length; i++) if (!S.pool[i].used && S.pool[i].ch === w[0]) { ti = i; break; }
      if (ti < 0) {
        for (var j = 1; j < S.slots.length; j++) if (S.slots[j] && !S.slots[j].lock && S.slots[j].ch === w[0]) { freeSlot(j); break; }
        for (i = 0; i < S.pool.length; i++) if (!S.pool[i].used && S.pool[i].ch === w[0]) { ti = i; break; }
      }
      if (ti >= 0) S.pool[ti].used = true;
      S.slots[0] = { ch: w[0], lock: true, tile: ti };
    }
  }
  function removeFromPool(ch) {
    if (!S.pool) return;
    for (var i = 0; i < S.pool.length; i++) if (S.pool[i].ch === ch && !S.pool[i].used) { S.pool.splice(i, 1); return; }
  }
  function freeSlot(i) {
    var s = S.slots[i];
    if (!s || s.lock) return;
    if (S.pool && s.tile != null && S.pool[s.tile]) S.pool[s.tile].used = false;
    S.slots[i] = null;
  }
  function placeLetter(ch, tile) {
    for (var i = 0; i < S.slots.length; i++) {
      if (!S.slots[i]) {
        S.slots[i] = { ch: ch, tile: tile };
        if (tile != null) S.pool[tile].used = true;
        break;
      }
    }
    if (S.slots.every(Boolean)) checkWord(); else render();
  }
  function checkWord() {
    var st = cur(), w = target(st);
    var guess = S.slots.map(function (s) { return s.ch; }).join("");
    if (guess === w) { solve(st); return; }
    S.firstTry = false; S.wrongs++;
    for (var i = 0; i < S.slots.length; i++) if (!S.slots[i].lock && S.slots[i].ch !== w[i]) freeSlot(i);
    S.nudge = T[lang].wrongLetters;
    if (S.wrongs >= 2 && S.support < S.max) { S.support++; S.wrongs = 0; applySupport(st); S.nudge = T[lang].hintGiven; }
    render();
  }
  function applySupport(st) {
    if (st.game === "crossword") applyCrossSupport(st);
    if (st.game === "wordbuild") applyBuildSupport(st);
  }
  function solve(st) {
    var w = target(st);
    S.solved = true;
    if (st.game === "crossword") {
      var word = st.data.pz.p[st.data.wi];
      cells(word).forEach(function (rc, i) { st.data.pz.letters[rc[0] + "," + rc[1]] = w[i]; });
    }
    render(); speak(w.toLowerCase());
    var res = S.firstTry ? "good" : "almost";
    busy = true;
    setTimeout(function () { busy = false; if (screen === "item" && cur() === st) record(res); }, 1500);
  }
  function revealWord(st) {
    var w = target(st);
    S.slots = w.split("").map(function (ch) { return { ch: ch, lock: true }; });
    if (S.pool) S.pool.forEach(function (t) { t.used = true; });
    if (st.game === "crossword") cells(st.data.pz.p[st.data.wi]).forEach(function (rc, i) { st.data.pz.letters[rc[0] + "," + rc[1]] = w[i]; });
    S.revealed = true; S.nudge = T[lang].revealed;
    render(); speak(w.toLowerCase());
  }

  /* Maze: depth-first generation, start top-left, goal bottom-right. walls[i] = [top, right, bottom, left]. */
  function setupMaze(n) {
    var walls = [], seen = [], stack = [0], i;
    for (i = 0; i < n * n; i++) { walls.push([true, true, true, true]); seen.push(false); }
    seen[0] = true;
    while (stack.length) {
      var c = stack[stack.length - 1], r = Math.floor(c / n), col = c % n, nb = [];
      if (r > 0 && !seen[c - n]) nb.push([c - n, 0, 2]);
      if (col < n - 1 && !seen[c + 1]) nb.push([c + 1, 1, 3]);
      if (r < n - 1 && !seen[c + n]) nb.push([c + n, 2, 0]);
      if (col > 0 && !seen[c - 1]) nb.push([c - 1, 3, 1]);
      if (!nb.length) { stack.pop(); continue; }
      var pick = nb[Math.floor(Math.random() * nb.length)];
      walls[c][pick[1]] = false; walls[pick[0]][pick[2]] = false;
      seen[pick[0]] = true; stack.push(pick[0]);
    }
    S.maze = { n: n, walls: walls, pos: 0, trail: {}, moves: 0 };
  }
  function mazeMoves() {
    var m = S.maze, p = m.pos, n = m.n, w = m.walls[p], out = {};
    if (!w[0]) out[p - n] = true; if (!w[1]) out[p + 1] = true; if (!w[2]) out[p + n] = true; if (!w[3]) out[p - 1] = true;
    return out;
  }

  function itemLabel(st) {
    if (st.game === "describe") return fmtTitle(st.data[lang][0]);
    if (st.game === "name" || st.game === "wordbuild") return st.data[lang][0];
    if (st.game === "crossword") return st.data.pz.p[st.data.wi].w.toLowerCase();
    if (st.game === "script") return st.data.phrase;
    if (st.game === "seq") return st.data.label;
    if (st.game === "maze") return st.data.n + "×" + st.data.n;
    return st.data;
  }
  function score(result, extra) {
    var base = { good: 1, almost: 0.5, choice: 0.5, model: 0, done: 1, skip: 0 }[result];
    return Math.max(0, base - 0.2 * extra);
  }
  function record(result) {
    var st = cur(), extra = Math.max(0, (S.support || 0) - (S.start || 0));
    var hasHints = (st.game === "name" && st.lv <= 2) || ["describe", "script", "crossword", "wordbuild"].indexOf(st.game) >= 0;
    S.log.push({ game: st.game, lv: st.lv, label: itemLabel(st), hints: hasHints ? S.support : null, result: result, score: score(result, extra), ms: Date.now() - S.t0, heard: (S.heard || []).join(" / ") });
    next();
  }
  function next() {
    stopVoice(); micCancel();
    S.i++;
    if (S.i >= S.steps.length) {
      if (S.mode === "place") {
        if (S.i > 0) placeEvaluate();
        if (!placeNextBlock()) { finishPlacement(true); return; }
      } else { finish(); return; }
    }
    enterStep(); render();
  }
  function finish() {
    stopVoice();
    var set = getSettings(), hist = getHistory(), changes = [], t = T[lang];
    GAMES.forEach(function (g) {
      var rows = S.log.filter(function (r) { return r.game === g; });
      if (!rows.length) return;
      var lvNow = S.levels[g];
      var avg = rows.reduce(function (a, r) { return a + r.score; }, 0) / rows.length;
      var h = Array.isArray(hist[g]) ? hist[g] : [];
      h.push({ lv: lvNow, s: Math.round(avg * 100) / 100, d: S.started.toISOString().slice(0, 10) });
      hist[g] = h.slice(-30);
      if (!set.auto) return;
      var atLv = hist[g].filter(function (x) { return x.lv === lvNow; });
      var lastN = function (n) { var a = atLv.slice(-n); return a.length < n ? null : a.reduce(function (x, y) { return x + y.s; }, 0) / n; };
      var d = lastN(RULE.downN), u = lastN(RULE.upN), nl = lvNow;
      if (d !== null && d < RULE.down && lvNow < MAXLV[g]) nl = lvNow + 1;
      else if (set.allowUp && u !== null && u > RULE.up && lvNow > 1) nl = lvNow - 1;
      if (nl !== lvNow) {
        set.levels[g] = nl;
        changes.push({ cls: "", text: fill(nl > lvNow ? t.chDown : t.chUp, { g: t.game[g], n: nl, name: t.lv[g][nl - 1] }) });
      } else if (lvNow === MAXLV[g] && d !== null && d < RULE.flag) {
        changes.push({ cls: "flag", text: fill(t.chFlag, { g: t.game[g] }) });
      }
    });
    save("history", hist); save("settings", set);
    S.changes = changes; S.nextLevels = set.levels;
    screen = "summary"; render();
  }
  function finishPlacement(complete) {
    stopVoice();
    var pl = getPlacement();
    if (complete) { pl.status = "done"; save("placement", pl); }
    S.complete = complete;
    screen = "summary"; render();
  }

  /* ---------- views ---------- */
  function header(stopBtn) {
    var t = T[lang];
    return '<header class="bar"><div class="brand">' + esc(t.appName) + '</div>' +
      (stopBtn ? '<button class="stop" data-act="stop">' + esc(t.stop) + '</button>' : '') + '</header>';
  }
  function progress(game) {
    var t = T[lang], list = S.games, ci = list.indexOf(game);
    return '<ol class="steps" aria-label="Progress">' + list.map(function (k, i) {
      return '<li class="' + (i === ci ? "on" : (i < ci ? "past" : "")) + '"' + (i === ci ? ' aria-current="step"' : '') + '>' + esc(t.game[k]) + '</li>';
    }).join("") + '</ol>';
  }
  function rateRow() {
    var t = T[lang];
    if (S.who === "solo") return soloRow();
    return '<div class="rate">' + nudge() +
      '<p class="label">' + esc(t.rateLabel) + '</p><div class="rate-btns">' +
      '<button class="r good" data-act="rate" data-r="good">' + esc(t.good) + '</button>' +
      '<button class="r almost" data-act="rate" data-r="almost">' + esc(t.almost) + '</button>' +
      '<button class="r retry" data-act="rate" data-r="retry">' + esc(t.retry) + '</button></div></div>';
  }
  /* Solo mode: the microphone checks spoken answers; without it, the person rates themselves. */
  function soloRow() {
    var t = T[lang], st = cur();
    if (!micReady()) {
      return '<div class="rate">' + nudge() + '<p class="label">' + esc(t.selfLabel) + '</p><div class="rate-btns">' +
        '<button class="r good" data-act="rate" data-r="good">' + esc(t.selfGood) + '</button>' +
        '<button class="r almost" data-act="rate" data-r="almost">' + esc(t.selfAlmost) + '</button>' +
        '<button class="r retry" data-act="rate" data-r="retry">' + esc(t.selfHelp) + '</button></div></div>';
    }
    if (L.on && L.step === st) {
      var live = L.state === "listening" ? t.listening : t.micStarting;
      return '<div class="rate"><div class="listen-box"><span class="live"><i></i>' + esc(live) + '</span>' +
        '<p class="heard" id="heard"><span class="lbl">' + esc(t.heardLabel) + '</span>' + esc(L.text) + (L.partial ? ' <em>' + esc(L.partial) + '</em>' : '') + '</p>' +
        '<button class="primary" data-act="mic-done">' + esc(t.micDone) + '</button></div></div>';
    }
    var last = S.heard.length ? '<p class="heard"><span class="lbl">' + esc(t.heardLabel) + '</span>' + esc(S.heard[S.heard.length - 1]) + '</p>' : '';
    return '<div class="rate"><div class="listen-box">' + nudge() + last +
      (st.game === "describe" ? '<p class="label">' + esc(t.describeHint) + '</p>' : '') +
      '<button class="micbtn" data-act="mic">' + ICON_MIC + esc(t.micBtn) + '</button></div></div>';
  }
  function nudge() { return S.nudge ? '<p class="nudge">' + esc(S.nudge) + '</p>' : ''; }
  function viewMode() {
    var t = T[lang];
    return header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.who) + '</h1>' +
      '<div class="modes">' +
      '<button class="modecard" data-act="who" data-w="solo"><span class="ico" aria-hidden="true">🙂</span><strong>' + esc(t.soloTitle) + '</strong><span>' + esc(t.soloDesc) + '</span></button>' +
      '<button class="modecard" data-act="who" data-w="assist"><span class="ico" aria-hidden="true">🤝</span><strong>' + esc(t.assistTitle) + '</strong><span>' + esc(t.assistDesc) + '</span></button>' +
      '</div>' +
      '<p class="note">' + esc(D ? t.micNote : t.noMic) + '</p>' +
      '<button class="link" data-act="home">' + esc(t.back) + '</button></section>';
  }
  function listenBtn() { return '<button class="tool" data-act="listen">' + ICON_SPEAKER + esc(T[lang].listen) + '</button>'; }
  function hintBtn() { return '<button class="tool" data-act="hint"' + (S.support >= S.max ? ' disabled' : '') + '>' + esc(T[lang].hintBtn) + '</button>'; }
  function noTtsNote() { return tts ? '' : '<p class="note">' + esc(T[lang].noTts) + '</p>'; }
  function lvTag(st) {
    var t = T[lang];
    var pre = S.mode === "place" ? esc(t.placeTag) + ' · ' : '';
    return '<p class="tag">' + pre + esc(t.game[st.game]) + (st.lv ? ' · ' + esc(t.level) + ' ' + st.lv : '') + '</p>';
  }

  function viewOnboard() {
    var t = T[lang], p = getProfile() || {};
    return header(false) + '<section class="card home">' +
      '<h1>' + esc(t.welcome) + '</h1><p class="sub">' + esc(t.welcomeSub) + '</p>' +
      langSeg() +
      profileFields("pf-", p) +
      (flash ? '<p class="nudge">' + esc(flash) + '</p>' : '') +
      '<button class="primary" data-act="onboard-place">' + esc(t.placeStart) + '</button>' +
      '<button class="link" data-act="onboard-skip">' + esc(t.placeSkip) + '</button>' +
      '<p class="note">' + esc(t.placeNote) + '</p><p class="note">' + esc(t.localNote) + '</p></section>';
  }
  function profileFields(px, p) {
    var t = T[lang], mine = p.interests || [];
    function field(id, label, input, help) {
      return '<div class="field"><label for="' + px + id + '">' + esc(label) + '</label>' + input + (help ? '<small>' + esc(help) + '</small>' : '') + '</div>';
    }
    return field("name", t.fName, '<input id="' + px + 'name" type="text" autocomplete="off" value="' + esc(p.name || "") + '">') +
      field("year", t.fYear, '<input id="' + px + 'year" type="number" inputmode="numeric" min="1900" max="' + new Date().getFullYear() + '" placeholder="1955" value="' + esc(p.year || "") + '">', t.fYearHelp) +
      field("city", t.fCity, '<input id="' + px + 'city" type="text" autocomplete="off" value="' + esc(p.city || "") + '">') +
      '<div class="field"><span class="flabel" id="' + px + 'int-l">' + esc(t.fInterests) + '</span>' +
      '<div class="ints" role="group" aria-labelledby="' + px + 'int-l">' + PACK_KEYS.map(function (k) {
        return '<button type="button" class="int" data-act="int" data-k="' + k + '" aria-pressed="' + (mine.indexOf(k) >= 0) + '"><span aria-hidden="true">' + PACKS[k].icon + '</span> ' + esc(PACKS[k].label[lang]) + '</button>';
      }).join("") + '</div><small>' + esc(t.interestsHelp) + '</small></div>' +
      field("team", t.fTeam, '<input id="' + px + 'team" type="text" autocomplete="off" value="' + esc(p.team || "") + '">') +
      field("other", t.fOther, '<input id="' + px + 'other" type="text" autocomplete="off" placeholder="' + esc(t.otherPh) + '" value="' + esc(p.other || "") + '">');
  }
  function langSeg() {
    return '<div class="seg" role="group" aria-label="Lingua / Language">' +
      '<button data-act="lang" data-l="it" aria-pressed="' + (lang === "it") + '">Italiano</button>' +
      '<button data-act="lang" data-l="en" aria-pressed="' + (lang === "en") + '">English</button></div>';
  }
  function viewHome() {
    var t = T[lang], tp = todayPlan(), L = tp.set.levels, prof = getProfile(), pl = getPlacement();
    var pending = pl.status === "in_progress";
    return header(false) +
      '<section class="card home">' +
      '<h1>' + esc(fill(t.hello, { name: prof.name })) + '</h1><p class="sub">' + esc(t.tagline) + '</p>' + langSeg() +
      (myPacks().length || prof.other ? '<div class="mychips" aria-label="' + esc(t.yourInterests) + '">' + myPacks().map(function (k) { return '<span>' + PACKS[k].icon + ' ' + esc(PACKS[k].label[lang]) + '</span>'; }).join("") + (prof.other ? '<span>💬 ' + esc(prof.other) + '</span>' : '') + '</div>' : '') +
      '<p class="tag">' + esc(t.planTitle) + '</p>' +
      '<div class="scale" aria-hidden="true"><span>↑ ' + esc(t.hard) + '</span></div>' +
      '<ol class="plan">' + tp.list.map(function (g) {
        var detail = g === "maze" ? t.sizes[tp.set.mazeSize] : t.level + ' ' + L[g] + ' · ' + t.lv[g][L[g] - 1];
        return '<li><strong>' + esc(t.game[g]) + '</strong><span>' + esc(detail) + '</span></li>';
      }).join("") + '</ol>' +
      '<div class="scale" aria-hidden="true"><span>↓ ' + esc(t.easy) + '</span></div>' +
      (pending
        ? '<button class="primary" data-act="place">' + esc(t.placeContinue) + '</button><button class="link" data-act="start">' + esc(t.startAnyway) + '</button>'
        : '<button class="primary" data-act="start">' + esc(t.start) + '</button>') +
      '<div class="links"><button class="link" data-act="scripts">' + esc(t.scripts) + '</button>' +
      '<button class="link" data-act="settings">' + esc(t.settings) + '</button></div>' +
      noTtsNote() + '<p class="note">' + esc(t.proto) + '</p></section>';
  }
  function viewScripts() {
    var t = T[lang];
    var lines = getScripts().map(function (p) { return p.cue ? p.cue + " | " + p.phrase : p.phrase; });
    return header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.scripts) + ' · ' + esc(t.langName) + '</h1>' +
      '<p class="sub">' + esc(t.scriptsHelp) + '</p>' +
      '<textarea id="scripts-ta" aria-label="' + esc(t.scripts) + '" spellcheck="true">' + esc(lines.join("\n")) + '</textarea>' +
      (flash ? '<p class="nudge">' + esc(flash) + '</p>' : '') +
      '<button class="primary" data-act="save-scripts">' + esc(t.saveBtn) + '</button>' +
      '<button class="link" data-act="home">' + esc(t.back) + '</button>' +
      '<p class="note">' + esc(t.localNote) + '</p></section>';
  }
  function viewSettings() {
    var t = T[lang], set = getSettings(), prof = getProfile() || {};
    var rows = GAMES.map(function (g) {
      return '<div class="setrow"><label for="lv-' + g + '">' + esc(t.game[g]) + '</label><select id="lv-' + g + '">' +
        t.lv[g].map(function (name, i) { return '<option value="' + (i + 1) + '"' + (set.levels[g] === i + 1 ? ' selected' : '') + '>' + (i + 1) + ' · ' + esc(name) + '</option>'; }).join("") +
        '</select></div>';
    }).join("");
    var ask = confirmAsk === "reset" ? t.resetQ : confirmAsk === "redo" ? t.redoQ : "";
    return header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.settings) + '</h1>' +
      '<div class="settings">' +
      '<h2>' + esc(t.secProfile) + '</h2>' +
      profileFields("set-", prof) +
      '<h2>' + esc(t.secLevels) + '</h2><p class="note">' + esc(t.setHelp) + '</p>' + rows +
      '<label class="check"><input type="checkbox" id="set-auto"' + (set.auto ? ' checked' : '') + '>' + esc(t.auto) + '</label>' +
      '<label class="check"><input type="checkbox" id="set-up"' + (set.allowUp ? ' checked' : '') + '>' + esc(t.allowUp) + '</label>' +
      '<p class="note">' + esc(t.ruleText) + '</p>' +
      '<h2>' + esc(t.secOptions) + '</h2>' +
      '<label class="check"><input type="checkbox" id="set-maze"' + (set.maze ? ' checked' : '') + '>' + esc(t.mazeOn) + '</label>' +
      '<div class="setrow"><label for="set-msize">' + esc(t.mazeSize) + '</label><select id="set-msize">' +
      [4, 6, 8].map(function (n) { return '<option value="' + n + '"' + (set.mazeSize === n ? ' selected' : '') + '>' + esc(t.sizes[n]) + '</option>'; }).join("") + '</select></div>' +
      '</div>' +
      (flash ? '<p class="nudge">' + esc(flash) + '</p>' : '') +
      '<button class="primary" data-act="save-settings">' + esc(t.saveSet) + '</button>' +
      (ask
        ? '<div class="confirm"><span>' + esc(ask) + '</span><button class="secondary" data-act="confirm-yes">' + esc(t.yes) + '</button><button class="secondary" data-act="confirm-no">' + esc(t.no) + '</button></div>'
        : '<div class="row-actions"><button class="secondary" data-act="ask-redo">' + esc(t.redoPlace) + '</button><button class="secondary" data-act="ask-reset">' + esc(t.reset) + '</button></div>') +
      '<button class="link" data-act="home">' + esc(t.back) + '</button>' +
      '<p class="note">' + esc(t.localNote) + '</p></section>';
  }

  function viewItem() {
    var t = T[lang], st = cur(), body = lvTag(st);
    if (st.game === "describe") {
      var d = st.data[lang], aids = "";
      if (S.support >= 1) aids += '<div class="hint"><b>1</b><div><strong>' + esc(t.questions) + '</strong><ul class="qlist">' + d[2].map(function (q) { return '<li>' + esc(q) + '</li>'; }).join("") + '</ul></div></div>';
      if (S.support >= 2) aids += '<div class="hint"><b>2</b><div><strong>' + esc(t.keywords) + '</strong><div class="kw">' + d[3].map(function (w) { return '<span>' + esc(w) + '</span>'; }).join("") + '</div></div></div>';
      body += '<div class="pic sm" aria-hidden="true">' + st.data.pic + '</div>' +
        '<p class="instr">' + esc(t.tellMe) + ': ' + esc(fmtTitle(d[0])) + '</p><p class="sub">' + esc(d[1]) + '</p>' +
        (aids ? '<div class="hints">' + aids + '</div>' : '') +
        '<div class="tools">' + hintBtn() + '</div>' + rateRow();
    } else if (st.game === "crossword") {
      body += viewCross(st);
    } else if (st.game === "wordbuild") {
      body += viewBuild(st);
    } else if (st.game === "maze") {
      body += viewMaze();
    } else if (st.game === "name" && st.lv <= 2) {
      var w = st.data[lang], h = "";
      if (S.support >= 1) h += '<div class="hint"><b>1</b><span>' + esc(w[1]) + '</span></div>';
      if (S.support >= 2) h += '<div class="hint"><b>2</b><span>' + esc(t.startsWith) + ' «' + esc(w[2]) + '»</span></div>';
      if (S.support >= 3) h += '<div class="hint word">' + esc(w[0]) + '</div>';
      body += '<p class="instr">' + esc(t.nameInstr) + '</p>' +
        '<div class="pic" role="img" aria-label="' + esc(w[0]) + '">' + st.data.pic + '</div>' +
        (h ? '<div class="hints">' + h + '</div>' : '') + optsHtml(false) +
        '<div class="tools">' + hintBtn() + '<button class="tool" data-act="choice"' + (S.opts ? ' disabled' : '') + '>' + esc(t.choiceBtn) + '</button></div>' + rateRow();
    } else if (st.game === "name" && st.lv === 3) {
      body += '<p class="instr">' + esc(t.pickWord) + '</p>' +
        '<div class="pic" role="img" aria-label="?">' + st.data.pic + '</div>' + optsHtml(false);
    } else if (st.game === "name") {
      body += '<p class="instr">' + esc(t.matchInstr) + '</p>' +
        '<div class="tools">' + listenBtn() + '</div>' + noTtsNote() +
        (tts ? '' : '<p class="phrase">' + esc(st.data[lang][0]) + '</p>') + optsHtml(true);
    } else if (st.game === "script") {
      var p = st.data;
      if (S.support === 0) body += '<p class="instr">' + esc(t.whatSay) + '</p><p class="cue">' + esc(p.cue) + '</p>';
      else body += (p.cue ? '<p class="cue">' + esc(p.cue) + '</p>' : '') + '<p class="instr">' + esc(S.support >= 2 ? t.echoInstr : t.readAloud) + '</p><p class="phrase">' + esc(p.phrase) + '</p>';
      body += '<div class="tools">' + (S.support < S.max ? hintBtn() : listenBtn()) + '</div>' + (S.support >= 2 ? noTtsNote() : '') + rateRow();
    } else if (st.game === "echo") {
      body += '<p class="instr">' + esc(t.echoInstr) + '</p><p class="phrase">' + esc(st.data) + '</p>' +
        '<div class="tools">' + listenBtn() + '</div>' + noTtsNote() + rateRow();
    } else {
      var shown = st.data.show || st.data.items;
      body += '<p class="sub">' + esc(st.data.label) + '</p><p class="instr">' + esc(S.support ? t.seqTogether : t.seqAlone) + '</p>' +
        '<div class="chips">' + shown.map(function (x, i) { return '<span class="chip" id="c' + i + '">' + esc(x) + '</span>'; }).join("") + '</div>' +
        (S.support ? '<div class="tools">' + listenBtn() + '</div>' + noTtsNote() : '') + rateRow();
    }
    return header(true) + progress(st.game) + '<section class="card">' + body + '</section>';
  }
  function letterInput(st) {
    var t = T[lang];
    if (S.solved) return nudge();
    if (S.revealed) return nudge() + '<button class="primary" data-act="advance">' + esc(t.advance) + '</button>';
    var input = "";
    if (S.pool) {
      input = '<div class="tiles">' + S.pool.map(function (tl, i) {
        return '<button class="tile' + (tl.used ? ' used' : '') + '" data-act="tile" data-i="' + i + '"' + (tl.used ? ' disabled aria-hidden="true"' : '') + '>' + esc(tl.ch) + '</button>';
      }).join("") + '</div>';
    } else {
      input = '<div class="kb">' + ALPHA.map(function (ch) { return '<button class="key" data-act="key" data-ch="' + ch + '">' + ch + '</button>'; }).join("") +
        '<button class="key del" data-act="del">⌫ ' + esc(t.del) + '</button></div>';
    }
    var tools = '<div class="tools">' + (S.support < S.max ? hintBtn() : '<button class="tool" data-act="reveal">' + esc(t.reveal) + '</button>') + '</div>';
    return nudge() + input + tools;
  }
  function viewCross(st) {
    var t = T[lang], pz = st.data.pz, w = pz.p[st.data.wi], map = {}, R = 0, C = 0, starts = {};
    pz.p.forEach(function (word, k) {
      cells(word).forEach(function (rc, i) { map[rc[0] + "," + rc[1]] = true; R = Math.max(R, rc[0] + 1); C = Math.max(C, rc[1] + 1); if (!i) starts[rc[0] + "," + rc[1]] = k + 1; });
    });
    var act = {}; cells(w).forEach(function (rc, i) { act[rc[0] + "," + rc[1]] = i; });
    var nextIdx = S.slots.indexOf(null), html = "";
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var k = r + "," + c, num = starts[k] ? '<span class="num">' + starts[k] + '</span>' : '';
      if (!map[k]) { html += '<span class="cell void" aria-hidden="true"></span>'; continue; }
      if (act[k] != null) {
        var s = S.slots[act[k]], cls = "cell act" + (s && s.lock ? " lock" : "") + (act[k] === nextIdx ? " next" : "") + (S.solved || S.revealed ? " ok" : "");
        html += '<button class="' + cls + '" data-act="slot" data-i="' + act[k] + '" aria-label="' + (act[k] + 1) + '">' + num + (s ? esc(s.ch) : "") + '</button>';
      } else {
        var L = pz.letters[k];
        html += '<span class="cell' + (L ? " fill" : "") + '">' + num + (L ? esc(L) : "") + '</span>';
      }
    }
    var showPic = S.support >= 2;
    return '<p class="instr">' + esc(t.cwInstr) + '</p>' +
      '<p class="clue"><b>' + (st.data.wi + 1) + ' ' + (w.d === "a" ? t.across : t.down) + '</b>' + esc(w.clue) + '</p>' +
      (showPic ? '<div class="pic sm" aria-hidden="true">' + w.pic + '</div>' : '') +
      '<div class="cwbox"><div class="cw" style="--cols:' + C + '">' + html + '</div></div>' + letterInput(st);
  }
  function viewBuild(st) {
    var t = T[lang], d = st.data[lang], W = target(st);
    var slots = '<div class="slots">' + S.slots.map(function (s, i) {
      var cls = "slot" + (s ? (s.lock ? " lock" : " has") : "") + (S.solved || S.revealed ? " ok" : "");
      return '<button class="' + cls + '" data-act="slot" data-i="' + i + '" aria-label="' + (i + 1) + '">' + (s ? esc(s.ch) : "") + '</button>';
    }).join("") + '</div>';
    return '<p class="instr">' + esc(t.wbInstr) + '</p><p class="sub">' + esc(d[1]) + '</p>' +
      (S.support >= 1 ? '<div class="pic sm" aria-hidden="true">' + st.data.pic + '</div>' : '') +
      (S.support >= 3 && !S.solved && !S.revealed ? '<p class="model" aria-label="' + esc(W) + '">' + esc(W) + '</p>' : '') +
      slots + letterInput(st);
  }
  function viewMaze() {
    var t = T[lang], m = S.maze, n = m.n, can = S.solved ? {} : mazeMoves(), html = "";
    for (var i = 0; i < n * n; i++) {
      var w = m.walls[i], cls = "mz" + (w[0] ? " wt" : "") + (w[1] ? " wr" : "") + (w[2] ? " wb" : "") + (w[3] ? " wl" : "") + (can[i] ? " can" : "") + (m.trail[i] ? " trail" : "");
      var inner = i === m.pos ? '<span class="me"></span>' : (i === n * n - 1 ? "⭐" : "");
      html += '<button class="' + cls + '" data-act="mv" data-i="' + i + '"' + (can[i] ? '' : ' tabindex="-1"') + '>' + inner + '</button>';
    }
    return '<p class="instr">' + esc(S.solved ? t.mazeDone : t.mazeInstr) + '</p><p class="sub">' + esc(t.mazeHelp) + '</p>' +
      '<div class="cwbox"><div class="maze" style="--n:' + n + '">' + html + '</div></div>' +
      (S.solved ? '' : '<div class="tools"><button class="tool" data-act="maze-skip">' + esc(t.mazeSkip) + '</button></div>');
  }
  function optsHtml(pictures) {
    if (!S.opts) return "";
    return '<div class="opts">' + S.opts.map(function (o, i) {
      var label = pictures ? o.n.pic : esc(o.n[lang][0]);
      var aria = pictures ? ' aria-label="' + (i + 1) + '"' : '';
      return '<button class="opt' + (pictures ? ' pico' : '') + ' ' + (o.state || "") + '" data-act="opt" data-i="' + i + '"' + aria + (o.state ? ' disabled' : '') + '>' + label + '</button>';
    }).join("") + '</div>';
  }

  function logTable() {
    var t = T[lang];
    if (!S.log.length) return "";
    var anyHeard = S.log.some(function (r) { return r.heard; });
    var rows = S.log.map(function (r) {
      return '<tr><td>' + esc(t.game[r.game]) + '</td><td class="n">' + (r.lv || "–") + '</td><td>' + esc(r.label) + '</td>' +
        (anyHeard ? '<td>' + esc(r.heard || "–") + '</td>' : '') + '<td class="n">' + (r.hints === null ? "–" : r.hints) + '</td>' +
        '<td><span class="pill ' + r.result + '">' + esc(t.res[r.result]) + '</span></td><td class="n">' + Math.round(r.ms / 1000) + '</td></tr>';
    }).join("");
    return '<p class="note">' + esc(S.who === "solo" ? t.modeSolo : t.modeAssist) + '</p>' +
      '<div class="tbl"><table><thead><tr><th>' + esc(t.colGame) + '</th><th>' + esc(t.colLv) + '</th><th>' + esc(t.colItem) + '</th>' + (anyHeard ? '<th>' + esc(t.colHeard) + '</th>' : '') + '<th>' + esc(t.colHints) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colTime) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">' + esc(t.timeNote) + '</p>';
  }
  function summaryLines() {
    var t = T[lang], lines = [];
    if (S.mode === "place") {
      var pl = getPlacement();
      GAMES.forEach(function (g) {
        if (!pl.levels[g]) return;
        lines.push({ cls: pl.flags.indexOf(g) >= 0 ? "flag" : "", text: pl.flags.indexOf(g) >= 0 ? fill(t.placeFlag, { g: t.game[g] }) + " " + fill(t.placeLv, { g: t.game[g], n: pl.levels[g], name: t.lv[g][pl.levels[g] - 1] }) : fill(t.placeLv, { g: t.game[g], n: pl.levels[g], name: t.lv[g][pl.levels[g] - 1] }) });
      });
      return lines;
    }
    lines = (S.changes || []).slice();
    if (!lines.filter(function (c) { return !c.cls; }).length) lines.unshift({ cls: "", text: GAMES.map(function (g) { return t.game[g] + " " + S.nextLevels[g]; }).join(" · ") });
    return lines;
  }
  function viewSummary() {
    var t = T[lang], place = S.mode === "place";
    var title = place ? (S.complete ? t.placeDone : t.sumTitle) : t.sumTitle;
    var msg = place ? (S.complete ? t.sumDone : t.placePaused) : (S.stopped ? t.sumStopped : t.sumDone);
    var lines = summaryLines().map(function (c) { return '<li class="' + c.cls + '">' + esc(c.text) + '</li>'; }).join("");
    return header(false) + '<section class="card">' +
      '<h1 class="sumhead">' + esc(title) + '</h1>' +
      '<p class="instr">' + esc(msg) + '</p>' +
      '<button class="primary" data-act="home">' + esc(t.home) + '</button>' +
      '<div class="report"><h2>' + esc(t.sumFor) + '</h2>' +
      '<h2>' + esc(place ? t.startLevels : t.nextLevels) + '</h2><ul class="changes">' + (lines || '<li>–</li>') + '</ul>' +
      logTable() +
      '<div class="row-actions"><button class="tool" data-act="copy">' + esc(t.copy) + '</button></div>' +
      (flash ? '<p class="nudge">' + esc(flash) + '</p>' : '') +
      '<textarea id="sum-text" readonly hidden aria-label="' + esc(t.copy) + '">' + esc(summaryText()) + '</textarea>' +
      '</div></section>';
  }
  function summaryText() {
    var t = T[lang], prof = getProfile() || {};
    var d = S.started.toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
    var lines = [t.appName + " · " + d + (S.mode === "place" ? " · " + t.placeTag : "")];
    if (prof.name) lines.push(prof.name + (prof.year ? " · " + t.birth + " " + prof.year : ""));
    lines.push(S.who === "solo" ? t.modeSolo : t.modeAssist);
    S.log.forEach(function (r) {
      lines.push(t.game[r.game] + (r.lv ? " (" + t.level + " " + r.lv + ")" : "") + " | " + r.label + (r.heard ? " | " + t.colHeard + ": " + r.heard : "") + " | " + t.colHints + ": " + (r.hints === null ? "–" : r.hints) + " | " + t.res[r.result] + " | " + Math.round(r.ms / 1000) + " s");
    });
    summaryLines().forEach(function (c) { lines.push(c.text); });
    return lines.join("\n");
  }

  function render() {
    var html = screen === "mode" ? viewMode() : screen === "onboard" ? viewOnboard() : screen === "home" ? viewHome() : screen === "scripts" ? viewScripts() : screen === "settings" ? viewSettings() : screen === "item" ? viewItem() : viewSummary();
    app.innerHTML = html;
    flash = "";
    window.scrollTo(0, 0);
  }

  /* ---------- actions ---------- */
  function playSeq(items) {
    var k = 0, st = cur();
    function step() {
      var chips = app.querySelectorAll(".chip");
      for (var i = 0; i < chips.length; i++) chips[i].classList.remove("hl");
      if (screen !== "item" || !S || cur() !== st || k >= items.length) return;
      var el = document.getElementById("c" + k); if (el) el.classList.add("hl");
      speak(items[k], function () { k++; setTimeout(step, 250); });
    }
    step();
  }
  function speakCurrent(st) {
    if (st.game === "seq") playSeq(st.data.items);
    else if (st.game === "name") speak(st.data[lang][0]);
    else if (st.game === "script") speak(st.data.phrase);
    else if (st.game === "echo") speak(st.data);
  }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function readProfile(px) {
    var t = T[lang], name = val(px + "name"), ys = val(px + "year");
    if (!name) { flash = t.needName; return null; }
    var year = null;
    if (ys) { year = parseInt(ys, 10); if (!(year >= 1900 && year <= new Date().getFullYear())) { flash = t.badYear; return null; } }
    var ints = [].map.call(app.querySelectorAll('[data-act="int"][aria-pressed="true"]'), function (el) { return el.getAttribute("data-k"); });
    return { name: name.slice(0, 40), year: year, city: val(px + "city").slice(0, 60), team: val(px + "team").slice(0, 40), other: val(px + "other").slice(0, 60), interests: ints };
  }
  /* Keeps what was typed when the screen redraws (language switch, validation message). */
  function snapForm() {
    var s = { v: {}, ints: null };
    [].forEach.call(app.querySelectorAll("input[id]"), function (el) { s.v[el.id] = el.type === "checkbox" ? el.checked : el.value; });
    var chips = app.querySelectorAll('[data-act="int"]');
    if (chips.length) s.ints = [].filter.call(chips, function (el) { return el.getAttribute("aria-pressed") === "true"; }).map(function (el) { return el.getAttribute("data-k"); });
    return s;
  }
  function restoreForm(s) {
    Object.keys(s.v).forEach(function (id) { var el = document.getElementById(id); if (!el) return; if (el.type === "checkbox") el.checked = s.v[id]; else el.value = s.v[id]; });
    if (s.ints) [].forEach.call(app.querySelectorAll('[data-act="int"]'), function (el) { el.setAttribute("aria-pressed", String(s.ints.indexOf(el.getAttribute("data-k")) >= 0)); });
  }
  function rerenderKeep() { var s = snapForm(); render(); restoreForm(s); }

  app.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled || busy) return;
    var act = b.getAttribute("data-act"), t = T[lang];
    if (act === "lang") { lang = b.getAttribute("data-l"); save("lang", lang); document.documentElement.lang = lang; rerenderKeep(); return; }
    if (act === "int") { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); return; }
    if (act === "onboard-place" || act === "onboard-skip") {
      var p = readProfile("pf-"); if (!p) { rerenderKeep(); return; }
      save("profile", p);
      if (act === "onboard-skip") { save("placement", { status: "skipped", levels: {}, flags: [] }); screen = "settings"; render(); return; }
      save("placement", { status: "in_progress", levels: {}, flags: [] });
      pending = "place"; screen = "mode"; render(); return;
    }
    if (act === "place" || act === "start") { pending = act; screen = "mode"; render(); return; }
    if (act === "who") {
      var who = b.getAttribute("data-w") === "assist" ? "assist" : "solo";
      if (pending === "place") { if (buildPlacement(who)) { screen = "item"; next(); } else { finishPlacement(true); } return; }
      S = buildSession(who); screen = "item"; next(); return;
    }
    if (act === "scripts" || act === "settings") { confirmAsk = ""; screen = act; render(); return; }
    if (act === "home") { stopVoice(); if (S) micCancel(); confirmAsk = ""; screen = "home"; render(); return; }
    if (act === "save-scripts") {
      var lines = document.getElementById("scripts-ta").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      if (!lines.length) { flash = t.emptyScripts; render(); return; }
      save("scripts_" + lang, lines); flash = t.saved; render(); return;
    }
    if (act === "save-settings") {
      var pr = readProfile("set-"); if (!pr) { rerenderKeep(); return; }
      save("profile", pr);
      var set = getSettings();
      GAMES.forEach(function (g) { set.levels[g] = +document.getElementById("lv-" + g).value; });
      set.auto = document.getElementById("set-auto").checked;
      set.allowUp = document.getElementById("set-up").checked;
      set.maze = document.getElementById("set-maze").checked;
      set.mazeSize = +document.getElementById("set-msize").value;
      save("settings", set); flash = t.setSaved; render(); return;
    }
    if (act === "ask-reset" || act === "ask-redo") { confirmAsk = act === "ask-reset" ? "reset" : "redo"; render(); return; }
    if (act === "confirm-no") { confirmAsk = ""; render(); return; }
    if (act === "confirm-yes") {
      var which = confirmAsk; confirmAsk = "";
      if (which === "reset") {
        var s0 = getSettings();
        save("history", {}); save("settings", { auto: s0.auto, allowUp: s0.allowUp, maze: s0.maze, mazeSize: s0.mazeSize });
        flash = t.resetDone; render(); return;
      }
      save("placement", { status: "in_progress", levels: {}, flags: [] });
      pending = "place"; screen = "mode"; render(); return;
    }
    if (act === "stop") { micCancel(); S.stopped = true; if (S.mode === "place") finishPlacement(false); else finish(); return; }
    if (act === "copy") {
      var fallback = function () { flash = t.copyFail; render(); var ta = document.getElementById("sum-text"); if (ta) { ta.hidden = false; ta.select(); } };
      try { navigator.clipboard.writeText(summaryText()).then(function () { flash = t.copied; render(); }, fallback); } catch (err) { fallback(); }
      return;
    }
    var st = S && S.i >= 0 && S.i < S.steps.length && cur(); if (!st) return;
    if (act === "mic") { micStart(); return; }
    if (act === "mic-done") { micStop(); return; }
    if (act === "listen") { micCancel(); speakCurrent(st); return; }
    if (act === "key") { if (!S.solved && !S.revealed) { S.nudge = ""; placeLetter(b.getAttribute("data-ch"), null); } return; }
    if (act === "tile") { if (!S.solved && !S.revealed) { var ti = +b.getAttribute("data-i"); S.nudge = ""; placeLetter(S.pool[ti].ch, ti); } return; }
    if (act === "del") {
      for (var i = S.slots.length - 1; i >= 0; i--) if (S.slots[i] && !S.slots[i].lock) { freeSlot(i); break; }
      render(); return;
    }
    if (act === "slot") { if (!S.solved && !S.revealed) { freeSlot(+b.getAttribute("data-i")); render(); } return; }
    if (act === "reveal") { revealWord(st); return; }
    if (act === "advance") { record("model"); return; }
    if (act === "mv") {
      if (S.solved) return;
      var to = +b.getAttribute("data-i");
      if (!mazeMoves()[to]) return;
      S.maze.trail[S.maze.pos] = true; S.maze.pos = to; S.maze.moves++;
      if (to === S.maze.n * S.maze.n - 1) {
        S.solved = true; render(); busy = true;
        setTimeout(function () { busy = false; if (screen === "item" && cur() === st) record("done"); }, 1200);
      } else render();
      return;
    }
    if (act === "maze-skip") { record("skip"); return; }
    if (act === "hint") {
      S.support = Math.min(S.max, S.support + 1); S.nudge = "";
      applySupport(st); render();
      if (st.game === "name" && S.support === 3) speak(st.data[lang][0]);
      if (st.game === "script" && S.support === 2) speak(st.data.phrase);
      return;
    }
    if (act === "choice") { makeOpts(st); render(); return; }
    if (act === "opt") {
      var o = S.opts[+b.getAttribute("data-i")];
      if (o.ok) {
        o.state = "ok"; S.opts.forEach(function (x) { if (!x.ok) x.state = "dim"; });
        render(); speak(o.n[lang][0]);
        var res = st.lv <= 2 ? "choice" : (S.firstTry ? "good" : "almost");
        busy = true;
        setTimeout(function () { busy = false; if (screen === "item" && cur() === st) record(res); }, 1600);
      } else { o.state = "dim"; S.firstTry = false; render(); }
      return;
    }
    if (act === "rate") { rateAction(b.getAttribute("data-r")); }
  });

  /* "Try again" never marks a failure on screen: it adds the next level of support, then replays the model once. */
  function rateAction(r) {
    var st = cur(), t = T[lang];
    if (r === "good" || r === "almost") { record(r); return; }
    if (S.support < S.max) {
      S.support++; S.nudge = t.hintGiven; render();
      if (st.game === "name" && S.support === 3) speak(st.data[lang][0]);
      if (st.game === "script" && S.support === 2) speak(st.data.phrase);
      if (st.game === "seq") playSeq(st.data.items);
      return;
    }
    if (!S.replayed && st.game !== "describe") { S.replayed = true; S.nudge = t.again; render(); speakCurrent(st); return; }
    record("model");
  }

  document.documentElement.lang = lang;
  screen = getProfile() ? "home" : "onboard";
  render();
})();
