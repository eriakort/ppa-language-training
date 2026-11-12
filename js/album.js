/*
 * "My album": the person's own family, familiar things and places, with photos and family voices.
 *
 * - The learner browses it and taps a photo to hear who or what it is.
 * - A carer (behind the PIN in patient mode) adds entries with a photo and an optional voice clip,
 *   and can record family voices for board phrases and personal phrases.
 * - Entries with a photo are used in the naming and word-building games; voice clips replace the
 *   device voice wherever the same text is spoken (window.POG.familyVoice).
 *
 * Everything stays on this device (js/album-store.js). Photos are shrunk to 640 px and re-encoded,
 * which also drops location data stored in the original file.
 */
(function () {
  "use strict";
  var api = window.POG && window.POG.appApi, store = window.POG && window.POG.albumStore;
  if (!api || !store) return;
  var app = document.getElementById("app"), esc = api.esc;

  var C = {
    it: {
      home: "Il mio album", title: "Il mio album", tapHint: "Tocca una foto per sentire chi è o che cos'è.",
      empty: "L'album è ancora vuoto. Chi assiste può aggiungere foto di famiglia, oggetti e luoghi.",
      edit: "Modifica l'album", editTitle: "Modifica l'album", add: "+ Aggiungi", voices: "Voci di famiglia", back: "Torna all'album",
      kinds: { person: "Persona", thing: "Oggetto", place: "Luogo" }, kindLabel: "Che cosa è",
      name: "Nome", namePh: { person: "es. Anna", thing: "es. tazza", place: "es. Piazza Maggiore" },
      note: "Chi è o che cos'è (facoltativo)", notePh: { person: "es. tua figlia", thing: "es. per il caffè del mattino", place: "es. dove passeggi la domenica" },
      photo: "Foto", photoRemove: "Rimuovi la foto", photoFail: "Questa foto non si può aprire. Prova con un'altra.",
      voice: "Voce di famiglia (facoltativa)", voiceHelp: "Un familiare può registrare una frase, per esempio «Sono Anna, tua figlia».",
      rec: "● Registra", recStop: "■ Ferma", recording: "Sto registrando… (massimo 20 secondi)", voiceRemove: "Elimina la voce",
      consent: "Le persone nella foto e chi registra la voce sono d'accordo.", consentNeed: "Spunta la casella del consenso per salvare foto o voce.",
      save: "Salva", cancel: "Annulla", saved: "Salvato nell'album.", nameNeed: "Scrivi un nome.",
      modify: "Modifica", del: "Elimina", delYes: "Sì, elimina", deleted: "Eliminato dall'album.", hasVoice: "con voce",
      privacy: "Foto e voci restano solo su questo dispositivo: non vanno nel backup cloud né nell'esportazione. Le foto vengono rimpicciolite e salvate senza i dati di posizione.",
      micFail: "Non è stato possibile usare il microfono.", micUnsupported: "Questo browser non può registrare la voce.",
      vTitle: "Voci di famiglia", vHelp: "Registra le frasi con la voce di un familiare. L'app userà la registrazione al posto della voce del dispositivo, nella tabella per comunicare e negli esercizi.",
      vConsent: "Chi registra la propria voce è d'accordo che venga usata in questa app.", vConfirm: "Confermo",
      voiceSaved: "Voce salvata.", voiceDeleted: "Voce eliminata.", noPhrases: "Non ci sono ancora frasi da registrare.",
      hint: { person: "Una persona che conosci.", thing: "Un oggetto che usi.", place: "Un luogo che conosci." }
    },
    en: {
      home: "My album", title: "My album", tapHint: "Tap a photo to hear who or what it is.",
      empty: "The album is still empty. A carer can add photos of family, things and places.",
      edit: "Edit the album", editTitle: "Edit the album", add: "+ Add", voices: "Family voices", back: "Back to the album",
      kinds: { person: "Person", thing: "Thing", place: "Place" }, kindLabel: "What it is",
      name: "Name", namePh: { person: "e.g. Anna", thing: "e.g. mug", place: "e.g. the park" },
      note: "Who or what it is (optional)", notePh: { person: "e.g. your daughter", thing: "e.g. for your morning coffee", place: "e.g. where you walk on Sundays" },
      photo: "Photo", photoRemove: "Remove the photo", photoFail: "This photo can't be opened. Try another one.",
      voice: "Family voice (optional)", voiceHelp: "A family member can record a phrase, for example “I'm Anna, your daughter”.",
      rec: "● Record", recStop: "■ Stop", recording: "Recording… (up to 20 seconds)", voiceRemove: "Delete the voice",
      consent: "The people in the photo and whoever records their voice agree.", consentNeed: "Tick the consent box to save a photo or voice.",
      save: "Save", cancel: "Cancel", saved: "Saved in the album.", nameNeed: "Write a name.",
      modify: "Edit", del: "Delete", delYes: "Yes, delete", deleted: "Removed from the album.", hasVoice: "with voice",
      privacy: "Photos and voices stay on this device only: they are not in the cloud backup or the export. Photos are shrunk and saved without location data.",
      micFail: "The microphone couldn't be used.", micUnsupported: "This browser can't record the voice.",
      vTitle: "Family voices", vHelp: "Record phrases in a family member's voice. The app will play the recording instead of the device voice, on the communication board and in the exercises.",
      vConsent: "Whoever records their voice agrees to it being used in this app.", vConfirm: "I confirm",
      voiceSaved: "Voice saved.", voiceDeleted: "Voice deleted.", noPhrases: "There are no phrases to record yet.",
      hint: { person: "Someone you know.", thing: "Something you use.", place: "A place you know." }
    }
  };
  var ICON = { person: "🙂", thing: "🧺", place: "🏡" };
  function T() { return C[api.lang()] || C.it; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function flashHtml() { var f = api.flashText(); return f ? '<p class="nudge">' + esc(f) + '</p>' : ''; }

  /* ---------- data ---------- */
  var items = [], urls = [], voiceMap = {};
  var form = null, formUrls = [], rec = null, recTarget = null, recTimer = null, confirmDel = "", phraseList = [];

  function refresh() {
    var pid = api.profileId();
    return store.list(pid).then(function (list) {
      urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
      urls = []; voiceMap = {};
      items = list.map(function (x) {
        var o = Object.assign({}, x);
        if (x.photo) { o.photoUrl = URL.createObjectURL(x.photo); urls.push(o.photoUrl); }
        if (x.audio) { o.audioUrl = URL.createObjectURL(x.audio); urls.push(o.audioUrl); voiceMap[norm(x.name)] = o.audioUrl; }
        return o;
      });
      var sc = api.screen();
      if (sc === "album" || sc === "alb-edit" || sc === "alb-voices" || sc === "board") api.render();
    }, function () { items = []; voiceMap = {}; });
  }
  function entries() { return items.filter(function (x) { return x.kind !== "voice" && x.name; }); }
  function byId(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }
  function voiceFor(text) { var k = norm(text); for (var i = 0; i < items.length; i++) if (items[i].kind === "voice" && norm(items[i].name) === k) return items[i]; return null; }

  window.POG.familyVoice = { get: function (text) { return voiceMap[norm(text)] || null; } };
  window.POG.album = {
    refresh: refresh,
    /* Entries with a photo, in the shape the naming games use. The name is the same in both languages. */
    namingItems: function () {
      return entries().filter(function (x) { return x.photoUrl; }).map(function (x) {
        var nm = x.name.trim(), first = nm.slice(0, Math.max(1, Math.min(3, Math.ceil(nm.length / 3)))) + "…";
        return { pic: "", photo: x.photoUrl, album: true,
          it: [nm, x.note || C.it.hint[x.kind] || "", first], en: [nm, x.note || C.en.hint[x.kind] || "", first] };
      });
    },
    /* Board tiles: people, then things and places. */
    tiles: function (kind) {
      return entries().filter(function (x) { return kind === "people" ? x.kind === "person" : x.kind !== "person"; })
        .map(function (x) { return { text: x.name, sub: x.note || "", photo: x.photoUrl || "", icon: ICON[x.kind] || "🖼️" }; });
    }
  };

  /* Shrinks a chosen photo to at most 640 px and re-encodes it as JPEG (this also drops location data). */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { if (b) resolve(b); else reject(new Error("image")); }, "image/jpeg", 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("image")); };
      img.src = url;
    });
  }
  function dropFormUrls() { formUrls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); formUrls = []; }

  /* ---------- recording a family voice ---------- */
  function startRec(target) {
    if (rec || !window.POG.createRecorder) return;
    var r = window.POG.createRecorder();
    if (!r.supported || !api.canRecord()) { api.flash(T().micUnsupported); api.render(); return; }
    rec = r; recTarget = target;
    r.start().then(function () { recTimer = setTimeout(stopRec, 20000); api.render(); },
      function () { rec = null; recTarget = null; api.flash(T().micFail); api.render(); });
    api.render();
  }
  function stopRec() {
    clearTimeout(recTimer);
    if (!rec) return Promise.resolve();
    var r = rec, tg = recTarget; rec = null; recTarget = null;
    return r.stop().then(function (res) {
      if (!res || !res.blob) { api.render(); return; }
      if (tg.type === "form" && form) {
        form.audio = res.blob; form.audioMime = res.mime;
        form.audioUrl = URL.createObjectURL(res.blob); formUrls.push(form.audioUrl);
        api.render(); return;
      }
      if (tg.type === "voice") {
        var old = voiceFor(tg.text);
        return store.put({ id: old ? old.id : store.newId(), profileId: api.profileId(), kind: "voice", name: tg.text, audio: res.blob, audioMime: res.mime })
          .then(refresh).then(function () { api.flash(T().voiceSaved); api.render(); });
      }
    });
  }
  function cancelRec() { clearTimeout(recTimer); if (rec) { rec.cancel(); rec = null; recTarget = null; } }
  function recControls(target, isTarget) {
    var t = T();
    if (rec && isTarget) return '<span class="live"><i></i>' + esc(t.recording) + '</span><button class="secondary" data-act="alb-rec-stop">' + esc(t.recStop) + '</button>';
    return '<button class="secondary" data-act="alb-rec" data-target="' + esc(target) + '"' + (rec ? ' disabled' : '') + '>' + esc(t.rec) + '</button>';
  }

  /* ---------- views ---------- */
  function picOf(x) { return x.photoUrl ? '<img src="' + esc(x.photoUrl) + '" alt="">' : '<span aria-hidden="true">' + (ICON[x.kind] || "🖼️") + '</span>'; }
  function viewAlbum() {
    var t = T(), list = entries();
    var cards = list.length
      ? '<div class="album-grid">' + list.map(function (x) {
          return '<button class="album-card" data-act="alb-play" data-id="' + esc(x.id) + '"><span class="album-pic">' + picOf(x) + '</span>' +
            '<strong>' + esc(x.name) + '</strong>' + (x.note ? '<span>' + esc(x.note) + '</span>' : '') + '</button>';
        }).join("") + '</div>'
      : '<p class="sub">' + esc(t.empty) + '</p>';
    return api.header(false) + '<section class="card"><h1 class="instr">' + esc(t.title) + '</h1>' +
      (list.length ? '<p class="sub">' + esc(t.tapHint) + '</p>' : '') + cards + flashHtml() +
      '<div class="row-actions"><button class="secondary" data-act="alb-edit">' + esc(t.edit) + '</button></div>' +
      '<button class="link" data-act="home">' + esc(api.t().home) + '</button></section>';
  }
  function viewEdit() {
    var t = T(), list = entries();
    var rows = list.map(function (x) {
      return '<li class="alb-row"><span class="alb-thumb">' + picOf(x) + '</span><span class="alb-txt"><strong>' + esc(x.name) + '</strong>' +
        '<small>' + esc(t.kinds[x.kind] || "") + (x.audioUrl ? ' · 🎙 ' + esc(t.hasVoice) : '') + '</small></span>' +
        (confirmDel === x.id
          ? '<button class="secondary danger" data-act="alb-del-yes" data-id="' + esc(x.id) + '">' + esc(t.delYes) + '</button><button class="secondary" data-act="alb-del-no">' + esc(t.cancel) + '</button>'
          : '<button class="secondary" data-act="alb-open" data-id="' + esc(x.id) + '">' + esc(t.modify) + '</button><button class="secondary" data-act="alb-del" data-id="' + esc(x.id) + '">' + esc(t.del) + '</button>') + '</li>';
    }).join("");
    return api.header(false) + '<section class="card"><h1 class="instr">' + esc(t.editTitle) + '</h1>' +
      (rows ? '<ul class="alb-list">' + rows + '</ul>' : '<p class="sub">' + esc(t.empty) + '</p>') + flashHtml() +
      '<div class="row-actions"><button class="primary" data-act="alb-new">' + esc(t.add) + '</button></div>' +
      '<div class="row-actions"><button class="secondary" data-act="alb-voices">' + esc(t.voices) + '</button><button class="secondary" data-act="album">' + esc(t.back) + '</button></div>' +
      '<button class="link" data-act="home">' + esc(api.t().home) + '</button>' +
      '<p class="note">' + esc(t.privacy) + '</p></section>';
  }
  function viewForm() {
    var t = T(), f = form, k = f.kind;
    return api.header(false) + '<section class="card"><h1 class="instr">' + esc(f.id ? t.modify : t.add.replace(/^\+\s*/, "")) + '</h1>' +
      '<div class="field"><label for="alb-kind">' + esc(t.kindLabel) + '</label><select id="alb-kind" class="alb-select">' +
      ["person", "thing", "place"].map(function (x) { return '<option value="' + x + '"' + (k === x ? ' selected' : '') + '>' + esc(t.kinds[x]) + '</option>'; }).join("") + '</select></div>' +
      '<div class="field"><label for="alb-name">' + esc(t.name) + '</label><input id="alb-name" type="text" maxlength="60" autocomplete="off" placeholder="' + esc(t.namePh[k]) + '" value="' + esc(f.name) + '"></div>' +
      '<div class="field"><label for="alb-note">' + esc(t.note) + '</label><input id="alb-note" type="text" maxlength="80" autocomplete="off" placeholder="' + esc(t.notePh[k]) + '" value="' + esc(f.note) + '"></div>' +
      '<div class="field"><label for="alb-photo">' + esc(t.photo) + '</label>' +
      (f.photoUrl ? '<img class="alb-preview" src="' + esc(f.photoUrl) + '" alt=""><button class="link" data-act="alb-photo-clear">' + esc(t.photoRemove) + '</button>' : '') +
      '<input id="alb-photo" type="file" accept="image/*"></div>' +
      '<div class="field"><span class="flabel">' + esc(t.voice) + '</span><small>' + esc(t.voiceHelp) + '</small>' +
      (f.audioUrl ? '<audio controls src="' + esc(f.audioUrl) + '"></audio><button class="link" data-act="alb-audio-clear">' + esc(t.voiceRemove) + '</button>' : '') +
      (api.canRecord() ? '<div class="row-actions alb-rec">' + recControls("form", recTarget && recTarget.type === "form") + '</div>' : '<small>' + esc(t.micUnsupported) + '</small>') + '</div>' +
      '<label class="check"><input type="checkbox" id="alb-consent"' + (f.consent ? ' checked' : '') + '>' + esc(t.consent) + '</label>' +
      flashHtml() +
      '<button class="primary" data-act="alb-save"' + (rec ? ' disabled' : '') + '>' + esc(t.save) + '</button>' +
      '<button class="link" data-act="alb-cancel">' + esc(t.cancel) + '</button></section>';
  }
  function viewVoices() {
    var t = T(), consent = api.load("family_voice_consent") === true;
    var seen = {}; phraseList = [];
    var add = function (x) { var k = norm(x); if (k && !seen[k]) { seen[k] = 1; phraseList.push(x); } };
    (window.POG.board && window.POG.board.phrases ? window.POG.board.phrases() : []).forEach(add);
    (api.getScripts() || []).forEach(function (p) { add(p.phrase); });
    var rows = phraseList.map(function (x, i) {
      var v = voiceFor(x), active = recTarget && recTarget.type === "voice" && recTarget.text === x;
      return '<li class="alb-row voice-row"><span class="alb-txt"><strong>' + esc(x) + '</strong></span>' +
        (v ? '<audio controls src="' + esc(v.audioUrl) + '"></audio>' : '') +
        '<span class="row-actions">' + (rec && active ? recControls("", true) : '<button class="secondary" data-act="alb-rec" data-target="voice" data-i="' + i + '"' + (rec ? ' disabled' : '') + '>' + esc(t.rec) + '</button>') +
        (v ? '<button class="secondary" data-act="alb-vdel" data-i="' + i + '">' + esc(t.del) + '</button>' : '') + '</span></li>';
    }).join("");
    return api.header(false) + '<section class="card"><h1 class="instr">' + esc(t.vTitle) + '</h1><p class="sub">' + esc(t.vHelp) + '</p>' +
      (!api.canRecord() ? '<p class="note">' + esc(t.micUnsupported) + '</p>'
        : !consent ? '<label class="check"><input type="checkbox" id="alb-vconsent-ok">' + esc(t.vConsent) + '</label><button class="primary" data-act="alb-vconsent">' + esc(t.vConfirm) + '</button>'
        : (rows ? '<ul class="alb-list">' + rows + '</ul>' : '<p class="sub">' + esc(t.noPhrases) + '</p>')) +
      flashHtml() + '<div class="row-actions"><button class="secondary" data-act="alb-edit">' + esc(t.back) + '</button></div>' +
      '<button class="link" data-act="home">' + esc(api.t().home) + '</button>' +
      '<p class="note">' + esc(t.privacy) + '</p></section>';
  }

  /* Copies what was typed into the form before a redraw. */
  function syncForm() {
    if (!form) return;
    var g = function (id) { var el = document.getElementById(id); return el ? el : null; };
    if (g("alb-kind")) form.kind = g("alb-kind").value;
    if (g("alb-name")) form.name = g("alb-name").value;
    if (g("alb-note")) form.note = g("alb-note").value;
    if (g("alb-consent")) form.consent = g("alb-consent").checked;
  }

  /* ---------- registration ---------- */
  var ext = window.POG.ext;
  ext.screens.album = viewAlbum;
  ext.screens["alb-edit"] = viewEdit;
  ext.screens["alb-form"] = function () { return form ? viewForm() : viewEdit(); };
  ext.screens["alb-voices"] = viewVoices;
  ext.locked["alb-edit"] = 1;
  ext.locked["alb-voices"] = 1;
  ext.home.push({ act: "album", icon: "🖼️", label: { it: C.it.home, en: C.en.home } });

  var A = ext.actions;
  A.album = function () { cancelRec(); confirmDel = ""; api.go("album"); };
  A["alb-play"] = function (b) { var x = byId(b.getAttribute("data-id")); if (x) api.speak(x.audioUrl ? x.name : x.name + (x.note ? ". " + x.note : "")); };
  A["alb-edit"] = function () { cancelRec(); dropFormUrls(); form = null; confirmDel = ""; api.go("alb-edit"); };
  A["alb-new"] = function () { dropFormUrls(); form = { id: "", kind: "person", name: "", note: "", photo: null, photoUrl: "", audio: null, audioUrl: "", audioMime: "", consent: false }; api.go("alb-form"); };
  A["alb-open"] = function (b) {
    var x = byId(b.getAttribute("data-id")); if (!x) return;
    dropFormUrls();
    form = { id: x.id, kind: x.kind, name: x.name, note: x.note || "", photo: x.photo || null, photoUrl: x.photoUrl || "", audio: x.audio || null, audioUrl: x.audioUrl || "", audioMime: x.audioMime || "", consent: !!(x.photo || x.audio) };
    api.go("alb-form");
  };
  A["alb-cancel"] = function () { cancelRec(); dropFormUrls(); form = null; api.go("alb-edit"); };
  A["alb-photo-clear"] = function () { syncForm(); form.photo = null; form.photoUrl = ""; api.render(); };
  A["alb-audio-clear"] = function () { syncForm(); form.audio = null; form.audioUrl = ""; api.render(); };
  A["alb-rec"] = function (b) {
    if (b.getAttribute("data-target") === "form") { syncForm(); startRec({ type: "form" }); return; }
    var text = phraseList[+b.getAttribute("data-i")]; if (text) startRec({ type: "voice", text: text });
  };
  A["alb-rec-stop"] = function () { syncForm(); stopRec(); };
  A["alb-save"] = function () {
    syncForm();
    var t = T(), f = form;
    if (!f.name.trim()) { api.flash(t.nameNeed); api.render(); return; }
    if ((f.photo || f.audio) && !f.consent) { api.flash(t.consentNeed); api.render(); return; }
    store.put({ id: f.id || store.newId(), profileId: api.profileId(), kind: f.kind, name: f.name.trim().slice(0, 60), note: f.note.trim().slice(0, 80),
      photo: f.photo || null, audio: f.audio || null, audioMime: f.audioMime || "" })
      .then(function () { dropFormUrls(); form = null; return refresh(); })
      .then(function () { api.flash(t.saved); api.go("alb-edit"); }, function () { api.flash(t.photoFail); api.render(); });
  };
  A["alb-del"] = function (b) { confirmDel = b.getAttribute("data-id"); api.render(); };
  A["alb-del-no"] = function () { confirmDel = ""; api.render(); };
  A["alb-del-yes"] = function (b) {
    store.remove(b.getAttribute("data-id")).then(refresh).then(function () { confirmDel = ""; api.flash(T().deleted); api.render(); });
  };
  A["alb-voices"] = function () { cancelRec(); api.go("alb-voices"); };
  A["alb-vconsent"] = function () {
    var ok = document.getElementById("alb-vconsent-ok");
    if (!ok || !ok.checked) { api.flash(T().consentNeed); api.render(); return; }
    api.save("family_voice_consent", true); api.render();
  };
  A["alb-vdel"] = function (b) {
    var v = voiceFor(phraseList[+b.getAttribute("data-i")]); if (!v) return;
    store.remove(v.id).then(refresh).then(function () { api.flash(T().voiceDeleted); api.render(); });
  };

  app.addEventListener("change", function (e) {
    if (e.target.id !== "alb-photo" || !form || !e.target.files || !e.target.files[0]) return;
    syncForm();
    shrink(e.target.files[0]).then(function (blob) {
      form.photo = blob; form.photoUrl = URL.createObjectURL(blob); formUrls.push(form.photoUrl); api.render();
    }, function () { api.flash(T().photoFail); api.render(); });
  });
  window.addEventListener("pog:profile-change", function () { cancelRec(); form = null; refresh(); });
  /* Leaving the album screens (e.g. "Back to start") stops a recording in progress. */
  app.addEventListener("click", function (e) { var b = e.target.closest('[data-act="home"]'); if (b && rec) cancelRec(); }, true);
  window.addEventListener("pog:languagechange", function () { if (/^alb-|^album$/.test(api.screen())) setTimeout(api.render, 0); });

  refresh();
  if (api.screen() === "home") api.render();
})();
