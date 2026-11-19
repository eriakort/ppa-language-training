/*
 * Bilingual Written Naming, Orthographic Regularity & Copy-and-Recall (CART) Bank.
 * Covers:
 *   - orth   : orthographically irregular or phoneme-grapheme tricky words (surface dysgraphia probe)
 *   - cart   : high-utility multisyllabic everyday words suited for Copy & Recall Treatment (CART)
 *   - phrase : practical short written messages / SMS replies for everyday communication
 * Levels: 1 = most demanding, 3 = most support.
 */
window.POG = window.POG || {};
(function (C) {
  C.WRITING = {
    it: [
      /* Level 1 — longer irregular words & practical short messages */
      {
        id: "wr_it_1", lv: 1, kind: "orth", pic: "💊",
        target: "farmacia",
        prompt: "Scrivi il posto dove ritiri le medicine.",
        clue: "Ha il suono «cia» alla fine.",
        phoneticSkeletons: ["farmazia", "farmaciah", "farmaca", "farmashia"],
        tiles: ["far", "ma", "cia"]
      },
      {
        id: "wr_it_2", lv: 1, kind: "cart", pic: "📅",
        target: "appuntamento",
        prompt: "Scrivi la parola per l'ora fissata dal medico.",
        clue: "Ricorda la doppia «pp».",
        phoneticSkeletons: ["apuntamento", "apuntameto", "appuntamnto"],
        tiles: ["ap", "pun", "ta", "men", "to"]
      },
      {
        id: "wr_it_3", lv: 1, kind: "phrase", pic: "📱",
        target: "arrivo subito",
        prompt: "Scrivi un messaggio breve per dire che stai arrivando.",
        clue: "Due parole: «arrivo …»",
        phoneticSkeletons: ["arivo subito", "arrivo subto", "arivo subto"],
        tiles: ["arrivo", "subito"]
      },
      {
        id: "wr_it_4", lv: 1, kind: "phrase", pic: "💊",
        target: "ho preso le medicine",
        prompt: "Scrivi a un familiare che hai già preso la terapia.",
        clue: "Inizia con «ho preso …» (con la h).",
        phoneticSkeletons: ["o preso le medicine", "ho preso le medisine", "opreso le medicine"],
        tiles: ["ho", "preso", "le", "medicine"]
      },
      /* Level 2 — medium everyday orthographic & CART targets */
      {
        id: "wr_it_5", lv: 2, kind: "orth", pic: "🏫",
        target: "scuola",
        prompt: "Scrivi il luogo dove si va a studiare.",
        clue: "Si scrive con la «u» dopo «sc».",
        phoneticSkeletons: ["squola", "scola", "skuola", "squa"],
        tiles: ["sc", "uo", "la"]
      },
      {
        id: "wr_it_6", lv: 2, kind: "orth", pic: "🎫",
        target: "biglietto",
        prompt: "Scrivi cosa serve per salire sul treno o al cinema.",
        clue: "Contiene «gli» e la doppia «tt».",
        phoneticSkeletons: ["bilietto", "biglieto", "bilieto", "bigleto"],
        tiles: ["bi", "gli", "et", "to"]
      },
      {
        id: "wr_it_7", lv: 2, kind: "cart", pic: "🏥",
        target: "ospedale",
        prompt: "Scrivi dove si va per visite o cure importanti.",
        clue: "Quattro sillabe: o · spe · da · le.",
        phoneticSkeletons: ["opedale", "ospedle", "ospedali"],
        tiles: ["o", "spe", "da", "le"]
      },
      {
        id: "wr_it_8", lv: 2, kind: "phrase", pic: "🙂",
        target: "tutto bene",
        prompt: "Scrivi una risposta rapida per rassicurare chi ti scrive.",
        clue: "Due parole con la doppia «tt».",
        phoneticSkeletons: ["tuto bene", "tutto bne", "tutobene"],
        tiles: ["tutto", "bene"]
      },
      /* Level 3 — shorter concrete high-frequency words + cued syllables */
      {
        id: "wr_it_9", lv: 3, kind: "orth", pic: "💧",
        target: "acqua",
        prompt: "Scrivi cosa bevi quando hai sete.",
        clue: "Ha sia «c» sia «q»: a-c-q-u-a.",
        phoneticSkeletons: ["aqua", "akua", "acua", "aqwa"],
        tiles: ["ac", "q", "ua"]
      },
      {
        id: "wr_it_10", lv: 3, kind: "orth", pic: "❤️",
        target: "cuore",
        prompt: "Scrivi il nome dell'organo che batte nel petto.",
        clue: "Inizia con «cu», non con la q.",
        phoneticSkeletons: ["quore", "kuore", "core", "qore"],
        tiles: ["cu", "o", "re"]
      },
      {
        id: "wr_it_11", lv: 3, kind: "cart", pic: "☎️",
        target: "telefono",
        prompt: "Scrivi lo strumento che usi per chiamare.",
        clue: "Quattro sillabe: te · le · fo · no.",
        phoneticSkeletons: ["tefono", "telefno", "telofono"],
        tiles: ["te", "le", "fo", "no"]
      },
      {
        id: "wr_it_12", lv: 3, kind: "phrase", pic: "👋",
        target: "a domani",
        prompt: "Scrivi un saluto breve per chi rivedi il giorno dopo.",
        clue: "Due parole: «a …»",
        phoneticSkeletons: ["adomani", "a domni", "a doman"],
        tiles: ["a", "domani"]
      }
    ],
    en: [
      /* Level 1 — irregular spellings & functional SMS replies */
      {
        id: "wr_en_1", lv: 1, kind: "orth", pic: "🧾",
        target: "receipt",
        prompt: "Type the paper slip you get after paying at a shop.",
        clue: "Has a silent «p» near the end.",
        phoneticSkeletons: ["receit", "resiet", "receet", "recit", "reseat"],
        tiles: ["re", "ce", "ipt"]
      },
      {
        id: "wr_en_2", lv: 1, kind: "cart", pic: "📅",
        target: "appointment",
        prompt: "Type the word for a booked time with your doctor.",
        clue: "Remember double «pp».",
        phoneticSkeletons: ["apointment", "apointmnt", "appoitment", "apoinment"],
        tiles: ["ap", "point", "ment"]
      },
      {
        id: "wr_en_3", lv: 1, kind: "phrase", pic: "📱",
        target: "on my way",
        prompt: "Type a short text reply to say you are coming now.",
        clue: "Three short words: «on … …»",
        phoneticSkeletons: ["on mi way", "on my wai", "onmyway"],
        tiles: ["on", "my", "way"]
      },
      {
        id: "wr_en_4", lv: 1, kind: "phrase", pic: "💊",
        target: "took my pills",
        prompt: "Type a short note to family saying you took your medication.",
        clue: "Three words starting with «took …»",
        phoneticSkeletons: ["tuk my pills", "took mi pils", "took my pils"],
        tiles: ["took", "my", "pills"]
      },
      /* Level 2 — medium irregular & multisyllabic everyday words */
      {
        id: "wr_en_5", lv: 2, kind: "orth", pic: "🏝️",
        target: "island",
        prompt: "Type the word for land surrounded by water.",
        clue: "Has a silent «s» after the «i».",
        phoneticSkeletons: ["iland", "eyeland", "ieland", "islan"],
        tiles: ["is", "la", "nd"]
      },
      {
        id: "wr_en_6", lv: 2, kind: "orth", pic: "😷",
        target: "cough",
        prompt: "Type what you do when your throat is tickly.",
        clue: "Ends in «ough».",
        phoneticSkeletons: ["kof", "cof", "koff", "coff", "couf"],
        tiles: ["c", "ou", "gh"]
      },
      {
        id: "wr_en_7", lv: 2, kind: "cart", pic: "🏥",
        target: "hospital",
        prompt: "Type the place where doctors and nurses treat patients.",
        clue: "Three syllables: hos · pi · tal.",
        phoneticSkeletons: ["hospitl", "ospitl", "hosptal", "hopital"],
        tiles: ["hos", "pi", "tal"]
      },
      {
        id: "wr_en_8", lv: 2, kind: "phrase", pic: "🙂",
        target: "all is well",
        prompt: "Type a reassuring short message.",
        clue: "Three short words: «all … …»",
        phoneticSkeletons: ["al is wel", "all is wel", "aliswell"],
        tiles: ["all", "is", "well"]
      },
      /* Level 3 — shorter concrete irregular & functional words */
      {
        id: "wr_en_9", lv: 3, kind: "orth", pic: "🔪",
        target: "knife",
        prompt: "Type what you use with a fork to cut food.",
        clue: "Starts with a silent «k».",
        phoneticSkeletons: ["nife", "naif", "knif", "nyfe"],
        tiles: ["k", "ni", "fe"]
      },
      {
        id: "wr_en_10", lv: 3, kind: "orth", pic: "🍞",
        target: "bread",
        prompt: "Type what you slice for toast or a sandwich.",
        clue: "Spelled «ea» in the middle.",
        phoneticSkeletons: ["bred", "brad", "brede", "breadd"],
        tiles: ["br", "ea", "d"]
      },
      {
        id: "wr_en_11", lv: 3, kind: "cart", pic: "☎️",
        target: "phone",
        prompt: "Type what you use to call family.",
        clue: "Starts with «ph».",
        phoneticSkeletons: ["fone", "fon", "phne", "phon"],
        tiles: ["ph", "o", "ne"]
      },
      {
        id: "wr_en_12", lv: 3, kind: "phrase", pic: "👋",
        target: "see you soon",
        prompt: "Type a friendly goodbye message.",
        clue: "Three short words: «see … …»",
        phoneticSkeletons: ["c u soon", "see u soon", "see you sun", "seeyousoon"],
        tiles: ["see", "you", "soon"]
      }
    ]
  };
})(window.POG.content = window.POG.content || {});
