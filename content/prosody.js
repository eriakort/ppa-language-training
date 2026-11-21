/*
 * Bilingual Prosody, Word Stress & Spoken Intonation content (IT & EN).
 * Targets:
 *   - `stress`  : lexical syllable stress discrimination (minimal stress pairs & polysyllables)
 *   - `focus`   : contrastive sentence focus based on conversational question
 *   - `contour` : communicative intonation (Question ↗, Calm Statement ↘, Urgent Call !)
 *
 * Level convention: 1 = most demanding, 3 = most support.
 * 18 items total: 9 Italian + 9 English (3 items per level, 1 of each kind per level).
 */
window.POG = window.POG || {};
window.POG.content = window.POG.content || {};

window.POG.content.PROSODY = {
  it: [
    /* Level 1 */
    {
      id: "pr_it_1", lv: 1, kind: "stress", icon: "⚓",
      word: "Ancora",
      prompt: "Dove cade l'accento per dire «l'oggetto della nave»?",
      syllables: ["ÀN", "co", "ra"],
      stressIdx: 0,
      spoken: "Àncora, quella della nave.",
      cue: "Pensa al primo battito forte: ÀN-co-ra (diverso da «ancóra», di nuovo).",
      explain: "ÀN-co-ra (accento sulla 1ª sillaba) è lo strumento della nave; an-có-ra significa «di nuovo»."
    },
    {
      id: "pr_it_2", lv: 1, kind: "focus", icon: "🗣️",
      prompt: "Quale parola sottolinei con la voce per rispondere?",
      question: "A chi hai dato la ricetta medica?",
      words: ["Ho", "dato", "la ricetta", "al FARMACISTA"],
      focusIdx: 3,
      spoken: "Ho dato la ricetta al FARMACISTA.",
      cue: "La domanda chiede «A chi?»: carica la voce sulla persona che riceve.",
      explain: "Mettere l'accento su «al FARMACISTA» chiarisce subito a chi è stata consegnata."
    },
    {
      id: "pr_it_3", lv: 1, kind: "contour", icon: "❓",
      prompt: "Ascolta o leggi la frase: quale tono comunica meglio?",
      utterance: "Ha preso le medicine stamattina?",
      spoken: "Ha preso le medicine stamattina?",
      contour: "question",
      choices: [
        "Domanda aperta (la voce sale alla fine ↗)",
        "Affermazione calma (la voce scende alla fine ↘)",
        "Avviso urgente (tono breve e forte !)"
      ],
      ans: 0,
      cue: "Alla fine della domanda la voce sale verso l'alto per chiedere conferma.",
      explain: "Il tono ascendente finale (↗) fa capire a chi ascolta che aspetti una risposta."
    },

    /* Level 2 */
    {
      id: "pr_it_4", lv: 2, kind: "stress", icon: "🧭",
      word: "Capitano",
      prompt: "Dove cade l'accento per indicare «chi guida la squadra»?",
      syllables: ["ca", "pi", "TÀ", "no"],
      stressIdx: 2,
      spoken: "Il capitàno della squadra.",
      cue: "Senti il colpo forte sulla penultima sillaba: ca-pi-TÀ-no.",
      explain: "ca-pi-TÀ-no indica il comandante o chi guida la squadra; cà-pi-ta-no è il verbo succedere."
    },
    {
      id: "pr_it_5", lv: 2, kind: "focus", icon: "🍵",
      prompt: "Quale parola va messa in rilievo per correggere l'errore?",
      question: "Vuoi un caffè caldo? — No, vorrei un…",
      words: ["Vorrei", "un", "TÈ", "caldo"],
      focusIdx: 2,
      spoken: "Vorrei un TÈ caldo.",
      cue: "Sottolinea la bevanda diversa rispetto a quella proposta.",
      explain: "Evidenziare «TÈ» aiuta subito il cameriere o il familiare a cogliere il cambio."
    },
    {
      id: "pr_it_6", lv: 2, kind: "contour", icon: "⚠️",
      prompt: "Quale intonazione corrisponde a questa situazione?",
      utterance: "Attento, il pavimento è bagnato!",
      spoken: "Attento, il pavimento è bagnato!",
      contour: "urgent",
      choices: [
        "Avviso urgente per fermare qualcuno (!)",
        "Domanda tranquilla per sapere l'ora (?)",
        "Racconto pacato della giornata (.)"
      ],
      ans: 0,
      cue: "Inizio deciso e voce ferma su «Attento!» per avvisare subito.",
      explain: "Un tono deciso e breve richiama subito l'attenzione su un pericolo."
    },

    /* Level 3 */
    {
      id: "pr_it_7", lv: 3, kind: "stress", icon: "🏥",
      word: "Ospedale",
      prompt: "Tocca la sillaba con l'accento più forte.",
      syllables: ["o", "spe", "DÀ", "le"],
      stressIdx: 2,
      spoken: "Ospedàle.",
      cue: "Ascolta la voce: o-spe-DÀ-le ha l'appoggio sulla terza sillaba.",
      explain: "Appoggiarsi su «DÀ» rende chiara tutta la parola lunga."
    },
    {
      id: "pr_it_8", lv: 3, kind: "focus", icon: "🔑",
      prompt: "Dove metti la forza per rispondere alla domanda?",
      question: "Dove sono le chiavi di casa?",
      words: ["Le chiavi", "sono", "SUL", "TAVOLO"],
      focusIdx: 3,
      spoken: "Le chiavi sono sul TAVOLO.",
      cue: "La domanda chiede il luogo («Dove?»): marca il posto alla fine.",
      explain: "Accentare «TAVOLO» dà subito l'informazione chiave."
    },
    {
      id: "pr_it_9", lv: 3, kind: "contour", icon: "🙂",
      prompt: "Quale tono esprime una risposta serena?",
      utterance: "Sì, grazie, va tutto bene.",
      spoken: "Sì, grazie, va tutto bene.",
      contour: "statement",
      choices: [
        "Risposta calma e sicura (tono che scende ↘)",
        "Domanda dubbiosa (tono che sale ↗)",
        "Richiamo forte da lontano (!)"
      ],
      ans: 0,
      cue: "La frase finisce con il punto: la voce scende dolcemente sul finale.",
      explain: "Un finale discendente trasmette calma e chiusura chiara del turno."
    }
  ],
  en: [
    /* Level 1 */
    {
      id: "pr_en_1", lv: 1, kind: "stress", icon: "💿",
      word: "REcord",
      prompt: "Tap the stressed beat for the NOUN (as in “a vinyl record” or “health record”).",
      syllables: ["RE", "cord"],
      stressIdx: 0,
      spoken: "A medical REcord.",
      cue: "Nouns usually stress the first beat: RE-cord (while the verb is re-CORD).",
      explain: "RE-cord (1st syllable) is the noun; stressing the 2nd syllable (re-CORD) makes the verb."
    },
    {
      id: "pr_en_2", lv: 1, kind: "focus", icon: "📞",
      prompt: "Which word takes the strongest voice focus to answer accurately?",
      question: "WHO called the clinic this morning?",
      words: ["MARIA", "called", "the clinic", "today"],
      focusIdx: 0,
      spoken: "MARIA called the clinic today.",
      cue: "The question asks “WHO?” — lean cleanly on the person's name.",
      explain: "Stressing “MARIA” tells the listener right away which person made the call."
    },
    {
      id: "pr_en_3", lv: 1, kind: "contour", icon: "❓",
      prompt: "Listen or read aloud: which intonation matches this utterance?",
      utterance: "Did you take your morning tablets?",
      spoken: "Did you take your morning tablets?",
      contour: "question",
      choices: [
        "Yes/no question (pitch rises at the end ↗)",
        "Calm statement (pitch settles down ↘)",
        "Urgent warning call (sharp, loud peak !)"
      ],
      ans: 0,
      cue: "Yes/no questions lift slightly at the last word to invite an answer.",
      explain: "A gentle upward lift (↗) signals that you are asking a question."
    },

    /* Level 2 */
    {
      id: "pr_en_4", lv: 2, kind: "stress", icon: "🎁",
      word: "preSENT",
      prompt: "Tap the main beat for the VERB (“to present a gift or plan”).",
      syllables: ["pre", "SENT"],
      stressIdx: 1,
      spoken: "I will preSENT the plan.",
      cue: "Listen for the stronger second beat: pre-SENT (the gift is PRE-sent).",
      explain: "pre-SENT (2nd syllable) is the action verb; PRE-sent is a gift or now."
    },
    {
      id: "pr_en_5", lv: 2, kind: "focus", icon: "🍵",
      prompt: "Tap the word you emphasize to correct a mix-up.",
      question: "Hot coffee? — No, I asked for…",
      words: ["I", "asked", "for", "TEA"],
      focusIdx: 3,
      spoken: "I asked for TEA.",
      cue: "Lean clearly on the corrected item at the end.",
      explain: "Placing firm focus on “TEA” prevents confusion without needing a long sentence."
    },
    {
      id: "pr_en_6", lv: 2, kind: "contour", icon: "⚠️",
      prompt: "Which tone fits this spoken message?",
      utterance: "Watch out, that kettle is hot!",
      spoken: "Watch out, that kettle is hot!",
      contour: "urgent",
      choices: [
        "Urgent alert to stop someone quickly (!)",
        "Relaxed question about the weather (?)",
        "Quiet bedtime farewell (.)"
      ],
      ans: 0,
      cue: "Crisp start and firm stress on “Watch out” alert the listener immediately.",
      explain: "A sharp, firm contour gets attention right away in real life."
    },

    /* Level 3 */
    {
      id: "pr_en_7", lv: 3, kind: "stress", icon: "🏥",
      word: "Hospital",
      prompt: "Tap the strongest syllable beat in this everyday word.",
      syllables: ["HOS", "pi", "tal"],
      stressIdx: 0,
      spoken: "HOS-pi-tal.",
      cue: "Start strong on the first syllable, then keep the next two light: HOS-pi-tal.",
      explain: "Anchoring the first stressed syllable helps long words flow smoothly."
    },
    {
      id: "pr_en_8", lv: 3, kind: "focus", icon: "🔑",
      prompt: "Which word carries the key answer?",
      question: "Where are the house keys?",
      words: ["The keys", "are", "on the", "TABLE"],
      focusIdx: 3,
      spoken: "The keys are on the TABLE.",
      cue: "The listener needs to know where: stress the place word.",
      explain: "Stressing “TABLE” delivers the exact helpful detail."
    },
    {
      id: "pr_en_9", lv: 3, kind: "contour", icon: "🙂",
      prompt: "Which spoken contour fits this calm reply?",
      utterance: "Yes thank you, I am ready now.",
      spoken: "Yes thank you, I am ready now.",
      contour: "statement",
      choices: [
        "Calm, settled statement (voice falls gently ↘)",
        "Unsure yes/no question (voice rises ↗)",
        "Loud emergency shout (!)"
      ],
      ans: 0,
      cue: "Statements settle calmly downward on the last word.",
      explain: "A gentle downward ending shows you have finished your turn."
    }
  ]
};
