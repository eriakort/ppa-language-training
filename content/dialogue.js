/*
 * Bilingual Everyday Conversational Scripts & Pragmatic Repair Bank
 * (12 Italian + 12 English two-turn dialogues, balanced 4/4/4 across Levels 1-3 and phone/errand/social).
 *
 * Supports Script Training & Supported Conversation (SCA) across PPA variants:
 *   - Turn 1 (reply): selecting a clear, functional conversational response
 *   - Turn 2 (repair): handling clarification, asking for time, or confirming details smoothly
 */
(function () {
  "use strict";
  window.POG = window.POG || {};
  window.POG.content = window.POG.content || {};

  window.POG.content.DIALOGUE = {
    it: [
      /* Level 1 — Multi-detail errands, phone clarification & polite repair */
      {
        id: "dg_it_1", lv: 1, kind: "errand", pic: "💊",
        partner: "Farmacista: «Buongiorno! Questa ricetta ha due scatole: vuole ritirarle entrambe oggi?»",
        cue: "Rispondi prima su quante scatole ti servono oggi.",
        opts: [
          "Buongiorno, sì, prendo entrambe le scatole oggi.",
          "La farmacia chiude alle sette di sera.",
          "Non ho portato l'ombrello perché c'è il sole."
        ],
        ans: 0,
        followUp: "Farmacista: «Perfetto. Preferisce pagare in contanti o con il bancomat?»",
        repairOpts: [
          "Scusi, può parlarmi piano? Pago con il bancomat.",
          "Ieri sono andato dal parrucchiere.",
          "Va bene, arrivederci a domani."
        ],
        repairAns: 0,
        fullDialogue: "Prendo entrambe le scatole oggi. Pago con il bancomat.",
        explanation: "Hai risposto alla richiesta delle medicine e gestito con calma il pagamento."
      },
      {
        id: "dg_it_2", lv: 1, kind: "phone", pic: "📞",
        partner: "Segreteria medica: «Pronto, chiamiamo per spostare la visita a giovedì alle 10:30. Le va bene?»",
        cue: "Conferma se l'orario di giovedì va bene e chiedi un promemoria scritto.",
        opts: [
          "Aspetti un momento: giovedì alle 10:30 va bene. Può mandarmi un messaggio scritto?",
          "Ho già fatto colazione alle sette.",
          "Pronto, chi parla dal supermercato?"
        ],
        ans: 0,
        followUp: "Segreteria: «Certo, le invio subito un SMS. Le serve altro?»",
        repairOpts: [
          "No grazie, solo l'indirizzo dell'ambulatorio scritto nel messaggio.",
          "Preferisco il caffè senza zucchero.",
          "Non trovo più le chiavi della macchina."
        ],
        repairAns: 0,
        fullDialogue: "Giovedì alle 10:30 va bene. Può mandarmi un messaggio con l'indirizzo?",
        explanation: "Chiedere un messaggio scritto al telefono fissa giorno, ora e luogo senza fatica."
      },
      {
        id: "dg_it_3", lv: 1, kind: "social", pic: "🍽️",
        partner: "Cameriere: «Benvenuti! Volete ordinare subito o preferite altri cinque minuti?»",
        cue: "Chiedi qualche minuto con gentilezza se ti serve tempo per leggere.",
        opts: [
          "Grazie, ci lasci cinque minuti per favore.",
          "Il treno parte dal binario tre.",
          "Sì, porti subito il conto per uscire."
        ],
        ans: 0,
        followUp: "Cameriere: «Nessun problema! Desidera intanto dell'acqua naturale o frizzante?»",
        repairOpts: [
          "Naturale per favore, non fredda.",
          "Ho perso gli occhiali ieri al parco.",
          "Forse torniamo martedì prossimo."
        ],
        repairAns: 0,
        fullDialogue: "Ci lasci cinque minuti per favore. Intanto acqua naturale, non fredda.",
        explanation: "Prendere tempo al ristorante permette poi di ordinare con serenità."
      },
      {
        id: "dg_it_4", lv: 1, kind: "phone", pic: "📦",
        partner: "Corriere al citofono: «Salve, ho un pacco per lei ma non funziona il campanello di sopra.»",
        cue: "Spiega come aprire o dove lasciare il pacco in modo chiaro.",
        opts: [
          "Salve, scendo io tra un minuto oppure apra il portone.",
          "Oggi piove molto forte fuori.",
          "Non ho ordinato nessuna pizza."
        ],
        ans: 0,
        followUp: "Corriere: «Mi scusi, può ripetere il cognome per la firma?»",
        repairOpts: [
          "Un attimo: glielo scrivo o lo dico lettera per lettera.",
          "Il pacco è arrivato la settimana scorsa.",
          "Chiudo la porta subito, grazie."
        ],
        repairAns: 0,
        fullDialogue: "Scendo tra un minuto. Se serve il cognome glielo dico lettera per lettera.",
        explanation: "Offrire lo spelling o la forma scritta risolve subito i dubbi al citofono."
      },

      /* Level 2 — Everyday mid-length exchanges */
      {
        id: "dg_it_5", lv: 2, kind: "social", pic: "🏘️",
        partner: "Vicino di casa: «Ciao! Come stai oggi? Fai una passeggiata al parco?»",
        cue: "Saluta in modo naturale e rispondi alla domanda sul parco.",
        opts: [
          "Ciao! Abbastanza bene, sì, vado a fare due passi al parco.",
          "Prenda due compresse dopo cena.",
          "Il biglietto costa tre euro."
        ],
        ans: 0,
        followUp: "Vicino: «Ottimo! Ci vediamo magari domani mattina per un caffè?»",
        repairOpts: [
          "Volentieri, domani verso le dieci se va bene.",
          "Ho dimenticato il nome della via.",
          "Non ho bisogno della borsa."
        ],
        repairAns: 0,
        fullDialogue: "Ciao! Vado a fare due passi al parco. Domani ci vediamo alle dieci per un caffè.",
        explanation: "Una risposta breve e cordiale mantiene vivo il contatto con i vicini."
      },
      {
        id: "dg_it_6", lv: 2, kind: "errand", pic: "🥐",
        partner: "Barista: «Buongiorno! Cosa prende per colazione?»",
        cue: "Scegli una risposta chiara con quello che vuoi ordinare.",
        opts: [
          "Un cappuccino caldo e una brioche vuota, grazie.",
          "La visita è giovedì pomeriggio.",
          "Sto cercando l'ufficio postale."
        ],
        ans: 0,
        followUp: "Barista: «Scusi, non ho sentito bene: brioche alla crema o vuota?»",
        repairOpts: [
          "Vuota, grazie mille.",
          "Un bicchiere d'acqua fredda.",
          "Il tavolo è vicino alla porta."
        ],
        repairAns: 0,
        fullDialogue: "Un cappuccino caldo e una brioche vuota, grazie.",
        explanation: "Confermare una sola parola chiave («vuota») chiarisce subito l'ordine."
      },
      {
        id: "dg_it_7", lv: 2, kind: "phone", pic: "👨‍👩‍👧",
        partner: "Familiare al telefono: «Ciao! Passo io alle quattro o preferisci dopo cena?»",
        cue: "Scegli l'orario che preferisci con chiarezza.",
        opts: [
          "Passa alle quattro, così parliamo con più calma.",
          "Ho messo la giacca nell'armadio.",
          "Il pane è finito al mercato."
        ],
        ans: 0,
        followUp: "Familiare: «Va benissimo! Ti serve qualcosa dal supermercato prima che arrivi?»",
        repairOpts: [
          "Sì, prendi latte e pane per favore.",
          "Passo io in farmacia ieri mattina.",
          "La finestra è già chiusa."
        ],
        repairAns: 0,
        fullDialogue: "Passa alle quattro, grazie. Prendi latte e pane dal supermercato.",
        explanation: "Esprimere una preferenza oraria chiara evita fatica nelle chiamate."
      },
      {
        id: "dg_it_8", lv: 2, kind: "errand", pic: "🏥",
        partner: "Infermiere: «Mi dica, ha già fatto gli esami del sangue stamattina?»",
        cue: "Rispondi in modo diretto sulla visita di questa mattina.",
        opts: [
          "Sì, li ho fatti stamattina alle otto.",
          "Il cappotto blu è molto caldo.",
          "Andiamo al cinema stasera."
        ],
        ans: 0,
        followUp: "Infermiere: «Perfetto. Si accomodi in sala d'attesa, la chiamiamo tra poco.»",
        repairOpts: [
          "Grazie, aspetto qui vicino così sento bene.",
          "Voglio cambiare la ricetta medica.",
          "Scusi, che ora è stata ieri?"
        ],
        repairAns: 0,
        fullDialogue: "Sì, ho fatto gli esami stamattina alle otto. Aspetto qui vicino, grazie.",
        explanation: "Rispondere con semplicità e avvisare dove ti siedi facilita l'appuntamento."
      },

      /* Level 3 — High-frequency concrete exchanges */
      {
        id: "dg_it_9", lv: 3, kind: "social", pic: "☕",
        partner: "Amico: «Prendi tè o caffè insieme a me?»",
        cue: "Scegli tra le due bevande proposte.",
        opts: [
          "Prendo un tè caldo, grazie.",
          "Sono arrivato in autobus.",
          "La porta è aperta."
        ],
        ans: 0,
        followUp: "Amico: «Con zucchero o senza?»",
        repairOpts: [
          "Senza zucchero, grazie.",
          "Con due valigie grandi.",
          "A domani mattina presto."
        ],
        repairAns: 0,
        fullDialogue: "Prendo un tè caldo, senza zucchero, grazie.",
        explanation: "Le scelte binarie chiare aiutano a rispondere subito senza sforzo."
      },
      {
        id: "dg_it_10", lv: 3, kind: "errand", pic: "🥖",
        partner: "Panettiere: «Vuole un sacchetto per il pane?»",
        cue: "Rispondi sì o no alla domanda sul sacchetto.",
        opts: [
          "Sì, un sacchetto piccolo per favore.",
          "Mi fa male la spalla destra.",
          "L'orologio segna mezzogiorno."
        ],
        ans: 0,
        followUp: "Panettiere: «Ecco a lei, sono due euro.»",
        repairOpts: [
          "Ecco a lei, grazie e buona giornata.",
          "Non capisco dove sia la stazione.",
          "Ho bisogno di due biglietti."
        ],
        repairAns: 0,
        fullDialogue: "Sì, un sacchetto per favore. Ecco a lei, buona giornata.",
        explanation: "Formule brevi di cortesia rendono fluido ogni piccolo acquisto."
      },
      {
        id: "dg_it_11", lv: 3, kind: "phone", pic: "👋",
        partner: "Figlia al telefono: «Ciao! Ti chiamo solo per sapere se hai pranzato.»",
        cue: "Rispondi in modo semplice sul pranzo.",
        opts: [
          "Ciao! Sì, ho mangiato bene poco fa.",
          "La farmacia è sulla destra.",
          "Serve una penna blu."
        ],
        ans: 0,
        followUp: "Figlia: «Che bravo! Ci sentiamo stasera dopo cena?»",
        repairOpts: [
          "Sì, chiamami stasera verso le otto.",
          "Il cane vuole uscire ieri.",
          "Non ricordo dove ho messo il cappello."
        ],
        repairAns: 0,
        fullDialogue: "Sì, ho mangiato bene. Chiamami stasera verso le otto.",
        explanation: "Due risposte brevi e chiare concludono bene una telefonata familiare."
      },
      {
        id: "dg_it_12", lv: 3, kind: "social", pic: "🌞",
        partner: "Conoscente: «Buongiorno! Che bella giornata di sole oggi, vero?»",
        cue: "Ricambia il saluto con naturalezza.",
        opts: [
          "Buongiorno! Sì, si sta davvero bene oggi.",
          "Ho preso la compressa alle nove.",
          "Costa cinque euro al chilo."
        ],
        ans: 0,
        followUp: "Conoscente: «Buona passeggiata allora!»",
        repairOpts: [
          "Grazie, anche a te buona giornata!",
          "Ecco il numero del dottore.",
          "Aspetti davanti alla cassa."
        ],
        repairAns: 0,
        fullDialogue: "Buongiorno! Si sta davvero bene oggi. Grazie, buona giornata!",
        explanation: "I saluti brevi mantengono spontanea la socialità quotidiana."
      }
    ],

    en: [
      /* Level 1 */
      {
        id: "dg_en_1", lv: 1, kind: "errand", pic: "💊",
        partner: "Pharmacist: “Good morning! Your prescription has two boxes — would you like both today?”",
        cue: "Answer whether you want to collect both boxes now.",
        opts: [
          "Good morning, yes please, I will take both boxes today.",
          "The chemist closes at six o'clock.",
          "I left my umbrella on the bus yesterday."
        ],
        ans: 0,
        followUp: "Pharmacist: “Great. Would you like to pay by card or cash?”",
        repairOpts: [
          "Please give me a moment — I will pay by card.",
          "I walked past the park this morning.",
          "Thank you, goodbye until Friday."
        ],
        repairAns: 0,
        fullDialogue: "I will take both boxes today. Please give me a moment — I will pay by card.",
        explanation: "You answered the medication question cleanly and handled the payment follow-up."
      },
      {
        id: "dg_en_2", lv: 1, kind: "phone", pic: "📞",
        partner: "Clinic desk: “Hello, can we move your appointment to Thursday at 10:30?”",
        cue: "Confirm Thursday at 10:30 and ask for a written text reminder.",
        opts: [
          "One moment please — Thursday at 10:30 works. Could you send me a text message?",
          "I already had toast and tea earlier.",
          "Hello, are you calling from the bakery?"
        ],
        ans: 0,
        followUp: "Clinic desk: “Yes, I will text you now. Do you need anything else?”",
        repairOpts: [
          "No thank you, just include the clinic room number in the text.",
          "I prefer coffee without sugar.",
          "I cannot find my garden gloves."
        ],
        repairAns: 0,
        fullDialogue: "Thursday at 10:30 works. Please text me with the clinic room number.",
        explanation: "Requesting a short written confirmation on phone calls prevents missed details."
      },
      {
        id: "dg_en_3", lv: 1, kind: "social", pic: "🍽️",
        partner: "Server: “Welcome! Are you ready to order now, or would you like five more minutes?”",
        cue: "Politely ask for five more minutes to look over the menu.",
        opts: [
          "Could we have five more minutes please?",
          "The train leaves from platform three.",
          "Yes, bring the bill right now so we can leave."
        ],
        ans: 0,
        followUp: "Server: “Of course! Would you like still or sparkling water while you decide?”",
        repairOpts: [
          "Still water please, without ice.",
          "I misplaced my reading glasses yesterday.",
          "Maybe we will come back next Tuesday."
        ],
        repairAns: 0,
        fullDialogue: "Could we have five more minutes please? Still water without ice in the meantime.",
        explanation: "Asking for extra time takes pressure off reading the menu in a busy café."
      },
      {
        id: "dg_en_4", lv: 1, kind: "phone", pic: "📦",
        partner: "Delivery driver on intercom: “Hello, I have a parcel for you, is anyone home?”",
        cue: "Let the driver know how to deliver the parcel clearly.",
        opts: [
          "Hello, I am coming down in one minute — please wait by the door.",
          "It looks quite cloudy outside today.",
          "I did not order any takeaway pizza."
        ],
        ans: 0,
        followUp: "Driver: “Sorry, could you spell your surname slowly for the scanner?”",
        repairOpts: [
          "Hold on — I can say it slowly or write it on the pad.",
          "The parcel came last Wednesday afternoon.",
          "Thank you, the bus stop is nearby."
        ],
        repairAns: 0,
        fullDialogue: "I am coming down in one minute. I can say or write my name slowly.",
        explanation: "Offering to write or pace your surname solves intercom misunderstandings calmly."
      },

      /* Level 2 */
      {
        id: "dg_en_5", lv: 2, kind: "social", pic: "🏘️",
        partner: "Neighbour: “Hi there! How are you doing today? Off for a walk in the park?”",
        cue: "Return the greeting and answer about the park.",
        opts: [
          "Hello! Doing well, yes, I am heading to the park for a short walk.",
          "Take two tablets after evening dinner.",
          "The receipt costs three pounds."
        ],
        ans: 0,
        followUp: "Neighbour: “Lovely! Fancy meeting for a cup of tea tomorrow morning?”",
        repairOpts: [
          "Yes please — how about ten o'clock tomorrow?",
          "I forgot the name of that street.",
          "I do not need a shopping bag."
        ],
        repairAns: 0,
        fullDialogue: "Hello! Heading for a walk in the park. Let's meet at ten tomorrow for tea.",
        explanation: "Short, friendly turns keep everyday neighbourhood chats easy and natural."
      },
      {
        id: "dg_en_6", lv: 2, kind: "errand", pic: "🥐",
        partner: "Barista: “Morning! What can I get you for breakfast?”",
        cue: "Place your food and drink order clearly.",
        opts: [
          "A warm tea and a plain scone please.",
          "My doctor's visit is Thursday afternoon.",
          "I am looking for the post office."
        ],
        ans: 0,
        followUp: "Barista: “Sorry, I missed that — did you want jam and cream with your scone?”",
        repairOpts: [
          "Just plain with butter, thank you.",
          "A glass of cold water over there.",
          "The table is beside the window."
        ],
        repairAns: 0,
        fullDialogue: "A warm tea and a plain scone with butter, thank you.",
        explanation: "Repeating the one key word (“plain”) clarifies the order without extra effort."
      },
      {
        id: "dg_en_7", lv: 2, kind: "phone", pic: "👨‍👩‍👧",
        partner: "Family member on the phone: “Hi! Shall I pop over at four o'clock or after dinner?”",
        cue: "Choose your preferred visiting time clearly.",
        opts: [
          "Come over at four o'clock please — that suits me best.",
          "I hung my coat inside the hall cupboard.",
          "Bread ran out at the corner shop."
        ],
        ans: 0,
        followUp: "Family: “Lovely! Do you need anything from the shops before I come?”",
        repairOpts: [
          "Yes please, pick up milk and fresh fruit.",
          "I went to the chemist yesterday morning.",
          "The kitchen window is already shut."
        ],
        repairAns: 0,
        fullDialogue: "Come over at four o'clock please. Could you pick up milk and fresh fruit?",
        explanation: "Clear time preference plus a two-item request makes phone planning effortless."
      },
      {
        id: "dg_en_8", lv: 2, kind: "errand", pic: "🏥",
        partner: "Clinic nurse: “Tell me, have you already had your blood test this morning?”",
        cue: "Give a direct answer about this morning's test.",
        opts: [
          "Yes, I had it done at eight o'clock this morning.",
          "My blue wool coat is very warm.",
          "We might go to the cinema tonight."
        ],
        ans: 0,
        followUp: "Nurse: “Thank you. Please take a seat in the waiting room, we will call you soon.”",
        repairOpts: [
          "Thanks, I will sit near the front so I can hear my name.",
          "I would like to change my pharmacy prescription.",
          "Excuse me, what time was it yesterday?"
        ],
        repairAns: 0,
        fullDialogue: "Yes, I had it at eight this morning. I will sit near the front, thank you.",
        explanation: "A short confirmation and practical seating plan help clinic visits go smoothly."
      },

      /* Level 3 */
      {
        id: "dg_en_9", lv: 3, kind: "social", pic: "☕",
        partner: "Friend: “Would you like tea or coffee with me?”",
        cue: "Pick one of the two drinks offered.",
        opts: [
          "I would love a hot tea, thank you.",
          "I arrived by bus this morning.",
          "The front door is unlocked."
        ],
        ans: 0,
        followUp: "Friend: “Milk and sugar, or plain?”",
        repairOpts: [
          "Just a splash of milk, no sugar.",
          "Two large suitcases upstairs.",
          "See you early tomorrow morning."
        ],
        repairAns: 0,
        fullDialogue: "I would love a hot tea, just milk and no sugar, thank you.",
        explanation: "Two-choice questions allow crisp, natural replies."
      },
      {
        id: "dg_en_10", lv: 3, kind: "errand", pic: "🥖",
        partner: "Baker: “Would you like a paper bag for your bread?”",
        cue: "Answer the baker's question about a bag.",
        opts: [
          "Yes, a small bag please.",
          "My right shoulder feels stiff.",
          "The clock says midday."
        ],
        ans: 0,
        followUp: "Baker: “Here you are — that is two pounds.”",
        repairOpts: [
          "Thank you, have a lovely day.",
          "I cannot tell where the station is.",
          "I need two return tickets."
        ],
        repairAns: 0,
        fullDialogue: "Yes, a small bag please. Thank you, have a lovely day.",
        explanation: "Brief polite exchanges complete everyday shop errands comfortably."
      },
      {
        id: "dg_en_11", lv: 3, kind: "phone", pic: "👋",
        partner: "Daughter on the phone: “Hi! Just checking in to see if you had lunch?”",
        cue: "Answer simply about lunch.",
        opts: [
          "Hi! Yes, I just had a good lunch.",
          "The chemist is on the right.",
          "We need a blue ballpoint pen."
        ],
        ans: 0,
        followUp: "Daughter: “Glad to hear it! Shall I ring again this evening?”",
        repairOpts: [
          "Yes, call me around eight tonight.",
          "The dog wants to go out yesterday.",
          "I cannot find my winter hat."
        ],
        repairAns: 0,
        fullDialogue: "Yes, I had a good lunch. Call me around eight tonight.",
        explanation: "Two short clear sentences wrap up a warm family check-in call."
      },
      {
        id: "dg_en_12", lv: 3, kind: "social", pic: "🌞",
        partner: "Acquaintance: “Good morning! What a lovely sunny day, isn't it?”",
        cue: "Return the warm greeting naturally.",
        opts: [
          "Good morning! Yes, it is lovely weather today.",
          "I took my tablet at nine o'clock.",
          "They cost five pounds a kilo."
        ],
        ans: 0,
        followUp: "Acquaintance: “Enjoy your walk then!”",
        repairOpts: [
          "Thank you, enjoy your day too!",
          "Here is the clinic phone number.",
          "Please wait beside the till."
        ],
        repairAns: 0,
        fullDialogue: "Good morning! Lovely weather today. Thank you, enjoy your day too!",
        explanation: "Short greetings keep daily social connections light and comfortable."
      }
    ]
  };
})();
