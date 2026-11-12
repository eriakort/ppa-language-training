/*
 * Communication board ("Comunica"): tap a picture to say a phrase out loud.
 *
 * For when speaking is hard: the phrase is spoken (in a family member's recorded voice when there is
 * one, otherwise the device voice) and shown in large text, which can be enlarged to show to someone.
 * Tabs: essentials (editable by a carer), the person's own phrases, people and things from the album.
 * Works without internet once the app has been opened online (see sw.js).
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi;
  if (!api) return;
  var esc = api.esc;

  var C = {
    it: {
      home: "Comunica", title: "Comunica",
      tabs: { need: "Essenziali", mine: "Le mie frasi", people: "Persone", things: "Cose e luoghi" },
      placeholder: "Tocca un'immagine per parlare.", repeat: "🔊 Ripeti", big: "⛶ Mostra grande", clear: "Cancella", closeBig: "Tocca per chiudere",
      edit: "Modifica la tabella", editTitle: "Modifica la tabella",
      editHelp: "Una frase per riga, nel formato «simbolo | frase». Per esempio: 💧 | Ho sete",
      save: "Salva", reset: "Ripristina le frasi predefinite", saved: "Tabella salvata.", restored: "Frasi predefinite ripristinate.",
      empty: "Scrivi almeno una frase.", voices: "Voci di famiglia", back: "Torna alla tabella",
      noneHere: "Nessuna voce qui. Chi assiste può aggiungerne nell'album.", noneMine: "Nessuna frase personale. Chi assiste può aggiungerle in «Frasi personali»."
    },
    en: {
      home: "Talk", title: "Talk",
      tabs: { need: "Essentials", mine: "My phrases", people: "People", things: "Things and places" },
      placeholder: "Tap a picture to speak.", repeat: "🔊 Repeat", big: "⛶ Show large", clear: "Clear", closeBig: "Tap to close",
      edit: "Edit the board", editTitle: "Edit the board",
      editHelp: "One phrase per line, as “symbol | phrase”. For example: 💧 | I'm thirsty",
      save: "Save", reset: "Restore the default phrases", saved: "Board saved.", restored: "Default phrases restored.",
      empty: "Write at least one phrase.", voices: "Family voices", back: "Back to the board",
      noneHere: "Nothing here yet. A carer can add people and things in the album.", noneMine: "No personal phrases yet. A carer can add them in “Personal phrases”."
    }
  };
  /* Gender-neutral in Italian on purpose (e.g. "Ho sonno" rather than "Sono stanco/stanca"). */
  var DEFAULTS = {
    it: [["✅", "Sì"], ["❌", "No"], ["🙏", "Grazie"], ["🤷", "Non lo so"], ["✋", "Aspetta, per favore"], ["🆘", "Aiutami, per favore"],
         ["💧", "Ho sete"], ["🍽️", "Ho fame"], ["😴", "Ho sonno"], ["🚻", "Devo andare in bagno"], ["🥶", "Ho freddo"], ["🥵", "Ho caldo"],
         ["🤕", "Mi fa male"], ["🔁", "Puoi ripetere, per favore?"], ["🐢", "Parla più piano, per favore"], ["🙂", "Sto bene"]],
    en: [["✅", "Yes"], ["❌", "No"], ["🙏", "Thank you"], ["🤷", "I don't know"], ["✋", "Wait, please"], ["🆘", "Help me, please"],
         ["💧", "I'm thirsty"], ["🍽️", "I'm hungry"], ["😴", "I'm sleepy"], ["🚻", "I need the toilet"], ["🥶", "I'm cold"], ["🥵", "I'm hot"],
         ["🤕", "It hurts"], ["🔁", "Can you say that again, please?"], ["🐢", "Please speak more slowly"], ["🙂", "I'm fine"]]
  };
  function T() { return C[api.lang()] || C.it; }
  function flashHtml() { var f = api.flashText(); return f ? '<p class="nudge">' + esc(f) + '</p>' : ''; }

  /* Essentials for the current language: the carer's own list, or the defaults. */
  function essentials() {
    var saved = api.load("board_phrases") || {}, list = saved[api.lang()];
    var src = Array.isArray(list) && list.length ? list : DEFAULTS[api.lang()];
    return src.map(function (x) { return { icon: x[0] || "💬", text: x[1] }; }).filter(function (x) { return x.text; });
  }
  function tilesFor(tab) {
    if (tab === "need") return essentials();
    if (tab === "mine") return (api.getScripts() || []).map(function (p) { return { icon: "💬", text: p.phrase, sub: p.cue || "" }; });
    return window.POG.album && window.POG.album.tiles ? window.POG.album.tiles(tab) : [];
  }

  var tab = "need", msg = "", big = false, shown = [];
  function viewBoard() {
    var t = T();
    shown = tilesFor(tab);
    var tabs = ["need", "mine", "people", "things"].map(function (k) {
      return '<button class="aac-tab" role="tab" data-act="aac-tab" data-t="' + k + '" aria-selected="' + (k === tab) + '">' + esc(t.tabs[k]) + '</button>';
    }).join("");
    var grid = shown.length
      ? '<div class="aac-grid">' + shown.map(function (x, i) {
          return '<button class="aac-tile" data-act="aac-tile" data-i="' + i + '"><span class="aac-pic">' +
            (x.photo ? '<img src="' + esc(x.photo) + '" alt="">' : '<span aria-hidden="true">' + x.icon + '</span>') + '</span>' +
            '<span class="aac-label">' + esc(x.text) + '</span>' + (x.sub ? '<small>' + esc(x.sub) + '</small>' : '') + '</button>';
        }).join("") + '</div>'
      : '<p class="sub">' + esc(tab === "mine" ? t.noneMine : t.noneHere) + '</p>';
    return api.header(false) + '<section class="card aac">' +
      '<div class="aac-bar"><p class="aac-msg' + (msg ? '' : ' empty') + '" aria-live="polite">' + esc(msg || t.placeholder) + '</p>' +
      '<div class="aac-tools"><button class="tool" data-act="aac-say"' + (msg ? '' : ' disabled') + '>' + esc(t.repeat) + '</button>' +
      '<button class="tool" data-act="aac-big"' + (msg ? '' : ' disabled') + '>' + esc(t.big) + '</button>' +
      '<button class="tool" data-act="aac-clear"' + (msg ? '' : ' disabled') + '>' + esc(t.clear) + '</button></div></div>' +
      '<div class="aac-tabs" role="tablist">' + tabs + '</div>' + grid + flashHtml() +
      '<div class="row-actions"><button class="secondary" data-act="aac-edit">' + esc(t.edit) + '</button></div>' +
      '<button class="link" data-act="home">' + esc(api.t().home) + '</button></section>' +
      (big && msg ? '<div class="aac-big" data-act="aac-big-close" role="dialog" aria-label="' + esc(msg) + '"><p>' + esc(msg) + '</p><small>' + esc(t.closeBig) + '</small></div>' : '');
  }
  function viewEdit() {
    var t = T(), lines = essentials().map(function (x) { return x.icon + " | " + x.text; });
    return api.header(false) + '<section class="card"><h1 class="instr">' + esc(t.editTitle) + '</h1><p class="sub">' + esc(t.editHelp) + '</p>' +
      '<textarea id="aac-text" aria-label="' + esc(t.editTitle) + '" spellcheck="true">' + esc(lines.join("\n")) + '</textarea>' + flashHtml() +
      '<button class="primary" data-act="aac-save">' + esc(t.save) + '</button>' +
      '<div class="row-actions"><button class="secondary" data-act="aac-reset">' + esc(t.reset) + '</button>' +
      '<button class="secondary" data-act="alb-voices">' + esc(t.voices) + '</button></div>' +
      '<button class="link" data-act="board">' + esc(t.back) + '</button></section>';
  }

  window.POG.board = {
    /* Every phrase on the board, for recording family voices. */
    phrases: function () { return essentials().map(function (x) { return x.text; }); }
  };

  var ext = window.POG.ext;
  ext.screens.board = viewBoard;
  ext.screens["aac-edit"] = viewEdit;
  ext.locked["aac-edit"] = 1;
  ext.home.unshift({ act: "board", icon: "💬", label: { it: C.it.home, en: C.en.home } });

  var A = ext.actions;
  A.board = function () { big = false; api.go("board"); };
  A["aac-tab"] = function (b) { tab = b.getAttribute("data-t") || "need"; api.render(); };
  A["aac-tile"] = function (b) {
    var x = shown[+b.getAttribute("data-i")]; if (!x) return;
    msg = x.text; api.speak(x.text); api.render();
  };
  A["aac-say"] = function () { if (msg) api.speak(msg); };
  A["aac-clear"] = function () { msg = ""; big = false; api.stopVoice(); api.render(); };
  A["aac-big"] = function () { if (msg) { big = true; api.render(); } };
  A["aac-big-close"] = function () { big = false; api.render(); };
  A["aac-edit"] = function () { api.go("aac-edit"); };
  A["aac-save"] = function () {
    var t = T(), el = document.getElementById("aac-text");
    var list = (el ? el.value : "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var i = l.indexOf("|");
      return i >= 0 ? [l.slice(0, i).trim().slice(0, 8) || "💬", l.slice(i + 1).trim().slice(0, 120)] : ["💬", l.slice(0, 120)];
    }).filter(function (x) { return x[1]; });
    if (!list.length) { api.flash(t.empty); api.render(); return; }
    var saved = api.load("board_phrases") || {}; saved[api.lang()] = list;
    api.save("board_phrases", saved); api.flash(t.saved); api.render();
  };
  A["aac-reset"] = function () {
    var saved = api.load("board_phrases") || {}; delete saved[api.lang()];
    api.save("board_phrases", saved); api.flash(T().restored); api.render();
  };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && big) { big = false; api.render(); } });
  window.addEventListener("pog:languagechange", function () { if (api.screen() === "board" || api.screen() === "aac-edit") setTimeout(api.render, 0); });

  if (api.screen() === "home") api.render();
})();
