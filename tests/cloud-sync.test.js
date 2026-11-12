"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const cloud=fs.readFileSync(path.join(root,"js/cloud-sync.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611110001_hybrid_identity.sql"),"utf8");
const syncMigration=fs.readFileSync(path.join(root,"supabase/migrations/202611110004_automatic_sync.sql"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(cloud.includes("cloud-consent")&&cloud.includes("consentKey"),"cloud backup requires a per-profile consent choice");
check(cloud.includes("client.auth.getSession")&&cloud.includes("profile-access"),"cloud backup requires an authenticated account and trusted profile provisioning");
check(cloud.includes("KEYS = [")&&cloud.includes('"active_session"'),"cloud backup uses an explicit allowlist including the active checkpoint");
check(cloud.includes("Audio recordings are never uploaded")&&cloud.includes("indexedDB")===false,"cloud backup excludes local audio recordings");
check(cloud.includes("window.confirm(T.confirmBackup)")&&cloud.includes("window.confirm(T.warning"),"backup and destructive restore require confirmation");
check(cloud.includes('from("learner_profiles").select("id,display_name")')&&cloud.includes('data-cloud="link"'),"a second device can select and link an existing cloud profile");
check(cloud.includes("profile_data")&&migration.includes("create table if not exists public.profile_data"),"cloud backup uses the profile-scoped data table");
check(html.indexOf("js/account.js")<html.indexOf("js/cloud-sync.js"),"cloud controls load after account interface");

check(cloud.includes("pog:local-change") && cloud.includes("queueSync"),"local changes are queued for automatic sync");
check(cloud.includes("window.addEventListener(\"online\"") && cloud.includes("offline"),"offline changes wait for a reconnect");
check(cloud.includes('syncState = "conflict"') && cloud.includes('.eq("revision", base)'),"sync detects remote changes and uses optimistic concurrency");
check(cloud.includes("applyCloudSnapshot") && cloud.includes("localSyncKey(\"seen\")"),"clean devices can receive newer cloud snapshots without overwriting dirty local work");
check(cloud.includes("syncKey(\"enabled\")") && cloud.includes("consentKey()"),"automatic sync requires prior backup/restore and active consent");

check(cloud.includes('select("preferences,updated_at,revision")')&&cloud.includes('.eq("revision", base)'),"automatic sync uses database revision compare-and-swap");
check(cloud.includes('window.addEventListener("pog:local-change"')&&cloud.includes('window.addEventListener("online"'),"local changes are queued and retried after reconnect");
check(cloud.includes('syncState === "conflict"')&&cloud.includes('data-cloud="sync"'),"sync status and manual conflict recovery are exposed in the cloud panel");
check(syncMigration.includes("create trigger profile_data_revision")&&syncMigration.includes("new.revision := old.revision + 1"),"database advances a revision for every cloud update");
check(cloud.includes('String(r.data.revision||1)')&&cloud.includes('pog_cloud_sync_"+profileId+"_seen'),"manual backup and restore establish a revision baseline for the captured profile");
check(cloud.includes("snapshot(profileId)")&&cloud.includes("localSyncKey"),"in-flight sync is isolated to the learner profile that started it");
const manualBackup=cloud.match(/async function backup\(\) \{([\s\S]*?)\n  \}/);
const manualRestore=cloud.match(/async function restore\(\) \{([\s\S]*?)\n  \}/);
check(manualBackup&&manualBackup[1].includes("var profileId=activeId()")&&manualBackup[1].includes("activeId()!==profileId")&&manualBackup[1].includes("snapshot(profileId)")&&manualBackup[1].includes('"pog_cloud_sync_"+profileId'),"manual backup keeps its starting profile across asynchronous work");
check(manualRestore&&manualRestore[1].includes('var profileId=activeId(), cloudId=localStorage.getItem(mapKey(profileId))||""')&&manualRestore[1].includes("activeId()!==profileId")&&manualRestore[1].includes('"pog_p_"+profileId+"_"+k')&&manualRestore[1].includes('"pog_cloud_sync_"+profileId'),"manual restore cannot apply cloud data or metadata to a profile selected during its request");
check(manualBackup&&manualBackup[1].lastIndexOf("hasConsent(profileId)")>manualBackup[1].indexOf("await ensureCloudProfile(profileId)")&&manualBackup[1].indexOf("hasConsent(profileId)")<manualBackup[1].indexOf('client.from("profile_data").update'),"manual backup rechecks consent after cloud profile setup before upload");
const syncNow=cloud.match(/async function syncNow\(\) \{([\s\S]*?)\n  \}/);
check(syncNow&&syncNow[1].indexOf("await signedIn()")<syncNow[1].indexOf("hasConsent(profileId)")&&syncNow[1].indexOf('await client.from("profile_data").select')<syncNow[1].lastIndexOf("hasConsent(profileId)")&&syncNow[1].lastIndexOf("hasConsent(profileId)")<syncNow[1].indexOf(".update({ preferences: data"),"automatic sync rechecks consent after authentication and its pending read before upload");
const therapist=fs.readFileSync(path.join(root,"js/therapist-cloud.js"),"utf8");
const publish=therapist.match(/async function publishLocalSessions\(profileId\) \{([\s\S]*?)\n  \}/);
check(publish&&publish[1].indexOf("await client.auth.getSession()")<publish[1].lastIndexOf('localStorage.getItem("pog_cloud_consent_"+profileId)')&&publish[1].lastIndexOf('localStorage.getItem("pog_cloud_consent_"+profileId)')<publish[1].indexOf('client.rpc("upsert_therapist_session_metrics"'),"therapist metrics recheck consent before upload");
