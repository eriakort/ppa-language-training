/*
 * Bilingual Spoken Message & Pragmatic Discourse Comprehension Bank.
 * Trains auditory working memory, multi-detail extraction, and supported written-keyword rescue
 * for lvPPA, svPPA, and everyday caregiver communication.
 *
 * Levels: 1 = denser multi-clause messages, 2 = medium 2-detail messages, 3 = short clear messages.
 */
window.POG = window.POG || {};
(function (C) {
  C.DISCOURSE = {
    it: [
      /* Level 1 */
      {
        id: "dc_it_1", lv: 1, kind: "clinic", pic: "🏥",
        speakerTitle: "Segreteria dell'ambulatorio",
        spokenText: "Buongiorno, chiamiamo dall'ambulatorio di neurologia. L'appuntamento di giovedì è spostato alle dieci e trenta nella stanza tre. Ricordi di portare la lista delle medicine.",
        keywords: ["giovedì", "10:30 · stanza 3", "lista medicine"],
        question: "A che ora è spostato l'appuntamento e cosa bisogna portare?",
        opts: ["Alle 10:30, lista delle medicine", "Alle 15:00, esami del sangue", "Alle 10:30, tessera dell'autobus", "Venerdì alle 9:00, ricetta vecchia"],
        ans: 0,
        explanation: "La visita è giovedì alle 10:30 (stanza 3) e serve la lista delle medicine."
      },
      {
        id: "dc_it_2", lv: 1, kind: "pharmacy", pic: "💊",
        speakerTitle: "Farmacista",
        spokenText: "La compressa bianca va presa la mattina prima di colazione con un bicchiere d'acqua, mentre quella piccola blu si prende solo la sera dopo cena.",
        keywords: ["bianca: mattina (prima colazione)", "blu: sera (dopo cena)"],
        question: "Quando va presa la compressa piccola blu?",
        opts: ["Solo la sera dopo cena", "La mattina prima di colazione", "A pranzo con il caffè", "Due volte al giorno a digiuno"],
        ans: 0,
        explanation: "La compressa bianca è per la mattina; quella blu solo la sera dopo cena."
      },
      {
        id: "dc_it_3", lv: 1, kind: "family", pic: "🏡",
        speakerTitle: "Messaggio vocale familiare",
        spokenText: "Ciao, passo a prenderti alle quattro meno un quarto per andare a prendere il pane, poi passiamo dal bar vicino alla piazza.",
        keywords: ["ore 15:45", "prendere il pane", "bar vicino alla piazza"],
        question: "A che ora passa a prenderti e dove andate prima?",
        opts: ["Alle 15:45, prima per il pane", "Alle 16:30, prima in farmacia", "Alle 15:45, subito al supermercato", "Alle 17:00, dal dottore"],
        ans: 0,
        explanation: "Passa alle quattro meno un quarto (15:45) e la prima tappa è il pane."
      },
      {
        id: "dc_it_4", lv: 1, kind: "errand", pic: "🚌",
        speakerTitle: "Avviso alla fermata",
        spokenText: "Attenzione: oggi l'autobus sette non ferma davanti alla posta per lavori stradali, ma si ferma cinquanta metri più avanti davanti alla farmacia.",
        keywords: ["bus 7", "lavori davanti alla posta", "ferma alla farmacia"],
        question: "Dove si ferma oggi l'autobus sette?",
        opts: ["Davanti alla farmacia", "Davanti alla posta", "Solo alla stazione", "Non passa per tutto il giorno"],
        ans: 0,
        explanation: "Per lavori davanti alla posta, oggi il bus 7 ferma davanti alla farmacia."
      },
      /* Level 2 */
      {
        id: "dc_it_5", lv: 2, kind: "clinic", pic: "🧪",
        speakerTitle: "Infermiera",
        spokenText: "Domani mattina per il prelievo venga a digiuno dalle sette alle nove. Può bere solo acqua.",
        keywords: ["domani 7:00–9:00", "a digiuno", "solo acqua"],
        question: "Cosa può bere prima del prelievo di domani?",
        opts: ["Solo acqua", "Un caffè zuccherato", "Latte e fette biscottate", "Succo d'arancia"],
        ans: 0,
        explanation: "Prima del prelievo (7:00–9:00) si deve restare a digiuno bevendo solo acqua."
      },
      {
        id: "dc_it_6", lv: 2, kind: "family", pic: "🛒",
        speakerTitle: "Telefonata da casa",
        spokenText: "Quando passi dal mercato compra mezzo chilo di mele e una bottiglia di olio d'oliva. Il pane l'ho già preso io.",
        keywords: ["mezzo chilo mele", "olio d'oliva", "pane già preso"],
        question: "Che cosa devi comprare al mercato?",
        opts: ["Mele e olio d'oliva", "Solo il pane fresco", "Latte e biscotti", "Pomodori e pasta"],
        ans: 0,
        explanation: "Il pane è già stato preso: servono mezzo chilo di mele e olio d'oliva."
      },
      {
        id: "dc_it_7", lv: 2, kind: "home", pic: "🔧",
        speakerTitle: "Portiere",
        spokenText: "L'idraulico arriverà martedì pomeriggio alle tre per controllare il rubinetto della cucina.",
        keywords: ["martedì", "ore 15:00", "rubinetto cucina"],
        question: "Quando viene l'idraulico?",
        opts: ["Martedì alle 15:00", "Lunedì mattina", "Giovedì alle 18:00", "Mercoledì a mezzogiorno"],
        ans: 0,
        explanation: "L'idraulico è atteso martedì pomeriggio alle tre (15:00)."
      },
      {
        id: "dc_it_8", lv: 2, kind: "pharmacy", pic: "📦",
        speakerTitle: "Avviso farmacia",
        spokenText: "Le sue gocce per gli occhi sono arrivate. Può ritirarle oggi fino alle diciannove e trenta.",
        keywords: ["gocce pronte", "ritiro oggi fino 19:30"],
        question: "Fino a che ora puoi ritirare le gocce oggi?",
        opts: ["Fino alle 19:30", "Solo domani mattina", "Fino alle 12:00", "Vengono spedite a casa"],
        ans: 0,
        explanation: "Le gocce sono arrivate e si possono ritirare oggi entro le 19:30."
      },
      /* Level 3 */
      {
        id: "dc_it_9", lv: 3, kind: "family", pic: "☕",
        speakerTitle: "Familiare",
        spokenText: "Ti preparo un tè caldo e due biscotti.",
        keywords: ["tè caldo", "due biscotti"],
        question: "Cosa ti sta preparando?",
        opts: ["Un tè caldo e biscotti", "Una minestra calda", "Un caffè freddo", "Acqua e limone"],
        ans: 0,
        explanation: "Ti sta preparando un tè caldo con due biscotti."
      },
      {
        id: "dc_it_10", lv: 3, kind: "home", pic: "🔑",
        speakerTitle: "Promemoria",
        spokenText: "Le chiavi di casa sono nel cestino vicino alla porta.",
        keywords: ["chiavi", "cestino vicino alla porta"],
        question: "Dove sono le chiavi?",
        opts: ["Nel cestino vicino alla porta", "Sul tavolo della cucina", "Dentro la borsa blu", "In tasca al cappotto"],
        ans: 0,
        explanation: "Le chiavi di casa sono nel cestino accanto alla porta."
      },
      {
        id: "dc_it_11", lv: 3, kind: "clinic", pic: "🩺",
        speakerTitle: "Dottore",
        spokenText: "Si sieda pure sulla sedia blu, arrivo subito.",
        keywords: ["sedia blu", "arrivo subito"],
        question: "Dove ti chiede di sederti?",
        opts: ["Sulla sedia blu", "In sala d'attesa fuori", "Sul lettino grande", "Vicino alla finestra"],
        ans: 0,
        explanation: "Ti chiede di accomodarti sulla sedia blu."
      },
      {
        id: "dc_it_12", lv: 3, kind: "family", pic: "🎂",
        speakerTitle: "Nipote",
        spokenText: "Domenica pranziamo tutti insieme da nonna.",
        keywords: ["domenica", "pranzo da nonna"],
        question: "Quando pranzate insieme?",
        opts: ["Domenica", "Sabato sera", "Lunedì mattina", "Venerdì pomeriggio"],
        ans: 0,
        explanation: "Il pranzo di famiglia è domenica dalla nonna."
      }
    ],
    en: [
      /* Level 1 */
      {
        id: "dc_en_1", lv: 1, kind: "clinic", pic: "🏥",
        speakerTitle: "Clinic reception",
        spokenText: "Hello, this is neurology reception calling. Your Thursday visit has moved to ten thirty in room three. Please remember to bring your medication list.",
        keywords: ["Thursday 10:30", "room 3", "medication list"],
        question: "When is the visit now, and what should you bring?",
        opts: ["Thursday at 10:30, medication list", "Friday at 2:00, bus pass", "Thursday at 10:30, blood test slip", "Wednesday at 9:00, glasses"],
        ans: 0,
        explanation: "The appointment moved to Thursday at 10:30 (room 3); bring your medication list."
      },
      {
        id: "dc_en_2", lv: 1, kind: "pharmacy", pic: "💊",
        speakerTitle: "Pharmacist",
        spokenText: "Take the white tablet every morning before breakfast with a full glass of water, and take the small blue tablet only at bedtime after dinner.",
        keywords: ["white: morning before breakfast", "blue: bedtime after dinner"],
        question: "When should you take the small blue tablet?",
        opts: ["Only at bedtime after dinner", "Every morning before breakfast", "Twice a day with coffee", "Right at noon with lunch"],
        ans: 0,
        explanation: "The white pill is for morning; the small blue pill is only at bedtime after dinner."
      },
      {
        id: "dc_en_3", lv: 1, kind: "family", pic: "🏡",
        speakerTitle: "Family voicemail",
        spokenText: "Hi, I will pick you up at quarter to four to get fresh bread at the bakery, and then we can stop for tea by the park.",
        keywords: ["3:45 PM", "bakery for bread", "tea by park"],
        question: "What time is pick-up and where are you stopping first?",
        opts: ["At 3:45, bakery for bread", "At 4:15, post office", "At 3:45, pharmacy first", "At 5:00, train station"],
        ans: 0,
        explanation: "Pick-up is at quarter to four (3:45), heading to the bakery first."
      },
      {
        id: "dc_en_4", lv: 1, kind: "errand", pic: "🚌",
        speakerTitle: "Bus stop notice",
        spokenText: "Please note that today bus number seven is skipping the post office stop due to roadworks and will stop fifty yards further down outside the chemist.",
        keywords: ["bus 7", "roadworks at post office", "stops at chemist"],
        question: "Where will bus seven stop today instead?",
        opts: ["Outside the chemist", "At the post office", "Only at the main station", "Not running today"],
        ans: 0,
        explanation: "Because of roadworks at the post office, bus 7 stops outside the chemist."
      },
      /* Level 2 */
      {
        id: "dc_en_5", lv: 2, kind: "clinic", pic: "🧪",
        speakerTitle: "Clinic nurse",
        spokenText: "For tomorrow's blood test please come between seven and nine without eating breakfast. Plain water is fine to drink.",
        keywords: ["tomorrow 7–9 AM", "no breakfast", "plain water ok"],
        question: "What may you drink before tomorrow's blood test?",
        opts: ["Plain water only", "Coffee with milk", "Orange juice", "Tea and toast"],
        ans: 0,
        explanation: "Before the morning fasting blood test (7–9 AM), only plain water is allowed."
      },
      {
        id: "dc_en_6", lv: 2, kind: "family", pic: "🛒",
        speakerTitle: "Phone message",
        spokenText: "When you walk past the shop please grab four apples and a bottle of olive oil. I already bought the bread.",
        keywords: ["4 apples", "olive oil", "bread already bought"],
        question: "What two things should you pick up?",
        opts: ["Apples and olive oil", "Bread and butter", "Milk and sugar", "Tea bags and eggs"],
        ans: 0,
        explanation: "Bread is already sorted — you need four apples and olive oil."
      },
      {
        id: "dc_en_7", lv: 2, kind: "home", pic: "🔧",
        speakerTitle: "Building notice",
        spokenText: "The plumber is coming on Tuesday afternoon at three o'clock to check the kitchen tap.",
        keywords: ["Tuesday", "3:00 PM", "kitchen tap"],
        question: "When is the plumber expected?",
        opts: ["Tuesday at 3:00 PM", "Monday morning", "Thursday at 6:00 PM", "Friday at noon"],
        ans: 0,
        explanation: "The plumber is booked for Tuesday afternoon at 3:00 PM."
      },
      {
        id: "dc_en_8", lv: 2, kind: "pharmacy", pic: "📦",
        speakerTitle: "Chemist message",
        spokenText: "Your eye drops are ready for collection today until half past seven this evening.",
        keywords: ["eye drops ready", "collect until 7:30 PM"],
        question: "Until what time can you pick up the eye drops today?",
        opts: ["Until 7:30 PM", "Until noon only", "Only tomorrow morning", "They are mailed home"],
        ans: 0,
        explanation: "The eye drops are ready today until 7:30 PM."
      },
      /* Level 3 */
      {
        id: "dc_en_9", lv: 3, kind: "family", pic: "☕",
        speakerTitle: "Partner",
        spokenText: "I'm making you a warm cup of tea and two biscuits.",
        keywords: ["warm tea", "two biscuits"],
        question: "What is being made for you?",
        opts: ["Warm tea and biscuits", "Cold coffee", "Vegetable soup", "Juice and fruit"],
        ans: 0,
        explanation: "Warm tea with two biscuits is being prepared."
      },
      {
        id: "dc_en_10", lv: 3, kind: "home", pic: "🔑",
        speakerTitle: "Reminder",
        spokenText: "The house keys are in the small basket beside the front door.",
        keywords: ["keys", "basket by front door"],
        question: "Where are the house keys?",
        opts: ["In the basket by the front door", "On the kitchen counter", "Inside the blue bag", "In the bedroom"],
        ans: 0,
        explanation: "The keys are in the basket next to the front door."
      },
      {
        id: "dc_en_11", lv: 3, kind: "clinic", pic: "🩺",
        speakerTitle: "Doctor",
        spokenText: "Please have a seat on the blue chair and I will be right with you.",
        keywords: ["blue chair", "be right back"],
        question: "Where are you asked to sit?",
        opts: ["On the blue chair", "Outside in the corridor", "By the front desk", "Near the window"],
        ans: 0,
        explanation: "The doctor asks you to sit on the blue chair."
      },
      {
        id: "dc_en_12", lv: 3, kind: "family", pic: "🎂",
        speakerTitle: "Grandchild",
        spokenText: "On Sunday we are all having lunch together at Grandma's house.",
        keywords: ["Sunday", "lunch at Grandma's"],
        question: "Which day is family lunch?",
        opts: ["Sunday", "Saturday night", "Monday afternoon", "Friday morning"],
        ans: 0,
        explanation: "Family lunch is on Sunday at Grandma's house."
      }
    ]
  };
})(window.POG.content = window.POG.content || {});
