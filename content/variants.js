/*
 * Variant-targeted PPA therapy content (bilingual: Italian and English).
 * Structured around the three primary PPA clinical syndromes:
 *   - sentence (nfvPPA / agrammatic): morphosyntactic tile ordering & verb/preposition choice
 *   - semantic (svPPA / semantic): odd-one-out, associative pairs, and semantic feature verification
 *   - soundspan (lvPPA & AOS): minimal-pair auditory/visual discrimination, syllable assembly, phonological span
 */
window.POG = window.POG || {};
window.POG.content = window.POG.content || {};

window.POG.content.VARIANTS = {
  sentence: {
    it: [
      /* Level 1: 6-7 words + grammatical distractor */
      { id: "s1", lv: 1, pic: "☕", focus: "prep", prompt: "Prepara la frase corretta per la colazione.", tokens: ["Luca", "beve", "il", "caffè", "caldo", "al", "bar"], distractors: ["nel", "bevono"], target: "Luca beve il caffè caldo al bar" },
      { id: "s2", lv: 1, pic: "🛒", focus: "tense", prompt: "Metti in ordine le parole sul mercato.", tokens: ["Oggi", "Maria", "compra", "le", "mele", "fresche"], distractors: ["comprano", "fresco"], target: "Oggi Maria compra le mele fresche" },
      { id: "s3", lv: 1, pic: "🚆", focus: "prep", prompt: "Ricostruisci la frase sul viaggio in treno.", tokens: ["Il", "treno", "per", "Roma", "parte", "alle", "otto"], distractors: ["partono", "da"], target: "Il treno per Roma parte alle otto" },
      { id: "s4", lv: 1, pic: "🌧️", focus: "verb", prompt: "Completa e ordina la frase sulla pioggia.", tokens: ["Quando", "piove", "prendo", "sempre", "il", "mio", "ombrello"], distractors: ["prende", "i"], target: "Quando piove prendo sempre il mio ombrello" },
      { id: "s5", lv: 1, pic: "🍲", focus: "agreement", prompt: "Ordina la frase sulla cucina.", tokens: ["La", "nonna", "prepara", "una", "zuppa", "molto", "buona"], distractors: ["preparano", "buoni"], target: "La nonna prepara una zuppa molto buona" },
      { id: "s6", lv: 1, pic: "🔑", focus: "prep", prompt: "Dove sono le chiavi?", tokens: ["Ho", "lasciato", "le", "chiavi", "sopra", "il", "tavolo"], distractors: ["sotto", "abbiamo"], target: "Ho lasciato le chiavi sopra il tavolo" },

      /* Level 2: 4-5 words, clean reorder */
      { id: "s7", lv: 2, pic: "🐕", focus: "verb", prompt: "Cosa fa il cane?", tokens: ["Il", "cane", "corre", "nel", "parco"], distractors: [], target: "Il cane corre nel parco" },
      { id: "s8", lv: 2, pic: "📖", focus: "verb", prompt: "Cosa legge Marco?", tokens: ["Marco", "legge", "il", "giornale"], distractors: [], target: "Marco legge il giornale" },
      { id: "s9", lv: 2, pic: "🌺", focus: "prep", prompt: "Chi annaffia i fiori?", tokens: ["Anna", "annaffia", "i", "fiori", "rossi"], distractors: [], target: "Anna annaffia i fiori rossi" },
      { id: "s10", lv: 2, pic: "🍞", focus: "verb", prompt: "Cosa fa il fornaio?", tokens: ["Il", "fornaio", "cuoce", "il", "pane"], distractors: [], target: "Il fornaio cuoce il pane" },
      { id: "s11", lv: 2, pic: "🚲", focus: "prep", prompt: "Come va a casa?", tokens: ["Paolo", "torna", "in", "bicicletta"], distractors: [], target: "Paolo torna in bicicletta" },
      { id: "s12", lv: 2, pic: "🥛", focus: "verb", prompt: "Cosa versa Giulia?", tokens: ["Giulia", "versa", "l'acqua", "fresca"], distractors: [], target: "Giulia versa l'acqua fresca" },

      /* Level 3: 3 tokens, simple SVO */
      { id: "s13", lv: 3, pic: "☀️", focus: "verb", prompt: "Ordina le tre parole.", tokens: ["Il sole", "splende", "alto"], distractors: [], target: "Il sole splende alto" },
      { id: "s14", lv: 3, pic: "🐱", focus: "verb", prompt: "Cosa fa il gatto?", tokens: ["Il gatto", "dorme", "qui"], distractors: [], target: "Il gatto dorme qui" },
      { id: "s15", lv: 3, pic: "🍎", focus: "verb", prompt: "Componi la frase.", tokens: ["Io", "mangio", "una mela"], distractors: [], target: "Io mangio una mela" },
      { id: "s16", lv: 3, pic: "🚪", focus: "verb", prompt: "Cosa fai con la porta?", tokens: ["Apro", "la porta", "piano"], distractors: [], target: "Apro la porta piano" },
      { id: "s17", lv: 3, pic: "🎵", focus: "verb", prompt: "Componi la frase.", tokens: ["Ascoltiamo", "la", "musica"], distractors: [], target: "Ascoltiamo la musica" },
      { id: "s18", lv: 3, pic: "🕰️", focus: "verb", prompt: "Ordina le parole.", tokens: ["È", "molto", "tardi"], distractors: [], target: "È molto tardi" }
    ],
    en: [
      /* Level 1: 6-7 words + grammatical distractor */
      { id: "s1", lv: 1, pic: "☕", focus: "prep", prompt: "Build the sentence about breakfast.", tokens: ["Luke", "drinks", "hot", "coffee", "at", "the", "café"], distractors: ["drinking", "under"], target: "Luke drinks hot coffee at the café" },
      { id: "s2", lv: 1, pic: "🛒", focus: "tense", prompt: "Put the market sentence in order.", tokens: ["Today", "Mary", "buys", "fresh", "apples", "there"], distractors: ["bought", "buying"], target: "Today Mary buys fresh apples there" },
      { id: "s3", lv: 1, pic: "🚆", focus: "prep", prompt: "Order the sentence about the train.", tokens: ["The", "train", "to", "London", "leaves", "at", "eight"], distractors: ["leaving", "on"], target: "The train to London leaves at eight" },
      { id: "s4", lv: 1, pic: "🌧️", focus: "verb", prompt: "Build the sentence about rain.", tokens: ["When", "it", "rains", "I", "take", "my", "umbrella"], distractors: ["raining", "takes"], target: "When it rains I take my umbrella" },
      { id: "s5", lv: 1, pic: "🍲", focus: "agreement", prompt: "Order the kitchen sentence.", tokens: ["Grandma", "makes", "a", "warm", "bowl", "of", "soup"], distractors: ["making", "make"], target: "Grandma makes a warm bowl of soup" },
      { id: "s6", lv: 1, pic: "🔑", focus: "prep", prompt: "Where are the keys?", tokens: ["I", "left", "the", "keys", "on", "the", "table"], distractors: ["inside", "leaving"], target: "I left the keys on the table" },

      /* Level 2: 4-5 words, clean reorder */
      { id: "s7", lv: 2, pic: "🐕", focus: "verb", prompt: "What is the dog doing?", tokens: ["Max", "walks", "in", "the", "park"], distractors: [], target: "Max walks in the park" },
      { id: "s8", lv: 2, pic: "📖", focus: "verb", prompt: "What is Mark reading?", tokens: ["Mark", "reads", "the", "morning", "paper"], distractors: [], target: "Mark reads the morning paper" },
      { id: "s9", lv: 2, pic: "🌺", focus: "verb", prompt: "Who waters the garden?", tokens: ["Anna", "waters", "the", "red", "flowers"], distractors: [], target: "Anna waters the red flowers" },
      { id: "s10", lv: 2, pic: "🍞", focus: "verb", prompt: "What does the baker do?", tokens: ["The", "baker", "bakes", "fresh", "bread"], distractors: [], target: "The baker bakes fresh bread" },
      { id: "s11", lv: 2, pic: "🚲", focus: "prep", prompt: "How does Paul go home?", tokens: ["Paul", "rides", "home", "by", "bike"], distractors: [], target: "Paul rides home by bike" },
      { id: "s12", lv: 2, pic: "🥛", focus: "verb", prompt: "What does Julia pour?", tokens: ["Julia", "pours", "a", "cold", "glass"], distractors: [], target: "Julia pours a cold glass" },

      /* Level 3: 3 tokens, simple SVO */
      { id: "s13", lv: 3, pic: "☀️", focus: "verb", prompt: "Order the three phrases.", tokens: ["The sun", "shines", "brightly"], distractors: [], target: "The sun shines brightly" },
      { id: "s14", lv: 3, pic: "🐱", focus: "verb", prompt: "What is the cat doing?", tokens: ["The cat", "sleeps", "here"], distractors: [], target: "The cat sleeps here" },
      { id: "s15", lv: 3, pic: "🍎", focus: "verb", prompt: "Build the sentence.", tokens: ["I", "eat", "an apple"], distractors: [], target: "I eat an apple" },
      { id: "s16", lv: 3, pic: "🚪", focus: "verb", prompt: "What do you do with the door?", tokens: ["Open", "the door", "slowly"], distractors: [], target: "Open the door slowly" },
      { id: "s17", lv: 3, pic: "🎵", focus: "verb", prompt: "Build the sentence.", tokens: ["We", "listen to", "music"], distractors: [], target: "We listen to music" },
      { id: "s18", lv: 3, pic: "🕰️", focus: "verb", prompt: "Order the words.", tokens: ["It", "is", "early"], distractors: [], target: "It is early" }
    ]
  },

  semantic: {
    it: [
      /* Level 1: close coordinate / subtle boundary */
      { id: "m1", lv: 1, kind: "odd", prompt: "Quale parola NON appartiene alle altre tre?", hint: "Tre si usano per tagliare o mangiare a tavola.", explanation: "Il martello è un attrezzo da lavoro, non una posata.", items: [{ w: "Forchetta", pic: "🍴" }, { w: "Cucchiaio", pic: "🥄" }, { w: "Coltello", pic: "🔪" }, { w: "Martello", pic: "🔨" }], ans: 3 },
      { id: "m2", lv: 1, kind: "odd", prompt: "Quale non c'entra con gli altri?", hint: "Tre sono fiori o piante del giardino.", explanation: "La nuvola sta in cielo, non cresce nel terreno.", items: [{ w: "Rosa", pic: "🌹" }, { w: "Girasole", pic: "🌻" }, { w: "Tulipano", pic: "🌷" }, { w: "Nuvola", pic: "☁️" }], ans: 3 },
      { id: "m3", lv: 1, kind: "assoc", prompt: "Quale oggetto va sempre insieme a:", anchor: { w: "Lucchetto", pic: "🔒" }, hint: "Serve per aprirlo.", explanation: "La chiave apre il lucchetto.", items: [{ w: "Chiave", pic: "🔑" }, { w: "Pettine", pic: "🪮" }, { w: "Ombrello", pic: "☂️" }, { w: "Forbici", pic: "✂️" }], ans: 0 },
      { id: "m4", lv: 1, kind: "feat", prompt: "È vero o falso?", anchor: { w: "Pinguino", pic: "🐧" }, statement: "Il pinguino vola alto tra le nuvole.", hint: "Pensa a come si muove nell'acqua e sul ghiaccio.", explanation: "Falso: il pinguino è un uccello che nuota ma non vola.", ans: false },
      { id: "m5", lv: 1, kind: "odd", prompt: "Trova l'intruso tra questi strumenti.", hint: "Tre fanno musica.", explanation: "La scopa serve per pulire, non per suonare.", items: [{ w: "Chitarra", pic: "🎸" }, { w: "Pianoforte", pic: "🎹" }, { w: "Violino", pic: "🎻" }, { w: "Scopa", pic: "🧹" }], ans: 3 },
      { id: "m6", lv: 1, kind: "assoc", prompt: "Quale si abbina meglio a:", anchor: { w: "Ago", pic: "🪡" }, hint: "Si usa per cucire.", explanation: "Ago e filo si usano insieme per cucire.", items: [{ w: "Saponetta", pic: "🧼" }, { w: "Filo", pic: "🧵" }, { w: "Martello", pic: "🔨" }, { w: "Tazza", pic: "☕" }], ans: 1 },

      /* Level 2: functional / category distinction */
      { id: "m7", lv: 2, kind: "odd", prompt: "Quale non fa parte del gruppo?", hint: "Tre si indossano quando fa freddo.", explanation: "La mela è un frutto, non un indumento.", items: [{ w: "Cappello", pic: "🧢" }, { w: "Sciarpa", pic: "🧣" }, { w: "Guanti", pic: "🧤" }, { w: "Mela", pic: "🍎" }], ans: 3 },
      { id: "m8", lv: 2, kind: "assoc", prompt: "Cosa si usa insieme a:", anchor: { w: "Spazzolino", pic: "🪥" }, hint: "Serve per lavare i denti.", explanation: "Sullo spazzolino si mette il dentifricio.", items: [{ w: "Dentifricio", pic: "🧴" }, { w: "Padella", pic: "🍳" }, { w: "Libro", pic: "📖" }, { w: "Calzino", pic: "🧦" }], ans: 0 },
      { id: "m9", lv: 2, kind: "feat", prompt: "È vero o falso?", anchor: { w: "Bicicletta", pic: "🚲" }, statement: "La bicicletta ha due ruote e i pedali.", hint: "Immagina di salirci sopra.", explanation: "Vero: la bicicletta ha due ruote e si muove coi pedali.", ans: true },
      { id: "m10", lv: 2, kind: "odd", prompt: "Quale parola è diversa dalle altre?", hint: "Tre sono mezzi di trasporto.", explanation: "Il cuscino sta sul letto, non viaggia su strada.", items: [{ w: "Treno", pic: "🚆" }, { w: "Autobus", pic: "🚌" }, { w: "Barca", pic: "⛵" }, { w: "Cuscino", pic: "🛏️" }], ans: 3 },
      { id: "m11", lv: 2, kind: "assoc", prompt: "Cosa serve con:", anchor: { w: "Busta da lettere", pic: "✉️" }, hint: "Si attacca prima di spedire.", explanation: "Sulla busta si attacca il francobollo.", items: [{ w: "Francobollo", pic: "📮" }, { w: "Piatto", pic: "🍽️" }, { w: "Chiave", pic: "🔑" }, { w: "Scarpa", pic: "👞" }], ans: 0 },
      { id: "m12", lv: 2, kind: "feat", prompt: "È vero o falso?", anchor: { w: "Limone", pic: "🍋" }, statement: "Il limone è un frutto dolce come il miele.", hint: "Ricorda il suo sapore quando lo assaggi.", explanation: "Falso: il limone ha un sapore aspro.", ans: false },

      /* Level 3: clear superordinate categories */
      { id: "m13", lv: 3, kind: "odd", prompt: "Quale NON è un animale?", hint: "Tre sono esseri viventi con le zampe o le ali.", explanation: "La sedia è un mobile, non un animale.", items: [{ w: "Cane", pic: "🐕" }, { w: "Gatto", pic: "🐱" }, { w: "Cavallo", pic: "🐴" }, { w: "Sedia", pic: "🪑" }], ans: 3 },
      { id: "m14", lv: 3, kind: "odd", prompt: "Quale NON si mangia?", hint: "Tre sono cibi.", explanation: "L'orologio segna l'ora, non si mangia.", items: [{ w: "Pane", pic: "🍞" }, { w: "Formaggio", pic: "🧀" }, { w: "Banana", pic: "🍌" }, { w: "Orologio", pic: "⌚" }], ans: 3 },
      { id: "m15", lv: 3, kind: "assoc", prompt: "Quando piove prendi:", anchor: { w: "Pioggia", pic: "🌧️" }, hint: "Ti ripara dall'acqua.", explanation: "Con la pioggia si apre l'ombrello.", items: [{ w: "Ombrello", pic: "☂️" }, { w: "Forchetta", pic: "🍴" }, { w: "Cuscino", pic: "🛏️" }], ans: 0 },
      { id: "m16", lv: 3, kind: "feat", prompt: "È vero o falso?", anchor: { w: "Pesce", pic: "🐟" }, statement: "Il pesce vive nell'acqua.", hint: "Pensa al mare o al fiume.", explanation: "Vero: il pesce nuota nell'acqua.", ans: true },
      { id: "m17", lv: 3, kind: "assoc", prompt: "Per leggere al buio accendi:", anchor: { w: "Libro", pic: "📖" }, hint: "Fa luce sulla pagina.", explanation: "La lampada illumina il libro per leggere.", items: [{ w: "Lampada", pic: "💡" }, { w: "Pentola", pic: "🍲" }, { w: "Palla", pic: "⚽" }], ans: 0 },
      { id: "m18", lv: 3, kind: "feat", prompt: "È vero o falso?", anchor: { w: "Neve", pic: "❄️" }, statement: "La neve è fredda e bianca.", hint: "Pensa all'inverno in montagna.", explanation: "Vero: la neve è bianca e fredda.", ans: true }
    ],
    en: [
      /* Level 1 */
      { id: "m1", lv: 1, kind: "odd", prompt: "Which word does NOT belong with the other three?", hint: "Three are used for eating at the table.", explanation: "A hammer is a workshop tool, not cutlery.", items: [{ w: "Fork", pic: "🍴" }, { w: "Spoon", pic: "🥄" }, { w: "Knife", pic: "🔪" }, { w: "Hammer", pic: "🔨" }], ans: 3 },
      { id: "m2", lv: 1, kind: "odd", prompt: "Which one does not belong?", hint: "Three grow in a garden.", explanation: "A cloud is in the sky, not a plant.", items: [{ w: "Rose", pic: "🌹" }, { w: "Sunflower", pic: "🌻" }, { w: "Tulip", pic: "🌷" }, { w: "Cloud", pic: "☁️" }], ans: 3 },
      { id: "m3", lv: 1, kind: "assoc", prompt: "Which item always goes with:", anchor: { w: "Padlock", pic: "🔒" }, hint: "You need it to open the lock.", explanation: "A key opens a padlock.", items: [{ w: "Key", pic: "🔑" }, { w: "Comb", pic: "🪮" }, { w: "Umbrella", pic: "☂️" }, { w: "Scissors", pic: "✂️" }], ans: 0 },
      { id: "m4", lv: 1, kind: "feat", prompt: "True or false?", anchor: { w: "Penguin", pic: "🐧" }, statement: "A penguin flies high through the clouds.", hint: "Think of how it moves on ice and in water.", explanation: "False: penguins swim in water and cannot fly.", ans: false },
      { id: "m5", lv: 1, kind: "odd", prompt: "Find the odd one out.", hint: "Three are musical instruments.", explanation: "A broom is for sweeping, not playing music.", items: [{ w: "Guitar", pic: "🎸" }, { w: "Piano", pic: "🎹" }, { w: "Violin", pic: "🎻" }, { w: "Broom", pic: "🧹" }], ans: 3 },
      { id: "m6", lv: 1, kind: "assoc", prompt: "Which one pairs best with:", anchor: { w: "Needle", pic: "🪡" }, hint: "Used together for sewing.", explanation: "Needle and thread are used for sewing.", items: [{ w: "Soap", pic: "🧼" }, { w: "Thread", pic: "🧵" }, { w: "Hammer", pic: "🔨" }, { w: "Mug", pic: "☕" }], ans: 1 },

      /* Level 2 */
      { id: "m7", lv: 2, kind: "odd", prompt: "Which item does not belong in the group?", hint: "Three are worn when it is cold.", explanation: "An apple is a fruit, not clothing.", items: [{ w: "Hat", pic: "🧢" }, { w: "Scarf", pic: "🧣" }, { w: "Gloves", pic: "🧤" }, { w: "Apple", pic: "🍎" }], ans: 3 },
      { id: "m8", lv: 2, kind: "assoc", prompt: "What goes with:", anchor: { w: "Toothbrush", pic: "🪥" }, hint: "Used to clean teeth.", explanation: "Toothpaste goes on a toothbrush.", items: [{ w: "Toothpaste", pic: "🧴" }, { w: "Frying pan", pic: "🍳" }, { w: "Book", pic: "📖" }, { w: "Sock", pic: "🧦" }], ans: 0 },
      { id: "m9", lv: 2, kind: "feat", prompt: "True or false?", anchor: { w: "Bicycle", pic: "🚲" }, statement: "A bicycle has two wheels and pedals.", hint: "Picture riding one on a path.", explanation: "True: a bicycle has two wheels and pedals.", ans: true },
      { id: "m10", lv: 2, kind: "odd", prompt: "Which word is different from the rest?", hint: "Three are ways to travel.", explanation: "A pillow stays on a bed, it is not transport.", items: [{ w: "Train", pic: "🚆" }, { w: "Bus", pic: "🚌" }, { w: "Boat", pic: "⛵" }, { w: "Pillow", pic: "🛏️" }], ans: 3 },
      { id: "m11", lv: 2, kind: "assoc", prompt: "What goes on an:", anchor: { w: "Envelope", pic: "✉️" }, hint: "You stick it on before posting.", explanation: "A stamp goes on an envelope.", items: [{ w: "Stamp", pic: "📮" }, { w: "Plate", pic: "🍽️" }, { w: "Key", pic: "🔑" }, { w: "Shoe", pic: "👞" }], ans: 0 },
      { id: "m12", lv: 2, kind: "feat", prompt: "True or false?", anchor: { w: "Lemon", pic: "🍋" }, statement: "A lemon tastes as sweet as honey.", hint: "Think about biting into a lemon.", explanation: "False: a lemon is sour, not sweet.", ans: false },

      /* Level 3 */
      { id: "m13", lv: 3, kind: "odd", prompt: "Which one is NOT an animal?", hint: "Three are living creatures.", explanation: "A chair is furniture, not an animal.", items: [{ w: "Dog", pic: "🐕" }, { w: "Cat", pic: "🐱" }, { w: "Horse", pic: "🐴" }, { w: "Chair", pic: "🪑" }], ans: 3 },
      { id: "m14", lv: 3, kind: "odd", prompt: "Which one can you NOT eat?", hint: "Three are foods.", explanation: "A watch tells the time; it is not food.", items: [{ w: "Bread", pic: "🍞" }, { w: "Cheese", pic: "🧀" }, { w: "Banana", pic: "🍌" }, { w: "Watch", pic: "⌚" }], ans: 3 },
      { id: "m15", lv: 3, kind: "assoc", prompt: "When it rains, you take:", anchor: { w: "Rain", pic: "🌧️" }, hint: "It keeps the water off.", explanation: "An umbrella keeps you dry in the rain.", items: [{ w: "Umbrella", pic: "☂️" }, { w: "Fork", pic: "🍴" }, { w: "Pillow", pic: "🛏️" }], ans: 0 },
      { id: "m16", lv: 3, kind: "feat", prompt: "True or false?", anchor: { w: "Fish", pic: "🐟" }, statement: "A fish lives in the water.", hint: "Think of the sea or a river.", explanation: "True: fish live and swim in water.", ans: true },
      { id: "m17", lv: 3, kind: "assoc", prompt: "To read in the dark, turn on:", anchor: { w: "Book", pic: "📖" }, hint: "It gives you light.", explanation: "A lamp lights up your book.", items: [{ w: "Lamp", pic: "💡" }, { w: "Pot", pic: "🍲" }, { w: "Ball", pic: "⚽" }], ans: 0 },
      { id: "m18", lv: 3, kind: "feat", prompt: "True or false?", anchor: { w: "Snow", pic: "❄️" }, statement: "Snow is cold and white.", hint: "Think of winter weather.", explanation: "True: snow is white and cold.", ans: true }
    ]
  },

  soundspan: {
    it: [
      /* Level 1: 4-word span, 4-syllable words, close minimal pairs */
      { id: "p1", lv: 1, kind: "pair", prompt: "Ascolta la parola e tocca quella giusta.", targetWord: "Cane", clue: "Suona quasi come «pane», ma inizia con C.", items: [{ w: "Cane", pic: "🐕" }, { w: "Pane", pic: "🍞" }, { w: "Rana", pic: "🐸" }], ans: 0 },
      { id: "p2", lv: 1, kind: "pair", prompt: "Ascolta la parola e tocca quella giusta.", targetWord: "Treno", clue: "Inizia con T-R, viaggia sui binari.", items: [{ w: "Treno", pic: "🚆" }, { w: "Freno", pic: "🛑" }, { w: "Vero", pic: "✅" }], ans: 0 },
      { id: "p3", lv: 1, kind: "syll", prompt: "Metti in ordine le sillabe per formare la parola.", word: "TELEFONO", pic: "☎️", syllables: ["TE", "LE", "FO", "NO"], distractors: ["MA"] },
      { id: "p4", lv: 1, kind: "syll", prompt: "Metti in ordine le sillabe.", word: "BICICLETTA", pic: "🚲", syllables: ["BI", "CI", "CLET", "TA"], distractors: ["RO"] },
      { id: "p5", lv: 1, kind: "span", prompt: "Ascolta le parole e toccale nello stesso ordine.", sequence: [{ w: "Pane", pic: "🍞" }, { w: "Chiave", pic: "🔑" }, { w: "Barca", pic: "⛵" }, { w: "Sole", pic: "☀️" }] },
      { id: "p6", lv: 1, kind: "span", prompt: "Ascolta la sequenza e ripetila toccando le carte.", sequence: [{ w: "Tazza", pic: "☕" }, { w: "Libro", pic: "📖" }, { w: "Fiore", pic: "🌺" }, { w: "Treno", pic: "🚆" }] },

      /* Level 2: 3-word span, 3-4 syllable assembly, 2-option minimal pairs */
      { id: "p7", lv: 2, kind: "pair", prompt: "Ascolta la parola e scegli tra le due.", targetWord: "Pera", clue: "Un frutto dolce che inizia con P.", items: [{ w: "Pera", pic: "🍐" }, { w: "Sera", pic: "🌙" }], ans: 0 },
      { id: "p8", lv: 2, kind: "pair", prompt: "Ascolta la parola e scegli tra le due.", targetWord: "Mare", clue: "Acqua salata, finisce con -re.", items: [{ w: "Sale", pic: "🧂" }, { w: "Mare", pic: "🌊" }], ans: 1 },
      { id: "p9", lv: 2, kind: "syll", prompt: "Unisci le sillabe nella giusta sequenza.", word: "OMBRELLO", pic: "☂️", syllables: ["OM", "BREL", "LO"], distractors: [] },
      { id: "p10", lv: 2, kind: "syll", prompt: "Unisci le sillabe nella giusta sequenza.", word: "POMODORO", pic: "🍅", syllables: ["PO", "MO", "DO", "RO"], distractors: [] },
      { id: "p11", lv: 2, kind: "span", prompt: "Ascolta le tre parole e toccale nell'ordine.", sequence: [{ w: "Mela", pic: "🍎" }, { w: "Cane", pic: "🐕" }, { w: "Sedia", pic: "🪑" }] },
      { id: "p12", lv: 2, kind: "span", prompt: "Ascolta le tre parole e toccale nell'ordine.", sequence: [{ w: "Casa", pic: "🏠" }, { w: "Acqua", pic: "💧" }, { w: "Pane", pic: "🍞" }] },

      /* Level 3: 2-word span, 2-3 syllable words, clear minimal pairs */
      { id: "p13", lv: 3, kind: "pair", prompt: "Ascolta e tocca la parola giusta.", targetWord: "Borsa", clue: "Inizia con B, la porti con te.", items: [{ w: "Borsa", pic: "👜" }, { w: "Corsa", pic: "🏃" }], ans: 0 },
      { id: "p14", lv: 3, kind: "pair", prompt: "Ascolta e tocca la parola giusta.", targetWord: "Lago", clue: "Inizia con L, ha l'acqua.", items: [{ w: "Ago", pic: "🪡" }, { w: "Lago", pic: "🏞️" }], ans: 1 },
      { id: "p15", lv: 3, kind: "syll", prompt: "Componi la parola con le sillabe.", word: "MATITA", pic: "✏️", syllables: ["MA", "TI", "TA"], distractors: [] },
      { id: "p16", lv: 3, kind: "syll", prompt: "Componi la parola con le sillabe.", word: "TAVOLO", pic: "🪑", syllables: ["TA", "VO", "LO"], distractors: [] },
      { id: "p17", lv: 3, kind: "span", prompt: "Ascolta le due parole e toccale nell'ordine.", sequence: [{ w: "Sole", pic: "☀️" }, { w: "Luna", pic: "🌙" }] },
      { id: "p18", lv: 3, kind: "span", prompt: "Ascolta le due parole e toccale nell'ordine.", sequence: [{ w: "Pane", pic: "🍞" }, { w: "Latte", pic: "🥛" }] }
    ],
    en: [
      /* Level 1 */
      { id: "p1", lv: 1, kind: "pair", prompt: "Listen to the word and tap the match.", targetWord: "Pear", clue: "Starts with P, sounds like bear.", items: [{ w: "Pear", pic: "🍐" }, { w: "Bear", pic: "🐻" }, { w: "Chair", pic: "🪑" }], ans: 0 },
      { id: "p2", lv: 1, kind: "pair", prompt: "Listen to the word and tap the match.", targetWord: "Coat", clue: "Starts with C, keeps you warm.", items: [{ w: "Boat", pic: "⛵" }, { w: "Coat", pic: "🧥" }, { w: "Goat", pic: "🐐" }], ans: 1 },
      { id: "p3", lv: 1, kind: "syll", prompt: "Put the syllables in order to build the word.", word: "TELEPHONE", pic: "☎️", syllables: ["TEL", "E", "PHONE"], distractors: ["CA"] },
      { id: "p4", lv: 1, kind: "syll", prompt: "Put the syllables in order.", word: "WATERMELON", pic: "🍉", syllables: ["WA", "TER", "MEL", "ON"], distractors: ["BI"] },
      { id: "p5", lv: 1, kind: "span", prompt: "Listen to the four words and tap them in order.", sequence: [{ w: "Bread", pic: "🍞" }, { w: "Key", pic: "🔑" }, { w: "Boat", pic: "⛵" }, { w: "Sun", pic: "☀️" }] },
      { id: "p6", lv: 1, kind: "span", prompt: "Listen carefully and tap the four cards in order.", sequence: [{ w: "Cup", pic: "☕" }, { w: "Book", pic: "📖" }, { w: "Flower", pic: "🌺" }, { w: "Train", pic: "🚆" }] },

      /* Level 2 */
      { id: "p7", lv: 2, kind: "pair", prompt: "Listen and choose between the two words.", targetWord: "Cat", clue: "Starts with C, a small pet.", items: [{ w: "Cat", pic: "🐱" }, { w: "Hat", pic: "👒" }], ans: 0 },
      { id: "p8", lv: 2, kind: "pair", prompt: "Listen and choose between the two words.", targetWord: "Rain", clue: "Starts with R, falls from clouds.", items: [{ w: "Train", pic: "🚆" }, { w: "Rain", pic: "🌧️" }], ans: 1 },
      { id: "p9", lv: 2, kind: "syll", prompt: "Join the syllables in the right order.", word: "UMBRELLA", pic: "☂️", syllables: ["UM", "BREL", "LA"], distractors: [] },
      { id: "p10", lv: 2, kind: "syll", prompt: "Join the syllables in the right order.", word: "HOSPITAL", pic: "🏥", syllables: ["HOS", "PI", "TAL"], distractors: [] },
      { id: "p11", lv: 2, kind: "span", prompt: "Listen to the three words and tap them in order.", sequence: [{ w: "Apple", pic: "🍎" }, { w: "Dog", pic: "🐕" }, { w: "Chair", pic: "🪑" }] },
      { id: "p12", lv: 2, kind: "span", prompt: "Listen to the three words and tap them in order.", sequence: [{ w: "House", pic: "🏠" }, { w: "Water", pic: "💧" }, { w: "Bread", pic: "🍞" }] },

      /* Level 3 */
      { id: "p13", lv: 3, kind: "pair", prompt: "Listen and tap the matching word.", targetWord: "Pan", clue: "Starts with P, used for cooking.", items: [{ w: "Pan", pic: "🍳" }, { w: "Fan", pic: "🪭" }], ans: 0 },
      { id: "p14", lv: 3, kind: "pair", prompt: "Listen and tap the matching word.", targetWord: "Key", clue: "Starts with K, opens a door.", items: [{ w: "Tea", pic: "🍵" }, { w: "Key", pic: "🔑" }], ans: 1 },
      { id: "p15", lv: 3, kind: "syll", prompt: "Build the word from its syllables.", word: "PENCIL", pic: "✏️", syllables: ["PEN", "CIL"], distractors: [] },
      { id: "p16", lv: 3, kind: "syll", prompt: "Build the word from its syllables.", word: "WINDOW", pic: "🪟", syllables: ["WIN", "DOW"], distractors: [] },
      { id: "p17", lv: 3, kind: "span", prompt: "Listen to both words and tap them in order.", sequence: [{ w: "Sun", pic: "☀️" }, { w: "Moon", pic: "🌙" }] },
      { id: "p18", lv: 3, kind: "span", prompt: "Listen to both words and tap them in order.", sequence: [{ w: "Bread", pic: "🍞" }, { w: "Milk", pic: "🥛" }] }
    ]
  }
};
