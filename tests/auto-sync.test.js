"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const auto=fs.readFileSync(path.join(root,"js/auto-sync.js"),"utf8");
const app=fs.readFileSync(path.join(root,"js/app.js"),"utf8");
const cloud=fs.readFileSync(path.join(root,"js/cloud-sync.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611110004_automatic_sync.sql"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(auto.includes("pog_cloud_consent_")&&auto.includes("function consent()"),"automatic sync requires explicit per-profile consent");
check(auto.includes("pog_cloud_sync_pending_")&&auto.includes("addEventListener(\"online\""),"offline changes remain queued and retry when online");
check(auto.includes('.eq("revision",expected)')&&auto.includes("revision:expected+1"),"writes use revision compare-and-swap");
check(auto.includes('state==="conflict"')&&auto.includes('data-sync="cloud"')&&auto.includes('data-sync="local"'),"conflicts require an explicit cloud-or-local choice");
check(auto.includes("Audio recordings")===false&&auto.includes('KEYS=["profile","settings","placement","history","sessions","scripts_it","scripts_en","active_session"]'),"automatic sync uses the allowlist and excludes recordings");
check(app.includes('pog:local-change')&&app.includes('pog:profile-change'),"app notifies sync about learner changes and profile switches");
check(cloud.includes('pog_cloud_sync_revision_')&&cloud.includes('revision'),"manual backup and restore establish the initial sync revision");
check(html.indexOf("js/cloud-sync.js")<html.indexOf("js/auto-sync.js"),"automatic sync loads after cloud backup");
check(migration.includes("add column if not exists revision bigint"),"database supports revision tracking");
