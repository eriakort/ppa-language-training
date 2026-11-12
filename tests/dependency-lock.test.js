#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const workflow = fs.readFileSync(path.join(root, ".github/workflows/test.yml"), "utf8");
const lockedManifest = lock.packages && lock.packages[""];
const dependencyEntries = Object.entries(lock.packages || {}).filter(([name]) => name !== "");

function check(condition, label) {
  if (!condition) {
    console.error("not ok " + label);
    process.exitCode = 1;
  } else {
    console.log("ok   " + label);
  }
}

check(lock.lockfileVersion === 3, "npm dependency lockfile uses supported v3 format");
check(JSON.stringify(lockedManifest && lockedManifest.devDependencies) === JSON.stringify(manifest.devDependencies), "locked root dependencies match package.json");
check(dependencyEntries.length > 0 && dependencyEntries.every(([, pkg]) => pkg.resolved && pkg.integrity), "every locked package has a registry URL and integrity hash");
check(/run:\s*npm ci\b/.test(workflow), "CI installs only dependencies recorded in the lockfile");
