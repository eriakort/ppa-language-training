/*
 * Bilingual clinical scoring lexicons for the speech check-in:
 *   1. Kitchen Scene Information Content Units (12 canonical concepts)
 *   2. Animal semantic fluency dictionary (valid animals, perseverations, intrusions)
 *   3. Order-aware sentence repetition scoring (lexical coverage + LCS sequence order)
 *   4. Phonemic / letter fluency validation (F/P/L in IT, F/A/S in EN)
 */
(function () {
  "use strict";
  window.POG = window.POG || {};

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function toks(s) { return norm(s).split(" ").filter(Boolean); }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return d[m][n];
  }
  function near(w, h) {
    return h === w || (w.length >= 4 && lev(w, h) <= (w.length >= 7 ? 2 : 1));
  }

  /* ---------- 1. Kitchen scene Information Content Units (12 concepts) ---------- */
  var ICU_CONCEPTS = [
    { id: "cook", label: { it: "Persona / cuoca", en: "Cook / woman" },
      it: ["cuoca", "cuoco", "signora", "donna", "mamma", "persona", "uomo", "chef"],
      en: ["cook", "chef", "woman", "lady", "person", "mother", "man"] },
    { id: "pot", label: { it: "Cucina / pentola", en: "Cooking / pot" },
      it: ["cucina", "cucinare", "cucinando", "pentola", "fornelli", "fornello", "minestra", "zuppa", "brodo", "vapore", "fumo", "bolle"],
      en: ["cook", "cooking", "pot", "pan", "stove", "cooker", "soup", "stew", "steam", "smoke", "boil", "boiling"] },
    { id: "window", label: { it: "Finestra", en: "Window" },
      it: ["finestra", "finestre", "vetro"],
      en: ["window", "windows", "glass"] },
    { id: "sun", label: { it: "Sole", en: "Sun" },
      it: ["sole", "mattina", "giorno"],
      en: ["sun", "sunny", "sunshine", "morning", "day"] },
    { id: "clock", label: { it: "Orologio", en: "Clock" },
      it: ["orologio", "ora", "parete"],
      en: ["clock", "time", "wall"] },
    { id: "table", label: { it: "Tavolo", en: "Table" },
      it: ["tavolo", "tavola"],
      en: ["table"] },
    { id: "coffee", label: { it: "Caffè / tazza", en: "Coffee / cup" },
      it: ["caffe", "tazza", "tazzina", "colazione"],
      en: ["coffee", "cup", "mug", "tea", "breakfast"] },
    { id: "bread", label: { it: "Pane", en: "Bread" },
      it: ["pane", "pagnotta", "panino"],
      en: ["bread", "loaf", "toast", "roll"] },
    { id: "apple", label: { it: "Mela", en: "Apple" },
      it: ["mela", "mele", "frutta", "frutto"],
      en: ["apple", "apples", "fruit"] },
    { id: "cat", label: { it: "Gatto", en: "Cat" },
      it: ["gatto", "gatta", "gattino", "micio"],
      en: ["cat", "kitten", "kitty"] },
    { id: "milk", label: { it: "Latte", en: "Milk" },
      it: ["latte", "bicchiere", "ciotola", "beve", "bere", "bevendo"],
      en: ["milk", "bowl", "glass", "drink", "drinking", "drinks"] },
    { id: "child", label: { it: "Bambino", en: "Child / boy" },
      it: ["bambino", "bambina", "bimbo", "ragazzo", "ragazzino", "figlio"],
      en: ["child", "boy", "kid", "girl", "son"] }
  ];

  function nearIcu(w, h) {
    return h === w || (w.length >= 4 && h.charAt(0) === w.charAt(0) && lev(w, h) <= (w.length >= 7 ? 2 : 1));
  }

  function scoreIcu(lang, text) {
    var l = lang === "en" ? "en" : "it";
    var hs = toks(text);
    var matched = [];
    if (!hs.length) return { count: 0, total: ICU_CONCEPTS.length, matched: matched };
    ICU_CONCEPTS.forEach(function (c) {
      var words = c[l] || c.it;
      var ok = words.some(function (w) { return hs.some(function (h) { return nearIcu(w, h); }); });
      if (ok) matched.push(c.id);
    });
    return { count: matched.length, total: ICU_CONCEPTS.length, matched: matched };
  }

  /* ---------- 2. Bilingual animal fluency dictionary ---------- */
  /* Each entry is [canonical, ...variants]. Stored compactly and expanded once. */
  var ANIMAL_GROUPS = {
    it: [
      ["cane", "cani", "cagnolino", "cagnolini", "cagna"],
      ["gatto", "gatti", "gatta", "gattino", "gattini", "micio", "mici"],
      ["cavallo", "cavalli", "cavalla", "puledro", "puledri"],
      ["mucca", "mucche", "vacca", "vacche", "toro", "tori", "bue", "buoi", "vitello", "vitelli"],
      ["pecora", "pecore", "agnello", "agnelli", "montone"],
      ["capra", "capre", "capretto", "capretti"],
      ["maiale", "maiali", "porco", "porci", "cinghiale", "cinghiali", "suino"],
      ["asino", "asini", "mulo", "muli", "somaro"],
      ["coniglio", "conigli", "coniglia", "lepre", "lepri"],
      ["pollo", "polli", "gallina", "galline", "gallo", "galli", "pulcino", "pulcini"],
      ["anatra", "anatre", "papera", "papere", "oca", "oche", "cigno", "cigni"],
      ["tacchino", "tacchini"],
      ["colomba", "colombe", "piccione", "piccioni"],
      ["passero", "passeri", "uccello", "uccelli", "uccellino", "uccellini", "merlo", "merli", "rondine", "rondini", "pettirosso", "canarino", "canarini", "pappagallo", "pappagalli"],
      ["aquila", "aquile", "falco", "falchi", "gufo", "gufi", "civetta", "civette", "barbagianni", "poiana"],
      ["gabbiano", "gabbiani", "pellicano", "airone", "aironi", "fenicottero", "fenicotteri", "cicogna", "cicogne", "gru", "pinguino", "pinguini", "struzzo", "struzzi", "pavone", "pavoni", "corvo", "corvi", "gazza"],
      ["pesce", "pesci", "trota", "trote", "salmone", "salmoni", "tonno", "tonni", "merluzzo", "sardina", "sardine", "acciuga", "acciughe", "anguilla", "carpa", "pesce rosso"],
      ["squalo", "squali", "balena", "balene", "delfino", "delfini", "orca", "orche", "foca", "foche", "tricheco", "leone marino"],
      ["polpo", "polpi", "piovra", "calamaro", "calamari", "seppia", "seppie", "medusa", "meduse", "granchio", "granchi", "aragosta", "aragoste", "gambero", "gamberi", "cozza", "vongola", "ostrica", "stella marina", "riccio di mare", "cavalluccio"],
      ["tartaruga", "tartarughe", "testuggine"],
      ["rana", "rane", "rospo", "rospi", "girino", "girini", "salamandra", "tritone"],
      ["serpente", "serpenti", "biscia", "bisce", "vipera", "vipere", "cobra", "pitone", "boa"],
      ["lucertola", "lucertole", "geco", "camaleonte", "iguana", "coccodrillo", "coccodrilli", "alligatore"],
      ["topo", "topi", "topolino", "topolini", "ratto", "ratti", "criceto", "criceti", "porcellino", "scoiattolo", "scoiattoli", "castoro", "castori", "riccio", "ricci", "talpa", "talpe", "pipistrello", "pipistrelli"],
      ["volpe", "volpi", "lupo", "lupi", "lupa", "orso", "orsi", "orsa", "orsetto", "panda"],
      ["cervo", "cervi", "capriolo", "caprioli", "daino", "alce", "renna", "renne", "camoscio", "stambecco"],
      ["tasso", "faina", "donnola", "martora", "lontra", "lontre", "puzzola", "procione"],
      ["leone", "leoni", "leonessa", "tigre", "tigri", "leopardo", "leopardi", "pantera", "pantere", "giaguaro", "ghepardo", "lince", "puma"],
      ["elefante", "elefanti", "elefantessa", "giraffa", "giraffe", "zebra", "zebre", "rinoceronte", "rinoceronti", "ippopotamo", "ippopotami", "cammello", "cammelli", "dromedario", "lama", "alpaca", "canguro", "canguri", "koala", "bradipo", "armadillo", "formichiere"],
      ["scimmia", "scimmie", "scimpanze", "gorilla", "orango", "babbuino", "macaco", "lemure"],
      ["iena", "sciacallo", "antilope", "gazzella", "gnu", "bufalo", "bisonte", "yak"],
      ["farfalla", "farfalle", "falena", "bruco", "ape", "api", "vespa", "vespe", "calabrone", "bombo"],
      ["formica", "formiche", "mosca", "mosche", "zanzara", "zanzare", "scarafaggio", "scarabeo", "coccinella", "coccinelle", "grillo", "grilli", "cavalletta", "cavallette", "cicala", "cicale", "libellula", "lucciola", "mantide", "ragno", "ragni", "scorpione", "zecca", "pulce"],
      ["lumaca", "lumache", "chiocciola", "chiocciole", "verme", "vermi", "lombrico", "lombrichi"]
    ],
    en: [
      ["dog", "dogs", "puppy", "puppies", "hound"],
      ["cat", "cats", "kitten", "kittens", "kitty"],
      ["horse", "horses", "pony", "ponies", "mare", "stallion", "foal"],
      ["cow", "cows", "bull", "bulls", "ox", "oxen", "calf", "calves", "cattle"],
      ["sheep", "lamb", "lambs", "ram", "ewe"],
      ["goat", "goats", "kid"],
      ["pig", "pigs", "piglet", "hog", "boar", "swine"],
      ["donkey", "donkeys", "mule", "mules", "ass"],
      ["rabbit", "rabbits", "bunny", "bunnies", "hare", "hares"],
      ["chicken", "chickens", "hen", "hens", "rooster", "roosters", "cock", "chick", "chicks"],
      ["duck", "ducks", "duckling", "goose", "geese", "swan", "swans"],
      ["turkey", "turkeys"],
      ["pigeon", "pigeons", "dove", "doves"],
      ["bird", "birds", "sparrow", "sparrows", "robin", "robins", "swallow", "blackbird", "canary", "parrot", "parrots", "budgie", "crow", "crows", "raven", "magpie", "jay", "finch", "wren", "thrush", "starling"],
      ["eagle", "eagles", "hawk", "hawks", "falcon", "falcons", "owl", "owls"],
      ["seagull", "seagulls", "gull", "gulls", "pelican", "heron", "flamingo", "stork", "crane", "penguin", "penguins", "ostrich", "peacock", "puffin"],
      ["fish", "fishes", "trout", "salmon", "tuna", "cod", "sardine", "sardines", "herring", "eel", "carp", "goldfish"],
      ["shark", "sharks", "whale", "whales", "dolphin", "dolphins", "orca", "seal", "seals", "walrus", "sea lion"],
      ["octopus", "squid", "jellyfish", "crab", "crabs", "lobster", "lobsters", "shrimp", "prawn", "prawns", "clam", "mussel", "oyster", "starfish"],
      ["turtle", "turtles", "tortoise", "tortoises"],
      ["frog", "frogs", "toad", "toads", "tadpole", "salamander", "newt"],
      ["snake", "snakes", "viper", "cobra", "python", "boa", "adder", "rattlesnake"],
      ["lizard", "lizards", "gecko", "chameleon", "iguana", "crocodile", "crocodiles", "alligator", "alligators"],
      ["mouse", "mice", "rat", "rats", "hamster", "hamsters", "guinea pig", "squirrel", "squirrels", "beaver", "beavers", "hedgehog", "hedgehogs", "mole", "moles", "bat", "bats", "gerbil", "ferret"],
      ["fox", "foxes", "wolf", "wolves", "bear", "bears", "panda", "pandas", "polar bear"],
      ["deer", "stag", "fawn", "elk", "moose", "reindeer", "caribou"],
      ["badger", "otter", "otters", "weasel", "stoat", "raccoon", "raccoons", "skunk"],
      ["lion", "lions", "tiger", "tigers", "leopard", "leopards", "panther", "panthers", "jaguar", "cheetah", "lynx", "cougar", "puma"],
      ["elephant", "elephants", "giraffe", "giraffes", "zebra", "zebras", "rhino", "rhinoceros", "hippo", "hippopotamus", "camel", "camels", "llama", "alpaca", "kangaroo", "kangaroos", "koala", "sloth", "armadillo", "anteater"],
      ["monkey", "monkeys", "ape", "apes", "chimp", "chimpanzee", "gorilla", "gorillas", "orangutan", "baboon", "lemur"],
      ["hyena", "jackal", "antelope", "gazelle", "buffalo", "bison", "yak", "wildebeest"],
      ["butterfly", "butterflies", "moth", "caterpillar", "bee", "bees", "wasp", "wasps", "hornet", "bumblebee"],
      ["ant", "ants", "fly", "flies", "mosquito", "mosquitoes", "beetle", "beetles", "ladybird", "ladybug", "cockroach", "cricket", "grasshopper", "cicada", "dragonfly", "firefly", "mantis", "spider", "spiders", "scorpion", "flea", "tick"],
      ["snail", "snails", "slug", "slugs", "worm", "worms", "earthworm"]
    ]
  };

  var ANIMAL_LOOKUP = { it: {}, en: {}, itList: [], enList: [] };
  ["it", "en"].forEach(function (l) {
    ANIMAL_GROUPS[l].forEach(function (grp) {
      var canon = grp[0];
      grp.forEach(function (w) {
        var nw = norm(w);
        if (!nw || nw.indexOf(" ") >= 0) return;
        ANIMAL_LOOKUP[l][nw] = canon;
        ANIMAL_LOOKUP[l + "List"].push(nw);
      });
    });
  });

  function matchAnimal(lang, word) {
    var l = lang === "en" ? "en" : "it";
    var map = ANIMAL_LOOKUP[l];
    if (map[word]) return map[word];
    if (word.length < 4) return null;
    var list = ANIMAL_LOOKUP[l + "List"];
    for (var i = 0; i < list.length; i++) {
      if (near(list[i], word)) return map[list[i]];
    }
    return null;
  }

  function scoreAnimals(lang, text, stopWords) {
    var stop = {};
    (stopWords || []).forEach(function (s) { stop[norm(s)] = true; });
    var words = toks(text);
    var seen = {}, unique = [], repeats = 0, intrusions = 0, intrusionList = [];
    words.forEach(function (w) {
      if (w.length < 3 || stop[w]) return;
      var canon = matchAnimal(lang, w);
      if (canon) {
        if (seen[canon]) repeats++;
        else { seen[canon] = true; unique.push(canon); }
      } else {
        intrusions++;
        intrusionList.push(w);
      }
    });
    return { count: unique.length, repeats: repeats, intrusions: intrusions, words: unique, intrusionWords: intrusionList };
  }

  /* ---------- 3. Order-aware sentence repetition scoring ---------- */
  function scoreRepetition(target, heard) {
    var tw = toks(target).filter(function (w) { return w.length >= 2; });
    var hs = toks(heard);
    if (!tw.length) return { score: 0, coverage: 0, order: 0 };
    if (!hs.length) return { score: 0, coverage: 0, order: 0 };
    var cov = tw.filter(function (w) { return hs.some(function (h) { return near(w, h); }); }).length / tw.length;
    /* Longest common subsequence using lenient word matching to capture word-order preservation. */
    var m = tw.length, n = hs.length, dp = [], i, j;
    for (i = 0; i <= m; i++) { dp[i] = []; for (j = 0; j <= n; j++) dp[i][j] = 0; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        dp[i][j] = near(tw[i - 1], hs[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    var ord = dp[m][n] / m;
    var score = Math.round((0.7 * cov + 0.3 * ord) * 100) / 100;
    return { score: score, coverage: Math.round(cov * 100) / 100, order: Math.round(ord * 100) / 100 };
  }

  /* ---------- 4. Phonemic / letter fluency ---------- */
  var LETTER_TARGETS = { it: ["F", "P", "L"], en: ["F", "A", "S"] };
  function scoreLetterFluency(lang, letter, text, stopWords) {
    var target = norm(letter).slice(0, 1);
    var stop = {};
    (stopWords || []).forEach(function (s) { stop[norm(s)] = true; });
    var words = toks(text);
    var seen = {}, unique = [], repeats = 0, intrusions = 0;
    words.forEach(function (w) {
      if (w.length < 3 || stop[w]) return;
      if (target && w.charAt(0) === target) {
        if (seen[w]) repeats++;
        else { seen[w] = true; unique.push(w); }
      } else {
        intrusions++;
      }
    });
    return { letter: (letter || target).toUpperCase(), count: unique.length, repeats: repeats, intrusions: intrusions, words: unique };
  }

  window.POG.checkinLexicon = {
    ICU_CONCEPTS: ICU_CONCEPTS,
    LETTER_TARGETS: LETTER_TARGETS,
    scoreIcu: scoreIcu,
    scoreAnimals: scoreAnimals,
    scoreRepetition: scoreRepetition,
    scoreLetterFluency: scoreLetterFluency
  };
})();
