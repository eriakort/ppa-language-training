/*
 * Bilingual Functional Numbers, Times, Prices & Dosage Comprehension Bank
 * (12 Italian + 12 English items, balanced 4/4/4 across Levels 1-3 and across time/price/dosage).
 *
 * Targets everyday number-transcoding resilience (clock times, clinic appointments, shop prices,
 * medication schedules) with realistic transposition (digit/teen swap) vs magnitude foils.
 */
(function () {
  "use strict";
  window.POG = window.POG || {};
  window.POG.content = window.POG.content || {};

  window.POG.content.NUMBERS = {
    it: [
      /* Level 1 — Multi-step or close transposition contrasts */
      {
        id: "nm_it_1", lv: 1, kind: "time", pic: "🩺",
        prompt: "La segreteria ricorda: «La visita è alle quattordici e trenta».",
        spoken: "La visita è alle quattordici e trenta.",
        cue: "14 corrisponde alle 2 del pomeriggio; trenta = :30.",
        opts: ["13:40", "14:30", "14:03"],
        ans: 1,
        foilTypes: ["transposition", "target", "magnitude"],
        fullSentence: "Appuntamento confermato alle 14:30.",
        explanation: "«Quattordici e trenta» si scrive 14:30 (due e mezza del pomeriggio)."
      },
      {
        id: "nm_it_2", lv: 1, kind: "price", pic: "🥖",
        prompt: "Alla panetteria il conto è: «Dodici euro e quaranta centesimi».",
        spoken: "Dodici euro e quaranta centesimi.",
        cue: "Euro prima della virgola (12), centesimi dopo (,40).",
        opts: ["€ 12,40", "€ 21,40", "€ 12,04"],
        ans: 0,
        foilTypes: ["target", "transposition", "magnitude"],
        fullSentence: "Il totale in panetteria è € 12,40.",
        explanation: "Dodici euro e quaranta centesimi corrisponde a € 12,40."
      },
      {
        id: "nm_it_3", lv: 1, kind: "dosage", pic: "💊",
        prompt: "Sulla ricetta c'è scritto: «Una compressa ogni dodici ore per sette giorni».",
        spoken: "Una compressa ogni dodici ore per sette giorni.",
        cue: "1 compressa alla volta, intervallo di 12 ore (due volte al giorno).",
        opts: ["2 compresse / 12 giorni", "1 compressa / 24 ore", "1 compressa / 12 ore (× 7 gg)"],
        ans: 2,
        foilTypes: ["transposition", "magnitude", "target"],
        fullSentence: "Terapia: 1 compressa ogni 12 ore per 7 giorni.",
        explanation: "Ogni 12 ore significa due assunzioni al giorno, una compressa alla volta, per 7 giorni."
      },
      {
        id: "nm_it_4", lv: 1, kind: "price", pic: "🧾",
        prompt: "In farmacia dicono: «Sono sedici euro e cinquanta».",
        spoken: "Sono sedici euro e cinquanta.",
        cue: "Sedici = 16 (non 60 o 17); cinquanta = ,50.",
        opts: ["€ 60,50", "€ 16,50", "€ 16,15"],
        ans: 1,
        foilTypes: ["magnitude", "target", "transposition"],
        fullSentence: "In farmacia il totale è € 16,50.",
        explanation: "Sedici euro e cinquanta si scrive € 16,50."
      },

      /* Level 2 — Everyday mid-complexity */
      {
        id: "nm_it_5", lv: 2, kind: "time", pic: "🚌",
        prompt: "L'autobus passa alle «nove e un quarto di mattina».",
        spoken: "L'autobus passa alle nove e un quarto di mattina.",
        cue: "Un quarto d'ora sono 15 minuti dopo le 9.",
        opts: ["09:15", "09:45", "19:15"],
        ans: 0,
        foilTypes: ["target", "transposition", "magnitude"],
        fullSentence: "L'autobus parte alle 09:15.",
        explanation: "Le nove e un quarto di mattina sono le 09:15."
      },
      {
        id: "nm_it_6", lv: 2, kind: "price", pic: "☕",
        prompt: "Al bar paghi un caffè e una brioche: «Tre euro e venti».",
        spoken: "Tre euro e venti.",
        cue: "3 euro interi + 20 centesimi.",
        opts: ["€ 3,02", "€ 2,30", "€ 3,20"],
        ans: 2,
        foilTypes: ["magnitude", "transposition", "target"],
        fullSentence: "Al bar il totale è € 3,20.",
        explanation: "Tre euro e venti si scrive € 3,20."
      },
      {
        id: "nm_it_7", lv: 2, kind: "dosage", pic: "📅",
        prompt: "Il dottore ti aspetta il «quindici del mese, stanza quattro».",
        spoken: "Il quindici del mese, stanza quattro.",
        cue: "Giorno 15 · numero stanza 4.",
        opts: ["Giorno 15 · Stanza 4", "Giorno 14 · Stanza 5", "Giorno 5 · Stanza 14"],
        ans: 0,
        foilTypes: ["target", "transposition", "magnitude"],
        fullSentence: "Controllo fissato il giorno 15 nella stanza 4.",
        explanation: "Data e stanza restano distinte: giorno 15, stanza 4."
      },
      {
        id: "nm_it_8", lv: 2, kind: "time", pic: "🕒",
        prompt: "Ci vediamo «alle cinque meno un quarto del pomeriggio».",
        spoken: "Alle cinque meno un quarto del pomeriggio.",
        cue: "Meno un quarto significa 15 minuti prima delle 17:00 (:45).",
        opts: ["17:15", "16:45", "05:45"],
        ans: 1,
        foilTypes: ["transposition", "target", "magnitude"],
        fullSentence: "Appuntamento alle 16:45.",
        explanation: "Le cinque meno un quarto del pomeriggio corrispondono alle 16:45."
      },

      /* Level 3 — High-frequency concrete anchors */
      {
        id: "nm_it_9", lv: 3, kind: "price", pic: "🍎",
        prompt: "Le mele al mercato costano «due euro e cinquanta».",
        spoken: "Due euro e cinquanta.",
        cue: "2 euro e mezzo = € 2,50.",
        opts: ["€ 2,50", "€ 5,20", "€ 25,00"],
        ans: 0,
        foilTypes: ["target", "transposition", "magnitude"],
        fullSentence: "Le mele costano € 2,50.",
        explanation: "Due euro e cinquanta centesimi è € 2,50."
      },
      {
        id: "nm_it_10", lv: 3, kind: "time", pic: "☀️",
        prompt: "La passeggiata è «alle dieci in punto di mattina».",
        spoken: "Alle dieci in punto di mattina.",
        cue: "Dieci in punto = :00 di mattina.",
        opts: ["10:30", "22:00", "10:00"],
        ans: 2,
        foilTypes: ["transposition", "magnitude", "target"],
        fullSentence: "La passeggiata inizia alle 10:00.",
        explanation: "Le dieci in punto di mattina sono le 10:00."
      },
      {
        id: "nm_it_11", lv: 3, kind: "dosage", pic: "💧",
        prompt: "Prendi la pastiglia con «due bicchieri d'acqua prima di cena».",
        spoken: "Due bicchieri d'acqua.",
        cue: "Quantità semplice: numero 2.",
        opts: ["2 bicchieri", "12 bicchieri", "½ bicchiere"],
        ans: 0,
        foilTypes: ["target", "magnitude", "transposition"],
        fullSentence: "Bevi 2 bicchieri d'acqua.",
        explanation: "La quantità indicata è 2 bicchieri."
      },
      {
        id: "nm_it_12", lv: 3, kind: "dosage", pic: "☎️",
        prompt: "L'interno telefonico dell'ambulatorio è «venticinque».",
        spoken: "Interno venticinque.",
        cue: "Due cifre: prima il 2 (venti), poi il 5 (cinque).",
        opts: ["52", "25", "205"],
        ans: 1,
        foilTypes: ["transposition", "target", "magnitude"],
        fullSentence: "L'interno telefonico è 25.",
        explanation: "Venticinque si scrive con il 2 davanti al 5: 25."
      }
    ],

    en: [
      /* Level 1 */
      {
        id: "nm_en_1", lv: 1, kind: "time", pic: "🩺",
        prompt: "The reception desk says: “Your clinic visit is at half past two in the afternoon.”",
        spoken: "Your clinic visit is at half past two in the afternoon.",
        cue: "Afternoon uses 14 (2 PM); half past = :30.",
        opts: ["13:30", "14:30", "14:02"],
        ans: 1,
        foilTypes: ["transposition", "target", "magnitude"],
        fullSentence: "Clinic appointment confirmed for 14:30.",
        explanation: "Half past two in the afternoon is 14:30 (2:30 PM)."
      },
      {
        id: "nm_en_2", lv: 1, kind: "price", pic: "🥖",
        prompt: "At the bakery the total is: “Twelve pounds and forty pence.”",
        spoken: "Twelve pounds and forty pence.",
        cue: "Whole pounds first (£12), pence after the dot (.40).",
        opts: ["£12.40", "£21.40", "£12.04"],
        ans: 0,
        foilTypes: ["target", "transposition", "magnitude"],
        fullSentence: "Your bakery total is £12.40.",
        explanation: "Twelve pounds and forty pence is written £12.40."
      },
      {
        id: "nm_en_3", lv: 1, kind: "dosage", pic: "💊",
        prompt: "The pharmacy label reads: “Take one tablet every twelve hours for seven days.”",
        spoken: "Take one tablet every twelve hours for seven days.",
        cue: "1 tablet per dose, spaced 12 hours apart.",
        opts: ["2 tablets / 12 days", "1 tablet / 24 hours", "1 tablet / 12 hours (7 days)"],
        ans: 2,
        foilTypes: ["transposition", "magnitude", "target"],
        fullSentence: "Schedule: 1 tablet every 12 hours for 7 days.",
        explanation: "Every 12 hours means one tablet twice a day for 7 days."
      },
      {
        id: "nm_en_4", lv: 1, kind: "price", pic: "🧾",
        prompt: "The chemist says: “That comes to sixteen pounds fifty, please.”",
        spoken: "That comes to sixteen pounds fifty, please.",
        cue: "Sixteen is 16 (not 60); fifty pence is .50.",
        opts: ["£60.50", "£16.50", "£16.15"],
        ans: 1,
        foilTypes: ["magnitude", "target", "transposition"],
        fullSentence: "Your chemist bill is £16.50.",
        explanation: "Sixteen pounds fifty is £16.50."
      },

      /* Level 2 */
      {
        id: "nm_en_5", lv: 2, kind: "time", pic: "🚌",
        prompt: "The bus arrives at “quarter past nine in the morning.”",
        spoken: "Quarter past nine in the morning.",
        cue: "Quarter past = 15 minutes after 9 in the morning.",
        opts: ["09:15", "09:45", "21:15"],
        ans: 0,
        foilTypes: ["target", "transposition", "magnitude"],
        fullSentence: "The morning bus arrives at 09:15.",
        explanation: "Quarter past nine in the morning is 09:15."
      },
      {
        id: "nm_en_6", lv: 2, kind: "price", pic: "☕",
        prompt: "At the café, a tea and scone come to “Three pounds twenty.”",
        spoken: "Three pounds twenty.",
        cue: "3 whole pounds plus 20 pence.",
        opts: ["£3.02", "£2.30", "£3.20"],
        ans: 2,
        foilTypes: ["magnitude", "transposition", "target"],
        fullSentence: "The café total is £3.20.",
        explanation: "Three pounds twenty pence is £3.20."
      },
      {
        id: "nm_en_7", lv: 2, kind: "dosage", pic: "📅",
        prompt: "The nurse says: “Come back on the fifteenth, room number four.”",
        spoken: "Come back on the fifteenth, room number four.",
        cue: "Date = day 15 · Room = 4.",
        opts: ["Day 15 · Room 4", "Day 14 · Room 5", "Day 5 · Room 14"],
        ans: 0,
        foilTypes: ["target", "transposition", "magnitude"],
        fullSentence: "Follow-up on day 15 in room 4.",
        explanation: "The date is the 15th and the room number is 4."
      },
      {
        id: "nm_en_8", lv: 2, kind: "time", pic: "🕒",
        prompt: "Let’s meet at “quarter to five in the afternoon.”",
        spoken: "Quarter to five in the afternoon.",
        cue: "15 minutes before 17:00 means :45.",
        opts: ["17:15", "16:45", "04:45"],
        ans: 1,
        foilTypes: ["transposition", "target", "magnitude"],
        fullSentence: "Meeting set for 16:45.",
        explanation: "Quarter to five in the afternoon is 16:45 (4:45 PM)."
      },

      /* Level 3 */
      {
        id: "nm_en_9", lv: 3, kind: "price", pic: "🍎",
        prompt: "A bag of apples at the market costs “two pounds fifty.”",
        spoken: "Two pounds fifty.",
        cue: "2 pounds and half a pound = £2.50.",
        opts: ["£2.50", "£5.20", "£25.00"],
        ans: 0,
        foilTypes: ["target", "transposition", "magnitude"],
        fullSentence: "The apples cost £2.50.",
        explanation: "Two pounds and fifty pence is written £2.50."
      },
      {
        id: "nm_en_10", lv: 3, kind: "time", pic: "☀️",
        prompt: "Your morning walk starts at “ten o’clock sharp.”",
        spoken: "Ten o'clock in the morning.",
        cue: "Morning hour 10 with zero minutes (:00).",
        opts: ["10:30", "22:00", "10:00"],
        ans: 2,
        foilTypes: ["transposition", "magnitude", "target"],
        fullSentence: "Your morning walk begins at 10:00.",
        explanation: "Ten o’clock in the morning is 10:00."
      },
      {
        id: "nm_en_11", lv: 3, kind: "dosage", pic: "💧",
        prompt: "Drink “two full glasses of water” with breakfast.",
        spoken: "Two glasses of water.",
        cue: "Simple count: 2.",
        opts: ["2 glasses", "12 glasses", "½ glass"],
        ans: 0,
        foilTypes: ["target", "magnitude", "transposition"],
        fullSentence: "Drink 2 glasses of water.",
        explanation: "Two glasses of water matches 2."
      },
      {
        id: "nm_en_12", lv: 3, kind: "dosage", pic: "☎️",
        prompt: "The clinic telephone extension is “twenty-five.”",
        spoken: "Extension twenty-five.",
        cue: "2 in the tens place, then 5: 25.",
        opts: ["52", "25", "205"],
        ans: 1,
        foilTypes: ["transposition", "target", "magnitude"],
        fullSentence: "Telephone extension is 25.",
        explanation: "Twenty-five puts 2 before 5: 25."
      }
    ]
  };
})();
