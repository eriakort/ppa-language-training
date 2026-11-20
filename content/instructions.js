/*
 * Bilingual bank for Receptive Syntax & Multi-Step Instruction Following ("Segui i passaggi / Follow instructions").
 * Clinical rationale: Assesses and trains multi-step verbal working memory (lvPPA) and complex
 * syntactic clauses—temporal order (before/after), attribute/negation (Token Test), and reversible roles (nfvPPA).
 *
 * Balanced across Levels 1..3 (4 items/level) and 3 paradigms (sequence, attribute, clause) per language.
 */
(function () {
  "use strict";
  window.POG = window.POG || {};
  window.POG.content = window.POG.content || {};

  window.POG.content.INSTRUCTIONS = {
    it: [
      /* Level 3 — linear 2-step & clear attribute commands (more support) */
      {
        id: "inst_it_1", lv: 3, kind: "sequence", pic: "💊",
        instruction: "Prima tocca il bicchiere d'acqua, poi tocca la pillola.",
        slowText: "Prima tocca il bicchiere d'acqua... poi tocca la pillola.",
        cue: "Ordine diretto: 1) acqua → 2) pillola.",
        tokens: [
          { id: "water", pic: "🥛", label: "Bicchiere d'acqua" },
          { id: "pill", pic: "💊", label: "Pillola" },
          { id: "spoon", pic: "🥄", label: "Cucchiaio" },
          { id: "key", pic: "🔑", label: "Chiavi" }
        ],
        targetIds: ["water", "pill"],
        errFocus: "order_error",
        explanation: "Esatto: prima l'acqua, poi la pillola."
      },
      {
        id: "inst_it_2", lv: 3, kind: "attribute", pic: "🔴",
        instruction: "Tocca il cerchio rosso grande.",
        slowText: "Tocca... il cerchio rosso grande.",
        cue: "Controlla forma (cerchio), colore (rosso) e misura (grande).",
        tokens: [
          { id: "red_big_circle", pic: "🔴", label: "Cerchio rosso GRANDE" },
          { id: "red_small_circle", pic: "🔸", label: "Cerchio rosso piccolo" },
          { id: "blue_big_circle", pic: "🔵", label: "Cerchio blu GRANDE" },
          { id: "red_big_square", pic: "🟥", label: "Quadrato rosso GRANDE" }
        ],
        targetIds: ["red_big_circle"],
        errFocus: "attribute_foil",
        explanation: "Perfetto: hai verificato colore, forma e misura."
      },
      {
        id: "inst_it_3", lv: 3, kind: "clause", pic: "🛍️",
        instruction: "Prima di uscire, prendi la borsa e poi il biglietto.",
        slowText: "Prima di uscire... prendi la borsa... e poi il biglietto.",
        cue: "1) Borsa della spesa → 2) Biglietto / promemoria.",
        tokens: [
          { id: "bag", pic: "🛍️", label: "Borsa" },
          { id: "note", pic: "📝", label: "Biglietto" },
          { id: "cup", pic: "☕", label: "Tazzina" },
          { id: "book", pic: "📖", label: "Libro" }
        ],
        targetIds: ["bag", "note"],
        errFocus: "order_error",
        explanation: "Ottimo: borsa e poi biglietto."
      },
      {
        id: "inst_it_4", lv: 3, kind: "attribute", pic: "🔑",
        instruction: "Tocca le chiavi piccole, non il portafoglio.",
        slowText: "Tocca le chiavi piccole... non il portafoglio.",
        cue: "Escludi il portafoglio e cerca «piccole».",
        tokens: [
          { id: "key_small", pic: "🗝️", label: "Chiavi piccole" },
          { id: "key_big", pic: "🔑", label: "Chiave grande" },
          { id: "wallet", pic: "👛", label: "Portafoglio" },
          { id: "glasses", pic: "👓", label: "Occhiali" }
        ],
        targetIds: ["key_small"],
        errFocus: "attribute_foil",
        explanation: "Esatto: le chiavi piccole."
      },

      /* Level 2 — temporal inversions (prima di / dopo) & two-attribute chains */
      {
        id: "inst_it_5", lv: 2, kind: "sequence", pic: "🕰️",
        instruction: "Prima di chiudere la porta, spegni la luce.",
        slowText: "Attenzione: prima di chiudere la porta... spegni la luce.",
        cue: "«Prima di chiudere la porta» vuol dire che la luce viene PRIMA della porta.",
        tokens: [
          { id: "lamp", pic: "💡", label: "Spegni luce" },
          { id: "door", pic: "🚪", label: "Chiudi porta" },
          { id: "window", pic: "🪟", label: "Apri finestra" },
          { id: "coat", pic: "🧥", label: "Metti giacca" }
        ],
        targetIds: ["lamp", "door"],
        errFocus: "clause_trap",
        explanation: "Ottimo! Con «prima di B, fai A», l'azione A (luce) si fa per prima."
      },
      {
        id: "inst_it_6", lv: 2, kind: "attribute", pic: "🔵",
        instruction: "Tocca il quadrato blu piccolo, poi il cerchio giallo.",
        slowText: "Tocca il quadrato blu piccolo... poi il cerchio giallo.",
        cue: "1) Quadrato blu piccolo → 2) Cerchio giallo.",
        tokens: [
          { id: "blue_small_sq", pic: "🔹", label: "Quadrato blu piccolo" },
          { id: "yellow_circle", pic: "🟡", label: "Cerchio giallo" },
          { id: "blue_big_sq", pic: "🟦", label: "Quadrato blu GRANDE" },
          { id: "yellow_sq", pic: "🟨", label: "Quadrato giallo" }
        ],
        targetIds: ["blue_small_sq", "yellow_circle"],
        errFocus: "attribute_foil",
        explanation: "Ben fatto: entrambi gli elementi scelti nell'ordine giusto."
      },
      {
        id: "inst_it_7", lv: 2, kind: "clause", pic: "🏥",
        instruction: "Dopo aver preso lo scontrino, mostra la tessera sanitaria.",
        slowText: "Dopo aver preso lo scontrino... mostra la tessera sanitaria.",
        cue: "«Dopo X, fai Y» → si parte da X (scontrino) e poi Y (tessera).",
        tokens: [
          { id: "receipt", pic: "🧾", label: "Scontrino" },
          { id: "card", pic: "🪪", label: "Tessera sanitaria" },
          { id: "coin", pic: "🪙", label: "Monete" },
          { id: "phone", pic: "📱", label: "Telefono" }
        ],
        targetIds: ["receipt", "card"],
        errFocus: "clause_trap",
        explanation: "Chiaro: prima lo scontrino, poi la tessera."
      },
      {
        id: "inst_it_8", lv: 2, kind: "sequence", pic: "☕",
        instruction: "Metti lo zucchero solo dopo aver versato il caffè.",
        slowText: "Metti lo zucchero... solo dopo aver versato il caffè.",
        cue: "Ordine reale: 1) versa il caffè → 2) metti lo zucchero.",
        tokens: [
          { id: "coffee", pic: "☕", label: "Versa caffè" },
          { id: "sugar", pic: "🧂", label: "Metti zucchero" },
          { id: "plate", pic: "🍽️", label: "Piatto" },
          { id: "napkin", pic: "🧻", label: "Tovagliolo" }
        ],
        targetIds: ["coffee", "sugar"],
        errFocus: "clause_trap",
        explanation: "Perfetto: il caffè si versa prima dello zucchero."
      },

      /* Level 1 — 3-step spans, exceptions ("eccetto") & complex clauses */
      {
        id: "inst_it_9", lv: 1, kind: "sequence", pic: "🧭",
        instruction: "Tocca le chiavi, poi la mappa, e infine l'orologio.",
        slowText: "Tre passi: chiavi... mappa... e orologio.",
        cue: "Sequenza a 3 passi: 1) Chiavi → 2) Mappa → 3) Orologio.",
        tokens: [
          { id: "keys", pic: "🔑", label: "Chiavi" },
          { id: "map", pic: "🗺️", label: "Mappa" },
          { id: "watch", pic: "⌚", label: "Orologio" },
          { id: "umbrella", pic: "☂️", label: "Ombrello" }
        ],
        targetIds: ["keys", "map", "watch"],
        errFocus: "order_error",
        explanation: "Ottima memoria di lavoro su 3 passi!"
      },
      {
        id: "inst_it_10", lv: 1, kind: "attribute", pic: "🟢",
        instruction: "Tocca il cerchio verde, eccetto quello piccolo: prendi quello grande, poi il triangolo.",
        slowText: "Prendi il cerchio verde grande (non il piccolo)... poi il triangolo.",
        cue: "Escludi il piccolo → 1) Cerchio verde GRANDE → 2) Triangolo.",
        tokens: [
          { id: "green_big", pic: "🟢", label: "Cerchio verde GRANDE" },
          { id: "triangle", pic: "🔺", label: "Triangolo" },
          { id: "green_small", pic: "🍏", label: "Cerchio verde piccolo" },
          { id: "orange_circle", pic: "🟠", label: "Cerchio arancione" }
        ],
        targetIds: ["green_big", "triangle"],
        errFocus: "attribute_foil",
        explanation: "Ottimo controllo degli attributi e della negazione."
      },
      {
        id: "inst_it_11", lv: 1, kind: "clause", pic: "🩺",
        instruction: "La ricetta è stata consegnata dal medico al paziente: tocca prima chi l'ha data, poi chi l'ha ricevuta.",
        slowText: "Dal medico al paziente: tocca prima chi dà... poi chi riceve.",
        cue: "Frase passiva reversibile: chi dà = Medico → chi riceve = Paziente.",
        tokens: [
          { id: "doctor", pic: "👩‍⚕️", label: "Medico (chi dà)" },
          { id: "patient", pic: "🧑", label: "Paziente (chi riceve)" },
          { id: "nurse", pic: "🩺", label: "Stetoscopio" },
          { id: "bus", pic: "🚌", label: "Autobus" }
        ],
        targetIds: ["doctor", "patient"],
        errFocus: "clause_trap",
        explanation: "Perfetto: nella forma passiva («dal medico al paziente»), il medico è chi consegna."
      },
      {
        id: "inst_it_12", lv: 1, kind: "clause", pic: "🍲",
        instruction: "Prima di accendere i fornelli, controlla che la pentola abbia l'acqua e che il manico sia girato.",
        slowText: "Prima dei fornelli: 1) acqua nella pentola... 2) manico girato... 3) accendi.",
        cue: "Tre passi in sicurezza: 1) Acqua → 2) Manico → 3) Fornelli.",
        tokens: [
          { id: "water", pic: "💧", label: "Acqua in pentola" },
          { id: "pan", pic: "🍳", label: "Gira manico" },
          { id: "stove", pic: "🔥", label: "Accendi fornelli" },
          { id: "bread", pic: "🍞", label: "Taglia pane" }
        ],
        targetIds: ["water", "pan", "stove"],
        errFocus: "clause_trap",
        explanation: "Sequenza sicura completa: acqua, manico, poi fornelli."
      }
    ],

    en: [
      /* Level 3 — linear 2-step & clear attribute commands (more support) */
      {
        id: "inst_en_1", lv: 3, kind: "sequence", pic: "💊",
        instruction: "First tap the glass of water, then tap the pill.",
        slowText: "First tap the glass of water... then tap the pill.",
        cue: "Direct order: 1) water → 2) pill.",
        tokens: [
          { id: "water", pic: "🥛", label: "Glass of water" },
          { id: "pill", pic: "💊", label: "Pill" },
          { id: "spoon", pic: "🥄", label: "Spoon" },
          { id: "key", pic: "🔑", label: "Keys" }
        ],
        targetIds: ["water", "pill"],
        errFocus: "order_error",
        explanation: "Right: water first, then the pill."
      },
      {
        id: "inst_en_2", lv: 3, kind: "attribute", pic: "🔴",
        instruction: "Tap the large red circle.",
        slowText: "Tap... the large red circle.",
        cue: "Check shape (circle), colour (red), and size (large).",
        tokens: [
          { id: "red_big_circle", pic: "🔴", label: "LARGE red circle" },
          { id: "red_small_circle", pic: "🔸", label: "Small red circle" },
          { id: "blue_big_circle", pic: "🔵", label: "LARGE blue circle" },
          { id: "red_big_square", pic: "🟥", label: "LARGE red square" }
        ],
        targetIds: ["red_big_circle"],
        errFocus: "attribute_foil",
        explanation: "Well done checking colour, shape, and size."
      },
      {
        id: "inst_en_3", lv: 3, kind: "clause", pic: "🛍️",
        instruction: "Pick up your shopping bag, and then take the list.",
        slowText: "Pick up your shopping bag... and then take the list.",
        cue: "1) Shopping bag → 2) Shopping list.",
        tokens: [
          { id: "bag", pic: "🛍️", label: "Shopping bag" },
          { id: "note", pic: "📝", label: "Shopping list" },
          { id: "cup", pic: "☕", label: "Cup" },
          { id: "book", pic: "📖", label: "Book" }
        ],
        targetIds: ["bag", "note"],
        errFocus: "order_error",
        explanation: "Clean sequence: bag first, then the list."
      },
      {
        id: "inst_en_4", lv: 3, kind: "attribute", pic: "🔑",
        instruction: "Tap the small key, not the wallet.",
        slowText: "Tap the small key... not the wallet.",
        cue: "Skip the wallet and look for «small».",
        tokens: [
          { id: "key_small", pic: "🗝️", label: "Small key" },
          { id: "key_big", pic: "🔑", label: "Large key" },
          { id: "wallet", pic: "👛", label: "Wallet" },
          { id: "glasses", pic: "👓", label: "Glasses" }
        ],
        targetIds: ["key_small"],
        errFocus: "attribute_foil",
        explanation: "Spot on: the small key."
      },

      /* Level 2 — temporal inversions (before/after) & two-attribute chains */
      {
        id: "inst_en_5", lv: 2, kind: "sequence", pic: "🕰️",
        instruction: "Before locking the front door, turn off the lamp.",
        slowText: "Watch the order: before locking the door... turn off the lamp.",
        cue: "“Before B, do A” means you do A (lamp) FIRST, then B (door).",
        tokens: [
          { id: "lamp", pic: "💡", label: "Turn off lamp" },
          { id: "door", pic: "🚪", label: "Lock door" },
          { id: "window", pic: "🪟", label: "Open window" },
          { id: "coat", pic: "🧥", label: "Put on coat" }
        ],
        targetIds: ["lamp", "door"],
        errFocus: "clause_trap",
        explanation: "Great! With “Before locking the door, turn off the lamp”, the lamp comes first."
      },
      {
        id: "inst_en_6", lv: 2, kind: "attribute", pic: "🔵",
        instruction: "Tap the small blue square, then the yellow circle.",
        slowText: "Tap the small blue square... then the yellow circle.",
        cue: "1) Small blue square → 2) Yellow circle.",
        tokens: [
          { id: "blue_small_sq", pic: "🔹", label: "Small blue square" },
          { id: "yellow_circle", pic: "🟡", label: "Yellow circle" },
          { id: "blue_big_sq", pic: "🟦", label: "LARGE blue square" },
          { id: "yellow_sq", pic: "🟨", label: "Yellow square" }
        ],
        targetIds: ["blue_small_sq", "yellow_circle"],
        errFocus: "attribute_foil",
        explanation: "Both shapes selected accurately in the right order."
      },
      {
        id: "inst_en_7", lv: 2, kind: "clause", pic: "🏥",
        instruction: "After picking up the receipt, show your health card.",
        slowText: "After picking up the receipt... show your health card.",
        cue: "“After X, do Y” → start with X (receipt), then Y (health card).",
        tokens: [
          { id: "receipt", pic: "🧾", label: "Receipt" },
          { id: "card", pic: "🪪", label: "Health card" },
          { id: "coin", pic: "🪙", label: "Coins" },
          { id: "phone", pic: "📱", label: "Phone" }
        ],
        targetIds: ["receipt", "card"],
        errFocus: "clause_trap",
        explanation: "Clear: receipt first, then your health card."
      },
      {
        id: "inst_en_8", lv: 2, kind: "sequence", pic: "☕",
        instruction: "Add milk only after you pour the hot coffee.",
        slowText: "Add milk... only after you pour the coffee.",
        cue: "Real-world order: 1) pour coffee → 2) add milk.",
        tokens: [
          { id: "coffee", pic: "☕", label: "Pour coffee" },
          { id: "milk", pic: "🥛", label: "Add milk" },
          { id: "plate", pic: "🍽️", label: "Plate" },
          { id: "napkin", pic: "🧻", label: "Napkin" }
        ],
        targetIds: ["coffee", "milk"],
        errFocus: "clause_trap",
        explanation: "Exactly right: pour the coffee before adding milk."
      },

      /* Level 1 — 3-step spans, exceptions ("except") & reversible passives */
      {
        id: "inst_en_9", lv: 1, kind: "sequence", pic: "🧭",
        instruction: "Tap the keys, then the map, and last the watch.",
        slowText: "Three steps: keys... map... and watch.",
        cue: "3-step span: 1) Keys → 2) Map → 3) Watch.",
        tokens: [
          { id: "keys", pic: "🔑", label: "Keys" },
          { id: "map", pic: "🗺️", label: "Map" },
          { id: "watch", pic: "⌚", label: "Watch" },
          { id: "umbrella", pic: "☂️", label: "Umbrella" }
        ],
        targetIds: ["keys", "map", "watch"],
        errFocus: "order_error",
        explanation: "Strong 3-step working memory sequence!"
      },
      {
        id: "inst_en_10", lv: 1, kind: "attribute", pic: "🟢",
        instruction: "Take the large green circle, not the small one, and then the triangle.",
        slowText: "Large green circle (skip the small one)... then the triangle.",
        cue: "Avoid the small foil → 1) LARGE green circle → 2) Triangle.",
        tokens: [
          { id: "green_big", pic: "🟢", label: "LARGE green circle" },
          { id: "triangle", pic: "🔺", label: "Triangle" },
          { id: "green_small", pic: "🍏", label: "Small green circle" },
          { id: "orange_circle", pic: "🟠", label: "Orange circle" }
        ],
        targetIds: ["green_big", "triangle"],
        errFocus: "attribute_foil",
        explanation: "Sharp attention to size and negation."
      },
      {
        id: "inst_en_11", lv: 1, kind: "clause", pic: "🩺",
        instruction: "The prescription was handed by the doctor to the patient: tap the giver first, then the receiver.",
        slowText: "Handed by the doctor to the patient: giver first... then receiver.",
        cue: "Reversible passive: giver = Doctor → receiver = Patient.",
        tokens: [
          { id: "doctor", pic: "👩‍⚕️", label: "Doctor (giver)" },
          { id: "patient", pic: "🧑", label: "Patient (receiver)" },
          { id: "nurse", pic: "🩺", label: "Stethoscope" },
          { id: "bus", pic: "🚌", label: "Bus" }
        ],
        targetIds: ["doctor", "patient"],
        errFocus: "clause_trap",
        explanation: "Spot on: in “handed by the doctor to the patient”, the doctor is the giver."
      },
      {
        id: "inst_en_12", lv: 1, kind: "clause", pic: "🍲",
        instruction: "Before turning on the hob, check there is water in the pot and turn the handle inward.",
        slowText: "Before the hob: 1) water in pot... 2) turn handle... 3) turn on hob.",
        cue: "Safety sequence: 1) Water → 2) Handle → 3) Hob.",
        tokens: [
          { id: "water", pic: "💧", label: "Water in pot" },
          { id: "pan", pic: "🍳", label: "Turn handle" },
          { id: "stove", pic: "🔥", label: "Turn on hob" },
          { id: "bread", pic: "🍞", label: "Slice bread" }
        ],
        targetIds: ["water", "pan", "stove"],
        errFocus: "clause_trap",
        explanation: "Safe three-step sequence complete: water, handle, then hob."
      }
    ]
  };
})();
