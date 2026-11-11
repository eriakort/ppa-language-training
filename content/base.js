/* Everyday content used for everyone: story topics, pictures to name, crosswords, phrases, sequences.
   Crossword words are capitals without accents. */
window.POG = window.POG || {};
(function (C) {
  C.DESCRIBE = [
    { pic: "☀️", it: ["La tua mattina", "Cosa fai appena ti svegli?", ["Cosa bevi?", "Cosa mangi?", "Con chi sei?"], ["caffè", "colazione", "doccia", "giornale"]],
                 en: ["Your morning", "What do you do when you wake up?", ["What do you drink?", "What do you eat?", "Who are you with?"], ["coffee", "breakfast", "shower", "newspaper"]] },
    { pic: "🍝", it: ["Il pranzo della domenica", "Com'è un pranzo della domenica?", ["Dove mangiate?", "Chi c'è?", "Cosa si cucina?"], ["famiglia", "tavola", "pasta", "dolce"]],
                 en: ["Sunday lunch", "What is a Sunday lunch like?", ["Where do you eat?", "Who is there?", "What is cooked?"], ["family", "table", "pasta", "dessert"]] },
    { pic: "🌳", it: ["Una passeggiata", "Racconta una passeggiata che ti piace.", ["Dove vai?", "Cosa vedi?", "Con chi?"], ["parco", "alberi", "sole", "panchina"]],
                 en: ["A walk", "Tell me about a walk you enjoy.", ["Where do you go?", "What do you see?", "Who with?"], ["park", "trees", "sun", "bench"]] },
    { pic: "🏖️", it: ["Una vacanza", "Racconta una vacanza che ricordi.", ["Dove eri?", "Con chi?", "Cosa facevi?"], ["mare", "spiaggia", "estate", "albergo"]],
                 en: ["A holiday", "Tell me about a holiday you remember.", ["Where were you?", "Who with?", "What did you do?"], ["sea", "beach", "summer", "hotel"]] }
  ];
  C.NAMING = [
    { pic: "🔑", it: ["chiave", "Serve per aprire la porta.", "chia…"], en: ["key", "You use it to open a door.", "k…"] },
    { pic: "🍎", it: ["mela", "È un frutto rosso e croccante.", "me…"], en: ["apple", "A crunchy red fruit.", "a…"] },
    { pic: "☂️", it: ["ombrello", "Si usa quando piove.", "om…"], en: ["umbrella", "You use it when it rains.", "um…"] },
    { pic: "✂️", it: ["forbici", "Servono per tagliare la carta.", "for…"], en: ["scissors", "You use them to cut paper.", "sci…"] },
    { pic: "👓", it: ["occhiali", "Si mettono per vedere meglio.", "oc…"], en: ["glasses", "You wear them to see better.", "gla…"] },
    { pic: "📖", it: ["libro", "Si apre per leggere.", "li…"], en: ["book", "You open it to read.", "b…"] },
    { pic: "☕", it: ["tazza", "Si usa per bere il caffè.", "ta…"], en: ["cup", "You drink coffee from it.", "c…"] },
    { pic: "⌚", it: ["orologio", "Si porta al polso per sapere l'ora.", "o-ro…"], en: ["watch", "You wear it to tell the time.", "wa…"] }
  ];
  /* Hand-checked mini crosswords: r/c = start cell, d = a (across) or d (down). Crossing letters match. */
  C.CROSS = {
    it: [
      [{ w: "CASA", r: 0, c: 0, d: "a", clue: "Il luogo dove abiti", pic: "🏠" },
       { w: "ACQUA", r: 0, c: 1, d: "d", clue: "Si beve quando si ha sete", pic: "💧" },
       { w: "LUNA", r: 3, c: 0, d: "a", clue: "Si vede in cielo di notte", pic: "🌙" }],
      [{ w: "PANE", r: 0, c: 0, d: "a", clue: "Si compra dal fornaio", pic: "🍞" },
       { w: "ESTATE", r: 0, c: 3, d: "d", clue: "La stagione più calda", pic: "☀️" },
       { w: "GATTO", r: 2, c: 1, d: "a", clue: "Animale che fa «miao»", pic: "🐈" }],
      [{ w: "SOLE", r: 0, c: 0, d: "a", clue: "Splende in cielo di giorno", pic: "🌞" },
       { w: "LATTE", r: 0, c: 2, d: "d", clue: "Bevanda bianca della colazione", pic: "🥛" },
       { w: "MELA", r: 4, c: 1, d: "a", clue: "Frutto rosso o verde", pic: "🍎" }]
    ],
    en: [
      [{ w: "HOME", r: 0, c: 0, d: "a", clue: "Where you live", pic: "🏠" },
       { w: "ORANGE", r: 0, c: 1, d: "d", clue: "A round fruit and a colour", pic: "🍊" },
       { w: "SNOW", r: 3, c: 0, d: "a", clue: "White and cold, it falls in winter", pic: "❄️" }],
      [{ w: "BREAD", r: 0, c: 0, d: "a", clue: "You buy it at the bakery", pic: "🍞" },
       { w: "APPLE", r: 0, c: 3, d: "d", clue: "A crunchy red fruit", pic: "🍎" },
       { w: "CLOCK", r: 3, c: 2, d: "a", clue: "It tells you the time", pic: "🕰️" }],
      [{ w: "SUN", r: 0, c: 0, d: "a", clue: "It shines in the sky by day", pic: "🌞" },
       { w: "NOSE", r: 0, c: 2, d: "d", clue: "You smell with it", pic: "👃" },
       { w: "TEA", r: 3, c: 1, d: "a", clue: "A hot drink, often with milk", pic: "🍵" }]
    ]
  };
  C.ECHO = {
    it: [["Oggi fa bel tempo.", "Stasera guardiamo un film.", "Mi piace il caffè caldo."],
         ["un bicchiere d'acqua", "la porta di casa", "il giornale di oggi"],
         ["casa", "sole", "pane"]],
    en: [["The weather is nice today.", "Tonight we'll watch a film.", "I like my coffee hot."],
         ["a glass of water", "the front door", "today's newspaper"],
         ["home", "sun", "bread"]]
  };
  C.SEQ = {
    it: [
      { label: "Numeri 1–10", items: ["uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci"], show: ["1","2","3","4","5","6","7","8","9","10"] },
      { label: "Giorni della settimana", items: ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"] },
      { label: "Mesi (gennaio–giugno)", items: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno"] }
    ],
    en: [
      { label: "Numbers 1–10", items: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"], show: ["1","2","3","4","5","6","7","8","9","10"] },
      { label: "Days of the week", items: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
      { label: "Months (January–June)", items: ["January", "February", "March", "April", "May", "June"] }
    ]
  };
  C.DEFAULT_SCRIPTS = {
    it: ["Al bar | Vorrei un caffè, per favore.", "Hai bisogno di una mano | Puoi aiutarmi, per favore?", "Qualcuno ti chiede come stai | Grazie, sto bene."],
    en: ["At a café | I'd like a coffee, please.", "You need a hand | Can you help me, please?", "Someone asks how you are | Thank you, I'm fine."]
  };
  /* Reading aloud: two-sentence passages (levels 1-2) and short sentences (levels 3-4). Interest packs add their own. */
  C.READ = {
    it: { long: ["Oggi è una bella giornata. Dopo pranzo faccio una passeggiata in piazza.",
                 "Mia sorella mi ha telefonato ieri sera. Domenica veniamo a pranzo da te.",
                 "Il pane caldo profuma tutta la cucina. Ne taglio una fetta per la colazione."],
          short: ["Apro la finestra.", "Il caffè è pronto.", "Andiamo al mercato."] },
    en: { long: ["Today is a lovely day. After lunch I'll go for a walk in the square.",
                 "My sister phoned me last night. On Sunday we're coming to lunch at yours.",
                 "The warm bread makes the whole kitchen smell good. I'll cut a slice for breakfast."],
          short: ["I open the window.", "The coffee is ready.", "Let's go to the market."] }
  };
})(window.POG.content = window.POG.content || {});
