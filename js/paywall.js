/*
 * Phase 2 Free vs. Full Access Paywall & Access-Code Redemption UI.
 *
 * Keeps core daily safety tools (Talk Board, Personal Album, Communication Passport,
 * onboarding/placement, and the first 3 daily sessions + 3 foundational PPA drills)
 * completely free, while gating unlimited daily sessions, specialized targeted
 * modules, and pro clinician analytics behind server-verified Full Access.
 */
(function () {
  "use strict";
  var FREE_SESSION_LIMIT = 3;
  var TRIAL_KEY = "pog_free_sessions_v1";
  var FREE_VARIANT_DOMAINS = { sentence: true, semantic: true, soundspan: true };

  var PAID_TARGETED_ACTS = {
    "func-home": 1, "wb-home": 1, "wr-home": 1, "disc-home": 1, "pace-home": 1,
    "verbs-home": 1, "narr-home": 1, "gram-home": 1, "surf-home": 1, "circ-home": 1,
    "num-home": 1, "dg-home": 1, "inst-home": 1, "prag-home": 1, "flu-home": 1,
    "pros-home": 1, "ques-home": 1
  };
  var PAID_TARGETED_SCREENS = {
    functional: 1, wordbank: 1, writing: 1, discourse: 1, pacing: 1,
    verbs: 1, narrative: 1, grammar: 1, surface: 1, circumlocution: 1,
    numbers: 1, dialogue: 1, instructions: 1, pragmatics: 1, fluency: 1,
    prosody: 1, questions: 1
  };
  var PAID_THERAPIST_ACTS = {
    progress: 1, "chk-results": 1, report: 1, brief: 1,
    carelog: 1, "wb-manage": 1, export: 1, "local-backup": 1
  };
  var PAID_THERAPIST_SCREENS = {
    progress: 1, "chk-results": 1, report: 1, brief: 1,
    carelog: 1, "wb-manage": 1
  };

  var COPY = {
    it: {
      badgeFull: "✓ Accesso completo attivo",
      badgeFullUntil: "✓ Accesso completo attivo · fino al {date}",
      badgeFreeLeft: "Piano gratuito · {n} di {max} sessioni giornaliere rimaste",
      badgeFreeZero: "Piano gratuito · 3 sessioni giornaliere completate",
      manageBtn: "Piano e codice",
      unlockBtn: "Sblocca o inserisci codice",
      lockShort: "Completo",
      modalTitleManage: "Piano e codice di accesso",
      modalTitleLimit: "Sessioni gratuite completate",
      modalTitleFeature: "Funzione del piano completo",
      leadLimit: "Hai completato tutte le 3 sessioni giornaliere gratuite. Attiva l'accesso completo con un codice per continuare senza limiti.",
      leadFeature: "«{name}» fa parte del piano completo. Inserisci un codice di accesso per sbloccare tutte le attività.",
      leadManage: "Gestisci il tuo piano o attiva un codice ricevuto dal tuo logopedista o amministratore.",
      leadFull: "Il tuo account ha l'accesso completo attivo. Tutte le sessioni, i moduli mirati e gli strumenti clinici sono sbloccati.",
      alwaysFree: "La Tabella di comunicazione, l'Album personale e la Scheda di aiuto restano sempre gratuiti.",
      benefitsTitle: "Cosa include l'accesso completo",
      benefits: [
        "Sessioni giornaliere illimitate su tutti i livelli",
        "Tutti i 20 moduli mirati per profilo PPA e sessioni guidate",
        "Scheda per la visita medica, grafici di andamento, PDF e log familiare"
      ],
      signInHint: "Accedi al tuo account prima di attivare un codice, così il tuo accesso resta salvato anche su altri dispositivi.",
      signInBtn: "Accedi o crea account",
      codeLabel: "Codice di accesso",
      codePlaceholder: "POG-XXXX-XXXX",
      redeemBtn: "Attiva codice",
      redeeming: "Verifica in corso…",
      redeemSuccess: "Accesso completo attivato fino al {date}.",
      patientNotice: "Chiedi a un familiare o a chi assiste di sbloccare l'accesso completo dalle impostazioni.",
      stripeSoon: "Pagamento con carta in arrivo nella prossima fase — al momento è attivo lo sblocco tramite codice di accesso.",
      close: "Chiudi",
      pendingDetected: "Codice rilevato dal link: {code}",
      err: {
        invalid_code: "Codice non trovato o formato non valido. Controlla lettere e trattini.",
        code_revoked: "Questo codice non è più attivo.",
        code_expired: "Questo codice è scaduto.",
        already_redeemed: "Hai già attivato questo codice su questo account.",
        code_exhausted: "Questo codice ha già raggiunto il numero massimo di utilizzi.",
        generic: "Impossibile attivare il codice. Verifica la connessione e riprova."
      },
      featureFallback: "questa funzione"
    },
    en: {
      badgeFull: "✓ Full access active",
      badgeFullUntil: "✓ Full access active · until {date}",
      badgeFreeLeft: "Free plan · {n} of {max} daily sessions left",
      badgeFreeZero: "Free plan · 3 daily sessions completed",
      manageBtn: "Plan & code",
      unlockBtn: "Unlock or enter code",
      lockShort: "Full",
      modalTitleManage: "Plan & access code",
      modalTitleLimit: "Free daily sessions used",
      modalTitleFeature: "Full access feature",
      leadLimit: "You have completed your 3 free daily sessions. Activate full access with an access code to continue without limits.",
      leadFeature: "“{name}” is part of Full Access. Enter an access code to unlock all exercises and tools.",
      leadManage: "View your current plan or enter an access code shared with you.",
      leadFull: "Your account has active Full Access. Unlimited daily sessions, all targeted modules, and clinician reports are unlocked.",
      alwaysFree: "The Talk Board, Personal Album, and Communication Help Card always remain free.",
      benefitsTitle: "What Full Access includes",
      benefits: [
        "Unlimited daily practice sessions across all levels",
        "All 20 targeted PPA exercise modules and guided mixed runs",
        "Clinical Visit Brief, progress trend charts, printable reports, and carer log"
      ],
      signInHint: "Sign in to your account first so your access code stays linked to your account across devices.",
      signInBtn: "Sign in or create account",
      codeLabel: "Access code",
      codePlaceholder: "POG-XXXX-XXXX",
      redeemBtn: "Activate code",
      redeeming: "Checking code…",
      redeemSuccess: "Full access activated until {date}.",
      patientNotice: "Ask a family member or carer to unlock Full Access from settings.",
      stripeSoon: "Online card checkout is coming soon — for now you can unlock full access with an access code.",
      close: "Close",
      pendingDetected: "Code ready from your link: {code}",
      err: {
        invalid_code: "Access code not found or invalid format. Check the letters and dashes.",
        code_revoked: "This access code is no longer active.",
        code_expired: "This access code has expired.",
        already_redeemed: "You have already redeemed this access code on your account.",
        code_exhausted: "This access code has reached its maximum number of users.",
        generic: "Could not activate the code. Please check your connection and try again."
      },
      featureFallback: "this feature"
    }
  };

  function lang() {
    return window.POG && window.POG.getLang ? window.POG.getLang() : "it";
  }
  function T() { return COPY[lang()] || COPY.it; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fill(s, o) {
    return String(s || "").replace(/\{(\w+)\}/g, function (_, k) {
      return o && o[k] != null ? o[k] : "";
    });
  }
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(lang() === "it" ? "it-IT" : "en-GB", {
      day: "numeric", month: "short", year: "numeric"
    });
  }

  function entApi() { return window.POG && window.POG.entitlements ? window.POG.entitlements : null; }
  function hasFullAccess() {
    var e = entApi();
    return !!(e && e.isFull && e.isFull());
  }
  function freeSessionsUsed() {
    try {
      var n = parseInt(localStorage.getItem(TRIAL_KEY) || "0", 10);
      return isFinite(n) && n > 0 ? n : 0;
    } catch (e) { return 0; }
  }
  function freeSessionsLeft() {
    return Math.max(0, FREE_SESSION_LIMIT - freeSessionsUsed());
  }
  function recordDailySession() {
    if (hasFullAccess()) return freeSessionsUsed();
    var next = freeSessionsUsed() + 1;
    try { localStorage.setItem(TRIAL_KEY, String(next)); } catch (e) {}
    return next;
  }

  function isPaidTargetedAct(act) { return !!PAID_TARGETED_ACTS[act]; }
  function isPaidTherapistAct(act) { return !!PAID_THERAPIST_ACTS[act]; }
  function allowScreen(screenName) {
    if (hasFullAccess()) return true;
    return !(PAID_TARGETED_SCREENS[screenName] || PAID_THERAPIST_SCREENS[screenName]);
  }

  function labelFromButton(b) {
    if (!b) return "";
    var strong = b.querySelector("strong");
    if (strong && strong.textContent) return strong.textContent.trim();
    return (b.textContent || "").trim();
  }

  function allowAction(act, el) {
    if (hasFullAccess()) return true;
    if (act === "start" || act === "pick-prev" || act === "pick-new" || act === "pick-open") {
      if (freeSessionsUsed() >= FREE_SESSION_LIMIT) {
        openModal({ reason: "limit" });
        return false;
      }
      return true;
    }
    if (act === "var-start") {
      var m = el && el.getAttribute ? el.getAttribute("data-m") : "";
      if (m && !FREE_VARIANT_DOMAINS[m]) {
        openModal({ reason: "feature", featureLabel: labelFromButton(el) || m });
        return false;
      }
      return true;
    }
    if (PAID_TARGETED_ACTS[act] || PAID_THERAPIST_ACTS[act]) {
      openModal({ reason: "feature", featureLabel: labelFromButton(el) });
      return false;
    }
    return true;
  }

  function guardScreen(screenName) {
    if (allowScreen(screenName)) return true;
    if (window.POG && window.POG.appApi && window.POG.appApi.go) {
      window.POG.appApi.go("home");
    }
    openModal({ reason: "feature", featureLabel: screenName });
    return false;
  }

  function homeBannerHtml(lc) {
    var t = COPY[lc === "en" ? "en" : "it"] || COPY.it;
    var e = entApi();
    if (hasFullAccess()) {
      var st = e && e.status ? e.status() : {};
      var d = fmtDate(st.activeUntil);
      var msg = d ? fill(t.badgeFullUntil, { date: d }) : t.badgeFull;
      return '<div class="pw-banner full" role="status"><span>' + esc(msg) + '</span>' +
        '<button type="button" class="link pw-inline-btn" data-act="pw-open">' + esc(t.manageBtn) + '</button></div>';
    }
    var left = freeSessionsLeft();
    var text = left > 0 ? fill(t.badgeFreeLeft, { n: left, max: FREE_SESSION_LIMIT }) : t.badgeFreeZero;
    var pending = e && e.pendingCode ? e.pendingCode() : "";
    var extra = pending ? ' <span class="pw-pending-chip">' + esc(fill(t.pendingDetected, { code: pending })) + '</span>' : "";
    return '<div class="pw-banner free" role="status"><span>' + esc(text) + extra + '</span>' +
      '<button type="button" class="secondary pw-inline-btn" data-act="pw-open">' + esc(t.unlockBtn) + '</button></div>';
  }

  function lockBadgeHtml(lc) {
    if (hasFullAccess()) return "";
    var t = COPY[lc === "en" ? "en" : "it"] || COPY.it;
    return '<span class="var-badge pw-lock" aria-hidden="true">🔒 ' + esc(t.lockShort) + '</span>';
  }

  /* ---------- Paywall & Code Redemption Modal ---------- */
  var panel = null;
  var modalState = { open: false, reason: "manage", featureLabel: "", msg: "", err: "", busy: false, codeDraft: "" };

  function isPatientLocked() {
    return !!(window.POG && window.POG.appApi && window.POG.appApi.isLocked && window.POG.appApi.isLocked());
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("section");
    panel.className = "pw-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "pw-title");
    panel.hidden = true;
    panel.addEventListener("click", function (ev) {
      if (ev.target === panel) { closeModal(); return; }
      var btn = ev.target.closest("[data-pw]");
      if (!btn || btn.disabled) return;
      var act = btn.getAttribute("data-pw");
      if (act === "close") closeModal();
      else if (act === "signin") {
        closeModal();
        window.dispatchEvent(new CustomEvent("pog:open-account"));
      }
    });
    panel.addEventListener("submit", function (ev) {
      var form = ev.target.closest("form[data-pw-form]");
      if (!form) return;
      ev.preventDefault();
      submitCode(form);
    });
    document.body.appendChild(panel);
    return panel;
  }

  function mapError(err) {
    var t = T();
    var code = err && err.code ? String(err.code) : "";
    if (code && t.err[code]) return t.err[code];
    var msg = err && err.message ? String(err.message) : "";
    if (msg.indexOf("invalid_code") >= 0) return t.err.invalid_code;
    if (msg.indexOf("code_revoked") >= 0) return t.err.code_revoked;
    if (msg.indexOf("code_expired") >= 0) return t.err.code_expired;
    if (msg.indexOf("already_redeemed") >= 0) return t.err.already_redeemed;
    if (msg.indexOf("code_exhausted") >= 0) return t.err.code_exhausted;
    return t.err.generic;
  }

  async function submitCode(form) {
    var e = entApi();
    if (!e || modalState.busy) return;
    var input = form.querySelector('input[name="code"]');
    var raw = input ? input.value.trim().toUpperCase() : "";
    modalState.codeDraft = raw;
    modalState.err = "";
    modalState.msg = "";
    modalState.busy = true;
    renderModal();
    try {
      var res = await e.redeemCode(raw);
      modalState.busy = false;
      modalState.codeDraft = "";
      var until = fmtDate((res && (res.active_until || res.expires_at)) || (e.status && e.status().activeUntil));
      modalState.msg = until ? fill(T().redeemSuccess, { date: until }) : T().leadFull;
      renderModal();
      if (window.POG && window.POG.appApi && window.POG.appApi.render) {
        window.POG.appApi.render();
      }
    } catch (err) {
      modalState.busy = false;
      modalState.err = mapError(err);
      renderModal();
    }
  }

  function renderModal() {
    if (!panel) return;
    var t = T();
    var e = entApi();
    var st = e && e.status ? e.status() : { uid: "", tier: "free", activeUntil: null };
    var full = hasFullAccess();
    var signedIn = !!st.uid;
    var pending = modalState.codeDraft || (e && e.pendingCode ? e.pendingCode() : "");

    var title = full ? t.modalTitleManage
      : modalState.reason === "limit" ? t.modalTitleLimit
      : modalState.reason === "feature" ? t.modalTitleFeature
      : t.modalTitleManage;

    var lead = full ? t.leadFull
      : modalState.reason === "limit" ? t.leadLimit
      : modalState.reason === "feature" ? fill(t.leadFeature, { name: modalState.featureLabel || t.featureFallback })
      : t.leadManage;

    var statusLine = full
      ? '<p class="account-message">' + esc(fmtDate(st.activeUntil) ? fill(t.badgeFullUntil, { date: fmtDate(st.activeUntil) }) : t.badgeFull) + '</p>'
      : '';

    var bodyHtml = "";
    if (isPatientLocked()) {
      bodyHtml = '<p class="account-note">' + esc(t.patientNotice) + '</p>';
    } else if (!signedIn) {
      bodyHtml = '<p class="account-note">' + esc(t.signInHint) + '</p>' +
        (pending ? '<p class="pw-pending-chip">' + esc(fill(t.pendingDetected, { code: pending })) + '</p>' : '') +
        '<button type="button" class="primary account-action" data-pw="signin">' + esc(t.signInBtn) + '</button>';
    } else {
      bodyHtml = '<form data-pw-form="redeem">' +
        '<label>' + esc(t.codeLabel) +
        '<input name="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="32" placeholder="' + esc(t.codePlaceholder) + '" value="' + esc(pending) + '" required>' +
        '</label>' +
        '<button type="submit" class="primary account-action"' + (modalState.busy ? ' disabled' : '') + '>' +
        esc(modalState.busy ? t.redeeming : t.redeemBtn) + '</button></form>';
    }

    var html = '<div class="pw-card">' +
      '<div class="account-head"><h2 id="pw-title">' + esc(title) + '</h2>' +
      '<button type="button" class="account-close" data-pw="close" aria-label="' + esc(t.close) + '">×</button></div>' +
      '<p class="sub">' + esc(lead) + '</p>' +
      statusLine +
      '<div class="pw-box"><h3>' + esc(t.benefitsTitle) + '</h3><ul class="pw-list">' +
      t.benefits.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join("") + '</ul>' +
      '<p class="account-note">' + esc(t.alwaysFree) + '</p></div>' +
      bodyHtml +
      (modalState.msg ? '<p class="account-message" role="status">' + esc(modalState.msg) + '</p>' : '') +
      (modalState.err ? '<p class="account-error" role="alert">' + esc(modalState.err) + '</p>' : '') +
      '<p class="account-note">' + esc(t.stripeSoon) + '</p>' +
      '</div>';

    panel.innerHTML = html;
  }

  function openModal(opts) {
    ensurePanel();
    opts = opts || {};
    modalState.open = true;
    modalState.reason = opts.reason || "manage";
    modalState.featureLabel = opts.featureLabel || "";
    modalState.msg = "";
    modalState.err = "";
    modalState.busy = false;
    renderModal();
    panel.hidden = false;
    var focusEl = panel.querySelector("input,button[data-pw='signin'],button.account-close");
    if (focusEl) focusEl.focus();
  }

  function closeModal() {
    modalState.open = false;
    if (panel) panel.hidden = true;
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && panel && !panel.hidden) closeModal();
  });

  function refreshAppUi() {
    if (panel && !panel.hidden) renderModal();
    var appApi = window.POG && window.POG.appApi;
    if (!appApi) return;
    var cur = appApi.screen ? appApi.screen() : "home";
    if (!allowScreen(cur)) {
      appApi.go("home");
    } else if (appApi.render) {
      appApi.render();
    }
  }

  window.addEventListener("pog:entitlementchange", refreshAppUi);
  window.addEventListener("pog:authchange", function () {
    if (panel && !panel.hidden) renderModal();
  });
  window.addEventListener("pog:languagechange", function () {
    if (panel && !panel.hidden) renderModal();
  });

  window.POG = window.POG || {};
  window.POG.paywall = {
    FREE_SESSION_LIMIT: FREE_SESSION_LIMIT,
    hasFullAccess: hasFullAccess,
    freeSessionsUsed: freeSessionsUsed,
    freeSessionsLeft: freeSessionsLeft,
    recordDailySession: recordDailySession,
    isPaidTargetedAct: isPaidTargetedAct,
    isPaidTherapistAct: isPaidTherapistAct,
    allowScreen: allowScreen,
    allowAction: allowAction,
    guardScreen: guardScreen,
    homeBannerHtml: homeBannerHtml,
    lockBadgeHtml: lockBadgeHtml,
    lockLabel: function (lc) { return (COPY[lc === "en" ? "en" : "it"] || COPY.it).lockShort; },
    openModal: openModal,
    closeModal: closeModal
  };

  /* Re-render home/variants or enforce screen access once paywall loads after app.js. */
  refreshAppUi();
})();
