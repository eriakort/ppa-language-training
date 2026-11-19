/*
 * Bilingual Everyday Narrative Sequencing & Main-Concept Retell Bank.
 * Supports connected discourse coherence (lvPPA sequencing, nfvPPA connector scaffolding,
 * and svPPA concrete concept recall) with automatic main-concept stem matching.
 *
 * Levels: 1 = 4-detail longer everyday story, 2 = 3-clause routine, 3 = short concrete sequence.
 */
(function () {
  "use strict";
  var POG = window.POG = window.POG || {};
  POG.content = POG.content || {};

  POG.content.NARRATIVE = {
    it: [
      {
        id: "nr_it_1", lv: 1, icon: "🩺", title: "Appuntamento dal medico",
        story: "Stamattina Luca prepara la tessera sanitaria e la lista delle medicine. Arriva in ambulatorio alle nove in punto per il controllo semestrale. Dopo la visita ritira la nuova ricetta allo sportello.",
        beats: [
          { step: 1, text: "Prepara tessera sanitaria e lista delle medicine." },
          { step: 2, text: "Arriva in ambulatorio alle nove per il controllo." },
          { step: 3, text: "Ritira la nuova ricetta dopo la visita." }
        ],
        concepts: ["tessera", "medicine", "ambulatorio", "visita", "ricetta"],
        summaryChoices: [
          { text: "Luca porta tessera e medicine, fa la visita alle nove e ritira la ricetta.", ok: true },
          { text: "Luca prende il treno per il mare e compra un giornale.", ok: false },
          { text: "Luca dimentica l'ambulatorio chiuso e va al cinema.", ok: false }
        ]
      },
      {
        id: "nr_it_2", lv: 1, icon: "🔑", title: "Le chiavi smarrite",
        story: "Anna posa la borsa della spesa sul tavolo della cucina. Quando cerca le chiavi di casa, non le trova nella solita tasca. Controlla vicino alla posta e le ritrova accanto agli occhiali.",
        beats: [
          { step: 1, text: "Posa la borsa della spesa sul tavolo della cucina." },
          { step: 2, text: "Cerca le chiavi di casa nella tasca ma non ci sono." },
          { step: 3, text: "Le ritrova vicino alla posta accanto agli occhiali." }
        ],
        concepts: ["spesa", "tavolo", "chiavi", "posta", "occhiali"],
        summaryChoices: [
          { text: "Anna posa la spesa, cerca le chiavi e le trova vicino alla posta.", ok: true },
          { text: "Anna chiama un elettricista per cambiare la lampadina.", ok: false },
          { text: "Anna esce senza giacca e prende la pioggia al parco.", ok: false }
        ]
      },
      {
        id: "nr_it_3", lv: 1, icon: "🚌", title: "Cambio di fermata",
        story: "Oggi c'è un lavoro stradale davanti alla chiesa, quindi il bus dodici cambia percorso. Marco scende una fermata prima in piazza grande. Cammina cinque minuti all'ombra e arriva puntuale in farmacia.",
        beats: [
          { step: 1, text: "Lavori davanti alla chiesa fanno deviare il bus." },
          { step: 2, text: "Marco scende una fermata prima in piazza." },
          { step: 3, text: "Cammina cinque minuti e arriva in farmacia." }
        ],
        concepts: ["lavori", "bus", "piazza", "cammina", "farmacia"],
        summaryChoices: [
          { text: "Per una deviazione del bus, Marco scende in piazza e raggiunge la farmacia a piedi.", ok: true },
          { text: "Marco aspetta invano alla stazione dei treni fino a sera.", ok: false },
          { text: "Marco guida l'auto fino al supermercato di periferia.", ok: false }
        ]
      },
      {
        id: "nr_it_4", lv: 2, icon: "🛒", title: "La spesa al mercato",
        story: "Giulia prende il cestino e sceglie due mele rosse al banco della frutta. Poi passa dal fornaio per prendere il pane caldo. Alla fine paga con la tessera e saluta tutti.",
        beats: [
          { step: 1, text: "Prende il cestino e sceglie due mele al banco frutta." },
          { step: 2, text: "Passa dal fornaio a comprare il pane caldo." },
          { step: 3, text: "Paga alla cassa e torna verso casa." }
        ],
        concepts: ["mele", "frutta", "fornaio", "pane", "paga"],
        summaryChoices: [
          { text: "Giulia compra mele e pane al mercato e poi paga.", ok: true },
          { text: "Giulia prenota un volo in agenzia di viaggi.", ok: false },
          { text: "Giulia lava la macchina in cortile.", ok: false }
        ]
      },
      {
        id: "nr_it_5", lv: 2, icon: "☕", title: "Pausa caffè con un'amica",
        story: "Suona il campanello e arriva Lucia con una torta fatta in casa. Paolo prepara il caffè nella moka e sistema due tazzine sul vassoio. Si siedono in salotto e guardano le foto delle vacanze.",
        beats: [
          { step: 1, text: "Arriva Lucia portando una torta fatta in casa." },
          { step: 2, text: "Paolo prepara il caffè e mette due tazzine." },
          { step: 3, text: "In salotto guardano insieme le foto delle vacanze." }
        ],
        concepts: ["torta", "caffè", "tazzine", "salotto", "foto"],
        summaryChoices: [
          { text: "Lucia porta una torta, Paolo fa il caffè e guardano le foto in salotto.", ok: true },
          { text: "Paolo chiude il cancello e parte presto per il lavoro.", ok: false },
          { text: "Lucia compra una bicicletta nuova in centro.", ok: false }
        ]
      },
      {
        id: "nr_it_6", lv: 2, icon: "📞", title: "La telefonata del nipote",
        story: "Nel pomeriggio squilla il telefono di casa mentre Sara legge sul divano. È suo nipote Matteo che la invita a pranzo domenica. Sara segna subito data e orario sul calendario in cucina.",
        beats: [
          { step: 1, text: "Squilla il telefono mentre Sara legge in soggiorno." },
          { step: 2, text: "Matteo chiama per invitarla a pranzo domenica." },
          { step: 3, text: "Sara annota data e ora sul calendario." }
        ],
        concepts: ["telefono", "nipote", "pranzo", "domenica", "calendario"],
        summaryChoices: [
          { text: "Il nipote chiama Sara per invitarla domenica e lei lo segna sul calendario.", ok: true },
          { text: "Sara ascolta il telegiornale e spegne la radio.", ok: false },
          { text: "Matteo dimentica lo zaino a scuola.", ok: false }
        ]
      },
      {
        id: "nr_it_7", lv: 3, icon: "🌧️", title: "Passeggiata sotto la pioggia",
        story: "Prima di uscire Elena guarda fuori dalla finestra e vede nuvole grigie. Prende l'ombrello blu vicino alla porta. Quando inizia a piovere si ripara facilmente.",
        beats: [
          { step: 1, text: "Guarda fuori dalla finestra e vede nuvole grigie." },
          { step: 2, text: "Prende l'ombrello blu vicino all'ingresso." },
          { step: 3, text: "Esce al riparo quando inizia a piovere." }
        ],
        concepts: ["finestra", "nuvole", "ombrello", "pioggia"],
        summaryChoices: [
          { text: "Elena vede le nuvole, prende l'ombrello e resta asciutta.", ok: true },
          { text: "Elena mette gli occhiali da sole per andare in piscina.", ok: false },
          { text: "Elena innaffia i gerani sul balcone al tramonto.", ok: false }
        ]
      },
      {
        id: "nr_it_8", lv: 3, icon: "🥐", title: "Colazione serena",
        story: "Alle otto Pietro apre le persiane della cucina per far entrare luce. Scalda il latte e versa il tè nella tazza grande. Fa colazione con pane tostato e marmellata.",
        beats: [
          { step: 1, text: "Apre le persiane della cucina alle otto." },
          { step: 2, text: "Scalda il latte e versa il tè nella tazza." },
          { step: 3, text: "Mangia pane tostato e marmellata." }
        ],
        concepts: ["cucina", "latte", "tè", "pane", "marmellata"],
        summaryChoices: [
          { text: "Pietro apre la cucina, prepara latte o tè e fa colazione.", ok: true },
          { text: "Pietro prepara la cena e chiude le luci per dormire.", ok: false },
          { text: "Pietro porta la valigia alla stazione.", ok: false }
        ]
      },
      {
        id: "nr_it_9", lv: 3, icon: "🪴", title: "Le piante sul balcone",
        story: "Sabato mattina Clara riempie l'annaffiatoio con acqua fresca. Bagna i vasi di basilico e toglie le foglie secche. Alla fine sistema gli attrezzi sul ripiano.",
        beats: [
          { step: 1, text: "Riempie l'annaffiatoio con acqua fresca." },
          { step: 2, text: "Bagna il basilico e toglie le foglie secche." },
          { step: 3, text: "Rimette gli attrezzi in ordine sul ripiano." }
        ],
        concepts: ["annaffiatoio", "acqua", "basilico", "foglie"],
        summaryChoices: [
          { text: "Clara annaffia il basilico, toglie le foglie secche e riordina.", ok: true },
          { text: "Clara cuce un bottone su una camicia bianca.", ok: false },
          { text: "Clara prenota una visita dal dentista.", ok: false }
        ]
      }
    ],
    en: [
      {
        id: "nr_en_1", lv: 1, icon: "🩺", title: "Morning clinic check-up",
        story: "This morning Arthur packs his health card and medication list before leaving. He arrives at the clinic at nine sharp for his routine review. After the appointment he picks up his updated prescription at reception.",
        beats: [
          { step: 1, text: "Packs his health card and medication list." },
          { step: 2, text: "Arrives at the clinic at nine for his check-up." },
          { step: 3, text: "Collects his new prescription at reception." }
        ],
        concepts: ["card", "medication", "clinic", "check", "prescription"],
        summaryChoices: [
          { text: "Arthur brings his list, sees the doctor at nine, and picks up his prescription.", ok: true },
          { text: "Arthur catches a seaside train and buys a postcard.", ok: false },
          { text: "Arthur finds the library closed and walks home.", ok: false }
        ]
      },
      {
        id: "nr_en_2", lv: 1, icon: "🔑", title: "Misplaced house keys",
        story: "Helen sets her shopping bag down on the kitchen counter. When she reaches for her keys, they are missing from her coat pocket. She checks near the morning post and finds them right beside her glasses.",
        beats: [
          { step: 1, text: "Sets the shopping bag on the kitchen counter." },
          { step: 2, text: "Looks in her coat pocket and notices keys missing." },
          { step: 3, text: "Finds the keys beside the post and her glasses." }
        ],
        concepts: ["shopping", "kitchen", "keys", "post", "glasses"],
        summaryChoices: [
          { text: "Helen puts down groceries, checks her pocket, and finds the keys by her glasses.", ok: true },
          { text: "Helen calls an electrician to fix the hallway light.", ok: false },
          { text: "Helen leaves for the cinema without her scarf.", ok: false }
        ]
      },
      {
        id: "nr_en_3", lv: 1, icon: "🚌", title: "Bus route detour",
        story: "Roadworks outside the town church mean the number twelve bus changes stops today. Mark gets off one stop earlier by the main square. He walks five quiet minutes under the trees and reaches the chemist on time.",
        beats: [
          { step: 1, text: "Roadworks near the church divert the bus route." },
          { step: 2, text: "Mark steps off early at the main square." },
          { step: 3, text: "Walks five minutes and reaches the chemist on time." }
        ],
        concepts: ["roadwork", "bus", "square", "walk", "chemist"],
        summaryChoices: [
          { text: "Because of a bus detour, Mark gets off at the square and walks to the chemist.", ok: true },
          { text: "Mark waits at the train platform until evening.", ok: false },
          { text: "Mark drives straight out of town for fuel.", ok: false }
        ]
      },
      {
        id: "nr_en_4", lv: 2, icon: "🛒", title: "Market errand",
        story: "Claire picks up a basket and chooses two red apples at the fruit stall. Next she stops by the baker for a warm loaf of bread. She pays with her card and heads home with a smile.",
        beats: [
          { step: 1, text: "Chooses two crisp apples at the fruit stall." },
          { step: 2, text: "Stops at the baker for a warm loaf of bread." },
          { step: 3, text: "Pays at the till and walks back home." }
        ],
        concepts: ["apples", "fruit", "baker", "bread", "pays"],
        summaryChoices: [
          { text: "Claire buys apples and bread at the market, pays, and goes home.", ok: true },
          { text: "Claire books a hotel room at the travel desk.", ok: false },
          { text: "Claire washes the garden fence before noon.", ok: false }
        ]
      },
      {
        id: "nr_en_5", lv: 2, icon: "☕", title: "Afternoon tea with a friend",
        story: "The doorbell rings and Lucy arrives holding a homemade sponge cake. Paul puts the kettle on and sets two mugs on a tray. They sit in the living room looking through old holiday photos.",
        beats: [
          { step: 1, text: "Lucy arrives carrying a homemade cake." },
          { step: 2, text: "Paul boils the kettle and sets out two mugs." },
          { step: 3, text: "They look through holiday photos together." }
        ],
        concepts: ["cake", "kettle", "mugs", "living", "photos"],
        summaryChoices: [
          { text: "Lucy brings cake, Paul makes tea, and they enjoy holiday photos together.", ok: true },
          { text: "Paul locks the gate early to catch a night train.", ok: false },
          { text: "Lucy repairs a flat bicycle tyre in the shed.", ok: false }
        ]
      },
      {
        id: "nr_en_6", lv: 2, icon: "📞", title: "Grandson's phone call",
        story: "The hallway phone rings in the afternoon while Ruth is reading on the sofa. Her grandson Tom calls to invite her for Sunday lunch. Ruth writes the day and time straight onto the kitchen calendar.",
        beats: [
          { step: 1, text: "The phone rings while Ruth reads on the sofa." },
          { step: 2, text: "Her grandson Tom invites her to Sunday lunch." },
          { step: 3, text: "Ruth writes the time on her kitchen calendar." }
        ],
        concepts: ["phone", "grandson", "lunch", "sunday", "calendar"],
        summaryChoices: [
          { text: "Ruth's grandson calls about Sunday lunch and she notes it on the calendar.", ok: true },
          { text: "Ruth switches off the radio and folds laundry.", ok: false },
          { text: "Tom forgets his school backpack on the bus.", ok: false }
        ]
      },
      {
        id: "nr_en_7", lv: 3, icon: "🌧️", title: "Walk in the rain",
        story: "Before heading out, Emma looks out the window and spots grey clouds. She picks up the blue umbrella standing beside the door. When light rain begins, she stays dry on her walk.",
        beats: [
          { step: 1, text: "Looks out the window and spots grey clouds." },
          { step: 2, text: "Picks up the blue umbrella beside the door." },
          { step: 3, text: "Stays dry outside when rain starts falling." }
        ],
        concepts: ["window", "clouds", "umbrella", "rain"],
        summaryChoices: [
          { text: "Emma sees dark clouds, brings her umbrella, and keeps dry.", ok: true },
          { text: "Emma packs sunglasses for the outdoor swimming pool.", ok: false },
          { text: "Emma irons shirts in the spare bedroom.", ok: false }
        ]
      },
      {
        id: "nr_en_8", lv: 3, icon: "🥐", title: "Calm breakfast",
        story: "At eight o'clock Peter opens the kitchen blinds to let daylight in. He warms some milk and pours fresh tea into a wide mug. Then he enjoys warm toast with jam.",
        beats: [
          { step: 1, text: "Opens the kitchen blinds at eight." },
          { step: 2, text: "Warms milk and pours fresh tea into a mug." },
          { step: 3, text: "Has warm toast and jam for breakfast." }
        ],
        concepts: ["kitchen", "milk", "tea", "toast", "jam"],
        summaryChoices: [
          { text: "Peter opens the blinds, makes tea, and eats toast with jam.", ok: true },
          { text: "Peter cooks roast dinner before turning out the lights.", ok: false },
          { text: "Peter packs a suitcase for a week away.", ok: false }
        ]
      },
      {
        id: "nr_en_9", lv: 3, icon: "🪴", title: "Watering the herbs",
        story: "On Saturday morning Jane fills her watering can with cool water. She waters the basil pots and trims away a few dry leaves. Finally she puts the small trowel neatly back on the shelf.",
        beats: [
          { step: 1, text: "Fills the watering can with cool water." },
          { step: 2, text: "Waters the basil pots and trims dry leaves." },
          { step: 3, text: "Puts the tools neatly back on the shelf." }
        ],
        concepts: ["watering", "water", "basil", "leaves"],
        summaryChoices: [
          { text: "Jane waters the basil, trims dry leaves, and tidies up.", ok: true },
          { text: "Jane sews a loose button onto a white coat.", ok: false },
          { text: "Jane schedules a check-up at the dental clinic.", ok: false }
        ]
      }
    ]
  };
})();
