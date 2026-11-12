(function () {
  "use strict";
  var cfg = window.POG_SUPABASE_CONFIG || {};
  var copy = {
    it: {
      account: "Account", unavailable: "Accesso online non ancora configurato",
      setup: "Gli esercizi e i profili locali continuano a funzionare su questo dispositivo. L'accesso online sarà disponibile quando verrà configurato il progetto Supabase.",
      signIn: "Accedi", signUp: "Crea account", reset: "Recupera password", update: "Imposta nuova password",
      email: "Email", password: "Password", name: "Nome", confirm: "Conferma password",
      sendReset: "Invia il link di recupero", create: "Crea account", login: "Accedi",
      back: "Indietro", close: "Chiudi", signOut: "Esci", signedIn: "Accesso effettuato",
      signedAs: "Account collegato", checkEmail: "Controlla la posta: ti abbiamo inviato un link per confermare l'indirizzo email.",
      resetSent: "Se l'indirizzo è registrato, riceverai un link per reimpostare la password.",
      passwordUpdated: "Password aggiornata. Ora puoi continuare.",
      invited: "Invito ricevuto: dopo aver confermato l'email, l'accesso al profilo condiviso sarà disponibile.",
      error: "Non è stato possibile completare l'operazione. Riprova.",
      passwordShort: "La password deve contenere almeno 8 caratteri.",
      passwordMismatch: "Le password non coincidono.",
      terms: "Il solo accesso all'account non carica i dati della persona. Il backup e la sincronizzazione cloud, comprese le misure aggregate visibili ai terapisti autorizzati, richiedono il consenso esplicito nel pannello Backup cloud. Registrazioni audio, foto dell'album e voci familiari restano sul dispositivo.",
      modeHint: "Puoi creare un account o accedere a uno esistente."
    },
    en: {
      account: "Account", unavailable: "Online sign-in is not configured yet",
      setup: "Exercises and local profiles will continue to work on this device. Online sign-in will be available once the Supabase project is configured.",
      signIn: "Sign in", signUp: "Create account", reset: "Reset password", update: "Set a new password",
      email: "Email", password: "Password", name: "Name", confirm: "Confirm password",
      sendReset: "Send reset link", create: "Create account", login: "Sign in",
      back: "Back", close: "Close", signOut: "Sign out", signedIn: "You're signed in",
      signedAs: "Connected account", checkEmail: "Check your inbox: we sent you a link to confirm your email address.",
      resetSent: "If that address is registered, you'll receive a password reset link.",
      passwordUpdated: "Password updated. You can continue.",
      invited: "Invitation received: after confirming your email, access to the shared profile will be available.",
      error: "We couldn't complete that action. Please try again.",
      passwordShort: "Password must be at least 8 characters.",
      passwordMismatch: "The passwords do not match.",
      terms: "Signing in alone does not upload learner data. Cloud backup and synchronisation, including aggregate measures visible to authorised therapists, require explicit consent in Cloud backup. Audio recordings, album photos and family voices stay on this device.",
      modeHint: "Create an account or sign in to an existing one."
    }
  };
  var lang = window.POG.getLang();
  var T = copy[lang], client = null, mode = "signin", message = "", error = "", user = null;
  var launcher, panel, observer;

  function configured() {
    return !!(cfg.url && cfg.anonKey && window.supabase && window.supabase.createClient);
  }
  if (configured()) {
    try {
      client = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    } catch (e) { client = null; }
  }
  function el(tag, attrs, value) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (value != null) node.textContent = value;
    return node;
  }
  function show() {
    if (!panel) {
      panel = el("section", { class: "account-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "account-title", hidden: "" });
      document.body.appendChild(panel);
    }
    render();
    panel.hidden = false;
    var first = panel.querySelector("input,button");
    if (first) first.focus();
  }
  function hide() { if (panel) panel.hidden = true; }
  function render() {
    if (!panel) return;
    var html = '<div class="account-card"><div class="account-head"><h2 id="account-title">' + T.account + '</h2><button type="button" class="account-close" data-action="close" aria-label="' + T.close + '">×</button></div>';
    if (!client) {
      html += '<h3>' + T.unavailable + '</h3><p>' + T.setup + '</p><p class="account-note">' + T.terms + '</p>';
    } else if (user) {
      html += '<h3>' + T.signedIn + '</h3><p>' + T.signedAs + ': <strong>' + escapeHtml(user.email || "") + '</strong></p>';
      if (user.user_metadata && user.user_metadata.invited_profile_id) html += '<p>' + T.invited + '</p>';
      html += '<button class="primary account-action" data-action="signout">' + T.signOut + '</button>';
    } else {
      html += '<p class="account-note">' + T.modeHint + '</p>';
      if (mode === "signin") {
        html += '<form data-form="signin"><label>' + T.email + '<input name="email" type="email" autocomplete="email" required></label><label>' + T.password + '<input name="password" type="password" autocomplete="current-password" required></label><button class="primary account-action" type="submit">' + T.login + '</button></form><div class="account-links"><button data-action="signup">' + T.signUp + '</button><button data-action="reset">' + T.reset + '</button></div>';
      } else if (mode === "signup") {
        html += '<form data-form="signup"><label>' + T.name + '<input name="name" autocomplete="name" maxlength="80" required></label><label>' + T.email + '<input name="email" type="email" autocomplete="email" required></label><label>' + T.password + '<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><label>' + T.confirm + '<input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label><button class="primary account-action" type="submit">' + T.create + '</button></form><p class="account-note">' + T.terms + '</p><button class="link" data-action="signin">' + T.back + '</button>';
      } else if (mode === "reset") {
        html += '<form data-form="reset"><label>' + T.email + '<input name="email" type="email" autocomplete="email" required></label><button class="primary account-action" type="submit">' + T.sendReset + '</button></form><button class="link" data-action="signin">' + T.back + '</button>';
      } else if (mode === "update") {
        html += '<form data-form="update"><label>' + T.password + '<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><label>' + T.confirm + '<input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label><button class="primary account-action" type="submit">' + T.update + '</button></form>';
      }
    }
    if (message) html += '<p class="account-message" role="status">' + escapeHtml(message) + '</p>';
    if (error) html += '<p class="account-error" role="alert">' + escapeHtml(error) + '</p>';
    html += '</div>';
    panel.innerHTML = html;
  }
  function publishAuthState(session, event) {
    try {
      if (session) {
        localStorage.setItem("pog_account_had_session", "1");
        localStorage.removeItem("pog_account_signed_out");
      } else if (event === "SIGNED_OUT" || localStorage.getItem("pog_account_had_session") === "1") {
        /* Signed out here, or a session this device had has ended (expired, or signed out in another tab). */
        localStorage.setItem("pog_account_signed_out", "1");
        localStorage.removeItem("pog_account_had_session");
      }
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("pog:authchange", { detail: {
      signedIn: !!session,
      signedOut: localStorage.getItem("pog_account_signed_out") === "1"
    } }));
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]; }); }
  function formValues(form) { return Object.fromEntries(new FormData(form).entries()); }
  function fail(e) { error = e && e.message ? e.message : T.error; message = ""; render(); }
  async function submit(form) {
    var v = formValues(form), result;
    error = ""; message = "";
    try {
      if (form.dataset.form === "signin") {
        result = await client.auth.signInWithPassword({ email: v.email.trim(), password: v.password });
        if (result.error) throw result.error;
        user = result.data.user; publishAuthState(result.data.session, "SIGNED_IN"); message = T.signedIn;
      } else if (form.dataset.form === "signup") {
        if (v.password.length < 8) throw new Error(T.passwordShort);
        if (v.password !== v.confirm) throw new Error(T.passwordMismatch);
        result = await client.auth.signUp({
          email: v.email.trim(), password: v.password,
          options: { data: { display_name: v.name.trim() }, emailRedirectTo: window.location.href.split("#")[0] }
        });
        if (result.error) throw result.error;
        message = T.checkEmail;
        mode = "signin";
      } else if (form.dataset.form === "reset") {
        result = await client.auth.resetPasswordForEmail(v.email.trim(), { redirectTo: window.location.href.split("#")[0] });
        if (result.error) throw result.error;
        message = T.resetSent;
        mode = "signin";
      } else if (form.dataset.form === "update") {
        if (v.password.length < 8) throw new Error(T.passwordShort);
        if (v.password !== v.confirm) throw new Error(T.passwordMismatch);
        result = await client.auth.updateUser({ password: v.password });
        if (result.error) throw result.error;
        message = T.passwordUpdated;
        mode = "signin";
      }
      render();
    } catch (e) { fail(e); }
  }
  function bindPanel() {
    panel.addEventListener("click", function (event) {
      var action = event.target.closest("[data-action]");
      if (!action) return;
      var a = action.dataset.action;
      error = ""; message = "";
      if (a === "close") hide();
      else if (a === "signin") mode = "signin";
      else if (a === "signup") mode = "signup";
      else if (a === "reset") mode = "reset";
      else if (a === "signout") {
        client.auth.signOut().then(function (r) {
          if (r.error) fail(r.error);
          else {
            /* Leave the signed-in view completely: close the dialog and reload so every panel starts signed out. */
            user = null; publishAuthState(null, "SIGNED_OUT"); hide();
            window.location.reload();
          }
        }).catch(fail);
        return;
      }
      render();
    });
    panel.addEventListener("submit", function (event) {
      var form = event.target.closest("form[data-form]");
      if (!form) return;
      event.preventDefault();
      submit(form);
    });
  }
  function mount() {
    var root = document.getElementById("app");
    if (!root || root.querySelector(".account-launcher")) return;
    launcher = el("button", { type: "button", class: "account-launcher", "aria-haspopup": "dialog" }, T.account);
    launcher.addEventListener("click", show);
    root.appendChild(launcher);
  }
  if (panel) bindPanel();
  document.addEventListener("keydown", function (event) { if (event.key === "Escape") hide(); });
  if (client) {
    client.auth.getSession().then(function (r) {
      user = r.data && r.data.session ? r.data.session.user : null;
      publishAuthState(r.data && r.data.session ? r.data.session : null, "INITIAL_SESSION");
      if (window.location.hash.indexOf("type=recovery") >= 0) { mode = "update"; show(); }
      else if (window.location.hash.indexOf("access_token=") >= 0) { message = user && user.user_metadata && user.user_metadata.invited_profile_id ? T.invited : T.checkEmail; show(); }
    });
    client.auth.onAuthStateChange(function (event, session) {
      user = session ? session.user : null;
      publishAuthState(session, event);
      if (event === "PASSWORD_RECOVERY") { mode = "update"; show(); }
      else if (event === "SIGNED_IN" && user && user.user_metadata && user.user_metadata.invited_profile_id) { message = T.invited; }
      if (panel && !panel.hidden) render();
    });
  }
  var originalShow = show;
  show = function () {
    if (!panel) { panel = el("section", { class: "account-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "account-title", hidden: "" }); document.body.appendChild(panel); bindPanel(); }
    render(); panel.hidden = false;
    var first = panel.querySelector("input,button"); if (first) first.focus();
  };
  if (window.MutationObserver) {
    observer = new MutationObserver(mount);
    observer.observe(document.getElementById("app"), { childList: true });
  }
  mount();
  /* Signed out in another tab: reload this one too. */
  window.addEventListener("storage", function (ev) {
    if (ev.key === "pog_account_signed_out" && ev.newValue === "1") window.location.reload();
  });
  window.addEventListener("pog:languagechange", function (ev) {
    lang = ev.detail && ev.detail.lang === "en" ? "en" : "it";
    T = copy[lang];
    if (launcher) launcher.textContent = T.account;
    if (panel && !panel.hidden) render();
  });
  })();
