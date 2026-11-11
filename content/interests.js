window.POG = window.POG || {};
(function (C) {

  /* Interest packs. Evergreen on purpose: no real people, no current events that go out of date.
     Titles may be {c: with town, t: with team, n: without}. Crossword words: capitals, no accents. */
  C.PACKS = {
    calcio: { icon: "⚽", label: { it: "Calcio", en: "Football" },
      describe: [
        { pic: "⚽", it: [{ t: "La tua squadra: {team}", n: "La tua squadra" }, "Racconta una partita che ricordi.", ["Chi giocava?", "Dove eri?", "Com'è finita?"], ["gol", "stadio", "tifosi", "vittoria"]],
                     en: [{ t: "Your team: {team}", n: "Your team" }, "Tell me about a match you remember.", ["Who was playing?", "Where were you?", "How did it end?"], ["goal", "stadium", "fans", "win"]] },
        { pic: "📺", it: ["La domenica di calcio", "Come passi una domenica di campionato?", ["Dove guardi la partita?", "Con chi?", "Cosa mangi?"], ["televisione", "amici", "radio", "risultato"]],
                     en: ["Football Sunday", "How do you spend a match day?", ["Where do you watch the match?", "Who with?", "What do you eat?"], ["television", "friends", "radio", "score"]] }
      ],
      name: [
        { pic: "⚽", it: ["pallone", "Si calcia per fare gol.", "pa…"], en: ["ball", "You kick it to score a goal.", "b…"] },
        { pic: "🏆", it: ["coppa", "Si vince alla fine del torneo.", "co…"], en: ["trophy", "You win it at the end of a tournament.", "tro…"] },
        { pic: "🏟️", it: ["stadio", "Dove si gioca davanti ai tifosi.", "sta…"], en: ["stadium", "Where the match is played in front of fans.", "sta…"] },
        { pic: "🟨", it: ["cartellino", "L'arbitro lo mostra al giocatore.", "car…"], en: ["card", "The referee shows it to a player.", "c…"] }
      ],
      cw: { it: [["PALLONE", "Si calcia durante la partita"], ["PORTIERE", "Para i tiri in porta"], ["ARBITRO", "Fischia i falli"], ["STADIO", "Dove si gioca la partita"], ["RIGORE", "Tiro dagli undici metri"], ["TIFOSI", "Sostengono la squadra"], ["GOL", "Si segna quando la palla entra in porta"]],
            en: [["BALL", "You kick it in a match"], ["GOAL", "Scored when the ball goes in"], ["REFEREE", "Blows the whistle for fouls"], ["STADIUM", "Where the match is played"], ["PENALTY", "A shot from the spot"], ["FANS", "They support the team"], ["KEEPER", "Stops shots at goal"]] },
      echo: { it: [["La partita inizia alle tre.", "Ha segnato un bel gol.", "Lo stadio era pieno di tifosi."], ["la maglia della squadra", "un tiro in porta", "il fischio dell'arbitro"], ["gol", "palla", "porta"]],
              en: [["The match starts at three.", "He scored a great goal.", "The stadium was full of fans."], ["the team shirt", "a shot on goal", "the referee's whistle"], ["goal", "ball", "team"]] }
    },
    politica: { icon: "🗳️", label: { it: "Politica e attualità", en: "Politics and current affairs" },
      describe: [
        { pic: "🏙️", it: [{ c: "La tua città: {city}", n: "La tua città" }, "Cosa ti piace della tua città e cosa cambieresti?", ["Cosa funziona bene?", "Cosa manca?", "Cosa diresti al sindaco?"], ["sindaco", "piazza", "strade", "quartiere"]],
                      en: [{ c: "Your town: {city}", n: "Your town" }, "What do you like about your town, and what would you change?", ["What works well?", "What is missing?", "What would you tell the mayor?"], ["mayor", "square", "roads", "neighbourhood"]] },
        { pic: "📰", it: ["Le notizie", "Quali notizie ti interessano di più?", ["Dove leggi le notizie?", "Di cosa parlano?", "Cosa ne pensi?"], ["giornale", "telegiornale", "governo", "elezioni"]],
                     en: ["The news", "Which news interests you most?", ["Where do you get the news?", "What is it about?", "What do you think?"], ["newspaper", "news", "government", "elections"]] }
      ],
      name: [
        { pic: "🗳️", it: ["urna", "Ci si mette la scheda quando si vota.", "ur…"], en: ["ballot box", "You put your vote in it.", "ba…"] },
        { pic: "🏛️", it: ["municipio", "Il palazzo dove lavora il sindaco.", "mu…"], en: ["town hall", "The building where the mayor works.", "to…"] },
        { pic: "📰", it: ["giornale", "Si legge per sapere le notizie.", "gio…"], en: ["newspaper", "You read it to get the news.", "ne…"] },
        { pic: "🎤", it: ["microfono", "Si usa per parlare a tante persone.", "mi…"], en: ["microphone", "You use it to speak to a crowd.", "mi…"] }
      ],
      cw: { it: [["SINDACO", "Guida il comune"], ["VOTO", "Si dà alle elezioni"], ["COMUNE", "L'ente della tua città"], ["GOVERNO", "Guida il paese"], ["GIORNALE", "Si legge per le notizie"], ["PIAZZA", "Luogo aperto al centro della città"], ["LEGGE", "Regola approvata dal parlamento"]],
            en: [["MAYOR", "Leads the town"], ["VOTE", "You cast it in an election"], ["TOWN", "A small city"], ["NEWS", "What the papers report"], ["LAW", "A rule passed by parliament"], ["ELECTION", "When people choose their leaders"], ["SQUARE", "An open place in the town centre"]] },
      echo: { it: [["Domenica si vota per il sindaco.", "Il comune ha rifatto la piazza.", "Ho letto il giornale stamattina."], ["le notizie di oggi", "il consiglio comunale", "una nuova legge"], ["voto", "legge", "piazza"]],
              en: [["On Sunday we vote for the mayor.", "The town has rebuilt the square.", "I read the paper this morning."], ["today's news", "the town council", "a new law"], ["vote", "law", "news"]] }
    },
    moda: { icon: "👗", label: { it: "Moda", en: "Fashion" },
      describe: [
        { pic: "👔", it: ["Il tuo stile", "Come ti piace vestirti?", ["Che colori ami?", "Cosa metti la domenica?", "Dove compri i vestiti?"], ["giacca", "colore", "negozio", "eleganza"]],
                     en: ["Your style", "How do you like to dress?", ["Which colours do you love?", "What do you wear on Sundays?", "Where do you buy clothes?"], ["jacket", "colour", "shop", "elegance"]] },
        { pic: "👗", it: ["Un abito speciale", "Racconta un abito che ricordi.", ["Per quale occasione?", "Di che colore era?", "Chi l'aveva scelto?"], ["matrimonio", "festa", "seta", "sarta"]],
                     en: ["A special outfit", "Tell me about an outfit you remember.", ["For what occasion?", "What colour was it?", "Who chose it?"], ["wedding", "party", "silk", "tailor"]] }
      ],
      name: [
        { pic: "👗", it: ["vestito", "Si indossa per una festa.", "ve…"], en: ["dress", "You wear it to a party.", "dr…"] },
        { pic: "👜", it: ["borsa", "Si porta per tenere le proprie cose.", "bo…"], en: ["handbag", "You carry your things in it.", "ha…"] },
        { pic: "🧣", it: ["sciarpa", "Si mette al collo quando fa freddo.", "scia…"], en: ["scarf", "You wear it round your neck when it's cold.", "sc…"] },
        { pic: "👞", it: ["scarpa", "Si mette al piede.", "scar…"], en: ["shoe", "You wear it on your foot.", "sh…"] }
      ],
      cw: { it: [["GONNA", "Si indossa dalla vita in giù"], ["GIACCA", "Si mette sopra la camicia"], ["BORSA", "Si porta a spalla o a mano"], ["SCIARPA", "Si avvolge al collo"], ["MODA", "Le tendenze dei vestiti"], ["SARTA", "Cuce i vestiti su misura"], ["CAPPELLO", "Si porta in testa"]],
            en: [["SKIRT", "Worn from the waist down"], ["JACKET", "Worn over a shirt"], ["SCARF", "Wrapped round the neck"], ["DRESS", "Worn to a party"], ["HAT", "Worn on the head"], ["TAILOR", "Makes clothes to measure"], ["FASHION", "The latest styles"]] },
      echo: { it: [["Questa giacca ti sta benissimo.", "Mi piace il colore blu.", "Ho comprato una sciarpa nuova."], ["un vestito elegante", "le scarpe nere", "una borsa di pelle"], ["moda", "gonna", "colore"]],
              en: [["This jacket suits you well.", "I like the colour blue.", "I bought a new scarf."], ["an elegant dress", "the black shoes", "a leather bag"], ["dress", "hat", "colour"]] }
    },
    spettacolo: { icon: "🎬", label: { it: "Spettacolo e gossip", en: "Showbiz and gossip" },
      describe: [
        { pic: "📺", it: ["Il tuo programma preferito", "Quale programma guardi volentieri in TV?", ["Di cosa parla?", "Chi lo presenta?", "Quando lo guardi?"], ["televisione", "sera", "presentatore", "puntata"]],
                     en: ["Your favourite programme", "Which TV programme do you enjoy?", ["What is it about?", "Who presents it?", "When do you watch it?"], ["television", "evening", "presenter", "episode"]] },
        { pic: "💒", it: ["Una festa importante", "Racconta un matrimonio o una festa che ricordi.", ["Chi c'era?", "Com'erano vestiti?", "Cosa è successo?"], ["sposi", "invitati", "musica", "torta"]],
                     en: ["A big celebration", "Tell me about a wedding or party you remember.", ["Who was there?", "What were they wearing?", "What happened?"], ["couple", "guests", "music", "cake"]] }
      ],
      name: [
        { pic: "📺", it: ["televisione", "Si accende per guardare i programmi.", "te…"], en: ["television", "You switch it on to watch programmes.", "te…"] },
        { pic: "📷", it: ["fotocamera", "Si usa per fare le foto.", "fo…"], en: ["camera", "You take photos with it.", "ca…"] },
        { pic: "💍", it: ["anello", "Si mette al dito, per esempio quando ci si sposa.", "a…"], en: ["ring", "You wear it on a finger, for example when you marry.", "r…"] },
        { pic: "🎬", it: ["film", "Si guarda al cinema.", "fi…"], en: ["film", "You watch it at the cinema.", "fi…"] }
      ],
      cw: { it: [["ATTORE", "Recita nei film"], ["CINEMA", "Dove si guardano i film"], ["SPOSI", "Si sposano"], ["FILM", "Si guarda al cinema"], ["ANELLO", "Si mette al dito"], ["RIVISTA", "Giornale con foto da sfogliare"], ["FESTA", "Si fa per celebrare"]],
            en: [["ACTOR", "Acts in films"], ["CINEMA", "Where you watch films"], ["FILM", "You watch it at the cinema"], ["RING", "Worn on a finger"], ["PARTY", "A celebration"], ["STAR", "A famous performer"], ["MAGAZINE", "A glossy paper full of photos"]] },
      echo: { it: [["Stasera c'è un bel film in TV.", "Si sono sposati in primavera.", "Ho letto la notizia su una rivista."], ["il festival della canzone", "una coppia famosa", "il vestito della sposa"], ["film", "festa", "foto"]],
              en: [["There's a good film on TV tonight.", "They got married in the spring.", "I read the story in a magazine."], ["the song festival", "a famous couple", "the bride's dress"], ["film", "party", "star"]] }
    },
    cucina: { icon: "🍝", label: { it: "Cucina", en: "Cooking" },
      describe: [
        { pic: "🍝", it: ["Il tuo piatto preferito", "Come si prepara il tuo piatto preferito?", ["Quali ingredienti servono?", "Chi te l'ha insegnato?", "Quando lo mangi?"], ["pentola", "sugo", "forno", "ricetta"]],
                     en: ["Your favourite dish", "How do you make your favourite dish?", ["What ingredients do you need?", "Who taught you?", "When do you eat it?"], ["pot", "sauce", "oven", "recipe"]] },
        { pic: "🧺", it: [{ c: "Il mercato di {city}", n: "Il mercato" }, "Racconta una spesa al mercato.", ["Cosa compri?", "Da chi?", "Cosa costa di più?"], ["frutta", "verdura", "banco", "pesce"]],
                     en: [{ c: "The market in {city}", n: "The market" }, "Tell me about shopping at the market.", ["What do you buy?", "From whom?", "What costs the most?"], ["fruit", "vegetables", "stall", "fish"]] }
      ],
      name: [
        { pic: "🍅", it: ["pomodoro", "È rosso e si usa per il sugo.", "po…"], en: ["tomato", "Red, used to make sauce.", "to…"] },
        { pic: "🧀", it: ["formaggio", "Si fa con il latte.", "for…"], en: ["cheese", "It's made from milk.", "ch…"] },
        { pic: "🍳", it: ["padella", "Si usa per friggere un uovo.", "pa…"], en: ["pan", "You fry an egg in it.", "p…"] },
        { pic: "🍷", it: ["vino", "Si beve nel bicchiere a tavola.", "vi…"], en: ["wine", "You drink it from a glass at dinner.", "wi…"] }
      ],
      cw: { it: [["SUGO", "Si mette sulla pasta"], ["FORNO", "Serve per cuocere la torta"], ["PENTOLA", "Ci si fa bollire l'acqua"], ["RICETTA", "Spiega come preparare un piatto"], ["OLIO", "Condimento d'oliva"], ["TORTA", "Dolce per il compleanno"], ["PASTA", "Spaghetti, penne o fusilli"]],
            en: [["SAUCE", "Goes on pasta"], ["OVEN", "You bake a cake in it"], ["RECIPE", "Tells you how to cook a dish"], ["PASTA", "Spaghetti or penne"], ["CAKE", "A sweet for a birthday"], ["SALT", "White and salty"], ["PAN", "You fry eggs in it"]] },
      echo: { it: [["Oggi cucino la pasta al sugo.", "Il pane è appena uscito dal forno.", "Metti un po' di sale nell'acqua."], ["un piatto di minestra", "la torta di mele", "un bicchiere di vino"], ["sale", "olio", "pane"]],
              en: [["Today I'm cooking pasta with sauce.", "The bread is fresh from the oven.", "Put some salt in the water."], ["a bowl of soup", "the apple cake", "a glass of wine"], ["salt", "bread", "cake"]] }
    },
    musica: { icon: "🎵", label: { it: "Musica", en: "Music" },
      describe: [
        { pic: "🎶", it: ["La tua canzone", "Quale canzone ti mette di buon umore?", ["Chi la canta?", "Dove l'hai sentita la prima volta?", "Cosa ti ricorda?"], ["radio", "ballare", "ritornello", "cantante"]],
                     en: ["Your song", "Which song puts you in a good mood?", ["Who sings it?", "Where did you first hear it?", "What does it remind you of?"], ["radio", "dancing", "chorus", "singer"]] },
        { pic: "🎤", it: ["Un concerto", "Racconta un concerto o una festa con musica.", ["Dove eri?", "Con chi?", "Che musica suonavano?"], ["palco", "orchestra", "applausi", "piazza"]],
                     en: ["A concert", "Tell me about a concert or a party with music.", ["Where were you?", "Who with?", "What music was playing?"], ["stage", "orchestra", "applause", "square"]] }
      ],
      name: [
        { pic: "🎸", it: ["chitarra", "Si suona pizzicando le corde.", "chi…"], en: ["guitar", "You play it by plucking the strings.", "gu…"] },
        { pic: "🎹", it: ["pianoforte", "Ha i tasti bianchi e neri.", "pia…"], en: ["piano", "It has black and white keys.", "pi…"] },
        { pic: "🥁", it: ["tamburo", "Si suona battendo.", "ta…"], en: ["drum", "You play it by hitting it.", "dr…"] },
        { pic: "🎻", it: ["violino", "Si suona con l'archetto.", "vio…"], en: ["violin", "You play it with a bow.", "vio…"] }
      ],
      cw: { it: [["CANZONE", "Si canta"], ["RADIO", "Trasmette musica e notizie"], ["CORO", "Gruppo di persone che cantano"], ["NOTA", "Do, re, mi..."], ["BALLO", "Si fa a tempo di musica"], ["CHITARRA", "Strumento a sei corde"], ["PALCO", "Dove si esibiscono i cantanti"]],
            en: [["SONG", "You sing it"], ["RADIO", "Plays music and news"], ["CHOIR", "A group of singers"], ["NOTE", "Do, re, mi..."], ["DANCE", "You do it to music"], ["GUITAR", "Six-string instrument"], ["STAGE", "Where singers perform"]] },
      echo: { it: [["Questa canzone mi piace tanto.", "Accendi la radio, per favore.", "Ballavamo tutta la sera."], ["una bella melodia", "il concerto in piazza", "la chitarra di mio padre"], ["canto", "radio", "ballo"]],
              en: [["I really like this song.", "Turn on the radio, please.", "We danced all evening."], ["a lovely tune", "the concert in the square", "my father's guitar"], ["song", "radio", "dance"]] }
    }
  };
  C.PACK_KEYS = ["calcio", "politica", "moda", "spettacolo", "cucina", "musica"];
})(window.POG.content = window.POG.content || {});
