#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const workflow = fs.readFileSync(path.resolve(__dirname, "../.github/workflows/jekyll-gh-pages.yml"), "utf8");
const build = (workflow.match(/^  build:\r?\n([\s\S]*?)(?=^  deploy:)/m) || [])[1] || "";
const deployStart = workflow.indexOf("  deploy:");
const deploy = deployStart < 0 ? "" : workflow.slice(deployStart);

function check(condition, label) {
  if (!condition) {
    console.error("not ok " + label);
    process.exitCode = 1;
  } else {
    console.log("ok   " + label);
  }
}

const workflowPermissions = (workflow.match(/^permissions:\r?\n((?:^  .*\r?\n)+)/m) || [])[1] || "";
check(/contents: read/.test(workflowPermissions), "workflow keeps repository contents read-only");
check(!/pages:\s*write|id-token:\s*write/.test(workflowPermissions), "workflow-wide token has no deployment permissions");
check(/permissions:\r?\n\s+contents: read/.test(build), "build job has only contents read access");
check(!/pages:\s*write|id-token:\s*write/.test(build), "build job cannot deploy Pages or request OIDC tokens");
check(/permissions:\r?\n\s+contents: read\r?\n\s+pages: write\r?\n\s+id-token: write/.test(deploy), "only deploy job receives the permissions required for Pages deployment");
