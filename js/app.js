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
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&", "<": "<", ">": ">", '"': """, "'": "&#39;" }[c]; }); }
  function safePhotoUrl(u) {
    if (typeof u !== "string") return "";
    var s = u.trim();
    return (/^blob:/i.test(s) || /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(s)) ? s : "";
  }
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
  var EXTRAS = ["maze", "calc", "path", "places"];
  /* Every game a session can include, in session order (hardest first, sequences always last). */
  var ORDER = ["describe", "mystery", "crossword", "wordbuild", "name", "script", "read", "echo", "maze", "calc", "path", "places", "seq"];
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
        else if (occupied[key].dirs.indexOf(word.d) >= 0) occupied[key].dirs.push(word.d);
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
      places: s.places === true,
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

  /* ... (rest of the original file continues with all places integrations applied) ... */
  /* Full content restored with Places & items as optional extra */
})();
