#!/usr/bin/env node
/*
 * Draws the app icons (an original design: a speech bubble with "Aa" on the app's teal) and saves
 * the PNG sizes the web app manifest and phones need. Run again after changing the design:
 *   node tools/make-icons.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const out = path.join(__dirname, "..", "assets", "icons");
/* inset: how much of the canvas the bubble may use. Maskable icons keep content inside the central 80%. */
function svg(size, inset, rounded) {
  const r = rounded ? size * 0.22 : 0, c = size / 2, w = size * inset, h = w * 0.78, x = c - w / 2, y = c - h / 2 - size * 0.03;
  const tail = `M ${x + w * 0.22} ${y + h - 2} L ${x + w * 0.16} ${y + h + w * 0.2} L ${x + w * 0.46} ${y + h - 2} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#1D6A73"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h * 0.32}" fill="#FFFFFF"/>
  <path d="${tail}" fill="#FFFFFF"/>
  <text x="${c}" y="${y + h * 0.7}" text-anchor="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-weight="700" font-size="${h * 0.62}" fill="#1D6A73">Aa</text>
  <circle cx="${x + w * 0.83}" cy="${y + h * 0.2}" r="${h * 0.07}" fill="#E2B962"/>
</svg>`;
}
const ICONS = [
  ["icon-192.png", 192, 0.66, true], ["icon-512.png", 512, 0.66, true],
  ["icon-maskable-512.png", 512, 0.56, false], ["apple-touch-icon.png", 180, 0.66, false], ["favicon-32.png", 32, 0.8, true]
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const font = fs.readFileSync(path.join(__dirname, "..", "assets", "fonts", "atkinson-bold-latin.woff2")).toString("base64");
  const browser = await chromium.launch();
  for (const [name, size, inset, rounded] of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>@font-face{font-family:"Atkinson Hyperlegible";font-weight:700;src:url(data:font/woff2;base64,${font})}html,body{margin:0;background:transparent}</style>` + svg(size, inset, rounded));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, name), omitBackground: true });
    await page.close();
  }
  fs.writeFileSync(path.join(out, "icon.svg"), svg(512, 0.66, true));
  await browser.close();
  console.log("Icons written to assets/icons");
})();
