#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../supabase/functions");
const functions = ["profile-access", "profile-lifecycle-worker"];

function check(condition, label) {
  if (!condition) {
    console.error("not ok " + label);
    process.exitCode = 1;
  } else {
    console.log("ok   " + label);
  }
}

for (const name of functions) {
  const dir = path.join(root, name);
  const config = JSON.parse(fs.readFileSync(path.join(dir, "deno.json"), "utf8"));
  const lock = JSON.parse(fs.readFileSync(path.join(dir, "deno.lock"), "utf8"));
  const source = fs.readFileSync(path.join(dir, "index.ts"), "utf8");
  const exactSpecifier = "npm:@supabase/supabase-js@2.119.0";
  const packageKey = "@supabase/supabase-js@2.119.0";

  check(config.imports["@supabase/supabase-js"] === exactSpecifier, `${name} uses an exact Supabase SDK version`);
  check(config.lock.path === "./deno.lock" && config.lock.frozen === true, `${name} requires its frozen dependency lock`);
  check(source.includes('from "@supabase/supabase-js"') && !source.includes("npm:@supabase/supabase-js@2\""), `${name} imports through its pinned Deno configuration`);
  check(lock.specifiers[exactSpecifier] === "2.119.0", `${name} lockfile resolves the exact SDK version`);
  check(/^sha512-/.test((lock.npm[packageKey] || {}).integrity || ""), `${name} lockfile verifies the SDK package integrity`);
  check(Object.values(lock.npm).length > 0 && Object.values(lock.npm).every((pkg) => /^sha512-/.test(pkg.integrity || "")), `${name} lockfile verifies every transitive npm package`);
}
