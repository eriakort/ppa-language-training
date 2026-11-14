(function () {
  "use strict";
  var app = document.getElementById("app");
  /* Extension points for modules loaded after this file (communication board, album):
     extra screens, click actions, actions that need the PIN in patient mode, and big buttons on home. */
  window.POG = window.POG || {};
  window.POG.ext = window.POG.ext || { screens: {}, actions: {}, locked: {}, home: [] };

  var activeProfileId = (function () { try { return localStorage.getItem("pog_active_profile_id") || ""; } catch (e) { return ""; } })();
  var GLOBAL_KEYS = { lang: true, profiles: true, active_profile_id: true };
  function storageKey(k) { return GLOBAL_KEYS[k] ? "pog_" + k : activeProfileId ? "pog_p_" + activeProfileId + "_" + k : "pog_" + k; }
  function save(k, v) { try { localStorage.setItem(storageKey(k), JSON.stringify(v)); if (!GLOBAL_KEYS[k]) window.dispatchEvent(new CustomEvent("pog:local-change", { detail: { key: k, profileId: activeProfileId } })); } catch (e) {} }
  function load(k) { try { var v = localStorage.getItem(storageKey(k)); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function profileList() { var p = load("profiles"); return Array.isArray(p) ? p : []; }
  function setActiveProfile(id) { activeProfileId = id; try { localStorage.setItem("pog_active_profile_id", id); window.dispatchEvent(new CustomEvent("pog:profile-change", { detail: { profileId: id } })); } catch (e) {} }
  function createLocalProfile(name) {
    var id = "lp-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var list = profileList(); list.push({ id: id, name: name || "", createdAt: new Date().toISOString() });
    save("profiles", list); setActiveProfile(id); return id;
  }
  function initializeLocalProfiles() {
    var list = profileList();
    if (!list.length) {
      var legacy = null; try { legacy = JSON.parse(localStorage.getItem("pog_profile") || "null"); } catch (e) {}
      if (legacy && legacy.name) {
        var id = createLocalProfile(legacy.name), keys = [];
        try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("pog_") === 0 && !/^pog_(profiles|active_profile_id|lang)$/.test(k) && k.indexOf("pog_p_") !== 0) keys.push(k); } } catch (e) {}
        keys.forEach(function (k) { try { localStorage.setItem("pog_p_" + id + "_" + k.slice(4), localStorage.getItem(k)); localStorage.removeItem(k); } catch (e) {} });
      }
    }
    list = profileList();
    if (!activeProfileId && list.length) setActiveProfile(list[0].id);
    if (activeProfileId && !list.some(function (p) { return p.id === activeProfileId; })) setActiveProfile(list.length ? list[0].id : "");
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function csvCell(value) {
    var text = value == null ? "" : String(value);
    if (typeof value === "string") {
      if (/^[\u0000-\u0020]*[=+\-@＝＋－＠]/.test(value)) text = "\t" + text;
      else if (/^[\t\r\n]/.test(value)) text = "'" + text;
    }
    return /[",;\u0000-\u001f]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  /* Language games, hardest first. The maze, calculations and letter path are optional and sit outside language scoring. */
  var GAMES = ["describe", "mystery", "crossword", "name", "wordbuild", "script", "read", "echo", "seq"];
  var MAXLV = { describe: 3, mystery: 4, crossword: 4, name: 4, wordbuild: 4, script: 3, read: 4, echo: 3, seq: 3 };
  var PLACE_N = { describe: 1, mystery: 2, crossword: 2, name: 2, wordbuild: 2, script: 2, read: 1, echo: 2, seq: 1 };
  var EXTRAS = ["maze", "calc", "path"];
  /* Every game a session can include, in session order (hardest first, sequences always last). */
  var ORDER = ["describe", "mystery", "crossword", "wordbuild", "name", "script", "read", "echo", "maze", "calc", "path", "seq"];
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5, flag: 0.4, place: 0.6 };

  var T = window.POG.strings, C = window.POG.content;
  var DESCRIBE = C.DESCRIBE, NAMING = C.NAMING, CROSS = C.CROSS_WORDS, ECHO = C.ECHO, SEQ = C.SEQ, DEFAULT_SCRIPTS = C.DEFAULT_SCRIPTS;
  var PACKS = C.PACKS, PACK_KEYS = C.PACK_KEYS, MYSTERY = C.MYSTERY, ANAGRAMS = C.ANAGRAMS, PATH_WORDS = C.PATH_WORDS;
  var ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var ALL_NAMES = NAMING.concat.apply(NAMING, PACK_KEYS.map(function (k) { return PACKS[k].name; }));

  /* Builds an 8–10 word crossword by adding perpendicular words at matching letters. */
  function genCross(list, seed, icon, extra) {
    var bank = [], seen = {};
    function addWords(words, group) {
      (words || []).forEach(function (item) {
        var w = String(item[0] || "").toUpperCase();
        if (!/^[A-Z]+$/.test(w) || !item[1] || seen[w]) return;
        seen[w] = true; bank.push({ w: w, clue: item[1], pic: icon, group: group });
      });
    }
    addWords(list, 0); addWords(extra, 1);
    if (bank.length < 8) return null;
    var shift = Math.abs(seed || 0) % bank.length;
    bank = bank.slice(shift).concat(bank.slice(0, shift));
    bank.sort(function (a, b) { return a.group - b.group; });
    var nodes = 0, maxNodes = 18000;
    function cellsFor(word) {
      var out = [];
      for (var i = 0; i < word.w.length; i++) out.push({
        r: word.r + (word.d === "d" ? i : 0), c: word.c + (word.d === "a" ? i : 0), ch: word.w[i]
      });
      return out;
    }
    function footprint(placed, candidate) {
      var all = [], minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
      placed.concat([candidate]).forEach(function (word) { cellsFor(word).forEach(function (cell) {
        all.push(cell); minR = Math.min(minR, cell.r); minC = Math.min(minC, cell.c);
        maxR = Math.max(maxR, cell.r); maxC = Math.max(maxC, cell.c);
      }); });
      return { cells: all, minR: minR, minC: minC, maxR: maxR, maxC: maxC,
        area: (maxR - minR + 1) * (maxC - minC + 1) };
    }
    function placementOptions(placed, item) {
      var occupied = {}, options = {}, out = [];
      placed.forEach(function (word) { cellsFor(word).forEach(function (cell) {
        var key = cell.r + "," + cell.c;
        if (!occupied[key]) occupied[key] = { ch: cell.ch, dirs: [word.d] };
        else if (occupied[key].dirs.indexOf(word.d) < 0) occupied[key].dirs.push(word.d);
      }); });
      placed.forEach(function (word) {
        for (var wi = 0; wi < word.w.length; wi++) for (var ni = 0; ni < item.w.length; ni++) {
          if (word.w[wi] !== item.w[ni]) continue;
          var d = word.d === "a" ? "d" : "a";
          var r = word.r + (word.d === "d" ? wi : (d === "a" ? 0 : -ni));
          var c = word.c + (word.d === "a" ? wi : (d === "a" ? -ni : 0));
          if (word.d === "a" && d === "d") { r = word.r - ni; c = word.c + wi; }
          if (word.d === "d" && d === "a") { r = word.r + wi; c = word.c - ni; }
          var key = d + ":" + r + ":" + c;
          if (options[key]) continue;
          var candidate = { w: item.w, r: r, c: c, d: d, clue: item.clue, pic: item.pic, group: item.group };
          var crossed = [], valid = true;
          cellsFor(candidate).forEach(function (cell) {
            var k = cell.r + "," + cell.c, prior = occupied[k];
            if (prior) {
              if (prior.ch !== cell.ch || prior.dirs.indexOf(d) >= 0 || prior.dirs.length !== 1) valid = false;
              else crossed.push(k);
            }
          });
          if (!valid || crossed.length !== 1) continue;
          var crossing = crossed[0], dc = d === "a" ? 1 : 0, dr = d === "d" ? 1 : 0;
          var first = { r: r, c: c }, last = { r: r + dr * (item.w.length - 1), c: c + dc * (item.w.length - 1) };
          if (occupied[(first.r - dr) + "," + (first.c - dc)] || occupied[(last.r + dr) + "," + (last.c + dc)]) continue;
          cellsFor(candidate).forEach(function (cell) {
            var k = cell.r + "," + cell.c;
            if (k === crossing) return;
            var sideA = d === "a" ? (cell.r - 1) + "," + cell.c : cell.r + "," + (cell.c - 1);
            var sideB = d === "a" ? (cell.r + 1) + "," + cell.c : cell.r + "," + (cell.c + 1);
            if (occupied[sideA] || occupied[sideB]) valid = false;
          });
          if (!valid) continue;
          var box = footprint(placed, candidate);
          if (box.maxR - box.minR + 1 > 16 || box.maxC - box.minC + 1 > 16) continue;
          options[key] = true;
          out.push({ word: candidate, area: box.area });
        }
      });
      return out;
    }
    function extend(placed, used, target) {
      if (placed.length >= target) return placed;
      if (++nodes > maxNodes) return null;
      var options = [];
      bank.forEach(function (item, idx) {
        if (used[item.w]) return;
        placementOptions(placed, item).forEach(function (option) {
          option.word.rank = idx; options.push(option);
        });
      });
      options.sort(function (a, b) { return a.word.group - b.word.group || a.area - b.area || a.word.rank - b.word.rank; });
      for (var i = 0; i < options.length; i++) {
        var word = options[i].word, nextUsed = Object.assign({}, used); nextUsed[word.w] = true;
        var result = extend(placed.concat([word]), nextUsed, target);
        if (result) return result;
        if (nodes > maxNodes) return null;
      }
      return null;
    }
    var targets = [Math.min(10, bank.length), 9, 8];
    for (var t = 0; t < targets.length; t++) {
      var target = targets[t]; if (target < 8 || (t && target === targets[t - 1])) continue;
      for (var root = 0; root < bank.length && nodes <= maxNodes; root++) {
        var first = bank[root], result = extend([{ w: first.w, r: 0, c: 0, d: "a", clue: first.clue, pic: first.pic, group: first.group }], (function () { var used = {}; used[first.w] = true; return used; })(), target);
        if (result) {
          var minR = Infinity, minC = Infinity;
          result.forEach(function (word) { cellsFor(word).forEach(function (cell) {
            minR = Math.min(minR, cell.r); minC = Math.min(minC, cell.c);
          }); });
          result.forEach(function (word) { word.r -= minR; word.c -= minC; delete word.group; delete word.rank; });
          return result.sort(function (a, b) { return a.r - b.r || a.c - b.c; });
        }
      }
    }
    return null;
  }

  var lang = load("lang") === "en" ? "en" : "it";
  var accountSignedOut = localStorage.getItem("pog_account_signed_out") === "1";
  var screen = "home";
  var lastRenderedScreen = null;
  var S = null, flash = "", confirmAsk = "", busy = false, pending = "start", picked = null, pickDraft = [], pickNudge = "";

  function getSettings() {
    var s = load("settings") || {};
    var lv = s.levels || {};
    GAMES.forEach(function (g) { var n = +lv[g]; lv[g] = (n >= 1 && n <= MAXLV[g]) ? n : 1; });
    var size = [4, 6, 8].indexOf(+s.mazeSize) >= 0 ? +s.mazeSize : 4;
    return { levels: lv, auto: s.auto !== false, allowUp: s.allowUp !== false, maze: s.maze === true, mazeSize: size,
      calc: s.calc === true, calcLevel: [1, 2, 3].indexOf(+s.calcLevel) >= 0 ? +s.calcLevel : 1,
      path: s.path === true, pathSize: [4, 5].indexOf(+s.pathSize) >= 0 ? +s.pathSize : 4,
      record: s.record === true, consentAt: s.consentAt || null, recordConcurrent: s.recordConcurrent == null ? !isMobile() : !!s.recordConcurrent,
      patientMode: s.patientMode === true };
  }

  /* ---------- patient mode ----------
     The learner sees exercises, the communication board and the album. Settings, phrases, profiles,
     language, the therapist area and the account menu need the PIN. Unlocking lasts 10 minutes, or
     until "Lock again" or a reload. */
  var UNLOCK_MS = 10 * 60 * 1000, unlockedAt = 0, afterUnlock = null;
  var LOCKED_ACTS = { settings: 1, scripts: 1, therapist: 1, profiles: 1, "profile-add": 1, "profile-switch": 1, lang: 1, caregiver: 1 };
  function isLocked() { return getSettings().patientMode && !(unlockedAt && Date.now() - unlockedAt < UNLOCK_MS); }
  function needsUnlock(act) { return isLocked() && !!(LOCKED_ACTS[act] || window.POG.ext.locked[act]); }
  /* Re-runs a click that was held back by the PIN screen. */
  function dispatchAct(spec) {
    var b = document.createElement("button");
    b.hidden = true; b.setAttribute("data-act", spec.act);
    Object.keys(spec.attrs || {}).forEach(function (k) { if (spec.attrs[k]) b.setAttribute(k, spec.attrs[k]); });
    app.appendChild(b); b.click();
    if (b.parentNode) b.parentNode.removeChild(b);
  }
  function getHistory() { var h = load("history"); return (h && typeof h === "object") ? h : {}; }
  function getProfile() { var p = load("profile"); return (p && p.name) ? p : null; }
  function updateProfileDirectory(p) { var list = profileList(), found = false; list = list.map(function (x) { if (x.id === activeProfileId) { found = true; return Object.assign({}, x, { name: p.name }); } return x; }); if (!found && activeProfileId) list.push({ id: activeProfileId, name: p.name, createdAt: new Date().toISOString() }); save("profiles", list); }
  function getPlacement() { var p = load("placement"); return (p && p.status) ? p : { status: "none", levels: {}, flags: [] }; }

  /* Active exercise checkpoint. The generated steps and live game state are saved
     together so a refresh resumes the exact item instead of rebuilding the session. */
  function persistActiveSession() {
    if (screen === "item" && S && S.i >= 0 && S.i < S.steps.length) {
      var checkpoint = JSON.parse(JSON.stringify(S));
      checkpoint.pendingRec = null; // Blob data belongs in IndexedDB, never localStorage.
      save("active_session", { version: 1, screen: "item", session: checkpoint, savedAt: new Date().toISOString() });
    } else {
      try { localStorage.removeItem(storageKey("active_session")); } catch (e) {}
    }
  }
  function restoreActiveSession() {
    var checkpoint = load("active_session");
    if (!checkpoint || checkpoint.version !== 1 || checkpoint.screen !== "item" || !checkpoint.session) return false;
    var session = checkpoint.session;
    if (!Array.isArray(session.steps) || !Array.isArray(session.log) ||
        typeof session.i !== "number" || session.i < 0 || session.i >= session.steps.length ||
        !session.steps[session.i] || (session.mode !== "session" && session.mode !== "place")) return false;
    session.started = new Date(session.started);
    if (isNaN(session.started.getTime())) return false;
    session.pendingRec = null;
    S = session;
    screen = "item";
    return true;
  }

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
  /* A family member's recording of this exact text, if one was made in the album, plays instead of the device voice. */
  var familyAudio = null;
  function speak(text, onend) {
    var fv = window.POG.familyVoice && window.POG.familyVoice.get(text);
    if (fv) {
      stopVoice();
      var done = false, a = new Audio(fv);
      var end = function () { if (!done) { done = true; if (familyAudio === a) familyAudio = null; if (onend) onend(); } };
      var fallback = function () { if (done) return; done = true; if (familyAudio === a) familyAudio = null; ttsSpeak(text, onend); };
      familyAudio = a; a.onended = end; a.onerror = fallback;
      var pl = a.play(); if (pl && pl.catch) pl.catch(fallback);
      return;
    }
    ttsSpeak(text, onend);
  }
  function ttsSpeak(text, onend) {
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
  function stopVoice() {
    if (familyAudio) { try { familyAudio.pause(); } catch (e) {} familyAudio = null; }
    if (tts) { try { speechSynthesis.cancel(); } catch (e) {} }
  }
  var ICON_SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
  var ICON_MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15zm6-3.5a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.9V22h2v-2.6a8 8 0 0 0 7-7.9h-2z"/></svg>';

  /* ---------- speech input (solo mode) and voice recording ----------
     js/speech.js turns speech into text; js/recorder.js records audio (only after consent) and measures it. */
  var micDenied = false, recOn = false, pacer = null;
  var L = { on: false, state: "idle", text: "", partial: "", step: null, timer: null, t0: 0, lastFin: "" };
  var SP = window.POG.createSpeech({
    onText: function (fin, interim) {
      if (!L.on) return;
      L.text = fin; L.partial = interim;
      updateHeard(); armSilence();
      if (fin !== L.lastFin) { L.lastFin = fin; liveCheck(); }
    },
    onState: function (state, reason) {
      L.state = state;
      if (state !== "idle") { if (L.on && screen === "item") render(); return; }
      var was = L.on, hadRec = recOn;
      L.on = false; clearTimeout(L.timer); stopPacer();
      if (!was) return;
      if (reason === "stopped") { finishRecording().then(evaluateSpoken); return; }
      cancelRecording();
      if (!S) return;
      var t = T[lang];
      if (reason === "denied" || reason === "unavailable") { micDenied = true; S.nudge = t.micDenied; }
      else if (reason === "retry") S.nudge = t.tapAgain;
      else if (reason === "dismissed") S.nudge = t.micDismissed;
      else if (reason === "capture" && hadRec) {
        /* This device can't record and recognise at once: recognise only from now on. */
        var s = getSettings(); s.recordConcurrent = false; save("settings", s);
        S.nudge = t.micConflict;
      }
      else if (reason !== "hidden") S.nudge = t.micBusy;
      if (screen === "item") render();
    },
    onReady: function () { if (screen === "mode" || screen === "item") render(); }
  });
  var REC = window.POG.createRecorder();
  var RECS = window.POG.recordings;
  var IN_HOST = !!(window.claude && typeof window.claude.use === "function");

  function micReady() { return SP.provider !== "none" && !micDenied; }
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  /* Recording needs consent, a browser that can record, and the normal website (the artifact host blocks it). */
  function recordingWanted() { return getSettings().record && REC.supported && !IN_HOST; }
  function micStart() {
    if (!micReady()) return;
    stopVoice();
    var st = cur();
    L.on = true; L.text = ""; L.partial = ""; L.lastFin = ""; L.step = st; L.state = "starting"; L.t0 = Date.now();
    S.nudge = "";
    SP.start(lang);
    recOn = false;
    if (recordingWanted() && getSettings().recordConcurrent) { recOn = true; REC.start().catch(function () { recOn = false; }); }
    if (st.game === "read" && st.lv >= 2) startPacer(st);
    render();
  }
  function micStop() { if (L.on) SP.stop(); }
  function micCancel() { if (L.on) { L.on = false; clearTimeout(L.timer); SP.cancel(); } cancelRecording(); stopPacer(); }
  function armSilence() {
    clearTimeout(L.timer);
    var g = L.step && L.step.game, ms = g === "describe" ? 20000 : g === "read" ? 15000 : 10000;
    L.timer = setTimeout(function () { if (L.on) micStop(); }, ms);
  }
  function updateHeard() {
    var el = document.getElementById("heard"); if (!el) return;
    el.innerHTML = '<span class="lbl">' + esc(T[lang].heardLabel) + '</span>' + esc(L.text) + (L.partial ? ' <em>' + esc(L.partial) + '</em>' : '');
  }
  function liveCheck() {
    var st = L.step;
    if (!st || !S || cur() !== st || st.game === "describe") return;
    if (bestVerdict(st, L.text) === "good") micStop();
  }
  function withRate(m) {
    var ms = m.speechMs || (m.totalMs - (m.onsetMs || 0));
    var wpm = m.words && ms > 0 ? Math.round(m.words / ms * 60000) : null;
    /* Outside 20-300 words a minute the timing was almost certainly mis-measured: show nothing rather than a wrong number. */
    m.wpm = wpm != null && wpm >= 20 && wpm <= 300 ? wpm : null;
    return m;
  }
  /* Speaking measures for the answer just given: from the audio when recording, otherwise from recogniser timing. */
  function finishRecording() {
    var tm = SP.timing(), words = toks(L.text + " " + L.partial).length;
    var base = { totalMs: Date.now() - L.t0, onsetMs: tm.firstSpeech ? tm.firstSpeech - tm.startedAt : null, speechMs: null, pauses: null, longestPauseMs: null, words: words, src: "timing" };
    if (!recOn) return Promise.resolve(withRate(base));
    recOn = false;
    return REC.stop().then(function (r) {
      if (!r) return withRate(base);
      var m = r.measures ? Object.assign({}, r.measures, { words: words, src: "audio" }) : base;
      withRate(m);
      if (r.blob && S) S.pendingRec = { blob: r.blob, mime: r.mime };
      return m;
    }, function () { return withRate(base); });
  }
  function cancelRecording() { if (recOn) { recOn = false; REC.cancel(); } }
  function saveRecording(st, heard, result) {
    var p = S && S.pendingRec;
    if (!p) return;
    S.pendingRec = null;
    var id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    S.recIds.push(id);
    RECS.add({ profileId: activeProfileId, id: id, t: Date.now(), session: S.id, game: st.game, lv: st.lv, label: itemLabel(st), heard: heard || "", result: result, measures: S.meas, mime: p.mime, blob: p.blob }).catch(function () {});
  }
  function bestVerdict(st, text) {
    var order = { good: 3, almost: 2, retry: 1, none: 0 }, best = "none";
    SP.candidates().concat([text]).forEach(function (c) { var v = judge(st, c); if (order[v] > order[best]) best = v; });
    return best;
  }
  function evaluateSpoken(meas) {
    var st = L.step;
    if (!S || screen !== "item" || cur() !== st) return;
    var text = (L.text + (L.partial ? " " + L.partial : "")).trim();
    L.partial = "";
    if (!text) { S.pendingRec = null; S.nudge = T[lang].heardNothing; render(); return; }
    S.heard.push(text); S.meas = meas;
    var v = bestVerdict(st, text);
    saveRecording(st, text, v === "good" || v === "almost" ? v : "retry");
    if (v === "good" || v === "almost") { record(v); return; }
    rateAction("retry");
    if (S && cur() === st) { S.nudge = T[lang].tryHelp; render(); }
  }
  /* Reading aloud: highlights one word at a time at a steady pace. */
  function startPacer(st) {
    stopPacer();
    var n = st.data.split(/\s+/).length, ms = st.lv === 2 ? 650 : st.lv === 3 ? 1000 : 900;
    S.paceIdx = 0; paintPace();
    pacer = setInterval(function () {
      if (!S || screen !== "item" || cur() !== st) { stopPacer(); return; }
      S.paceIdx++;
      if (S.paceIdx >= n) { S.paceIdx = n; stopPacer(); }
      paintPace();
    }, ms);
  }
  function stopPacer() { clearInterval(pacer); pacer = null; }
  function paintPace() {
    [].forEach.call(app.querySelectorAll(".rw"), function (el, i) {
      el.classList.toggle("on", i === S.paceIdx);
      el.classList.toggle("done", i < S.paceIdx);
    });
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
    if (st.game === "mystery") return [st.data.w].concat(st.data.alts || []).some(function (w) { return coverage(toks(w), heard) >= 1; }) ? "good" : "retry";
    if (st.game === "seq") return grade(coverage(toks(st.data.items.join(" ")), heard, 1), 0.8, 0.5);
    if (st.game === "echo" || st.game === "read") return grade(coverage(toks(st.data), heard), 0.8, 0.5);
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
  /* Up to two of the person's own album photos (family, familiar things) come first. */
  function albumNames() { return window.POG.album && window.POG.album.namingItems ? window.POG.album.namingItems() : []; }
  function pickNames(n, off) {
    var A = albumNames(), I = interestNames(), out = [], i;
    for (i = 0; i < Math.min(2, A.length, n - 1); i++) out.push(A[(off + i) % A.length]);
    if (!I.length) { for (i = 0; out.length < n; i++) out.push(NAMING[(off + i) % NAMING.length]); return out; }
    var fromI = Math.min(n - 1 - out.length, I.length);
    for (i = 0; i < fromI; i++) out.push(I[(off + i) % I.length]);
    for (i = 0; out.length < n; i++) out.push(NAMING[(off + i) % NAMING.length]);
    return out;
  }
  function pickBuild(n, off) {
    var ok = function (x) { var w = x[lang][0]; return w.length <= 8 && !/\s/.test(w); };
    var I = albumNames().filter(ok).concat(interestNames().filter(ok)), G = NAMING.filter(ok), out = [], i;
    var fromI = I.length ? Math.min(n - 1, I.length) : 0;
    for (i = 0; i < fromI; i++) out.push(I[(off + 2 + i) % I.length]);
    for (i = 0; out.length < n; i++) out.push(G[(off + 5 + i) % G.length]);
    /* One month or day to unscramble each time (an anagram, as on paper worksheets). */
    var A = ANAGRAMS.filter(ok);
    if (A.length && n >= 2) out[n - 1] = A[off % A.length];
    return out;
  }
  function pickCross(off) {
    var ks = myPacks();
    if (ks.length) {
      var k = ks[off % ks.length], gen = genCross(PACKS[k].cw[lang], off, PACKS[k].icon, CROSS[lang]);
      if (gen) return gen;
    }
    return genCross(CROSS[lang], off, "");
  }
  function pickEcho(lv, n, off) {
    var ks = myPacks();
    var src = ks.length ? PACKS[ks[off % ks.length]].echo[lang] : ECHO[lang];
    return src[lv - 1].slice(0, n);
  }

  /* A reading session uses several longer passages, paced according to the learner's level. */
  function pickRead(lv, n, off) {
    var pool = C.READ[lang].long, out = [];
    for (var i = 0; i < n; i++) out.push(pool[(off + i) % pool.length]);
    return out;
  }
  function makeSteps(g, lv, n, off) {
    var out = [], i;
    if (g === "describe") { var dp = describePool(); for (i = 0; i < n; i++) out.push({ game: g, lv: lv, data: dp[(off + i) % dp.length] }); }
    if (g === "crossword") {
      var pz = { p: pickCross(off), letters: {} };
      for (i = 0; i < pz.p.length; i++) out.push({ game: g, lv: lv, data: { pz: pz, wi: i } });
    }
    if (g === "name") pickNames(n, off).forEach(function (x) { out.push({ game: g, lv: lv, data: x }); });
    if (g === "mystery") { var mp = MYSTERY[lang]; for (i = 0; i < n; i++) { var m = mp[(off * n + i) % mp.length]; out.push({ game: g, lv: lv, data: { w: m[0], clues: m[1], alts: m[2] } }); } }
    if (g === "wordbuild") pickBuild(n, off).forEach(function (x) { out.push({ game: g, lv: lv, data: x }); });
    if (g === "script") {
      var sc = getScripts();
      for (i = 0; i < Math.min(n, sc.length); i++) { var p = sc[(off + i) % sc.length]; out.push({ game: g, lv: (lv === 1 && !p.cue) ? 2 : lv, data: p }); }
    }
    if (g === "echo") pickEcho(lv, n, off).forEach(function (p) { out.push({ game: g, lv: lv, data: p }); });
    if (g === "read") pickRead(lv, n, off).forEach(function (p) { out.push({ game: g, lv: lv, data: p }); });
    if (g === "seq") {
      var sq = SEQ[lang][off % SEQ[lang].length];
      if (lv === 3) sq = { label: sq.label, items: sq.items.slice(0, 5), show: sq.show ? sq.show.slice(0, 5) : null };
      out.push({ game: g, lv: lv, data: sq });
    }
    return out;
  }
  /* The games picked in the checklist (remembered per profile), or null for the usual daily plan. */
  function savedChoice() {
    var c = load("game_choice"), g = c && Array.isArray(c.games) ? c.games.filter(function (x) { return ORDER.indexOf(x) >= 0; }) : [];
    return g.length ? g : null;
  }
  function todayPlan(choice) {
    var day = Math.floor(Date.now() / 86400000), set = getSettings();
    if (choice && choice.length) return { day: day, list: ORDER.filter(function (g) { return choice.indexOf(g) >= 0; }), set: set, chosen: true };
    var letters = day % 2 ? "wordbuild" : "crossword";
    var list = ["describe", "mystery", letters, "name", "script", "read", "echo"];
    if (set.maze) list.push("maze");
    if (set.calc) list.push("calc");
    if (set.path) list.push("path");
    list.push("seq");
    return { day: day, list: list, set: set };
  }
  function buildSession(who, choice) {
    var tp = todayPlan(choice), L = tp.set.levels, d = tp.day, steps = [];
    tp.list.forEach(function (g) {
      if (g === "maze") { steps.push({ game: "maze", lv: null, data: { n: tp.set.mazeSize } }); return; }
      if (g === "calc") { makeCalc(tp.set.calcLevel, 5).forEach(function (q) { steps.push({ game: "calc", lv: null, data: q }); }); return; }
      if (g === "path") { steps.push({ game: "path", lv: null, data: makePath(tp.set.pathSize, d) }); return; }
      var n = { describe: 1, mystery: 2, crossword: 10, wordbuild: 3, name: 4, script: 2, read: 4, echo: 2, seq: 1 }[g];
      steps = steps.concat(makeSteps(g, L[g], n, d));
    });
    return { mode: "session", id: "s" + Date.now().toString(36), who: who, steps: steps, i: -1, log: [], stopped: false, started: new Date(), levels: L, games: tp.list };
  }
  function buildPlacement(who) {
    var pl = getPlacement();
    if (pl.status !== "in_progress") { pl = { status: "in_progress", levels: {}, flags: [] }; save("placement", pl); }
    var queue = GAMES.filter(function (g) { return !pl.levels[g]; });
    S = { mode: "place", id: "p" + Date.now().toString(36), who: who, steps: [], i: -1, log: [], stopped: false, started: new Date(), queue: queue, pg: null, plv: 1, blockLog: 0, off: Math.floor(Math.random() * 8), games: GAMES.slice(), results: [] };
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
    S.meas = null; S.recIds = []; S.pendingRec = null; S.paceIdx = -1;
    if (st.game === "describe") { S.support = st.lv - 1; S.max = 2; }
    if (st.game === "name") { if (st.lv <= 2) { S.support = st.lv - 1; S.max = 3; } else makeOpts(st); }
    if (st.game === "script") { S.support = st.lv - 1; S.max = 2; }
    if (st.game === "seq") { S.support = st.lv >= 2 ? 1 : 0; S.max = 1; }
    if (st.game === "crossword") { S.support = Math.min(st.lv - 1, 2); S.max = 2; setupCross(st); }
    if (st.game === "wordbuild") { S.support = st.lv - 1; S.max = 3; setupBuild(st); }
    if (st.game === "maze") { setupMaze(st.data.n); }
    if (st.game === "mystery") {
      if (st.lv <= 2) { S.support = st.lv === 2 ? 2 : 0; S.max = 3; if (S.support >= 3) makeOpts(st); }
      else makeOpts(st);
    }
    if (st.game === "calc") { S.opts = st.data.opts.map(function (v) { return { v: v, ok: v === st.data.ans }; }); }
    if (st.game === "path") { S.trail = []; S.pathHint = -1; S.wrongs = 0; }
    S.start = S.support;
  }
  function makeOpts(st) {
    if (st.game === "mystery") {
      var n = st.lv === 4 ? 1 : 2;
      var pool = shuffle(MYSTERY[lang].filter(function (m) { return m[0] !== st.data.w; })).slice(0, n);
      S.opts = shuffle([{ w: st.data.w, ok: true }].concat(pool.map(function (m) { return { w: m[0], ok: false }; })));
      return;
    }
    var others = shuffle(ALL_NAMES.filter(function (n) { return n !== st.data && n.pic !== st.data.pic && n[lang][0] !== st.data[lang][0]; })).slice(0, 2);
    S.opts = shuffle([st.data].concat(others)).map(function (n) { return { n: n, ok: n === st.data }; });
  }
  function target(st) {
    if (st.game === "crossword") return st.data.pz.p[st.data.wi].w;
    if (st.game === "mystery") return st.data.w.toUpperCase();
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
    if (st.game === "read") return st.data;
    if (st.game === "seq") return st.data.label;
    if (st.game === "maze") return st.data.n + "×" + st.data.n;
    if (st.game === "mystery") return st.data.w;
    if (st.game === "calc") return st.data.text;
    if (st.game === "path") return st.data.word.toLowerCase();
    return st.data;
  }
  function score(result, extra) {
    var base = { good: 1, almost: 0.5, choice: 0.5, model: 0, done: 1, skip: 0 }[result];
    return Math.max(0, base - 0.2 * extra);
  }
  function record(result) {
    var st = cur(), extra = Math.max(0, (S.support || 0) - (S.start || 0));
    var hasHints = ((st.game === "name" || st.game === "mystery") && st.lv <= 2) || ["describe", "script", "crossword", "wordbuild"].indexOf(st.game) >= 0;
    S.log.push({ game: st.game, lv: st.lv, label: itemLabel(st), hints: hasHints ? S.support : null, result: result, score: score(result, extra), ms: Date.now() - S.t0, heard: (S.heard || []).join(" / "), meas: S.meas || null, recIds: (S.recIds || []).slice() });
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
    saveSession();
    S.changes = changes; S.nextLevels = set.levels;
    screen = "summary"; render();
  }
  /* Keeps the last 60 sessions (results and speaking measures, no audio) for the therapist area. */
  function saveSession() {
    if (!S || !S.log.length) return;
    var all = load("sessions") || [];
    all = all.filter(function (x) { return x.id !== S.id; });
    all.push({ id: S.id, date: S.started.toISOString(), mode: S.mode, who: S.who, items: S.log.map(function (r) {
      return { game: r.game, lv: r.lv, label: r.label, result: r.result, score: r.score, hints: r.hints, ms: r.ms, heard: r.heard, meas: r.meas, recIds: r.recIds };
    }) });
    save("sessions", all.slice(-60));
    /* A compact copy for long-term progress statistics (kept much longer than full sessions). */
    if (window.POG.progress && window.POG.progress.record) { try { window.POG.progress.record(all[all.length - 1]); } catch (e) {} }
  }
  function finishPlacement(complete) {
    stopVoice();
    var pl = getPlacement();
    if (complete) { pl.status = "done"; save("placement", pl); }
    saveSession();
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
    var recBtn = recordingWanted()
      ? '<button class="tool rec-toggle' + (recOn ? ' on' : '') + '" data-act="arec">' + (recOn ? '■ ' + esc(t.recStop) : '● ' + esc(t.recStart)) + '</button>' : '';
    return '<div class="rate">' + nudge() + recBtn +
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
  function gameDetail(g, set) {
    var t = T[lang], L = set.levels;
    if (g === "maze") return t.sizes[set.mazeSize] + " · " + t.pickExtra;
    if (g === "calc") return t.calcLevels[set.calcLevel] + " · " + t.pickExtra;
    if (g === "path") return t.pathSizes[set.pathSize] + " · " + t.pickExtra;
    return t.level + ' ' + L[g] + ' · ' + t.lv[g][L[g] - 1];
  }
  var GAME_ICON = { describe: "💬", mystery: "❓", crossword: "✏️", wordbuild: "🔤", name: "🖼️", script: "🗨️", read: "📖", echo: "🔁", maze: "🧭", calc: "➗", path: "🔠", seq: "🔢" };
  function gameNames(list) { return list.map(function (g) { return T[lang].game[g]; }).join(" · "); }
  function viewPickAsk() {
    var t = T[lang], prev = savedChoice() || [];
    return header(false) + '<section class="card"><h1 class="instr">' + esc(t.askTitle) + '</h1>' +
      '<div class="modes">' +
      '<button class="modecard" data-act="pick-prev"><span class="ico" aria-hidden="true">↩️</span><strong>' + esc(t.askPrev) + '</strong><span>' + esc(gameNames(ORDER.filter(function (g) { return prev.indexOf(g) >= 0; }))) + '</span></button>' +
      '<button class="modecard" data-act="pick-new"><span class="ico" aria-hidden="true">☑️</span><strong>' + esc(t.askNew) + '</strong><span>' + esc(t.askNewDesc) + '</span></button>' +
      '</div><button class="link" data-act="home">' + esc(t.back) + '</button></section>';
  }
  function viewPick() {
    var t = T[lang], set = getSettings();
    var items = ORDER.map(function (g) {
      var on = pickDraft.indexOf(g) >= 0;
      return '<button class="pickitem' + (on ? ' on' : '') + '" data-act="pick-toggle" data-g="' + g + '" role="checkbox" aria-checked="' + on + '">' +
        '<span class="pk-box" aria-hidden="true">' + (on ? '✓' : '') + '</span><span class="pk-ico" aria-hidden="true">' + GAME_ICON[g] + '</span>' +
        '<span class="pk-txt"><strong>' + esc(t.game[g]) + '</strong><span>' + esc(gameDetail(g, set)) + '</span></span></button>';
    }).join("");
    return header(false) + '<section class="card"><h1 class="instr">' + esc(t.pickTitle) + '</h1><p class="sub">' + esc(t.pickHelp) + '</p>' +
      '<div class="row-actions"><button class="secondary" data-act="pick-all">' + esc(t.pickAll) + '</button><button class="secondary" data-act="pick-none">' + esc(t.pickNone) + '</button></div>' +
      '<div class="picklist" role="group" aria-label="' + esc(t.pickTitle) + '">' + items + '</div>' +
      '<p class="sub">' + esc(fill(t.pickCount, { n: pickDraft.length })) + '</p>' +
      (pickNudge ? '<p class="nudge">' + esc(pickNudge) + '</p>' : '') +
      '<button class="primary" data-act="pick-next">' + esc(t.pickNext) + '</button>' +
      '<button class="link" data-act="home">' + esc(t.back) + '</button></section>';
  }
  function viewMode() {
    var t = T[lang];
    return header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.who) + '</h1>' +
      '<div class="modes">' +
      '<button class="modecard" data-act="who" data-w="solo"><span class="ico" aria-hidden="true">🙂</span><strong>' + esc(t.soloTitle) + '</strong><span>' + esc(t.soloDesc) + '</span></button>' +
      '<button class="modecard" data-act="who" data-w="assist"><span class="ico" aria-hidden="true">🤝</span><strong>' + esc(t.assistTitle) + '</strong><span>' + esc(t.assistDesc) + '</span></button>' +
      '</div>' +
      '<p class="note">' + esc(SP.provider === "host" ? t.micNoteHost : SP.provider === "browser" ? t.micNoteBrowser : t.noMic) + '</p>' +
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

  function viewProfiles() {
    var t = T[lang], list = profileList();
    return header(false) + '<section class="card home"><h1>' + esc(t.profilesTitle) + '</h1><p class="sub">' + esc(t.profilesHelp) + '</p>' + langSeg() +
      '<div class="profile-list">' + list.map(function (p) { return '<button class="modecard profile-card" data-act="profile-switch" data-id="' + esc(p.id) + '"><strong>' + esc(p.name || t.unnamedProfile) + '</strong><span>' + esc(p.id === activeProfileId ? t.profileCurrent : t.profileChoose) + '</span></button>'; }).join("") + '</div>' +
      '<button class="primary" data-act="profile-add">' + esc(t.profileAdd) + '</button><button class="link" data-act="home">' + esc(t.back) + '</button><p class="note">' + esc(t.localNote) + '</p></section>';
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
  function viewUnlock() {
    var t = T[lang];
    return header(false) + '<section class="card"><h1 class="instr">' + esc(t.unlockTitle) + '</h1><p class="sub">' + esc(t.unlockHelp) + '</p>' +
      '<div class="field"><label for="un-pin">' + esc(t.pinEnter) + '</label><input id="un-pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8"></div>' +
      (flash ? '<p class="nudge">' + esc(flash) + '</p>' : '') +
      '<button class="primary" data-act="unlock-try">' + esc(t.unlockBtn) + '</button>' +
      '<button class="link" data-act="unlock-cancel">' + esc(t.cancel) + '</button></section>';
  }
  /* Big buttons on the home screen added by modules (communication board, album). */
  function homeExtras() {
    var list = window.POG.ext.home || [];
    if (!list.length) return "";
    list = list.filter(function (h) { try { return !h.show || h.show(); } catch (e) { return false; } });
    if (!list.length) return "";
    return '<div class="homebtns">' + list.map(function (h) {
      return '<button class="homebtn" data-act="' + esc(h.act) + '"><span class="hb-ico" aria-hidden="true">' + h.icon + '</span><span>' + esc(h.label[lang] || h.label.it) + '</span></button>';
    }).join("") + '</div>';
  }
  function langSeg() {
    return '<div class="seg" role="group" aria-label="Lingua / Language">' +
      '<button data-act="lang" data-l="it" aria-pressed="' + (lang === "it") + '">Italiano</button>' +
      '<button data-act="lang" data-l="en" aria-pressed="' + (lang === "en") + '">English</button></div>';
  }
  function viewHome() {
    var t = T[lang], tp = todayPlan(savedChoice()), L = tp.set.levels, prof = getProfile(), pl = getPlacement();
    var greeting = accountSignedOut ? t.helloGuest : fill(t.hello, { name: prof.name });
    var pending = pl.status === "in_progress", locked = isLocked(), patient = tp.set.patientMode;
    return header(false) +
      '<section class="card home">' +
      '<h1>' + esc(greeting) + '</h1><p class="sub">' + esc(t.tagline) + '</p>' + (locked ? '' : langSeg()) +
      (myPacks().length || prof.other ? '<div class="mychips" aria-label="' + esc(t.yourInterests) + '">' + myPacks().map(function (k) { return '<span>' + PACKS[k].icon + ' ' + esc(PACKS[k].label[lang]) + '</span>'; }).join("") + (prof.other ? '<span>💬 ' + esc(prof.other) + '</span>' : '') + '</div>' : '') +
      '<p class="tag">' + esc(t.planTitle) + '</p>' +
      '<div class="scale" aria-hidden="true"><span>↑ ' + esc(t.hard) + '</span></div>' +
      '<ol class="plan">' + tp.list.map(function (g) {
        var detail = gameDetail(g, tp.set);
        return '<li><strong>' + esc(t.game[g]) + '</strong><span>' + esc(detail) + '</span></li>';
      }).join("") + '</ol>' +
      '<div class="scale" aria-hidden="true"><span>↓ ' + esc(t.easy) + '</span></div>' +
      (pending
        ? '<button class="primary" data-act="place">' + esc(t.placeContinue) + '</button><button class="link" data-act="start">' + esc(t.startAnyway) + '</button>'
        : '<button class="primary" data-act="start">' + esc(t.start) + '</button>') +
      homeExtras() +
      (locked
        ? '<div class="links"><button class="link" data-act="caregiver">' + esc(t.caregiver) + '</button></div>'
        : '<div class="links"><button class="link" data-act="profiles">' + esc(t.changeProfile) + '</button><button class="link" data-act="scripts">' + esc(t.scripts) + '</button>' +
          '<button class="link" data-act="settings">' + esc(t.settings) + '</button>' +
          '<button class="link" data-act="therapist">' + esc(t.thArea) + '</button>' +
          (patient ? '<button class="link" data-act="relock">' + esc(t.relock) + '</button>' : '') + '</div>') +
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
  /* ---------- consent for voice recording ---------- */
  function viewConsent() {
    var t = T[lang];
    return header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.consentTitle) + '</h1>' +
      '<ul class="consent">' + t.consentPoints.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul>' +
      '<label class="check"><input type="checkbox" id="consent-ok">' + esc(t.consentCheck) + '</label>' +
      (flash ? '<p class="nudge">' + esc(flash) + '</p>' : '') +
      '<button class="primary" data-act="consent-yes">' + esc(t.consentYes) + '</button>' +
      '<button class="link" data-act="settings">' + esc(t.back) + '</button></section>';
  }

  /* ---------- therapist area (PIN) ---------- */
  var TH = { unlocked: false, recs: null, urls: [], confirm: "", changing: false };
  function hashPin(pin) {
    var salted = "pog-pin-v1:" + pin;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted)).then(function (b) {
        return [].map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      });
    }
    var h = 5381;
    for (var i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
    return Promise.resolve("d" + (h >>> 0).toString(16));
  }
  function thLock() { TH.urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); TH = { unlocked: false, recs: null, urls: [], confirm: "", changing: false }; }
  function thLoad() {
    RECS.list(activeProfileId).then(function (list) { TH.recs = list; if (screen === "therapist") render(); }, function () { TH.recs = []; if (screen === "therapist") render(); });
  }
  function fmtS(ms) { return ms == null ? "–" : (ms / 1000).toFixed(1).replace(".", lang === "it" ? "," : "."); }
  function avg(list) { var v = list.filter(function (x) { return x != null; }); return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null; }
  function measLine(m) {
    var t = T[lang]; if (!m) return "";
    var parts = [t.mOnset + " " + fmtS(m.onsetMs) + " s"];
    if (m.wpm != null) parts.push(m.wpm + " " + t.mWpm);
    if (m.pauses != null) parts.push(t.mPauses + " " + m.pauses + (m.pauses ? " (" + t.mLongest + " " + fmtS(m.longestPauseMs) + " s)" : ""));
    return parts.join(" · ");
  }
  function viewTherapist() {
    var t = T[lang], pin = load("pin");
    var head = header(false) + '<section class="card"><h1 class="instr">' + esc(t.thArea) + '</h1>';
    var foot = (flash ? '<p class="nudge">' + esc(flash) + '</p>' : '') + '<button class="link" data-act="home">' + esc(t.back) + '</button></section>';
    if (!pin || TH.changing) {
      return head + '<p class="sub">' + esc(t.pinCreateHelp) + '</p>' +
        '<div class="field"><label for="th-pin1">' + esc(t.pinNew) + '</label><input id="th-pin1" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8"></div>' +
        '<div class="field"><label for="th-pin2">' + esc(t.pinRepeat) + '</label><input id="th-pin2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8"></div>' +
        '<button class="primary" data-act="pin-set">' + esc(t.pinSave) + '</button><p class="note">' + esc(t.pinNote) + '</p>' + foot;
    }
    if (!TH.unlocked) {
      return head + '<div class="field"><label for="th-pin">' + esc(t.pinEnter) + '</label><input id="th-pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8"></div>' +
        '<button class="primary" data-act="pin-enter">' + esc(t.pinOpen) + '</button>' +
        (TH.confirm === "forgot"
          ? '<div class="confirm"><span>' + esc(t.pinForgotQ) + '</span><button class="secondary" data-act="pin-forgot-yes">' + esc(t.yes) + '</button><button class="secondary" data-act="th-cancel">' + esc(t.no) + '</button></div>'
          : '<button class="link" data-act="pin-forgot">' + esc(t.pinForgot) + '</button>') + foot;
    }
    var sessions = (load("sessions") || []).slice().reverse();
    var rows = sessions.slice(0, 12).map(function (s) {
      var sp = s.items.filter(function (i) { return i.meas; });
      var d = new Date(s.date).toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", { day: "numeric", month: "short" });
      return '<tr><td>' + esc(d) + '</td><td>' + esc(s.mode === "place" ? t.placeTag : (s.who === "solo" ? t.soloTitle : t.assistTitle)) + '</td><td class="n">' + sp.length + '</td>' +
        '<td class="n">' + fmtS(avg(sp.map(function (i) { return i.meas.onsetMs; }))) + '</td>' +
        '<td class="n">' + (avg(sp.map(function (i) { return i.meas.wpm; })) == null ? "–" : Math.round(avg(sp.map(function (i) { return i.meas.wpm; })))) + '</td>' +
        '<td class="n">' + (avg(sp.map(function (i) { return i.meas.pauses; })) == null ? "–" : avg(sp.map(function (i) { return i.meas.pauses; })).toFixed(1).replace(".", lang === "it" ? "," : ".")) + '</td>' +
        '<td class="n">' + fmtS(avg(sp.map(function (i) { return i.meas.longestPauseMs; }))) + '</td></tr>';
    }).join("");
    var trend = sessions.length
      ? '<div class="tbl"><table><thead><tr><th>' + esc(t.thDate) + '</th><th>' + esc(t.thMode) + '</th><th>' + esc(t.thSpoken) + '</th><th>' + esc(t.mOnset) + ' (s)</th><th>' + esc(t.mWpm) + '</th><th>' + esc(t.mPauses) + '</th><th>' + esc(t.mLongest) + ' (s)</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : '<p class="sub">' + esc(t.thNoSessions) + '</p>';
    var recHtml;
    if (TH.recs === null) { recHtml = '<p class="sub">…</p>'; thLoad(); }
    else if (!TH.recs.length) recHtml = '<p class="sub">' + esc(getSettings().record ? t.thNoRecs : t.thRecOff) + '</p>';
    else {
      TH.urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
      TH.urls = [];
      recHtml = '<ul class="recs">' + TH.recs.slice(0, 60).map(function (r) {
        var url = r.blob ? URL.createObjectURL(r.blob) : ""; if (url) TH.urls.push(url);
        var when = new Date(r.t).toLocaleString(lang === "it" ? "it-IT" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        var ext = /mp4|aac/.test(r.mime || "") ? "m4a" : /ogg/.test(r.mime || "") ? "ogg" : "webm";
        return '<li class="rec"><div class="rec-h"><strong>' + esc(t.game[r.game] || r.game) + (r.lv ? ' · ' + esc(t.level) + ' ' + r.lv : '') + '</strong><span>' + esc(when) + '</span></div>' +
          '<p class="rec-item">' + esc(r.label) + '</p>' +
          (r.heard ? '<p class="rec-heard"><span class="lbl">' + esc(t.colHeard) + '</span>' + esc(r.heard) + '</p>' : '') +
          (r.measures ? '<p class="note">' + esc(measLine(r.measures)) + '</p>' : '') +
          (url ? '<audio controls preload="none" src="' + url + '"></audio>' : '') +
          '<div class="row-actions">' + (url && !IN_HOST ? '<a class="secondary dl" href="' + url + '" download="' + esc((r.game || "rec") + "-" + new Date(r.t).toISOString().slice(0, 16).replace(/[:T]/g, "-") + "." + ext) + '">' + esc(t.download) + '</a>' : '') +
          (TH.confirm === r.id
            ? '<button class="secondary danger" data-act="rec-del-yes" data-id="' + esc(r.id) + '">' + esc(t.confirmDelete) + '</button><button class="secondary" data-act="th-cancel">' + esc(t.no) + '</button>'
            : '<button class="secondary" data-act="rec-del" data-id="' + esc(r.id) + '">' + esc(t.del) + '</button>') + '</div></li>';
      }).join("") + '</ul>';
    }
    return head +
      '<div class="report"><h2>' + esc(t.thTrends) + '</h2>' + trend + '<p class="note">' + esc(t.thTrendsNote) + '</p>' +
      '<div class="row-actions"><button class="secondary" data-act="chk-results">' + esc(t.thCheckins) + '</button><button class="secondary" data-act="report">' + esc(t.thReport) + '</button>' +
        (window.POG.progress ? '<button class="secondary" data-act="progress">' + esc(window.POG.progress.label()) + '</button>' : '') + '</div>' +
      (window.POG.progress && window.POG.progress.localAlerts().length ? '<p class="nudge">⚠ ' + esc(t.thAlert) + '</p>' : '') +
      '<h2>' + esc(t.thRecs) + '</h2>' + recHtml +
      '<p class="note">' + esc(fill(t.thRetention, { n: RECS.retentionDays })) + '</p>' +
      '<div class="row-actions">' +
      (IN_HOST ? '' : '<button class="secondary" data-act="export">' + esc(t.exportCsv) + '</button>') +
      (TH.confirm === "clear"
        ? '<button class="secondary danger" data-act="rec-clear-yes">' + esc(t.clearRecsQ) + '</button><button class="secondary" data-act="th-cancel">' + esc(t.no) + '</button>'
        : '<button class="secondary" data-act="rec-clear">' + esc(t.clearRecs) + '</button>') +
      '<button class="secondary" data-act="pin-change">' + esc(t.pinChange) + '</button>' +
      '<button class="secondary" data-act="th-lock">' + esc(t.lock) + '</button></div></div>' + foot;
  }
  function exportCsv() {
    var t = T[lang], sessions = load("sessions") || [];
    var lines = [["date", "session", "mode", "player", "game", "level", "item", "heard", "result", "hints", "time_s", "onset_s", "speech_s", "pauses", "longest_pause_s", "words", "words_per_min", "measure_source"].join(",")];
    sessions.forEach(function (s) {
      s.items.forEach(function (i) {
        var m = i.meas || {};
        lines.push([s.date, s.id, s.mode, s.who, i.game, i.lv, i.label, i.heard, i.result, i.hints, i.ms == null ? "" : (i.ms / 1000).toFixed(1),
          m.onsetMs == null ? "" : (m.onsetMs / 1000).toFixed(2), m.speechMs == null ? "" : (m.speechMs / 1000).toFixed(2),
          m.pauses == null ? "" : m.pauses, m.longestPauseMs == null ? "" : (m.longestPauseMs / 1000).toFixed(2), m.words == null ? "" : m.words, m.wpm == null ? "" : m.wpm, m.src || ""].map(csvCell).join(","));
      });
    });
    var blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "parole-ogni-giorno-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    flash = t.exported;
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
      '<h2>' + esc(t.secVoice) + '</h2>' +
      (IN_HOST ? '<p class="note">' + esc(t.recInHost) + '</p>'
        : (set.record
          ? '<p class="note">' + esc(fill(t.recOnSince, { d: set.consentAt ? new Date(set.consentAt).toLocaleDateString(lang === "it" ? "it-IT" : "en-GB") : "–" })) + '</p>' +
            '<label class="check"><input type="checkbox" id="set-conc"' + (set.recordConcurrent ? ' checked' : '') + '>' + esc(t.recConcurrent) + '</label>' +
            '<div class="row-actions"><button class="secondary" data-act="rec-off">' + esc(t.recTurnOff) + '</button></div>'
          : '<p class="note">' + esc(REC.supported ? t.recOff : t.recUnsupported) + '</p>' +
            (REC.supported ? '<div class="row-actions"><button class="secondary" data-act="rec-on">' + esc(t.recTurnOn) + '</button></div>' : ''))) +
      '<div class="row-actions"><button class="secondary" data-act="therapist">' + esc(t.thArea) + '</button></div>' +
      '<h2>' + esc(t.secPatient) + '</h2>' +
      '<label class="check"><input type="checkbox" id="set-patient"' + (set.patientMode ? ' checked' : '') + '>' + esc(t.patientMode) + '</label>' +
      '<p class="note">' + esc(t.patientHelp) + '</p>' +
      '<h2>' + esc(t.secOptions) + '</h2>' +
      '<label class="check"><input type="checkbox" id="set-maze"' + (set.maze ? ' checked' : '') + '>' + esc(t.mazeOn) + '</label>' +
      '<div class="setrow"><label for="set-msize">' + esc(t.mazeSize) + '</label><select id="set-msize">' +
      [4, 6, 8].map(function (n) { return '<option value="' + n + '"' + (set.mazeSize === n ? ' selected' : '') + '>' + esc(t.sizes[n]) + '</option>'; }).join("") + '</select></div>' +
      '<label class="check"><input type="checkbox" id="set-calc"' + (set.calc ? ' checked' : '') + '>' + esc(t.calcOn) + '</label>' +
      '<div class="setrow"><label for="set-clevel">' + esc(t.calcLevel) + '</label><select id="set-clevel">' +
      [1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (set.calcLevel === n ? ' selected' : '') + '>' + esc(t.calcLevels[n]) + '</option>'; }).join("") + '</select></div>' +
      '<label class="check"><input type="checkbox" id="set-path"' + (set.path ? ' checked' : '') + '>' + esc(t.pathOn) + '</label>' +
      '<div class="setrow"><label for="set-psize">' + esc(t.pathSize) + '</label><select id="set-psize">' +
      [4, 5].map(function (n) { return '<option value="' + n + '"' + (set.pathSize === n ? ' selected' : '') + '>' + esc(t.pathSizes[n]) + '</option>'; }).join("") + '</select></div>' +
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
    } else if (st.game === "mystery") {
      body += viewMystery(st);
    } else if (st.game === "calc") {
      body += viewCalc(st);
    } else if (st.game === "path") {
      body += viewPath(st);
    } else if (st.game === "name" && st.lv <= 2) {
      var w = st.data[lang], h = "";
      if (S.support >= 1) h += '<div class="hint"><b>1</b><span>' + esc(w[1]) + '</span></div>';
      if (S.support >= 2) h += '<div class="hint"><b>2</b><span>' + esc(t.startsWith) + ' «' + esc(w[2]) + '»</span></div>';
      if (S.support >= 3) h += '<div class="hint word">' + esc(w[0]) + '</div>';
      body += '<p class="instr">' + esc(t.nameInstr) + '</p>' +
        '<div class="pic" role="img" aria-label="' + esc(w[0]) + '">' + picHtml(st.data) + '</div>' +
        (h ? '<div class="hints">' + h + '</div>' : '') + optsHtml(false) +
        '<div class="tools">' + hintBtn() + '<button class="tool" data-act="choice"' + (S.opts ? ' disabled' : '') + '>' + esc(t.choiceBtn) + '</button></div>' + rateRow();
    } else if (st.game === "name" && st.lv === 3) {
      body += '<p class="instr">' + esc(t.pickWord) + '</p>' +
        '<div class="pic" role="img" aria-label="?">' + picHtml(st.data) + '</div>' + optsHtml(false);
    } else if (st.game === "name") {
      body += '<p class="instr">' + esc(t.matchInstr) + '</p>' +
        '<div class="tools">' + listenBtn() + '</div>' + noTtsNote() +
        (tts ? '' : '<p class="phrase">' + esc(st.data[lang][0]) + '</p>') + optsHtml(true);
    } else if (st.game === "script") {
      var p = st.data;
      if (S.support === 0) body += '<p class="instr">' + esc(t.whatSay) + '</p><p class="cue">' + esc(p.cue) + '</p>';
      else body += (p.cue ? '<p class="cue">' + esc(p.cue) + '</p>' : '') + '<p class="instr">' + esc(S.support >= 2 ? t.echoInstr : t.readAloud) + '</p><p class="phrase">' + esc(p.phrase) + '</p>';
      body += '<div class="tools">' + (S.support < S.max ? hintBtn() : listenBtn()) + '</div>' + (S.support >= 2 ? noTtsNote() : '') + rateRow();
    } else if (st.game === "read") {
      var words = st.data.split(/\s+/), useMic = S.who === "solo" && micReady();
      var readSteps = S.steps.filter(function (step) { return step.game === "read"; });
      var readPosition = readSteps.indexOf(st) + 1;
      body += '<p class="instr">' + esc(st.lv === 1 ? t.readFree : st.lv === 4 ? t.readListen : t.readPaced) + '</p>' +
        '<p class="sub">' + esc(fill(t.readProgress, { current: readPosition, total: readSteps.length })) + '</p>' +
        '<p class="passage">' + words.map(function (w, i) { return '<span class="rw' + (i === S.paceIdx ? ' on' : (i < S.paceIdx ? ' done' : '')) + '">' + esc(w) + '</span>'; }).join(" ") + '</p>' +
        '<div class="tools">' + (st.lv === 4 || S.replayed ? listenBtn() : '') +
        (st.lv >= 2 && !useMic ? '<button class="tool" data-act="pace">' + esc(t.startPace) + '</button>' : '') + '</div>' + rateRow();
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
    return '<p class="instr">' + esc(t.cwInstr) + '</p><p class="sub">' + esc(fill(t.cwProgress, { current: st.data.wi + 1, total: pz.p.length })) + '</p>' +
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
      (S.support >= 1 ? '<div class="pic sm" aria-hidden="true">' + picHtml(st.data) + '</div>' : '') +
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
  /* Mystery word: five clue words point to one word. Hints: first letter, then some letters, then a choice. */
  function mysteryPattern(w) {
    return w.toUpperCase().split("").map(function (ch, i, a) {
      if (ch === " ") return " ";
      return (i % 3 === 0 || i === a.length - 1) ? ch : "_";
    }).join(" ");
  }
  function viewMystery(st) {
    var t = T[lang], d = st.data, h = "";
    var clues = '<div class="chips clues">' + d.clues.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join("") + '</div>';
    if (st.lv >= 3) {
      return '<p class="instr">' + esc(st.lv === 4 ? t.myListen : t.myPick) + '</p>' + clues +
        '<div class="tools">' + listenBtn() + '</div>' + noTtsNote() + optsHtml(false);
    }
    if (S.support >= 1) h += '<div class="hint"><b>1</b><span>' + esc(fill(t.myStarts, { l: d.w[0].toUpperCase(), n: d.w.replace(/\s/g, "").length })) + '</span></div>';
    if (S.support >= 2) h += '<div class="hint"><b>2</b><span class="pattern" aria-label="' + esc(t.myLetters) + '">' + esc(mysteryPattern(d.w)) + '</span></div>';
    return '<p class="instr">' + esc(t.myInstr) + '</p>' + clues +
      (h ? '<div class="hints">' + h + '</div>' : '') + optsHtml(false) +
      '<div class="tools">' + listenBtn() + (S.support < S.max ? hintBtn() : '') + '</div>' + rateRow();
  }

  /* Calculations (optional, outside the language levels): the double or the half of a number, choose from four. */
  function fmtNum(v) { var x = Math.round(v * 100) / 100; return String(x).replace(".", lang === "it" ? "," : "."); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function makeCalc(level, n) {
    var out = [], seen = {};
    for (var k = 0; out.length < n && k < 200; k++) {
      var dbl = Math.random() < 0.5, x;
      if (level === 1) x = dbl ? rnd(2, 20) : rnd(1, 10) * 2;
      else if (level === 2) x = dbl ? rnd(11, 50) : rnd(10, 50) * 2;
      else x = dbl ? rnd(11, 60) + 0.5 : (Math.random() < 0.5 ? rnd(50, 499) * 2 + 1 : rnd(20, 99) + 0.5);
      var key = (dbl ? "d" : "h") + x; if (seen[key]) continue; seen[key] = 1;
      var ans = dbl ? x * 2 : x / 2;
      var steps = level === 3 ? [0.25, 0.5, 1, 2, 10] : [1, 2, 10, 4];
      var opts = [ans], j = 0;
      while (opts.length < 4 && j < 40) {
        var dlt = steps[j % steps.length] * (j % 2 ? -1 : 1) * (1 + Math.floor(j / (steps.length * 2))); j++;
        var v = Math.round((ans + dlt) * 100) / 100;
        if (v > 0 && opts.indexOf(v) < 0) opts.push(v);
      }
      out.push({ dbl: dbl, x: x, ans: ans, opts: shuffle(opts), text: fill(dbl ? T[lang].calcDouble : T[lang].calcHalf, { n: fmtNum(x) }) });
    }
    return out;
  }
  function viewCalc(st) {
    var t = T[lang];
    return '<p class="instr">' + esc(t.calcInstr) + '</p><p class="cue">' + esc(st.data.text) + '</p>' +
      '<div class="tools">' + listenBtn() + '</div>' + '<div class="calc-opts">' + optsHtml(false) + '</div>';
  }

  /* Letter path (optional, outside the language levels): a word of a category hidden as a path of
     neighbouring letters. Start at the arrow and tap the next letter each time. */
  function makePath(n, seed) {
    var groups = PATH_WORDS[lang], max = n === 4 ? 7 : 10, tries = 0;
    while (tries++ < 50) {
      var g = groups[(seed + tries) % groups.length], words = g[1].filter(function (w) { return w.length >= 3 && w.length <= max; });
      if (!words.length) continue;
      var word = words[Math.floor(Math.random() * words.length)], path = pathWalk(n, word.length);
      if (!path) continue;
      var alpha = lang === "it" ? "ABCDEFGILMNOPRSTUVZ" : "ABCDEFGHIKLMNOPRSTUWY", grid = [];
      for (var i = 0; i < n * n; i++) grid.push(alpha[Math.floor(Math.random() * alpha.length)]);
      path.forEach(function (c, i) { grid[c] = word[i]; });
      return { cat: g[0], word: word, n: n, grid: grid, path: path };
    }
    return { cat: groups[0][0], word: groups[0][1][0], n: n, grid: groups[0][1][0].split(""), path: [0, 1, 2, 3] };
  }
  function pathAdj(n, a, b) { var ra = Math.floor(a / n), rb = Math.floor(b / n); return Math.abs(ra - rb) + Math.abs(a % n - b % n) === 1; }
  function pathWalk(n, len) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var path = [rnd(0, n * n - 1)], used = {};
      used[path[0]] = true;
      while (path.length < len) {
        var c = path[path.length - 1], nb = [c - n, c + n, c - 1, c + 1].filter(function (x) { return x >= 0 && x < n * n && pathAdj(n, c, x) && !used[x]; });
        if (!nb.length) break;
        var nx = nb[Math.floor(Math.random() * nb.length)]; used[nx] = true; path.push(nx);
      }
      if (path.length === len) return path;
    }
    return null;
  }
  function viewPath(st) {
    var t = T[lang], d = st.data, n = d.n, html = "", on = {};
    S.trail.forEach(function (c, i) { on[c] = i + 1; });
    for (var i = 0; i < n * n; i++) {
      var cls = "pc" + (on[i] ? " on" : "") + (!S.trail.length && i === d.path[0] ? " start" : "") + (i === S.pathHint ? " phint" : "") + (S.solved && on[i] ? " ok" : "");
      html += '<button class="' + cls + '" data-act="pcell" data-i="' + i + '" aria-label="' + esc(d.grid[i]) + (on[i] ? " " + on[i] : "") + '">' + esc(d.grid[i]) + '</button>';
    }
    var shown = d.word.split("").map(function (ch, i) { return i < S.trail.length ? ch : "_"; }).join(" ");
    return '<p class="instr">' + esc(S.solved ? t.pathDone : t.pathInstr) + '</p>' +
      '<p class="cue">' + esc(fill(t.pathCat, { c: d.cat })) + '</p>' +
      '<p class="model pattern" aria-live="polite">' + esc(shown) + '</p>' + nudge() +
      '<div class="cwbox"><div class="pgrid" style="--n:' + n + '">' + html + '</div></div>' +
      (S.solved ? '' : '<div class="tools"><button class="tool" data-act="path-hint">' + esc(t.hintBtn) + '</button>' +
        '<button class="tool" data-act="path-restart">' + esc(t.pathRestart) + '</button>' +
        '<button class="tool" data-act="path-skip">' + esc(t.pathSkip) + '</button></div>');
  }
  function pathTap(st, i) {
    var d = st.data, tr = S.trail, t = T[lang];
    if (S.solved) return;
    var ok = !tr.length ? i === d.path[0]
      : (tr.indexOf(i) < 0 && pathAdj(d.n, tr[tr.length - 1], i) && d.grid[i] === d.word[tr.length]);
    if (!ok) {
      if (tr.length && tr[tr.length - 1] === i) { tr.pop(); S.pathHint = -1; S.nudge = ""; render(); return; }
      S.firstTry = false; S.nudge = tr.length ? t.pathWrong : t.pathStart; render(); return;
    }
    tr.push(i); S.pathHint = -1; S.nudge = "";
    if (tr.length === d.word.length) {
      S.solved = true; render(); speak(d.word.toLowerCase());
      var res = S.firstTry && S.support === 0 ? "good" : "almost";
      busy = true;
      setTimeout(function () { busy = false; if (screen === "item" && cur() === st) record(res); }, 1500);
      return;
    }
    render();
  }
  function pathHint(st) {
    var d = st.data, tr = S.trail, k = tr.length;
    for (var j = 0; j < k; j++) if (tr[j] !== d.path[j]) { S.trail = d.path.slice(0, j); k = j; break; }
    S.pathHint = d.path[k]; S.support++; S.nudge = ""; render();
  }
  /* An item's picture: the album photo when there is one, otherwise its icon. */
  function picHtml(d) { return d && d.photo ? '<img src="' + esc(d.photo) + '" alt="">' : (d && d.pic) || ""; }
  function optsHtml(pictures) {
    if (!S.opts) return "";
    return '<div class="opts">' + S.opts.map(function (o, i) {
      var label = o.w != null ? esc(o.w) : o.v != null ? esc(fmtNum(o.v)) : pictures ? picHtml(o.n) : esc(o.n[lang][0]);
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
    var resetScroll = lastRenderedScreen !== screen;
    var savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    var focused = app.contains(document.activeElement) ? document.activeElement : null;
    var focusAct = focused && focused.getAttribute("data-act");
    var focusCh = focusAct === "key" ? focused.getAttribute("data-ch") : "";
    persistActiveSession();
    document.documentElement.setAttribute("data-patient-lock", isLocked() ? "1" : "0");
    var extView = window.POG.ext.screens[screen];
    var html = extView ? extView() : screen === "unlock" ? viewUnlock() : screen === "therapist" ? viewTherapist() : screen === "consent" ? viewConsent() : screen === "mode" ? viewMode() : screen === "pick" ? viewPick() : screen === "pick-ask" ? viewPickAsk() : screen === "profiles" ? viewProfiles() : screen === "onboard" ? viewOnboard() : screen === "home" ? viewHome() : screen === "scripts" ? viewScripts() : screen === "settings" ? viewSettings() : screen === "item" ? viewItem() : viewSummary();
    app.innerHTML = html;
    flash = "";
    lastRenderedScreen = screen;
    if (resetScroll) window.scrollTo(0, 0);
    else window.scrollTo(0, savedScrollY);
    if (focusAct === "key" && focusCh) {
      var nextKey = app.querySelector('.key[data-act="key"][data-ch="' + focusCh + '"]');
      if (nextKey) nextKey.focus({ preventScroll: true });
    } else if (focusAct === "del") {
      var deleteKey = app.querySelector('.key[data-act="del"]');
      if (deleteKey) deleteKey.focus({ preventScroll: true });
    }
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
    else if (st.game === "mystery") speak(st.data.clues.join(", "));
    else if (st.game === "calc") speak(st.data.text);
    else if (st.game === "script") speak(st.data.phrase);
    else if (st.game === "echo" || st.game === "read") speak(st.data);
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

  window.addEventListener("pog:authchange", function (ev) {
    accountSignedOut = !!(ev.detail && ev.detail.signedOut);
    if (screen === "home") render();
  });

  app.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled || busy) return;
    var act = b.getAttribute("data-act"), t = T[lang];
    if (unlockedAt && Date.now() - unlockedAt >= UNLOCK_MS) unlockedAt = 0;
    if (needsUnlock(act)) {
      afterUnlock = { act: act === "caregiver" ? "settings" : act, attrs: { "data-id": b.getAttribute("data-id"), "data-l": b.getAttribute("data-l") } };
      stopVoice(); screen = "unlock"; render();
      var pinIn = document.getElementById("un-pin"); if (pinIn) pinIn.focus();
      return;
    }
    if (act === "caregiver") { screen = "settings"; render(); return; }
    if (act === "unlock-cancel") { afterUnlock = null; screen = "home"; render(); return; }
    if (act === "relock") { unlockedAt = 0; screen = "home"; render(); return; }
    if (act === "unlock-try") {
      hashPin(val("un-pin")).then(function (h) {
        if (h && h === load("pin")) {
          unlockedAt = Date.now();
          var next = afterUnlock; afterUnlock = null; screen = "home";
          if (next) dispatchAct(next); else render();
        } else { flash = t.pinWrong; render(); }
      });
      return;
    }
    if (window.POG.ext.actions[act]) { window.POG.ext.actions[act](b, e); return; }
    if (act === "lang") { lang = b.getAttribute("data-l") === "en" ? "en" : "it"; save("lang", lang); document.documentElement.lang = lang; window.dispatchEvent(new CustomEvent("pog:languagechange", { detail: { lang: lang } })); rerenderKeep(); return; }
    if (act === "int") { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); return; }
    if (act === "onboard-place" || act === "onboard-skip") {
      var p = readProfile("pf-"); if (!p) { rerenderKeep(); return; }
      if (!activeProfileId) createLocalProfile(p.name);
      save("profile", p); updateProfileDirectory(p);
      if (act === "onboard-skip") { save("placement", { status: "skipped", levels: {}, flags: [] }); screen = "settings"; render(); return; }
      save("placement", { status: "in_progress", levels: {}, flags: [] });
      pending = "place"; screen = "mode"; render(); return;
    }
    if (act === "profiles") { screen = "profiles"; render(); return; }
    if (act === "profile-add") { createLocalProfile(""); S = null; screen = "onboard"; render(); return; }
    if (act === "profile-switch") { var targetId = b.getAttribute("data-id"); if (targetId && targetId !== activeProfileId && profileList().some(function (p) { return p.id === targetId; })) { stopVoice(); micCancel(); S = null; setActiveProfile(targetId); screen = getProfile() ? "home" : "onboard"; } else screen = "home"; render(); return; }
    if (act === "place") { pending = act; screen = "mode"; render(); return; }
    /* Starting a session: continue with the games picked last time, or tick a new selection. */
    if (act === "start") {
      pending = "start"; pickNudge = "";
      if (savedChoice()) { screen = "pick-ask"; render(); return; }
      pickDraft = todayPlan().list.slice(); screen = "pick"; render(); return;
    }
    if (act === "pick-prev") { picked = savedChoice(); screen = "mode"; render(); return; }
    if (act === "pick-new" || act === "pick-open") { pickDraft = (savedChoice() || todayPlan().list).slice(); pickNudge = ""; pending = "start"; screen = "pick"; render(); return; }
    if (act === "pick-toggle") {
      var pg = b.getAttribute("data-g"), at = pickDraft.indexOf(pg);
      if (at >= 0) pickDraft.splice(at, 1); else pickDraft.push(pg);
      pickNudge = ""; render(); return;
    }
    if (act === "pick-all") { pickDraft = ORDER.slice(); pickNudge = ""; render(); return; }
    if (act === "pick-none") { pickDraft = []; pickNudge = ""; render(); return; }
    if (act === "pick-next") {
      if (!pickDraft.length) { pickNudge = t.pickNeed; render(); return; }
      picked = ORDER.filter(function (g) { return pickDraft.indexOf(g) >= 0; });
      save("game_choice", { games: picked, at: new Date().toISOString() });
      screen = "mode"; render(); return;
    }
    if (act === "who") {
      var who = b.getAttribute("data-w") === "assist" ? "assist" : "solo";
      if (pending === "place") { if (buildPlacement(who)) { screen = "item"; next(); } else { finishPlacement(true); } return; }
      S = buildSession(who, picked); screen = "item"; next(); return;
    }
    if (act === "scripts" || act === "settings") { confirmAsk = ""; screen = act; render(); return; }
    if (act === "home") { stopVoice(); if (S) micCancel(); confirmAsk = ""; thLock(); screen = "home"; render(); return; }
    if (act === "therapist") { confirmAsk = ""; TH.confirm = ""; screen = "therapist"; render(); return; }
    if (act === "pin-set") {
      var p1 = val("th-pin1"), p2 = val("th-pin2");
      if (!/^\d{4,8}$/.test(p1)) { flash = t.pinBad; render(); return; }
      if (p1 !== p2) { flash = t.pinMismatch; render(); return; }
      hashPin(p1).then(function (h) { save("pin", h); TH.changing = false; TH.unlocked = true; TH.recs = null; flash = t.pinSaved; render(); });
      return;
    }
    if (act === "pin-enter") {
      var pe = val("th-pin");
      hashPin(pe).then(function (h) {
        if (h === load("pin")) { TH.unlocked = true; TH.recs = null; } else flash = t.pinWrong;
        render();
      });
      return;
    }
    if (act === "pin-forgot") { TH.confirm = "forgot"; render(); return; }
    if (act === "pin-forgot-yes") {
      RECS.clear(activeProfileId).catch(function () {}).then(function () { save("sessions", []); save("pin", null); thLock(); flash = t.pinReset; render(); });
      return;
    }
    if (act === "th-cancel") { TH.confirm = ""; render(); return; }
    if (act === "th-lock") { thLock(); screen = "home"; render(); return; }
    if (act === "pin-change") { TH.changing = true; render(); return; }
    if (act === "rec-del") { TH.confirm = b.getAttribute("data-id"); render(); return; }
    if (act === "rec-del-yes") {
      RECS.remove(b.getAttribute("data-id")).catch(function () {}).then(function () { TH.confirm = ""; TH.recs = null; flash = t.recDeleted; render(); });
      return;
    }
    if (act === "rec-clear") { TH.confirm = "clear"; render(); return; }
    if (act === "rec-clear-yes") {
      RECS.clear(activeProfileId).catch(function () {}).then(function () { TH.confirm = ""; TH.recs = null; flash = t.recsCleared; render(); });
      return;
    }
    if (act === "export") { exportCsv(); render(); return; }
    if (act === "rec-on") { screen = "consent"; render(); return; }
    if (act === "consent-yes") {
      if (!document.getElementById("consent-ok").checked) { flash = t.consentNeed; render(); return; }
      var cs = getSettings(); cs.record = true; cs.consentAt = new Date().toISOString(); save("settings", cs);
      if (!load("pin")) { flash = t.pinFirst; screen = "therapist"; } else { flash = t.recEnabled; screen = "settings"; }
      render(); return;
    }
    if (act === "rec-off") { var ro = getSettings(); ro.record = false; save("settings", ro); flash = t.recDisabled; render(); return; }
    if (act === "save-scripts") {
      var lines = document.getElementById("scripts-ta").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      if (!lines.length) { flash = t.emptyScripts; render(); return; }
      save("scripts_" + lang, lines); flash = t.saved; render(); return;
    }
    if (act === "save-settings") {
      var pr = readProfile("set-"); if (!pr) { rerenderKeep(); return; }
      save("profile", pr); updateProfileDirectory(pr);
      var set = getSettings();
      GAMES.forEach(function (g) { set.levels[g] = +document.getElementById("lv-" + g).value; });
      set.auto = document.getElementById("set-auto").checked;
      set.allowUp = document.getElementById("set-up").checked;
      set.maze = document.getElementById("set-maze").checked;
      set.mazeSize = +document.getElementById("set-msize").value;
      set.calc = document.getElementById("set-calc").checked;
      set.calcLevel = +document.getElementById("set-clevel").value;
      set.path = document.getElementById("set-path").checked;
      set.pathSize = +document.getElementById("set-psize").value;
      var conc = document.getElementById("set-conc"); if (conc) set.recordConcurrent = conc.checked;
      var pm = document.getElementById("set-patient"), wantPatient = !!(pm && pm.checked);
      if (wantPatient && !load("pin")) {
        /* Patient mode without a PIN would lock everyone out: create the PIN first. */
        set.patientMode = false; save("settings", set); flash = t.patientNeedsPin; screen = "therapist"; render(); return;
      }
      if (wantPatient && !set.patientMode) unlockedAt = Date.now();
      set.patientMode = wantPatient;
      save("settings", set); flash = wantPatient ? t.patientOn : t.setSaved; render(); return;
    }
    if (act === "ask-reset" || act === "ask-redo") { confirmAsk = act === "ask-reset" ? "reset" : "redo"; render(); return; }
    if (act === "confirm-no") { confirmAsk = ""; render(); return; }
    if (act === "confirm-yes") {
      var which = confirmAsk; confirmAsk = "";
      if (which === "reset") {
        var s0 = getSettings();
        save("history", {}); save("settings", { auto: s0.auto, allowUp: s0.allowUp, maze: s0.maze, mazeSize: s0.mazeSize, calc: s0.calc, calcLevel: s0.calcLevel, path: s0.path, pathSize: s0.pathSize, record: s0.record, consentAt: s0.consentAt, recordConcurrent: s0.recordConcurrent });
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
    if (act === "pcell") { pathTap(st, +b.getAttribute("data-i")); return; }
    if (act === "path-hint") { pathHint(st); return; }
    if (act === "path-restart") { S.trail = []; S.pathHint = -1; S.nudge = ""; render(); return; }
    if (act === "path-skip") { record("skip"); return; }
    if (act === "hint") {
      S.support = Math.min(S.max, S.support + 1); S.nudge = "";
      applySupport(st); render();
      if (st.game === "name" && S.support === 3) speak(st.data[lang][0]);
      if (st.game === "mystery" && S.support === 3 && !S.opts) { makeOpts(st); render(); }
      if (st.game === "script" && S.support === 2) speak(st.data.phrase);
      return;
    }
    if (act === "choice") { makeOpts(st); render(); return; }
    if (act === "opt") {
      var o = S.opts[+b.getAttribute("data-i")];
      if (o.ok) {
        o.state = "ok"; S.opts.forEach(function (x) { if (!x.ok) x.state = "dim"; });
        render(); speak(o.w != null ? o.w : o.v != null ? fmtNum(o.v) : o.n[lang][0]);
        var res = st.game === "calc" ? (S.firstTry ? "good" : "almost") : st.lv <= 2 ? "choice" : (S.firstTry ? "good" : "almost");
        busy = true;
        setTimeout(function () { busy = false; if (screen === "item" && cur() === st) record(res); }, 1600);
      } else { o.state = "dim"; S.firstTry = false; render(); }
      return;
    }
    if (act === "pace") { startPacer(st); return; }
    if (act === "arec") {
      if (!recOn) {
        recOn = true; L.t0 = Date.now();
        REC.start().then(function () { render(); }, function () { recOn = false; S.nudge = t.recFail; render(); });
        render();
      } else stopAssistRec();
      return;
    }
    if (act === "rate") {
      var rr = b.getAttribute("data-r");
      if (S.who === "assist" && recOn) { stopAssistRec(rr).then(function () { rateAction(rr); }); return; }
      rateAction(rr);
    }
  });

  /* Assisted mode: the helper records an answer; it is saved with the rating given. */
  function stopAssistRec(result) {
    if (!recOn) return Promise.resolve();
    recOn = false;
    var st = cur();
    return REC.stop().then(function (r) {
      if (r && S && cur() === st) {
        S.meas = r.measures ? withRate(Object.assign({}, r.measures, { words: null, src: "audio" })) : null;
        if (r.blob) { S.pendingRec = { blob: r.blob, mime: r.mime }; saveRecording(st, "", result || "unrated"); }
      }
      if (!result) render();
    }, function () { if (!result) render(); });
  }

  /* "Try again" never marks a failure on screen: it adds the next level of support, then replays the model once. */
  function rateAction(r) {
    var st = cur(), t = T[lang];
    if (r === "good" || r === "almost") { record(r); return; }
    if (S.support < S.max) {
      S.support++; S.nudge = t.hintGiven;
      if (st.game === "mystery" && S.support === 3 && !S.opts) makeOpts(st);
      render();
      if (st.game === "name" && S.support === 3) speak(st.data[lang][0]);
      if (st.game === "script" && S.support === 2) speak(st.data.phrase);
      if (st.game === "seq") playSeq(st.data.items);
      return;
    }
    if (!S.replayed && st.game !== "describe") { S.replayed = true; S.nudge = t.again; render(); speakCurrent(st); return; }
    record("model");
  }

  initializeLocalProfiles();
  RECS.assignLegacy(activeProfileId).catch(function () {});
  document.documentElement.lang = lang;
  /* What the communication board and album modules may use. */
  window.POG.appApi = {
    t: function () { return T[lang]; }, lang: function () { return lang; }, esc: esc, fill: fill,
    load: load, save: save, header: header, render: render,
    go: function (s) { screen = s; render(); }, screen: function () { return screen; },
    flash: function (m) { flash = m; }, flashText: function () { return flash; },
    speak: speak, stopVoice: stopVoice, isLocked: isLocked,
    profileId: function () { return activeProfileId; }, getScripts: getScripts, getProfile: getProfile,
    canRecord: function () { return REC.supported && !IN_HOST; },
    /* Recording is on and consented; with concurrent, also allowed while speech recognition listens. */
    recordingAllowed: function (concurrent) { return recordingWanted() && (!concurrent || getSettings().recordConcurrent); },
    therapistUnlocked: function () { return !!TH.unlocked; }, therapistView: function () { screen = "therapist"; return viewTherapist(); }, lockTherapist: function () { thLock(); },
    settings: getSettings, games: function () { return GAMES.slice(); }, maxLevels: function () { return Object.assign({}, MAXLV); }, inHost: function () { return IN_HOST; },
    history: function () { return load("history") || {}; }, sessions: function () { var s = load("sessions"); return Array.isArray(s) ? s : []; }
  };
  RECS.purge().catch(function () {});
  if (!restoreActiveSession()) screen = getProfile() ? "home" : "onboard";
  render();
})();
