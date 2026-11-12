#!/usr/bin/env node
/*
 * Builds one self-contained HTML file from index.html by inlining the local
 * stylesheet and scripts. The output is what gets published as the Claude
 * artifact (the artifact host adds its own <!doctype>, <head> and <body>).
 *
 *   node tools/build.js            -> dist/parole-ogni-giorno.html
 *   node tools/build.js --full     -> also dist/index.html, a standalone page
 */
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const html = read("index.html");

const inline = (s) => s
  .replace(/<link rel="stylesheet" href="((?!https?:)[^"]+)">/g, (_, href) => "<style>\n" + read(href) + "</style>")
  .replace(/<script\b([^>]*)\s+src="((?!https?:)[^"]+)"([^>]*)><\/script>/g, (_, before, src, after) => {
    const attributes = (before + after).replace(/\s+(?:integrity|crossorigin)="[^"]*"/g, "");
    return "<script" + attributes + ">\n" + read(src).replace(/<\/script/gi, "<\\/script") + "</script>";
  });

const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>\n?/, "")
  .replace(/<meta name="viewport"[^>]*>\n?/, "");
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];

const artifact = inline(head.trim() + "\n\n" + body.trim()) + "\n";
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "parole-ogni-giorno.html"), artifact);
console.log("Wrote dist/parole-ogni-giorno.html (" + Math.round(artifact.length / 1024) + " KB)");

if (process.argv.includes("--full")) {
  fs.writeFileSync(path.join(root, "dist", "index.html"), inline(html));
  console.log("Wrote dist/index.html");
}
