/*
 * Bilingual Surface Dyslexia & Homophone Reading Bank ("Lettura di parole difficili e omofoni").
 * Specifically targets Semantic Variant PPA (svPPA) semantic-to-orthography mapping:
 *   - "exception": irregular / exception orthography prone to phonetic regularization
 *   - "homophone": context-dependent homophones / apostrophe contractions sharing sound
 *
 * Levels: 1 = subtle exception/homophone contrasts, 3 = high-frequency daily contrasts.
 */
(function () {
  "use strict";
  var POG = window.POG = window.POG || {};
  POG.content = POG.content || {};

  POG.content.SURFACE = {
    it: [
      {
        id: "sf_it_1", lv: 1, kind: "homophone", icon: "🪡",
        prompt: "Scegli la parola giusta per cucire.",
        sentence: "Prendo _____ e il filo per sistemare il bottone.",
        targetWord: "l'ago",
        opts: ["l'ago", "lago", "la go"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Serve l'oggetto piccolo e appuntito con l'articolo davanti («l'»).",
        fullSentence: "Prendo l'ago e il filo per sistemare il bottone."
      },
      {
        id: "sf_it_2", lv: 1, kind: "homophone", icon: "👥",
        prompt: "Quale parola indica il verbo avere?",
        sentence: "I nostri vicini _____ comprato una casa in collina.",
        targetWord: "hanno",
        opts: ["hanno", "anno", "anno'"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Quando significa «possedere» o accompagna un verbo passato si scrive con la H.",
        fullSentence: "I nostri vicini hanno comprato una casa in collina."
      },
      {
        id: "sf_it_3", lv: 1, kind: "exception", icon: "🔬",
        prompt: "Scegli la grafia corretta della materia di studio.",
        sentence: "Domani guardiamo un documentario di _____ in televisione.",
        targetWord: "scienza",
        opts: ["scienza", "sienza", "scenza"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "In questa parola si mantiene la «i» muta dopo «sc»: sc-i-e-n-z-a.",
        fullSentence: "Domani guardiamo un documentario di scienza in televisione."
      },
      {
        id: "sf_it_4", lv: 1, kind: "exception", icon: "🩺",
        prompt: "Qual è la grafia corretta dello specialista?",
        sentence: "Giovedì mattina ho un colloquio con lo _____.",
        targetWord: "psicologo",
        opts: ["psicologo", "sicologo", "piscicologo"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Comincia con le due lettere «ps» insieme.",
        fullSentence: "Giovedì mattina ho un colloquio con lo psicologo."
      },
      {
        id: "sf_it_5", lv: 2, kind: "homophone", icon: "☀️",
        prompt: "Completa la storia con il verbo corretto.",
        sentence: "Stamattina presto _____ già molta luce in cucina.",
        targetWord: "c'era",
        opts: ["c'era", "cera", "ciera"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Significa «esisteva / stava lì», non la cera delle candele.",
        fullSentence: "Stamattina presto c'era già molta luce in cucina."
      },
      {
        id: "sf_it_6", lv: 2, kind: "homophone", icon: "🤝",
        prompt: "Quale forma significa «offre / porge»?",
        sentence: "Il vicino di casa ci _____ sempre una mano con la spesa.",
        targetWord: "dà",
        opts: ["dà", "da", "da'"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Il verbo «dare» alla terza persona porta l'accento sulla a (dà).",
        fullSentence: "Il vicino di casa ci dà sempre una mano con la spesa."
      },
      {
        id: "sf_it_7", lv: 2, kind: "exception", icon: "🍝",
        prompt: "Scegli il nome giusto del piatto.",
        sentence: "A pranzo prepariamo gli _____ di patate al pomodoro.",
        targetWord: "gnocchi",
        opts: ["gnocchi", "niocchi", "gnochi"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Inizia con «gn» e ha due «c» con la «h» (gnocchi).",
        fullSentence: "A pranzo prepariamo gli gnocchi di patate al pomodoro."
      },
      {
        id: "sf_it_8", lv: 2, kind: "exception", icon: "🥄",
        prompt: "Scegli la parola scritta correttamente.",
        sentence: "Appoggia il _____ accanto alla tazza del latte.",
        targetWord: "cucchiaio",
        opts: ["cucchiaio", "cucciaio", "cuchiaio"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Dopo le due «c» serve «ch» per mantenere il suono duro.",
        fullSentence: "Appoggia il cucchiaio accanto alla tazza del latte."
      },
      {
        id: "sf_it_9", lv: 3, kind: "homophone", icon: "🍵",
        prompt: "Completa con il verbo essere.",
        sentence: "La tazza di tè verde _____ ancora molto calda.",
        targetWord: "è",
        opts: ["è", "e", "eh"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Indica come è la tazza (verbo essere con accento).",
        fullSentence: "La tazza di tè verde è ancora molto calda."
      },
      {
        id: "sf_it_10", lv: 3, kind: "homophone", icon: "✅",
        prompt: "Scegli la risposta affermativa scritta giusta.",
        sentence: "_____ , prendo volentieri un bicchiere d'acqua.",
        targetWord: "Sì",
        opts: ["Sì", "Si", "Sii"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Quando significa «certo / affermativo» vuole l'accento sulla ì.",
        fullSentence: "Sì , prendo volentieri un bicchiere d'acqua."
      },
      {
        id: "sf_it_11", lv: 3, kind: "exception", icon: "💧",
        prompt: "Scegli la parola quotidiana scritta bene.",
        sentence: "Riempi la caraffa con _____ fresca del rubinetto.",
        targetWord: "acqua",
        opts: ["acqua", "aqua", "acua"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Si scrive sempre con «cq»: a-c-q-u-a.",
        fullSentence: "Riempi la caraffa con acqua fresca del rubinetto."
      },
      {
        id: "sf_it_12", lv: 3, kind: "exception", icon: "👨‍👩‍👧‍👦",
        prompt: "Quale grafia corrisponde al gruppo di parenti?",
        sentence: "La domenica tutta la _____ pranza insieme in giardino.",
        targetWord: "famiglia",
        opts: ["famiglia", "familgia", "famillia"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Il suono dolce si scrive con «gli».",
        fullSentence: "La domenica tutta la famiglia pranza insieme in giardino."
      }
    ],
    en: [
      {
        id: "sf_en_1", lv: 1, kind: "exception", icon: "⛵",
        prompt: "Pick the real spelling of this sailing boat.",
        sentence: "We watched a white _____ cross the quiet harbour.",
        targetWord: "yacht",
        opts: ["yacht", "yot", "yatch"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "This boat word has silent «ch» in the middle.",
        fullSentence: "We watched a white yacht cross the quiet harbour."
      },
      {
        id: "sf_en_2", lv: 1, kind: "exception", icon: "🎖️",
        prompt: "Pick the senior army officer title.",
        sentence: "Uncle Arthur served as a _____ before retiring.",
        targetWord: "colonel",
        opts: ["colonel", "kernel", "colnel"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Sounds like «kernel», but starts with «colo-».",
        fullSentence: "Uncle Arthur served as a colonel before retiring."
      },
      {
        id: "sf_en_3", lv: 1, kind: "homophone", icon: "🛡️",
        prompt: "Choose the medieval soldier on horseback.",
        sentence: "The stone statue shows a _____ holding a shield.",
        targetWord: "knight",
        opts: ["knight", "night", "nite"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Starts with a silent «k» (not the dark part of the day).",
        fullSentence: "The stone statue shows a knight holding a shield."
      },
      {
        id: "sf_en_4", lv: 1, kind: "exception", icon: "🧾",
        prompt: "Pick the paper slip you get after paying.",
        sentence: "Keep the shop _____ inside your coat pocket.",
        targetWord: "receipt",
        opts: ["receipt", "resit", "recete"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Includes a silent «p» near the end: -ceipt.",
        fullSentence: "Keep the shop receipt inside your coat pocket."
      },
      {
        id: "sf_en_5", lv: 2, kind: "homophone", icon: "🌾",
        prompt: "Choose the ingredient used for baking bread.",
        sentence: "Measure two cups of plain _____ into the bowl.",
        targetWord: "flour",
        opts: ["flour", "flower", "flar"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "For baking (not the blossom growing in the garden).",
        fullSentence: "Measure two cups of plain flour into the bowl."
      },
      {
        id: "sf_en_6", lv: 2, kind: "homophone", icon: "✍️",
        prompt: "Pick the word meaning to put words on paper.",
        sentence: "Please _____ your appointment time in the diary.",
        targetWord: "write",
        opts: ["write", "right", "rite"], ans: 0,
        foilTypes: ["ok", "homophone", "homophone"],
        clue: "Starts with silent «w» when it means using a pen.",
        fullSentence: "Please write your appointment time in the diary."
      },
      {
        id: "sf_en_7", lv: 2, kind: "exception", icon: "🏝️",
        prompt: "Choose the correct spelling of land surrounded by sea.",
        sentence: "We took the morning ferry over to the small _____.",
        targetWord: "island",
        opts: ["island", "iland", "izland"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Contains a silent «s» right after «i».",
        fullSentence: "We took the morning ferry over to the small island."
      },
      {
        id: "sf_en_8", lv: 2, kind: "exception", icon: "🚶",
        prompt: "Pick the word for a line of waiting people.",
        sentence: "There was only a short _____ at the pharmacy counter.",
        targetWord: "queue",
        opts: ["queue", "kyoo", "quew"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Starts with «q» followed by «u-e-u-e».",
        fullSentence: "There was only a short queue at the pharmacy counter."
      },
      {
        id: "sf_en_9", lv: 3, kind: "homophone", icon: "🧠",
        prompt: "Choose the word meaning «recognise / remember».",
        sentence: "I _____ where I left my reading glasses.",
        targetWord: "know",
        opts: ["know", "no", "now"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Starts with silent «k» when talking about knowledge.",
        fullSentence: "I know where I left my reading glasses."
      },
      {
        id: "sf_en_10", lv: 3, kind: "homophone", icon: "✌️",
        prompt: "Choose the number word for 2.",
        sentence: "Could I have _____ sugars in my tea, please?",
        targetWord: "two",
        opts: ["two", "too", "to"], ans: 0,
        foilTypes: ["ok", "homophone", "homophone"],
        clue: "The number 2 is spelled with a «w» in the middle.",
        fullSentence: "Could I have two sugars in my tea, please?"
      },
      {
        id: "sf_en_11", lv: 3, kind: "exception", icon: "🌊",
        prompt: "Pick the word meaning peaceful and unhurried.",
        sentence: "Take a deep breath and keep the room _____.",
        targetWord: "calm",
        opts: ["calm", "carm", "caum"], ans: 0,
        foilTypes: ["ok", "regularized", "regularized"],
        clue: "Has a silent «l» before the «m».",
        fullSentence: "Take a deep breath and keep the room calm."
      },
      {
        id: "sf_en_12", lv: 3, kind: "homophone", icon: "👂",
        prompt: "Pick the word meaning «to perceive sound».",
        sentence: "Sit closer so you can _____ every word clearly.",
        targetWord: "hear",
        opts: ["hear", "here", "heer"], ans: 0,
        foilTypes: ["ok", "homophone", "regularized"],
        clue: "Has the word «ear» tucked inside it.",
        fullSentence: "Sit closer so you can hear every word clearly."
      }
    ]
  };
})();
