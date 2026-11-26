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
        { canonical: "fornello", aliases: ["piano cottura", "fornelli", "cucina a gas", "piastra"] },
        { canonical: "frigorifero", aliases: ["frigo", "refrigeratore"] },
        { canonical: "lavello", aliases: ["lavandino", "acquaio", "lavabo"] },
        { canonical: "forno", aliases: ["forno elettrico", "microonde"] },
        { canonical: "coltello", aliases: ["coltelli", "posate", "cucchiaio", "forchetta"] },
        { canonical: "pentola", aliases: ["pentole", "padella", "casseruola"] },
        { canonical: "piatto", aliases: ["piatti", "scodella", "tazza"] },
        { canonical: "tavolo", aliases: ["tavolo da cucina"] },
        { canonical: "sedia", aliases: ["sedie"] },
        { canonical: "mobile", aliases: ["pensile", "armadio", "scaffale", "dispensa"] },
        { canonical: "acqua", aliases: ["rubinetto", "acquaio"] },
        { canonical: "sapone", aliases: ["detersivo", "spugna"] }
      ]
    },
    {
      id: "pl-it-2", lv: 1, pic: "🚿",
      place: "bagno",
      prompt: "Nomina o scrivi le cose che si trovano in bagno.",
      softGoal: 7,
      items: [
        { canonical: "lavandino", aliases: ["lavabo", "acquaio"] },
        { canonical: "specchio", aliases: ["specchio da bagno"] },
        { canonical: "doccia", aliases: ["box doccia", "soffione"] },
        { canonical: "vasca", aliases: ["vasca da bagno", "vasca da bagno"] },
        { canonical: "wc", aliases: ["water", "toilette", "gabinetto"] },
        { canonical: "asciugamano", aliases: ["asciugamani", "telo"] },
        { canonical: "spazzolino", aliases: ["dentifricio", "spazzolini"] },
        { canonical: "sapone", aliases: ["bagnoschiuma", "shampoo"] },
        { canonical: "carta", aliases: ["carta igienica", "rotolo"] }
      ]
    },
    {
      id: "pl-it-3", lv: 2, pic: "🛏️",
      place: "camera da letto",
      prompt: "Nomina o scrivi le cose che si trovano in camera da letto.",
      softGoal: 6,
      items: [
        { canonical: "letto", aliases: ["lettino", "materasso"] },
        { canonical: "cuscino", aliases: ["cuscini", "guanciale"] },
        { canonical: "coperta", aliases: ["lenzuola", "piumone", "trapunta"] },
        { canonical: "armadio", aliases: ["guardaroba", "mobile"] },
        { canonical: "comodino", aliases: ["tavolino"] },
        { canonical: "lampada", aliases: ["abat-jour", "luce"] },
        { canonical: "sedia", aliases: [] },
        { canonical: "finestra", aliases: ["tende", "tenda"] }
      ]
    },
    {
      id: "pl-it-4", lv: 2, pic: "🛋️",
      place: "soggiorno",
      prompt: "Nomina o scrivi le cose che si trovano in soggiorno o in salotto.",
      softGoal: 6,
      items: [
        { canonical: "divano", aliases: ["sofà", "poltrona"] },
        { canonical: "tavolo", aliases: ["tavolino", "tavolo basso"] },
        { canonical: "sedia", aliases: ["sedie", "poltrona"] },
        { canonical: "televisore", aliases: ["tv", "televisione", "schermo"] },
        { canonical: "libreria", aliases: ["scaffale", "mensole", "libri"] },
        { canonical: "tappeto", aliases: ["tappeto", "moquette"] },
        { canonical: "lampada", aliases: ["luce", "abat-jour"] },
        { canonical: "finestra", aliases: ["tende"] }
      ]
    },
    {
      id: "pl-it-5", lv: 2, pic: "🌿",
      place: "giardino",
      prompt: "Nomina o scrivi le cose che si trovano in giardino.",
      softGoal: 6,
      items: [
        { canonical: "albero", aliases: ["alberi", "pianta"] },
        { canonical: "fiore", aliases: ["fiori", "aiuola"] },
        { canonical: "erba", aliases: ["prato", "prato verde"] },
        { canonical: "panchina", aliases: ["seduta"] },
        { canonical: "sentiero", aliases: ["vialetto", "strada"] },
        { canonical: "recinto", aliases: ["cancello", "staccionata"] },
        { canonical: "attrezzi", aliases: ["pala", "rastrello", "annaffiatoio"] },
        { canonical: "tavolo", aliases: ["tavolo da giardino"] }
      ]
    },
    {
      id: "pl-it-6", lv: 3, pic: "🚗",
      place: "garage",
      prompt: "Nomina o scrivi le cose che si trovano in un garage o in autorimessa.",
      softGoal: 5,
      items: [
        { canonical: "auto", aliases: ["macchina", "automobile", "veicolo"] },
        { canonical: "attrezzi", aliases: ["cassetta attrezzi", "martello", "cacciavite"] },
        { canonical: "bicicletta", aliases: ["bici"] },
        { canonical: "scatole", aliases: ["scatoloni", "scatola"] },
        { canonical: "scaffale", aliases: ["mensole", "ripiano"] },
        { canonical: "porta", aliases: ["portone", "cancello"] }
      ]
    },
    {
      id: "pl-it-7", lv: 3, pic: "🎓",
      place: "aula",
      prompt: "Nomina o scrivi le cose che si trovano in un'aula o in una classe.",
      softGoal: 5,
      items: [
        { canonical: "banco", aliases: ["banchi", "tavolo", "scrivania"] },
        { canonical: "sedia", aliases: ["sedie"] },
        { canonical: "lavagna", aliases: ["lavagna nera", "schermo"] },
        { canonical: "libro", aliases: ["libri", "quaderno", "penna"] },
        { canonical: "insegnante", aliases: ["maestro", "professoressa"] },
        { canonical: "finestra", aliases: [] },
        { canonical: "orologio", aliases: [] }
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
        { canonical: "stove", aliases: ["cooker", "hob", "cooktop", "range"] },
        { canonical: "fridge", aliases: ["refrigerator", "icebox"] },
        { canonical: "sink", aliases: ["basin", "washbasin"] },
        { canonical: "oven", aliases: ["microwave"] },
        { canonical: "knife", aliases: ["knives", "cutlery", "spoon", "fork"] },
        { canonical: "pot", aliases: ["pots", "pan", "saucepan", "frying pan"] },
        { canonical: "plate", aliases: ["plates", "bowl", "cup", "mug"] },
        { canonical: "table", aliases: ["kitchen table"] },
        { canonical: "chair", aliases: ["chairs", "stool"] },
        { canonical: "cupboard", aliases: ["cabinet", "shelf", "pantry", "drawer"] },
        { canonical: "tap", aliases: ["faucet", "water"] },
        { canonical: "soap", aliases: ["detergent", "sponge"] }
      ]
    },
    {
      id: "pl-en-2", lv: 1, pic: "🚿",
      place: "bathroom",
      prompt: "Name or type things you can find in a bathroom.",
      softGoal: 7,
      items: [
        { canonical: "sink", aliases: ["basin", "washbasin"] },
        { canonical: "mirror", aliases: [] },
        { canonical: "shower", aliases: ["shower head", "shower cubicle"] },
        { canonical: "bath", aliases: ["bathtub", "tub"] },
        { canonical: "toilet", aliases: ["wc", "loo", "lavatory"] },
        { canonical: "towel", aliases: ["towels"] },
        { canonical: "toothbrush", aliases: ["toothpaste"] },
        { canonical: "soap", aliases: ["shampoo", "shower gel"] },
        { canonical: "toilet paper", aliases: ["paper", "roll"] }
      ]
    },
    {
      id: "pl-en-3", lv: 2, pic: "🛏️",
      place: "bedroom",
      prompt: "Name or type things you can find in a bedroom.",
      softGoal: 6,
      items: [
        { canonical: "bed", aliases: ["mattress"] },
        { canonical: "pillow", aliases: ["pillows"] },
        { canonical: "blanket", aliases: ["sheets", "duvet", "quilt", "covers"] },
        { canonical: "wardrobe", aliases: ["closet", "cupboard"] },
        { canonical: "bedside table", aliases: ["nightstand", "side table"] },
        { canonical: "lamp", aliases: ["light", "bedside lamp"] },
        { canonical: "chair", aliases: [] },
        { canonical: "window", aliases: ["curtains", "blinds"] }
      ]
    },
    {
      id: "pl-en-4", lv: 2, pic: "🛋️",
      place: "living room",
      prompt: "Name or type things you can find in a living room or lounge.",
      softGoal: 6,
      items: [
        { canonical: "sofa", aliases: ["couch", "settee", "armchair"] },
        { canonical: "table", aliases: ["coffee table", "side table"] },
        { canonical: "chair", aliases: ["chairs", "armchair"] },
        { canonical: "television", aliases: ["tv", "screen"] },
        { canonical: "bookshelf", aliases: ["shelves", "books", "bookcase"] },
        { canonical: "rug", aliases: ["carpet", "mat"] },
        { canonical: "lamp", aliases: ["light"] },
        { canonical: "window", aliases: ["curtains"] }
      ]
    },
    {
      id: "pl-en-5", lv: 2, pic: "🌿",
      place: "garden",
      prompt: "Name or type things you can find in a garden.",
      softGoal: 6,
      items: [
        { canonical: "tree", aliases: ["trees", "plant", "bush"] },
        { canonical: "flower", aliases: ["flowers", "flower bed"] },
        { canonical: "grass", aliases: ["lawn"] },
        { canonical: "bench", aliases: ["seat"] },
        { canonical: "path", aliases: ["pathway", "walkway"] },
        { canonical: "fence", aliases: ["gate", "hedge"] },
        { canonical: "tools", aliases: ["spade", "rake", "watering can"] },
        { canonical: "table", aliases: ["garden table", "outdoor table"] }
      ]
    },
    {
      id: "pl-en-6", lv: 3, pic: "🚗",
      place: "garage",
      prompt: "Name or type things you can find in a garage.",
      softGoal: 5,
      items: [
        { canonical: "car", aliases: ["vehicle", "automobile"] },
        { canonical: "tools", aliases: ["toolbox", "hammer", "screwdriver"] },
        { canonical: "bicycle", aliases: ["bike"] },
        { canonical: "boxes", aliases: ["box", "storage boxes"] },
        { canonical: "shelf", aliases: ["shelves", "rack"] },
        { canonical: "door", aliases: ["garage door"] }
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
        { canonical: "book", aliases: ["books", "notebook", "pen"] },
        { canonical: "teacher", aliases: ["instructor"] },
        { canonical: "window", aliases: [] },
        { canonical: "clock", aliases: [] }
      ]
    }
  ]
};
