/*
 * Records the microphone for the therapist and measures speaking from the audio level.
 * Recording only starts after consent (see the app's consent screen); audio stays on the device.
 *
 * Measures (milliseconds unless noted), from a simple voice-activity estimate:
 *   onsetMs        time from the start of listening to the first speech
 *   speechMs       total time with voice
 *   totalMs        length of the recording
 *   pauses         number of silences of at least 700 ms between stretches of speech
 *   shortPauses    number of short hesitations (250–699 ms) between stretches of speech
 *   longPauses     number of long word-finding silences (>= 1500 ms) between stretches of speech
 *   longestPauseMs longest silence >= 700 ms
 *   phonationRatio fraction of total recording time with active voice (0..1)
 *   syllRate       estimated acoustic syllable-nucleus rate (syllables/s during speech)
 * These are rough indicators for trends, not clinical measurements.
 */
window.POG = window.POG || {};
window.POG.measureVoice = function (frames, totalMs, opts) {
  "use strict";
  opts = opts || {};
  var minPause = opts.minPause || 700, bridge = opts.bridge || 250, minSeg = opts.minSeg || 100;
  var longPause = opts.longPause || 1500;
  if (!frames || frames.length < 6) return null;
  var levels = frames.map(function (f) { return f.rms; }).sort(function (a, b) { return a - b; });
  var floor = levels[Math.floor(levels.length * 0.2)];
  var thr = Math.max(0.01, floor * 3);
  var segs = [], cur = null, step = frames.length > 1 ? frames[1].t - frames[0].t : 50;
  frames.forEach(function (f) {
    if (f.rms > thr) {
      if (cur && f.t - cur.end <= bridge) cur.end = f.t + step;
      else { cur = { start: f.t, end: f.t + step }; segs.push(cur); }
    }
  });
  segs = segs.filter(function (s) { return s.end - s.start >= minSeg; });
  if (!segs.length) {
    return {
      onsetMs: null, speechMs: 0, totalMs: Math.round(totalMs),
      pauses: 0, shortPauses: 0, longPauses: 0, longestPauseMs: 0,
      phonationRatio: 0, syllRate: null
    };
  }
  var speech = 0, pauses = 0, shortPauses = 0, longPauses = 0, longest = 0;
  segs.forEach(function (s, i) {
    speech += s.end - s.start;
    if (i) {
      var gap = s.start - segs[i - 1].end;
      if (gap >= bridge && gap < minPause) shortPauses++;
      if (gap >= minPause) {
        pauses++;
        longest = Math.max(longest, gap);
        if (gap >= longPause) longPauses++;
      }
    }
  });
  var sm = frames.map(function (_f, idx) {
    var a = idx > 0 ? frames[idx - 1].rms : frames[idx].rms;
    var b = frames[idx].rms;
    var c = idx + 1 < frames.length ? frames[idx + 1].rms : frames[idx].rms;
    return (a + b + c) / 3;
  });
  var peaks = 0, lastPeakT = -1e9, minSince = sm[0];
  for (var i = 1; i < sm.length - 1; i++) {
    minSince = Math.min(minSince, sm[i]);
    if (frames[i].rms > thr && sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && (frames[i].t - lastPeakT >= 140)) {
      if (lastPeakT < 0 || sm[i] >= minSince * 1.25 || minSince <= thr) {
        peaks++;
        lastPeakT = frames[i].t;
        minSince = sm[i];
      }
    }
  }
  var syllRate = speech >= 300 && peaks > 0 ? Math.round((peaks / (speech / 1000)) * 10) / 10 : null;
  if (syllRate != null && (syllRate < 0.5 || syllRate > 10)) syllRate = null;
  var phonationRatio = totalMs > 0 ? Math.min(1, Math.round((speech / totalMs) * 1000) / 1000) : 0;
  return {
    onsetMs: Math.round(segs[0].start),
    speechMs: Math.round(speech),
    totalMs: Math.round(totalMs),
    pauses: pauses,
    shortPauses: shortPauses,
    longPauses: longPauses,
    longestPauseMs: Math.round(longest),
    phonationRatio: phonationRatio,
    syllRate: syllRate
  };
};

window.POG.createRecorder = function () {
  "use strict";
  var r = { supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) };
  var stream = null, mr = null, chunks = [], ctx = null, timer = null, t0 = 0, frames = [], on = false;

  function cleanup() {
    clearInterval(timer); timer = null;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null;
    if (ctx) { try { ctx.close(); } catch (e) {} }
    ctx = null; mr = null; on = false;
  }
  function pickType() {
    var types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg;codecs=opus"];
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
    for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported(types[i])) return types[i];
    return "";
  }

  r.active = function () { return on; };
  /* Resolves once recording; rejects if the microphone is refused or unavailable. */
  r.start = function () {
    if (!r.supported) return Promise.reject(new Error("unsupported"));
    if (on) return Promise.resolve();
    on = true;
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (s) {
      if (!on) { s.getTracks().forEach(function (t) { t.stop(); }); throw new Error("cancelled"); }
      stream = s; chunks = []; frames = []; t0 = performance.now();
      var type = pickType();
      mr = type ? new MediaRecorder(s, { mimeType: type }) : new MediaRecorder(s);
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.start(1000);
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        var an = ctx.createAnalyser(); an.fftSize = 1024;
        ctx.createMediaStreamSource(s).connect(an);
        var buf = new Float32Array(an.fftSize);
        timer = setInterval(function () {
          an.getFloatTimeDomainData(buf);
          var sum = 0;
          for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          frames.push({ t: performance.now() - t0, rms: Math.sqrt(sum / buf.length) });
        }, 50);
      }
    }, function (err) { on = false; throw err; });
  };
  /* Resolves with { blob, mime, durationMs, measures } (blob may be null). */
  r.stop = function () {
    return new Promise(function (resolve) {
      if (!on) { resolve(null); return; }
      var dur = performance.now() - t0, fr = frames.slice();
      var done = function () {
        var type = (mr && mr.mimeType) || (chunks[0] && chunks[0].type) || "audio/webm";
        var blob = chunks.length ? new Blob(chunks, { type: type }) : null;
        cleanup();
        resolve({ blob: blob, mime: type, durationMs: Math.round(dur), measures: window.POG.measureVoice(fr, dur) });
      };
      if (mr && mr.state !== "inactive") { mr.onstop = done; try { mr.stop(); } catch (e) { done(); } }
      else done();
    });
  };
  r.cancel = function () { try { if (mr && mr.state !== "inactive") mr.stop(); } catch (e) {} cleanup(); };
  return r;
};
