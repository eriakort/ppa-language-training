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

  /* Mystery word: five clue words that all relate to one word. [word, [five clues], [other accepted answers]].
     Original sets written for this app. */
  C.MYSTERY = {
    it: [
      ["mare", ["onda", "spiaggia", "sale", "ombrellone", "barca"], []],
      ["pane", ["forno", "farina", "fetta", "briciola", "fornaio"], ["pagnotta"]],
      ["sole", ["caldo", "estate", "luce", "tramonto", "abbronzatura"], []],
      ["libro", ["pagina", "copertina", "biblioteca", "capitolo", "leggere"], ["romanzo"]],
      ["chiave", ["serratura", "porta", "mazzo", "girare", "aprire"], ["chiavi"]],
      ["orologio", ["ore", "lancette", "polso", "minuti", "puntuale"], ["orologi"]],
      ["pioggia", ["ombrello", "nuvola", "gocce", "temporale", "bagnato"], []],
      ["treno", ["binario", "stazione", "biglietto", "vagone", "ritardo"], []],
      ["pizza", ["mozzarella", "margherita", "impasto", "pomodoro", "Napoli"], []],
      ["letto", ["cuscino", "lenzuolo", "materasso", "dormire", "coperta"], []],
      ["calcio", ["pallone", "gol", "arbitro", "squadra", "rigore"], ["partita"]],
      ["telefono", ["chiamata", "numero", "squillo", "rispondere", "messaggio"], ["cellulare", "telefonino"]],
      ["giardino", ["fiori", "prato", "siepe", "annaffiare", "vialetto"], []],
      ["latte", ["mucca", "bianco", "biberon", "formaggio", "cappuccino"], []],
      ["musica", ["canzone", "orchestra", "ritmo", "concerto", "ascoltare"], []],
      ["scuola", ["maestra", "banco", "lavagna", "compiti", "zaino"], []],
      ["ospedale", ["medico", "infermiera", "reparto", "ambulanza", "ricovero"], []],
      ["matrimonio", ["sposi", "anelli", "chiesa", "torta", "invitati"], ["nozze"]],
      ["inverno", ["freddo", "cappotto", "sciarpa", "gennaio", "camino"], []],
      ["cucina", ["fornelli", "pentola", "frigorifero", "ricetta", "grembiule"], []],
      ["albero", ["tronco", "rami", "foglie", "radici", "ombra"], []],
      ["cane", ["guinzaglio", "abbaiare", "cuccia", "osso", "coda"], ["cagnolino"]],
      ["mano", ["dita", "unghie", "guanto", "palmo", "stretta"], ["mani"]],
      ["natale", ["presepe", "regali", "dicembre", "panettone", "Babbo"], []],
      ["fuoco", ["fiamma", "legna", "cenere", "accendino", "scintilla"], []],
      ["luna", ["notte", "stelle", "piena", "falce", "astronauta"], []],
      ["cappello", ["testa", "visiera", "paglia", "cilindro", "togliersi"], ["berretto"]],
      ["specchio", ["riflesso", "bagno", "immagine", "vetro", "pettinarsi"], []],
      ["mercato", ["bancarelle", "frutta", "verdura", "prezzo", "piazza"], []],
      ["automobile", ["volante", "benzina", "patente", "parcheggio", "ruote"], ["macchina", "auto"]],
      ["compleanno", ["candeline", "torta", "auguri", "regalo", "festa"], []],
      ["gelato", ["cono", "coppetta", "cioccolato", "gusti", "estate"], []],
      ["occhiali", ["lenti", "vista", "montatura", "ottico", "astuccio"], []],
      ["teatro", ["palco", "sipario", "attori", "applausi", "platea"], []]
    ],
    en: [
      ["sea", ["waves", "beach", "salt", "sailing", "shells"], ["ocean", "seaside"]],
      ["bread", ["oven", "flour", "slice", "crumbs", "baker"], ["loaf"]],
      ["sun", ["summer", "light", "dawn", "rays", "warm"], ["sunshine"]],
      ["book", ["page", "cover", "library", "chapter", "read"], ["novel"]],
      ["key", ["lock", "door", "turn", "open", "bunch"], ["keys"]],
      ["clock", ["hours", "hands", "minutes", "alarm", "tick"], ["watch"]],
      ["rain", ["umbrella", "cloud", "drops", "storm", "wet"], []],
      ["train", ["platform", "station", "ticket", "carriage", "rails"], []],
      ["pizza", ["mozzarella", "tomato", "slice", "dough", "Naples"], []],
      ["bed", ["pillow", "sheets", "mattress", "sleep", "blanket"], []],
      ["football", ["kick", "goal", "referee", "team", "penalty"], ["soccer", "match"]],
      ["phone", ["call", "number", "ring", "answer", "message"], ["telephone", "mobile"]],
      ["garden", ["flowers", "lawn", "hedge", "watering", "path"], []],
      ["milk", ["cow", "white", "bottle", "cheese", "cereal"], []],
      ["music", ["song", "orchestra", "rhythm", "concert", "listen"], []],
      ["school", ["teacher", "desk", "blackboard", "homework", "lessons"], []],
      ["hospital", ["doctor", "nurse", "ward", "ambulance", "patient"], []],
      ["wedding", ["bride", "rings", "church", "cake", "guests"], ["marriage"]],
      ["winter", ["cold", "coat", "scarf", "January", "snowman"], []],
      ["kitchen", ["stove", "saucepan", "fridge", "recipe", "apron"], []],
      ["tree", ["trunk", "branches", "leaves", "roots", "shade"], []],
      ["dog", ["lead", "bark", "kennel", "bone", "tail"], ["puppy"]],
      ["hand", ["fingers", "nails", "glove", "palm", "wave"], ["hands"]],
      ["Christmas", ["presents", "December", "stocking", "carols", "Santa"], []],
      ["fire", ["flame", "wood", "ashes", "smoke", "sparks"], []],
      ["moon", ["night", "stars", "full", "astronaut", "crescent"], []],
      ["hat", ["head", "brim", "straw", "bowler", "panama"], ["cap"]],
      ["mirror", ["reflection", "bathroom", "glass", "face", "comb"], []],
      ["market", ["stalls", "fruit", "vegetables", "price", "square"], []],
      ["car", ["steering wheel", "petrol", "licence", "parking", "tyres"], ["automobile"]],
      ["birthday", ["candles", "cake", "cards", "present", "party"], []],
      ["ice cream", ["cone", "scoop", "chocolate", "flavours", "van"], ["icecream"]],
      ["glasses", ["lenses", "sight", "frames", "optician", "case"], ["spectacles"]],
      ["theatre", ["stage", "curtain", "actors", "applause", "seats"], ["theater"]]
    ]
  };
  /* Months and days to unscramble in Word building (same format as NAMING). */
  C.ANAGRAMS = [
    { pic: "📅", it: ["gennaio", "Il primo mese dell'anno.", "gen…"], en: ["january", "The first month of the year.", "ja…"] },
    { pic: "📅", it: ["febbraio", "Il mese più corto dell'anno.", "feb…"], en: ["february", "The shortest month of the year.", "fe…"] },
    { pic: "📅", it: ["marzo", "Il mese in cui comincia la primavera.", "ma…"], en: ["march", "The month when spring begins.", "ma…"] },
    { pic: "📅", it: ["aprile", "Il mese dopo marzo.", "a…"], en: ["april", "The month after March.", "a…"] },
    { pic: "📅", it: ["maggio", "Il mese delle rose, dopo aprile.", "ma…"], en: ["may", "The month after April.", "m…"] },
    { pic: "📅", it: ["giugno", "Il mese in cui comincia l'estate.", "giu…"], en: ["june", "The month when summer begins.", "ju…"] },
    { pic: "📅", it: ["luglio", "Il mese dopo giugno, in piena estate.", "lu…"], en: ["july", "The month after June.", "ju…"] },
    { pic: "📅", it: ["agosto", "Il mese delle ferie e di Ferragosto.", "a…"], en: ["august", "The last month of summer.", "au…"] },
    { pic: "📅", it: ["ottobre", "Il mese dopo settembre.", "ot…"], en: ["october", "The month of Halloween.", "oc…"] },
    { pic: "📅", it: ["novembre", "Il mese prima di dicembre.", "no…"], en: ["november", "The month before December.", "no…"] },
    { pic: "📅", it: ["dicembre", "L'ultimo mese dell'anno.", "di…"], en: ["december", "The last month of the year.", "de…"] },
    { pic: "📅", it: ["sabato", "Il giorno prima della domenica.", "sa…"], en: ["saturday", "The day before Sunday.", "sa…"] },
    { pic: "📅", it: ["domenica", "L'ultimo giorno della settimana.", "do…"], en: ["sunday", "The day after Saturday.", "su…"] }
  ];
  /* Letter path: words to trace through a grid of letters, grouped by category. Plain letters, no accents. */
  C.PATH_WORDS = {
    it: [
      ["Frutta", ["MELA", "PERA", "BANANA", "CILIEGIA", "ARANCIA", "FRAGOLA", "PESCA", "LIMONE", "ANGURIA", "PRUGNA"]],
      ["Fiori", ["ROSA", "TULIPANO", "GIRASOLE", "VIOLA", "GIGLIO", "ORCHIDEA", "CICLAMINO", "MIMOSA"]],
      ["Animali", ["GATTO", "CAVALLO", "MUCCA", "CONIGLIO", "LEONE", "PECORA", "GALLINA", "ASINO"]],
      ["Verdure", ["CAROTA", "PATATA", "ZUCCHINA", "CIPOLLA", "POMODORO", "INSALATA", "SEDANO"]],
      ["Mestieri", ["MEDICO", "CUOCO", "SARTO", "FORNAIO", "PITTORE", "MAESTRO", "POSTINO"]],
      ["Colori", ["ROSSO", "VERDE", "GIALLO", "AZZURRO", "BIANCO", "NERO", "MARRONE"]]
    ],
    en: [
      ["Fruit", ["APPLE", "PEAR", "BANANA", "CHERRY", "ORANGE", "LEMON", "PEACH", "GRAPE", "PLUM", "MELON"]],
      ["Flowers", ["ROSE", "TULIP", "DAISY", "LILY", "ORCHID", "VIOLET", "POPPY", "PANSY"]],
      ["Animals", ["CAT", "HORSE", "COW", "RABBIT", "LION", "SHEEP", "GOAT", "DONKEY"]],
      ["Vegetables", ["CARROT", "POTATO", "ONION", "TOMATO", "LETTUCE", "PEPPER", "CELERY"]],
      ["Jobs", ["DOCTOR", "COOK", "TAILOR", "BAKER", "PAINTER", "TEACHER", "POSTMAN"]],
      ["Colours", ["RED", "GREEN", "YELLOW", "BLUE", "WHITE", "BLACK", "BROWN"]]
    ]
  };
})(window.POG.content = window.POG.content || {});
