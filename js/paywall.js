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
      subSectionTitle: "Abbonamento online con Stripe",
      planMonthlyTitle: "Mensile",
      planMonthlyDesc: "Accesso completo flessibile ogni mese",
      planMonthlyBtn: "Abbonati · Mensile",
      planYearlyTitle: "Annuale",
      planYearlyDesc: "Un intero anno di accesso completo",
      planYearlyBtn: "Abbonati · Annuale",
      portalTitle: "Abbonamento e fatturazione",
      portalDesc: "Gestisci rinnovo, metodo di pagamento o disdetta dal portale sicuro Stripe.",
      portalBtn: "Gestisci abbonamento",
      openingStripe: "Apertura pagamento sicuro Stripe…",
      openingPortal: "Apertura portale abbonamento…",
      refreshPlanBtn: "Aggiorna stato piano",
      refreshDoneFull: "Accesso completo confermato e attivo.",
      refreshDoneFree: "Stato aggiornato: piano gratuito attivo.",
      checkoutSuccessFull: "Pagamento completato! L'accesso completo è ora attivo.",
      checkoutSuccessWait: "Pagamento completato! Stiamo finalizzando l'attivazione sul tuo account; premi «Aggiorna stato piano» tra qualche secondo se non risulta ancora attivo.",
      checkoutCanceled: "Pagamento annullato. Nessun addebito è stato effettuato.",
      portalReturned: "Sei tornato dal portale di fatturazione Stripe.",
      stripeNotReady: "Il pagamento online con carta non è ancora attivo su questo server. Puoi comunque sbloccare subito il piano completo con un codice di accesso.",
      noCustomerPortal: "Nessun abbonamento Stripe collegato a questo account.",
      stripeContinueBtn: "Continua su Stripe ↗",
      stripePopupNote: "La pagina sicura Stripe è pronta: premi il pulsante qui sotto per aprirla in una nuova scheda.",
      stripeErrInvalidKey: "Chiave Stripe non valida sul server: verifica la chiave segreta nelle impostazioni di fatturazione del server (senza virgolette).",
      stripeErrInvalidPrice: "ID prezzo Stripe non valido sul server: verifica di aver inserito l'ID del prezzo (e non quello del prodotto).",
      stripeErrPriceNotRecurring: "Il prezzo Stripe configurato è «Una tantum»: deve invece essere «Ricorrente» (mensile o annuale).",
      stripeErrPriceNotFound: "Prezzo Stripe non trovato: verifica che la chiave segreta e gli ID prezzo siano entrambi in modalità Test (o entrambi in Live).",
      stripeErrPortalNotConfigured: "Il Portale Clienti Stripe non è ancora salvato nelle impostazioni di Fatturazione su Stripe Dashboard.",
      stripeError: "Impossibile avviare la sessione Stripe. Riprova tra poco o usa un codice di accesso.",
      orCodeTitle: "Hai ricevuto un codice di accesso?",
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
      leadLimit: "You have completed your 3 free daily sessions. Subscribe or activate an access code to continue without limits.",
      leadFeature: "“{name}” is part of Full Access. Subscribe or enter an access code to unlock all exercises and tools.",
      leadManage: "Manage your subscription, subscribe online, or enter an access code shared with you.",
      leadFull: "Your account has active Full Access. Unlimited daily sessions, all targeted modules, and clinician reports are unlocked.",
      alwaysFree: "The Talk Board, Personal Album, and Communication Help Card always remain free.",
      benefitsTitle: "What Full Access includes",
      benefits: [
        "Unlimited daily practice sessions across all levels",
        "All 20 targeted PPA exercise modules and guided mixed runs",
        "Clinical Visit Brief, progress trend charts, printable reports, and carer log"
      ],
      signInHint: "Sign in to your account first so your subscription or access code stays linked across devices.",
      signInBtn: "Sign in or create account",
      codeLabel: "Access code",
      codePlaceholder: "POG-XXXX-XXXX",
      redeemBtn: "Activate code",
      redeeming: "Checking code…",
      redeemSuccess: "Full access activated until {date}.",
      patientNotice: "Ask a family member or carer to unlock Full Access from settings.",
      subSectionTitle: "Subscribe online with Stripe",
      planMonthlyTitle: "Monthly",
      planMonthlyDesc: "Flexible monthly Full Access subscription",
      planMonthlyBtn: "Subscribe Monthly",
      planYearlyTitle: "Yearly",
      planYearlyDesc: "One full year of unlimited practice",
      planYearlyBtn: "Subscribe Yearly",
      portalTitle: "Subscription & billing",
      portalDesc: "Update your card, view invoices, or cancel anytime in the Stripe Customer Portal.",
      portalBtn: "Manage subscription",
      openingStripe: "Opening secure Stripe checkout…",
      openingPortal: "Opening billing portal…",
      refreshPlanBtn: "Refresh plan status",
      refreshDoneFull: "Full access confirmed and active.",
      refreshDoneFree: "Status refreshed: Free plan active.",
      checkoutSuccessFull: "Payment completed! Full Access is now active on your account.",
      checkoutSuccessWait: "Payment received! Confirming your Full Access activation now — press Refresh plan status in a moment if needed.",
      checkoutCanceled: "Checkout canceled. No charge was made.",
      portalReturned: "Returned from the Stripe billing portal.",
      stripeNotReady: "Online card checkout is not enabled on this server yet. You can unlock Full Access right away with an access code.",
      noCustomerPortal: "No Stripe subscription is linked to this account yet.",
      stripeContinueBtn: "Continue to Stripe ↗",
      stripePopupNote: "Your secure Stripe session is ready. Click below to open it in a new browser tab.",
      stripeErrInvalidKey: "Stripe rejected the server secret key: check that the billing secret key is pasted accurately in server secrets (with no extra quotes).",
      stripeErrInvalidPrice: "Invalid Stripe Price ID on the server: make sure you entered the Price API ID rather than the Product ID.",
      stripeErrPriceNotRecurring: "The configured Stripe price is One-time: change it to a Recurring monthly/yearly price in Stripe Product catalog.",
      stripeErrPriceNotFound: "Stripe price ID not found: make sure your server billing key and monthly/yearly Price IDs are all from the same mode (Test or Live).",
      stripeErrPortalNotConfigured: "Stripe Customer Portal is not configured yet: open Stripe Dashboard -> Billing -> Customer portal and click Save.",
      stripeError: "Could not start Stripe billing. Please try again shortly or use an access code.",
      orCodeTitle: "Have an access code?",
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
  var modalState = {
    open: false, reason: "manage", featureLabel: "", msg: "", err: "",
    busy: false, busyKind: "", busyPlan: "", codeDraft: "", billingInfo: null, externalUrl: ""
  };

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
      } else if (act === "checkout") {
        startCheckout(btn.getAttribute("data-plan") || "monthly");
      } else if (act === "portal") {
        startPortal();
      } else if (act === "refresh") {
        refreshPlanFromModal();
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
    modalState.busyKind = "redeem";
    modalState.busyPlan = "";
    renderModal();
    try {
      var res = await e.redeemCode(raw);
      modalState.busy = false;
      modalState.busyKind = "";
      modalState.codeDraft = "";
      var until = fmtDate((res && (res.active_until || res.expires_at)) || (e.status && e.status().activeUntil));
      modalState.msg = until ? fill(T().redeemSuccess, { date: until }) : T().leadFull;
      renderModal();
      if (window.POG && window.POG.appApi && window.POG.appApi.render) {
        window.POG.appApi.render();
      }
    } catch (err) {
      modalState.busy = false;
      modalState.busyKind = "";
      modalState.err = mapError(err);
      renderModal();
    }
  }

  function isEmbeddedFrame() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  function mapStripeError(err) {
    var t = T();
    var code = err && err.code ? String(err.code) : "";
    if (code === "stripe_not_configured") return t.stripeNotReady;
    if (code === "no_stripe_customer") return t.noCustomerPortal;
    if (code === "invalid_stripe_key") return t.stripeErrInvalidKey;
    if (code === "invalid_price_id") return t.stripeErrInvalidPrice;
    if (code === "price_not_recurring") return t.stripeErrPriceNotRecurring;
    if (code === "price_not_found" || code === "customer_not_found") return t.stripeErrPriceNotFound;
    if (code === "portal_not_configured") return t.stripeErrPortalNotConfigured;
    var msg = err && err.message ? String(err.message) : "";
    if (msg && msg !== "Edge Function returned a non-2xx status code" && !/^(checkout|portal)/i.test(msg)) {
      return t.stripeError + " (" + msg.slice(0, 120) + ")";
    }
    return t.stripeError;
  }

  async function startCheckout(plan) {
    var e = entApi();
    if (!e || !e.createCheckoutSession || modalState.busy) return;
    var p = plan === "yearly" ? "yearly" : "monthly";
    modalState.err = "";
    modalState.msg = "";
    modalState.externalUrl = "";
    modalState.busy = true;
    modalState.busyKind = "checkout";
    modalState.busyPlan = p;
    renderModal();
    try {
      var res = await e.createCheckoutSession(p);
      if (!res || typeof res.url !== "string" || res.url.indexOf("https://checkout.stripe.com/") !== 0) {
        var uErr = new Error("invalid_redirect_url");
        uErr.code = "invalid_redirect_url";
        throw uErr;
      }
      modalState.busy = false;
      modalState.busyKind = "";
      modalState.busyPlan = "";
      if (isEmbeddedFrame()) {
        modalState.externalUrl = res.url;
        modalState.msg = T().stripePopupNote;
        renderModal();
        return;
      }
      modalState.msg = T().openingStripe;
      renderModal();
      if (window.location && typeof window.location.assign === "function") {
        window.location.assign(res.url);
      }
    } catch (err) {
      modalState.busy = false;
      modalState.busyKind = "";
      modalState.busyPlan = "";
      modalState.err = mapStripeError(err);
      renderModal();
    }
  }

  async function startPortal() {
    var e = entApi();
    if (!e || !e.createPortalSession || modalState.busy) return;
    modalState.err = "";
    modalState.msg = "";
    modalState.externalUrl = "";
    modalState.busy = true;
    modalState.busyKind = "portal";
    modalState.busyPlan = "";
    renderModal();
    try {
      var res = await e.createPortalSession();
      if (!res || typeof res.url !== "string" || res.url.indexOf("https://billing.stripe.com/") !== 0) {
        var uErr = new Error("invalid_redirect_url");
        uErr.code = "invalid_redirect_url";
        throw uErr;
      }
      modalState.busy = false;
      modalState.busyKind = "";
      if (isEmbeddedFrame()) {
        modalState.externalUrl = res.url;
        modalState.msg = T().stripePopupNote;
        renderModal();
        return;
      }
      modalState.msg = T().openingPortal;
      renderModal();
      if (window.location && typeof window.location.assign === "function") {
        window.location.assign(res.url);
      }
    } catch (err) {
      modalState.busy = false;
      modalState.busyKind = "";
      modalState.err = mapStripeError(err);
      renderModal();
    }
  }

  async function refreshPlanFromModal() {
    var e = entApi();
    if (!e || !e.refresh || modalState.busy) return;
    modalState.busy = true;
    modalState.busyKind = "refresh";
    modalState.err = "";
    renderModal();
    try {
      await e.refresh();
      modalState.busy = false;
      modalState.busyKind = "";
      modalState.msg = hasFullAccess() ? T().refreshDoneFull : T().refreshDoneFree;
      renderModal();
    } catch (err) {
      modalState.busy = false;
      modalState.busyKind = "";
      renderModal();
    }
  }

  function renderModal() {
    if (!panel) return;
    var t = T();
    var e = entApi();
    var st = e && e.status ? e.status() : { uid: "", tier: "free", activeUntil: null, hasStripeCustomer: false };
    var full = hasFullAccess();
    var signedIn = !!st.uid;
    var pending = modalState.codeDraft || (e && e.pendingCode ? e.pendingCode() : "");
    var bi = modalState.billingInfo;
    var hasPortal = !!(st.hasStripeCustomer || (bi && bi.has_portal) || st.source === "stripe");

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
      var dis = modalState.busy ? ' disabled' : '';
      var stripeHtml = "";
      if (hasPortal) {
        stripeHtml += '<div class="pw-box pw-stripe-box">' +
          '<h3>' + esc(t.portalTitle) + '</h3>' +
          '<p class="account-note">' + esc(t.portalDesc) + '</p>' +
          '<button type="button" class="primary account-action" data-pw="portal"' + dis + '>' +
          esc(modalState.busy && modalState.busyKind === "portal" ? t.openingPortal : t.portalBtn) + '</button>' +
          '</div>';
      }
      if (!full) {
        var mBusy = modalState.busy && modalState.busyKind === "checkout" && modalState.busyPlan === "monthly";
        var yBusy = modalState.busy && modalState.busyKind === "checkout" && modalState.busyPlan === "yearly";
        stripeHtml += '<div class="pw-box pw-stripe-box">' +
          '<h3>' + esc(t.subSectionTitle) + '</h3>' +
          '<div class="pw-plans">' +
            '<div class="pw-plan">' +
              '<strong>' + esc(t.planMonthlyTitle) + '</strong>' +
              '<span>' + esc(t.planMonthlyDesc) + '</span>' +
              '<button type="button" class="primary pw-plan-btn" data-pw="checkout" data-plan="monthly"' + dis + '>' +
              esc(mBusy ? t.openingStripe : t.planMonthlyBtn) + '</button>' +
            '</div>' +
            '<div class="pw-plan">' +
              '<strong>' + esc(t.planYearlyTitle) + '</strong>' +
              '<span>' + esc(t.planYearlyDesc) + '</span>' +
              '<button type="button" class="primary pw-plan-btn" data-pw="checkout" data-plan="yearly"' + dis + '>' +
              esc(yBusy ? t.openingStripe : t.planYearlyBtn) + '</button>' +
            '</div>' +
          '</div>' +
          (bi && bi.ok && !bi.stripe_enabled ? '<p class="account-note">' + esc(t.stripeNotReady) + '</p>' : '') +
          '</div>';
      }
      bodyHtml = stripeHtml +
        '<form class="pw-code-form" data-pw-form="redeem">' +
          '<label>' + esc(t.codeLabel) +
          '<input name="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="32" placeholder="' + esc(t.codePlaceholder) + '" value="' + esc(pending) + '" required>' +
          '</label>' +
          '<button type="submit" class="secondary account-action"' + dis + '>' +
          esc(modalState.busy && modalState.busyKind === "redeem" ? t.redeeming : t.redeemBtn) + '</button>' +
        '</form>' +
        '<button type="button" class="link pw-refresh-btn" data-pw="refresh"' + dis + '>' + esc(t.refreshPlanBtn) + '</button>';
    }

    var extSafe = (modalState.externalUrl &&
      (modalState.externalUrl.indexOf("https://checkout.stripe.com/") === 0 || modalState.externalUrl.indexOf("https://billing.stripe.com/") === 0))
      ? modalState.externalUrl : "";
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
      (extSafe ? '<a class="primary account-action pw-ext-link" href="' + esc(extSafe) + '" target="_blank" rel="noopener noreferrer">' + esc(t.stripeContinueBtn) + '</a>' : '') +
      (modalState.err ? '<p class="account-error" role="alert">' + esc(modalState.err) + '</p>' : '') +
      '</div>';

    panel.innerHTML = html;
  }

  function applyPendingCheckoutNotice() {
    var e = entApi();
    if (!e || !e.checkoutStatus || isPatientLocked()) return "";
    var ret = e.checkoutStatus();
    if (!ret) return "";
    e.clearCheckoutStatus();
    var t = T();
    if (ret === "success") return hasFullAccess() ? t.checkoutSuccessFull : t.checkoutSuccessWait;
    if (ret === "cancel") return t.checkoutCanceled;
    if (ret === "portal") return t.portalReturned;
    return "";
  }

  function openModal(opts) {
    ensurePanel();
    opts = opts || {};
    modalState.open = true;
    modalState.reason = opts.reason || "manage";
    modalState.featureLabel = opts.featureLabel || "";
    modalState.msg = opts.msg || applyPendingCheckoutNotice() || "";
    modalState.err = "";
    modalState.externalUrl = "";
    modalState.busy = false;
    modalState.busyKind = "";
    modalState.busyPlan = "";
    renderModal();
    panel.hidden = false;
    var focusEl = panel.querySelector("input,button[data-pw='checkout'],button[data-pw='portal'],button[data-pw='signin'],button.account-close");
    if (focusEl) focusEl.focus();
    var e = entApi();
    if (e && e.checkBillingAvailability && e.status && e.status().uid && !isPatientLocked()) {
      e.checkBillingAvailability().then(function (info) {
        modalState.billingInfo = info;
        if (panel && !panel.hidden) renderModal();
      }).catch(function () {});
    }
  }

  function closeModal() {
    modalState.open = false;
    if (panel) panel.hidden = true;
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && panel && !panel.hidden) closeModal();
  });

  function maybeShowCheckoutReturnModal() {
    var e = entApi();
    if (!e || !e.checkoutStatus || isPatientLocked()) return;
    var ret = e.checkoutStatus();
    if (!ret) return;
    var st = e.status ? e.status() : {};
    if (ret === "cancel" || st.uid) {
      openModal({ reason: "manage" });
    }
  }

  function refreshAppUi() {
    maybeShowCheckoutReturnModal();
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
    maybeShowCheckoutReturnModal();
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
