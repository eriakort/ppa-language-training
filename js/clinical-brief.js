/*
 * Unified Clinician Domain Profile & Physician / SLP Visit Brief
 * (behind the Therapist / Caregiver PIN).
 *
 * Synthesizes all 6 device-local clinical data streams into 5 neurological language domains:
 *   1. Lexical retrieval & semantic memory (naming, associations, Word Bank, fluency)
 *   2. Morphosyntax & sentence building (sentence variants, inflection, cloze)
 *   3. Repetition, phonology & motor speech (repeat, phon, soundspan, speech rate/pauses)
 *   4. Reading & written expression / CART (reading, everyday functional reading, writing_sessions)
 *   5. Functional everyday communication (caregiver FC index, picture description ICUs, dialogue)
 *
 * Generates an inline SVG domain trajectory comparison (Current vs Prior window),
 * objective clinical pattern observations, and a one-click copyable Visit Brief.
 * Everything stays strictly on this device; indicators support clinical review, not diagnosis.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  if (!api) return;
  var esc = api.esc;
  var DAY = 86400000;

  var DOMAIN_KEYS = ["lexical", "syntax", "speech", "literacy", "functional"];

  var C = {
    it: {
      btn: "Quadro clinico e scheda visita",
      title: "Quadro clinico per domini PPA",
      intro: "Sintesi locale su 5 domini linguistici da tutte le prove del dispositivo, con confronto sul periodo precedente e scheda pronta per neurologo o logopedista.",
      windowLabel: "Finestra",
      windows: { "7": "Ultimi 7 giorni", "30": "Ultimi 30 giorni", "90": "Ultimi 90 giorni" },
      curCol: "Attuale",
      prevCol: "Precedente",
      deltaCol: "Variazione",
      noData: "Nessun dato",
      chartTitle: "Profilo per domini: attuale vs periodo precedente (%)",
      legendCur: "Periodo attuale",
      legendPrev: "Periodo precedente",
      obsTitle: "Indicatori clinici emersi",
      obsNone: "Servono più dati tra controlli, esercizi mirati, scrittura o diario per evidenziare pattern specifici.",
      briefTitle: "Scheda per visita medica / logopedica",
      briefHelp: "Testo neutro pronto da incollare in cartella clinica o inviare prima della visita.",
      copyBtn: "📋 Copia scheda visita",
      printBtn: "🖨️ Stampa o salva PDF",
      copied: "Scheda visita copiata negli appunti.",
      copyFail: "Copia dal riquadro qui sotto.",
      back: "Torna all'area logopedista",
      disclaimer: "Indicatori quantitativi locali per il confronto con lo specialista; non costituiscono una diagnosi clinica.",
      domains: {
        lexical: "Lessico e memoria semantica",
        syntax: "Morfosintassi e costruzione frasi",
        speech: "Ripetizione, suoni e fluenza motoria",
        literacy: "Lettura e scrittura funzionale (CART)",
        functional: "Comunicazione nella vita quotidiana"
      },
      domSub: {
        lexical: "Denominazione, scatto di parole, parole da conservare, reti semantiche, senso figurato",
        syntax: "Ordine parole, morfologia, completamento, istruzioni",
        speech: "Ripetizione, sillabe, memoria fonologica, velocità",
        literacy: "Lettura quotidiana, ortografia e copia-richiamo",
        functional: "Diario del familiare, descrizione scene, dialoghi, istruzioni, pragmatica"
      },
      trendUp: "In aumento",
      trendDown: "In calo",
      trendStable: "Stabile",
      trendNew: "Solo attuale",
      trendEmpty: "Dati insufficienti",
      sigCount: "{n} misure",
      obsFluDivSem: "Fluenza semantica/lettera: rapporto {r} ({a} animali vs {l} per lettera) — profilo coerente con relativa preservazione semantica o maggiore impegno fonemico.",
      obsFluDivCat: "Fluenza semantica/lettera: rapporto {r} ({a} animali vs {l} per lettera) — fluenza per categoria ridotta rispetto a quella fonemica.",
      obsCueSem: "Profilo degli aiuti: gli indizi semantici ({s}) aiutano più di quelli fonemici ({p}); autonome {i}%.",
      obsCuePhon: "Profilo degli aiuti: gli indizi fonemici/iniziali ({p}) sbloccano più parole di quelli semantici ({s}); autonome {i}%.",
      obsCueIndep: "Profilo degli aiuti: {i}% di risposte autonome su {n} prove registrate.",
      obsWrSurface: "Scrittura (CART): errori prevalentemente fonetici/superficiali ({sf} su {tot}); recupero con copia-richiamo su {ca} prove.",
      obsWrOmit: "Scrittura (CART): prevalgono omissioni o riduzioni ortografiche ({om} su {tot}); utile continuare la copia guidata.",
      obsWrSummary: "Scrittura (CART): precisione complessiva {acc}% su {tot} prove.",
      obsDiscKw: "Ascolto quotidiano: su {tot} messaggi, {fp} compresi al primo ascolto; le parole chiave scritte hanno recuperato {kw} prove.",
      obsDiscFirst: "Ascolto quotidiano: {fp} su {tot} messaggi compresi al primo ascolto senza aiuti visivi.",
      obsPace: "Ritmo e sillabe: {sm} su {tot} produzioni fluide a ritmo (tempo prevalente: {tempo}).",
      obsVerbs: "Reti dei verbi (VNeST): {tr} su {tot} triadi Chi-Verbo-Cosa autonome; plausibilità semantica {pl} su {tot}.",
      obsNarrative: "Racconto connesso: {sq} su {tot} sequenze giuste al primo tentativo; copertura concetti chiave {mc}%.",
      obsGrammar: "Morfologia e parole ponte: {ft} su {tot} scelte al primo tentativo (tempi {tn}, preposizioni {pr}, accordi {ag}).",
      obsSurface: "Parole irregolari e omofoni: {ft} su {tot} scelte al primo tentativo (regolarizzazioni fonetiche: {rg}, omofoni: {hm}).",
      obsCircumlocution: "Aggirare la parola (circonlocuzione): su {tot} prove, {dw} parole recuperate direttamente e {ds} comunicate con indizi chiari.",
      obsNumbers: "Numeri, orari e prezzi: {ft} su {tot} scelte al primo tentativo (inversioni cifre: {tr}, ordine grandezza: {mg}).",
      obsDialogue: "Dialoghi quotidiani: {ft} su {tot} scambi a due turni completati al primo tentativo.",
      obsInstructions: "Comprensione istruzioni a più passi: {ft} su {tot} seguite al primo colpo (errori d'ordine: {ord}, trappole clausole/attributi: {cl}).",
      obsPragmatics: "Linguaggio figurato e contesto: {ft} su {tot} significati colti al primo colpo (trappole letterali: {lit}, scivoloni contestuali: {ctx}).",
      obsFluency: "Scatto di parole: media {avg} parole su {tot} prove ({indep}% senza gruppi/aiuti; gruppi usati: {cl}).",
      obsCareAligned: "Concordanza familiare/pratica: valutazione del familiare ({care}%) in linea con le prove mirate ({obj}%).",
      obsCareLower: "Concordanza familiare/pratica: il familiare segnala un funzionamento quotidiano più faticoso ({care}% vs {obj}%, −{abs} pt) — verificare il trasferimento nella vita reale.",
      obsCareHigher: "Concordanza familiare/pratica: il familiare rileva un buon adattamento quotidiano ({care}%) superiore di +{abs} pt rispetto alle prove ({obj}%) — strategie compensative efficaci.",
      adhDays: "Giorni attivi",
      adhSessions: "Sessioni totali",
      adhItems: "Prove completate",
      briefActivity: "ATTIVITÀ NEL PERIODO: {days} giorni attivi · {sessions} sessioni · {items} prove",
      obsLatency: "Velocità di risposta nelle prove mirate: mediana {cur} s/voce (su {n} prove).",
      obsLatencySlow: "Velocità di risposta nelle prove mirate: mediana {cur} s/voce (+{diff} s rispetto al periodo precedente).",
      obsAlert: "Avviso andamento ({m}): ultime {n} sessioni sotto il valore abituale.",
      obsCareTags: "Contesto segnalato dal familiare negli ultimi ingressi: {tags}.",
      planTitle: "Piano di esercizio suggerito",
      planSub: "Priorità calcolate dai dati locali per orientare le sessioni mirate (non è una prescrizione medica).",
      planApply: "🎯 Imposta profilo suggerito ({focus})",
      planApplied: "Profilo esercizi mirati aggiornato a «{focus}».",
      focusLabels: { mixed: "Equilibrato", nfv: "Variante non fluente", sv: "Variante semantica", lv: "Variante logopenica" },
      planItems: {
        lexical: "Lessico e semantica ({pct}%): dare spazio a Parole da conservare (SFA/PCA), Aggirare la parola e Reti semantiche.",
        syntax: "Frasi e morfologia ({pct}%): allenare Costruzione frasi, Azioni e verbi (VNeST), Morfologia e Segui i passaggi.",
        speech: "Ritmo e suoni ({pct}%): usare Allenatore ritmo, Suoni e sillabe e Ripetizione.",
        literacy: "Lettura e scrittura ({pct}%): abbinare Scrivere per ricordare (CART) e Lettura parole difficili / quotidiana.",
        functional: "Vita quotidiana ({pct}%): allenare Dialoghi quotidiani, Messaggi vocali, Numeri/orari e tabella Comunica."
      },
      visitNoteLabel: "Domande o obiettivi per la prossima visita (solo su questo dispositivo)",
      visitNotePh: "Es.: chiedere strategie per la stanchezza serale o orari dei farmaci…",
      visitNoteSave: "Salva promemoria visita",
      visitNoteSaved: "Promemoria per la visita salvato nella scheda.",
      briefHead: "SCHEDA DI RIEPILOGO CLINICO (USO INTERNO VISITA) · {date}",
      briefPatient: "Profilo: {name} · Finestra: ultimi {days} giorni vs {days} precedenti",
      briefDomainsHead: "DOMINI LINGUISTICI (0–100%):",
      briefObsHead: "PATTERN E INDICATORI:",
      briefPlanHead: "PIANO DI ESERCIZIO SUGGERITO:",
      briefVisitHead: "DOMANDE / OBIETTIVI PER LA VISITA:",
      briefSupportHead: "SUPPORTI COMUNICATIVI (PASSAPORTO):",
      briefCareHead: "ULTIMA NOTA FAMILIARE:",
      briefFooter: "Nota: dati raccolti localmente dall'app di esercizio linguistico; non sostituisce la valutazione clinica."
    },
    en: {
      btn: "Clinical profile & visit brief",
      title: "Clinician domain profile & visit brief",
      intro: "Local synthesis of all device streams across 5 core PPA language domains, compared against the prior window with a structured brief ready for clinic visits.",
      windowLabel: "Time window",
      windows: { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" },
      curCol: "Current",
      prevCol: "Prior",
      deltaCol: "Change",
      noData: "No data",
      chartTitle: "Domain profile: current vs prior window (%)",
      legendCur: "Current window",
      legendPrev: "Prior window",
      obsTitle: "Clinical pattern highlights",
      obsNone: "Complete more check-ins, targeted drills, writing items, or caregiver notes to surface longitudinal patterns.",
      briefTitle: "Physician / SLP visit brief",
      briefHelp: "Clean plain-text summary ready to paste into clinical notes ahead of an appointment.",
      copyBtn: "📋 Copy visit brief",
      printBtn: "🖨️ Print or save PDF",
      copied: "Visit brief copied to clipboard.",
      copyFail: "Copy from the box below.",
      back: "Back to the therapist area",
      disclaimer: "Local quantitative indicators to support clinician review; not a standalone diagnostic assessment.",
      domains: {
        lexical: "Lexical retrieval & semantics",
        syntax: "Morphosyntax & sentence building",
        speech: "Repetition, phonology & motor speech",
        literacy: "Reading & written expression (CART)",
        functional: "Functional everyday communication"
      },
      domSub: {
        lexical: "Naming, word sprint, Word Bank retention, semantic links, idioms",
        syntax: "Word order, inflection, cloze, instructions",
        speech: "Repetition, syllable span, speech timing",
        literacy: "Everyday reading, spelling & CART recall",
        functional: "Caregiver log, scene concepts, dialogue, instructions, pragmatics"
      },
      trendUp: "Higher",
      trendDown: "Lower",
      trendStable: "Stable",
      trendNew: "Current only",
      trendEmpty: "Insufficient data",
      sigCount: "{n} samples",
      obsFluDivSem: "Fluency ratio (animal / letter): {r} ({a} animals vs {l} letter words) — relative category strength vs phonemic initiation demand.",
      obsFluDivCat: "Fluency ratio (animal / letter): {r} ({a} animals vs {l} letter words) — category retrieval lower than phonemic fluency.",
      obsCueSem: "Cue responsiveness: semantic clues ({s}) helped more often than phonemic cues ({p}); {i}% uncued.",
      obsCuePhon: "Cue responsiveness: phonemic / first-sound cues ({p}) helped more often than semantic clues ({s}); {i}% uncued.",
      obsCueIndep: "Cue responsiveness: {i}% uncued retrieval across {n} recorded trials.",
      obsWrSurface: "Written expression (CART): primarily surface-phonetic spelling errors ({sf} of {tot} items); CART copy-recall supported {ca} items.",
      obsWrOmit: "Written expression (CART): letter/word omissions predominated ({om} of {tot} items); continue CART visual copying.",
      obsWrSummary: "Written expression (CART): {acc}% overall score across {tot} items.",
      obsDiscKw: "Spoken message comprehension: {fp} of {tot} understood on first listen; written keywords rescued {kw} items.",
      obsDiscFirst: "Spoken message comprehension: {fp} of {tot} understood cleanly on first listen.",
      obsPace: "Speech pacing coach: {sm} of {tot} items produced smoothly on the beat (most used tempo: {tempo}).",
      obsVerbs: "Verb networks (VNeST): {tr} of {tot} clean Agent-Verb-Object triads; semantic plausibility {pl} of {tot}.",
      obsNarrative: "Connected story retell: {sq} of {tot} sequenced cleanly on first pass; {mc}% main-concept coverage.",
      obsGrammar: "Morphosyntax & cloze: {ft} of {tot} clean first-try inflections/relators (tense {tn}, prep {pr}, agreement {ag}).",
      obsSurface: "Surface & irregular reading: {ft} of {tot} clean first-try matches (phonetic regularizations: {rg}, homophone foils: {hm}).",
      obsCircumlocution: "Word-finding bridges (circumlocution): {dw} of {tot} words unlocked directly; {ds} communicated clearly using descriptive clues.",
      obsNumbers: "Functional numbers, times & prices: {ft} of {tot} clean first-try matches (transposition errors: {tr}, magnitude foils: {mg}).",
      obsDialogue: "Everyday dialogues: {ft} of {tot} two-turn exchanges handled cleanly on first pass.",
      obsInstructions: "Multi-step instruction following: {ft} of {tot} clean first passes (order slips: {ord}, clause/attribute traps: {cl}).",
      obsPragmatics: "Non-literal & pragmatics: {ft} of {tot} intended meanings on first try (literal traps: {lit}, context slips: {ctx}).",
      obsFluency: "Word-finding sprint: average {avg} words across {tot} prompts ({indep}% uncued; clusters used: {cl}).",
      obsCareAligned: "Caregiver–practice concordance: caregiver rating ({care}%) aligns with objective domain score ({obj}%).",
      obsCareLower: "Caregiver–practice concordance: caregiver rating ({care}%) runs {abs} pt below objective domain score ({obj}%) — review real-world transfer barriers.",
      obsCareHigher: "Caregiver–practice concordance: caregiver rating ({care}%) runs +{abs} pt above objective domain score ({obj}%) — compensatory strategies appear effective.",
      adhDays: "Active days",
      adhSessions: "Total sessions",
      adhItems: "Items completed",
      briefActivity: "PRACTICE ACTIVITY: {days} active days · {sessions} sessions · {items} items",
      obsLatency: "Targeted response speed: median {cur} s per item (across {n} items).",
      obsLatencySlow: "Targeted response speed: median {cur} s per item (+{diff} s slower vs prior window).",
      obsAlert: "Stability alert ({m}): last {n} sessions fell below usual range.",
      obsCareTags: "Recent caregiver context tags: {tags}.",
      planTitle: "Suggested practice plan",
      planSub: "Quantitative priorities based on local domain scores to guide home sessions (not a medical prescription).",
      planApply: "🎯 Apply suggested focus ({focus})",
      planApplied: "Targeted hub focus updated to “{focus}”.",
      focusLabels: { mixed: "Balanced", nfv: "Non-fluent focus", sv: "Semantic focus", lv: "Logopenic focus" },
      planItems: {
        lexical: "Lexical & semantics ({pct}%): prioritise Word Bank (SFA/PCA), Word-finding bridges, and Semantic links.",
        syntax: "Sentence & morphosyntax ({pct}%): practise Sentence building, Verbs (VNeST), Grammar cloze, and Follow instructions.",
        speech: "Motor speech & span ({pct}%): focus on Speech pacing coach and Sound/syllable span.",
        literacy: "Reading & spelling ({pct}%): pair Write to keep (CART) with Surface & Everyday reading.",
        functional: "Daily communication ({pct}%): practise Everyday dialogues, Spoken messages, Numbers & times, and Talk Board."
      },
      visitNoteLabel: "Questions or goals for next clinic visit (device-local)",
      visitNotePh: "Example: ask about evening fatigue, pill schedule aids, or board vocabulary…",
      visitNoteSave: "Save visit note",
      visitNoteSaved: "Visit question saved into the brief.",
      briefHead: "CLINICAL VISIT BRIEF (LOCAL PRACTICE SUMMARY) · {date}",
      briefPatient: "Profile: {name} · Window: last {days} days vs prior {days} days",
      briefDomainsHead: "LANGUAGE DOMAINS (0–100%):",
      briefObsHead: "PATTERN HIGHLIGHTS:",
      briefPlanHead: "SUGGESTED PRACTICE PLAN:",
      briefVisitHead: "QUESTIONS / GOALS FOR NEXT VISIT:",
      briefSupportHead: "COMMUNICATION SUPPORTS (PASSPORT):",
      briefCareHead: "LATEST CAREGIVER NOTE:",
      briefFooter: "Note: locally recorded indicators from language practice software; not a diagnostic evaluation."
    }
  };

  function T() { return C[api.lang()] || C.it; }
  function loc() { return api.lang() === "it" ? "it-IT" : "en-GB"; }

  function mean(arr) {
    var v = (arr || []).filter(function (x) { return x != null && isFinite(x); });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function inRange(dateStr, fromMs, toMs, inclusiveEnd) {
    var ms = new Date(dateStr).getTime();
    return isFinite(ms) && ms >= fromMs && (inclusiveEnd ? ms <= toMs : ms < toMs);
  }

  function scoreSessionItem(it) {
    if (!it) return null;
    if (it.score != null && isFinite(+it.score)) return clamp01(+it.score);
    if (it.result === "good" || it.result === "done") return 1;
    if (it.result === "almost" || it.result === "choice") return 0.5;
    if (it.result === "model" || it.result === "skip" || it.result === "retry") return 0;
    return null;
  }

  function median(arr) {
    var v = (arr || []).filter(function (x) { return x != null && isFinite(x); }).sort(function (a, b) { return a - b; });
    if (!v.length) return null;
    var m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  }

  function collectTargetedLatencies(streams, fromMs, toMs, inclusiveEnd) {
    var out = [];
    [streams.variants, streams.verbs, streams.grammar, streams.surface, streams.writing, streams.circumlocution, streams.numbers, streams.dialogue, streams.instructions, streams.pragmatics, streams.fluency].forEach(function (list) {
      (list || []).forEach(function (s) {
        if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
        (s.items || []).forEach(function (it) {
          if (it.ms != null && isFinite(+it.ms) && +it.ms > 0 && +it.ms < 120000) out.push(+it.ms / 1000);
        });
      });
    });
    return out;
  }

  function collectStreams() {
    var sessions = api.sessions ? api.sessions() : [];
    var checkins = window.POG.checkins && window.POG.checkins.list ? window.POG.checkins.list() : [];
    var variants = window.POG.variants && window.POG.variants.listSessions ? window.POG.variants.listSessions() : [];
    var functional = window.POG.functional && window.POG.functional.listSessions ? window.POG.functional.listSessions() : [];
    var wordbank = window.POG.wordbank && window.POG.wordbank.listSessions ? window.POG.wordbank.listSessions() : [];
    var writing = window.POG.writing && window.POG.writing.listSessions ? window.POG.writing.listSessions() : [];
    var discourse = window.POG.discourse && window.POG.discourse.listSessions ? window.POG.discourse.listSessions() : [];
    var pacing = window.POG.pacing && window.POG.pacing.listSessions ? window.POG.pacing.listSessions() : [];
    var verbs = window.POG.verbs && window.POG.verbs.listSessions ? window.POG.verbs.listSessions() : [];
    var narrative = window.POG.narrative && window.POG.narrative.listSessions ? window.POG.narrative.listSessions() : [];
    var grammar = window.POG.grammar && window.POG.grammar.listSessions ? window.POG.grammar.listSessions() : [];
    var surface = window.POG.surface && window.POG.surface.listSessions ? window.POG.surface.listSessions() : [];
    var circumlocution = window.POG.circumlocution && window.POG.circumlocution.listSessions ? window.POG.circumlocution.listSessions() : [];
    var numbers = window.POG.numbers && window.POG.numbers.listSessions ? window.POG.numbers.listSessions() : [];
    var dialogue = window.POG.dialogue && window.POG.dialogue.listSessions ? window.POG.dialogue.listSessions() : [];
    var instructions = window.POG.instructions && window.POG.instructions.listSessions ? window.POG.instructions.listSessions() : [];
    var pragmatics = window.POG.pragmatics && window.POG.pragmatics.listSessions ? window.POG.pragmatics.listSessions() : [];
    var fluency = window.POG.fluency && window.POG.fluency.listSessions ? window.POG.fluency.listSessions() : [];
    var carelog = window.POG.carelog && window.POG.carelog.list ? window.POG.carelog.list() : [];
    return {
      sessions: sessions,
      checkins: checkins,
      variants: variants,
      functional: functional,
      wordbank: wordbank,
      writing: writing,
      discourse: discourse,
      pacing: pacing,
      verbs: verbs,
      narrative: narrative,
      grammar: grammar,
      surface: surface,
      circumlocution: circumlocution,
      numbers: numbers,
      dialogue: dialogue,
      instructions: instructions,
      pragmatics: pragmatics,
      fluency: fluency,
      carelog: carelog
    };
  }

  function computeAdherenceSummary(streams, fromMs, toMs) {
    var days = {}, sessionCount = 0, itemCount = 0;
    var lists = [
      streams.sessions, streams.checkins, streams.variants, streams.functional,
      streams.wordbank, streams.writing, streams.discourse, streams.pacing,
      streams.verbs, streams.narrative, streams.grammar, streams.surface,
      streams.circumlocution, streams.numbers, streams.dialogue, streams.instructions,
      streams.pragmatics, streams.fluency
    ];
    lists.forEach(function (list) {
      (list || []).forEach(function (s) {
        if (!s || !s.date || !inRange(s.date, fromMs, toMs, true)) return;
        sessionCount++;
        days[String(s.date).slice(0, 10)] = true;
        itemCount += Array.isArray(s.items) ? s.items.length : 1;
      });
    });
    return { activeDays: Object.keys(days).length, sessionCount: sessionCount, itemCount: itemCount };
  }

  function windowScores(streams, fromMs, toMs, inclusiveEnd) {
    var buckets = { lexical: [], syntax: [], speech: [], literacy: [], functional: [] };

    streams.sessions.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      (s.items || []).forEach(function (it) {
        var v = scoreSessionItem(it);
        if (v == null) return;
        var g = it.game;
        if (g === "name" || g === "describe" || g === "mystery" || g === "crossword") buckets.lexical.push(v);
        else if (g === "seq") buckets.syntax.push(v);
        else if (g === "echo" || g === "wordbuild") buckets.speech.push(v);
        else if (g === "read") buckets.literacy.push(v);
        else if (g === "script") buckets.functional.push(v);
      });
    });

    streams.variants.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      (s.items || []).forEach(function (it) {
        var v = scoreSessionItem(it);
        if (v == null) return;
        if (it.game === "semantic") buckets.lexical.push(v);
        else if (it.game === "sentence") buckets.syntax.push(v);
        else if (it.game === "soundspan") buckets.speech.push(v);
      });
    });

    streams.wordbank.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.retentionRate != null && isFinite(+s.retentionRate)) buckets.lexical.push(clamp01(+s.retentionRate));
    });

    streams.functional.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      (s.items || []).forEach(function (it) {
        var v = scoreSessionItem(it);
        if (v != null) buckets.literacy.push(v);
      });
    });

    streams.writing.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.literacy.push(clamp01(+s.accuracy));
    });

    streams.discourse.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.functional.push(clamp01(+s.accuracy));
    });

    streams.pacing.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.fluency != null && isFinite(+s.fluency)) buckets.speech.push(clamp01(+s.fluency));
    });

    streams.verbs.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) {
        buckets.syntax.push(clamp01(+s.accuracy));
        buckets.lexical.push(clamp01(+s.accuracy));
      }
    });

    streams.narrative.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.functional.push(clamp01(+s.accuracy));
    });

    streams.grammar.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.syntax.push(clamp01(+s.accuracy));
    });

    streams.surface.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.literacy.push(clamp01(+s.accuracy));
    });

    streams.circumlocution.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.lexical.push(clamp01(+s.accuracy));
    });

    streams.numbers.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.functional.push(clamp01(+s.accuracy));
    });

    streams.dialogue.forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.functional.push(clamp01(+s.accuracy));
    });

    (streams.instructions || []).forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) {
        buckets.syntax.push(clamp01(+s.accuracy));
        buckets.functional.push(clamp01(+s.accuracy));
      }
    });

    (streams.pragmatics || []).forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) {
        buckets.lexical.push(clamp01(+s.accuracy));
        buckets.functional.push(clamp01(+s.accuracy));
      }
    });

    (streams.fluency || []).forEach(function (s) {
      if (!inRange(s.date, fromMs, toMs, inclusiveEnd)) return;
      if (s.accuracy != null && isFinite(+s.accuracy)) buckets.lexical.push(clamp01(+s.accuracy));
    });

    streams.checkins.forEach(function (k) {
      if (!inRange(k.date, fromMs, toMs, inclusiveEnd)) return;
      if (k.naming && k.naming.correct != null) buckets.lexical.push(clamp01(k.naming.correct / 10));
      if (k.rep && k.rep.avg != null) buckets.speech.push(clamp01(+k.rep.avg));
      if (k.desc && k.desc.icu != null) buckets.functional.push(clamp01(k.desc.icu / (k.desc.icuTotal || 12)));
    });

    streams.carelog.forEach(function (c) {
      if (!inRange(c.date, fromMs, toMs, inclusiveEnd)) return;
      if (c.fcIndex != null && isFinite(+c.fcIndex)) buckets.functional.push(clamp01(+c.fcIndex));
    });

    var out = {};
    DOMAIN_KEYS.forEach(function (k) {
      var m = mean(buckets[k]);
      out[k] = {
        pct: m == null ? null : Math.round(m * 100),
        n: buckets[k].length
      };
    });
    return out;
  }

  function deriveObservations(streams, curFrom, curTo, t, prevFrom) {
    var obs = [];
    /* 1. Fluency divergence (animal vs phonemic letter) from latest check-ins */
    var recentChecks = streams.checkins.filter(function (k) { return inRange(k.date, curFrom, curTo, true); });
    if (!recentChecks.length) recentChecks = streams.checkins;
    var bothChecks = recentChecks.filter(function (k) {
      return k.flu && k.flu.count != null && k.letterFlu && k.letterFlu.count > 0;
    });
    if (bothChecks.length) {
      var lastK = bothChecks[bothChecks.length - 1];
      var aCnt = lastK.flu.count, lCnt = lastK.letterFlu.count;
      var ratio = Math.round((aCnt / lCnt) * 100) / 100;
      if (ratio >= 2.2) {
        obs.push(api.fill(t.obsFluDivSem, { r: String(ratio), a: aCnt, l: lCnt }));
      } else if (ratio <= 0.9) {
        obs.push(api.fill(t.obsFluDivCat, { r: String(ratio), a: aCnt, l: lCnt }));
      }
    }

    /* 2. Cue responsiveness (SFA vs PCA) via wordbank */
    var wb = window.POG.wordbank;
    if (wb && wb.computeCueErrorProfile) {
      var cuedSess = streams.sessions.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      var cuedWb = streams.wordbank.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      var cp = wb.computeCueErrorProfile(cuedSess.length ? cuedSess : streams.sessions, cuedWb.length ? cuedWb : streams.wordbank);
      if (cp && cp.totalCued > 0) {
        var indepPct = Math.round((cp.cues.independent / cp.totalCued) * 100);
        if (cp.cues.semantic > cp.cues.phonemic && cp.cues.semantic > 0) {
          obs.push(api.fill(t.obsCueSem, { s: cp.cues.semantic, p: cp.cues.phonemic, i: indepPct }));
        } else if (cp.cues.phonemic > cp.cues.semantic && cp.cues.phonemic > 0) {
          obs.push(api.fill(t.obsCuePhon, { s: cp.cues.semantic, p: cp.cues.phonemic, i: indepPct }));
        } else {
          obs.push(api.fill(t.obsCueIndep, { i: indepPct, n: cp.totalCued }));
        }
      }
    }

    /* 3. Written expression / dysgraphia profile */
    var wr = window.POG.writing;
    if (wr && wr.computeWritingProfile) {
      var wrSlice = streams.writing.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (wrSlice.length) {
        var wp = wr.computeWritingProfile(wrSlice);
        if (wp.total > 0) {
          if (wp.errors.surface_phonetic >= wp.errors.omission && wp.errors.surface_phonetic > 0) {
            obs.push(api.fill(t.obsWrSurface, { sf: wp.errors.surface_phonetic, tot: wp.total, ca: wp.cartAssisted }));
          } else if (wp.errors.omission > 0) {
            obs.push(api.fill(t.obsWrOmit, { om: wp.errors.omission, tot: wp.total }));
          } else if (wp.accuracy != null) {
            obs.push(api.fill(t.obsWrSummary, { acc: Math.round(wp.accuracy * 100), tot: wp.total }));
          }
        }
      }
    }

    /* 3b. Auditory message comprehension & written-keyword rescue */
    var dc = window.POG.discourse;
    if (dc && dc.computeDiscourseProfile) {
      var dcSlice = streams.discourse.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (dcSlice.length) {
        var dp = dc.computeDiscourseProfile(dcSlice);
        if (dp.total > 0) {
          if (dp.keywordRescued > 0) {
            obs.push(api.fill(t.obsDiscKw, { fp: dp.firstPass, tot: dp.total, kw: dp.keywordRescued }));
          } else {
            obs.push(api.fill(t.obsDiscFirst, { fp: dp.firstPass, tot: dp.total }));
          }
        }
      }
    }

    /* 3c. Rhythmic speech pacing fluency & preferred tempo */
    var pc = window.POG.pacing;
    if (pc && pc.computePacingProfile) {
      var pcSlice = streams.pacing.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (pcSlice.length) {
        var pp = pc.computePacingProfile(pcSlice);
        if (pp.total > 0) {
          var topTempo = Object.keys(pp.tempos).sort(function (a, b) { return pp.tempos[b] - pp.tempos[a]; })[0] || "steady";
          obs.push(api.fill(t.obsPace, { sm: pp.smooth, tot: pp.total, tempo: topTempo }));
        }
      }
    }

    /* 3d. Verb network (VNeST) triad & plausibility profile */
    var vb = window.POG.verbs;
    if (vb && vb.computeVerbsProfile) {
      var vbSlice = streams.verbs.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (vbSlice.length) {
        var vp = vb.computeVerbsProfile(vbSlice);
        if (vp.total > 0) {
          obs.push(api.fill(t.obsVerbs, { tr: vp.triadClean, tot: vp.total, pl: vp.plausClean }));
        }
      }
    }

    /* 3e. Connected narrative sequencing & main-concept retell */
    var nr = window.POG.narrative;
    if (nr && nr.computeNarrativeProfile) {
      var nrSlice = streams.narrative.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (nrSlice.length) {
        var np = nr.computeNarrativeProfile(nrSlice);
        if (np.total > 0) {
          var mcPct = np.meanConcepts != null ? Math.round(np.meanConcepts * 100) : 0;
          obs.push(api.fill(t.obsNarrative, { sq: np.seqClean, tot: np.total, mc: mcPct }));
        }
      }
    }

    /* 3f. Morphosyntax cloze (tenses, prepositions, agreement) */
    var gr = window.POG.grammar;
    if (gr && gr.computeGrammarProfile) {
      var grSlice = streams.grammar.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (grSlice.length) {
        var gp = gr.computeGrammarProfile(grSlice);
        if (gp.total > 0) {
          var fmtKind = function (k) { var b = gp.byKind[k]; return b && b.n ? b.ok + "/" + b.n : "0/0"; };
          obs.push(api.fill(t.obsGrammar, {
            ft: gp.firstTry,
            tot: gp.total,
            tn: fmtKind("tense"),
            pr: fmtKind("prep"),
            ag: fmtKind("agreement")
          }));
        }
      }
    }

    /* 3g. Surface dyslexia / homophone reading profile */
    var sr = window.POG.surface;
    if (sr && sr.computeSurfaceProfile) {
      var srSlice = streams.surface.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (srSlice.length) {
        var sp = sr.computeSurfaceProfile(srSlice);
        if (sp.total > 0) {
          obs.push(api.fill(t.obsSurface, {
            ft: sp.firstTry,
            tot: sp.total,
            rg: sp.errors.regularized,
            hm: sp.errors.homophone
          }));
        }
      }
    }

    /* 3h. Compensatory circumlocution / word-finding bridge profile */
    var cr = window.POG.circumlocution;
    if (cr && cr.computeCircumlocutionProfile) {
      var crSlice = streams.circumlocution.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (crSlice.length) {
        var cp2 = cr.computeCircumlocutionProfile(crSlice);
        if (cp2.total > 0) {
          obs.push(api.fill(t.obsCircumlocution, {
            dw: cp2.directWords,
            ds: cp2.describedSuccess,
            tot: cp2.total
          }));
        }
      }
    }

    /* 3i. Functional numbers, times & prices transcoding profile */
    var nm = window.POG.numbers;
    if (nm && nm.computeNumbersProfile) {
      var nmSlice = streams.numbers.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (nmSlice.length) {
        var np2 = nm.computeNumbersProfile(nmSlice);
        if (np2.total > 0) {
          obs.push(api.fill(t.obsNumbers, {
            ft: np2.firstTry,
            tot: np2.total,
            tr: np2.errors.transposition,
            mg: np2.errors.magnitude
          }));
        }
      }
    }

    /* 3j. Everyday conversational scripts & two-turn repair profile */
    var dg = window.POG.dialogue;
    if (dg && dg.computeDialogueProfile) {
      var dgSlice = streams.dialogue.filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (dgSlice.length) {
        var dp2 = dg.computeDialogueProfile(dgSlice);
        if (dp2.total > 0) {
          obs.push(api.fill(t.obsDialogue, { ft: dp2.cleanBoth, tot: dp2.total }));
        }
      }
    }

    /* 3k. Multi-step receptive syntax & instruction following */
    var instMod = window.POG.instructions;
    if (instMod && instMod.computeInstructionsProfile) {
      var instSlice = (streams.instructions || []).filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (instSlice.length) {
        var ip = instMod.computeInstructionsProfile(instSlice);
        if (ip.total > 0) {
          obs.push(api.fill(t.obsInstructions, {
            ft: ip.firstTry,
            tot: ip.total,
            ord: ip.errors.order_error || 0,
            cl: (ip.errors.attribute_foil || 0) + (ip.errors.clause_trap || 0)
          }));
        }
      }
    }

    /* 3l. Conversational pragmatics & non-literal language */
    var pgMod = window.POG.pragmatics;
    if (pgMod && pgMod.computePragmaticsProfile) {
      var pgSlice = (streams.pragmatics || []).filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (pgSlice.length) {
        var pp2 = pgMod.computePragmaticsProfile(pgSlice);
        if (pp2.total > 0) {
          obs.push(api.fill(t.obsPragmatics, {
            ft: pp2.firstTry,
            tot: pp2.total,
            lit: pp2.errors.literal_trap || 0,
            ctx: pp2.errors.context_slip || 0
          }));
        }
      }
    }

    /* 3m. Scaffolded word-finding & category sprint */
    var flMod = window.POG.fluency;
    if (flMod && flMod.computeFluencyProfile) {
      var flSlice = (streams.fluency || []).filter(function (s) { return inRange(s.date, curFrom, curTo, true); });
      if (flSlice.length) {
        var fp2 = flMod.computeFluencyProfile(flSlice);
        if (fp2.total > 0) {
          obs.push(api.fill(t.obsFluency, {
            avg: String(fp2.avgProduced != null ? fp2.avgProduced : 0),
            tot: fp2.total,
            indep: Math.round((fp2.independentRate || 0) * 100),
            cl: String(fp2.meanClusters != null ? fp2.meanClusters : 0)
          }));
        }
      }
    }

    /* 4. Stability alerts from progress engine */
    if (window.POG.progress && window.POG.progress.localAlerts) {
      var als = window.POG.progress.localAlerts();
      als.slice(0, 2).forEach(function (al) {
        obs.push(api.fill(t.obsAlert, { m: al.m.label, n: (al.a && al.a.last ? al.a.last.length : 3) }));
      });
    }

    /* 4b. Targeted response-latency comparison across Current vs Prior windows */
    var curLat = collectTargetedLatencies(streams, curFrom, curTo, true);
    if (curLat.length >= 3) {
      var curMed = Math.round(median(curLat) * 10) / 10;
      var prevLat = prevFrom != null ? collectTargetedLatencies(streams, prevFrom, curFrom, false) : [];
      var prevMed = prevLat.length >= 3 ? median(prevLat) : null;
      if (prevMed != null && curMed - prevMed >= 1.5) {
        obs.push(api.fill(t.obsLatencySlow, { cur: String(curMed), diff: String(Math.round((curMed - prevMed) * 10) / 10) }));
      } else {
        obs.push(api.fill(t.obsLatency, { cur: String(curMed), n: curLat.length }));
      }
    }

    /* 5. Recent caregiver context tags */
    var cg = window.POG.carelog;
    var recentCare = streams.carelog.filter(function (c) { return inRange(c.date, curFrom, curTo, true); });
    if (recentCare.length && cg && cg.tagLabel) {
      var tagCounts = {};
      recentCare.forEach(function (e) {
        (e.tags || []).forEach(function (tg) { tagCounts[tg] = (tagCounts[tg] || 0) + 1; });
      });
      var tagKeys = Object.keys(tagCounts).sort(function (a, b) { return tagCounts[b] - tagCounts[a]; }).slice(0, 3);
      if (tagKeys.length) {
        obs.push(api.fill(t.obsCareTags, { tags: tagKeys.map(function (k) { return cg.tagLabel(k); }).join(", ") }));
      }
    }

    return obs;
  }

  function computeCareConcordance(streams, domains, curFrom, curTo) {
    var cg = (streams && streams.carelog || []).filter(function (c) {
      return c && c.date && inRange(c.date, curFrom, curTo, true) && c.fcIndex != null && isFinite(+c.fcIndex);
    });
    var careMean = mean(cg.map(function (c) { return clamp01(+c.fcIndex); }));
    var carePct = careMean == null ? null : Math.round(careMean * 100);
    var scored = (domains || []).filter(function (d) { return d && d.cur != null && isFinite(+d.cur); });
    var objMean = mean(scored.map(function (d) { return +d.cur; }));
    var objPct = objMean == null ? null : Math.round(objMean);
    if (carePct == null || objPct == null) {
      return { carePct: carePct, objPct: objPct, diffPt: null, status: "empty" };
    }
    var diffPt = carePct - objPct;
    var status = diffPt <= -10 ? "lower" : diffPt >= 10 ? "higher" : "aligned";
    return { carePct: carePct, objPct: objPct, diffPt: diffPt, status: status };
  }

  function recommendFocusPlan(brief, tOpt) {
    var t = tOpt || T();
    var scored = (brief && brief.domains || []).filter(function (d) { return d.cur != null; }).slice();
    scored.sort(function (a, b) {
      var sa = a.cur - (a.status === "down" ? 8 : 0);
      var sb = b.cur - (b.status === "down" ? 8 : 0);
      return sa - sb;
    });
    var top = scored.slice(0, 3);
    var items = top.map(function (d) {
      return {
        key: d.key,
        pct: d.cur,
        text: api.fill((t.planItems && t.planItems[d.key]) || "", { pct: String(d.cur) })
      };
    }).filter(function (x) { return !!x.text; });

    var byKey = {};
    (brief && brief.domains || []).forEach(function (d) { byKey[d.key] = d.cur; });
    var recommendedFocus = "mixed";
    if (top.length) {
      var primary = top[0].key;
      var gapOk = scored.length < 2 || (top[top.length - 1].cur - top[0].cur >= 10) || top[0].cur < 75;
      if (gapOk) {
        if (primary === "syntax") recommendedFocus = "nfv";
        else if (primary === "speech") recommendedFocus = (byKey.syntax != null && byKey.syntax < 75) ? "nfv" : "lv";
        else if (primary === "lexical" || primary === "literacy") recommendedFocus = "sv";
      }
    }
    return {
      recommendedFocus: recommendedFocus,
      focusLabel: (t.focusLabels && t.focusLabels[recommendedFocus]) || recommendedFocus,
      items: items
    };
  }

  function buildBrief(windowDays, nowMs) {
    var t = T();
    var days = windowDays === 7 || windowDays === 90 ? windowDays : 30;
    var end = nowMs != null ? nowMs : new Date().getTime();
    var curFrom = end - days * DAY;
    var prevFrom = curFrom - days * DAY;
    var streams = collectStreams();
    var cur = windowScores(streams, curFrom, end, true);
    var prev = windowScores(streams, prevFrom, curFrom, false);

    var domains = DOMAIN_KEYS.map(function (k) {
      var c = cur[k], p = prev[k];
      var delta = c.pct != null && p.pct != null ? c.pct - p.pct : null;
      var status = "empty";
      if (c.pct != null && p.pct != null) {
        status = delta >= 5 ? "up" : delta <= -5 ? "down" : "stable";
      } else if (c.pct != null) {
        status = "new";
      }
      return {
        key: k,
        name: t.domains[k],
        sub: t.domSub[k],
        cur: c.pct,
        curN: c.n,
        prev: p.pct,
        prevN: p.n,
        delta: delta,
        status: status
      };
    });

    var observations = deriveObservations(streams, curFrom, end, t, prevFrom);
    var concordance = computeCareConcordance(streams, domains, curFrom, end);
    if (concordance.status !== "empty") {
      var cTpl = concordance.status === "lower" ? t.obsCareLower : concordance.status === "higher" ? t.obsCareHigher : t.obsCareAligned;
      observations.push(api.fill(cTpl, {
        care: concordance.carePct,
        obj: concordance.objPct,
        abs: Math.abs(concordance.diffPt)
      }));
    }
    var notesCare = streams.carelog.filter(function (c) { return c.note; });
    var latestNote = notesCare.length ? notesCare[notesCare.length - 1] : null;
    var result = {
      windowDays: days,
      curFrom: curFrom,
      curTo: end,
      prevFrom: prevFrom,
      adherence: computeAdherenceSummary(streams, curFrom, end),
      domains: domains,
      observations: observations,
      concordance: concordance,
      latestNote: latestNote
    };
    result.plan = recommendFocusPlan(result, t);
    return result;
  }

  function renderDomainSvg(domains, t) {
    var w = 640, rowH = 54, padT = 18, padB = 18, labelW = 225, barMaxW = 310, h = padT + domains.length * rowH + padB;
    var rows = domains.map(function (d, idx) {
      var y = padT + idx * rowH;
      var curW = d.cur != null ? Math.max(4, Math.round((d.cur / 100) * barMaxW)) : 0;
      var prevW = d.prev != null ? Math.max(4, Math.round((d.prev / 100) * barMaxW)) : 0;
      var shortName = d.name.length > 26 ? d.name.slice(0, 25) + "…" : d.name;
      return '<g>' +
        '<text x="6" y="' + (y + 22) + '" class="br-svg-lbl">' + esc(shortName) + '</text>' +
        '<rect x="' + labelW + '" y="' + (y + 8) + '" width="' + barMaxW + '" height="12" rx="6" class="br-svg-track"/>' +
        (d.prev != null ? '<rect x="' + labelW + '" y="' + (y + 24) + '" width="' + prevW + '" height="10" rx="5" class="br-svg-prev"/>' : '') +
        (d.cur != null ? '<rect x="' + labelW + '" y="' + (y + 8) + '" width="' + curW + '" height="12" rx="6" class="br-svg-cur"/>' : '') +
        '<text x="' + (labelW + barMaxW + 14) + '" y="' + (y + 20) + '" class="br-svg-val">' + esc(d.cur != null ? d.cur + "%" : "–") + '</text>' +
        '</g>';
    }).join("");

    return '<div class="br-chartwrap">' +
      '<p class="br-chart-title">' + esc(t.chartTitle) + '</p>' +
      '<svg class="br-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(t.chartTitle) + '">' + rows + '</svg>' +
      '<div class="br-legend"><span><i class="sw cur"></i> ' + esc(t.legendCur) + '</span><span><i class="sw prev"></i> ' + esc(t.legendPrev) + '</span></div>' +
      '</div>';
  }

  function buildPlainTextBrief(brief, profile) {
    var t = T();
    var lines = [];
    var today = new Date().toLocaleDateString(loc(), { day: "numeric", month: "short", year: "numeric" });
    lines.push(api.fill(t.briefHead, { date: today }));
    lines.push(api.fill(t.briefPatient, { name: (profile && profile.name) || "—", days: brief.windowDays }));
    if (brief.adherence) {
      lines.push(api.fill(t.briefActivity, {
        days: brief.adherence.activeDays,
        sessions: brief.adherence.sessionCount,
        items: brief.adherence.itemCount
      }));
    }
    lines.push("");
    lines.push(t.briefDomainsHead);
    brief.domains.forEach(function (d) {
      var curTxt = d.cur != null ? d.cur + "%" : t.noData;
      var prevTxt = d.prev != null ? " (" + t.prevCol + ": " + d.prev + "%)" : "";
      var delTxt = d.delta != null ? " [" + (d.delta >= 0 ? "+" : "") + d.delta + " pt]" : "";
      lines.push("- " + d.name + ": " + curTxt + prevTxt + delTxt);
    });
    if (brief.observations.length) {
      lines.push("");
      lines.push(t.briefObsHead);
      brief.observations.forEach(function (o) { lines.push("* " + o); });
    }
    if (brief.plan && brief.plan.items && brief.plan.items.length) {
      lines.push("");
      lines.push(t.briefPlanHead);
      brief.plan.items.forEach(function (p) { lines.push("- " + p.text); });
    }
    var visitNote = getVisitNote();
    if (visitNote) {
      lines.push("");
      lines.push(t.briefVisitHead);
      lines.push("- " + visitNote);
    }
    var ppMod = window.POG.passport;
    if (ppMod && ppMod.get) {
      var ppCard = ppMod.get();
      var ppTags = ppMod.activeStrategyLabels ? ppMod.activeStrategyLabels() : [];
      if (ppTags.length || ppCard.medNote) {
        lines.push("");
        lines.push(t.briefSupportHead);
        if (ppTags.length) lines.push("- " + ppTags.join(", "));
        if (ppCard.medNote) lines.push("- " + ppCard.medNote);
      }
    }
    if (brief.latestNote && brief.latestNote.note) {
      lines.push("");
      lines.push(t.briefCareHead);
      lines.push(new Date(brief.latestNote.date).toLocaleDateString(loc()) + ": " + brief.latestNote.note);
    }
    lines.push("");
    lines.push(t.briefFooter);
    return lines.join("\n");
  }

  function getVisitNote() {
    var v = api.load("brief_visit_note");
    return typeof v === "string" ? v.trim() : "";
  }

  var V = { windowDays: 30 };

  function viewScreen() {
    var t = T();
    var prof = api.getProfile ? api.getProfile() : {};
    var b = buildBrief(V.windowDays);
    var briefTxt = buildPlainTextBrief(b, prof);
    var f = api.flashText ? api.flashText() : "";

    var seg = '<div class="seg" role="group" aria-label="' + esc(t.windowLabel) + '">' +
      [7, 30, 90].map(function (d) {
        return '<button type="button" data-act="br-win" data-d="' + d + '" aria-pressed="' + (V.windowDays === d) + '">' + esc(t.windows[String(d)]) + '</button>';
      }).join("") + '</div>';

    var cards = '<div class="br-grid">' + b.domains.map(function (d) {
      var badgeCls = d.status === "up" ? "good" : d.status === "down" ? "worse" : "stable";
      var badgeTxt = d.status === "up" ? "▲ " + t.trendUp :
        d.status === "down" ? "▼ " + t.trendDown :
        d.status === "stable" ? "● " + t.trendStable :
        d.status === "new" ? "· " + t.trendNew : t.trendEmpty;
      var deltaStr = d.delta != null ? ((d.delta >= 0 ? "+" : "") + d.delta + " pt") : "–";
      return '<div class="br-card">' +
        '<div class="br-card-top"><div><strong>' + esc(d.name) + '</strong><p class="note">' + esc(d.sub) + '</p></div>' +
        '<span class="pv ' + badgeCls + '">' + esc(badgeTxt) + '</span></div>' +
        '<div class="br-nums">' +
        '<div><span>' + esc(t.curCol) + '</span><strong class="br-score">' + esc(d.cur != null ? d.cur + "%" : "–") + '</strong></div>' +
        '<div><span>' + esc(t.prevCol) + '</span><strong>' + esc(d.prev != null ? d.prev + "%" : "–") + '</strong></div>' +
        '<div><span>' + esc(t.deltaCol) + '</span><strong>' + esc(deltaStr) + '</strong></div>' +
        '</div>' +
        (d.curN ? '<p class="note br-sig">' + esc(api.fill(t.sigCount, { n: d.curN })) + '</p>' : '') +
        '</div>';
    }).join("") + '</div>';

    var obsHtml = b.observations.length
      ? '<ul class="br-obs">' + b.observations.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join("") + '</ul>'
      : '<p class="sub">' + esc(t.obsNone) + '</p>';

    var planHtml = (b.plan && b.plan.items && b.plan.items.length)
      ? '<div class="br-plan">' +
        '<h2>' + esc(t.planTitle) + '</h2>' +
        '<p class="note">' + esc(t.planSub) + '</p>' +
        '<ul class="br-obs">' + b.plan.items.map(function (p) { return '<li>' + esc(p.text) + '</li>'; }).join("") + '</ul>' +
        '<div class="row-actions no-print"><button type="button" class="secondary" data-act="br-apply-focus" data-f="' + esc(b.plan.recommendedFocus) + '">' +
        esc(api.fill(t.planApply, { focus: b.plan.focusLabel })) + '</button></div>' +
        '</div>'
      : '';

    var visitNoteHtml = '<div class="br-plan no-print">' +
      '<label for="br-visit-note" class="vb-sub">' + esc(t.visitNoteLabel) + '</label>' +
      '<input id="br-visit-note" type="text" maxlength="200" placeholder="' + esc(t.visitNotePh) + '" value="' + esc(getVisitNote()) + '">' +
      '<div class="row-actions"><button type="button" class="secondary" data-act="br-save-note">' + esc(t.visitNoteSave) + '</button></div>' +
      '</div>';

    var adhHtml = b.adherence
      ? '<div class="br-adherence">' +
        '<div><span>' + esc(t.adhDays) + '</span><strong>' + b.adherence.activeDays + '</strong></div>' +
        '<div><span>' + esc(t.adhSessions) + '</span><strong>' + b.adherence.sessionCount + '</strong></div>' +
        '<div><span>' + esc(t.adhItems) + '</span><strong>' + b.adherence.itemCount + '</strong></div>' +
        '</div>'
      : '';

    var inHost = api.inHost && api.inHost();
    return api.header(false) + '<section class="card">' +
      '<article class="print-area br-printarea">' +
      '<h1 class="instr">' + esc(t.title) + '</h1>' +
      '<p class="sub">' + esc(t.intro) + '</p>' +
      '<div class="no-print">' + seg + '</div>' +
      adhHtml +
      cards +
      renderDomainSvg(b.domains, t) +
      '<div class="report">' +
      '<h2>' + esc(t.obsTitle) + '</h2>' + obsHtml +
      planHtml +
      visitNoteHtml +
      '<h2 class="no-print">' + esc(t.briefTitle) + '</h2>' +
      '<p class="note no-print">' + esc(t.briefHelp) + '</p>' +
      '<div class="row-actions no-print"><button type="button" class="secondary" data-act="brief-copy">' + esc(t.copyBtn) + '</button>' +
      (!inHost ? '<button type="button" class="secondary" data-act="brief-print">' + esc(t.printBtn) + '</button>' : '') + '</div>' +
      (f ? '<p class="nudge no-print" role="status">' + esc(f) + '</p>' : '') +
      '<textarea readonly id="brief-text" class="br-pre no-print" rows="8">' + esc(briefTxt) + '</textarea>' +
      '<p class="note">' + esc(t.disclaimer) + '</p>' +
      '</div>' +
      '</article>' +
      '<button type="button" class="link no-print" data-act="br-back">' + esc(t.back) + '</button>' +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.brief = function () { return api.therapistUnlocked() ? viewScreen() : api.therapistView(); };
  A.brief = function () { api.go("brief"); };
  A["br-back"] = function () { api.go("therapist"); };
  A["br-win"] = function (b) {
    var d = +b.getAttribute("data-d");
    V.windowDays = d === 7 || d === 90 ? d : 30;
    api.render();
  };
  A["br-apply-focus"] = function (b) {
    var f = b.getAttribute("data-f");
    if (["mixed", "nfv", "sv", "lv"].indexOf(f) < 0) return;
    var curCfg = api.load("variant_settings") || {};
    curCfg.focus = f;
    api.save("variant_settings", curCfg);
    var t = T();
    if (api.flash) api.flash(api.fill(t.planApplied, { focus: (t.focusLabels && t.focusLabels[f]) || f }));
    api.render();
  };
  A["br-save-note"] = function () {
    var el = document.getElementById("br-visit-note");
    var val = (el ? el.value : "").trim().slice(0, 200);
    api.save("brief_visit_note", val);
    var t = T();
    if (api.flash) api.flash(t.visitNoteSaved);
    api.render();
  };
  A["brief-print"] = function () { try { window.print(); } catch (e) {} };
  A["brief-copy"] = function () {
    var t = T(), el = document.getElementById("brief-text");
    var txt = el ? el.value : buildPlainTextBrief(buildBrief(V.windowDays), api.getProfile ? api.getProfile() : {});
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        if (api.flash) api.flash(t.copied);
        api.render();
      }, function () {
        if (el) { el.focus(); el.select(); }
        if (api.flash) api.flash(t.copyFail);
        api.render();
      });
    } else {
      if (el) { el.focus(); el.select(); }
      if (api.flash) api.flash(t.copied);
      api.render();
    }
  };

  window.addEventListener("pog:languagechange", function () {
    if (api.screen() === "brief") api.render();
  });
  window.addEventListener("pog:profile-change", function () {
    V = { windowDays: 30 };
  });

  window.POG.brief = {
    DOMAIN_KEYS: DOMAIN_KEYS,
    buildBrief: buildBrief,
    recommendFocusPlan: recommendFocusPlan,
    computeAdherenceSummary: computeAdherenceSummary,
    computeCareConcordance: computeCareConcordance,
    buildPlainTextBrief: buildPlainTextBrief,
    renderDomainSvg: renderDomainSvg,
    label: function () { return T().btn; }
  };
})();
