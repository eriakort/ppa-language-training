/*
 * Places & items — optional generative listing exercise.
 * Given a location, name things typically found there.
 * Soft goal, accepts synonyms / category members.
 * Levels: 1 = harder (higher soft goal, less familiar places), 3 = easier.
 */
window.POG = window.POG || {};
window.POG.content = window.POG.content || {};
window.POG.content.PLACES = {
  it: [
    {
      id: "pl-it-1", lv: 1, pic: "🍳",
      place: "cucina",
      prompt: "Nomina o scrivi le cose che si trovano in cucina.",
      softGoal: 8,
      items: [
        { canonical: "fornello", aliases: ["piano cottura", "fornelli", "cucina a gas", "piastra", "gas"] },
        { canonical: "frigorifero", aliases: ["frigo", "refrigeratore", "freezer"] },
        { canonical: "lavello", aliases: ["lavandino", "acquaio", "lavabo", "rubinetto"] },
        { canonical: "forno", aliases: ["forno elettrico", "microonde", "fornetto"] },
        { canonical: "coltello", aliases: ["coltelli", "posate", "cucchiaio", "forchetta", "mestolo"] },
        { canonical: "pentola", aliases: ["pentole", "padella", "casseruola", "tegame"] },
        { canonical: "piatto", aliases: ["piatti", "scodella", "tazza", "bicchiere", "ciotola"] },
        { canonical: "tavolo", aliases: ["tavolo da cucina", "tavolo"] },
        { canonical: "sedia", aliases: ["sedie", "sgabello"] },
        { canonical: "mobile", aliases: ["pensile", "armadio", "scaffale", "dispensa", "cassetto"] },
        { canonical: "acqua", aliases: ["rubinetto", "acquaio", "lavandino"] },
        { canonical: "sapone", aliases: ["detersivo", "spugna", "lavastoviglie"] }
      ]
    },
    {
      id: "pl-it-2", lv: 1, pic: "🛁",
      place: "bagno",
      prompt: "Nomina o scrivi le cose che si trovano in bagno.",
      softGoal: 7,
      items: [
        { canonical: "lavandino", aliases: ["lavabo", "acquaio", "rubinetto"] },
        { canonical: "specchio", aliases: ["specchio da bagno"] },
        { canonical: "doccia", aliases: ["box doccia", "soffione", "cabina doccia"] },
        { canonical: "vasca", aliases: ["vasca da bagno", "vasca"] },
        { canonical: "wc", aliases: ["water", "toilette", "gabinetto", "vaso"] },
        { canonical: "asciugamano", aliases: ["asciugamani", "telo", "accappatoio"] },
        { canonical: "spazzolino", aliases: ["dentifricio", "spazzolini", "spazzola"] },
        { canonical: "sapone", aliases: ["bagnoschiuma", "shampoo", "docciaschiuma"] },
        { canonical: "carta", aliases: ["carta igienica", "rotolo", "carta"] }
      ]
    },
    {
      id: "pl-it-3", lv: 2, pic: "🛏️",
      place: "camera da letto",
      prompt: "Nomina o scrivi le cose che si trovano in camera da letto.",
      softGoal: 6,
      items: [
        { canonical: "letto", aliases: ["lettino", "materasso", "letto matrimoniale"] },
        { canonical: "cuscino", aliases: ["cuscini", "guanciale"] },
        { canonical: "coperta", aliases: ["lenzuola", "piumone", "trapunta", "copriletto"] },
        { canonical: "armadio", aliases: ["guardaroba", "mobile", "armadio a muro"] },
        { canonical: "comodino", aliases: ["tavolino", "comodino"] },
        { canonical: "lampada", aliases: ["abat-jour", "luce", "lampada da comodino"] },
        { canonical: "sedia", aliases: ["sedia", "poltroncina"] },
        { canonical: "finestra", aliases: ["tende", "tenda", "persiane"] }
      ]
    },
    {
      id: "pl-it-4", lv: 2, pic: "🛋️",
      place: "soggiorno",
      prompt: "Nomina o scrivi le cose che si trovano in soggiorno o in salotto.",
      softGoal: 6,
      items: [
        { canonical: "divano", aliases: ["sofà", "poltrona", "divano letto"] },
        { canonical: "tavolo", aliases: ["tavolino", "tavolo basso", "tavolino da caffè"] },
        { canonical: "sedia", aliases: ["sedie", "poltrona"] },
        { canonical: "televisore", aliases: ["tv", "televisione", "schermo", "televisore"] },
        { canonical: "libreria", aliases: ["scaffale", "mensole", "libri", "libreria"] },
        { canonical: "tappeto", aliases: ["tappeto", "moquette", "tappetino"] },
        { canonical: "lampada", aliases: ["luce", "abat-jour", "lampada"] },
        { canonical: "finestra", aliases: ["tende", "tenda"] }
      ]
    },
    {
      id: "pl-it-5", lv: 2, pic: "🌿",
      place: "giardino",
      prompt: "Nomina o scrivi le cose che si trovano in giardino.",
      softGoal: 6,
      items: [
        { canonical: "albero", aliases: ["alberi", "pianta", "cespuglio"] },
        { canonical: "fiore", aliases: ["fiori", "aiuola", "rosa"] },
        { canonical: "erba", aliases: ["prato", "prato verde", "erba"] },
        { canonical: "panchina", aliases: ["seduta", "panchina"] },
        { canonical: "sentiero", aliases: ["vialetto", "strada", "camminamento"] },
        { canonical: "recinto", aliases: ["cancello", "staccionata", "recinzione"] },
        { canonical: "attrezzi", aliases: ["pala", "rastrello", "annaffiatoio", "cesoie"] },
        { canonical: "tavolo", aliases: ["tavolo da giardino", "tavolo esterno"] }
      ]
    },
    {
      id: "pl-it-6", lv: 3, pic: "🚗",
      place: "garage",
      prompt: "Nomina o scrivi le cose che si trovano in un garage o in autorimessa.",
      softGoal: 5,
      items: [
        { canonical: "auto", aliases: ["macchina", "automobile", "veicolo", "auto"] },
        { canonical: "attrezzi", aliases: ["cassetta attrezzi", "martello", "cacciavite", "chiave inglese"] },
        { canonical: "bicicletta", aliases: ["bici", "bicicletta"] },
        { canonical: "scatole", aliases: ["scatoloni", "scatola", "scatole"] },
        { canonical: "scaffale", aliases: ["mensole", "ripiano", "scaffale"] },
        { canonical: "porta", aliases: ["portone", "cancello", "porta garage"] }
      ]
    },
    {
      id: "pl-it-7", lv: 3, pic: "🎓",
      place: "aula",
      prompt: "Nomina o scrivi le cose che si trovano in un'aula o in una classe.",
      softGoal: 5,
      items: [
        { canonical: "banco", aliases: ["banchi", "tavolo", "scrivania", "banco"] },
        { canonical: "sedia", aliases: ["sedie", "sedia"] },
        { canonical: "lavagna", aliases: ["lavagna nera", "schermo", "lavagna"] },
        { canonical: "libro", aliases: ["libri", "quaderno", "penna", "matita"] },
        { canonical: "insegnante", aliases: ["maestro", "professoressa", "insegnante"] },
        { canonical: "finestra", aliases: ["finestra"] },
        { canonical: "orologio", aliases: ["orologio"] }
      ]
    },
    {
      id: "pl-it-8", lv: 1, pic: "🛒",
      place: "supermercato",
      prompt: "Nomina o scrivi le cose che si trovano in un supermercato.",
      softGoal: 8,
      items: [
        { canonical: "carrello", aliases: ["carrello della spesa", "cestino"] },
        { canonical: "cassa", aliases: ["cassa", "cassiera", "bancone"] },
        { canonical: "scaffale", aliases: ["scaffali", "ripiano", "corsia"] },
        { canonical: "cibo", aliases: ["alimenti", "prodotti", "merce"] },
        { canonical: "frutta", aliases: ["verdura", "frutta e verdura"] },
        { canonical: "pane", aliases: ["pane", "forno", "pasticceria"] },
        { canonical: "latte", aliases: ["latticini", "yogurt", "formaggio"] },
        { canonical: "sacchetto", aliases: ["borsa", "sacchetti"] }
      ]
    },
    {
      id: "pl-it-9", lv: 2, pic: "🏖️",
      place: "spiaggia",
      prompt: "Nomina o scrivi le cose che si trovano in spiaggia.",
      softGoal: 6,
      items: [
        { canonical: "sabbia", aliases: ["sabbia", "spiaggia"] },
        { canonical: "mare", aliases: ["acqua", "onde", "mare"] },
        { canonical: "ombrellone", aliases: ["ombrellone", "tendalino"] },
        { canonical: "asciugamano", aliases: ["telo mare", "asciugamano"] },
        { canonical: "sdraio", aliases: ["sdraio", "lettino"] },
        { canonical: "sole", aliases: ["sole", "crema solare"] },
        { canonical: "conchiglie", aliases: ["conchiglie", "sassi"] }
      ]
    },
    {
      id: "pl-it-10", lv: 2, pic: "🏥",
      place: "ospedale",
      prompt: "Nomina o scrivi le cose che si trovano in un ospedale.",
      softGoal: 6,
      items: [
        { canonical: "letto", aliases: ["letto d'ospedale", "barella"] },
        { canonical: "medico", aliases: ["dottore", "infermiere", "infermiera"] },
        { canonical: "sedia", aliases: ["sedia a rotelle", "sedia"] },
        { canonical: "farmaco", aliases: ["medicine", "farmaci", "pillole"] },
        { canonical: "corridoio", aliases: ["corridoio", "sala d'attesa"] },
        { canonical: "macchina", aliases: ["apparecchi", "monitor", "strumenti"] }
      ]
    }
  ],
  en: [
    {
      id: "pl-en-1", lv: 1, pic: "🍳",
      place: "kitchen",
      prompt: "Name or type things you can find in a kitchen.",
      softGoal: 8,
      items: [
        { canonical: "stove", aliases: ["cooker", "hob", "cooktop", "range", "gas stove"] },
        { canonical: "fridge", aliases: ["refrigerator", "icebox", "freezer"] },
        { canonical: "sink", aliases: ["basin", "washbasin", "tap", "faucet"] },
        { canonical: "oven", aliases: ["microwave", "oven"] },
        { canonical: "knife", aliases: ["knives", "cutlery", "spoon", "fork", "ladle"] },
        { canonical: "pot", aliases: ["pots", "pan", "saucepan", "frying pan", "skillet"] },
        { canonical: "plate", aliases: ["plates", "bowl", "cup", "mug", "glass"] },
        { canonical: "table", aliases: ["kitchen table", "table"] },
        { canonical: "chair", aliases: ["chairs", "stool"] },
        { canonical: "cupboard", aliases: ["cabinet", "shelf", "pantry", "drawer", "cupboards"] },
        { canonical: "tap", aliases: ["faucet", "water", "sink"] },
        { canonical: "soap", aliases: ["detergent", "sponge", "dishwasher"] }
      ]
    },
    {
      id: "pl-en-2", lv: 1, pic: "🛁",
      place: "bathroom",
      prompt: "Name or type things you can find in a bathroom.",
      softGoal: 7,
      items: [
        { canonical: "sink", aliases: ["basin", "washbasin", "tap", "faucet"] },
        { canonical: "mirror", aliases: ["bathroom mirror"] },
        { canonical: "shower", aliases: ["shower head", "shower cubicle", "shower stall"] },
        { canonical: "bath", aliases: ["bathtub", "tub", "bath"] },
        { canonical: "toilet", aliases: ["wc", "loo", "lavatory", "toilet"] },
        { canonical: "towel", aliases: ["towels", "bath towel", "bathrobe"] },
        { canonical: "toothbrush", aliases: ["toothpaste", "toothbrushes"] },
        { canonical: "soap", aliases: ["shampoo", "shower gel", "body wash"] },
        { canonical: "toilet paper", aliases: ["paper", "roll", "toilet roll"] }
      ]
    },
    {
      id: "pl-en-3", lv: 2, pic: "🛏️",
      place: "bedroom",
      prompt: "Name or type things you can find in a bedroom.",
      softGoal: 6,
      items: [
        { canonical: "bed", aliases: ["mattress", "double bed"] },
        { canonical: "pillow", aliases: ["pillows"] },
        { canonical: "blanket", aliases: ["sheets", "duvet", "quilt", "covers", "bedspread"] },
        { canonical: "wardrobe", aliases: ["closet", "cupboard", "wardrobe"] },
        { canonical: "bedside table", aliases: ["nightstand", "side table", "bedside table"] },
        { canonical: "lamp", aliases: ["light", "bedside lamp", "lamp"] },
        { canonical: "chair", aliases: ["chair"] },
        { canonical: "window", aliases: ["curtains", "blinds", "window"] }
      ]
    },
    {
      id: "pl-en-4", lv: 2, pic: "🛋️",
      place: "living room",
      prompt: "Name or type things you can find in a living room or lounge.",
      softGoal: 6,
      items: [
        { canonical: "sofa", aliases: ["couch", "settee", "armchair", "sofa"] },
        { canonical: "table", aliases: ["coffee table", "side table", "table"] },
        { canonical: "chair", aliases: ["chairs", "armchair"] },
        { canonical: "television", aliases: ["tv", "screen", "television"] },
        { canonical: "bookshelf", aliases: ["shelves", "books", "bookcase", "bookshelf"] },
        { canonical: "rug", aliases: ["carpet", "mat", "rug"] },
        { canonical: "lamp", aliases: ["light", "lamp"] },
        { canonical: "window", aliases: ["curtains", "window"] }
      ]
    },
    {
      id: "pl-en-5", lv: 2, pic: "🌿",
      place: "garden",
      prompt: "Name or type things you can find in a garden.",
      softGoal: 6,
      items: [
        { canonical: "tree", aliases: ["trees", "plant", "bush", "shrub"] },
        { canonical: "flower", aliases: ["flowers", "flower bed", "rose"] },
        { canonical: "grass", aliases: ["lawn", "grass"] },
        { canonical: "bench", aliases: ["seat", "bench"] },
        { canonical: "path", aliases: ["pathway", "walkway", "path"] },
        { canonical: "fence", aliases: ["gate", "hedge", "fence"] },
        { canonical: "tools", aliases: ["spade", "rake", "watering can", "shears"] },
        { canonical: "table", aliases: ["garden table", "outdoor table"] }
      ]
    },
    {
      id: "pl-en-6", lv: 3, pic: "🚗",
      place: "garage",
      prompt: "Name or type things you can find in a garage.",
      softGoal: 5,
      items: [
        { canonical: "car", aliases: ["vehicle", "automobile", "car"] },
        { canonical: "tools", aliases: ["toolbox", "hammer", "screwdriver", "wrench"] },
        { canonical: "bicycle", aliases: ["bike", "bicycle"] },
        { canonical: "boxes", aliases: ["box", "storage boxes", "boxes"] },
        { canonical: "shelf", aliases: ["shelves", "rack", "shelf"] },
        { canonical: "door", aliases: ["garage door", "door"] }
      ]
    },
    {
      id: "pl-en-7", lv: 3, pic: "🎓",
      place: "classroom",
      prompt: "Name or type things you can find in a classroom.",
      softGoal: 5,
      items: [
        { canonical: "desk", aliases: ["table", "desk"] },
        { canonical: "chair", aliases: ["chairs"] },
        { canonical: "board", aliases: ["blackboard", "whiteboard", "screen"] },
        { canonical: "book", aliases: ["books", "notebook", "pen", "pencil"] },
        { canonical: "teacher", aliases: ["instructor", "teacher"] },
        { canonical: "window", aliases: ["window"] },
        { canonical: "clock", aliases: ["clock"] }
      ]
    },
    {
      id: "pl-en-8", lv: 1, pic: "🛒",
      place: "supermarket",
      prompt: "Name or type things you can find in a supermarket.",
      softGoal: 8,
      items: [
        { canonical: "trolley", aliases: ["shopping cart", "basket", "trolley"] },
        { canonical: "checkout", aliases: ["till", "cashier", "counter"] },
        { canonical: "shelf", aliases: ["shelves", "aisle", "shelf"] },
        { canonical: "food", aliases: ["groceries", "products", "items"] },
        { canonical: "fruit", aliases: ["vegetables", "produce", "fruit and veg"] },
        { canonical: "bread", aliases: ["bakery", "bread"] },
        { canonical: "milk", aliases: ["dairy", "yogurt", "cheese"] },
        { canonical: "bag", aliases: ["shopping bag", "bags"] }
      ]
    },
    {
      id: "pl-en-9", lv: 2, pic: "🏖️",
      place: "beach",
      prompt: "Name or type things you can find at the beach.",
      softGoal: 6,
      items: [
        { canonical: "sand", aliases: ["sand", "beach"] },
        { canonical: "sea", aliases: ["water", "waves", "ocean", "sea"] },
        { canonical: "umbrella", aliases: ["beach umbrella", "parasol"] },
        { canonical: "towel", aliases: ["beach towel", "towel"] },
        { canonical: "deckchair", aliases: ["sun lounger", "deckchair", "lounger"] },
        { canonical: "sun", aliases: ["sun", "sunscreen"] },
        { canonical: "shells", aliases: ["shells", "pebbles"] }
      ]
    },
    {
      id: "pl-en-10", lv: 2, pic: "🏥",
      place: "hospital",
      prompt: "Name or type things you can find in a hospital.",
      softGoal: 6,
      items: [
        { canonical: "bed", aliases: ["hospital bed", "stretcher"] },
        { canonical: "doctor", aliases: ["nurse", "physician", "doctor"] },
        { canonical: "chair", aliases: ["wheelchair", "chair"] },
        { canonical: "medicine", aliases: ["medication", "pills", "drugs"] },
        { canonical: "corridor", aliases: ["hallway", "waiting room", "corridor"] },
        { canonical: "equipment", aliases: ["machines", "monitor", "instruments"] }
      ]
    }
  ]
};
