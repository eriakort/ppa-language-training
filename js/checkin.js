/*
 * Speech check-in: the same short set of tasks every time, so results can be compared over weeks.
 *
 *   1. Describe one fixed picture (an original kitchen scene), up to 60 seconds
 *   2. Name 10 fixed pictures that are NOT used in the daily games, so practice doesn't inflate them
 *   3. Repeat 3 sentences of increasing length, heard but not shown
 *   4. Name as many animals as possible in 60 seconds
 *
 * Alone: speech recognition checks the answers. With a helper: the helper rates and counts.
 * The learner sees no scores. Results go to the therapist area (behind the PIN) and the printable
 * summary. These are indicators for following change, not a clinical test.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  if (!api || !window.POG.createSpeech) return;
  var esc = api.esc;

  var C = {
    it: {
      home: "Controllo del parlato", title: "Controllo del parlato",
      intro: "Quattro brevi prove, sempre uguali, per seguire nel tempo come va il parlato. Circa 5 minuti.",
      who: "Come lo fai oggi?", solo: "Da solo", soloDesc: "Il tablet ascolta le risposte.",
      assist: "Con un'altra persona", assistDesc: "Chi aiuta valuta le risposte.",
      noMic: "Su questo dispositivo il riconoscimento vocale non c'è: serve una persona che aiuti.",
      steps: ["Descrivi l'immagine", "Dai un nome", "Ripeti", "Animali"],
      descInstr: "Raccontami che cosa vedi in questa immagine.", descHelp: "Parla per tutto il tempo che vuoi, fino a un minuto.",
      nameInstr: "Come si chiama?", repInstr: "Ascolta la frase e ripetila.", fluInstr: "Di' tutti gli animali che ti vengono in mente.",
      fluHelp: "Hai un minuto.", micBtn: "Tocca e parla", done: "Ho finito", dontKnow: "Non lo so", listen: "🔊 Ascolta",
      start: "Inizia", startTimer: "Inizia il minuto", stop: "Fine", next: "Avanti", plus: "+1 animale", minus: "−1",
      listening: "Ti ascolto…", heard: "Ho sentito", left: "{s} secondi", cont: "Continua a parlare", count: "Animali contati: {n}",
      ok: "Giusto", fail: "Non riuscito", almost: "Quasi", no: "No",
      helperName: "Ha detto il nome giusto?", helperRep: "Ha ripetuto la frase?", helperDesc: "Quando ha finito di descrivere, tocca «Fine».",
      recNote: "Con la registrazione attiva, la descrizione e gli animali vengono registrati per il logopedista.",
      thanks: "Grazie!", finished: "Il controllo è finito.", home2: "Torna all'inizio", quit: "Interrompi",
      scene: "La cucina", animals: "Animali",
      resTitle: "Controlli del parlato", every: "Frequenza del controllo", days: "ogni {n} giorni", off: "mai (solo a mano)", saveFreq: "Salva",
      freqSaved: "Frequenza salvata.", now: "Fai un controllo ora", back: "Torna all'area logopedista",
      none: "Nessun controllo ancora.", colDate: "Data", colMode: "Modalità", colName: "Nomi (su 10)", colNameT: "Tempo per nome (s)",
      colRep: "Ripetizione", colFlu: "Animali", colOnset: "Inizio descrizione (s)", colWpm: "Parole/min", colPauses: "Pause",
      chName: "Nomi detti giusti", chFlu: "Animali in un minuto", chWpm: "Parole al minuto nella descrizione", chOnset: "Inizio della descrizione",
      unitS: "s", unitN: "su 10",
      note: "Valori indicativi per seguire l'andamento, non un test clinico. Gli animali da soli contano le parole diverse riconosciute, senza verificare che siano animali. Con un aiutante, il tempo per nome è misurato dal tocco e comprende il tempo di chi aiuta.",
      modeSolo: "Da solo", modeAssist: "Con aiuto",
      micErr: "Il microfono non ha funzionato. Tocca e riprova; se continua, interrompi e scegli «Con un'altra persona»."
    },
    en: {
      home: "Speech check-in", title: "Speech check-in",
      intro: "Four short tasks, the same every time, to follow how speaking changes over time. About 5 minutes.",
      who: "How are you doing it today?", solo: "On my own", soloDesc: "The tablet listens to the answers.",
      assist: "With someone else", assistDesc: "The helper rates the answers.",
      noMic: "Speech recognition isn't available on this device: a helper is needed.",
      steps: ["Describe the picture", "Name it", "Repeat", "Animals"],
      descInstr: "Tell me what you see in this picture.", descHelp: "Talk for as long as you like, up to one minute.",
      nameInstr: "What is this called?", repInstr: "Listen to the sentence and say it back.", fluInstr: "Say all the animals you can think of.",
      fluHelp: "You have one minute.", micBtn: "Tap and speak", done: "I'm done", dontKnow: "I don't know", listen: "🔊 Listen",
      start: "Start", startTimer: "Start the minute", stop: "Finish", next: "Next", plus: "+1 animal", minus: "−1",
      listening: "Listening…", heard: "I heard", left: "{s} seconds", cont: "Keep talking", count: "Animals counted: {n}",
      ok: "Right", fail: "Not managed", almost: "Nearly", no: "No",
      helperName: "Did they say the right name?", helperRep: "Did they repeat the sentence?", helperDesc: "When they've finished describing, tap “Finish”.",
      recNote: "With recording on, the description and the animals are recorded for the therapist.",
      thanks: "Thank you!", finished: "The check-in is finished.", home2: "Back to start", quit: "Stop",
      scene: "The kitchen", animals: "Animals",
      resTitle: "Speech check-ins", every: "Check-in frequency", days: "every {n} days", off: "never (manual only)", saveFreq: "Save",
      freqSaved: "Frequency saved.", now: "Do a check-in now", back: "Back to the therapist area",
      none: "No check-ins yet.", colDate: "Date", colMode: "Mode", colName: "Names (of 10)", colNameT: "Time per name (s)",
      colRep: "Repetition", colFlu: "Animals", colOnset: "Description onset (s)", colWpm: "Words/min", colPauses: "Pauses",
      chName: "Names said correctly", chFlu: "Animals in one minute", chWpm: "Words per minute in the description", chOnset: "Start of the description",
      unitS: "s", unitN: "of 10",
      note: "Rough values for following trends, not a clinical test. On their own, animals count the different words recognised, without checking they are animals. With a helper, time per name is measured from the tap and includes the helper's reaction time.",
      modeSolo: "On my own", modeAssist: "With help",
      micErr: "The microphone didn't work. Tap and try again; if it keeps failing, stop and choose “With someone else”."
    }
  };
  /* Fixed naming set, kept out of the daily games. alt = other accepted answers. */
  var NAMES = [
    { pic: "🚲", it: ["bicicletta", "bici"], en: ["bicycle", "bike"] }, { pic: "🐟", it: ["pesce"], en: ["fish"] },
    { pic: "🍌", it: ["banana"], en: ["banana"] }, { pic: "🔨", it: ["martello"], en: ["hammer"] },
    { pic: "🕯️", it: ["candela"], en: ["candle"] }, { pic: "🧦", it: ["calzino", "calza", "calzini", "calze"], en: ["sock", "socks"] },
    { pic: "🥕", it: ["carota"], en: ["carrot"] }, { pic: "🎈", it: ["palloncino"], en: ["balloon"] },
    { pic: "🦋", it: ["farfalla"], en: ["butterfly"] }, { pic: "🔔", it: ["campana", "campanella", "campanello"], en: ["bell"] }
  ];
  var REPEAT = {
    it: ["Il gatto dorme.", "Domani andiamo al mercato.", "La signora con il cappello rosso ha comprato il pane."],
    en: ["The cat is asleep.", "Tomorrow we are going to the market.", "The lady with the red hat bought some bread at the bakery."]
  };
  var STOP = {
    it: "e ed poi un una uno il lo la i gli le l di da del della dei degli delle anche ancora ehm uhm mm mmm ah eh oh beh allora poi poi c e ce che non si sì no".split(" "),
    en: "and the a an um uh er erm ah oh then also so well like yes no there is are".split(" ")
  };
  function T() { return C[api.lang()] || C.it; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, " ").replace(/[^a-z0-9]+/g, " ").trim(); }
  function toks(s) { return norm(s).split(" ").filter(Boolean); }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function near(w, h) { return h === w || (w.length >= 4 && lev(w, h) <= (w.length >= 7 ? 2 : 1)); }
  function said(target, heard) { var hs = toks(heard); return toks(target).every(function (w) { return hs.some(function (h) { return near(w, h); }); }); }
  function coverage(target, heard) {
    var tw = toks(target).filter(function (w) { return w.length >= 2; }), hs = toks(heard);
    return tw.length ? tw.filter(function (w) { return hs.some(function (h) { return near(w, h); }); }).length / tw.length : 0;
  }
  function median(a) { var v = a.filter(function (x) { return x != null; }).sort(function (x, y) { return x - y; }); if (!v.length) return null; var m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; }

  /* An original picture for describing: a kitchen with several things happening. Fixed, so every check-in is comparable. */
  var SCENE = '<svg class="chk-scene" viewBox="0 0 400 260" role="img" aria-label="kitchen">' +
    '<rect x="0" y="0" width="400" height="190" fill="#E7F0F2"/><rect x="0" y="190" width="400" height="70" fill="#D9C7A7"/>' +
    '<rect x="250" y="24" width="110" height="86" rx="6" fill="#BFE3F2" stroke="#6E8F99" stroke-width="4"/><line x1="305" y1="24" x2="305" y2="110" stroke="#6E8F99" stroke-width="4"/>' +
    '<text x="322" y="66" font-size="30">☀️</text><text x="150" y="60" font-size="34">🕰️</text>' +
    '<rect x="20" y="130" width="120" height="70" rx="4" fill="#8A9AA0"/><rect x="28" y="122" width="104" height="10" fill="#5C6B70"/>' +
    '<text x="40" y="122" font-size="40">🍲</text><text x="58" y="88" font-size="26">💨</text>' +
    '<text x="62" y="186" font-size="78">🧑‍🍳</text>' +
    '<rect x="215" y="160" width="150" height="12" rx="3" fill="#A0703F"/><rect x="225" y="170" width="10" height="56" fill="#A0703F"/><rect x="345" y="170" width="10" height="56" fill="#A0703F"/>' +
    '<text x="232" y="158" font-size="28">☕</text><text x="276" y="158" font-size="28">🍞</text><text x="318" y="158" font-size="28">🍎</text>' +
    '<text x="190" y="246" font-size="46">🐈</text><text x="150" y="250" font-size="26">🥛</text>' +
    '<text x="300" y="250" font-size="54">🧒</text></svg>';

  /* ---------- state ---------- */
  var SP = window.POG.createSpeech({
    onText: function (fin, interim) { if (!CK || !CK.listening) return; CK.text = fin; CK.partial = interim; paintHeard(); liveCheck(); },
    onState: function (state, reason) {
      if (!CK) return;
      if (state === "listening") { CK.micState = "listening"; return; }
      if (state !== "idle") return;
      var was = CK.listening; CK.listening = false; clearTimeout(CK.limit);
      if (!was) return;
      /* A microphone problem is not an answer: don't score it, let them try again. */
      if (reason && reason !== "stopped" && !heardText()) {
        CK.micError = true;
        if (CK.phase === "flu") { CK.fluPaused = true; }
        api.render(); return;
      }
      CK.micError = false;
      speechEnded(reason);
    },
    onReady: function () { if (api.screen() === "checkin") api.render(); }
  });
  var REC = window.POG.createRecorder ? window.POG.createRecorder() : null;
  var CK = null, tick = null;

  function recordingOn(concurrent) { return !!(REC && REC.supported && api.recordingAllowed && api.recordingAllowed(concurrent)); }
  function settingsCk() { var s = api.load("checkin_settings") || {}; return { every: s.every === 0 ? 0 : (+s.every || 14) }; }
  function list() { var l = api.load("checkins"); return Array.isArray(l) ? l : []; }
  function due() {
    var every = settingsCk().every; if (!every) return false;
    var l = list(); if (!l.length) return !!api.getProfile() && api.sessions().some(function (x) { return x.mode !== "place"; }); /* first one after the first daily session, not right after the starting check */
    return Date.now() - new Date(l[l.length - 1].date).getTime() >= every * 86400000;
  }
  function begin(who) {
    CK = { phase: "desc", who: who, i: 0, started: new Date(), text: "", partial: "", listening: false, rec: false,
      res: { desc: null, naming: [], rep: [], flu: null }, recIds: [], fluWords: {}, fluCount: 0, fluEnd: 0, shownAt: 0, heardShown: false };
    api.go("checkin");
  }
  function stopAll() { clearInterval(tick); tick = null; if (CK) { clearTimeout(CK.limit); if (CK.listening) { CK.listening = false; SP.cancel(); } } if (REC && REC.active()) REC.cancel(); api.stopVoice(); }

  /* ---------- listening ---------- */
  function listen(maxMs) {
    api.stopVoice();
    CK.text = ""; CK.partial = ""; CK.listening = true; CK.micState = "starting"; CK.tapAt = Date.now();
    SP.start(api.lang());
    CK.limit = setTimeout(function () { if (CK && CK.listening) SP.stop(); }, maxMs);
    api.render();
  }
  function heardText() { return (CK.text + (CK.partial ? " " + CK.partial : "")).trim(); }
  function paintHeard() { var el = document.getElementById("chk-heard"); if (el) el.textContent = heardText(); }
  function liveCheck() {
    if (CK.phase === "name") { var it = NAMES[CK.i][api.lang()]; if (it.some(function (w) { return said(w, CK.text); })) SP.stop(); }
    if (CK.phase === "flu") { countFlu(heardText()); var c = document.getElementById("chk-count"); if (c) c.textContent = api.fill(T().count, { n: CK.fluCount }); }
  }
  function countFlu(text) {
    var stop = STOP[api.lang()];
    toks(text).forEach(function (w) { if (w.length >= 3 && stop.indexOf(w) < 0) CK.fluWords[w] = 1; });
    CK.fluCount = Object.keys(CK.fluWords).length;
  }
  function startRec() { if (recordingOn(CK.who === "solo") && !CK.rec) { CK.rec = true; CK.recT0 = Date.now(); REC.start().catch(function () { CK.rec = false; }); } }
  function stopRec(game, label, heard) {
    if (!CK.rec) return Promise.resolve(null);
    CK.rec = false;
    return REC.stop().then(function (r) {
      if (!r) return null;
      if (r.blob && window.POG.recordings) {
        var id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        CK.recIds.push(id);
        window.POG.recordings.add({ profileId: api.profileId(), id: id, t: Date.now(), session: "checkin", game: game, lv: null, label: label, heard: heard || "", result: "checkin", measures: r.measures, mime: r.mime, blob: r.blob }).catch(function () {});
      }
      return r.measures;
    }, function () { return null; });
  }
  function speechEnded() {
    var ph = CK.phase, text = heardText();
    if (ph === "desc") finishDesc(text);
    else if (ph === "name") nameResult(NAMES[CK.i][api.lang()].some(function (w) { return said(w, text); }), text);
    else if (ph === "rep") repResult(coverage(REPEAT[api.lang()][CK.i], text), text);
    else if (ph === "flu") { countFlu(text); if (Date.now() < CK.fluEnd - 1500) { CK.fluPaused = true; api.render(); } else finishFlu(); }
  }

  /* ---------- tasks ---------- */
  function finishDesc(text) {
    var tm = SP.timing(), now = Date.now(), words = toks(text).length;
    var base = { transcript: text, words: CK.who === "solo" ? words : null, durationMs: now - (CK.descT0 || now),
      onsetMs: CK.who === "solo" && tm.firstSpeech ? tm.firstSpeech - tm.startedAt : null, speechMs: null, pauses: null, longestPauseMs: null, src: "timing" };
    stopRec("chkdesc", T().scene, text).then(function (m) {
      if (m) { base.onsetMs = m.onsetMs; base.speechMs = m.speechMs; base.pauses = m.pauses; base.longestPauseMs = m.longestPauseMs; base.src = "audio"; }
      var ms = base.speechMs || (base.durationMs - (base.onsetMs || 0));
      base.wpm = base.words && ms > 0 ? Math.round(base.words / ms * 60000) : null;
      if (base.wpm != null && (base.wpm < 20 || base.wpm > 300)) base.wpm = null;
      CK.res.desc = base; CK.phase = "name"; CK.i = 0; CK.shownAt = Date.now(); api.render();
    });
  }
  function nameResult(ok, text) {
    var ms = CK.who === "solo" ? (ok ? Date.now() - CK.tapAt : null) : Date.now() - CK.shownAt;
    CK.res.naming.push({ w: NAMES[CK.i][api.lang()][0], ok: !!ok, ms: ms, heard: text || "" });
    CK.i++;
    if (CK.i >= NAMES.length) { CK.phase = "rep"; CK.i = 0; }
    CK.shownAt = Date.now(); api.render();
  }
  function repResult(score, text) {
    CK.res.rep.push({ text: REPEAT[api.lang()][CK.i], score: Math.round(score * 100) / 100, heard: text || "" });
    CK.i++;
    if (CK.i >= REPEAT[api.lang()].length) { CK.phase = "flu"; CK.i = 0; }
    api.render();
  }
  function startFlu() {
    CK.fluEnd = Date.now() + 60000; CK.fluPaused = false;
    startRec();
    clearInterval(tick);
    tick = setInterval(function () {
      if (!CK || CK.phase !== "flu") { clearInterval(tick); return; }
      var left = Math.max(0, Math.ceil((CK.fluEnd - Date.now()) / 1000)), el = document.getElementById("chk-left");
      if (el) el.textContent = api.fill(T().left, { s: left });
      if (left <= 0) { clearInterval(tick); if (CK.listening) SP.stop(); else finishFlu(); }
    }, 250);
  }
  function finishFlu() {
    if (!CK || CK.phase !== "flu" || CK.fluDone) return;
    CK.fluDone = true; clearInterval(tick);
    var words = Object.keys(CK.fluWords);
    stopRec("chkflu", T().animals, words.join(", ")).then(function () {
      CK.res.flu = { count: CK.fluCount, words: CK.who === "solo" ? words : [] };
      saveResult(); CK.phase = "done"; api.render();
    });
  }
  function saveResult() {
    var r = CK.res, naming = r.naming, ok = naming.filter(function (x) { return x.ok; });
    var entry = { id: "k" + Date.now().toString(36), date: CK.started.toISOString(), who: CK.who,
      desc: r.desc, naming: { correct: ok.length, total: naming.length, medianMs: median(ok.map(function (x) { return x.ms; })), items: naming },
      rep: { avg: r.rep.length ? Math.round(r.rep.reduce(function (a, x) { return a + x.score; }, 0) / r.rep.length * 100) / 100 : null, items: r.rep },
      flu: r.flu, recIds: CK.recIds.slice() };
    var l = list(); l.push(entry); api.save("checkins", l.slice(-50));
  }

  /* ---------- views ---------- */
  function steps() {
    var t = T(), order = ["desc", "name", "rep", "flu"], ci = order.indexOf(CK.phase);
    return '<ol class="steps" aria-label="Progress">' + t.steps.map(function (s, i) {
      return '<li class="' + (i === ci ? "on" : (i < ci ? "past" : "")) + '"' + (i === ci ? ' aria-current="step"' : '') + '>' + esc(s) + '</li>';
    }).join("") + '</ol>';
  }
  function micArea(label) {
    var t = T();
    if (CK.listening) return '<div class="listen-box"><span class="live"><i></i>' + esc(t.listening) + '</span><p class="heard"><span class="lbl">' + esc(t.heard) + '</span><span id="chk-heard">' + esc(heardText()) + '</span></p>' +
      '<button class="primary" data-act="chk-done">' + esc(t.done) + '</button></div>';
    return (CK.micError ? '<p class="nudge" role="status">' + esc(t.micErr) + '</p>' : '') + '<button class="micbtn" data-act="chk-mic">' + esc(label || t.micBtn) + '</button>';
  }
  function head() {
    return '<header class="bar"><div class="brand">' + esc(api.t().appName) + '</div>' + (api.langToggle ? api.langToggle() : '') + '<button class="stop" data-act="chk-quit">' + esc(T().quit) + '</button></header>';
  }
  function viewCheckin() {
    var t = T();
    if (!CK) {
      var noMic = SP.provider === "none";
      return api.header(false) + '<section class="card"><h1 class="instr">' + esc(t.title) + '</h1><p class="sub">' + esc(t.intro) + '</p>' +
        '<p class="instr">' + esc(t.who) + '</p><div class="modes">' +
        (noMic ? '' : '<button class="modecard" data-act="chk-who" data-w="solo"><span class="ico" aria-hidden="true">🙂</span><strong>' + esc(t.solo) + '</strong><span>' + esc(t.soloDesc) + '</span></button>') +
        '<button class="modecard" data-act="chk-who" data-w="assist"><span class="ico" aria-hidden="true">🤝</span><strong>' + esc(t.assist) + '</strong><span>' + esc(t.assistDesc) + '</span></button></div>' +
        (noMic ? '<p class="note">' + esc(t.noMic) + '</p>' : '') + (recordingOn() ? '<p class="note">' + esc(t.recNote) + '</p>' : '') +
        '<button class="link" data-act="home">' + esc(t.home2) + '</button></section>';
    }
    var solo = CK.who === "solo", body = "";
    if (CK.phase === "desc") {
      body = '<p class="instr">' + esc(t.descInstr) + '</p>' + SCENE + '<p class="sub">' + esc(t.descHelp) + '</p>' +
        (solo ? micArea()
          : (CK.descT0 ? '<p class="sub">' + esc(t.helperDesc) + '</p><button class="primary" data-act="chk-desc-end">' + esc(t.stop) + '</button>'
            : '<button class="primary" data-act="chk-desc-start">' + esc(t.start) + '</button>'));
    } else if (CK.phase === "name") {
      var n = NAMES[CK.i];
      body = '<p class="tag">' + (CK.i + 1) + ' / ' + NAMES.length + '</p><p class="instr">' + esc(t.nameInstr) + '</p><div class="pic" role="img" aria-label="?">' + n.pic + '</div>' +
        (solo ? micArea() + (CK.listening ? '' : '<button class="link" data-act="chk-skip">' + esc(t.dontKnow) + '</button>')
          : '<p class="label">' + esc(t.helperName) + '</p><div class="rate-btns two"><button class="r good" data-act="chk-name" data-ok="1">' + esc(t.ok) + '</button><button class="r retry" data-act="chk-name" data-ok="0">' + esc(t.fail) + '</button></div>');
    } else if (CK.phase === "rep") {
      body = '<p class="tag">' + (CK.i + 1) + ' / ' + REPEAT[api.lang()].length + '</p><p class="instr">' + esc(t.repInstr) + '</p>' +
        '<div class="tools"><button class="tool" data-act="chk-listen">' + esc(t.listen) + '</button></div>' +
        (solo ? micArea()
          : '<p class="label">' + esc(t.helperRep) + '</p><div class="rate-btns"><button class="r good" data-act="chk-rep" data-s="1">' + esc(t.ok) + '</button><button class="r almost" data-act="chk-rep" data-s="0.5">' + esc(t.almost) + '</button><button class="r retry" data-act="chk-rep" data-s="0">' + esc(t.no) + '</button></div>');
    } else if (CK.phase === "flu") {
      var started = CK.fluEnd > 0, left = started ? Math.max(0, Math.ceil((CK.fluEnd - Date.now()) / 1000)) : 60;
      body = '<p class="instr">' + esc(t.fluInstr) + '</p><p class="sub">' + esc(t.fluHelp) + '</p><p class="chk-left" id="chk-left">' + esc(api.fill(t.left, { s: left })) + '</p>' +
        (solo
          ? (!started ? '<button class="micbtn" data-act="chk-flu-start">' + esc(t.micBtn) + '</button>'
            : CK.listening ? micArea() : (CK.fluPaused ? (CK.micError ? '<p class="nudge" role="status">' + esc(t.micErr) + '</p>' : '') + '<button class="micbtn" data-act="chk-flu-more">' + esc(t.cont) + '</button><button class="link" data-act="chk-flu-end">' + esc(t.done) + '</button>' : ''))
          : (!started ? '<button class="primary" data-act="chk-flu-start">' + esc(t.startTimer) + '</button>'
            : '<p class="chk-count" id="chk-count">' + esc(api.fill(t.count, { n: CK.fluCount })) + '</p><div class="rate-btns two"><button class="r good" data-act="chk-plus">' + esc(t.plus) + '</button><button class="r retry" data-act="chk-minus">' + esc(t.minus) + '</button></div><button class="link" data-act="chk-flu-end">' + esc(t.stop) + '</button>'));
    } else {
      body = '<h1 class="sumhead">' + esc(t.thanks) + '</h1><p class="instr">' + esc(t.finished) + '</p><button class="primary" data-act="chk-home">' + esc(t.home2) + '</button>';
      return api.header(false) + '<section class="card">' + body + '</section>';
    }
    return head() + steps() + '<section class="card">' + body + '</section>';
  }

  /* Results for the therapist (inside the therapist area, behind the PIN). */
  function fmt(v, d) { return v == null ? "–" : Number(v).toFixed(d || 0).replace(".", api.lang() === "it" ? "," : "."); }
  function viewResults() {
    var t = T(), l = list().slice().reverse(), loc = api.lang() === "it" ? "it-IT" : "en-GB", every = settingsCk().every;
    var rows = l.map(function (k) {
      var d = k.desc || {};
      return '<tr><td>' + esc(new Date(k.date).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" })) + '</td><td>' + esc(k.who === "solo" ? t.modeSolo : t.modeAssist) + '</td>' +
        '<td class="n">' + (k.naming ? k.naming.correct : "–") + '</td><td class="n">' + fmt(k.naming && k.naming.medianMs != null ? k.naming.medianMs / 1000 : null, 1) + '</td>' +
        '<td class="n">' + (k.rep && k.rep.avg != null ? Math.round(k.rep.avg * 100) + "%" : "–") + '</td><td class="n">' + (k.flu ? k.flu.count : "–") + '</td>' +
        '<td class="n">' + fmt(d.onsetMs != null ? d.onsetMs / 1000 : null, 1) + '</td><td class="n">' + fmt(d.wpm) + '</td><td class="n">' + fmt(d.pauses) + '</td></tr>';
    }).join("");
    var pts = function (f) { return list().map(function (k) { return { t: new Date(k.date).getTime(), y: f(k) }; }); };
    var charts = l.length ? '<div class="chart-row">' +
      window.POG.charts.line(pts(function (k) { return k.naming ? k.naming.correct : null; }), { title: t.chName, unit: t.unitN, max: 10, locale: loc }) +
      window.POG.charts.line(pts(function (k) { return k.flu ? k.flu.count : null; }), { title: t.chFlu, locale: loc }) +
      window.POG.charts.line(pts(function (k) { return k.desc ? k.desc.wpm : null; }), { title: t.chWpm, locale: loc }) + '</div>' : '';
    var opts = [7, 14, 28, 0].map(function (n) { return '<option value="' + n + '"' + (every === n ? ' selected' : '') + '>' + esc(n ? api.fill(t.days, { n: n }) : t.off) + '</option>'; }).join("");
    var f = api.flashText();
    return api.header(false) + '<section class="card"><h1 class="instr">' + esc(t.resTitle) + '</h1>' +
      (l.length ? '<div class="report">' + charts + '<div class="tbl"><table><thead><tr><th>' + esc(t.colDate) + '</th><th>' + esc(t.colMode) + '</th><th>' + esc(t.colName) + '</th><th>' + esc(t.colNameT) + '</th><th>' + esc(t.colRep) + '</th><th>' + esc(t.colFlu) + '</th><th>' + esc(t.colOnset) + '</th><th>' + esc(t.colWpm) + '</th><th>' + esc(t.colPauses) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>'
        : '<p class="sub">' + esc(t.none) + '</p>') +
      '<p class="note">' + esc(t.note) + '</p>' +
      '<div class="setrow"><label for="chk-every">' + esc(t.every) + '</label><select id="chk-every">' + opts + '</select></div>' +
      (f ? '<p class="nudge">' + esc(f) + '</p>' : '') +
      '<div class="row-actions"><button class="secondary" data-act="chk-freq">' + esc(t.saveFreq) + '</button><button class="primary" data-act="chk-start">' + esc(t.now) + '</button></div>' +
      '<button class="link" data-act="therapist">' + esc(t.back) + '</button></section>';
  }

  /* ---------- registration ---------- */
  var ext = window.POG.ext;
  ext.screens.checkin = viewCheckin;
  ext.screens["chk-results"] = function () { return api.therapistUnlocked() ? viewResults() : api.therapistView(); };
  ext.home.push({ act: "chk-start", icon: "🗣️", label: { it: C.it.home, en: C.en.home }, show: due });
  window.POG.checkins = { list: list, due: due, charts: true };

  var A = ext.actions;
  A["chk-start"] = function () { stopAll(); CK = null; if (api.lockTherapist) api.lockTherapist(); api.go("checkin"); };
  A["chk-who"] = function (b) { begin(b.getAttribute("data-w") === "solo" ? "solo" : "assist"); };
  A["chk-quit"] = function () { stopAll(); CK = null; api.go("home"); };
  A["chk-home"] = function () { CK = null; api.go("home"); };
  A["chk-mic"] = function () {
    if (CK.phase === "desc") { CK.descT0 = Date.now(); startRec(); listen(60000); }
    else if (CK.phase === "name") listen(10000);
    else if (CK.phase === "rep") listen(15000);
  };
  A["chk-done"] = function () { if (CK && CK.listening) SP.stop(); };
  A["chk-skip"] = function () { nameResult(false, ""); };
  A["chk-desc-start"] = function () { CK.descT0 = Date.now(); startRec(); api.render(); };
  A["chk-desc-end"] = function () { finishDesc(""); };
  A["chk-name"] = function (b) { nameResult(b.getAttribute("data-ok") === "1", ""); };
  A["chk-listen"] = function () { if (CK.listening) { CK.listening = false; clearTimeout(CK.limit); SP.cancel(); api.render(); } api.speak(REPEAT[api.lang()][CK.i]); };
  A["chk-rep"] = function (b) { repResult(+b.getAttribute("data-s"), ""); };
  A["chk-flu-start"] = function () { startFlu(); if (CK.who === "solo") listen(61000); else api.render(); };
  A["chk-flu-more"] = function () { CK.fluPaused = false; listen(Math.max(1000, CK.fluEnd - Date.now())); };
  A["chk-flu-end"] = function () { if (CK.listening) SP.stop(); else finishFlu(); };
  A["chk-plus"] = function () { CK.fluCount++; var c = document.getElementById("chk-count"); if (c) c.textContent = api.fill(T().count, { n: CK.fluCount }); };
  A["chk-minus"] = function () { CK.fluCount = Math.max(0, CK.fluCount - 1); var c = document.getElementById("chk-count"); if (c) c.textContent = api.fill(T().count, { n: CK.fluCount }); };
  A["chk-results"] = function () { api.go("chk-results"); };
  A["chk-freq"] = function () {
    var el = document.getElementById("chk-every"), n = el ? +el.value : 14;
    api.save("checkin_settings", { every: [0, 7, 14, 28].indexOf(n) >= 0 ? n : 14 }); api.flash(T().freqSaved); api.render();
  };
  window.addEventListener("pog:profile-change", function () { stopAll(); CK = null; });

  if (api.screen() === "home") api.render();
})();
