"use strict";

const express = require("express");
const path = require("path");

const app = express();
app.disable("x-powered-by");

const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

const staticOpts = { dotfiles: "ignore", fallthrough: false };
for (const dir of ["css", "js", "content", "assets"]) {
  app.use(`/${dir}`, express.static(path.join(__dirname, dir), staticOpts));
}

app.get(["/", "/index.html"], (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/sw.js", (_req, res) => {
  res.sendFile(path.join(__dirname, "sw.js"));
});

app.get("/manifest.webmanifest", (_req, res) => {
  res.type("application/manifest+json");
  res.sendFile(path.join(__dirname, "manifest.webmanifest"));
});

app.use((err, _req, res, next) => {
  if (err && (err.status === 404 || err.statusCode === 404 || err.code === "ENOENT")) {
    return res.status(404).send("Not found");
  }
  return next(err);
});

app.use((_req, res) => {
  res.status(404).send("Not found");
});

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
