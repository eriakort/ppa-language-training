/*
 * Core functional word preservation bank for Primary Progressive Aphasia (IT & EN).
 * Each item provides structured Semantic Feature Analysis (SFA) cues and
 * Phonemic Component Analysis (PCA) cues for spaced-retrieval lexical maintenance.
 */
(function () {
  "use strict";
  window.POG = window.POG || {};
  window.POG.content = window.POG.content || {};

  window.POG.content.WORDBANK = [
    {
      id: "wb1", cat: "health", pic: "💊",
      it: { w: "medicina", alts: ["compressa", "pastiglia", "pillola"], sfa: ["Si prende con acqua per stare meglio", "Si trova in farmacia o sul comodino", "Aiuta a curare dolore, febbre o pressione"], pca: { syl: "me · di · ci · na", first: "ME", rhyme: "cucina", len: 8 } },
      en: { w: "medicine", alts: ["pill", "tablet"], sfa: ["You take it with water to feel better", "Kept in a cabinet or bought at a pharmacy", "Prescribed by a doctor for daily care"], pca: { syl: "me · di · cine", first: "ME", rhyme: "routine", len: 8 } }
    },
    {
      id: "wb2", cat: "home", pic: "🔑",
      it: { w: "chiave", alts: ["chiavi"], sfa: ["Serve per aprire e chiudere la porta di casa", "Si tiene in tasca, in borsa o sul mobile d'ingresso", "Fatta di metallo, con i denti su un lato"], pca: { syl: "chia · ve", first: "CHIA", rhyme: "nave", len: 6 } },
      en: { w: "key", alts: ["keys"], sfa: ["Used to lock and unlock a door", "Kept in a pocket, bag, or near the hallway", "Made of metal and goes on a ring"], pca: { syl: "key", first: "KE", rhyme: "tea", len: 3 } }
    },
    {
      id: "wb3", cat: "health", pic: "👓",
      it: { w: "occhiali", alts: ["occhiale"], sfa: ["Si mettono sul naso per leggere o vedere lontano", "Hanno due lenti e stanno nella custodia", "Utili per leggere giornali e messaggi"], pca: { syl: "oc · chia · li", first: "OC", rhyme: "stivali", len: 8 } },
      en: { w: "glasses", alts: ["spectacles"], sfa: ["Worn over the eyes to read or see clearly", "Has two lenses resting on the nose", "Kept inside a hard case on a table"], pca: { syl: "glas · ses", first: "GLA", rhyme: "classes", len: 7 } }
    },
    {
      id: "wb4", cat: "tools", pic: "📱",
      it: { w: "telefono", alts: ["cellulare"], sfa: ["Serve per chiamare familiari o mandare messaggi", "Squilla o vibra e si ricarica con un cavo", "Si porta in borsa o in tasca uscendo"], pca: { syl: "te · le · fo · no", first: "TE", rhyme: "suono", len: 8 } },
      en: { w: "phone", alts: ["telephone", "mobile"], sfa: ["Used to call family or read messages", "Rings or chimes and charges with a cable", "Carried in a pocket or kept on a desk"], pca: { syl: "phone", first: "PHO", rhyme: "stone", len: 5 } }
    },
    {
      id: "wb5", cat: "food", pic: "☕",
      it: { w: "caffè", alts: ["espresso"], sfa: ["Bevanda calda e scura che si beve al mattino", "Si serve in una tazzina con o senza zucchero", "Ha un profumo intenso appena fatto"], pca: { syl: "caf · fè", first: "CA", rhyme: "tè", len: 5 } },
      en: { w: "coffee", alts: [], sfa: ["A warm dark drink often served in the morning", "Poured into a mug or cup, sometimes with milk", "Roasted beans give it a strong aroma"], pca: { syl: "cof · fee", first: "CO", rhyme: "toffee", len: 6 } }
    },
    {
      id: "wb6", cat: "food", pic: "🍞",
      it: { w: "pane", alts: ["panino", "fetta"], sfa: ["Alimento di base con crosta fuori e mollica dentro", "Si compra dal fornaio o al supermercato", "Sta in tavola a pranzo e a colazione"], pca: { syl: "pa · ne", first: "PA", rhyme: "cane", len: 4 } },
      en: { w: "bread", alts: ["loaf", "toast"], sfa: ["A baked staple food made from flour and water", "Bought at a bakery and sliced for toast", "Used to make sandwiches at lunch"], pca: { syl: "bread", first: "BRE", rhyme: "red", len: 5 } }
    },
    {
      id: "wb7", cat: "health", pic: "🩺",
      it: { w: "dottore", alts: ["medico"], sfa: ["Professionista che visita e controlla la salute", "Lavora in ambulatorio o in ospedale", "Prescrive esami e terapie"], pca: { syl: "dot · to · re", first: "DO", rhyme: "cuore", len: 7 } },
      en: { w: "doctor", alts: ["physician"], sfa: ["A medical professional you visit for check-ups", "Works in a clinic or hospital", "Listens with a stethoscope and gives advice"], pca: { syl: "doc · tor", first: "DO", rhyme: "motor", len: 6 } }
    },
    {
      id: "wb8", cat: "outdoors", pic: "☂️",
      it: { w: "ombrello", alts: [], sfa: ["Si apre sopra la testa per ripararsi dalla pioggia", "Si lascia vicino alla porta quando si entra", "Ha un manico ricurvo e un tessuto impermeabile"], pca: { syl: "om · brel · lo", first: "OM", rhyme: "cappello", len: 8 } },
      en: { w: "umbrella", alts: [], sfa: ["Held overhead to stay dry in the rain", "Stands by the front door when closed", "Opens up with metal ribs and a handle"], pca: { syl: "um · brel · la", first: "UM", rhyme: "vanilla", len: 8 } }
    },
    {
      id: "wb9", cat: "tools", pic: "🕰️",
      it: { w: "orologio", alts: ["sveglia"], sfa: ["Indica che ore sono durante la giornata", "Ha le lancette o i numeri sul quadrante", "Si porta al polso o sta sul muro di casa"], pca: { syl: "o · ro · lo · gio", first: "O", rhyme: "rifugio", len: 8 } },
      en: { w: "clock", alts: ["watch"], sfa: ["Shows the hours and minutes of the day", "Hangs on a wall or sits on a bedside table", "Has a round face with moving hands"], pca: { syl: "clock", first: "CLO", rhyme: "lock", len: 5 } }
    },
    {
      id: "wb10", cat: "home", pic: "🪑",
      it: { w: "sedia", alts: ["poltrona"], sfa: ["Mobile con quattro gambe e uno schienale per sedersi", "Sta intorno al tavolo in cucina o in sala", "Fatta di legno, metallo o paglia"], pca: { syl: "se · dia", first: "SE", rhyme: "media", len: 5 } },
      en: { w: "chair", alts: ["seat", "armchair"], sfa: ["Furniture with four legs and a backrest for sitting", "Placed around the dining table or in the lounge", "Made from wood or padded fabric"], pca: { syl: "chair", first: "CHAI", rhyme: "stair", len: 5 } }
    },
    {
      id: "wb11", cat: "food", pic: "🍎",
      it: { w: "mela", alts: ["frutto"], sfa: ["Frutto croccante con la buccia rossa, gialla o verde", "Cresce sugli alberi e sta nel cesto della frutta", "Si può mangiare cruda o cotta nel dolce"], pca: { syl: "me · la", first: "ME", rhyme: "candela", len: 4 } },
      en: { w: "apple", alts: ["fruit"], sfa: ["A crisp round fruit with red or green skin", "Grows on orchard trees and sits in a fruit bowl", "Eaten fresh as a snack or baked in pies"], pca: { syl: "ap · ple", first: "AP", rhyme: "chapel", len: 5 } }
    },
    {
      id: "wb12", cat: "tools", pic: "👛",
      it: { w: "portafoglio", alts: ["borsellino"], sfa: ["Tiene i contanti, le carte e i documenti", "Sta in tasca o in borsa quando si esce a fare la spesa", "Si apre alla cassa per pagare"], pca: { syl: "por · ta · fo · glio", first: "POR", rhyme: "foglio", len: 11 } },
      en: { w: "wallet", alts: ["purse"], sfa: ["Holds banknotes, coins, and bank cards", "Carried inside a coat pocket or handbag", "Taken out at the shop counter to pay"], pca: { syl: "wal · let", first: "WA", rhyme: "pallet", len: 6 } }
    },
    {
      id: "wb13", cat: "outdoors", pic: "🚌",
      it: { w: "autobus", alts: ["bus", "pullman"], sfa: ["Mezzo pubblico che porta più passeggeri in città", "Si aspetta alla fermata con la palina degli orari", "Si sale mostrando il biglietto o l'abbonamento"], pca: { syl: "au · to · bus", first: "AU", rhyme: "campus", len: 7 } },
      en: { w: "bus", alts: ["coach"], sfa: ["Large public vehicle that carries passengers along streets", "You wait for it at a marked stop with a timetable", "You tap a travel card when boarding"], pca: { syl: "bus", first: "BU", rhyme: "plus", len: 3 } }
    },
    {
      id: "wb14", cat: "people", pic: "👨‍👩‍👧",
      it: { w: "famiglia", alts: ["parenti"], sfa: ["Le persone più vicine con cui si condivide la casa e l'affetto", "Comprende figli, nipoti, fratelli o coniuge", "Si ritrova spesso nei pranzi della domenica"], pca: { syl: "fa · mi · glia", first: "FA", rhyme: "conchiglia", len: 8 } },
      en: { w: "family", alts: ["relatives"], sfa: ["Your closest loved ones related by blood or marriage", "Includes partners, children, or grandchildren", "Gathers together for birthdays and meals"], pca: { syl: "fam · i · ly", first: "FA", rhyme: "happily", len: 6 } }
    },
    {
      id: "wb15", cat: "home", pic: "🛏️",
      it: { w: "letto", alts: ["cuscino"], sfa: ["Mobile morbido con materasso, lenzuola e coperta", "Sta in camera e serve per dormire e riposare", "Ha un cuscino su cui appoggiare la testa"], pca: { syl: "let · to", first: "LE", rhyme: "tetto", len: 5 } },
      en: { w: "bed", alts: ["mattress"], sfa: ["Soft furniture with sheets, a blanket, and pillows", "Sits in the bedroom for sleeping and resting", "Made neatly each morning"], pca: { syl: "bed", first: "BE", rhyme: "head", len: 3 } }
    },
    {
      id: "wb16", cat: "outdoors", pic: "🌸",
      it: { w: "giardino", alts: ["parco", "aiuola"], sfa: ["Spazio verde all'aperto con erba, fiori e alberi", "Si esce lì per prendere aria e annaffiare le piante", "Si sente il canto degli uccelli al mattino"], pca: { syl: "giar · di · no", first: "GIAR", rhyme: "mattino", len: 8 } },
      en: { w: "garden", alts: ["yard", "park"], sfa: ["An outdoor green space with flowers, grass, and trees", "Watered with a can in warm weather", "A peaceful place to sit and hear birds"], pca: { syl: "gar · den", first: "GA", rhyme: "pardon", len: 6 } }
    },
    {
      id: "wb17", cat: "food", pic: "💧",
      it: { w: "acqua", alts: ["bicchiere"], sfa: ["Liquido trasparente essenziale per dissetarsi", "Esce dal rubinetto o si versa dalla bottiglia", "Fresca, naturale o frizzante a tavola"], pca: { syl: "ac · qua", first: "AC", rhyme: "pasqua", len: 5 } },
      en: { w: "water", alts: ["drink"], sfa: ["Clear liquid you drink every day to stay hydrated", "Poured from a tap or bottle into a glass", "Used for tea, washing, and watering plants"], pca: { syl: "wa · ter", first: "WA", rhyme: "daughter", len: 5 } }
    },
    {
      id: "wb18", cat: "tools", pic: "📅",
      it: { w: "calendario", alts: ["agenda"], sfa: ["Mostra i giorni, le settimane e i mesi dell'anno", "Si appende al muro o sta sul tavolo per segnare gli appuntamenti", "Aiuta a ricordare visite mediche e compleanni"], pca: { syl: "ca · len · da · rio", first: "CA", rhyme: "orario", len: 10 } },
      en: { w: "calendar", alts: ["planner", "diary"], sfa: ["Shows every day, week, and month of the year", "Hangs on a wall or sits on a counter to mark appointments", "Helps keep track of clinic visits and birthdays"], pca: { syl: "cal · en · dar", first: "CA", rhyme: "cylinder", len: 8 } }
    }
  ];
})();
