/*
 * Bilingual Functional Question Formulation & Repair content (IT & EN).
 * Targets:
 *   - `wh`      : selecting the right wh-question word & phrasing for an everyday goal
 *   - `build`   : assembling word tiles in natural question word order (nfvPPA wh-syntax)
 *   - `clarify` : picking the clearest clarifying question when listening or confirming details
 *
 * Level convention: 1 = most demanding, 3 = most support.
 * 18 items total: 9 Italian + 9 English (3 items per level, 1 of each kind per level).
 */
window.POG = window.POG || {};
window.POG.content = window.POG.content || {};

window.POG.content.QUESTIONS = {
  it: [
    /* Level 1 */
    {
      id: "qs_it_1", lv: 1, kind: "wh", icon: "💊",
      whTag: "ORARIO",
      situation: "Sei in farmacia e vuoi sapere a che ora chiude stasera.",
      prompt: "Quale domanda usi per sapere l'orario di chiusura?",
      spoken: "A che ora chiude la farmacia stasera?",
      choices: [
        "A che ora chiude stasera?",
        "Chi chiude la farmacia?",
        "Di chi è questa ricetta?"
      ],
      ans: 0,
      errTypes: [null, "wh_swap", "off_topic"],
      cue: "Per chiedere un orario usa «A che ora…».",
      explain: "«A che ora chiude stasera?» va dritto al punto sull'orario."
    },
    {
      id: "qs_it_2", lv: 1, kind: "build", icon: "🩺",
      situation: "Vuoi chiedere dove si trova l'ambulatorio.",
      prompt: "Metti le parole nell'ordine giusto per formare la domanda.",
      tokens: ["Dove", "si trova", "lo", "studio", "medico?"],
      target: "Dove si trova lo studio medico?",
      spoken: "Dove si trova lo studio medico?",
      cue: "Inizia con «Dove» per chiedere il luogo.",
      explain: "«Dove si trova lo studio medico?» chiede chiaramente la direzione."
    },
    {
      id: "qs_it_3", lv: 1, kind: "clarify", icon: "📋",
      heardMsg: "«Prenda mezza compressa dopo pranzo.»",
      prompt: "Non hai sentito bene la dose: come chiedi conferma?",
      spoken: "Prenda mezza compressa dopo pranzo.",
      choices: [
        "Scusi, mezza compressa o intera?",
        "Dove si trova la fermata?",
        "Sì, il pranzo era molto buono."
      ],
      ans: 0,
      errTypes: [null, "wrong_wh", "off_topic"],
      cue: "Proponi due scelte brevi («mezza o intera?») per avere una risposta chiara.",
      explain: "Chiedere «mezza o intera?» rende subito sicura la dose."
    },

    /* Level 2 */
    {
      id: "qs_it_4", lv: 2, kind: "wh", icon: "🧾",
      whTag: "PREZZO",
      situation: "Al mercato vuoi sapere quanto costa il pane.",
      prompt: "Quale domanda chiede il prezzo?",
      spoken: "Quanto costa questo pane?",
      choices: [
        "Quanto costa questo pane?",
        "Quando viene il panettiere?",
        "Dove abita il panettiere?"
      ],
      ans: 0,
      errTypes: [null, "wh_swap", "wh_swap"],
      cue: "Per chiedere soldi o prezzi si usa sempre «Quanto…».",
      explain: "«Quanto costa…» chiede subito la cifra esatta."
    },
    {
      id: "qs_it_5", lv: 2, kind: "build", icon: "🕒",
      situation: "Chiedi quando passa il prossimo autobus.",
      prompt: "Ordina le parole per fare la domanda.",
      tokens: ["Quando", "passa", "il prossimo", "autobus?"],
      target: "Quando passa il prossimo autobus?",
      spoken: "Quando passa il prossimo autobus?",
      cue: "Comincia con «Quando» per chiedere il momento.",
      explain: "«Quando passa il prossimo autobus?» è breve e naturale."
    },
    {
      id: "qs_it_6", lv: 2, kind: "clarify", icon: "📅",
      heardMsg: "«La visita è giovedì in stanza tre.»",
      prompt: "Vuoi essere sicuro del giorno: quale domanda fai?",
      spoken: "La visita è giovedì in stanza tre.",
      choices: [
        "Ha detto giovedì, giusto?",
        "Quanto costa la stanza?",
        "Chi ha chiamato ieri?"
      ],
      ans: 0,
      errTypes: [null, "wrong_wh", "off_topic"],
      cue: "Ripeti il giorno che pensi di aver sentito e aggiungi «giusto?».",
      explain: "Ripetere la parola chiave con «giusto?» evita fraintendimenti."
    },

    /* Level 3 */
    {
      id: "qs_it_7", lv: 3, kind: "wh", icon: "🚻",
      whTag: "LUOGO",
      situation: "Al bar cerchi il bagno.",
      prompt: "Come chiedi dov'è il bagno?",
      spoken: "Scusi, dov'è il bagno?",
      choices: [
        "Scusi, dov'è il bagno?",
        "Come si chiama il bagno?",
        "Quanto pesa il caffè?"
      ],
      ans: 0,
      errTypes: [null, "wh_swap", "off_topic"],
      cue: "Per trovare un posto inizia con «Dov'è…».",
      explain: "«Scusi, dov'è il bagno?» è cortese e immediata."
    },
    {
      id: "qs_it_8", lv: 3, kind: "build", icon: "☕",
      situation: "Al bar vuoi sapere quanto devi pagare.",
      prompt: "Metti in ordine le tessere per chiedere il conto.",
      tokens: ["Quanto", "le", "devo", "in tutto?"],
      target: "Quanto le devo in tutto?",
      spoken: "Quanto le devo in tutto?",
      cue: "Inizia con «Quanto».",
      explain: "«Quanto le devo in tutto?» chiede l'importo finale."
    },
    {
      id: "qs_it_9", lv: 3, kind: "clarify", icon: "🗣️",
      heardMsg: "«La signora parla molto velocemente.»",
      prompt: "Come chiedi con gentilezza di rallentare?",
      spoken: "La signora parla molto velocemente.",
      choices: [
        "Può parlare più piano, per favore?",
        "A che ora parte il treno?",
        "Dov'è la farmacia più grande?"
      ],
      ans: 0,
      errTypes: [null, "off_topic", "wrong_wh"],
      cue: "Chiedi semplicemente di parlare più piano.",
      explain: "Una richiesta breve aiuta subito chi parla ad adattare il ritmo."
    }
  ],
  en: [
    /* Level 1 */
    {
      id: "qs_en_1", lv: 1, kind: "wh", icon: "💊",
      whTag: "TIME",
      situation: "You are at the chemist and want to know closing time tonight.",
      prompt: "Which question asks clearly for the time?",
      spoken: "What time do you close tonight?",
      choices: [
        "What time do you close tonight?",
        "Who closes the shop?",
        "Whose prescription is this?"
      ],
      ans: 0,
      errTypes: [null, "wh_swap", "off_topic"],
      cue: "Use “What time…” when asking for a clock hour.",
      explain: "“What time do you close tonight?” directly targets the closing hour."
    },
    {
      id: "qs_en_2", lv: 1, kind: "build", icon: "🩺",
      situation: "Ask how to find the clinic reception desk.",
      prompt: "Put the words in the right order to ask the question.",
      tokens: ["Where", "is", "the", "clinic", "desk?"],
      target: "Where is the clinic desk?",
      spoken: "Where is the clinic desk?",
      cue: "Start with “Where” for a location question.",
      explain: "Question order starts with “Where”, followed by “is”."
    },
    {
      id: "qs_en_3", lv: 1, kind: "clarify", icon: "📋",
      heardMsg: "“Take half a tablet after lunch.”",
      prompt: "You want to double-check the dose: what is clearest to ask?",
      spoken: "Take half a tablet after lunch.",
      choices: [
        "Sorry, half a tablet or a whole one?",
        "Where is the bus stop?",
        "Yes, lunch was very nice."
      ],
      ans: 0,
      errTypes: [null, "wrong_wh", "off_topic"],
      cue: "Give a clear two-choice check (“half or whole?”) so it is easy to confirm.",
      explain: "Offering “half or whole?” confirms the safe dose right away."
    },

    /* Level 2 */
    {
      id: "qs_en_4", lv: 2, kind: "wh", icon: "🧾",
      whTag: "PRICE",
      situation: "At the bakery, you want to check the price of the loaf.",
      prompt: "Which question asks for the price?",
      spoken: "How much does this loaf cost?",
      choices: [
        "How much does this loaf cost?",
        "When did the baker arrive?",
        "Where does the baker live?"
      ],
      ans: 0,
      errTypes: [null, "wh_swap", "wh_swap"],
      cue: "Always use “How much…” when asking about money or cost.",
      explain: "“How much does this loaf cost?” asks cleanly for the price."
    },
    {
      id: "qs_en_5", lv: 2, kind: "build", icon: "🕒",
      situation: "Ask when the next bus leaves.",
      prompt: "Order the tiles to make a clear question.",
      tokens: ["When", "does", "the next", "bus", "leave?"],
      target: "When does the next bus leave?",
      spoken: "When does the next bus leave?",
      cue: "Begin with “When”, then the helping word “does”.",
      explain: "“When does the next bus leave?” uses clear English question order."
    },
    {
      id: "qs_en_6", lv: 2, kind: "clarify", icon: "📅",
      heardMsg: "“Your appointment is on Thursday in room three.”",
      prompt: "You want to confirm the day: which question works best?",
      spoken: "Your appointment is on Thursday in room three.",
      choices: [
        "Did you say Thursday?",
        "How much is room three?",
        "Who called yesterday?"
      ],
      ans: 0,
      errTypes: [null, "wrong_wh", "off_topic"],
      cue: "Repeat back the key day (“Thursday”) to verify it.",
      explain: "Repeating “Did you say Thursday?” checks the day with minimal effort."
    },

    /* Level 3 */
    {
      id: "qs_en_7", lv: 3, kind: "wh", icon: "🚻",
      whTag: "PLACE",
      situation: "You are at a café and need to find the restroom.",
      prompt: "Pick the clearest question to ask.",
      spoken: "Excuse me, where is the toilet?",
      choices: [
        "Excuse me, where is the toilet?",
        "Who works at the café?",
        "How heavy is this mug?"
      ],
      ans: 0,
      errTypes: [null, "wh_swap", "off_topic"],
      cue: "Use “Where is…” to ask where a room is.",
      explain: "“Excuse me, where is the toilet?” is polite and direct."
    },
    {
      id: "qs_en_8", lv: 3, kind: "build", icon: "☕",
      situation: "Ask how much to pay at the counter.",
      prompt: "Tap the words in order to ask the total.",
      tokens: ["How much", "do", "I", "owe?"],
      target: "How much do I owe?",
      spoken: "How much do I owe?",
      cue: "Start with “How much”, then “do I owe?”.",
      explain: "“How much do I owe?” is short and easy to say aloud."
    },
    {
      id: "qs_en_9", lv: 3, kind: "clarify", icon: "🗣️",
      heardMsg: "“The speaker is talking very fast.”",
      prompt: "Which question helps slow the conversation down?",
      spoken: "The speaker is talking very fast.",
      choices: [
        "Could you speak a bit slower, please?",
        "What time does the train leave?",
        "Where is the chemist?"
      ],
      ans: 0,
      errTypes: [null, "off_topic", "wrong_wh"],
      cue: "Ask politely for a slower pace.",
      explain: "Asking directly to slow down keeps conversation comfortable."
    }
  ]
};
