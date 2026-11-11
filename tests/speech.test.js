#!/usr/bin/env node
/*
 * Unit checks for the speaking measures (js/recorder.js) and the speech engine (js/speech.js),
 * using synthetic audio levels and a fake browser recogniser. No browser needed.
 *
 *   node tests/speech.test.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
let failures = 0;
const check = (ok, msg) => { console.log((ok ? "ok   " : "FAIL ") + msg); if (!ok) failures++; };

/* ---- measureVoice ---- */
const ctx = { window: {}, navigator: {}, performance: { now: () => 0 } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js/recorder.js"), "utf8"), ctx);
const measure = ctx.window.POG.measureVoice;

// 50 ms frames: 1 s silence, 1 s speech, 1 s pause, 0.5 s speech, 0.2 s gap, 0.5 s speech, 0.5 s silence
function frames(pattern) {
  const out = []; let t = 0;
  pattern.forEach(([ms, loud]) => { for (let i = 0; i < ms / 50; i++) { out.push({ t, rms: loud ? 0.2 : 0.005 }); t += 50; } });
  return out;
}
const f = frames([[1000, 0], [1000, 1], [1000, 0], [500, 1], [200, 0], [500, 1], [500, 0]]);
const m = measure(f, 4700);
check(m.onsetMs === 1000, "onset is when speech starts (got " + m.onsetMs + ")");
check(m.pauses === 1, "a 1 s silence counts as a pause and a 0.2 s gap does not (got " + m.pauses + ")");
check(Math.abs(m.longestPauseMs - 1000) <= 50, "longest pause is about 1 s (got " + m.longestPauseMs + ")");
check(Math.abs(m.speechMs - 2200) <= 100, "speaking time about 2.2 s, short gap bridged (got " + m.speechMs + ")");
const silent = measure(frames([[2000, 0]]), 2000);
check(silent.onsetMs === null && silent.speechMs === 0, "silence gives no onset and no speech");
check(measure([], 0) === null, "too little audio gives no measures");

/* ---- speech engine with a fake recogniser ---- */
function engine() {
  const events = [];
  let last = null;
  function FakeSR() { last = this; }
  FakeSR.prototype.start = function () { setImmediate(() => this.onstart && this.onstart()); };
  FakeSR.prototype.stop = function () { setImmediate(() => this.onend && this.onend()); };
  FakeSR.prototype.abort = FakeSR.prototype.stop;
  const c = { window: { webkitSpeechRecognition: FakeSR }, setImmediate };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(root, "js/speech.js"), "utf8"), c);
  const sp = c.window.POG.createSpeech({
    onText: (fin, interim) => events.push(["text", fin, interim]),
    onState: (s, r) => events.push(["state", s, r])
  });
  const final = (...alts) => { const r = alts.map((a) => ({ transcript: a })); r.isFinal = true; return r; };
  return { sp, events, rec: () => last, final };
}
(async () => {
  const tick = () => new Promise((r) => setImmediate(r));

  const a = engine();
  check(a.sp.provider === "browser", "uses the browser recogniser when there is no Claude host");
  a.sp.start("it");
  await tick();
  check(a.rec().lang === "it-IT", "Italian is requested as it-IT");
  a.rec().onresult({ resultIndex: 0, results: [a.final("una chiave")] });
  // Android-style repeat: the next result repeats the earlier words
  a.rec().onresult({ resultIndex: 0, results: [a.final("una chiave grande", "una chiave grandi")] });
  const lastText = a.events.filter((e) => e[0] === "text").pop();
  check(lastText[1] === "una chiave grande", "repeated phrases are merged, not doubled (got \"" + lastText[1] + "\")");
  check(a.sp.candidates().includes("una chiave grandi"), "alternative transcripts are offered for checking");
  a.sp.stop();
  await tick(); await tick();
  check(a.events.some((e) => e[0] === "state" && e[1] === "idle" && e[2] === "stopped"), "a normal stop ends with reason \"stopped\"");

  const b = engine();
  b.sp.start("en");
  await tick();
  b.rec().onerror({ error: "not-allowed" }); b.rec().onend();
  check(b.events.some((e) => e[1] === "idle" && e[2] === "denied"), "a refused microphone ends with reason \"denied\"");

  const c = engine();
  c.sp.start("en");
  await tick();
  c.rec().onerror({ error: "audio-capture" }); c.rec().onend();
  check(c.events.some((e) => e[1] === "idle" && e[2] === "capture"), "a busy microphone ends with reason \"capture\"");

  if (failures) { console.error(failures + " check(s) failed."); process.exit(1); }
  console.log("All speech checks passed.");
})();
