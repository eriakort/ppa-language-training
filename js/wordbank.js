/*
 * Spaced-Retrieval Core Lexicon & Error-Driven Word Preservation ("Parole da conservare / Words to keep").
 *
 * Combines three clinical mechanisms for Primary Progressive Aphasia:
 *   1. Leitner Spaced Repetition (Boxes 1..5 -> 1, 2, 5, 12, 28 days) to preserve personally
 *      relevant vocabulary and automatically re-queue struggled words from daily practice.
 *   2. Graded Semantic Feature Analysis (SFA) + Phonemic Component Analysis (PCA) cueing ladder,
 *      with optional speech verification, 3-choice confirmation, or errorless model consolidation.
 *   3. Caregiver / Clinician Word Curator (behind PIN when locked) & Cue/Error profile analytics.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  var BANK = window.POG && window.POG.content && window.POG.content.WORDBANK;
  if (!api || !BANK) return;
  var esc = api.esc;

  var DAY = 86400000;
  var INTERVALS = [1, 2, 5, 12, 28];
  var KEEP_SESSIONS = 120;
  var CATS = ["health", "home", "food", "people", "outdoors", "tools", "harvested"];

  var C = {
    it: {
      title: "Parole da conservare",
      desc: "Ripasso spaziato con aiuti su significato e suoni per mantenere vive le parole importanti.",
      badgeDue: "{n} da ripassare oggi",
      badgeDone: "Tutte ripassate oggi",
      stepOf: "Parola {i} di {n}",
      stop: "Termina",
      backVar: "Torna agli esercizi mirati",
      backHome: "Torna all'inizio",
      backTherapist: "Torna all'area logopedista",
      catLabels: { health: "Salute", home: "Casa", food: "Cibo", people: "Persone", outdoors: "Fuori casa", tools: "Oggetti utili", harvested: "Dalle sessioni" },
      prompt: "Come si chiama? Prova a dirlo ad alta voce o usa un aiuto.",
      sayBtn: "🎙️ Pronuncia",
      listening: "Ti ascolto…",
      heard: "Ho sentito",
      stopMic: "Fatto",
      gotIt: "L'ho detta giusta",
      sfaBtn: "💡 Significato (SFA)",
      pcaBtn: "🔤 Suono e sillabe (PCA)",
      choiceBtn: "Scegli tra 3",
      revealBtn: "Mostra e ascolta",
      listen: "🔊 Ascolta",
      next: "Avanti",
      sfaTitle: "Indizi di significato",
      pcaTitle: "Suono e sillabe",
      pcaFirst: "Inizia con",
      pcaSyl: "Sillabe",
      pcaRhyme: "Suona vicino a",
      pcaLen: "{n} lettere",
      wrongChoice: "Non è questa: riprova con calma o apri un aiuto.",
      goodFeedback: "Ricordata in autonomia! Intervallo allungato.",
      cueFeedback: "Trovata con l'aiuto: la rivedremo presto per consolidarla.",
      modelFeedback: "Ripetiamola insieme: ascoltala o leggila ad alta voce per fissarla.",
      speakNow: "Puoi ripeterla una volta ad alta voce prima di continuare.",
      sumTitle: "Ripasso delle parole completato",
      sumDone: "Tutte le parole di oggi sono state salvate con i nuovi intervalli.",
      sumStopped: "Ci fermiamo qui. I progressi fatti finora sono stati salvati.",
      colWord: "Parola", colRes: "Esito", colNext: "Prossimo ripasso",
      daysN: "tra {n} g.",
      res: { good: "Autonoma", almost: "Con aiuto", model: "Con modello" },
      manageBtn: "Parole da conservare e profilo indizi",
      manageBtnShort: "Gestisci parole personali",
      curatorTitle: "Parole da conservare e profilo indizi",
      curatorIntro: "Gestisci il vocabolario prioritario da mantenere nel tempo e osserva quali indizi (significato o suoni) aiutano di più.",
      startDrill: "Inizia ripasso ({n} parole)",
      cueStatsHead: "Efficacia degli indizi e tipo di errori",
      cueIndep: "Autonome (senza aiuto)",
      cueSem: "Con indizio semantico",
      cuePhon: "Con indizio fonemico",
      cueModel: "Scelta o modello completo",
      errBreakdown: "Errori vocali rilevati: {p} fonemici · {s} semantici",
      noCueData: "Completa qualche esercizio vocale o di ripasso per vedere il profilo degli indizi.",
      addHead: "Aggiungi una parola importante",
      wLabel: "Parola (es. farmacia, nipote)",
      catLabel: "Categoria",
      sfaLabel: "Aiuto sul significato (facoltativo)",
      sfaPh: "Es. Dove si prendono le medicine",
      addBtn: "Aggiungi al mazzo",
      addedMsg: "Parola aggiunta alle parole da conservare.",
      needWord: "Scrivi una parola prima di aggiungere.",
      syncBtn: "Importa parole difficili dalle sessioni",
      syncedMsg: "Parole dalle sessioni aggiornate ({n} nuove o segnate).",
      deckHead: "Mazzo personale ({n} parole)",
      statusLabels: { strong: "Stabile", fragile: "Fragile", maintaining: "In mantenimento", untested: "Da provare" },
      boxLabel: "Riquadro {b}/5 · {s}",
      del: "Rimuovi",
      emptyDeck: "Nessuna parola trovata.",
      harvestHint: "Parola incontrata negli esercizi di ogni giorno."
    },
    en: {
      title: "Words to keep alive",
      desc: "Spaced retrieval with meaning & sound cues to maintain personally important words.",
      badgeDue: "{n} due today",
      badgeDone: "All caught up today",
      stepOf: "Word {i} of {n}",
      stop: "Stop",
      backVar: "Back to targeted practice",
      backHome: "Back to home",
      backTherapist: "Back to the therapist area",
      catLabels: { health: "Health", home: "Home", food: "Food", people: "People", outdoors: "Outdoors", tools: "Everyday items", harvested: "From sessions" },
      prompt: "What is this called? Try saying it aloud or use a cue.",
      sayBtn: "🎙️ Say word",
      listening: "Listening…",
      heard: "I heard",
      stopMic: "Done",
      gotIt: "Said it right",
      sfaBtn: "💡 Meaning clue (SFA)",
      pcaBtn: "🔤 Sound & syllables (PCA)",
      choiceBtn: "Choose from 3",
      revealBtn: "Show & listen",
      listen: "🔊 Listen",
      next: "Next",
      sfaTitle: "Semantic feature cues",
      pcaTitle: "Sound & syllable breakdown",
      pcaFirst: "Starts with",
      pcaSyl: "Syllables",
      pcaRhyme: "Sounds like",
      pcaLen: "{n} letters",
      wrongChoice: "Not that one — try again or open a clue.",
      goodFeedback: "Recalled independently! Review interval extended.",
      cueFeedback: "Retrieved with a cue — scheduled back sooner for consolidation.",
      modelFeedback: "Here is the word and voice model — read it aloud once to reinforce.",
      speakNow: "Say it aloud once before moving on if you can.",
      sumTitle: "Word preservation complete",
      sumDone: "Today's spaced-retrieval review has been saved.",
      sumStopped: "Stopping here. Completed reviews have been saved.",
      colWord: "Word", colRes: "Outcome", colNext: "Next review",
      daysN: "in {n} d.",
      res: { good: "Uncued", almost: "With cue", model: "With model" },
      manageBtn: "Words to keep & cue profile",
      manageBtnShort: "Manage personal words",
      curatorTitle: "Word preservation & cue profile",
      curatorIntro: "Curate priority everyday words to preserve over time and see which cues (meaning vs first sound) work best.",
      startDrill: "Start word review ({n} words)",
      cueStatsHead: "Cue responsiveness & spoken error profile",
      cueIndep: "Independent (no cue)",
      cueSem: "Semantic clue helped",
      cuePhon: "Phonemic clue helped",
      cueModel: "3-choice or full model",
      errBreakdown: "Spoken errors detected: {p} phonemic · {s} semantic",
      noCueData: "Complete spoken exercises or word reviews to build the cue profile.",
      addHead: "Add an important word",
      wLabel: "Word (e.g. pharmacy, grandson)",
      catLabel: "Category",
      sfaLabel: "Meaning clue (optional)",
      sfaPh: "E.g. Where you pick up prescriptions",
      addBtn: "Add to deck",
      addedMsg: "Word added to preservation deck.",
      needWord: "Write a word before adding.",
      syncBtn: "Import tricky words from sessions",
      syncedMsg: "Session words synced ({n} added or flagged).",
      deckHead: "Personal word deck ({n} words)",
      statusLabels: { strong: "Strong", fragile: "Fragile", maintaining: "Maintaining", untested: "Untested" },
      boxLabel: "Box {b}/5 · {s}",
      del: "Remove",
      emptyDeck: "No words in deck yet.",
      harvestHint: "Word flagged from daily practice exercises."
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function shuffle(a) {
    var out = a.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function autoPca(word) {
    var clean = String(word || "").trim();
    var parts = clean.replace(/([aeiouàèéìòù])([^aeiouàèéìòù\s])([aeiouàèéìòù])/gi, "$1 · $2$3");
    var first = clean.slice(0, Math.min(2, clean.length)).toUpperCase();
    return { syl: parts || clean, first: first, rhyme: "", len: clean.replace(/\s+/g, "").length };
  }

  function cardWord(card, lc) {
    var langKey = lc === "en" ? "en" : "it";
    if (card[langKey] && card[langKey].w) return card[langKey].w;
    if (card.it && card.it.w) return card.it.w;
    if (card.en && card.en.w) return card.en.w;
    return card.word || "";
  }

  function ensureDeck(now) {
    var cur = api.load("wordbank_deck");
    var tNow = now || Date.now();
    var deck = Array.isArray(cur) ? cur.slice() : [];
    var byId = {};
    deck.forEach(function (c) { byId[c.id] = c; });

    BANK.forEach(function (item) {
      if (!byId[item.id]) {
        var entry = {
          id: item.id,
          cat: item.cat,
          pic: item.pic,
          source: "core",
          it: item.it,
          en: item.en,
          box: 1,
          intervalDays: 1,
          dueAt: tNow,
          lastReviewedAt: null,
          attempts: 0,
          independentCount: 0,
          cueCounts: { sfa: 0, pca: 0, model: 0 },
          lastErr: null,
          lastOutcome: null
        };
        deck.push(entry);
        byId[item.id] = entry;
      }
    });

    /* Include album photos cleanly if any exist. */
    var alb = window.POG.album && window.POG.album.namingItems ? window.POG.album.namingItems() : [];
    alb.forEach(function (x, idx) {
      var nm = (x.it && x.it[0]) || "";
      if (!nm) return;
      var aid = "alb_" + norm(nm).replace(/\s+/g, "_").slice(0, 24) + "_" + idx;
      var existing = deck.filter(function (c) { return c.source === "album" && norm(cardWord(c, "it")) === norm(nm); })[0];
      if (!existing) {
        deck.push({
          id: aid,
          cat: "people",
          pic: "🖼️",
          photo: x.photo || "",
          source: "album",
          it: { w: nm, alts: [], sfa: [x.it[1] || C.it.harvestHint], pca: autoPca(nm) },
          en: { w: nm, alts: [], sfa: [x.en[1] || C.en.harvestHint], pca: autoPca(nm) },
          box: 1,
          intervalDays: 1,
          dueAt: tNow,
          lastReviewedAt: null,
          attempts: 0,
          independentCount: 0,
          cueCounts: { sfa: 0, pca: 0, model: 0 },
          lastErr: null,
          lastOutcome: null
        });
      } else if (x.photo) {
        existing.photo = x.photo;
      }
    });

    return deck;
  }

  function harvestFromSessions(sessions, existingDeck, now) {
    var tNow = now || Date.now();
    var deck = (existingDeck || []).map(function (c) { return Object.assign({}, c); });
    var synced = 0;
    var indexByNorm = {};
    deck.forEach(function (c) {
      var wi = norm(c.it && c.it.w);
      var we = norm(c.en && c.en.w);
      if (wi) indexByNorm[wi] = c;
      if (we) indexByNorm[we] = c;
    });

    (sessions || []).forEach(function (s) {
      if (!s || s.mode !== "session" || !Array.isArray(s.items)) return;
      var sTime = s.date ? new Date(s.date).getTime() : tNow;
      s.items.forEach(function (it) {
        if (!it || ["name", "wordbuild", "mystery", "crossword"].indexOf(it.game) < 0) return;
        var struggled = it.result !== "good" || (it.hints != null && it.hints > 0) || !!it.errType;
        if (!struggled) return;
        var rawLbl = String(it.label || "").trim();
        var key = norm(rawLbl);
        if (!key || key.length < 2) return;
        var card = indexByNorm[key];
        if (card) {
          if (card.lastHarvestedAt && card.lastHarvestedAt >= sTime) return;
          card.lastHarvestedAt = sTime;
          if (it.errType) card.lastErr = it.errType;
          if (!card.lastReviewedAt || card.lastReviewedAt < sTime) {
            card.dueAt = Math.min(card.dueAt || tNow, tNow);
            if (it.result === "model" || it.result === "skip") card.box = 1;
            synced++;
          }
        } else {
          var newCard = {
            id: "hv_" + key.replace(/\s+/g, "_").slice(0, 28),
            cat: "harvested",
            pic: "💬",
            source: "harvested",
            it: { w: rawLbl.toLowerCase(), alts: [], sfa: [C.it.harvestHint], pca: autoPca(rawLbl) },
            en: { w: rawLbl.toLowerCase(), alts: [], sfa: [C.en.harvestHint], pca: autoPca(rawLbl) },
            box: 1,
            intervalDays: 1,
            dueAt: tNow,
            lastReviewedAt: null,
            lastHarvestedAt: sTime,
            attempts: 1,
            independentCount: 0,
            cueCounts: { sfa: 0, pca: 0, model: 0 },
            lastErr: it.errType || null,
            lastOutcome: it.result || null
          };
          deck.push(newCard);
          indexByNorm[key] = newCard;
          synced++;
        }
      });
    });

    return { deck: deck, synced: synced };
  }

  function syncDeckNow(saveIt) {
    var base = ensureDeck(Date.now());
    var res = harvestFromSessions(api.sessions(), base, Date.now());
    if (saveIt !== false) api.save("wordbank_deck", res.deck);
    return res;
  }

  function listDeck() {
    var stored = api.load("wordbank_deck");
    if (!Array.isArray(stored) || !stored.length) return syncDeckNow(true).deck;
    return stored;
  }

  function listSessions() {
    var s = api.load("wordbank_sessions");
    return Array.isArray(s) ? s : [];
  }

  function reviewCard(card, outcome, now) {
    var tNow = now || Date.now();
    var box = Math.max(1, Math.min(5, +card.box || 1));
    var cc = Object.assign({ sfa: 0, pca: 0, model: 0 }, card.cueCounts || {});
    var attempts = (+card.attempts || 0) + 1;
    var indep = +card.independentCount || 0;

    if (outcome === "good") {
      box = Math.min(5, box + 1);
      indep++;
    } else if (outcome === "sfa" || outcome === "pca" || outcome === "choice" || outcome === "almost") {
      box = Math.max(1, Math.min(box, 2));
      if (outcome === "sfa") cc.sfa++;
      else if (outcome === "pca") cc.pca++;
    } else {
      box = 1;
      cc.model++;
    }
    var intervalDays = INTERVALS[box - 1];
    return Object.assign({}, card, {
      box: box,
      intervalDays: intervalDays,
      dueAt: tNow + intervalDays * DAY,
      lastReviewedAt: tNow,
      attempts: attempts,
      independentCount: indep,
      cueCounts: cc,
      lastOutcome: outcome
    });
  }

  function classifyCard(card) {
    if (!card || !card.attempts) return "untested";
    if ((card.box || 1) >= 4) return "strong";
    if ((card.box || 1) === 1) return "fragile";
    return "maintaining";
  }

  function buildDueQueue(deck, langCode, count, now) {
    var tNow = now || Date.now();
    var lc = langCode === "en" ? "en" : "it";
    var all = (deck || []).filter(function (c) { return !!cardWord(c, lc); });
    var due = all.filter(function (c) { return (c.dueAt || 0) <= tNow; });
    due.sort(function (a, b) {
      var af = a.source === "harvested" ? 0 : 1;
      var bf = b.source === "harvested" ? 0 : 1;
      if (af !== bf) return af - bf;
      if ((a.box || 1) !== (b.box || 1)) return (a.box || 1) - (b.box || 1);
      return (a.dueAt || 0) - (b.dueAt || 0);
    });
    var picked = due.slice(0, count || 5);
    if (picked.length < (count || 5)) {
      var usedIds = {};
      picked.forEach(function (c) { usedIds[c.id] = 1; });
      var rest = shuffle(all.filter(function (c) { return !usedIds[c.id]; }));
      picked = picked.concat(rest.slice(0, (count || 5) - picked.length));
    }
    return picked;
  }

  function dueCount(now) {
    var tNow = now || Date.now();
    return listDeck().filter(function (c) { return (c.dueAt || 0) <= tNow; }).length;
  }

  function computeCueErrorProfile(sessions, wbSessions) {
    var cues = { independent: 0, semantic: 0, phonemic: 0, model: 0 };
    var errs = { phonemic: 0, semantic: 0, other: 0 };

    (sessions || []).forEach(function (s) {
      if (!s || s.mode !== "session" || !Array.isArray(s.items)) return;
      s.items.forEach(function (it) {
        if (!it) return;
        if (it.cue === "none") cues.independent++;
        else if (it.cue === "semantic" || it.cue === "questions") cues.semantic++;
        else if (it.cue === "phonemic" || it.cue === "pattern") cues.phonemic++;
        else if (it.cue === "choice" || it.cue === "model" || it.cue === "hints" || it.cue === "keywords") cues.model++;

        if (it.errType === "phonemic") errs.phonemic++;
        else if (it.errType === "semantic") errs.semantic++;
        else if (it.errType === "other") errs.other++;
      });
    });

    (wbSessions || []).forEach(function (s) {
      (s && s.items || []).forEach(function (it) {
        if (!it) return;
        if (it.cue === "none") cues.independent++;
        else if (it.cue === "sfa" || it.cue === "semantic") cues.semantic++;
        else if (it.cue === "pca" || it.cue === "phonemic") cues.phonemic++;
        else cues.model++;
      });
    });

    var totalCued = cues.independent + cues.semantic + cues.phonemic + cues.model;
    var totalErrors = errs.phonemic + errs.semantic + errs.other;
    return {
      cues: cues,
      errs: errs,
      totalCued: totalCued,
      totalErrors: totalErrors,
      indepShare: totalCued ? Math.round((cues.independent / totalCued) * 1000) / 1000 : null,
      helpfulCue: cues.semantic > cues.phonemic ? "semantic" : cues.phonemic > cues.semantic ? "phonemic" : null
    };
  }

  /* ---------- Drill state ---------- */
  var W = null;
  var SP = window.POG.createSpeech ? window.POG.createSpeech({
    onText: function (fin, interim) {
      if (!W || !W.st || !W.st.listening) return;
      W.st.heard = (fin + (interim ? " " + interim : "")).trim();
      var el = document.getElementById("wb-heard");
      if (el) el.textContent = W.st.heard;
      checkSpokenMatch(W.st.heard);
    },
    onState: function (state) {
      if (!W || !W.st) return;
      if (state === "idle" && W.st.listening) {
        W.st.listening = false;
        checkSpokenMatch(W.st.heard);
        api.render();
      }
    }
  }) : null;

  function checkSpokenMatch(text) {
    if (!W || !W.st || W.st.done || !text) return;
    var card = W.steps[W.i], lc = api.lang();
    var info = card[lc] || card.it || {};
    var targets = [info.w].concat(info.alts || []).filter(Boolean);
    var heardNorm = norm(text);
    if (!heardNorm) return;
    var hit = targets.some(function (tWord) {
      var tw = norm(tWord);
      return tw && (heardNorm === tw || heardNorm.split(" ").indexOf(tw) >= 0);
    });
    if (hit) {
      W.st.listening = false;
      if (SP) try { SP.stop(); } catch (e) {}
      resolveCurrentStep();
    }
  }

  function makeStepState(card) {
    var lc = api.lang();
    var target = cardWord(card, lc);
    var pool = shuffle(listDeck().filter(function (c) { return norm(cardWord(c, lc)) !== norm(target); }));
    var distractors = [];
    for (var i = 0; i < pool.length && distractors.length < 2; i++) {
      var dw = cardWord(pool[i], lc);
      if (dw && distractors.indexOf(dw) < 0) distractors.push(dw);
    }
    var opts = distractors.length ? shuffle([target].concat(distractors)) : [target];
    return {
      startedAt: Date.now(),
      sfaLevel: 0,
      pcaOpen: false,
      showChoices: false,
      revealed: false,
      elim: {},
      opts: opts,
      listening: false,
      heard: "",
      nudge: "",
      done: false,
      result: null,
      cueUsed: "none",
      nextBox: null,
      nextDays: null
    };
  }

  function currentCueKey(st) {
    if (st.revealed) return "model";
    if (st.sfaLevel > 0) return "sfa";
    if (st.pcaOpen) return "pca";
    if (st.showChoices) return "choice";
    return "none";
  }

  function resolveCurrentStep(forcedOutcome) {
    if (!W || !W.st || W.st.done) return;
    var st = W.st, card = W.steps[W.i];
    var cue = forcedOutcome || currentCueKey(st);
    var result = cue === "none" ? "good" : cue === "model" ? "model" : "almost";
    var outcome = cue === "none" ? "good" : cue === "model" ? "model" : cue;
    var score = result === "good" ? 1 : result === "almost" ? 0.5 : 0;

    var updated = reviewCard(card, outcome, Date.now());
    var deck = listDeck().map(function (c) { return c.id === updated.id ? updated : c; });
    api.save("wordbank_deck", deck);

    st.done = true;
    st.result = result;
    st.cueUsed = cue;
    st.nextBox = updated.box;
    st.nextDays = updated.intervalDays;

    W.log.push({
      game: "wordbank",
      id: card.id,
      label: cardWord(card, api.lang()),
      cat: card.cat,
      result: result,
      cue: cue,
      boxAfter: updated.box,
      score: score,
      ms: Date.now() - st.startedAt
    });
    api.speak(cardWord(card, api.lang()));
    api.render();
  }

  function saveSession() {
    if (!W || !W.log.length || W.saved) return;
    W.saved = true;
    var indep = W.log.filter(function (x) { return x.result === "good"; }).length;
    var sess = {
      id: W.id,
      date: new Date().toISOString(),
      mode: "wordbank",
      who: "solo",
      retentionRate: Math.round((indep / W.log.length) * 1000) / 1000,
      items: W.log.slice()
    };
    var all = listSessions().concat([sess]).slice(-KEEP_SESSIONS);
    api.save("wordbank_sessions", all);
  }

  function startDrill() {
    if (api.stopVoice) api.stopVoice();
    var deck = syncDeckNow(true).deck;
    var queue = buildDueQueue(deck, api.lang(), 5, Date.now());
    if (!queue.length) return;
    W = {
      id: "wb" + Date.now().toString(36),
      steps: queue,
      i: 0,
      st: makeStepState(queue[0]),
      log: [],
      done: false,
      stopped: false,
      saved: false
    };
    api.go("wordbank");
  }

  /* ---------- Views ---------- */
  function viewSummary() {
    var t = T();
    var rows = W.log.map(function (r) {
      var days = INTERVALS[Math.max(0, (r.boxAfter || 1) - 1)];
      return '<tr><td>' + esc(r.label) + '</td><td><span class="pill ' + esc(r.result) + '">' + esc(t.res[r.result] || r.result) + '</span></td>' +
        '<td class="n">' + esc(api.fill(t.daysN, { n: days })) + '</td></tr>';
    }).join("");
    return api.header(false) + '<section class="card">' +
      '<h1 class="sumhead">' + esc(t.sumTitle) + '</h1>' +
      '<p class="sub">' + esc(W.stopped ? t.sumStopped : t.sumDone) + '</p>' +
      (rows ? '<div class="report"><div class="tbl"><table><thead><tr><th>' + esc(t.colWord) + '</th><th>' + esc(t.colRes) + '</th><th>' + esc(t.colNext) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '') +
      '<button type="button" class="primary" data-act="wb-back-var">' + esc(t.backVar) + '</button>' +
      '<button type="button" class="link" data-act="wb-home-exit">' + esc(t.backHome) + '</button></section>';
  }

  function viewDrill() {
    if (!W) { startDrill(); if (!W) return api.header(false); }
    if (W.done) return viewSummary();
    var t = T(), card = W.steps[W.i], st = W.st, lc = api.lang();
    var info = card[lc] || card.it || {};
    var word = cardWord(card, lc);
    var sfaList = (info.sfa || []).slice(0, st.sfaLevel);
    var pca = info.pca || autoPca(word);

    var bar = '<div class="bar"><span class="brand">' + esc(t.title) + ' · ' + esc(api.fill(t.stepOf, { i: W.i + 1, n: W.steps.length })) + '</span>' +
      (api.langToggle ? api.langToggle() : '') +
      '<button type="button" class="stop" data-act="wb-stop">' + esc(t.stop) + '</button></div>';
    var stepsBar = '<ol class="steps" aria-label="Progress">' + W.steps.map(function (_, idx) {
      var cls = idx < W.i ? "past" : idx === W.i ? "on" : "";
      return '<li class="' + cls + '">' + esc(String(idx + 1)) + '</li>';
    }).join("") + '</ol>';

    var safePhoto = card.photo ? (api.safePhotoUrl ? api.safePhotoUrl(card.photo) : (/^(?:blob:|data:image\/(?:png|jpe?g|webp|gif);base64,)/i.test(String(card.photo).trim()) ? String(card.photo).trim() : "")) : "";
    var picHtml = safePhoto
      ? '<div class="pic"><img src="' + esc(safePhoto) + '" alt=""></div>'
      : '<div class="pic sm" aria-hidden="true">' + esc(card.pic || "💬") + '</div>';

    var sfaHtml = st.sfaLevel > 0 && sfaList.length
      ? '<div class="wb-cuebox"><strong>' + esc(t.sfaTitle) + '</strong><ul>' + sfaList.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join("") + '</ul></div>'
      : '';

    var pcaHtml = st.pcaOpen
      ? '<div class="wb-cuebox"><strong>' + esc(t.pcaTitle) + '</strong><p>' +
        esc(t.pcaFirst + ": " + pca.first) + ' · ' + esc(t.pcaSyl + ": " + pca.syl) +
        (pca.rhyme ? ' · ' + esc(t.pcaRhyme + ": " + pca.rhyme) : '') +
        ' (' + esc(api.fill(t.pcaLen, { n: pca.len })) + ')</p></div>'
      : '';

    var optsHtml = st.showChoices && !st.done
      ? '<div class="var-opts">' + st.opts.map(function (opt, idx) {
          var dim = !!st.elim[idx];
          return '<button type="button" class="var-opt' + (dim ? ' dim' : '') + '" data-act="wb-opt" data-i="' + idx + '"' + (dim ? ' disabled' : '') + '><span>' + esc(opt) + '</span></button>';
        }).join("") + '</div>'
      : '';

    var body = "";
    if (st.done) {
      var msg = st.result === "good" ? t.goodFeedback : st.result === "almost" ? t.cueFeedback : t.modelFeedback;
      body = '<p class="phrase">' + esc(word) + '</p>' +
        '<div class="var-feedback good"><p><strong>' + esc(msg) + '</strong> ' + esc(t.speakNow) + '</p></div>' +
        '<div class="tools"><button type="button" class="tool" data-act="wb-listen">' + esc(t.listen) + '</button></div>' +
        '<button type="button" class="primary" data-act="wb-next">' + esc(t.next) + '</button>';
    } else {
      var canMic = !!(SP && SP.provider !== "none");
      var micBlock = canMic
        ? (st.listening
            ? '<div class="listen-box"><span class="live"><i></i>' + esc(t.listening) + '</span><p class="heard"><span class="lbl">' + esc(t.heard) + '</span><span id="wb-heard">' + esc(st.heard) + '</span></p><button type="button" class="primary" data-act="wb-mic-stop">' + esc(t.stopMic) + '</button></div>'
            : '<button type="button" class="micbtn" data-act="wb-mic">' + esc(t.sayBtn) + '</button>')
        : '';
      var hasMoreSfa = st.sfaLevel < (info.sfa ? info.sfa.length : 1);
      body = micBlock +
        optsHtml +
        '<div class="tools">' +
        '<button type="button" class="tool" data-act="wb-got">' + esc(t.gotIt) + '</button>' +
        (hasMoreSfa ? '<button type="button" class="tool" data-act="wb-sfa">' + esc(t.sfaBtn) + '</button>' : '') +
        (!st.pcaOpen ? '<button type="button" class="tool" data-act="wb-pca">' + esc(t.pcaBtn) + '</button>' : '') +
        (!st.showChoices && st.opts.length > 1 ? '<button type="button" class="tool" data-act="wb-choices">' + esc(t.choiceBtn) + '</button>' : '') +
        '<button type="button" class="tool" data-act="wb-reveal">' + esc(t.revealBtn) + '</button>' +
        '</div>';
    }

    return bar + stepsBar + '<section class="card">' +
      '<p class="tag">' + esc((t.catLabels[card.cat] || card.cat) + " · " + api.fill(t.boxLabel, { b: card.box || 1, s: t.statusLabels[classifyCard(card)] })) + '</p>' +
      picHtml +
      '<p class="instr">' + esc(t.prompt) + '</p>' +
      sfaHtml + pcaHtml +
      (st.nudge ? '<p class="nudge" role="status">' + esc(st.nudge) + '</p>' : '') +
      body + '</section>';
  }

  function viewCurator() {
    var t = T(), deck = listDeck(), f = api.flashText(), due = dueCount();
    var prof = computeCueErrorProfile(api.sessions(), listSessions());
    var statsHtml = prof.totalCued > 0
      ? '<dl class="rp-stats">' +
        '<div><dt>' + esc(t.cueIndep) + '</dt><dd>' + Math.round((prof.cues.independent / prof.totalCued) * 100) + '% <small>(' + prof.cues.independent + ')</small></dd></div>' +
        '<div><dt>' + esc(t.cueSem) + '</dt><dd>' + Math.round((prof.cues.semantic / prof.totalCued) * 100) + '% <small>(' + prof.cues.semantic + ')</small></dd></div>' +
        '<div><dt>' + esc(t.cuePhon) + '</dt><dd>' + Math.round((prof.cues.phonemic / prof.totalCued) * 100) + '% <small>(' + prof.cues.phonemic + ')</small></dd></div>' +
        '<div><dt>' + esc(t.cueModel) + '</dt><dd>' + Math.round((prof.cues.model / prof.totalCued) * 100) + '% <small>(' + prof.cues.model + ')</small></dd></div>' +
        '</dl>' +
        (prof.totalErrors > 0 ? '<p class="note">' + esc(api.fill(t.errBreakdown, { p: prof.errs.phonemic, s: prof.errs.semantic })) + '</p>' : '')
      : '<p class="note">' + esc(t.noCueData) + '</p>';

    var catOpts = ["health", "home", "food", "people", "outdoors", "tools"].map(function (c) {
      return '<option value="' + c + '">' + esc(t.catLabels[c]) + '</option>';
    }).join("");

    var deckRows = deck.slice().sort(function (a, b) {
      var ord = { fragile: 0, untested: 1, maintaining: 2, strong: 3 };
      return (ord[classifyCard(a)] - ord[classifyCard(b)]) || ((a.box || 1) - (b.box || 1));
    }).slice(0, 40).map(function (c) {
      var stKey = classifyCard(c), w = cardWord(c, api.lang());
      var delBtn = c.source === "custom" || c.source === "harvested"
        ? '<button type="button" class="secondary" data-act="wb-del" data-id="' + esc(c.id) + '">' + esc(t.del) + '</button>'
        : '';
      return '<tr><td><strong>' + esc(w) + '</strong><small>' + esc(t.catLabels[c.cat] || c.cat) + (c.lastErr ? ' · ' + esc(c.lastErr) : '') + '</small></td>' +
        '<td><span class="wb-pill ' + stKey + '">' + esc(t.statusLabels[stKey]) + '</span></td>' +
        '<td class="n">' + (c.box || 1) + ' / 5</td>' +
        '<td>' + delBtn + '</td></tr>';
    }).join("");

    return api.header(false) + '<section class="card">' +
      '<h1 class="instr">' + esc(t.curatorTitle) + '</h1>' +
      '<p class="sub">' + esc(t.curatorIntro) + '</p>' +
      '<div class="row-actions">' +
      '<button type="button" class="primary" data-act="wb-home">' + esc(api.fill(t.startDrill, { n: Math.min(5, Math.max(due, Math.min(5, deck.length))) })) + '</button>' +
      '<button type="button" class="secondary" data-act="wb-sync">' + esc(t.syncBtn) + '</button></div>' +
      '<div class="report">' +
      '<h2>' + esc(t.cueStatsHead) + '</h2>' + statsHtml +
      '<h2>' + esc(t.addHead) + '</h2>' +
      '<div class="wb-add">' +
      '<div class="field"><label for="wb-new-word">' + esc(t.wLabel) + '</label><input type="text" id="wb-new-word" maxlength="50"></div>' +
      '<div class="setrow"><label for="wb-new-cat">' + esc(t.catLabel) + '</label><select id="wb-new-cat">' + catOpts + '</select></div>' +
      '<div class="field"><label for="wb-new-sfa">' + esc(t.sfaLabel) + '</label><input type="text" id="wb-new-sfa" maxlength="100" placeholder="' + esc(t.sfaPh) + '"></div>' +
      '<button type="button" class="secondary" data-act="wb-add">' + esc(t.addBtn) + '</button></div>' +
      (f ? '<p class="nudge" role="status">' + esc(f) + '</p>' : '') +
      '<h2>' + esc(api.fill(t.deckHead, { n: deck.length })) + '</h2>' +
      (deckRows ? '<div class="tbl"><table><tbody>' + deckRows + '</tbody></table></div>' : '<p class="note">' + esc(t.emptyDeck) + '</p>') +
      '</div>' +
      '<button type="button" class="link" data-act="therapist">' + esc(t.backTherapist) + '</button></section>';
  }

  /* ---------- Registration ---------- */
  var ext = window.POG.ext, A = ext.actions;
  ext.screens.wordbank = viewDrill;
  ext.screens["wb-manage"] = function () { return api.therapistUnlocked() ? viewCurator() : api.therapistView(); };

  A["wb-home"] = startDrill;
  A["wb-manage"] = function () { syncDeckNow(true); api.go("wb-manage"); };
  A["wb-back-var"] = function () { if (SP) try { SP.cancel(); } catch (e) {} W = null; api.go("variants"); };
  A["wb-home-exit"] = function () { if (SP) try { SP.cancel(); } catch (e) {} W = null; api.go("home"); };
  A["wb-stop"] = function () {
    if (SP) try { SP.cancel(); } catch (e) {}
    if (!W) return;
    W.done = true;
    W.stopped = true;
    saveSession();
    api.render();
  };
  A["wb-next"] = function () {
    if (api.stopVoice) api.stopVoice();
    if (!W) return;
    if (W.i + 1 < W.steps.length) {
      W.i++;
      W.st = makeStepState(W.steps[W.i]);
      api.render();
    } else {
      W.done = true;
      saveSession();
      api.render();
    }
  };
  A["wb-mic"] = function () {
    if (!W || !W.st || W.st.done || !SP) return;
    W.st.listening = true; W.st.heard = ""; W.st.nudge = "";
    SP.start(api.lang());
    api.render();
  };
  A["wb-mic-stop"] = function () {
    if (!W || !W.st || !SP) return;
    try { SP.stop(); } catch (e) {}
  };
  A["wb-got"] = function () { resolveCurrentStep(); };
  A["wb-sfa"] = function () {
    if (!W || !W.st || W.st.done) return;
    W.st.sfaLevel++;
    W.st.nudge = "";
    api.render();
  };
  A["wb-pca"] = function () {
    if (!W || !W.st || W.st.done) return;
    W.st.pcaOpen = true;
    W.st.nudge = "";
    var card = W.steps[W.i], pca = (card[api.lang()] || card.it || {}).pca;
    if (pca && pca.first) api.speak(pca.first);
    api.render();
  };
  A["wb-choices"] = function () {
    if (!W || !W.st || W.st.done) return;
    W.st.showChoices = true;
    W.st.nudge = "";
    api.render();
  };
  A["wb-opt"] = function (b) {
    if (!W || !W.st || W.st.done) return;
    var i = +b.getAttribute("data-i");
    var card = W.steps[W.i], target = cardWord(card, api.lang());
    if (norm(W.st.opts[i]) === norm(target)) {
      resolveCurrentStep();
    } else {
      W.st.elim[i] = true;
      W.st.nudge = T().wrongChoice;
      api.render();
    }
  };
  A["wb-reveal"] = function () {
    if (!W || !W.st || W.st.done) return;
    W.st.revealed = true;
    resolveCurrentStep("model");
  };
  A["wb-listen"] = function () {
    if (!W) return;
    api.speak(cardWord(W.steps[W.i], api.lang()));
  };
  A["wb-sync"] = function () {
    var res = syncDeckNow(true);
    api.flash(api.fill(T().syncedMsg, { n: res.synced }));
    api.render();
  };
  A["wb-add"] = function () {
    var wEl = document.getElementById("wb-new-word");
    var cEl = document.getElementById("wb-new-cat");
    var sEl = document.getElementById("wb-new-sfa");
    var word = wEl ? wEl.value.trim().slice(0, 50) : "";
    if (!word) { api.flash(T().needWord); api.render(); return; }
    var cat = cEl && CATS.indexOf(cEl.value) >= 0 ? cEl.value : "home";
    var clue = sEl ? sEl.value.trim().slice(0, 100) : "";
    var lc = api.lang() === "en" ? "en" : "it";
    var sfaArr = clue ? [clue] : [T().harvestHint];
    var card = {
      id: "cust_" + Date.now().toString(36),
      cat: cat,
      pic: cat === "health" ? "💊" : cat === "food" ? "🍽️" : cat === "people" ? "🙂" : cat === "outdoors" ? "🌳" : "💬",
      source: "custom",
      it: { w: word, alts: [], sfa: lc === "it" ? sfaArr : [C.it.harvestHint], pca: autoPca(word) },
      en: { w: word, alts: [], sfa: lc === "en" ? sfaArr : [C.en.harvestHint], pca: autoPca(word) },
      box: 1,
      intervalDays: 1,
      dueAt: Date.now(),
      lastReviewedAt: null,
      attempts: 0,
      independentCount: 0,
      cueCounts: { sfa: 0, pca: 0, model: 0 },
      lastErr: null,
      lastOutcome: null
    };
    var deck = listDeck().concat([card]);
    api.save("wordbank_deck", deck);
    api.flash(T().addedMsg);
    api.render();
  };
  A["wb-del"] = function (b) {
    var id = b.getAttribute("data-id");
    var next = listDeck().filter(function (c) { return c.id !== id; });
    api.save("wordbank_deck", next);
    api.render();
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "wordbank") {
      if (W && !W.done) startDrill();
      else api.render();
    } else if (api.screen() === "wb-manage") {
      api.render();
    }
  });
  window.addEventListener("pog:profile-change", function () { W = null; });

  window.POG.wordbank = {
    INTERVALS: INTERVALS,
    reviewCard: reviewCard,
    classifyCard: classifyCard,
    harvestFromSessions: harvestFromSessions,
    buildDueQueue: buildDueQueue,
    computeCueErrorProfile: computeCueErrorProfile,
    listDeck: listDeck,
    listSessions: listSessions,
    dueCount: dueCount,
    label: function () { return T().title; },
    desc: function () { return T().desc; },
    badge: function () {
      var n = dueCount();
      return n ? api.fill(T().badgeDue, { n: n }) : T().badgeDone;
    },
    manageLabel: function () { return T().manageBtn; }
  };
})();
