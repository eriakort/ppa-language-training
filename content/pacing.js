/*
 * Bilingual Rhythmic Speech & Inter-Syllabic Pacing Coach Bank.
 * Supports evidence-based Metronomic / Sound Production Treatment for nfvPPA & Primary
 * Progressive Apraxia of Speech (PPAOS): longer consonant-cluster & multisyllabic utterances
 * at Level 1 down to crisp 2-syllable daily anchors at Level 3.
 */
window.POG = window.POG || {};
(function (C) {
  C.PACING = {
    it: [
      /* Level 1 — 4-5 syllables, consonant clusters & practical phrases */
      {
        id: "pc_it_1", lv: 1, clusterTag: "cluster_long", pic: "📅",
        word: "appuntamento",
        syllables: ["ap", "pun", "ta", "men", "to"],
        cue: "Cinque battiti regolari, appoggiando la doppia «pp»."
      },
      {
        id: "pc_it_2", lv: 1, clusterTag: "cluster_phrase", pic: "☕",
        word: "prendo un caffè",
        syllables: ["pren", "do", "un", "caf", "fè"],
        cue: "Un battito per ogni sillaba senza correre su «pr»."
      },
      {
        id: "pc_it_3", lv: 1, clusterTag: "cluster_long", pic: "🏥",
        word: "fisioterapia",
        syllables: ["fi", "sio", "te", "ra", "pi", "a"],
        cue: "Sei passi lenti e chiari fino alla fine."
      },
      {
        id: "pc_it_4", lv: 1, clusterTag: "cluster_phrase", pic: "🚌",
        word: "scendo alla prossima",
        syllables: ["scen", "do", "al", "la", "pros", "si", "ma"],
        cue: "Separa bene «scen» e «pros» seguendo il ritmo."
      },
      /* Level 2 — 3-4 syllable functional words */
      {
        id: "pc_it_5", lv: 2, clusterTag: "multi_4", pic: "💊",
        word: "farmacia",
        syllables: ["far", "ma", "ci", "a"],
        cue: "Quattro sillabe nitide con la «r» chiara."
      },
      {
        id: "pc_it_6", lv: 2, clusterTag: "multi_4", pic: "☎️",
        word: "telefono",
        syllables: ["te", "le", "fo", "no"],
        cue: "Quattro battiti regolari tutti della stessa durata."
      },
      {
        id: "pc_it_7", lv: 2, clusterTag: "multi_4", pic: "🏥",
        word: "ospedale",
        syllables: ["o", "spe", "da", "le"],
        cue: "Stacca bene «o · spe» prima di «da · le»."
      },
      {
        id: "pc_it_8", lv: 2, clusterTag: "multi_3", pic: "🎫",
        word: "biglietto",
        syllables: ["bi", "gliet", "to"],
        cue: "Tre battiti pieni dando aria al suono «gli»."
      },
      /* Level 3 — crisp 2-syllable daily anchors */
      {
        id: "pc_it_9", lv: 3, clusterTag: "simple_2", pic: "🍞",
        word: "pane",
        syllables: ["pa", "ne"],
        cue: "Due sillabe morbide e distese."
      },
      {
        id: "pc_it_10", lv: 3, clusterTag: "simple_2", pic: "💧",
        word: "acqua",
        syllables: ["ac", "qua"],
        cue: "Due battiti netti fermandoti un attimo sulla «c»."
      },
      {
        id: "pc_it_11", lv: 3, clusterTag: "simple_2", pic: "🏠",
        word: "casa",
        syllables: ["ca", "sa"],
        cue: "Due colpi regolari, voce calma."
      },
      {
        id: "pc_it_12", lv: 3, clusterTag: "simple_2", pic: "🌞",
        word: "sole",
        syllables: ["so", "le"],
        cue: "Due sillabe fluide e naturali."
      }
    ],
    en: [
      /* Level 1 — 4-5 syllables, consonant clusters & practical phrases */
      {
        id: "pc_en_1", lv: 1, clusterTag: "cluster_long", pic: "📅",
        word: "appointment",
        syllables: ["ap", "point", "ment"],
        cue: "Hold three steady beats — give «point» full length."
      },
      {
        id: "pc_en_2", lv: 1, clusterTag: "cluster_phrase", pic: "☕",
        word: "please pass the tea",
        syllables: ["please", "pass", "the", "tea"],
        cue: "One clear beat per word; keep «pl» crisp."
      },
      {
        id: "pc_en_3", lv: 1, clusterTag: "cluster_long", pic: "💊",
        word: "prescription",
        syllables: ["pre", "scrip", "tion"],
        cue: "Three even beats — take your time on «scrip»."
      },
      {
        id: "pc_en_4", lv: 1, clusterTag: "cluster_long", pic: "🧊",
        word: "refrigerator",
        syllables: ["re", "fri", "ge", "ra", "tor"],
        cue: "Five steady taps — keep every beat the same length."
      },
      /* Level 2 — 3-4 syllable functional words */
      {
        id: "pc_en_5", lv: 2, clusterTag: "multi_3", pic: "🏥",
        word: "hospital",
        syllables: ["hos", "pi", "tal"],
        cue: "Three crisp beats: «hos · pi · tal»."
      },
      {
        id: "pc_en_6", lv: 2, clusterTag: "multi_3", pic: "☎️",
        word: "telephone",
        syllables: ["te", "le", "phone"],
        cue: "Three even taps all the way through."
      },
      {
        id: "pc_en_7", lv: 2, clusterTag: "multi_3", pic: "☂️",
        word: "umbrella",
        syllables: ["um", "brel", "la"],
        cue: "Pause briefly before «brel» so each beat stays clear."
      },
      {
        id: "pc_en_8", lv: 2, clusterTag: "multi_3", pic: "🚲",
        word: "bicycle",
        syllables: ["bi", "cy", "cle"],
        cue: "Three smooth beats to the end."
      },
      /* Level 3 — crisp 2-syllable daily anchors */
      {
        id: "pc_en_9", lv: 3, clusterTag: "simple_2", pic: "💧",
        word: "water",
        syllables: ["wa", "ter"],
        cue: "Two relaxed beats with a soft start."
      },
      {
        id: "pc_en_10", lv: 3, clusterTag: "simple_2", pic: "☕",
        word: "coffee",
        syllables: ["cof", "fee"],
        cue: "Two steady taps, calm breathing."
      },
      {
        id: "pc_en_11", lv: 3, clusterTag: "simple_2", pic: "🪑",
        word: "table",
        syllables: ["ta", "ble"],
        cue: "Two clean beats: «ta · ble»."
      },
      {
        id: "pc_en_12", lv: 3, clusterTag: "simple_2", pic: "📄",
        word: "paper",
        syllables: ["pa", "per"],
        cue: "Two even beats, clear voice."
      }
    ]
  };
})(window.POG.content = window.POG.content || {});
