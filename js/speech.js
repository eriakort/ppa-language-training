/*
 * Speech input for solo mode: turns the person's voice into text.
 *
 * Providers, in order of preference:
 *   "host"    - the Claude artifact host's dictation (Anthropic speech-to-text; the page gets text, never audio)
 *   "browser" - the Web Speech API (Chrome, Safari incl. iPhone/iPad, Samsung Internet). In Chrome the audio
 *               goes to Google's speech service; in Safari to Apple's.
 *   "none"    - no speech input; the app falls back to self-rating.
 *
 * Callbacks (all optional):
 *   onText(finalText, interimText)  whole transcript so far, plus the live guess
 *   onState(state, reason)          state: "starting" | "listening" | "idle"; reason only with "idle":
 *                                   "stopped" (normal end), "denied", "unavailable", "dismissed", "capture"
 *                                   (microphone busy or failing), "busy", "hidden", "retry" (tap again)
 *   onReady()                       a provider became available after load
 */
window.POG = window.POG || {};
window.POG.createSpeech = function (cb) {
  "use strict";
  cb = cb || {};
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  /* Inside the Claude artifact the browser's own microphone is blocked, so only the host's dictation can work there. */
  var inHost = !!(window.claude && typeof window.claude.use === "function");
  var api = { provider: !inHost && SR ? "browser" : "none" };
  var host = null, hostLangFail = false, rec = null, active = false;
  var finals = [], lastAlts = [], startedAt = 0, firstSpeech = 0;

  function say(fn) { if (typeof cb[fn] === "function") cb[fn].apply(null, [].slice.call(arguments, 1)); }
  function joined() { return finals.join(" ").replace(/\s+/g, " ").trim(); }
  function idle(reason) { if (!active) return; active = false; say("onState", "idle", reason); }
  function simple(s) { return String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }

  /* Some Android builds repeat the whole phrase in each new result; replace instead of appending then. */
  function addFinal(text) {
    text = String(text || "").trim();
    if (!text) return;
    if (!firstSpeech) firstSpeech = Date.now();
    var prev = finals[finals.length - 1];
    if (prev && simple(text).indexOf(simple(prev)) === 0) finals[finals.length - 1] = text;
    else if (!(prev && simple(prev).indexOf(simple(text)) === 0)) finals.push(text);
  }

  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("dictation").then(function (d) {
      if (!d) return;
      host = d; api.provider = "host";
      d.onPartial(function (e) { if (active) say("onText", joined(), e.text); });
      d.onFinal(function (e) { if (!active) return; addFinal(e.text); lastAlts = []; say("onText", joined(), ""); });
      d.onState(function (e) {
        if (!active) return;
        if (e.state === "listening") { say("onState", "listening"); return; }
        if (e.state !== "idle") return;
        var r = e.reason;
        idle(r === "stopped" || r === "viewer_stopped" || r === "time_limit" ? "stopped"
          : r === "not_granted" ? "denied" : r === "dismissed" ? "dismissed" : r === "hidden" ? "hidden"
          : r === "unavailable" ? (hostLangFail ? "unavailable" : (hostLangFail = true, "retry")) : "busy");
      });
      say("onReady");
    }, function () {});
  }

  /* Must be called directly from a click or key press. */
  api.start = function (lang) {
    if (active) return;
    active = true; finals = []; lastAlts = []; startedAt = Date.now(); firstSpeech = 0;
    say("onState", "starting");
    if (api.provider === "host") {
      var p;
      try { p = hostLangFail ? host.start() : host.start({ language: lang }); } catch (e) { p = Promise.reject({ code: "upstream_error" }); }
      p.catch(function (err) {
        var c = err && err.code;
        if (c === "unavailable" && !hostLangFail) { hostLangFail = true; idle("retry"); return; }
        idle(c === "not_granted" ? "denied" : c === "dismissed" ? "dismissed" : c === "stopped" ? "hidden" : c === "unavailable" ? "unavailable" : "busy");
      });
      return;
    }
    if (api.provider !== "browser") { idle("unavailable"); return; }
    var errCode = null;
    try {
      rec = new SR();
      rec.lang = lang === "it" ? "it-IT" : "en-GB";
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 3;
      rec.onstart = function () { if (active) say("onState", "listening"); };
      rec.onspeechstart = function () { if (!firstSpeech) firstSpeech = Date.now(); };
      rec.onresult = function (e) {
        var interim = "";
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var r = e.results[i];
          if (r.isFinal) {
            addFinal(r[0].transcript);
            lastAlts = [];
            for (var k = 1; k < r.length; k++) lastAlts.push(r[k].transcript);
          } else interim += r[0].transcript;
        }
        if (active) say("onText", joined(), interim.trim());
      };
      rec.onerror = function (e) { errCode = e.error; };
      rec.onend = function () {
        rec = null;
        idle(!errCode || errCode === "aborted" || errCode === "no-speech" ? "stopped"
          : errCode === "not-allowed" || errCode === "service-not-allowed" ? "denied"
          : errCode === "audio-capture" ? "capture"
          : errCode === "language-not-supported" ? "unavailable" : "busy");
      };
      rec.start();
    } catch (e) { rec = null; idle("busy"); }
  };

  /* Ends listening; the last words still arrive before "idle". */
  api.stop = function () {
    if (!active) return;
    if (api.provider === "host") { try { host.stop().catch(function () {}); } catch (e) {} }
    else if (rec) { try { rec.stop(); } catch (e) { idle("stopped"); } }
  };
  /* Ends listening without an evaluation. */
  api.cancel = function () {
    if (!active) return;
    active = false;
    if (api.provider === "host") { try { host.stop().catch(function () {}); } catch (e) {} }
    else if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
  };
  api.active = function () { return active; };
  /* The transcript, plus versions with the last phrase swapped for each alternative the recognizer offered. */
  api.candidates = function () {
    var base = joined(), out = [base];
    if (finals.length && lastAlts.length) {
      var head = finals.slice(0, -1).join(" ");
      lastAlts.forEach(function (a) { out.push((head + " " + a).trim()); });
    }
    return out;
  };
  api.timing = function () { return { startedAt: startedAt, firstSpeech: firstSpeech }; };
  return api;
};
