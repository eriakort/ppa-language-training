"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const cloud=fs.readFileSync(path.join(root,"js/cloud-sync.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611110001_hybrid_identity.sql"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(cloud.includes("cloud-consent")&&cloud.includes("consentKey"),"cloud backup requires a per-profile consent choice");
check(cloud.includes("client.auth.getSession")&&cloud.includes("profile-access"),"cloud backup requires an authenticated account and trusted profile provisioning");
check(cloud.includes("KEYS = [")&&cloud.includes('"active_session"'),"cloud backup uses an explicit allowlist including the active checkpoint");
check(cloud.includes("Audio recordings are never uploaded")&&cloud.includes("indexedDB")===false,"cloud backup excludes local audio recordings");
check(cloud.includes("window.confirm(T.confirmBackup)")&&cloud.includes("window.confirm(T.warning"),"backup and destructive restore require confirmation");
check(cloud.includes("profile_data").toLowerCase()&&migration.includes("create table if not exists public.profile_data"),"cloud backup uses the profile-scoped data table");
check(html.indexOf("js/account.js")<html.indexOf("js/cloud-sync.js"),"cloud controls load after account interface");
