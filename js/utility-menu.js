/*
 * One "Account and data" menu instead of a row of floating buttons.
 *
 * The account, cloud, therapist, privacy, deletion and ownership modules each add their own launcher
 * button. On a phone those fixed buttons covered the page, so this gathers every launcher into a menu
 * that opens inside the page header. The launchers keep their own click handlers and labels; they are
 * only moved. The menu is hidden during exercises, where admin options would distract the learner.
 *
 * Load this after every module that adds a launcher.
 */
(function () {
  "use strict";
  var LAUNCHERS = [
    ".account-launcher",
    ".cloud-launcher",
    ".therapist-cloud-launcher",
    /* The deletion, ownership and review launchers also carry this class, so match the privacy one exactly. */
    ".profile-lifecycle-launcher:not(.deletion-retention-launcher):not(.ownership-transfer-launcher):not(.account-deletion-review-launcher)",
    ".ownership-transfer-launcher",
    ".deletion-retention-launcher",
    ".account-deletion-review-launcher"
  ];
  var LABEL = { it: "Account e dati", en: "Account & data" };
  var app = document.getElementById("app");
  if (!app) return;
  var open = false, busy = false;
  /* The app redraws #app on every screen change, which removes the launchers. Some modules add theirs
     again; others add it only once at load. Keep each one so it can be put back after a redraw. */
  var keep = {};

  function lang() { return window.POG && window.POG.getLang ? window.POG.getLang() : "it"; }
  /* Exercise, mode-choice and summary screens: keep them free of admin controls. */
  function inExercise() { return !!app.querySelector(".steps, .modes, .sumhead"); }

  function build() {
    var wrap = document.createElement("div");
    wrap.className = "util-menu";
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "util-toggle";
    toggle.id = "util-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "util-sheet");
    toggle.innerHTML = '<span class="util-ico" aria-hidden="true">☰</span><span class="util-label"></span>';
    var sheet = document.createElement("div");
    sheet.className = "util-sheet";
    sheet.id = "util-sheet";
    sheet.hidden = true;
    wrap.appendChild(toggle);
    wrap.appendChild(sheet);
    toggle.addEventListener("click", function () { setOpen(!open); });
    /* Picking an option closes the menu; the option's own handler opens its dialog. */
    sheet.addEventListener("click", function (e) { if (e.target.closest("button")) setOpen(false); });
    return wrap;
  }
  function setOpen(v) {
    open = v;
    var t = app.querySelector(".util-toggle"), s = app.querySelector(".util-sheet");
    if (t) t.setAttribute("aria-expanded", String(v));
    if (s) s.hidden = !v;
  }
  function label() {
    var l = app.querySelector(".util-label");
    if (l) l.textContent = LABEL[lang()];
  }

  function sweep() {
    if (busy) return;
    busy = true;
    try {
      var menu = app.querySelector(".util-menu");
      var bar = app.querySelector(".bar");
      if (!menu) {
        menu = build();
        if (bar) bar.appendChild(menu); else app.insertBefore(menu, app.firstChild);
        open = false;
      } else if (bar && menu.parentNode !== bar) {
        bar.appendChild(menu);
      }
      var sheet = menu.querySelector(".util-sheet");
      /* In a stable order: account first, then data, sharing and deletion. */
      LAUNCHERS.forEach(function (sel) {
        var live = document.querySelectorAll(sel), b = live.length ? live[live.length - 1] : keep[sel];
        [].forEach.call(live, function (x) { if (x !== b && x.parentNode) x.parentNode.removeChild(x); });
        if (!b) return;
        keep[sel] = b;
        sheet.appendChild(b);
      });
      label();
      menu.hidden = inExercise() || !sheet.children.length;
      if (menu.hidden) setOpen(false);
    } finally { busy = false; }
  }

  sweep();
  if (window.MutationObserver) {
    new MutationObserver(sweep).observe(app, { childList: true });
    new MutationObserver(sweep).observe(document.body, { childList: true });
  }
  document.addEventListener("click", function (e) {
    if (open && !e.target.closest(".util-menu")) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) { setOpen(false); var t = app.querySelector(".util-toggle"); if (t) t.focus(); }
  });
  window.addEventListener("pog:languagechange", function () { setTimeout(label, 0); });
})();
