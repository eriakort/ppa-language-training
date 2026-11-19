/*
 * Bilingual Morphosyntax & Closed-Class Function-Word Cloze Bank.
 * Specifically targets agrammatic morphology (nfvPPA): verb tense inflections,
 * prepositions/relators, and subject-verb / noun-adjective agreement.
 *
 * Levels: 1 = subtle tense/preposition contrasts, 3 = high-frequency daily agreement/relators.
 */
(function () {
  "use strict";
  var POG = window.POG = window.POG || {};
  POG.content = POG.content || {};

  POG.content.GRAMMAR = {
    it: [
      {
        id: "gr_it_1", lv: 1, kind: "tense", icon: "📅",
        prompt: "Scegli la forma giusta del verbo.",
        before: "Ieri mattina Marco", after: "in farmacia presto.",
        opts: ["è andato", "va", "andrà"], ans: 0,
        clue: "Guarda l'inizio: «Ieri mattina» indica un'azione già passata.",
        fullSentence: "Ieri mattina Marco è andato in farmacia presto."
      },
      {
        id: "gr_it_2", lv: 1, kind: "tense", icon: "📞",
        prompt: "Completa con il tempo corretto.",
        before: "Domani pomeriggio mia sorella", after: "lo studio medico.",
        opts: ["chiamerà", "ha chiamato", "chiamava"], ans: 0,
        clue: "La parola «Domani» indica qualcosa che succederà nel futuro.",
        fullSentence: "Domani pomeriggio mia sorella chiamerà lo studio medico."
      },
      {
        id: "gr_it_3", lv: 1, kind: "prep", icon: "🚂",
        prompt: "Scegli la preposizione adatta.",
        before: "Il treno veloce per Firenze parte", after: "binario tre.",
        opts: ["dal", "nel", "tra"], ans: 0,
        clue: "Indica il luogo da cui il treno parte.",
        fullSentence: "Il treno veloce per Firenze parte dal binario tre."
      },
      {
        id: "gr_it_4", lv: 1, kind: "agreement", icon: "💊",
        prompt: "Completa l'accordo con il soggetto.",
        before: "Tutte le mie compresse", after: "dentro il portapillole.",
        opts: ["sono", "è", "siamo"], ans: 0,
        clue: "«Le mie compresse» è plurale: quale forma di essere va bene?",
        fullSentence: "Tutte le mie compresse sono dentro il portapillole."
      },
      {
        id: "gr_it_5", lv: 2, kind: "prep", icon: "🍳",
        prompt: "Quale parola collega bene le due idee?",
        before: "Prendo sempre questa medicina", after: "aver fatto colazione.",
        opts: ["dopo", "sopra", "dentro"], ans: 0,
        clue: "Indica l'ordine di tempo rispetto alla colazione.",
        fullSentence: "Prendo sempre questa medicina dopo aver fatto colazione."
      },
      {
        id: "gr_it_6", lv: 2, kind: "tense", icon: "🛒",
        prompt: "Scegli il verbo che si abbina a «ogni sabato».",
        before: "Ogni sabato mattina Lucia", after: "il pane fresco al forno.",
        opts: ["compra", "compreranno", "comprò"], ans: 0,
        clue: "«Ogni sabato» indica un'abitudine abituale al presente.",
        fullSentence: "Ogni sabato mattina Lucia compra il pane fresco al forno."
      },
      {
        id: "gr_it_7", lv: 2, kind: "agreement", icon: "🍎",
        prompt: "Scegli la parola che concorda con «le mele».",
        before: "Ho messo sul tavolo due mele", after: "e mature.",
        opts: ["rosse", "rosso", "rossi"], ans: 0,
        clue: "«Mele» è femminile plurale (-e).",
        fullSentence: "Ho messo sul tavolo due mele rosse e mature."
      },
      {
        id: "gr_it_8", lv: 2, kind: "prep", icon: "🔑",
        prompt: "Dove sono appoggiate le chiavi?",
        before: "Ho lasciato le chiavi di casa", after: "tavolo dell'ingresso.",
        opts: ["sul", "con", "per"], ans: 0,
        clue: "Significa «sopra il» tavolo.",
        fullSentence: "Ho lasciato le chiavi di casa sul tavolo dell'ingresso."
      },
      {
        id: "gr_it_9", lv: 3, kind: "agreement", icon: "🐕",
        prompt: "Completa con la forma giusta.",
        before: "Il nostro cane", after: "volentieri nel parco.",
        opts: ["corre", "corrono", "corriamo"], ans: 0,
        clue: "«Il nostro cane» è uno solo (terza persona singolare).",
        fullSentence: "Il nostro cane corre volentieri nel parco."
      },
      {
        id: "gr_it_10", lv: 3, kind: "prep", icon: "☕",
        prompt: "Come bevi il tè oggi?",
        before: "Preferisco il tè caldo", after: "una fettina di limone.",
        opts: ["con", "sotto", "prima"], ans: 0,
        clue: "Indica ciò che si aggiunge dentro la tazza.",
        fullSentence: "Preferisco il tè caldo con una fettina di limone."
      },
      {
        id: "gr_it_11", lv: 3, kind: "tense", icon: "📺",
        prompt: "Scegli la forma per parlare di noi due.",
        before: "Stasera io e Paolo", after: "un film in salotto.",
        opts: ["guardiamo", "guarda", "guardo"], ans: 0,
        clue: "«Io e Paolo» vuol dire «noi».",
        fullSentence: "Stasera io e Paolo guardiamo un film in salotto."
      },
      {
        id: "gr_it_12", lv: 3, kind: "agreement", icon: "🪴",
        prompt: "Completa la frase sulle piante.",
        before: "I fiori sul balcone", after: "molto profumati.",
        opts: ["sono", "è", "sei"], ans: 0,
        clue: "«I fiori» sono tanti (plurale).",
        fullSentence: "I fiori sul balcone sono molto profumati."
      }
    ],
    en: [
      {
        id: "gr_en_1", lv: 1, kind: "tense", icon: "📅",
        prompt: "Choose the verb form that fits the time word.",
        before: "Yesterday morning Mark", after: "to the chemist early.",
        opts: ["walked", "walks", "will walk"], ans: 0,
        clue: "Look at the first word: “Yesterday” describes a past action.",
        fullSentence: "Yesterday morning Mark walked to the chemist early."
      },
      {
        id: "gr_en_2", lv: 1, kind: "tense", icon: "📞",
        prompt: "Pick the form that fits “tomorrow afternoon”.",
        before: "Tomorrow afternoon my sister", after: "the clinic reception.",
        opts: ["will call", "called", "was calling"], ans: 0,
        clue: "“Tomorrow” means an event that has not happened yet.",
        fullSentence: "Tomorrow afternoon my sister will call the clinic reception."
      },
      {
        id: "gr_en_3", lv: 1, kind: "prep", icon: "🚂",
        prompt: "Pick the preposition that connects the train and platform.",
        before: "The express train to London leaves", after: "platform four.",
        opts: ["from", "inside", "between"], ans: 0,
        clue: "Shows the starting place where the train departs.",
        fullSentence: "The express train to London leaves from platform four."
      },
      {
        id: "gr_en_4", lv: 1, kind: "agreement", icon: "💊",
        prompt: "Match the verb to “all of my tablets”.",
        before: "All of my morning tablets", after: "in the weekly box.",
        opts: ["are", "is", "was"], ans: 0,
        clue: "“Tablets” is plural (more than one).",
        fullSentence: "All of my morning tablets are in the weekly box."
      },
      {
        id: "gr_en_5", lv: 2, kind: "prep", icon: "🍳",
        prompt: "Which time word fits the medicine instruction?",
        before: "I always take this tablet", after: "eating breakfast.",
        opts: ["after", "above", "among"], ans: 0,
        clue: "Tells the order in time compared with breakfast.",
        fullSentence: "I always take this tablet after eating breakfast."
      },
      {
        id: "gr_en_6", lv: 2, kind: "tense", icon: "🛒",
        prompt: "Choose the form for a regular Saturday routine.",
        before: "Every Saturday morning Claire", after: "fresh bread at the market.",
        opts: ["buys", "bought", "buying"], ans: 0,
        clue: "“Every Saturday” describes an ongoing habit.",
        fullSentence: "Every Saturday morning Claire buys fresh bread at the market."
      },
      {
        id: "gr_en_7", lv: 2, kind: "agreement", icon: "🍎",
        prompt: "Pick the matching word for a single item.",
        before: "There is", after: "red apple left in the bowl.",
        opts: ["one", "many", "several"], ans: 0,
        clue: "Notice “is” and “apple” (singular).",
        fullSentence: "There is one red apple left in the bowl."
      },
      {
        id: "gr_en_8", lv: 2, kind: "prep", icon: "🔑",
        prompt: "Where did the keys land?",
        before: "I left the front door keys", after: "the hallway table.",
        opts: ["on", "between", "through"], ans: 0,
        clue: "Means resting on top of the surface.",
        fullSentence: "I left the front door keys on the hallway table."
      },
      {
        id: "gr_en_9", lv: 3, kind: "agreement", icon: "🐕",
        prompt: "Match the verb to “our dog”.",
        before: "Our dog", after: "happily in the park.",
        opts: ["runs", "run", "running"], ans: 0,
        clue: "“Our dog” is one animal (third person singular adds -s).",
        fullSentence: "Our dog runs happily in the park."
      },
      {
        id: "gr_en_10", lv: 3, kind: "prep", icon: "☕",
        prompt: "Complete the drink preference.",
        before: "I prefer warm tea", after: "a slice of lemon.",
        opts: ["with", "under", "across"], ans: 0,
        clue: "Means adding lemon inside the mug.",
        fullSentence: "I prefer warm tea with a slice of lemon."
      },
      {
        id: "gr_en_11", lv: 3, kind: "tense", icon: "📺",
        prompt: "Match the verb to “Paul and I”.",
        before: "Tonight Paul and I", after: "a quiet film together.",
        opts: ["watch", "watches", "watching"], ans: 0,
        clue: "“Paul and I” means “we” (plural subject).",
        fullSentence: "Tonight Paul and I watch a quiet film together."
      },
      {
        id: "gr_en_12", lv: 3, kind: "agreement", icon: "🪴",
        prompt: "Complete the sentence about the flowers.",
        before: "The flowers on the balcony", after: "very bright today.",
        opts: ["look", "looks", "looking"], ans: 0,
        clue: "“The flowers” is plural.",
        fullSentence: "The flowers on the balcony look very bright today."
      }
    ]
  };
})();
