/*
 * Rhythmic Speech & Inter-Syllabic Pacing Coach Module (bilingual IT & EN).
 *
 * Implements Metronomic / Inter-Syllabic Pacing & Sound Production Treatment (IPT / SPT)
 * specifically supporting nfvPPA & Primary Progressive Apraxia of Speech (PPAOS):
 *   - Visual-auditory syllable beat stepper with adjustable tempo (Slow 950ms / Steady 700ms / Natural 500ms)
 *   - Soft Web Audio woodblock pulse on each beat (no external assets, safe silent fallback)
 *   - Optional tactile syllable tap-through AND optional Web Speech verification
 *   - Errorless "Slow down & replay" recovery alongside clinician/partner/self smoothness ratings
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var BANK = window.POG && window.POG.content && window.POG.content.PACING;
  if (!api || !BANK) return;
  var esc = api.esc;

  var MAXLV = 3;
  var KEEP = 120;
  var TEMPOS = { slow: 950, steady: 700, natural: 500 };
  var RULE = { down: 0.6, downN: 3, up: 0.9, upN: 5 };

  var C = {
    it: {
      title: "Ritmo e sillabe",
      desc: "Allena l'articolazione scandendo le sillabe una alla volta con battito guidato.",
      lvNames: ["Impegnativo", "Intermedio", "Con più supporto"],
      lvTag: "Livello {n} · {name}",
      stepOf: "Parola {i} di {n}",
      stop: "Termina",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio",
      tempoLabel: "Velocità del ritmo",
      tempos: { slow: "Lento (0,95 s)", steady: "Regolare (0,7 s)", natural: "Scorrevole (0,5 s)" },
      promptInstr: "Pronuncia ad alta voce seguendo il ritmo delle sillabe:",
      beatBtn: "🥁 Avvia battito",
      listenSlow: "🔊 Modello lento",
      tapTip: "Oppure tocca ogni sillaba mentre la pronunci.",
      micBtn: "🎙️ Prova con il microfono",
      listening: "Ti ascolto…",
      heardLabel: "Ho sentito",
      smoothBtn: "Fluida a ritmo",
      effortBtn: "Completata con fatica",
      retryBtn: "Rallenta e riprova",
      skipBtn: "Salta",
      nextBtn: "Avanti",
      doneMsg: {
        good: "Ottimo ritmo e articolazione chiara!",
        almost: "Completata con impegno — la scansione aiuta i suoni difficili.",
        skip: "Passiamo alla prossima senza fretta."
      },
      retryHint: "Ritmo impostato su «Lento»: segui una sillaba per volta senza fretta.",
      sumTitle: "Allenamento ritmico completato",
      sumDone: "Tutte le parole scandite sono state salvate su questo dispositivo.",
      sumStopped: "Ci fermiamo qui. Le prove completate sono state salvate.",
      colWord: "Parola / Frase", colRes: "Esito", colTempo: "Ritmo",
      res: { good: "Fluida", almost: "Con fatica", skip: "Saltata" }
    },
    en: {
      title: "Speech pacing coach",
      desc: "Practise clear speech syllable by syllable with a calm visual and audio beat.",
      lvNames: ["Demanding", "Standard", "More support"],
      lvTag: "Level {n} · {name}",
      stepOf: "Item {i} of {n}",
      stop: "Stop",
      backVar: "Back to targeted practice",
      backHome: "Back to home",
      tempoLabel: "Beat tempo",
      tempos: { slow: "Slow (0.95 s)", steady: "Steady (0.7 s)", natural: "Natural (0.5 s)" },
      promptInstr: "Say this aloud one syllable beat at a time:",
      beatBtn: "🥁 Start paced beat",
      listenSlow: "🔊 Slow model",
      tapTip: "Or tap each syllable tile as you say it.",
      micBtn: "🎙️ Try with microphone",
      listening: "Listening…",
      heardLabel: "Heard",
      smoothBtn: "Smooth on the beat",
      effortBtn: "Said with effort",
      retryBtn: "Slow down & retry",
      skipBtn: "Skip",
      nextBtn: "Next",
      doneMsg: {
        good: "Smooth rhythm and clear syllable transitions!",
        almost: "Finished with effort — steady pacing builds control.",
        skip: "Moving calmly to the next item."
      },
      retryHint: "Switched beat tempo to Slow — take one syllable at a time.",
      sumTitle: "Speech pacing complete",
      sumDone: "All paced speech items have been saved locally.",
      sumStopped: "Stopping here. Completed items have been saved.",
      colWord: "Word / Phrase", colRes: "Outcome", colTempo: "Tempo",
      res: { good: "Smooth", almost: "Effortful", skip: "Skipped" }
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

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function getLevel() {
    var lv = +api.load("pacing_level");
    return (lv >= 1 && lv <= MAXLV) ? lv : 2;
  }

  function listSessions() {
    var s = api.load("pacing_sessions");
    return Array.isArray(s) ? s : [];
  }

  function buildDrill(lv, langCode) {
    var lc = langCode === "en" ? "en" : "it";
    var pool = BANK[lc] || BANK.it;
    var atLv = shuffle(pool.filter(function (x) { return x.lv === lv; }));
    var other = shuffle(pool.filter(function (x) { return x.lv !== lv; }));
    return atLv.concat(other).slice(0, 4).map(function (item) {
      return { lv: item.lv, data: item };
    });
  }

  var audioCtx = null;
  function playPulse(accent) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = accent ? 660 : 520;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {}
  }

  function speakSlow(text) {
    if (!text) return;
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = api.lang() === "it" ? "it-IT" : "en-GB";
        u.rate = 0.72;
        window.speechSynthesis.speak(u);
        return;
      }
    } catch (e) {}
    if (api.speak) api.speak(text);
  }

  function computePacingProfile(sessions) {
    var out = {
      total: 0, smooth: 0, effortful: 0, skipped: 0,
      fluency: null,
      tempos: { slow: 0, steady: 0, natural: 0 }
    };
    var sumScore = 0;
    (sessions || []).forEach(function (s) {
      (s && s.items || []).forEach(function (it) {
        if (!it) return;
        out.total++;
        sumScore += (+it.score || 0);
        if (it.result === "good") out.smooth++;
        else if (it.result === "almost") out.effortful++;
        else out.skipped++;
        if (it.tempo && out.tempos[it.tempo] != null) out.tempos[it.tempo]++;
      });
    });
    if (out.total) out.fluency = Math.round((sumScore / out.total) * 1000) / 1000;
    return out;
  }

  var PC = null;
  var beatTimer = null;
  var speechEngine = null;

  function clearBeat() {
    if (beatTimer) { clearTimeout(beatTimer); beatTimer = null; }
  }

  function cancelMic() {
    if (speechEngine) { try { speechEngine.cancel(); } catch (e) {} }
  }

  function ensureSpeech() {
    if (speechEngine || !window.POG.createSpeech) return speechEngine;
    speechEngine = window.POG.createSpeech({
      onState: function (state) {
        if (!PC || !PC.st || api.screen() !== "pacing") return;
        PC.st.micState = state;
        if (state === "idle" && PC.st.heard) {
          var step = curStep();
          if (step && norm(PC.st.heard).indexOf(norm(step.data.word)) >= 0 && !PC.st.done) {
            recordCurrent("good", 1);
          }
        }
        api.render();
      },
      onText: function (fin, interim) {
        if (!PC || !PC.st || api.screen() !== "pacing") return;
        PC.st.heard = (fin + " " + interim).trim();
        api.render();
      }
    });
    return speechEngine;
  }

  function makeStepState(step, tempo) {
    return {
      startedAt: Date.now(),
      tempo: tempo || (step.lv === 1 ? "slow" : "steady"),
      activeIdx: -1,
      tapped: {},
      beatRuns: 0,
      retries: 0,
      heard: "",
      micState: "idle",
      nudge: "",
      done: false,
      result: null
    };
  }

  function startDrill() {
    clearBeat(); cancelMic();
    if (api.stopVoice) api.stopVoice();
    var lv = getLevel();
    var steps = buildDrill(lv, api.lang());
    if (!steps.length) return;
    PC = {
      id: "pc" + Date.now().toString(36),
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
    api.go("pacing");
  }

  function curStep() { return PC && PC.steps[PC.i]; }

  function runBeatSequence() {
    clearBeat();
    var step = curStep(), st = PC && PC.st;
    if (!step || !st || st.done) return;
    var syls = step.data.syllables || [];
    var ms = TEMPOS[st.tempo] || TEMPOS.steady;
    st.beatRuns++;
    var idx = 0;
    function tick() {
      if (!PC || PC.st !== st || api.screen() !== "pacing") return;
      st.activeIdx = idx;
      st.tapped[idx] = true;
      playPulse(idx === 0);
      api.render();
      idx++;
      if (idx < syls.length) {
        beatTimer = setTimeout(tick, ms);
      } else {
        beatTimer = setTimeout(function () {
          if (PC && PC.st === st) { st.activeIdx = -1; api.render(); }
        }, ms);
      }
    }
    tick();
  }

  function recordCurrent(result, scoreVal) {
    clearBeat(); cancelMic();
    if (!PC || !curStep() || !PC.st || PC.st.recorded) return;
    PC.st.recorded = true;
    var step = curStep(), st = PC.st;
    st.done = true;
    st.result = result;
    PC.log.push({
      game: "pacing",
      lv: step.lv,
      kind: step.data.clusterTag,
      id: step.data.id,
      label: step.data.word,
      result: result,
      tempo: st.tempo,
      retries: st.retries,
      heard: st.heard || "",
      score: scoreVal,
      hints: st.retries,
      ms: Date.now() - st.startedAt
    });
  }

  function saveAndAdapt() {
    if (!PC || !PC.log.length || PC.saved) return;
    PC.saved = true;
    var mean = PC.log.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / PC.log.length;
    var sess = {
      id: PC.id,
      date: new Date().toISOString(),
      mode: "pacing",
      who: PC.who,
      lv: PC.lv,
      fluency: Math.round(mean * 1000) / 1000,
      items: PC.log.slice()
    };
    var all = listSessions().concat([sess]).slice(-KEEP);
    api.save("pacing_sessions", all);

    var curLv = getLevel();
    var avgs = all.map(function (s) {
      var items = s.items || [];
      return items.length ? items.reduce(function (a, b) { return a + (+b.score || 0); }, 0) / items.length : null;
    }).filter(function (v) { return v != null; });

    if (avgs.length >= RULE.downN) {
      var r3 = avgs.slice(-RULE.downN);
      if (r3.reduce(function (a, b) { return a + b; }, 0) / r3.length < RULE.down && curLv < MAXLV) {
        api.save("pacing_level", curLv + 1);
        PC.levelChange = { from: curLv, to: curLv + 1 };
        return;
      }
    }
    var vs = api.load("variant_settings") || {};
    if (vs.allowUp !== false && avgs.length >= RULE.upN) {
      var r5 = avgs.slice(-RULE.upN);
      if (r5.reduce(function (a, b) { return a + b; }, 0) / r5.length >= RULE.up && curLv > 1) {
        api.save("pacing_level", curLv - 1);
        PC.levelChange = { from: curLv, to: curLv - 1 };
      }
    }
  }

  /* ---------- Views ---------- */
  function viewSummary() {
    var t = T();
    var rows = PC.log.map(function (r) {
      return '<tr><td>' + esc(r.label) + '</td><td><span class="pill ' + esc(r.result) + '">' + esc(t.res[r.result] || r.result) + '</span></td>' +
        '<td>' + esc(t.tempos[r.tempo] || r.tempo) + '</td></tr>';
    }).join("");
    var ch = PC.levelChange ? '<ul class="changes"><li>' + esc(t.title + ": " + api.t().level + " " + PC.levelChange.from + " → " + PC.levelChange.to) + '</li></ul>' : '';
    return api.header(false) + '<section class="card">' +
      '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(PC.stopped ? t.sumStopped : t.sumDone) + '</p>' +
      (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colWord) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colTempo) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + ch + '</div>' : '') +
      '<button type="button" class="primary" data-act="pace-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="link" data-act="pace-home-exit">' + esc(t.backHome) + '</button></section>';
  }

  function viewScreen() {
    if (!PC) { startDrill(); if (!PC) return api.header(false); }
    if (PC.done) return viewSummary();
    var t = T(), step = curStep(), st = PC.st, d = step.data;

    var bar = '<div class="bar"><span class="brand">' + esc(t.title) + ' · ' + esc(api.fill(t.stepOf, { i: PC.i + 1, n: PC.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="pace-stop">' + esc(t.stop) + '</button></div>';
    var stepsBar = '<ol class="steps" aria-label="Progress">' + PC.steps.map(function (_, idx) {
      var cls = idx < PC.i ? "past" : idx === PC.i ? "on" : "";
      return '<li class="' + cls + '">' + esc(String(idx + 1)) + '</li>';
    }).join("") + '</ol>';

    var tempoSeg = '<div class="seg" role="group" aria-label="' + esc(t.tempoLabel) + '">' +
      ["slow", "steady", "natural"].map(function (k) {
        return '<button type="button" data-act="pace-tempo" data-v="' + k + '" aria-pressed="' + (st.tempo === k) + '">' + esc(t.tempos[k]) + '</button>';
      }).join("") + '</div>';

    var sylChips = '<div class="pc-beats">' + (d.syllables || []).map(function (sy, idx) {
      var cls = "pc-syl" + (st.activeIdx === idx ? " on" : st.tapped[idx] ? " hit" : "");
      return '<button type="button" class="' + cls + '" data-act="pace-tap" data-i="' + idx + '"' + (st.done ? ' disabled' : '') + '>' +
        '<span class="pc-dot" aria-hidden="true"></span><span>' + esc(sy) + '</span></button>';
    }).join("") + '</div>';

    var sp = ensureSpeech();
    var canMic = sp && sp.provider !== "none";

    var body = st.done
      ? '<div class="var-feedback good"><p><strong>' + esc(t.doneMsg[st.result] || t.doneMsg.good) + '</strong></p></div>' +
        '<button type="button" class="primary" data-act="pace-next">' + esc(t.nextBtn) + '</button>'
      : '<div class="tools">' +
        '<button type="button" class="tool" data-act="pace-beat">' + esc(t.beatBtn) + '</button>' +
        '<button type="button" class="tool" data-act="pace-listen">' + esc(t.listenSlow) + '</button>' +
        (canMic ? '<button type="button" class="tool" data-act="pace-mic">' + esc(st.micState === "listening" ? t.listening : t.micBtn) + '</button>' : '') +
        '</div>' +
        (st.heard ? '<p class="sub">' + esc(t.heardLabel + ": " + st.heard) + '</p>' : '') +
        '<div class="pc-rates">' +
        '<button type="button" class="primary" data-act="pace-rate" data-r="good">' + esc(t.smoothBtn) + '</button>' +
        '<button type="button" class="secondary" data-act="pace-rate" data-r="almost">' + esc(t.effortBtn) + '</button>' +
        '<button type="button" class="secondary" data-act="pace-retry">' + esc(t.retryBtn) + '</button>' +
        '<button type="button" class="link" data-act="pace-rate" data-r="skip">' + esc(t.skipBtn) + '</button>' +
        '</div>';

    return bar + stepsBar + '<section class="card">' +
      '<p class="tag">' + esc(api.fill(t.lvTag, { n: step.lv, name: t.lvNames[step.lv - 1] })) + '</p>' +
      '<div class="pic sm" aria-hidden="true">' + (d.pic || "🥁") + '</div>' +
      '<p class="sub">' + esc(t.promptInstr) + '</p>' +
      '<p class="phrase">' + esc(d.word) + '</p>' +
      tempoSeg +
      sylChips +
      '<p class="note">' + esc(d.cue + " " + t.tapTip) + '</p>' +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      body +
      '</section>';
  }

  /* ---------- Registration ---------- */
  var ext = window.POG.ext, A = ext.actions;
  ext.screens.pacing = viewScreen;

  A["pace-home"] = startDrill;
  A["pace-back-var"] = function () { clearBeat(); cancelMic(); if (api.stopVoice) api.stopVoice(); PC = null; api.go("variants"); };
  A["pace-home-exit"] = function () { clearBeat(); cancelMic(); if (api.stopVoice) api.stopVoice(); PC = null; api.go("home"); };
  A["pace-stop"] = function () {
    clearBeat(); cancelMic(); if (api.stopVoice) api.stopVoice();
    if (!PC) return;
    PC.done = true; PC.stopped = true;
    saveAndAdapt();
    api.render();
  };
  A["pace-next"] = function () {
    clearBeat(); cancelMic(); if (api.stopVoice) api.stopVoice();
    if (!PC) return;
    if (PC.i + 1 < PC.steps.length) {
      var prevTempo = PC.st ? PC.st.tempo : "steady";
      PC.i++;
      PC.st = makeStepState(PC.steps[PC.i], prevTempo);
      api.render();
    } else {
      PC.done = true;
      saveAndAdapt();
      api.render();
    }
  };
  A["pace-tempo"] = function (b) {
    if (!PC || !PC.st || PC.st.done) return;
    var v = b.getAttribute("data-v");
    if (TEMPOS[v]) { PC.st.tempo = v; api.render(); }
  };
  A["pace-beat"] = runBeatSequence;
  A["pace-listen"] = function () {
    var step = curStep();
    if (step && step.data) speakSlow(step.data.word);
  };
  A["pace-tap"] = function (b) {
    if (!PC || !PC.st || PC.st.done) return;
    clearBeat();
    var idx = +b.getAttribute("data-i");
    PC.st.activeIdx = idx;
    PC.st.tapped[idx] = true;
    playPulse(idx === 0);
    api.render();
  };
  A["pace-mic"] = function () {
    var sp = ensureSpeech();
    if (!sp || !PC || !PC.st || PC.st.done) return;
    if (sp.active()) sp.stop();
    else { PC.st.heard = ""; sp.start(api.lang()); }
  };
  A["pace-retry"] = function () {
    if (!PC || !PC.st || PC.st.done) return;
    PC.st.tempo = "slow";
    PC.st.retries++;
    PC.st.tapped = {};
    PC.st.activeIdx = -1;
    PC.st.nudge = T().retryHint;
    api.render();
    speakSlow(curStep().data.word);
  };
  A["pace-rate"] = function (b) {
    var r = b.getAttribute("data-r");
    var sc = r === "good" ? 1 : r === "almost" ? 0.5 : 0;
    recordCurrent(r === "good" ? "good" : r === "almost" ? "almost" : "skip", sc);
    api.render();
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "pacing") {
      if (PC && !PC.done) startDrill();
      else api.render();
    }
  });
  window.addEventListener("pog:profile-change", function () {
    clearBeat(); cancelMic(); PC = null;
  });

  window.POG.pacing = {
    level: getLevel,
    listSessions: listSessions,
    buildDrill: buildDrill,
    computePacingProfile: computePacingProfile,
    TEMPOS: TEMPOS,
    label: function () { return T().title; },
    desc: function () { return T().desc; },
    lvTag: function () { var lv = getLevel(), t = T(); return api.fill(t.lvTag, { n: lv, name: t.lvNames[lv - 1] }); }
  };
})();
