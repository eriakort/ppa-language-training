/*
 * Accessible Communication Passport ("Biglietto per chi mi ascolta / My communication card").
 * Designed for everyday shops, pharmacies, clinic visits, or urgent moments when speaking takes extra time.
 *
 * - Viewing, enlarging full screen (`pp-big`), and speaking (`pp-say`) stay freely accessible (UI_FREE.passport = 1),
 *   reachable directly from the Communication Board ("Comunica") or Therapist area.
 * - Editing custom medical/emergency notes and partner preferences (`passport-edit`) respects Patient Mode lock.
 * - Strictly device-local (`passport_card`) and contributes saved support preferences into the Physician Visit Brief.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  if (!api) return;
  var esc = api.esc;

  var STRATEGIES = ["extra_time", "short_sentences", "two_choices", "write_keywords", "quiet_space"];

  var C = {
    it: {
      btn: "Passaporto comunicativo",
      btnShort: "🪪 Biglietto aiuto",
      title: "Il mio passaporto comunicativo",
      defaultMsg: "Ho una difficoltà di linguaggio (afasia): capisco bene ciò che mi dici, ma mi serve un po' di tempo in più per trovare le parole.",
      howTitle: "Cosa mi aiuta di più quando parliamo",
      contactTitle: "Contatto familiare di riferimento",
      medTitle: "Note mediche o allergie (facoltativo)",
      sayBtn: "🔊 Leggi ad alta voce",
      bigBtn: "⛶ Mostra grande",
      closeBig: "Tocca per chiudere",
      editBtn: "✏️ Modifica dati e preferenze",
      backBoard: "Torna alla tabella",
      backTher: "Torna all'area logopedista",
      backHome: "Torna all'inizio",
      editTitle: "Personalizza il passaporto comunicativo",
      editSub: "Queste informazioni restano solo su questo dispositivo.",
      msgLabel: "Messaggio principale mostrato a chi ascolta",
      stratLabel: "Strategie utili da ricordare agli altri",
      nameLabel: "Nome del familiare o referente",
      namePh: "Esempio: Marco Rossi (figlio)",
      phoneLabel: "Telefono di riferimento",
      phonePh: "Esempio: +39 333 0000000",
      medLabel: "Promemoria clinici / allergie",
      medPh: "Esempio: nessuna allergia nota; preferisce istruzioni scritte",
      saveBtn: "Salva passaporto",
      cancelBtn: "Annulla",
      saved: "Passaporto comunicativo salvato.",
      strategies: {
        extra_time: "Lasciami 5–10 secondi senza finire la frase al posto mio.",
        short_sentences: "Parla con calma usando frasi brevi.",
        two_choices: "Fai domande con due scelte chiare («Tè o caffè?»).",
        write_keywords: "Scrivi su un foglio 1–2 parole chiave o cifre importanti.",
        quiet_space: "Abbassa TV o rumori di fondo mentre parliamo."
      },
      shortTags: {
        extra_time: "tempo extra per rispondere",
        short_sentences: "frasi brevi",
        two_choices: "scelte binarie",
        write_keywords: "parole chiave scritte",
        quiet_space: "ambiente silenzioso"
      }
    },
    en: {
      btn: "Communication passport",
      btnShort: "🪪 Help card",
      title: "My communication passport",
      defaultMsg: "I have a speech and language condition (aphasia): my thinking is clear, but finding words or speaking takes me extra time.",
      howTitle: "What helps me most in conversation",
      contactTitle: "Emergency / family contact",
      medTitle: "Medical notes or allergies (optional)",
      sayBtn: "🔊 Read aloud",
      bigBtn: "⛶ Show large card",
      closeBig: "Tap anywhere to close",
      editBtn: "✏️ Edit card & preferences",
      backBoard: "Back to talk board",
      backTher: "Back to therapist area",
      backHome: "Back to home",
      editTitle: "Customise communication passport",
      editSub: "Everything shown on this card stays strictly on this device.",
      msgLabel: "Main message shown to listeners",
      stratLabel: "Helpful communication strategies",
      nameLabel: "Family / carer contact name",
      namePh: "Example: Sarah Taylor (daughter)",
      phoneLabel: "Contact phone",
      phonePh: "Example: +44 7700 900000",
      medLabel: "Clinical reminders / allergies",
      medPh: "Example: prefers written clinic appointment times",
      saveBtn: "Save passport",
      cancelBtn: "Cancel",
      saved: "Communication passport saved.",
      strategies: {
        extra_time: "Please allow me 5–10 extra seconds without finishing my sentence.",
        short_sentences: "Speak calmly in clear, short sentences.",
        two_choices: "Offer simple two-choice questions (“Tea or coffee?”).",
        write_keywords: "Write down 1–2 key words, dates, or numbers.",
        quiet_space: "Reduce background noise when possible."
      },
      shortTags: {
        extra_time: "extra response time",
        short_sentences: "short sentences",
        two_choices: "two-choice questions",
        write_keywords: "written keywords",
        quiet_space: "quiet environment"
      }
    }
  };

  function T() { return C[api.lang()] || C.it; }

  function getCard() {
    var saved = api.load("passport_card") || {};
    var defStrats = ["extra_time", "write_keywords"];
    return {
      message: typeof saved.message === "string" && saved.message.trim() ? saved.message.trim() : "",
      strategies: Array.isArray(saved.strategies) ? saved.strategies.filter(function (k) { return STRATEGIES.indexOf(k) >= 0; }) : defStrats,
      emergencyName: saved.emergencyName || "",
      emergencyPhone: saved.emergencyPhone || "",
      medNote: saved.medNote || "",
      updatedAt: saved.updatedAt || null
    };
  }

  function saveCard(next) {
    var clean = {
      message: String((next && next.message) || "").trim().slice(0, 280),
      strategies: Array.isArray(next && next.strategies) ? next.strategies.filter(function (k) { return STRATEGIES.indexOf(k) >= 0; }) : [],
      emergencyName: String((next && next.emergencyName) || "").trim().slice(0, 80),
      emergencyPhone: String((next && next.emergencyPhone) || "").trim().slice(0, 40),
      medNote: String((next && next.medNote) || "").trim().slice(0, 200),
      updatedAt: new Date().toISOString()
    };
    api.save("passport_card", clean);
    return clean;
  }

  var big = false;
  var fromScreen = "board";

  function viewCard() {
    var t = T(), card = getCard(), f = api.flashText ? api.flashText() : "";
    var mainText = card.message || t.defaultMsg;
    var prof = api.getProfile ? api.getProfile() : {};
    var whoName = prof && prof.name ? prof.name : "";

    var stratHtml = card.strategies.length
      ? '<ul class="pp-list">' + card.strategies.map(function (k) { return '<li>' + esc(t.strategies[k]) + '</li>'; }).join("") + '</ul>'
      : '';

    var contactHtml = (card.emergencyName || card.emergencyPhone)
      ? '<div class="pp-box"><strong>' + esc(t.contactTitle) + '</strong><p>' +
        esc([card.emergencyName, card.emergencyPhone].filter(Boolean).join(" · ")) + '</p></div>'
      : '';

    var medHtml = card.medNote
      ? '<div class="pp-box"><strong>' + esc(t.medTitle) + '</strong><p>' + esc(card.medNote) + '</p></div>'
      : '';

    return api.header(false) +
      '<section class="card">' +
      '<p class="tag">' + esc(t.title + (whoName ? " · " + whoName : "")) + '</p>' +
      '<div class="pp-hero"><p class="pp-msg">' + esc(mainText) + '</p></div>' +
      '<div class="tools">' +
      '<button type="button" class="tool" data-act="pp-say">' + esc(t.sayBtn) + '</button>' +
      '<button type="button" class="tool" data-act="pp-big">' + esc(t.bigBtn) + '</button>' +
      '</div>' +
      (stratHtml ? '<div class="pp-box"><h2>' + esc(t.howTitle) + '</h2>' + stratHtml + '</div>' : '') +
      contactHtml +
      medHtml +
      (f ? '<p class="nudge" role="status">' + esc(f) + '</p>' : '') +
      '<div class="row-actions">' +
      '<button type="button" class="secondary" data-act="pp-edit">' + esc(t.editBtn) + '</button>' +
      (fromScreen === "therapist"
        ? '<button type="button" class="link" data-act="therapist">' + esc(t.backTher) + '</button>'
        : '<button type="button" class="link" data-act="board">' + esc(t.backBoard) + '</button>') +
      '</div>' +
      '</section>' +
      (big ? '<div class="aac-big" data-act="pp-big-close" role="dialog" aria-label="' + esc(mainText) + '"><p>' + esc(mainText) + '</p><small>' + esc(t.closeBig) + '</small></div>' : '');
  }

  function viewEdit() {
    var t = T(), card = getCard();
    var msgVal = card.message || t.defaultMsg;
    var checks = STRATEGIES.map(function (k) {
      var checked = card.strategies.indexOf(k) >= 0;
      return '<label class="check"><input type="checkbox" class="pp-strat-chk" value="' + esc(k) + '"' + (checked ? ' checked' : '') + '><span>' + esc(t.strategies[k]) + '</span></label>';
    }).join("");

    return api.header(false) +
      '<section class="card">' +
      '<h1 class="instr">' + esc(t.editTitle) + '</h1>' +
      '<p class="sub">' + esc(t.editSub) + '</p>' +
      '<div class="field"><label for="pp-message">' + esc(t.msgLabel) + '</label>' +
      '<textarea id="pp-message" rows="3">' + esc(msgVal) + '</textarea></div>' +
      '<div class="pp-checks"><p class="vb-sub">' + esc(t.stratLabel) + '</p>' + checks + '</div>' +
      '<div class="field"><label for="pp-cname">' + esc(t.nameLabel) + '</label>' +
      '<input id="pp-cname" type="text" placeholder="' + esc(t.namePh) + '" value="' + esc(card.emergencyName) + '"></div>' +
      '<div class="field"><label for="pp-cphone">' + esc(t.phoneLabel) + '</label>' +
      '<input id="pp-cphone" type="tel" placeholder="' + esc(t.phonePh) + '" value="' + esc(card.emergencyPhone) + '"></div>' +
      '<div class="field"><label for="pp-med">' + esc(t.medLabel) + '</label>' +
      '<input id="pp-med" type="text" placeholder="' + esc(t.medPh) + '" value="' + esc(card.medNote) + '"></div>' +
      '<div class="row-actions">' +
      '<button type="button" class="primary" data-act="pp-save">' + esc(t.saveBtn) + '</button>' +
      '<button type="button" class="secondary" data-act="passport">' + esc(t.cancelBtn) + '</button>' +
      '</div>' +
      '</section>';
  }

  var ext = window.POG.ext, A = ext.actions;
  ext.screens.passport = viewCard;
  ext.screens["passport-edit"] = viewEdit;
  ext.locked["passport-edit"] = 1;

  A.passport = function () {
    var cur = api.screen();
    if (cur === "therapist" || cur === "board") fromScreen = cur;
    big = false;
    api.go("passport");
  };
  A["pp-edit"] = function () { api.go("passport-edit"); };
  A["pp-say"] = function () {
    var t = T(), card = getCard();
    api.speak(card.message || t.defaultMsg);
  };
  A["pp-big"] = function () { big = true; api.render(); };
  A["pp-big-close"] = function () { big = false; api.render(); };
  A["pp-save"] = function () {
    var msgEl = document.getElementById("pp-message");
    var nameEl = document.getElementById("pp-cname");
    var phoneEl = document.getElementById("pp-cphone");
    var medEl = document.getElementById("pp-med");
    var checked = [].slice.call(document.querySelectorAll(".pp-strat-chk:checked")).map(function (c) { return c.value; });
    var rawMsg = msgEl ? msgEl.value.trim() : "";
    saveCard({
      message: rawMsg === T().defaultMsg ? "" : rawMsg,
      strategies: checked,
      emergencyName: nameEl ? nameEl.value : "",
      emergencyPhone: phoneEl ? phoneEl.value : "",
      medNote: medEl ? medEl.value : ""
    });
    if (api.flash) api.flash(T().saved);
    api.go("passport");
  };

  window.addEventListener("pog:languagechange", function () {
    var sc = api.screen();
    if (sc === "passport" || sc === "passport-edit") api.render();
  });
  window.addEventListener("pog:profile-change", function () { big = false; });

  window.POG.passport = {
    label: function () { return T().btn; },
    shortLabel: function () { return T().btnShort; },
    get: getCard,
    saveCard: saveCard,
    activeStrategyLabels: function () {
      var t = T(), card = getCard();
      return card.strategies.map(function (k) { return t.shortTags[k]; }).filter(Boolean);
    }
  };
})();
