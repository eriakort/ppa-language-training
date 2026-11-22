/*
 * Phase 3 Admin Access-Code Generator & Usage Tracking UI.
 *
 * Lets designated admins (verified server-side by the `access-codes` Edge
 * Function via `access_admins` / `ACCESS_ADMIN_EMAILS`) create single-user or
 * group access codes, generate shareable `?code=` invite links, inspect per-code
 * redemption logs, and revoke codes with or without revoking active grants.
 *
 * Security notes:
 * - Client admin check only toggles UI affordances; server enforces admin auth.
 * - Zero hardcoded secrets or service-role keys.
 * - All dynamic values (codes, emails, notes, errors) are HTML-escaped.
 * - Zero native browser dialogs (`alert`, `confirm`, `prompt`).
 * - Clears in-memory code/email list immediately when signed out.
 */
(function () {
  "use strict";

  var copy = {
    it: {
      title: "Gestione codici di accesso",
      subtitle: "Crea codici singoli o di gruppo e controlla utilizzi e scadenze.",
      close: "Chiudi",
      refresh: "Aggiorna elenco",
      refreshing: "Aggiornamento…",
      adminRequired: "Accesso riservato agli amministratori. Accedi con un account amministratore abilitato.",
      statTotal: "Codici creati",
      statActive: "Codici attivi",
      statUses: "Utilizzi totali",
      createTitle: "Nuovo codice di accesso",
      audienceLabel: "Destinatario del codice",
      typeSingle: "Utente singolo (1 utilizzo)",
      typeGroup: "Gruppo di utenti (più utilizzi)",
      maxUsesLabel: "Numero massimo di utenti",
      uncappedLabel: "Gruppo senza limite di posti",
      durationLabel: "Durata accesso completo (giorni)",
      presetsLabel: "Durata rapida",
      customCodeLabel: "Codice personalizzato (opzionale)",
      customCodeHint: "6–32 caratteri: lettere A–Z, numeri 0–9 e trattini (es. CLINICA-2026).",
      batchLabel: "Quantità codici da generare",
      redeemByLabel: "Riscattabile entro il (opzionale)",
      fixedExpLabel: "Fine fissa accesso per tutti (opzionale)",
      noteLabel: "Nota destinatario / clinica (opzionale)",
      notePlaceholder: "Es. Coorte Dott.ssa Rossi – Ottobre",
      createBtn: "Genera codice",
      creating: "Generazione in corso…",
      issuedTitle: "Nuovi codici generati",
      copyCode: "Copia codice",
      copyLink: "Copia link invito",
      copiedCode: "Codice copiato negli appunti.",
      copiedLink: "Link di invito copiato negli appunti.",
      copyFallback: "Copia manuale: {value}",
      listTitle: "Codici e monitoraggio utilizzi",
      searchPlaceholder: "Cerca per codice o nota…",
      filterAll: "Tutti",
      filterActive: "Attivi",
      filterSingle: "Singoli",
      filterGroup: "Gruppo",
      filterInactive: "Disattivati / Scaduti",
      emptyList: "Nessun codice trovato con questi filtri.",
      badgeActive: "Attivo",
      badgeRevoked: "Disattivato",
      badgeExpired: "Scaduto",
      badgeFull: "Esaurito",
      badgeSingle: "Singolo",
      badgeGroup: "Gruppo",
      seatsLine: "{used} / {max} utilizzi",
      seatsUnlimited: "{used} / ∞ utilizzi",
      seatsLeft: "({left} disponibili)",
      durationLine: "Durata: {days} giorni",
      createdLine: "Creato: {date}",
      redeemByLine: "Riscattabile entro: {date}",
      fixedExpLine: "Scadenza fissa coorte: {date}",
      redemptionsBtn: "Utilizzi ({count})",
      noRedemptions: "Nessun utilizzo registrato finora.",
      userCol: "Utente",
      redeemedAtCol: "Riscattato il",
      expiresAtCol: "Scade il",
      revokeBtn: "Disattiva",
      revokeTitle: "Come vuoi disattivare il codice {code}?",
      revokeSoft: "Blocca solo nuovi utilizzi",
      revokeHard: "Disattiva codice e revoca accessi attivi",
      cancel: "Annulla",
      revoking: "Disattivazione…",
      revokedOkSoft: "Codice disattivato: non accetterà nuovi utilizzi.",
      revokedOkHard: "Codice disattivato e accessi collegati revocati ({count}).",
      errInvalidDuration: "Inserisci una durata valida compresa tra 1 e 3650 giorni.",
      errInvalidMaxUses: "Per un codice di gruppo inserisci tra 2 e 10000 utilizzi (oppure scegli senza limite).",
      errInvalidCustom: "Il codice personalizzato deve avere 6–32 caratteri (solo A–Z, 0–9 e '-').",
      errInvalidCount: "Puoi generare da 1 a 50 codici per volta.",
      errInvalidDate: "Le date opzionali devono essere nel futuro.",
      errForbidden: "Permessi amministratore non presenti su questo account.",
      errDuplicate: "Questo codice esiste già. Scegli un altro codice personalizzato.",
      errGeneric: "Operazione non riuscita. Riprova tra poco."
    },
    en: {
      title: "Access code manager",
      subtitle: "Create single-user or group access codes and track redemptions.",
      close: "Close",
      refresh: "Refresh list",
      refreshing: "Refreshing…",
      adminRequired: "Admin privileges required. Sign in with an authorized admin account.",
      statTotal: "Total codes",
      statActive: "Active codes",
      statUses: "Total redemptions",
      createTitle: "Create access code",
      audienceLabel: "Who can redeem this code",
      typeSingle: "Single user (1 seat)",
      typeGroup: "Group of users (multi-seat)",
      maxUsesLabel: "Maximum number of users",
      uncappedLabel: "Unlimited group seats",
      durationLabel: "Full access duration (days)",
      presetsLabel: "Quick presets",
      customCodeLabel: "Custom code (optional)",
      customCodeHint: "6–32 characters: A–Z, 0–9 and hyphens (e.g. CLINIC-2026).",
      batchLabel: "Number of codes to generate",
      redeemByLabel: "Must redeem by (optional)",
      fixedExpLabel: "Fixed access end date for everyone (optional)",
      noteLabel: "Recipient / clinic note (optional)",
      notePlaceholder: "e.g. Dr. Rossi clinic cohort",
      createBtn: "Generate code",
      creating: "Generating…",
      issuedTitle: "Newly created codes",
      copyCode: "Copy code",
      copyLink: "Copy invite link",
      copiedCode: "Code copied to clipboard.",
      copiedLink: "Invite link copied to clipboard.",
      copyFallback: "Copy manually: {value}",
      listTitle: "Codes & usage tracking",
      searchPlaceholder: "Search by code or note…",
      filterAll: "All",
      filterActive: "Active",
      filterSingle: "Single",
      filterGroup: "Group",
      filterInactive: "Revoked / Expired",
      emptyList: "No access codes match this filter.",
      badgeActive: "Active",
      badgeRevoked: "Revoked",
      badgeExpired: "Expired",
      badgeFull: "Full",
      badgeSingle: "Single",
      badgeGroup: "Group",
      seatsLine: "{used} / {max} used",
      seatsUnlimited: "{used} / ∞ used",
      seatsLeft: "({left} left)",
      durationLine: "Duration: {days} days",
      createdLine: "Created: {date}",
      redeemByLine: "Redeem by: {date}",
      fixedExpLine: "Fixed end date: {date}",
      redemptionsBtn: "Redemptions ({count})",
      noRedemptions: "No redemptions yet.",
      userCol: "User",
      redeemedAtCol: "Redeemed",
      expiresAtCol: "Access until",
      revokeBtn: "Revoke",
      revokeTitle: "How should {code} be revoked?",
      revokeSoft: "Stop new redemptions only",
      revokeHard: "Revoke code & active grants",
      cancel: "Cancel",
      revoking: "Revoking…",
      revokedOkSoft: "Code deactivated: new redemptions are blocked.",
      revokedOkHard: "Code deactivated and linked active grants revoked ({count}).",
      errInvalidDuration: "Enter a duration between 1 and 3650 days.",
      errInvalidMaxUses: "Group codes require 2 to 10000 seats (or choose Unlimited seats).",
      errInvalidCustom: "Custom code must be 6–32 characters using A–Z, 0–9 and '-'.",
      errInvalidCount: "Batch count must be between 1 and 50.",
      errInvalidDate: "Optional deadline/expiry dates must be in the future.",
      errForbidden: "Admin permissions are not enabled on this account.",
      errDuplicate: "That access code already exists. Choose a different custom code.",
      errGeneric: "Could not complete request. Please try again."
    }
  };

  var lang = (window.POG && window.POG.getLang && window.POG.getLang() === "en") ? "en" : "it";
  var T = copy[lang];
  var panel = null;
  var codes = [];
  var issued = [];
  var loadingList = false;
  var creating = false;
  var revokingId = "";
  var confirmRevokeId = "";
  var expandedIds = {};
  var filterMode = "all";
  var searchQuery = "";
  var statusMsg = "";
  var errorMsg = "";

  var formState = {
    code_type: "single",
    duration_days: "30",
    max_uses: "25",
    uncapped: false,
    custom_code: "",
    count: "1",
    redeem_by: "",
    fixed_expires_at: "",
    recipient_note: ""
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function ent() {
    return (window.POG && window.POG.entitlements) ? window.POG.entitlements : null;
  }

  function isAdmin() {
    var e = ent();
    return !!(e && e.isAdmin && e.isAdmin());
  }

  function formatDate(iso, withTime) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try {
      var loc = lang === "it" ? "it-IT" : "en-GB";
      return withTime
        ? d.toLocaleString(loc, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return iso.slice(0, 10);
    }
  }

  function inviteUrl(code) {
    var clean = String(code || "").trim().toUpperCase();
    try {
      var origin = (window.location && window.location.origin && window.location.origin !== "null")
        ? window.location.origin
        : "";
      var pathname = (window.location && window.location.pathname) ? window.location.pathname : "/";
      return origin + pathname + "?code=" + encodeURIComponent(clean);
    } catch (e) {
      return "?code=" + encodeURIComponent(clean);
    }
  }

  function classifyCode(c, nowMs) {
    if (!c) return "revoked";
    var now = nowMs == null ? Date.now() : nowMs;
    if (c.revoked_at) return "revoked";
    if (c.redeem_by && isFinite(Date.parse(c.redeem_by)) && Date.parse(c.redeem_by) <= now) return "expired";
    if (c.fixed_expires_at && isFinite(Date.parse(c.fixed_expires_at)) && Date.parse(c.fixed_expires_at) <= now) return "expired";
    if (c.max_uses != null && Number(c.used_count || 0) >= Number(c.max_uses)) return "full";
    return "active";
  }

  function localizeError(err) {
    var raw = String((err && (err.message || err.error || err.code)) || "").toLowerCase();
    if (/admin/.test(raw) || /403/.test(raw) || /forbidden/.test(raw)) return T.errForbidden;
    if (/already exists/.test(raw) || /duplicate/.test(raw) || /409/.test(raw)) return T.errDuplicate;
    if (/custom_code/.test(raw)) return T.errInvalidCustom;
    if (/duration_days/.test(raw)) return T.errInvalidDuration;
    if (/max_uses/.test(raw)) return T.errInvalidMaxUses;
    if (/count/.test(raw)) return T.errInvalidCount;
    if (/future/.test(raw) || /redeem_by/.test(raw) || /fixed_expires_at/.test(raw)) return T.errInvalidDate;
    return T.errGeneric;
  }

  async function extractError(err) {
    if (err && err.context && typeof err.context.json === "function") {
      try {
        var body = await err.context.json();
        if (body && body.error) return new Error(body.error);
      } catch (e) {}
    }
    return err;
  }

  function dateInputToEndOfDayIso(dateStr) {
    var s = String(dateStr || "").trim();
    if (!s) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "INVALID";
    var dt = new Date(s + "T23:59:59.000Z");
    if (isNaN(dt.getTime()) || dt.getTime() <= Date.now()) return "INVALID";
    return dt.toISOString();
  }

  function filteredCodes() {
    var q = searchQuery.trim().toLowerCase();
    var now = Date.now();
    return codes.filter(function (c) {
      var st = classifyCode(c, now);
      if (filterMode === "active" && st !== "active") return false;
      if (filterMode === "single" && c.code_type !== "single") return false;
      if (filterMode === "group" && c.code_type !== "group") return false;
      if (filterMode === "inactive" && st === "active") return false;
      if (q) {
        var haystack = (String(c.code || "") + " " + String(c.recipient_note || "")).toLowerCase();
        if (haystack.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function computeStats() {
    var now = Date.now();
    var total = codes.length;
    var active = 0;
    var uses = 0;
    for (var i = 0; i < codes.length; i++) {
      if (classifyCode(codes[i], now) === "active") active++;
      uses += Number(codes[i].used_count || 0);
    }
    return { total: total, active: active, uses: uses };
  }

  async function copyText(val, feedbackKind) {
    var ok = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(val);
        ok = true;
      }
    } catch (e) { ok = false; }
    if (!ok) {
      try {
        var ta = document.createElement("textarea");
        ta.value = val;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = !!(document.execCommand && document.execCommand("copy"));
        document.body.removeChild(ta);
      } catch (e2) { ok = false; }
    }
    if (ok) {
      statusMsg = feedbackKind === "link" ? T.copiedLink : T.copiedCode;
      errorMsg = "";
    } else {
      statusMsg = T.copyFallback.replace("{value}", val);
      errorMsg = "";
    }
    render();
  }

  async function refreshList() {
    if (!isAdmin() || !ent() || !ent().adminList) {
      codes = [];
      render();
      return [];
    }
    loadingList = true;
    errorMsg = "";
    render();
    try {
      var list = await ent().adminList();
      codes = Array.isArray(list) ? list : [];
      loadingList = false;
      render();
      return codes;
    } catch (e) {
      loadingList = false;
      var unwrapped = await extractError(e);
      errorMsg = localizeError(unwrapped);
      render();
      return [];
    }
  }

  function validateForm() {
    var dur = Number(formState.duration_days);
    if (!Number.isInteger(dur) || dur < 1 || dur > 3650) {
      return { error: T.errInvalidDuration };
    }
    var custom = String(formState.custom_code || "").trim().toUpperCase();
    if (custom && !/^[A-Z0-9-]{6,32}$/.test(custom)) {
      return { error: T.errInvalidCustom };
    }
    var count = custom ? 1 : Number(formState.count || 1);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return { error: T.errInvalidCount };
    }
    var payload = {
      code_type: formState.code_type === "group" ? "group" : "single",
      duration_days: dur,
      count: count
    };
    if (payload.code_type === "group") {
      if (formState.uncapped) {
        payload.uncapped = true;
      } else {
        var mx = Number(formState.max_uses);
        if (!Number.isInteger(mx) || mx < 2 || mx > 10000) {
          return { error: T.errInvalidMaxUses };
        }
        payload.max_uses = mx;
        payload.uncapped = false;
      }
    }
    if (custom) payload.custom_code = custom;
    if (formState.redeem_by) {
      var rbIso = dateInputToEndOfDayIso(formState.redeem_by);
      if (rbIso === "INVALID") return { error: T.errInvalidDate };
      payload.redeem_by = rbIso;
    }
    if (formState.fixed_expires_at) {
      var fxIso = dateInputToEndOfDayIso(formState.fixed_expires_at);
      if (fxIso === "INVALID") return { error: T.errInvalidDate };
      payload.fixed_expires_at = fxIso;
    }
    var note = String(formState.recipient_note || "").trim().slice(0, 200);
    if (note) payload.recipient_note = note;
    return { payload: payload };
  }

  async function handleCreate() {
    if (!isAdmin() || !ent() || !ent().adminCreate || creating) return;
    errorMsg = "";
    statusMsg = "";
    var check = validateForm();
    if (check.error) {
      errorMsg = check.error;
      render();
      return;
    }
    creating = true;
    render();
    try {
      var created = await ent().adminCreate(check.payload);
      issued = Array.isArray(created) ? created : [];
      formState.custom_code = "";
      formState.recipient_note = "";
      creating = false;
      await refreshList();
    } catch (e) {
      creating = false;
      var unwrapped = await extractError(e);
      errorMsg = localizeError(unwrapped);
      render();
    }
  }

  async function handleRevoke(codeId, revokeActiveGrants) {
    if (!isAdmin() || !ent() || !ent().adminRevoke || revokingId) return;
    revokingId = codeId;
    errorMsg = "";
    statusMsg = "";
    render();
    try {
      var res = await ent().adminRevoke(codeId, !!revokeActiveGrants);
      revokingId = "";
      confirmRevokeId = "";
      statusMsg = revokeActiveGrants
        ? T.revokedOkHard.replace("{count}", String((res && res.revoked_active) || 0))
        : T.revokedOkSoft;
      await refreshList();
      if (revokeActiveGrants && ent() && ent().refresh) {
        ent().refresh();
      }
    } catch (e) {
      revokingId = "";
      var unwrapped = await extractError(e);
      errorMsg = localizeError(unwrapped);
      render();
    }
  }

  function renderCodeItem(c, now) {
    var st = classifyCode(c, now);
    var statusBadgeClass = st === "active" ? "ok" : (st === "revoked" ? "bad" : "warn");
    var statusText = st === "active" ? T.badgeActive : (st === "revoked" ? T.badgeRevoked : (st === "full" ? T.badgeFull : T.badgeExpired));
    var typeText = c.code_type === "group" ? T.badgeGroup : T.badgeSingle;
    var used = Number(c.used_count || 0);
    var seatsText = c.max_uses == null
      ? T.seatsUnlimited.replace("{used}", String(used))
      : T.seatsLine.replace("{used}", String(used)).replace("{max}", String(c.max_uses)) +
        " " + T.seatsLeft.replace("{left}", String(Math.max(0, Number(c.max_uses) - used)));
    var reds = Array.isArray(c.code_redemptions) ? c.code_redemptions.slice().sort(function (a, b) {
      return Date.parse(b.redeemed_at || 0) - Date.parse(a.redeemed_at || 0);
    }) : [];
    var isExpanded = !!expandedIds[c.id];
    var showRevokeConfirm = confirmRevokeId === c.id;

    var html = '<article class="adc-item" data-code-id="' + esc(c.id) + '">';
    html += '<div class="adc-item-top">' +
      '<div class="adc-code-wrap"><code class="adc-code">' + esc(c.code) + '</code>' +
      '<span class="adc-badge ' + statusBadgeClass + '">' + esc(statusText) + '</span>' +
      '<span class="adc-badge type">' + esc(typeText) + '</span></div>' +
      '<div class="adc-seats"><strong>' + esc(seatsText) + '</strong></div>' +
      '</div>';

    html += '<div class="adc-meta">' +
      '<span>' + esc(T.durationLine.replace("{days}", String(c.duration_days || 0))) + '</span>' +
      (c.created_at ? '<span>' + esc(T.createdLine.replace("{date}", formatDate(c.created_at, false))) + '</span>' : '') +
      (c.redeem_by ? '<span>' + esc(T.redeemByLine.replace("{date}", formatDate(c.redeem_by, false))) + '</span>' : '') +
      (c.fixed_expires_at ? '<span>' + esc(T.fixedExpLine.replace("{date}", formatDate(c.fixed_expires_at, false))) + '</span>' : '') +
      '</div>';

    if (c.recipient_note) {
      html += '<p class="adc-note">' + esc(c.recipient_note) + '</p>';
    }

    html += '<div class="adc-actions">' +
      '<button type="button" class="secondary adc-btn" data-adc="copy-code" data-code="' + esc(c.code) + '">' + esc(T.copyCode) + '</button>' +
      '<button type="button" class="secondary adc-btn" data-adc="copy-link" data-code="' + esc(c.code) + '">' + esc(T.copyLink) + '</button>' +
      '<button type="button" class="secondary adc-btn" data-adc="toggle-redemptions" data-id="' + esc(c.id) + '" aria-expanded="' + (isExpanded ? "true" : "false") + '">' +
      esc(T.redemptionsBtn.replace("{count}", String(reds.length))) + '</button>' +
      (st !== "revoked"
        ? '<button type="button" class="secondary adc-btn warn" data-adc="ask-revoke" data-id="' + esc(c.id) + '">' + esc(T.revokeBtn) + '</button>'
        : '') +
      '</div>';

    if (showRevokeConfirm) {
      var busyRev = revokingId === c.id;
      html += '<div class="adc-revoke-confirm" role="region" aria-label="' + esc(T.revokeTitle.replace("{code}", c.code)) + '">' +
        '<p><strong>' + esc(T.revokeTitle.replace("{code}", c.code)) + '</strong></p>' +
        '<div class="adc-actions">' +
        '<button type="button" class="secondary adc-btn" data-adc="revoke-soft" data-id="' + esc(c.id) + '"' + (busyRev ? " disabled" : "") + '>' + esc(busyRev ? T.revoking : T.revokeSoft) + '</button>' +
        '<button type="button" class="account-danger-btn adc-btn" data-adc="revoke-hard" data-id="' + esc(c.id) + '"' + (busyRev ? " disabled" : "") + '>' + esc(busyRev ? T.revoking : T.revokeHard) + '</button>' +
        '<button type="button" class="secondary adc-btn" data-adc="revoke-cancel">' + esc(T.cancel) + '</button>' +
        '</div></div>';
    }

    if (isExpanded) {
      html += '<div class="adc-redemptions">';
      if (!reds.length) {
        html += '<p class="account-note">' + esc(T.noRedemptions) + '</p>';
      } else {
        html += '<ul class="adc-red-list">';
        for (var r = 0; r < reds.length; r++) {
          var rd = reds[r];
          var who = rd.user_email ? String(rd.user_email) : ("user:" + String(rd.user_id || "").slice(0, 8));
          html += '<li><strong>' + esc(who) + '</strong>' +
            '<span>' + esc(T.redeemedAtCol) + ': ' + esc(formatDate(rd.redeemed_at, true)) + '</span>' +
            '<span>' + esc(T.expiresAtCol) + ': ' + esc(formatDate(rd.expires_at, false)) + '</span></li>';
        }
        html += '</ul>';
      }
      html += '</div>';
    }

    html += '</article>';
    return html;
  }

  function render() {
    if (!panel) return;
    var adminOk = isAdmin();
    var html = '<div class="adc-card">' +
      '<div class="account-head">' +
      '<div><h2 id="adc-title">' + esc(T.title) + '</h2><p class="account-note">' + esc(T.subtitle) + '</p></div>' +
      '<div class="adc-head-btns">' +
      (adminOk ? '<button type="button" class="secondary adc-btn" data-adc="refresh"' + (loadingList ? " disabled" : "") + '>' + esc(loadingList ? T.refreshing : T.refresh) + '</button>' : '') +
      '<button type="button" class="account-close" data-adc="close" aria-label="' + esc(T.close) + '">×</button>' +
      '</div></div>';

    if (!adminOk) {
      html += '<p class="account-error" role="alert">' + esc(T.adminRequired) + '</p></div>';
      panel.innerHTML = html;
      return;
    }

    if (statusMsg) html += '<p class="account-message" role="status">' + esc(statusMsg) + '</p>';
    if (errorMsg) html += '<p class="account-error" role="alert">' + esc(errorMsg) + '</p>';

    var stats = computeStats();
    html += '<div class="adc-stats">' +
      '<div class="adc-stat"><span>' + esc(T.statTotal) + '</span><strong>' + esc(String(stats.total)) + '</strong></div>' +
      '<div class="adc-stat"><span>' + esc(T.statActive) + '</span><strong>' + esc(String(stats.active)) + '</strong></div>' +
      '<div class="adc-stat"><span>' + esc(T.statUses) + '</span><strong>' + esc(String(stats.uses)) + '</strong></div>' +
      '</div>';

    var isGroup = formState.code_type === "group";
    var hasCustom = !!String(formState.custom_code || "").trim();

    html += '<form class="adc-form-box" data-adc-form="create">' +
      '<h3>' + esc(T.createTitle) + '</h3>' +
      '<div class="adc-type-row" role="group" aria-label="' + esc(T.audienceLabel) + '">' +
      '<button type="button" class="secondary adc-type-btn' + (!isGroup ? " active" : "") + '" data-adc="set-type" data-type="single" aria-pressed="' + (!isGroup ? "true" : "false") + '">' + esc(T.typeSingle) + '</button>' +
      '<button type="button" class="secondary adc-type-btn' + (isGroup ? " active" : "") + '" data-adc="set-type" data-type="group" aria-pressed="' + (isGroup ? "true" : "false") + '">' + esc(T.typeGroup) + '</button>' +
      '</div>';

    if (isGroup) {
      html += '<div class="adc-grid">' +
        '<label>' + esc(T.maxUsesLabel) +
        '<input type="number" name="max_uses" min="2" max="10000" value="' + esc(formState.max_uses) + '"' + (formState.uncapped ? " disabled" : " required") + '></label>' +
        '<label class="adc-check"><input type="checkbox" name="uncapped"' + (formState.uncapped ? " checked" : "") + '><span>' + esc(T.uncappedLabel) + '</span></label>' +
        '</div>';
    }

    html += '<div class="adc-grid">' +
      '<label>' + esc(T.durationLabel) +
      '<input type="number" name="duration_days" min="1" max="3650" value="' + esc(formState.duration_days) + '" required>' +
      '<div class="adc-presets" aria-label="' + esc(T.presetsLabel) + '">' +
      [7, 30, 90, 365].map(function (d) {
        return '<button type="button" class="secondary adc-preset" data-adc="preset-days" data-days="' + d + '">' + d + 'd</button>';
      }).join("") +
      '</div></label>' +
      '<label>' + esc(T.batchLabel) +
      '<input type="number" name="count" min="1" max="50" value="' + esc(hasCustom ? "1" : formState.count) + '"' + (hasCustom ? " disabled" : " required") + '></label>' +
      '</div>';

    html += '<div class="adc-grid">' +
      '<label>' + esc(T.customCodeLabel) +
      '<input type="text" name="custom_code" maxlength="32" value="' + esc(formState.custom_code) + '" placeholder="POG-CLINICA-2026" autocomplete="off">' +
      '<span class="adc-hint">' + esc(T.customCodeHint) + '</span></label>' +
      '<label>' + esc(T.noteLabel) +
      '<input type="text" name="recipient_note" maxlength="200" value="' + esc(formState.recipient_note) + '" placeholder="' + esc(T.notePlaceholder) + '"></label>' +
      '</div>';

    html += '<div class="adc-grid">' +
      '<label>' + esc(T.redeemByLabel) +
      '<input type="date" name="redeem_by" value="' + esc(formState.redeem_by) + '"></label>' +
      '<label>' + esc(T.fixedExpLabel) +
      '<input type="date" name="fixed_expires_at" value="' + esc(formState.fixed_expires_at) + '"></label>' +
      '</div>';

    html += '<button type="submit" class="primary account-action"' + (creating ? " disabled" : "") + '>' + esc(creating ? T.creating : T.createBtn) + '</button>';
    html += '</form>';

    if (issued.length) {
      html += '<div class="adc-issued"><h3>' + esc(T.issuedTitle) + '</h3>';
      for (var i = 0; i < issued.length; i++) {
        var ic = issued[i];
        html += '<div class="adc-issued-row"><div><code>' + esc(ic.code) + '</code>' +
          '<small>' + esc(inviteUrl(ic.code)) + '</small></div>' +
          '<div class="adc-actions">' +
          '<button type="button" class="secondary adc-btn" data-adc="copy-code" data-code="' + esc(ic.code) + '">' + esc(T.copyCode) + '</button>' +
          '<button type="button" class="secondary adc-btn" data-adc="copy-link" data-code="' + esc(ic.code) + '">' + esc(T.copyLink) + '</button>' +
          '</div></div>';
      }
      html += '</div>';
    }

    html += '<div class="adc-list-box"><h3>' + esc(T.listTitle) + '</h3>' +
      '<div class="adc-toolbar">' +
      '<div class="adc-tabs" role="tablist">' +
      [
        ["all", T.filterAll],
        ["active", T.filterActive],
        ["single", T.filterSingle],
        ["group", T.filterGroup],
        ["inactive", T.filterInactive]
      ].map(function (tab) {
        var on = filterMode === tab[0];
        return '<button type="button" role="tab" aria-selected="' + (on ? "true" : "false") + '" class="secondary adc-tab' + (on ? " active" : "") + '" data-adc="filter" data-filter="' + tab[0] + '">' + esc(tab[1]) + '</button>';
      }).join("") +
      '</div>' +
      '<input type="search" class="adc-search" data-adc-search="1" value="' + esc(searchQuery) + '" placeholder="' + esc(T.searchPlaceholder) + '">' +
      '</div>';

    var list = filteredCodes();
    var now = Date.now();
    if (!list.length) {
      html += '<p class="account-note">' + esc(T.emptyList) + '</p>';
    } else {
      html += '<div class="adc-list">';
      for (var j = 0; j < list.length; j++) {
        html += renderCodeItem(list[j], now);
      }
      html += '</div>';
    }
    html += '</div></div>';
    panel.innerHTML = html;
  }

  function syncInput(target) {
    if (!target || !target.name) return;
    if (target.name === "uncapped") {
      formState.uncapped = !!target.checked;
      render();
      return;
    }
    if (target.name === "custom_code") {
      var prevEmpty = !String(formState.custom_code || "").trim();
      formState.custom_code = String(target.value || "").toUpperCase();
      var nextEmpty = !String(formState.custom_code || "").trim();
      if (prevEmpty !== nextEmpty) {
        render();
        var ref = panel && panel.querySelector('input[name="custom_code"]');
        if (ref) {
          ref.focus();
          try { ref.setSelectionRange(ref.value.length, ref.value.length); } catch (e) {}
        }
      }
      return;
    }
    if (target.name in formState) {
      formState[target.name] = target.value;
    }
  }

  function bindPanel() {
    panel.addEventListener("click", function (ev) {
      if (ev.target === panel) { closeModal(); return; }
      var btn = ev.target.closest("[data-adc]");
      if (!btn) return;
      var act = btn.getAttribute("data-adc");
      if (act === "close") { closeModal(); return; }
      if (act === "refresh") { refreshList(); return; }
      if (act === "set-type") {
        formState.code_type = btn.getAttribute("data-type") === "group" ? "group" : "single";
        errorMsg = "";
        render();
        return;
      }
      if (act === "preset-days") {
        formState.duration_days = btn.getAttribute("data-days") || "30";
        render();
        return;
      }
      if (act === "copy-code") {
        copyText(btn.getAttribute("data-code") || "", "code");
        return;
      }
      if (act === "copy-link") {
        copyText(inviteUrl(btn.getAttribute("data-code") || ""), "link");
        return;
      }
      if (act === "filter") {
        filterMode = btn.getAttribute("data-filter") || "all";
        render();
        return;
      }
      if (act === "toggle-redemptions") {
        var cid = btn.getAttribute("data-id");
        if (cid) {
          expandedIds[cid] = !expandedIds[cid];
          render();
        }
        return;
      }
      if (act === "ask-revoke") {
        confirmRevokeId = btn.getAttribute("data-id") || "";
        errorMsg = "";
        statusMsg = "";
        render();
        return;
      }
      if (act === "revoke-cancel") {
        confirmRevokeId = "";
        render();
        return;
      }
      if (act === "revoke-soft") {
        handleRevoke(btn.getAttribute("data-id") || "", false);
        return;
      }
      if (act === "revoke-hard") {
        handleRevoke(btn.getAttribute("data-id") || "", true);
        return;
      }
    });

    panel.addEventListener("input", function (ev) {
      var target = ev.target;
      if (target && target.getAttribute("data-adc-search") === "1") {
        searchQuery = target.value || "";
        render();
        var sRef = panel && panel.querySelector('[data-adc-search="1"]');
        if (sRef) {
          sRef.focus();
          try { sRef.setSelectionRange(sRef.value.length, sRef.value.length); } catch (e) {}
        }
        return;
      }
      syncInput(target);
    });

    panel.addEventListener("change", function (ev) {
      syncInput(ev.target);
    });

    panel.addEventListener("submit", function (ev) {
      var form = ev.target.closest('form[data-adc-form="create"]');
      if (!form) return;
      ev.preventDefault();
      handleCreate();
    });
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("section");
    panel.className = "adc-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "adc-title");
    panel.hidden = true;
    document.body.appendChild(panel);
    bindPanel();
    return panel;
  }

  function openModal() {
    ensurePanel();
    statusMsg = "";
    errorMsg = "";
    confirmRevokeId = "";
    panel.hidden = false;
    render();
    var first = panel.querySelector("button,input");
    if (first) first.focus();
    if (isAdmin()) refreshList();
  }

  function closeModal() {
    if (panel) panel.hidden = true;
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && panel && !panel.hidden) closeModal();
  });

  window.addEventListener("pog:languagechange", function (ev) {
    lang = (ev && ev.detail && ev.detail.lang === "en") ? "en" : "it";
    T = copy[lang];
    if (panel && !panel.hidden) render();
  });

  window.addEventListener("pog:authchange", function (ev) {
    var d = ev && ev.detail;
    if (d && d.signedOut) {
      codes = [];
      issued = [];
      expandedIds = {};
      confirmRevokeId = "";
      statusMsg = "";
      errorMsg = "";
      closeModal();
      if (panel) panel.innerHTML = "";
    }
  });

  window.addEventListener("pog:entitlementchange", function () {
    if (!isAdmin()) {
      codes = [];
      issued = [];
      confirmRevokeId = "";
      if (panel && panel.hidden) panel.innerHTML = "";
    }
    if (panel && !panel.hidden) render();
  });

  window.addEventListener("pog:open-admin-codes", function () { openModal(); });

  window.POG = window.POG || {};
  window.POG.adminCodes = {
    openModal: openModal,
    closeModal: closeModal,
    isOpen: function () { return !!(panel && !panel.hidden); },
    inviteUrl: inviteUrl,
    refreshList: refreshList,
    classifyCode: classifyCode
  };
})();
