/*
 * Bilingual Scaffolded Word-Finding & Category Sprint bank ("Scatto di parole / Word-finding sprint").
 * Curated for Primary Progressive Aphasia (nfvPPA initiation, svPPA semantic clustering, lvPPA phonemic access):
 *   - 9 Italian items + 9 English items, balanced 3/3/3 across Levels 1-3 and across `category`, `letter`, `situation`.
 *   - Level 1: higher generative target (8), Level 2: moderate target (6), Level 3: higher support target (5).
 *   - Every item provides 3 progressive subcategory clusters (`subgroups`) of 3 starter word/emoji chips each.
 */
window.POG = window.POG || {};
window.POG.content = window.POG.content || {};
window.POG.content.FLUENCY = {
  it: [
    /* ---------- Level 1 (Most demanding · target 8) ---------- */
    {
      id: "fl-it-1", lv: 1, kind: "category", pic: "🍎",
      title: "Alimenti al mercato",
      prompt: "Nomina o scrivi più alimenti che puoi trovare al mercato.",
      targetCount: 8,
      cue: "Pensa per corsie: prima frutta e verdura, poi pane e formaggi, infine pesce o carne.",
      tip: "Esplorare una corsia per volta aiuta a far emergere gruppi interi di parole.",
      subgroups: [
        { name: "Frutta e verdura", words: ["mela", "pomodoro", "insalata"] },
        { name: "Forno e latticini", words: ["pane", "formaggio", "latte"] },
        { name: "Dispensa", words: ["olio", "pasta", "fagioli"] }
      ]
    },
    {
      id: "fl-it-2", lv: 1, kind: "letter", letter: "C", pic: "🔤",
      title: "Parole con la lettera C",
      prompt: "Trova più parole che iniziano con la lettera C (non nomi propri).",
      targetCount: 8,
      cue: "Scorri le prime vocali: CA (casa, caffè), CO (coltello, corsa), CU (cucina, cuore).",
      tip: "Cambiare vocale dopo la lettera iniziale apre nuovi gruppi quando ci si blocca.",
      subgroups: [
        { name: "Suono CA-", words: ["casa", "caffè", "cane"] },
        { name: "Suono CO-", words: ["coltello", "colore", "cappotto"] },
        { name: "Suono CU- / CH-", words: ["cucina", "chiave", "chiesa"] }
      ]
    },
    {
      id: "fl-it-3", lv: 1, kind: "situation", pic: "🧳",
      title: "Preparare la valigia",
      prompt: "Che cosa metti in valigia per partire qualche giorno?",
      targetCount: 8,
      cue: "Immagina la giornata dal mattino alla sera: vestiti, bagno, documenti e oggetti pratici.",
      tip: "Visualizzare la routine dall'alba alla sera sblocca i nomi degli oggetti d'uso.",
      subgroups: [
        { name: "Vestiti e scarpe", words: ["maglia", "scarpe", "giacca"] },
        { name: "Bagno e cura", words: ["spazzolino", "sapone", "asciugamano"] },
        { name: "Documenti e borse", words: ["chiavi", "occhiali", "biglietto"] }
      ]
    },

    /* ---------- Level 2 (Moderate · target 6) ---------- */
    {
      id: "fl-it-4", lv: 2, kind: "category", pic: "🐾",
      title: "Animali",
      prompt: "Nomina o scrivi gli animali che ti vengono in mente.",
      targetCount: 6,
      cue: "Parti da quelli vicino a casa, poi passa a fattoria, bosco e mare.",
      tip: "Passare da casa a fattoria e poi al mare crea tre tappe facili da ricordare.",
      subgroups: [
        { name: "In casa e cortile", words: ["cane", "gatto", "gallina"] },
        { name: "Nel bosco o prato", words: ["volpe", "cervo", "coniglio"] },
        { name: "In acqua e cielo", words: ["pesce", "aquila", "delfino"] }
      ]
    },
    {
      id: "fl-it-5", lv: 2, kind: "letter", letter: "P", pic: "🅿️",
      title: "Parole con la lettera P",
      prompt: "Trova parole di uso comune che iniziano con la lettera P.",
      targetCount: 6,
      cue: "Prova PA (pane, parco), PE (pera, penna), PO (porta, ponte).",
      tip: "Legare la prima lettera a oggetti della casa o della tavola accelera il richiamo.",
      subgroups: [
        { name: "Tavola e cucina", words: ["pane", "piatto", "pera"] },
        { name: "Casa e oggetti", words: ["porta", "penna", "poltrona"] },
        { name: "Città e natura", words: ["piazza", "parco", "pioggia"] }
      ]
    },
    {
      id: "fl-it-6", lv: 2, kind: "situation", pic: "🍳",
      title: "Preparare la colazione",
      prompt: "Nomina cose o azioni che servono per preparare la colazione.",
      targetCount: 6,
      cue: "Pensa prima a tazze e posate, poi alle bevande e infine a pane o frutta.",
      tip: "Unire gli oggetti sul tavolo alle azioni (versare, tostare) allarga il lessico attivo.",
      subgroups: [
        { name: "Stoviglie sul tavolo", words: ["tazza", "cucchiaio", "piattino"] },
        { name: "Da bere", words: ["caffè", "latte", "tè"] },
        { name: "Da mangiare", words: ["biscotti", "marmellata", "miele"] }
      ]
    },

    /* ---------- Level 3 (Higher support · target 5) ---------- */
    {
      id: "fl-it-7", lv: 3, kind: "category", pic: "🛋️",
      title: "Cose in casa",
      prompt: "Nomina oggetti o mobili che trovi nelle stanze di casa.",
      targetCount: 5,
      cue: "Guarda mentalmente una stanza alla volta: soggiorno, camera e bagno.",
      tip: "Fare il giro mentale delle stanze sostiene la memoria semantica quotidiana.",
      subgroups: [
        { name: "Soggiorno", words: ["tavolo", "sedia", "divano"] },
        { name: "Camera", words: ["letto", "cuscino", "armadio"] },
        { name: "Bagno", words: ["specchio", "lavandino", "doccia"] }
      ]
    },
    {
      id: "fl-it-8", lv: 3, kind: "letter", letter: "M", pic: "Ⓜ️",
      title: "Parole con la lettera M",
      prompt: "Trova parole semplici che iniziano con la lettera M.",
      targetCount: 5,
      cue: "Pensa a MA (mano, mare, mela), ME (mese, tavolo → no, mensola), MO (montagna).",
      tip: "Partire da parole vicine al corpo e alla natura riduce lo sforzo iniziale.",
      subgroups: [
        { name: "Corpo e casa", words: ["mano", "maglione", "mensola"] },
        { name: "Cibo", words: ["mela", "miele", "melone"] },
        { name: "Natura", words: ["mare", "monte", "mattina"] }
      ]
    },
    {
      id: "fl-it-9", lv: 3, kind: "situation", pic: "🌳",
      title: "Passeggiata al parco",
      prompt: "Che cosa vedi o porti durante una passeggiata al parco?",
      targetCount: 5,
      cue: "Pensa agli alberi, alle persone o animali e a ciò che porti con te.",
      tip: "Tre categorie semplici — natura, panchina/sentiero, cose da portare — danno subito ritmo.",
      subgroups: [
        { name: "Natura", words: ["albero", "fiore", "erba"] },
        { name: "Lungo il viale", words: ["panchina", "fontana", "sentiero"] },
        { name: "Da portare", words: ["cappello", "bottiglia", "scarpe"] }
      ]
    }
  ],
  en: [
    /* ---------- Level 1 (Most demanding · target 8) ---------- */
    {
      id: "fl-en-1", lv: 1, kind: "category", pic: "🍎",
      title: "Food at the market",
      prompt: "Name or type as many foods from a food market as you can.",
      targetCount: 8,
      cue: "Picture three aisles: fruit and veg first, then bakery and dairy, then pantry staples.",
      tip: "Stepping aisle by aisle turns one hard search into three smooth clusters.",
      subgroups: [
        { name: "Fruit & veg", words: ["apple", "tomato", "spinach"] },
        { name: "Bakery & dairy", words: ["bread", "cheese", "milk"] },
        { name: "Pantry", words: ["rice", "olive oil", "beans"] }
      ]
    },
    {
      id: "fl-en-2", lv: 1, kind: "letter", letter: "S", pic: "🔤",
      title: "Words starting with S",
      prompt: "Find everyday words that start with the letter S (no people's names).",
      targetCount: 8,
      cue: "Try sound clusters: SA- (salt, sand), SO- (soup, sofa), ST- (spoon, stairs, station).",
      tip: "Shifting to a new vowel or blend (SA → SO → ST) restarts word flow when stuck.",
      subgroups: [
        { name: "Home & kitchen", words: ["spoon", "sofa", "salt"] },
        { name: "Clothes", words: ["shoes", "socks", "scarf"] },
        { name: "Outdoors", words: ["sun", "street", "station"] }
      ]
    },
    {
      id: "fl-en-3", lv: 1, kind: "situation", pic: "🧳",
      title: "Packing a suitcase",
      prompt: "What do you pack for a few days away from home?",
      targetCount: 8,
      cue: "Walk through morning to bedtime: clothes, washbag, and travel essentials.",
      tip: "Walking through a daily routine unlocks practical nouns reliably.",
      subgroups: [
        { name: "Clothes & shoes", words: ["shirt", "shoes", "coat"] },
        { name: "Washbag", words: ["toothbrush", "soap", "towel"] },
        { name: "Essentials", words: ["keys", "glasses", "ticket"] }
      ]
    },

    /* ---------- Level 2 (Moderate · target 6) ---------- */
    {
      id: "fl-en-4", lv: 2, kind: "category", pic: "🐾",
      title: "Animals",
      prompt: "Name or type all the animals that come to mind.",
      targetCount: 6,
      cue: "Start with pets at home, then move to farm animals, woods, or ocean.",
      tip: "Switching habitats—home, farm, ocean—keeps retrieval moving without straining.",
      subgroups: [
        { name: "Pets & farm", words: ["dog", "cat", "horse"] },
        { name: "Woods & fields", words: ["fox", "deer", "rabbit"] },
        { name: "Sea & sky", words: ["fish", "dolphin", "eagle"] }
      ]
    },
    {
      id: "fl-en-5", lv: 2, kind: "letter", letter: "P", pic: "🅿️",
      title: "Words starting with P",
      prompt: "Find common words that begin with the letter P.",
      targetCount: 6,
      cue: "Try PA- (pan, park, paper), PE- (pen, pear), PL- (plate, plant).",
      tip: "Anchoring the starting sound to rooms around you helps phonemic retrieval.",
      subgroups: [
        { name: "Kitchen & food", words: ["plate", "pear", "pasta"] },
        { name: "Desk & pocket", words: ["pen", "paper", "purse"] },
        { name: "Outdoors", words: ["park", "path", "plant"] }
      ]
    },
    {
      id: "fl-en-6", lv: 2, kind: "situation", pic: "🍳",
      title: "Making breakfast",
      prompt: "Name things you set out or use when making breakfast.",
      targetCount: 6,
      cue: "Picture the table first: mug and spoon, hot drinks, then bread or fruit.",
      tip: "Pairing table items with food gives quick, everyday word bridges.",
      subgroups: [
        { name: "Tableware", words: ["mug", "spoon", "bowl"] },
        { name: "Drinks", words: ["coffee", "tea", "juice"] },
        { name: "Breakfast food", words: ["toast", "jam", "butter"] }
      ]
    },

    /* ---------- Level 3 (Higher support · target 5) ---------- */
    {
      id: "fl-en-7", lv: 3, kind: "category", pic: "🛋️",
      title: "Things around the house",
      prompt: "Name furniture or objects you find in rooms at home.",
      targetCount: 5,
      cue: "Look around one room at a time: living room, bedroom, and bathroom.",
      tip: "A quiet mental tour from room to room supports semantic word access.",
      subgroups: [
        { name: "Living room", words: ["table", "chair", "sofa"] },
        { name: "Bedroom", words: ["bed", "pillow", "lamp"] },
        { name: "Bathroom", words: ["mirror", "sink", "towel"] }
      ]
    },
    {
      id: "fl-en-8", lv: 3, kind: "letter", letter: "M", pic: "Ⓜ️",
      title: "Words starting with M",
      prompt: "Find simple everyday words that start with the letter M.",
      targetCount: 5,
      cue: "Think MA- (map, market), MI- (milk, mirror), MO- (morning, moon).",
      tip: "Familiar sights from morning routines make M-words quick to start.",
      subgroups: [
        { name: "Kitchen & table", words: ["milk", "mug", "melon"] },
        { name: "Daily items", words: ["mirror", "map", "money"] },
        { name: "Day & sky", words: ["morning", "moon", "market"] }
      ]
    },
    {
      id: "fl-en-9", lv: 3, kind: "situation", pic: "🌳",
      title: "Walk in the park",
      prompt: "What do you see or bring along on a walk in the park?",
      targetCount: 5,
      cue: "Picture trees and grass, path and bench, and things you wear or carry.",
      tip: "Grouping sights into nature, path, and what to bring sparks extra words cleanly.",
      subgroups: [
        { name: "Nature", words: ["tree", "flower", "grass"] },
        { name: "Along the path", words: ["bench", "fountain", "pond"] },
        { name: "Bring along", words: ["hat", "water", "jacket"] }
      ]
    }
  ]
};
