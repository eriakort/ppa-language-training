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
  /* Everyday answer banks for 8–10 word crosswords when no interest pack is selected. */
  C.CROSS_WORDS = {
    it: [
      ["CASA", "Il luogo dove abiti"], ["ACQUA", "Si beve quando si ha sete"],
      ["PANE", "Si compra dal fornaio"], ["LUNA", "Si vede in cielo di notte"],
      ["GATTO", "Animale che fa «miao»"], ["SOLE", "Splende in cielo di giorno"],
      ["MELA", "Frutto rosso o verde"], ["TRENO", "Viaggia sui binari"],
      ["FIORE", "Cresce in giardino e profuma"], ["NOTTE", "Arriva dopo il tramonto"],
      ["LIBRO", "Si apre per leggere"], ["PORTA", "Si apre per entrare in una stanza"]
    ],
    en: [
      ["HOME", "Where you live"], ["WATER", "You drink it when you are thirsty"],
      ["BREAD", "You buy it at the bakery"], ["MOON", "You see it in the night sky"],
      ["CAT", "An animal that says meow"], ["SUN", "It shines in the sky by day"],
      ["APPLE", "A fruit that can be red or green"], ["TRAIN", "It travels on rails"],
      ["FLOWER", "It grows in a garden and can smell sweet"], ["NIGHT", "It comes after sunset"],
      ["BOOK", "You open it to read"], ["DOOR", "You open it to enter a room"]
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
  /* Longer reading passages used in four-reading sessions. */
  C.READ = {
    it: { long: [
                 "Al mattino apro la finestra e guardo la piazza. Il bar all'angolo è già pieno. Due amici parlano del mercato. Compro il pane e torno a casa con calma.",
                 "La domenica la famiglia si ritrova a tavola. Ognuno porta qualcosa da mangiare. Dopo pranzo restiamo a chiacchierare. Poi facciamo una passeggiata prima che faccia sera.",
                 "In primavera il giardino cambia colore. I primi fiori spuntano vicino al muro. Ogni giorno annaffio le piante e tolgo le foglie secche. La sera mi siedo fuori e ascolto gli uccelli.",
                 "Il treno parte presto dalla stazione. Dal finestrino vedo campi, paesi e colline. Una signora legge un libro accanto a me. Quando arriviamo al mare, l'aria profuma di sale."],
          short: ["Apro la finestra.", "Il caffè è pronto.", "Andiamo al mercato."] },
    en: { long: [
                 "In the morning I open the window and look at the square. The café on the corner is already busy. Two friends talk about the market. I buy some bread and walk home slowly.",
                 "On Sunday the family gathers around the table. Everyone brings something to eat. After lunch we sit and talk for a while. Then we go for a walk before evening.",
                 "In spring the garden changes colour. The first flowers appear beside the wall. Each day I water the plants and clear away dry leaves. In the evening I sit outside and listen to the birds.",
                 "The train leaves the station early. From the window I see fields, villages and hills. A woman beside me reads a book. When we reach the sea, the air smells of salt."],
          short: ["I open the window.", "The coffee is ready.", "Let's go to the market."] }
  };
})(window.POG.content = window.POG.content || {});
