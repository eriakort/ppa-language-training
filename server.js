"use strict";

const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

app.use(
  express.static(__dirname, {
    dotfiles: "ignore",
    setHeaders(res, filePath) {
      if (filePath.endsWith(".webmanifest")) {
        res.setHeader("Content-Type", "application/manifest+json");
      }
    }
  })
);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
