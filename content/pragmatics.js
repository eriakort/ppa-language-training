/*
 * Bilingual bank for Conversational Pragmatics & Non-Literal Language ("Oltre le parole / Beyond literal words").
 * Clinical rationale: Targets comprehension of everyday figurative expressions (idioms),
 * polite indirect requests, and speaker tone/understatement — abilities frequently affected
 * early in semantic-variant (svPPA) and non-fluent PPA (nfvPPA).
 *
 * Balanced per language across Levels 1..3 (4 items/level) and 3 kinds (idiom, indirect, tone: 4/4/4).
 * Option convention: opts[0] = intended pragmatic meaning, opts[1] = literal trap foil, opts[2] = off-context foil.
 */
(function () {
  "use strict";
  window.POG = window.POG || {};
  window.POG.content = window.POG.content || {};

  window.POG.content.PRAGMATICS = {
    it: [
      /* Level 3 — transparent everyday idioms, clear indirect requests & gentle tone (more support) */
      {
        id: "prag_it_1", lv: 3, kind: "idiom", pic: "🥐",
        context: "Al bar prima di partire, Marta guarda i suoi amici.",
        utterance: "«Forza, diamoci una mossa altrimenti perdiamo il treno!»",
        slowText: "Forza, diamoci una mossa... altrimenti perdiamo il treno!",
        cue: "Non parla di fare ginnastica: guarda il motivo finale («perdere il treno»).",
        opts: [
          "Dobbiamo sbrigarci ad andare",
          "Dobbiamo fare esercizi fisici qui al bar",
          "Dobbiamo restare seduti ad aspettare"
        ],
        errFocus: "literal_trap",
        explanation: "«Darsi una mossa» significa affrettarsi, non fare un movimento ginnico."
      },
      {
        id: "prag_it_2", lv: 3, kind: "indirect", pic: "🪟",
        context: "In salotto entra una corrente fredda mentre guardate la TV.",
        utterance: "«Scusa, non senti anche tu un po' d'aria dalla finestra?»",
        slowText: "Scusa... non senti anche tu un po' d'aria dalla finestra?",
        cue: "È una domanda gentile che nasconde una piccola richiesta pratica.",
        opts: [
          "Ti chiede con cortesia di chiudere la finestra",
          "Vuole una lezione sul meteo e sul vento",
          "Ti sta chiedendo di aprire anche la porta"
        ],
        errFocus: "literal_trap",
        explanation: "Chiedere se senti aria è un modo educato per chiedere di chiudere la finestra."
      },
      {
        id: "prag_it_3", lv: 3, kind: "tone", pic: "🌧️",
        context: "Piove a dirotto proprio il giorno della passeggiata al parco.",
        utterance: "«Che bella giornata per un picnic sull'erba, vero?»",
        slowText: "Che bella giornata per un picnic sull'erba... vero?",
        cue: "Guarda fuori dalla finestra: sta diluviando. Il tono è ironico.",
        opts: [
          "È deluso perché il brutto tempo rovina i piani",
          "È felicissimo che stia piovendo sul cibo",
          "Sta cercando l'ombrellone per prendere il sole"
        ],
        errFocus: "literal_trap",
        explanation: "Quando diluvia, dire «che bella giornata» esprime contrarietà in tono scherzoso."
      },
      {
        id: "prag_it_4", lv: 3, kind: "idiom", pic: "🎂",
        context: "Luca riceve un regalo a sorpresa dai nipoti.",
        utterance: "«Ragazzi, mi avete fatto toccare il cielo con un dito!»",
        slowText: "Ragazzi... mi avete fatto toccare il cielo con un dito!",
        cue: "È un modo di dire per esprimere un'emozione fortissima.",
        opts: [
          "Sono enormemente felice ed emozionato",
          "Sono salito sul tetto per toccare le nuvole",
          "Ho bisogno di un metro per misurare la stanza"
        ],
        errFocus: "literal_trap",
        explanation: "«Toccare il cielo con un dito» vuole dire provare una grandissima gioia."
      },

      /* Level 2 — everyday social diplomacy, indirect refusals & idiomatic phrasing */
      {
        id: "prag_it_5", lv: 2, kind: "indirect", pic: "☕",
        context: "Dopo cena un ospite guarda l'orologio alle dieci e mezza.",
        utterance: "«È stato bello vedervi, ma domani suona la sveglia presto.»",
        slowText: "È stato bello vedervi... ma domani suona la sveglia presto.",
        cue: "Non sta parlando della marca della sveglia: sta preparando i saluti.",
        opts: [
          "Sta dicendo con garbo che è ora di tornare a casa",
          "Vuole regalarti la sua sveglia nuova",
          "Propone di preparare un altro caffè forte"
        ],
        errFocus: "context_slip",
        explanation: "Ricordare la sveglia del mattino è un modo cortese per annunciare che si va via."
      },
      {
        id: "prag_it_6", lv: 2, kind: "idiom", pic: "💧",
        context: "Elena parla del piccolo aumento dopo mesi di spese impreviste.",
        utterance: "«Questi cinquanta euro sono una goccia nel mare.»",
        slowText: "Questi cinquanta euro... sono una goccia nel mare.",
        cue: "Confronta una goccia piccolissima con tutto il mare.",
        opts: [
          "È una cifra troppo piccola rispetto al bisogno",
          "I soldi si sono bagnati in spiaggia",
          "È una somma più che sufficiente per tutto l'anno"
        ],
        errFocus: "literal_trap",
        explanation: "«Una goccia nel mare» indica qualcosa di minimo rispetto a ciò che serve."
      },
      {
        id: "prag_it_7", lv: 2, kind: "tone", pic: "🍲",
        context: "Il cuoco assaggia la minestra e fa una smorfia leggera.",
        utterance: "«Diciamo che non passerà alla storia come il mio piatto migliore.»",
        slowText: "Diciamo che non passerà alla storia... come il mio piatto migliore.",
        cue: "È un'attenuazione educata per ammettere un piccolo fallimento.",
        opts: [
          "La minestra non è venuta molto buona stavolta",
          "Vuole scrivere un libro di cucina antica",
          "Pensa che sia il piatto più buono mai cucinato"
        ],
        errFocus: "context_slip",
        explanation: "Dire che «non passerà alla storia» è un modo discreto per dire che non è riuscita bene."
      },
      {
        id: "prag_it_8", lv: 2, kind: "indirect", pic: "🛒",
        context: "Davanti alla porta del negozio hai due borse pesanti in mano.",
        utterance: "«Non è che avresti una mano libera per la maniglia?»",
        slowText: "Non è che avresti una mano libera per la maniglia?",
        cue: "Dietro alla domanda gentile c'è un aiuto concreto da fare.",
        opts: [
          "Ti chiede di aprire la porta al posto suo",
          "Ti chiede quante dita hai sulla mano sinistra",
          "Ti chiede di posare le tue chiavi per terra"
        ],
        errFocus: "literal_trap",
        explanation: "Chi ha le mani occupate usa questa domanda indiretta per chiedere di aprire la porta."
      },

      /* Level 1 — subtle irony, hedged refusal & less transparent expressions */
      {
        id: "prag_it_9", lv: 1, kind: "idiom", pic: "🧱",
        context: "Dopo tre telefonate all'ufficio, Paolo sospira sconsolato.",
        utterance: "«Con quel servizio clienti è come parlare al muro.»",
        slowText: "Con quel servizio clienti... è come parlare al muro.",
        cue: "Un muro non ascolta e non risponde: che sensazione descrive?",
        opts: [
          "Non ascoltano e non danno alcuna risposta utile",
          "L'impiegato stava ridipingendo la parete dell'ufficio",
          "La linea telefonica ha un ottimo segnale"
        ],
        errFocus: "literal_trap",
        explanation: "«Parlare al muro» significa parlare con chi non ascolta o non collabora affatto."
      },
      {
        id: "prag_it_10", lv: 1, kind: "tone", pic: "🧳",
        context: "Arrivi in stazione e il treno ha già accumulato 50 minuti di ritardo.",
        utterance: "«Fantastico, proprio quello che mancava oggi!»",
        slowText: "Fantastico... proprio quello che mancava oggi!",
        cue: "Controlla la situazione (50 minuti di ritardo) rispetto alla parola «fantastico».",
        opts: [
          "È infastidito da questo ulteriore intoppo",
          "È entusiasta di poter aspettare un'ora al freddo",
          "Ha appena vinto un biglietto di prima classe"
        ],
        errFocus: "literal_trap",
        explanation: "Dopo un ritardo sgradito, «fantastico» è usato in senso chiaramente ironico."
      },
      {
        id: "prag_it_11", lv: 1, kind: "indirect", pic: "🍽️",
        context: "Proponi un ristorante molto caro e tua sorella stringe le spalle.",
        utterance: "«È un bel posto, magari però teniamolo per un'occasione speciale.»",
        slowText: "È un bel posto... magari però teniamolo per un'occasione speciale.",
        cue: "Nota il «però» morbido: sta dicendo di sì per stasera o sta rimandando?",
        opts: [
          "Preferisce scegliere un posto più semplice stasera",
          "Vuole prenotare subito un tavolo per stasera lì",
          "Sta chiedendo se il ristorante è aperto a colazione"
        ],
        errFocus: "context_slip",
        explanation: "Rimandare a un'«occasione speciale» è un rifiuto cortese della proposta per oggi."
      },
      {
        id: "prag_it_12", lv: 1, kind: "tone", pic: "🔇",
        context: "Sul treno qualcuno parla ad alta voce al telefono accanto a voi.",
        utterance: "«Temo che ormai anche l'ultima carrozza conosca tutta la storia.»",
        slowText: "Temo che ormai anche l'ultima carrozza... conosca tutta la storia.",
        cue: "Sottolinea in modo arguto che il volume è troppo alto.",
        opts: [
          "Sta facendo notare che quella persona parla troppo forte",
          "Pensa che l'altoparlante del treno stia leggendo un romanzo",
          "È curioso di conoscere il finale della telefonata"
        ],
        errFocus: "context_slip",
        explanation: "È una battuta sottile per commentare la mancanza di discrezione e il volume alto."
      }
    ],

    en: [
      /* Level 3 — transparent everyday idioms, clear indirect requests & gentle tone (more support) */
      {
        id: "prag_en_1", lv: 3, kind: "idiom", pic: "🥐",
        context: "At the café before heading to the station, Martha looks at her watch.",
        utterance: "“Come on, let's get a move on or we'll miss the train!”",
        slowText: "Come on, let's get a move on... or we'll miss the train!",
        cue: "She isn't talking about exercise — look at the reason (“miss the train”).",
        opts: [
          "We need to hurry up and leave right away",
          "We should do stretching exercises in the café",
          "We should sit down and order another pastry"
        ],
        errFocus: "literal_trap",
        explanation: "“Get a move on” means hurry up, not move around for fitness."
      },
      {
        id: "prag_en_2", lv: 3, kind: "indirect", pic: "🪟",
        context: "A chilly breeze blows into the sitting room while you watch television.",
        utterance: "“Excuse me, do you feel a bit of a draught from that window?”",
        slowText: "Excuse me... do you feel a bit of a draught from that window?",
        cue: "This polite question carries a practical request.",
        opts: [
          "They are politely asking you to shut the window",
          "They want a weather forecast for tomorrow afternoon",
          "They are asking you to open the back door as well"
        ],
        errFocus: "literal_trap",
        explanation: "Mentioning a draught is a polite, indirect way of asking to close the window."
      },
      {
        id: "prag_en_3", lv: 3, kind: "tone", pic: "🌧️",
        context: "Rain pours down on the exact morning of your garden picnic.",
        utterance: "“What lovely weather for sitting out on the grass, isn't it?”",
        slowText: "What lovely weather for sitting out on the grass... isn't it?",
        cue: "Look at the pouring rain outside — notice the playful sarcasm.",
        opts: [
          "They are disappointed because the rain ruined the picnic",
          "They are thrilled to eat soggy sandwiches in the rain",
          "They are checking where to hang out the laundry"
        ],
        errFocus: "literal_trap",
        explanation: "Calling pouring rain “lovely weather” is lighthearted irony showing disappointment."
      },
      {
        id: "prag_en_4", lv: 3, kind: "idiom", pic: "🎂",
        context: "Arthur opens a surprise birthday photo album from his grandchildren.",
        utterance: "“You children have put me over the moon today!”",
        slowText: "You children have put me... over the moon today!",
        cue: "He is expressing a strong feeling, not talking about space travel.",
        opts: [
          "He feels deeply thrilled and happy",
          "He climbed into a rocket above the sky",
          "He wants to look at a telescope tonight"
        ],
        errFocus: "literal_trap",
        explanation: "“Over the moon” is an everyday idiom meaning extremely happy."
      },

      /* Level 2 — social diplomacy, polite indirect exit & idiomatic sizing */
      {
        id: "prag_en_5", lv: 2, kind: "indirect", pic: "☕",
        context: "After dinner, your guest glances at her watch at half past ten.",
        utterance: "“It's been lovely catching up, though my alarm goes off early tomorrow.”",
        slowText: "It's been lovely catching up... though my alarm goes off early tomorrow.",
        cue: "She isn't asking about clocks — she is preparing to wrap up the visit.",
        opts: [
          "She is politely signalling that it's time to head home",
          "She wants to lend you her alarm clock for the week",
          "She hopes to stay up and play another board game"
        ],
        errFocus: "context_slip",
        explanation: "Mentioning an early alarm is a gentle, courteous way of saying goodbye."
      },
      {
        id: "prag_en_6", lv: 2, kind: "idiom", pic: "💧",
        context: "Helen looks at a tiny refund after paying a huge repair bill.",
        utterance: "“Honestly, twenty pounds is just a drop in the ocean.”",
        slowText: "Honestly, twenty pounds... is just a drop in the ocean.",
        cue: "Compare one small drop against an entire sea.",
        opts: [
          "It is far too little compared with what is needed",
          "The banknotes accidentally fell into saltwater",
          "It covers every single household bill with plenty left"
        ],
        errFocus: "literal_trap",
        explanation: "“A drop in the ocean” means a tiny amount compared with the full need."
      },
      {
        id: "prag_en_7", lv: 2, kind: "tone", pic: "🍲",
        context: "The cook tastes the salty soup and pulls a wry face.",
        utterance: "“Let's just say it won't win any culinary prizes tonight.”",
        slowText: "Let's just say... it won't win any culinary prizes tonight.",
        cue: "Understatement softens a mild mistake in a humorous way.",
        opts: [
          "The soup didn't turn out very well",
          "He plans to enter a baking competition tomorrow",
          "He thinks this is the tastiest dish he ever made"
        ],
        errFocus: "context_slip",
        explanation: "Saying it “won't win prizes” is gentle understatement for a dish that went wrong."
      },
      {
        id: "prag_en_8", lv: 2, kind: "indirect", pic: "🛒",
        context: "Standing outside the shop door, your friend holds two heavy shopping bags.",
        utterance: "“You wouldn't happen to have a free hand for that handle, would you?”",
        slowText: "You wouldn't happen to have a free hand... for that handle?",
        cue: "Beneath the polite phrasing is a simple favour.",
        opts: [
          "They are asking you to open the door for them",
          "They are asking whether you dropped your gloves",
          "They want you to carry their bags back to the till"
        ],
        errFocus: "literal_trap",
        explanation: "Asking for a “free hand for the handle” is an indirect request to open the door."
      },

      /* Level 1 — subtle irony, hedged refusal & non-transparent phrasing */
      {
        id: "prag_en_9", lv: 1, kind: "idiom", pic: "🧱",
        context: "After three frustrating calls with the utility desk, Paul sighs.",
        utterance: "“Calling that helpline felt like talking to a brick wall.”",
        slowText: "Calling that helpline... felt like talking to a brick wall.",
        cue: "A brick wall neither listens nor answers back.",
        opts: [
          "Nobody listened or gave him a helpful reply",
          "The clerk was building a garden wall outside",
          "The phone call resolved everything in two minutes"
        ],
        errFocus: "literal_trap",
        explanation: "“Talking to a brick wall” means getting zero response or cooperation."
      },
      {
        id: "prag_en_10", lv: 1, kind: "tone", pic: "🧳",
        context: "You reach the platform and see the train is delayed by fifty minutes.",
        utterance: "“Brilliant — just what I was hoping for today!”",
        slowText: "Brilliant... just what I was hoping for today!",
        cue: "Compare the word “brilliant” with an unwelcome fifty-minute delay.",
        opts: [
          "They are annoyed by yet another unwelcome delay",
          "They are delighted to wait an hour on a cold platform",
          "They were upgraded to a luxury express seat"
        ],
        errFocus: "literal_trap",
        explanation: "Saying “brilliant” about a long delay is clear everyday irony."
      },
      {
        id: "prag_en_11", lv: 1, kind: "indirect", pic: "🍽️",
        context: "You suggest a pricey restaurant for tonight and your sister hesitates.",
        utterance: "“It looks lovely, though maybe let's save it for a special occasion.”",
        slowText: "It looks lovely... though maybe let's save it for a special occasion.",
        cue: "Notice the soft “though”: is she agreeing for tonight or gently steering elsewhere?",
        opts: [
          "She would prefer somewhere simpler tonight",
          "She wants to book a table there for tonight right now",
          "She is asking whether they serve breakfast on Sundays"
        ],
        errFocus: "context_slip",
        explanation: "“Save it for a special occasion” is a polite, indirect refusal for tonight."
      },
      {
        id: "prag_en_12", lv: 1, kind: "tone", pic: "🔇",
        context: "On the quiet train carriage, someone chats loudly on speakerphone beside you.",
        utterance: "“I fear the back carriage may now know their entire life story.”",
        slowText: "I fear the back carriage... may now know their entire life story.",
        cue: "A dry comment highlighting how far that person's voice carries.",
        opts: [
          "They are dryly noting the caller is speaking far too loudly",
          "They think the train guard is reading an autobiography",
          "They want to join in the phone conversation"
        ],
        errFocus: "context_slip",
        explanation: "This understated remark points out the caller's excessive volume in a quiet carriage."
      }
    ]
  };
})();
