#!/usr/bin/env node
/*
 * Offline support: the service worker's file list matches the page, and after one visit online the
 * app (including the communication board) opens with the network switched off.
 * Serves the repository on http://localhost (a secure context, so service workers run).
 * Needs Playwright with Chromium.
 *
 *   node tests/offline.test.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");

const root = path.resolve(__dirname, "..");
let failures = 0;
const check = (ok, msg) => { console.log((ok ? "ok   " : "FAIL ") + msg); if (!ok) failures++; };

/* 1. Every local file the page loads must be in the offline copy. */
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const shell = JSON.parse("[" + sw.match(/var SHELL = \[([\s\S]*?)\];/)[1] + "]");
const used = (index.match(/(?:src|href)="([^"]+)"/g) || []).map((m) => m.replace(/^(?:src|href)="|"$/g, "")).filter((u) => !/^https?:/.test(u));
const css = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
const fonts = (css.match(/url\("\.\.\/([^"]+)"\)/g) || []).map((m) => m.replace(/^url\("\.\.\/|"\)$/g, ""));
used.concat(fonts).forEach((u) => check(shell.includes(u), "offline copy includes " + u));
shell.filter((u) => u !== "./").forEach((u) => check(fs.existsSync(path.join(root, u)), "listed offline file exists: " + u));

/* 2. Works offline after one online visit. */
const TYPES = { ".js": "application/javascript", ".css": "text/css", ".html": "text/html", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  const { chromium } = require("playwright");
  await new Promise((r) => server.listen(0, "localhost", r));
  const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  check(await page.evaluate(() => !!navigator.serviceWorker.controller), "the offline copy is active after the first visit");
  await page.fill("#pf-name", "Offline"); await page.click('[data-act="onboard-skip"]'); await page.click('[data-act="home"]');
  await page.waitForTimeout(500);

  await ctx.setOffline(true);
  server.close();
  await page.reload();
  check((await page.textContent(".home h1")) === "Ciao, Offline", "with no network, the app opens from the offline copy");
  await page.click('[data-act="board"]');
  await page.click(".aac-tile");
  check(((await page.textContent(".aac-msg")) || "").length > 1, "with no network, the communication board works");
  check(errors.length === 0, "no page errors offline: " + errors.join("; "));
  await browser.close();
  if (failures) { console.error(failures + " check(s) failed."); process.exit(1); }
  console.log("All offline checks passed.");
})().catch((e) => { console.error(e); process.exit(1); });
