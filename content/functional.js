/*
 * Everyday functional reading & written communication content (bilingual: IT & EN).
 * Targets written comprehension across real-world materials (clinic reminders, medicine labels,
 * family notes, transit/shop schedules, and reply choices), with exact inline clue highlighting.
 * Level convention: 1 = most demanding, 3 = most support.
 */
window.POG = window.POG || {};
window.POG.content = window.POG.content || {};

window.POG.content.FUNCTIONAL = {
  it: [
    /* Level 1: multi-detail schedules, prescriptions, SMS replies */
    {
      id: "f1", lv: 1, icon: "🏥", tag: "Appuntamento",
      title: "Promemoria ambulatorio",
      passage: "Visita neurologica giovedì 14 maggio alle 10:30 al secondo piano, stanza 204. Portare l'elenco delle medicine attuali e arrivare 15 minuti prima.",
      highlight: "stanza 204",
      question: "In quale stanza devi andare per la visita?",
      choices: ["Stanza 204", "Stanza 103", "Stanza 215", "Piano terra"],
      ans: 0,
      explanation: "Il biglietto indica secondo piano, stanza 204."
    },
    {
      id: "f2", lv: 1, icon: "💊", tag: "Farmaci",
      title: "Etichetta della farmacia",
      passage: "Prendere una compressa al mattino dopo colazione e mezza compressa la sera prima di dormire. Non assumere a stomaco vuoto.",
      highlight: "dopo colazione",
      question: "Quando va presa la compressa intera?",
      choices: ["Al mattino dopo colazione", "Prima di colazione", "A mezzogiorno prima di pranzo", "Solo prima di dormire"],
      ans: 0,
      explanation: "L'etichetta dice di prendere una compressa al mattino dopo colazione."
    },
    {
      id: "f3", lv: 1, icon: "💬", tag: "Messaggio",
      title: "Messaggio da Marta",
      passage: "Ciao! Passo alle 17:00 per portarti il pane. Se ti serve anche il latte scrivimi pure prima delle 16:00.",
      highlight: "scrivimi pure prima delle 16:00",
      question: "Qual è la risposta giusta se hai bisogno del latte?",
      choices: ["Sì, grazie! Portami anche un litro di latte.", "Sono già andato a dormire ieri sera.", "Il treno parte dal binario tre.", "Ho comprato le scarpe nuove venerdì."],
      ans: 0,
      explanation: "Rispondi chiedendo di portare anche il latte prima delle 16:00."
    },
    {
      id: "f4", lv: 1, icon: "🚆", tag: "Orari",
      title: "Tabellone stazione",
      passage: "Regionale per Bologna: partenza 09:20 dal binario 4. Il treno delle 09:45 per Parma parte dal binario 2 con dieci minuti di ritardo.",
      highlight: "binario 4",
      question: "Da quale binario parte il treno per Bologna?",
      choices: ["Binario 4", "Binario 2", "Binario 9", "Binario 10"],
      ans: 0,
      explanation: "Il tabellone segna il treno per Bologna alle 09:20 dal binario 4."
    },

    /* Level 2: 2-sentence everyday notes and signs */
    {
      id: "f5", lv: 2, icon: "🗒️", tag: "Nota in casa",
      title: "Biglietto sul tavolo",
      passage: "Sono uscito a comprare la frutta e torno alle undici. La minestra è già pronta in frigorifero, sul ripiano alto.",
      highlight: "sul ripiano alto",
      question: "Dove si trova la minestra?",
      choices: ["In frigorifero, sul ripiano alto", "Sul tavolo della cucina", "Dentro il forno spento"],
      ans: 0,
      explanation: "La nota avvisa che la minestra è sul ripiano alto del frigorifero."
    },
    {
      id: "f6", lv: 2, icon: "🛒", tag: "Negozio",
      title: "Cartello della panetteria",
      passage: "Orario estivo: aperto dal lunedì al sabato dalle 7:30 alle 13:00. Domenica chiuso tutto il giorno.",
      highlight: "Domenica chiuso",
      question: "In quale giorno la panetteria è chiusa?",
      choices: ["Domenica", "Sabato mattina", "Lunedì"],
      ans: 0,
      explanation: "Il cartello indica che la domenica resta chiusa tutto il giorno."
    },
    {
      id: "f7", lv: 2, icon: "🍲", tag: "Cucina",
      title: "Ricetta veloce",
      passage: "Mettere l'acqua a bollire con un pizzico di sale. Cuocere la pasta per nove minuti e poi condire con olio fresco.",
      highlight: "nove minuti",
      question: "Per quanto tempo cuoce la pasta?",
      choices: ["Nove minuti", "Venticinque minuti", "Due minuti"],
      ans: 0,
      explanation: "La ricetta indica nove minuti di cottura."
    },
    {
      id: "f8", lv: 2, icon: "📞", tag: "Messaggio",
      title: "Avviso del fisioterapista",
      passage: "Domani la seduta delle 15:00 è spostata alle 16:30 nello stesso studio. Se va bene, rispondi sì.",
      highlight: "spostata alle 16:30",
      question: "A che ora è l'appuntamento domani?",
      choices: ["Alle 16:30", "Alle 15:00", "Alle 10:00"],
      ans: 0,
      explanation: "L'orario è stato spostato alle 16:30."
    },

    /* Level 3: concise signs, labels, brief reminders */
    {
      id: "f9", lv: 3, icon: "🚪", tag: "Cartello",
      title: "Ingresso studio",
      passage: "Suonare il campanello rosso e attendere seduti in sala d'aspetto.",
      highlight: "campanello rosso",
      question: "Cosa bisogna suonare per entrare?",
      choices: ["Il campanello rosso", "La finestra chiusa", "Il citofono blu"],
      ans: 0,
      explanation: "Il cartello chiede di suonare il campanello rosso."
    },
    {
      id: "f10", lv: 3, icon: "🥛", tag: "Scadenza",
      title: "Confezione di latte",
      passage: "Conservare in frigorifero. Consumare entro il 22 novembre.",
      highlight: "in frigorifero",
      question: "Dove va conservato il latte?",
      choices: ["In frigorifero", "Sopra il termosifone", "Nel cassetto delle posate"],
      ans: 0,
      explanation: "La confezione va tenuta in frigorifero."
    },
    {
      id: "f11", lv: 3, icon: "🔑", tag: "Nota",
      title: "Promemoria porta",
      passage: "Prima di uscire controlla di avere chiavi, occhiali e telefono.",
      highlight: "chiavi, occhiali e telefono",
      question: "Quale oggetto devi controllare prima di uscire?",
      choices: ["Le chiavi", "L'aspirapolvere", "La pentola"],
      ans: 0,
      explanation: "Il promemoria ricorda chiavi, occhiali e telefono."
    },
    {
      id: "f12", lv: 3, icon: "☕", tag: "Messaggio",
      title: "Invito di Paolo",
      passage: "Vuoi prendere un caffè al bar sotto casa alle dieci?",
      highlight: "un caffè",
      question: "Cosa ti propone Paolo?",
      choices: ["Di prendere un caffè", "Di andare in piscina", "Di dipingere la porta"],
      ans: 0,
      explanation: "Paolo propone di prendere un caffè alle dieci."
    }
  ],
  en: [
    /* Level 1 */
    {
      id: "f1", lv: 1, icon: "🏥", tag: "Appointment",
      title: "Clinic reminder",
      passage: "Neurology follow-up on Thursday 14 May at 10:30 on the second floor, Room 204. Please bring your current medicine list and arrive 15 minutes early.",
      highlight: "Room 204",
      question: "Which room do you go to for the visit?",
      choices: ["Room 204", "Room 103", "Room 215", "Ground floor"],
      ans: 0,
      explanation: "The reminder lists the second floor, Room 204."
    },
    {
      id: "f2", lv: 1, icon: "💊", tag: "Medicine",
      title: "Pharmacy label",
      passage: "Take one tablet in the morning after breakfast and half a tablet at bedtime. Do not take on an empty stomach.",
      highlight: "after breakfast",
      question: "When should you take the full tablet?",
      choices: ["In the morning after breakfast", "Before breakfast", "At noon before lunch", "Only at bedtime"],
      ans: 0,
      explanation: "The label instructs one tablet in the morning after breakfast."
    },
    {
      id: "f3", lv: 1, icon: "💬", tag: "Message",
      title: "Text from Martha",
      passage: "Hi! I'm stopping by at 5:00 pm to drop off bread. Text me before 4:00 pm if you also need milk.",
      highlight: "before 4:00 pm",
      question: "Which reply makes sense if you need milk?",
      choices: ["Yes please! Could you bring a carton of milk too?", "I already went to sleep last Tuesday.", "The blue train leaves from platform three.", "We bought new garden boots yesterday."],
      ans: 0,
      explanation: "Replying directly asks Martha to bring milk as well."
    },
    {
      id: "f4", lv: 1, icon: "🚆", tag: "Schedule",
      title: "Station departure board",
      passage: "The 09:20 train to Oxford departs from Platform 4. The 09:45 train to Reading departs from Platform 2 with a ten-minute delay.",
      highlight: "Platform 4",
      question: "Which platform does the Oxford train leave from?",
      choices: ["Platform 4", "Platform 2", "Platform 9", "Platform 10"],
      ans: 0,
      explanation: "The board shows the 09:20 train to Oxford on Platform 4."
    },

    /* Level 2 */
    {
      id: "f5", lv: 2, icon: "🗒️", tag: "Home note",
      title: "Note on the kitchen table",
      passage: "I popped out to buy fruit and will be back at eleven. The soup is ready in the fridge, on the top shelf.",
      highlight: "on the top shelf",
      question: "Where is the soup kept?",
      choices: ["In the fridge, on the top shelf", "On the kitchen table", "Inside the oven"],
      ans: 0,
      explanation: "The note says the soup is on the top shelf of the fridge."
    },
    {
      id: "f6", lv: 2, icon: "🛒", tag: "Shop sign",
      title: "Bakery hours",
      passage: "Summer hours: open Monday to Saturday from 7:30 am to 1:00 pm. Closed all day Sunday.",
      highlight: "Closed all day Sunday",
      question: "On which day is the bakery closed?",
      choices: ["Sunday", "Saturday morning", "Monday"],
      ans: 0,
      explanation: "The sign states it is closed all day on Sunday."
    },
    {
      id: "f7", lv: 2, icon: "🍲", tag: "Cooking",
      title: "Quick recipe card",
      passage: "Bring a pot of water to the boil with a pinch of salt. Simmer the pasta for nine minutes, then toss with olive oil.",
      highlight: "nine minutes",
      question: "How long should the pasta cook?",
      choices: ["Nine minutes", "Twenty-five minutes", "Two minutes"],
      ans: 0,
      explanation: "The recipe card states nine minutes."
    },
    {
      id: "f8", lv: 2, icon: "📞", tag: "Message",
      title: "Physiotherapist message",
      passage: "Tomorrow's 3:00 pm session has moved to 4:30 pm in the same room. Reply yes if that works for you.",
      highlight: "moved to 4:30 pm",
      question: "What time is tomorrow's appointment?",
      choices: ["4:30 pm", "3:00 pm", "10:00 am"],
      ans: 0,
      explanation: "The session was moved to 4:30 pm."
    },

    /* Level 3 */
    {
      id: "f9", lv: 3, icon: "🚪", tag: "Sign",
      title: "Clinic entrance",
      passage: "Please ring the red bell and take a seat in the waiting room.",
      highlight: "red bell",
      question: "What should you ring to enter?",
      choices: ["The red bell", "The closed window", "The blue gate"],
      ans: 0,
      explanation: "The sign asks visitors to ring the red bell."
    },
    {
      id: "f10", lv: 3, icon: "🥛", tag: "Label",
      title: "Milk carton",
      passage: "Keep refrigerated. Use by 22 November.",
      highlight: "Keep refrigerated",
      question: "Where should the milk be stored?",
      choices: ["In the fridge", "Next to the radiator", "In the cutlery drawer"],
      ans: 0,
      explanation: "Keep refrigerated means storing it in the fridge."
    },
    {
      id: "f11", lv: 3, icon: "🔑", tag: "Reminder",
      title: "Front door checklist",
      passage: "Before going out, check you have your keys, glasses, and phone.",
      highlight: "keys, glasses, and phone",
      question: "Which item should you check before leaving?",
      choices: ["Your keys", "The vacuum cleaner", "The soup pot"],
      ans: 0,
      explanation: "The checklist reminds you about keys, glasses, and phone."
    },
    {
      id: "f12", lv: 3, icon: "☕", tag: "Message",
      title: "Paul's invitation",
      passage: "Would you like to meet for a coffee at the café downstairs at ten?",
      highlight: "for a coffee",
      question: "What does Paul suggest doing?",
      choices: ["Meeting for a coffee", "Going swimming", "Painting the front door"],
      ans: 0,
      explanation: "Paul invites you for a coffee at ten."
    }
  ]
};
