/*
 * Bilingual Compensatory Circumlocution & Word-Finding Bridges Bank
 * ("Aggirare la parola / Word-finding bridges").
 *
 * When word retrieval blocks ("on the tip of the tongue"), PPA speakers communicate reliably
 * by combining category, functional use, and salient visual features—plus optional initial-sound cues.
 *
 * Levels: 1 = subtle multi-syllable/low-frequency nouns, 2 = medium daily objects, 3 = high-frequency core items.
 * Notice every item keeps two valid functional/attribute clues (ok: true) and two unrelated foils (ok: false).
 */
(function () {
  "use strict";
  var POG = window.POG = window.POG || {};
  POG.content = POG.content || {};

  POG.content.CIRCUMLOCUTION = {
    it: [
      /* Level 1 */
      {
        id: "cr_it_1", lv: 1, icon: "🌡️",
        targetWord: "termometro",
        category: "Strumento medico",
        firstSound: "ter-mo...",
        clues: [
          { text: "Misura la febbre o la temperatura", ok: true },
          { text: "Si mette sotto il braccio o sulla fronte", ok: true },
          { text: "Serve per tagliare la carta", ok: false },
          { text: "Si appende alla parete per i vestiti", ok: false }
        ],
        bridgeSentence: "È uno strumento medico che misura la febbre sulla fronte o sotto il braccio.",
        explanation: "Ottimo giro di parole: uso e posizione fanno capire subito di cosa parli."
      },
      {
        id: "cr_it_2", lv: 1, icon: "🧭",
        targetWord: "bussola",
        category: "Oggetto per orientarsi",
        firstSound: "bus-so...",
        clues: [
          { text: "Indica sempre dove si trova il nord", ok: true },
          { text: "Ha un ago magnetico che gira sotto il vetro", ok: true },
          { text: "Riscalda l'acqua per il tè", ok: false },
          { text: "Si usa per spazzare il pavimento", ok: false }
        ],
        bridgeSentence: "È un piccolo strumento con un ago che indica sempre il nord.",
        explanation: "Funzione e dettaglio visivo guidano subito chi ascolta."
      },
      {
        id: "cr_it_3", lv: 1, icon: "📎",
        targetWord: "graffetta",
        category: "Oggetto da scrivania",
        firstSound: "graf-fet...",
        clues: [
          { text: "Tiene insieme più fogli di carta", ok: true },
          { text: "È un piccolo filo di metallo piegato", ok: true },
          { text: "Serve per mescolare la zuppa", ok: false },
          { text: "Si mette ai piedi prima di uscire", ok: false }
        ],
        bridgeSentence: "È un pezzetto di metallo piegato che tiene insieme i fogli.",
        explanation: "Materiale e azione aiutano a farsi capire anche senza il nome esatto."
      },
      {
        id: "cr_it_4", lv: 1, icon: "🔭",
        targetWord: "binocolo",
        category: "Strumento ottico",
        firstSound: "bi-no...",
        clues: [
          { text: "Fa vedere vicino qualcosa che è lontano", ok: true },
          { text: "Ha due lenti e si appoggia agli occhi", ok: true },
          { text: "Si usa per pesare la farina", ok: false },
          { text: "Apre la serratura del cancello", ok: false }
        ],
        bridgeSentence: "Ha due lenti per guardare agli occhi e avvicina ciò che è lontano.",
        explanation: "Descrivere dove si mette e cosa fa sostituisce bene il nome."
      },

      /* Level 2 */
      {
        id: "cr_it_5", lv: 2, icon: "☂️",
        targetWord: "ombrello",
        category: "Oggetto per uscire",
        firstSound: "om-brel...",
        clues: [
          { text: "Ti protegge dalla pioggia quando esci", ok: true },
          { text: "Si apre sopra la testa con un manico", ok: true },
          { text: "Serve per suonare la musica", ok: false },
          { text: "Sta nel frigorifero con il formaggio", ok: false }
        ],
        bridgeSentence: "Si apre sopra la testa per non bagnarsi quando piove.",
        explanation: "Quando manca il nome, azione e contesto bastano a capirsi."
      },
      {
        id: "cr_it_6", lv: 2, icon: "✂️",
        targetWord: "forbici",
        category: "Attrezzo di casa",
        firstSound: "for-bi...",
        clues: [
          { text: "Servono per tagliare la carta o la stoffa", ok: true },
          { text: "Hanno due lame e due anelli per le dita", ok: true },
          { text: "Servono per lavarsi i capelli", ok: false },
          { text: "Fanno luce sul comodino la notte", ok: false }
        ],
        bridgeSentence: "Hanno due lame e due anelli per tagliare carta o filo.",
        explanation: "Ottimo: forma e azione descrivono esattamente l'oggetto."
      },
      {
        id: "cr_it_7", lv: 2, icon: "🪞",
        targetWord: "specchio",
        category: "Oggetto del bagno",
        firstSound: "spec-chi...",
        clues: [
          { text: "Mostra la tua immagine riflessa", ok: true },
          { text: "Di solito è appeso sopra il lavandino", ok: true },
          { text: "Serve per telefonare ai figli", ok: false },
          { text: "Si mette nel forno per cuocere la torta", ok: false }
        ],
        bridgeSentence: "È appeso sopra il lavandino e riflette il viso mentre ti prepari.",
        explanation: "Dire dove si trova in casa aiuta moltissimo chi ascolta."
      },
      {
        id: "cr_it_8", lv: 2, icon: "🧳",
        targetWord: "valigia",
        category: "Oggetto da viaggio",
        firstSound: "va-li...",
        clues: [
          { text: "Contiene vestiti quando parti per un viaggio", ok: true },
          { text: "Ha una cerniera e spesso le rotelle", ok: true },
          { text: "Serve per scrivere una lettera a mano", ok: false },
          { text: "Si beve calda al mattino", ok: false }
        ],
        bridgeSentence: "È una grande borsa con le rotelle dove metti i vestiti per viaggiare.",
        explanation: "Contesto di utilizzo e parti dell'oggetto comunicano subito il senso."
      },

      /* Level 3 */
      {
        id: "cr_it_9", lv: 3, icon: "🔑",
        targetWord: "chiave",
        category: "Oggetto di tutti i giorni",
        firstSound: "chia...",
        clues: [
          { text: "Apre e chiude la porta di casa", ok: true },
          { text: "È piccola, di metallo, sta in tasca o in borsa", ok: true },
          { text: "Si legge prima di andare a dormire", ok: false },
          { text: "Serve per asciugare i piatti", ok: false }
        ],
        bridgeSentence: "È il piccolo oggetto di metallo che apre la porta di casa.",
        explanation: "Ben fatto: in tasca, di metallo, apre la porta — chiaro per chiunque."
      },
      {
        id: "cr_it_10", lv: 3, icon: "👓",
        targetWord: "occhiali",
        category: "Oggetto personale",
        firstSound: "oc-chia...",
        clues: [
          { text: "Aiutano a vedere meglio da vicino o da lontano", ok: true },
          { text: "Si appoggiano sul naso con due lenti", ok: true },
          { text: "Servono per cucire i bottoni", ok: false },
          { text: "Si mettono in giardino per annaffiare", ok: false }
        ],
        bridgeSentence: "Hanno due lenti sul naso e servono per leggere o vedere meglio.",
        explanation: "Dire dove si appoggiano e a cosa servono sblocca la conversazione."
      },
      {
        id: "cr_it_11", lv: 3, icon: "🥄",
        targetWord: "cucchiaio",
        category: "Posata da tavola",
        firstSound: "cuc-chia...",
        clues: [
          { text: "Si usa per mangiare la minestra o lo yogurt", ok: true },
          { text: "Ha una parte rotonda e concava alla fine", ok: true },
          { text: "Serve per accendere la televisione", ok: false },
          { text: "Si indossa quando fa molto freddo", ok: false }
        ],
        bridgeSentence: "È la posata rotonda usata per prendere la minestra o lo yogurt.",
        explanation: "Ottima descrizione: alimento tipico e forma della posata."
      },
      {
        id: "cr_it_12", lv: 3, icon: "🕰️",
        targetWord: "orologio",
        category: "Oggetto per il tempo",
        firstSound: "o-ro-lo...",
        clues: [
          { text: "Dice che ore sono durante la giornata", ok: true },
          { text: "Ha le lancette o i numeri sul quadrante", ok: true },
          { text: "Serve per lavare le finestre", ok: false },
          { text: "Cresce nell'orto vicino ai pomodori", ok: false }
        ],
        bridgeSentence: "Ha numeri o lancette per mostrare che ore sono.",
        explanation: "Funzione principale e aspetto visivo rendono subito chiaro il concetto."
      }
    ],

    en: [
      /* Level 1 */
      {
        id: "cr_en_1", lv: 1, icon: "🌡️",
        targetWord: "thermometer",
        category: "Medical tool",
        firstSound: "ther-mo...",
        clues: [
          { text: "Checks whether you have a temperature or fever", ok: true },
          { text: "Held on the forehead or under the tongue", ok: true },
          { text: "Used for cutting thick cardboard", ok: false },
          { text: "Hung in a hallway for coats", ok: false }
        ],
        bridgeSentence: "It's a small health tool held on the forehead or under the tongue to check a fever.",
        explanation: "Great word bridge: combining purpose and where it's used gets the meaning across."
      },
      {
        id: "cr_en_2", lv: 1, icon: "🧭",
        targetWord: "compass",
        category: "Navigation tool",
        firstSound: "com-pa...",
        clues: [
          { text: "Always points north so you know your direction", ok: true },
          { text: "Has a moving needle under clear glass", ok: true },
          { text: "Heats up soup on the stove", ok: false },
          { text: "Used to sweep leaves off a path", ok: false }
        ],
        bridgeSentence: "It has a moving needle under glass that always points north.",
        explanation: "Function plus one visual detail tells the listener straight away."
      },
      {
        id: "cr_en_3", lv: 1, icon: "📎",
        targetWord: "paperclip",
        category: "Desk supply",
        firstSound: "pa-per...",
        clues: [
          { text: "Keeps loose sheets of paper held together", ok: true },
          { text: "Made from a small loop of bent wire", ok: true },
          { text: "Stirred into hot tea or coffee", ok: false },
          { text: "Laced onto shoes before walking", ok: false }
        ],
        bridgeSentence: "It's a tiny loop of bent wire that holds sheets of paper together.",
        explanation: "Material and purpose substitute cleanly for the exact name."
      },
      {
        id: "cr_en_4", lv: 1, icon: "🔭",
        targetWord: "binoculars",
        category: "Optical device",
        firstSound: "bi-noc...",
        clues: [
          { text: "Makes far-away birds or hills look much closer", ok: true },
          { text: "Held up to both eyes with two lenses", ok: true },
          { text: "Used to weigh flour for baking", ok: false },
          { text: "Unlocks the garden gate", ok: false }
        ],
        bridgeSentence: "You hold two lenses up to your eyes to see far-away things closer.",
        explanation: "Describing how you hold it and what it does communicates the word smoothly."
      },

      /* Level 2 */
      {
        id: "cr_en_5", lv: 2, icon: "☂️",
        targetWord: "umbrella",
        category: "Weather gear",
        firstSound: "um-brel...",
        clues: [
          { text: "Keeps you dry when walking outside in rain", ok: true },
          { text: "Opens up overhead with a curved handle", ok: true },
          { text: "Plays music at a concert", ok: false },
          { text: "Stored cold inside the fridge", ok: false }
        ],
        bridgeSentence: "It opens over your head with a handle to keep the rain off.",
        explanation: "When a word stalls, describing the weather situation makes it obvious."
      },
      {
        id: "cr_en_6", lv: 2, icon: "✂️",
        targetWord: "scissors",
        category: "Household tool",
        firstSound: "scis-s...",
        clues: [
          { text: "Used to cut paper, string, or wrapping", ok: true },
          { text: "Has two sharp blades and finger loops", ok: true },
          { text: "Washed in the sink with soap for hair", ok: false },
          { text: "Turned on at night beside your bed", ok: false }
        ],
        bridgeSentence: "It has two blades and finger loops for cutting paper or string.",
        explanation: "Nice bridge: shape and action tell the listener immediately."
      },
      {
        id: "cr_en_7", lv: 2, icon: "🪞",
        targetWord: "mirror",
        category: "Bathroom item",
        firstSound: "mir-r...",
        clues: [
          { text: "Shows your reflection clearly when you look", ok: true },
          { text: "Often hangs above the bathroom sink", ok: true },
          { text: "Rings when family members phone you", ok: false },
          { text: "Bakes bread inside the hot oven", ok: false }
        ],
        bridgeSentence: "It hangs above the sink and shows your face back to you.",
        explanation: "Saying where it sits in a room helps people follow right away."
      },
      {
        id: "cr_en_8", lv: 2, icon: "🧳",
        targetWord: "suitcase",
        category: "Travel bag",
        firstSound: "suit-c...",
        clues: [
          { text: "Carries clothes and shoes when going on a trip", ok: true },
          { text: "Zips shut and often rolls on small wheels", ok: true },
          { text: "Writes ink notes on a birthday card", ok: false },
          { text: "Boils water for morning tea", ok: false }
        ],
        bridgeSentence: "It zips up on small wheels to pack clothes when you go away.",
        explanation: "Event and physical features get your message across without the label."
      },

      /* Level 3 */
      {
        id: "cr_en_9", lv: 3, icon: "🔑",
        targetWord: "key",
        category: "Everyday object",
        firstSound: "k...",
        clues: [
          { text: "Unlocks and locks the front door of the house", ok: true },
          { text: "Small piece of metal carried in a pocket or bag", ok: true },
          { text: "Read quietly before going to sleep", ok: false },
          { text: "Used to dry wet plates after washing", ok: false }
        ],
        bridgeSentence: "It's the small metal thing in your pocket that opens the front door.",
        explanation: "Well done: size, material, and action leave zero doubt."
      },
      {
        id: "cr_en_10", lv: 3, icon: "👓",
        targetWord: "glasses",
        category: "Personal item",
        firstSound: "gl...",
        clues: [
          { text: "Helps you read text or see distant signs clearly", ok: true },
          { text: "Rests on your nose with two clear lenses", ok: true },
          { text: "Sews loose buttons onto a shirt", ok: false },
          { text: "Waters flowers outside in the garden", ok: false }
        ],
        bridgeSentence: "They sit on your nose with two lenses to help you read clearly.",
        explanation: "Saying where they sit and what they help with keeps conversation flowing."
      },
      {
        id: "cr_en_11", lv: 3, icon: "🥄",
        targetWord: "spoon",
        category: "Tableware",
        firstSound: "sp...",
        clues: [
          { text: "Used for eating hot soup or yogurt", ok: true },
          { text: "Has a smooth round bowl at the end", ok: true },
          { text: "Switches channels on the television", ok: false },
          { text: "Worn on chilly winter mornings", ok: false }
        ],
        bridgeSentence: "It has a round bowl at the end for eating soup or yogurt.",
        explanation: "Shape and food pairing make the object clear even without the word."
      },
      {
        id: "cr_en_12", lv: 3, icon: "🕰️",
        targetWord: "clock",
        category: "Timekeeper",
        firstSound: "cl...",
        clues: [
          { text: "Tells you what time of day it is", ok: true },
          { text: "Has hands or numbers around a face", ok: true },
          { text: "Polishes windows until they shine", ok: false },
          { text: "Grows in the garden next to tomatoes", ok: false }
        ],
        bridgeSentence: "It shows numbers or moving hands so you know the time.",
        explanation: "Core function and visual parts communicate the concept smoothly."
      }
    ]
  };
})();
