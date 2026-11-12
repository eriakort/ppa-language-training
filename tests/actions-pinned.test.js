#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const workflowsDir = path.resolve(__dirname, "../.github/workflows");
const workflowFiles = fs.readdirSync(workflowsDir).filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"));
const actionUses = [];

for (const file of workflowFiles) {
  const source = fs.readFileSync(path.join(workflowsDir, file), "utf8");
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const match = line.match(/^\s*uses:\s*([^\s]+)\s*#\s*(v\S+)\s*$/);
    if (match && match[1].includes("@")) actionUses.push({ file, line: index + 1, ref: match[1].split("@").pop(), version: match[2] });
    else if (/^\s*uses:\s*[^\s]+@/.test(line)) actionUses.push({ file, line: index + 1, ref: "unpinned or missing version comment" });
  }
}

if (actionUses.length === 0) {
  console.error("not ok workflow actions are pinned to full commit SHAs");
  process.exitCode = 1;
} else {
  for (const action of actionUses) {
    const valid = /^[0-9a-f]{40}$/.test(action.ref) && /^v\d/.test(action.version || "");
    console.log((valid ? "ok   " : "not ok ") + `${action.file}:${action.line} action reference ${action.ref}`);
    if (!valid) process.exitCode = 1;
  }
}
