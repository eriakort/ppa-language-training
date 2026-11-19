/*
 * Bilingual Action-Verb & Thematic Role Bank (VNeST: Verb Network Strengthening Treatment).
 * Strengthens Agent + Action Verb + Patient/Object + Location frames and thematic plausibility
 * for non-fluent (nfvPPA verb-retrieval deficit) and semantic (svPPA thematic loss) profiles.
 *
 * Levels follow app convention: 1 = abstract/multi-step/closer foils, 3 = highly concrete everyday verbs.
 */
(function () {
  "use strict";
  var POG = window.POG = window.POG || {};
  POG.content = POG.content || {};

  POG.content.VERBS = {
    it: [
      {
        id: "vb_it_1", lv: 1, icon: "📅", verb: "PRENOTARE",
        prompt: "Chi prenota e cosa prenota per una visita?",
        agents: [
          { text: "il paziente", ok: true },
          { text: "l'ombrello", ok: false },
          { text: "la scala", ok: false }
        ],
        patients: [
          { text: "l'appuntamento", ok: true },
          { text: "la nuvola", ok: false },
          { text: "il cuscino", ok: false }
        ],
        where: "in ambulatorio",
        sentence: "Il paziente prenota l'appuntamento in ambulatorio.",
        plausibility: { text: "Può un paziente prenotare un esame del sangue?", ok: true, explain: "Sì: il paziente organizza visite ed esami medici." },
        cue: "Pensa a chi deve organizzare una visita prima di andare dal medico."
      },
      {
        id: "vb_it_2", lv: 1, icon: "🩺", verb: "VISITARE",
        prompt: "Chi svolge questa azione e verso chi?",
        agents: [
          { text: "la dottoressa", ok: true },
          { text: "la valigia", ok: false },
          { text: "il semaforo", ok: false }
        ],
        patients: [
          { text: "il paziente", ok: true },
          { text: "il frigorifero", ok: false },
          { text: "il biglietto", ok: false }
        ],
        where: "nello studio medico",
        sentence: "La dottoressa visita il paziente nello studio medico.",
        plausibility: { text: "Può un telefono visitare una ricetta medica?", ok: false, explain: "No: solo una persona o un medico può visitare." },
        cue: "Chi lavora in camice bianco e controlla la salute?"
      },
      {
        id: "vb_it_3", lv: 1, icon: "🔧", verb: "RIPARARE",
        prompt: "Chi ripara e quale oggetto guasto sistema?",
        agents: [
          { text: "il tecnico", ok: true },
          { text: "la tazzina", ok: false },
          { text: "il pane", ok: false }
        ],
        patients: [
          { text: "la caldaia", ok: true },
          { text: "la pioggia", ok: false },
          { text: "la musica", ok: false }
        ],
        where: "in casa",
        sentence: "Il tecnico ripara la caldaia in casa.",
        plausibility: { text: "Può un bicchiere riparare una bicicletta?", ok: false, explain: "No: un oggetto non può usare attrezzi per riparare." },
        cue: "Chi porta gli attrezzi quando qualcosa smette di funzionare?"
      },
      {
        id: "vb_it_4", lv: 1, icon: "✍️", verb: "SCRIVERE",
        prompt: "Chi scrive e che cosa prepara prima di uscire?",
        agents: [
          { text: "la nonna", ok: true },
          { text: "il ponte", ok: false },
          { text: "la tenda", ok: false }
        ],
        patients: [
          { text: "la lista della spesa", ok: true },
          { text: "il temporale", ok: false },
          { text: "il marciapiede", ok: false }
        ],
        where: "sul quaderno",
        sentence: "La nonna scrive la lista della spesa sul quaderno.",
        plausibility: { text: "Può una persona scrivere un promemoria su un foglio?", ok: true, explain: "Sì: si scrivono appunti e liste prima di uscire." },
        cue: "Serve carta e penna per non dimenticare cosa comprare."
      },
      {
        id: "vb_it_5", lv: 2, icon: "💳", verb: "PAGARE",
        prompt: "Chi paga e cosa salda prima di uscire dal negozio?",
        agents: [
          { text: "il cliente", ok: true },
          { text: "la scopa", ok: false },
          { text: "il muro", ok: false }
        ],
        patients: [
          { text: "il conto", ok: true },
          { text: "la finestra", ok: false },
          { text: "il vento", ok: false }
        ],
        where: "alla cassa",
        sentence: "Il cliente paga il conto alla cassa.",
        plausibility: { text: "Può il cliente pagare con la carta alla cassa?", ok: true, explain: "Sì: alla fine degli acquisti si paga alla cassa." },
        cue: "Quando fai la spesa, cosa fai davanti allo scontrino?"
      },
      {
        id: "vb_it_6", lv: 2, icon: "📞", verb: "CHIAMARE",
        prompt: "Chi fa una telefonata e chi cerca?",
        agents: [
          { text: "il figlio", ok: true },
          { text: "la sedia", ok: false },
          { text: "il sapone", ok: false }
        ],
        patients: [
          { text: "la farmacia", ok: true },
          { text: "il tappeto", ok: false },
          { text: "la nuvola", ok: false }
        ],
        where: "dal telefono di casa",
        sentence: "Il figlio chiama la farmacia dal telefono di casa.",
        plausibility: { text: "Può una scarpa chiamare un taxi?", ok: false, explain: "No: solo una persona fa una telefonata." },
        cue: "Usi il telefono per sapere se i farmaci sono pronti."
      },
      {
        id: "vb_it_7", lv: 2, icon: "📖", verb: "LEGGERE",
        prompt: "Chi legge e cosa guarda con attenzione?",
        agents: [
          { text: "il papà", ok: true },
          { text: "la chiave", ok: false },
          { text: "il piatto", ok: false }
        ],
        patients: [
          { text: "il giornale", ok: true },
          { text: "la nebbia", ok: false },
          { text: "la maniglia", ok: false }
        ],
        where: "la mattina in cucina",
        sentence: "Il papà legge il giornale la mattina in cucina.",
        plausibility: { text: "Si può leggere un cartello con gli orari del bus?", ok: true, explain: "Sì: i testi scritti sui cartelli si leggono." },
        cue: "Pensa a un testo stampato con notizie o informazioni."
      },
      {
        id: "vb_it_8", lv: 2, icon: "💊", verb: "PRENDERE",
        prompt: "Chi prende e cosa usa dopo colazione?",
        agents: [
          { text: "la signora", ok: true },
          { text: "la finestra", ok: false },
          { text: "il libro", ok: false }
        ],
        patients: [
          { text: "la compressa", ok: true },
          { text: "la montagna", ok: false },
          { text: "il campanello", ok: false }
        ],
        where: "con un bicchiere d'acqua",
        sentence: "La signora prende la compressa con un bicchiere d'acqua.",
        plausibility: { text: "Può un tavolo prendere uno sciroppo per la tosse?", ok: false, explain: "No: solo le persone prendono le medicine." },
        cue: "È una medicina prescritta ogni mattina."
      },
      {
        id: "vb_it_9", lv: 3, icon: "🍝", verb: "CUCINARE",
        prompt: "Chi prepara da mangiare e che piatto cuoce?",
        agents: [
          { text: "il cuoco", ok: true },
          { text: "la scarpa", ok: false },
          { text: "il foglio", ok: false }
        ],
        patients: [
          { text: "la minestra", ok: true },
          { text: "il telefono", ok: false },
          { text: "la porta", ok: false }
        ],
        where: "ai fornelli",
        sentence: "Il cuoco cucina la minestra ai fornelli.",
        plausibility: { text: "Si cucina la zuppa dentro una pentola calda?", ok: true, explain: "Sì: la zuppa cuoce in pentola sui fornelli." },
        cue: "Si mangia calda con il cucchiaio."
      },
      {
        id: "vb_it_10", lv: 3, icon: "🔑", verb: "APRIRE",
        prompt: "Chi gira la chiave e cosa apre?",
        agents: [
          { text: "la mamma", ok: true },
          { text: "il cuscino", ok: false },
          { text: "la nuvola", ok: false }
        ],
        patients: [
          { text: "la porta di casa", ok: true },
          { text: "il cielo", ok: false },
          { text: "la voce", ok: false }
        ],
        where: "con la chiave",
        sentence: "La mamma apre la porta di casa con la chiave.",
        plausibility: { text: "Può una mela aprire una finestra?", ok: false, explain: "No: serve una persona per aprire porte o finestre." },
        cue: "Si apre quando torni a casa dal giardino."
      },
      {
        id: "vb_it_11", lv: 3, icon: "🧼", verb: "LAVARE",
        prompt: "Chi pulisce e cosa lava dopo cena?",
        agents: [
          { text: "lo zio", ok: true },
          { text: "la lampada", ok: false },
          { text: "il semaforo", ok: false }
        ],
        patients: [
          { text: "i piatti", ok: true },
          { text: "le stelle", ok: false },
          { text: "il vento", ok: false }
        ],
        where: "nel lavandino",
        sentence: "Lo zio lava i piatti nel lavandino.",
        plausibility: { text: "Si lavano le mani con acqua e sapone?", ok: true, explain: "Sì: acqua e sapone servono per lavare." },
        cue: "Dopo aver mangiato, li mettiamo nell'acqua calda."
      },
      {
        id: "vb_it_12", lv: 3, icon: "🧺", verb: "PORTARE",
        prompt: "Chi accompagna o porta qualcosa al mercato?",
        agents: [
          { text: "il vicino", ok: true },
          { text: "il sasso", ok: false },
          { text: "la neve", ok: false }
        ],
        patients: [
          { text: "la borsa della spesa", ok: true },
          { text: "la mezzanotte", ok: false },
          { text: "il fischio", ok: false }
        ],
        where: "fino all'ascensore",
        sentence: "Il vicino porta la borsa della spesa fino all'ascensore.",
        plausibility: { text: "Può una bottiglia vuota portare una valigia?", ok: false, explain: "No: una bottiglia è un oggetto e non cammina." },
        cue: "Contiene frutta e pane comprati al mercato."
      }
    ],
    en: [
      {
        id: "vb_en_1", lv: 1, icon: "📅", verb: "BOOK",
        prompt: "Who books ahead and what do they schedule?",
        agents: [
          { text: "the patient", ok: true },
          { text: "the umbrella", ok: false },
          { text: "the staircase", ok: false }
        ],
        patients: [
          { text: "the clinic appointment", ok: true },
          { text: "the raincloud", ok: false },
          { text: "the pillowcase", ok: false }
        ],
        where: "by phone",
        sentence: "The patient books the clinic appointment by phone.",
        plausibility: { text: "Can a patient book a blood test for Tuesday morning?", ok: true, explain: "Yes: patients arrange appointments ahead of visits." },
        cue: "Think of planning a date and time with the receptionist."
      },
      {
        id: "vb_en_2", lv: 1, icon: "🩺", verb: "EXAMINE",
        prompt: "Who checks health and who do they see?",
        agents: [
          { text: "the doctor", ok: true },
          { text: "the suitcase", ok: false },
          { text: "the traffic light", ok: false }
        ],
        patients: [
          { text: "the patient", ok: true },
          { text: "the toaster", ok: false },
          { text: "the bus ticket", ok: false }
        ],
        where: "in the exam room",
        sentence: "The doctor examines the patient in the exam room.",
        plausibility: { text: "Can a telephone examine a prescription?", ok: false, explain: "No: a clinician examines a patient." },
        cue: "Think of who listens with a stethoscope."
      },
      {
        id: "vb_en_3", lv: 1, icon: "🔧", verb: "REPAIR",
        prompt: "Who fixes things and which broken appliance helps?",
        agents: [
          { text: "the plumber", ok: true },
          { text: "the teacup", ok: false },
          { text: "the loaf of bread", ok: false }
        ],
        patients: [
          { text: "the kitchen tap", ok: true },
          { text: "the afternoon", ok: false },
          { text: "the melody", ok: false }
        ],
        where: "under the sink",
        sentence: "The plumber repairs the kitchen tap under the sink.",
        plausibility: { text: "Can a glass cup repair a broken bicycle?", ok: false, explain: "No: objects cannot hold tools or repair things." },
        cue: "Think of who brings a wrench when water leaks."
      },
      {
        id: "vb_en_4", lv: 1, icon: "✍️", verb: "WRITE",
        prompt: "Who writes and what note helps before shopping?",
        agents: [
          { text: "grandma", ok: true },
          { text: "the bridge", ok: false },
          { text: "the curtain", ok: false }
        ],
        patients: [
          { text: "the shopping list", ok: true },
          { text: "the thunderstorm", ok: false },
          { text: "the pavement", ok: false }
        ],
        where: "on a notepad",
        sentence: "Grandma writes the shopping list on a notepad.",
        plausibility: { text: "Can someone write a quick reminder on sticky paper?", ok: true, explain: "Yes: short notes help keep errands clear." },
        cue: "You use a pen so nothing is forgotten at the store."
      },
      {
        id: "vb_en_5", lv: 2, icon: "💳", verb: "PAY",
        prompt: "Who pays and what gets settled before leaving the shop?",
        agents: [
          { text: "the customer", ok: true },
          { text: "the broom", ok: false },
          { text: "the brick wall", ok: false }
        ],
        patients: [
          { text: "the bill", ok: true },
          { text: "the windowpane", ok: false },
          { text: "the breeze", ok: false }
        ],
        where: "at the register",
        sentence: "The customer pays the bill at the register.",
        plausibility: { text: "Can a customer pay for groceries at the checkout?", ok: true, explain: "Yes: checkout is where bills are paid." },
        cue: "What happens right before the cashier hands over the receipt?"
      },
      {
        id: "vb_en_6", lv: 2, icon: "📞", verb: "CALL",
        prompt: "Who makes the phone call and who picks up?",
        agents: [
          { text: "her son", ok: true },
          { text: "the armchair", ok: false },
          { text: "the bar of soap", ok: false }
        ],
        patients: [
          { text: "the pharmacy", ok: true },
          { text: "the doormat", ok: false },
          { text: "the cloud", ok: false }
        ],
        where: "from the hallway",
        sentence: "Her son calls the pharmacy from the hallway.",
        plausibility: { text: "Can a shoe call a yellow cab?", ok: false, explain: "No: only people place phone calls." },
        cue: "You dial to ask if medicines are ready to pick up."
      },
      {
        id: "vb_en_7", lv: 2, icon: "📖", verb: "READ",
        prompt: "Who reads and what printed page holds the news?",
        agents: [
          { text: "dad", ok: true },
          { text: "the house key", ok: false },
          { text: "the dinner plate", ok: false }
        ],
        patients: [
          { text: "the morning paper", ok: true },
          { text: "the mist", ok: false },
          { text: "the doorknob", ok: false }
        ],
        where: "over coffee",
        sentence: "Dad reads the morning paper over coffee.",
        plausibility: { text: "Can you read a bus timetable sign at the stop?", ok: true, explain: "Yes: printed signs and schedules are read." },
        cue: "Printed words on paper with news or times."
      },
      {
        id: "vb_en_8", lv: 2, icon: "💊", verb: "TAKE",
        prompt: "Who swallows a dose and what medicine is it?",
        agents: [
          { text: "the lady", ok: true },
          { text: "the window", ok: false },
          { text: "the bookshelf", ok: false }
        ],
        patients: [
          { text: "her daily tablet", ok: true },
          { text: "the mountain", ok: false },
          { text: "the doorbell", ok: false }
        ],
        where: "with warm water",
        sentence: "The lady takes her daily tablet with warm water.",
        plausibility: { text: "Can a wooden table take cough syrup?", ok: false, explain: "No: furniture does not take medicine." },
        cue: "A prescribed medicine taken every morning."
      },
      {
        id: "vb_en_9", lv: 3, icon: "🍲", verb: "COOK",
        prompt: "Who prepares dinner and what meal simmers on the stove?",
        agents: [
          { text: "the chef", ok: true },
          { text: "the left shoe", ok: false },
          { text: "the envelope", ok: false }
        ],
        patients: [
          { text: "vegetable soup", ok: true },
          { text: "the smartphone", ok: false },
          { text: "the front gate", ok: false }
        ],
        where: "on the stove",
        sentence: "The chef cooks vegetable soup on the stove.",
        plausibility: { text: "Do we cook soup inside a warm pot?", ok: true, explain: "Yes: soup simmers inside a pot on the stove." },
        cue: "You eat it warm with a spoon."
      },
      {
        id: "vb_en_10", lv: 3, icon: "🔑", verb: "OPEN",
        prompt: "Who turns the key and what opens to let them inside?",
        agents: [
          { text: "mum", ok: true },
          { text: "the cushion", ok: false },
          { text: "the sunset", ok: false }
        ],
        patients: [
          { text: "the front door", ok: true },
          { text: "the sky", ok: false },
          { text: "the whistle", ok: false }
        ],
        where: "with the spare key",
        sentence: "Mum opens the front door with the spare key.",
        plausibility: { text: "Can an apple open a locked gate?", ok: false, explain: "No: a person unlocks and opens the gate." },
        cue: "You unlock it when coming back from a walk."
      },
      {
        id: "vb_en_11", lv: 3, icon: "🧼", verb: "WASH",
        prompt: "Who cleans up after supper and what gets washed?",
        agents: [
          { text: "her uncle", ok: true },
          { text: "the ceiling lamp", ok: false },
          { text: "the signpost", ok: false }
        ],
        patients: [
          { text: "the dishes", ok: true },
          { text: "the stars", ok: false },
          { text: "the wind", ok: false }
        ],
        where: "in the sink",
        sentence: "Her uncle washes the dishes in the sink.",
        plausibility: { text: "Do we wash our hands with soap and water?", ok: true, explain: "Yes: water and soap clean hands and dishes." },
        cue: "Plates and mugs rinsed after dinner."
      },
      {
        id: "vb_en_12", lv: 3, icon: "🧺", verb: "BRING",
        prompt: "Who carries groceries and what do they bring inside?",
        agents: [
          { text: "the neighbour", ok: true },
          { text: "a pebble", ok: false },
          { text: "a snowflake", ok: false }
        ],
        patients: [
          { text: "the heavy bag", ok: true },
          { text: "midnight", ok: false },
          { text: "the echo", ok: false }
        ],
        where: "up to the flat",
        sentence: "The neighbour brings the heavy bag up to the flat.",
        plausibility: { text: "Can an empty bottle carry a suitcase upstairs?", ok: false, explain: "No: only people lift and carry luggage." },
        cue: "It holds fresh fruit and bread from the market."
      }
    ]
  };
})();
