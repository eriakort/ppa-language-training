"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611110006_therapist_session_metrics.sql"),"utf8");
const ui=fs.readFileSync(path.join(root,"js/therapist-cloud.js"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(migration.includes("has_profile_role(profile_id, array['owner', 'caregiver', 'therapist'])"),"therapists can read only the dedicated metrics projection");
check(migration.includes("array['owner', 'caregiver', 'learner']"),"only non-therapist learner-side roles can write metrics");
check(!/create policy[^;]+for delete/is.test(migration),"no client-side delete policy exists");
["item_count","spoken_count","avg_onset_ms","avg_wpm","avg_pauses","avg_longest_pause_ms","result_counts"].forEach(k=>check(migration.includes(k),"metrics schema includes "+k));
check(ui.includes('pog_cloud_consent_')&&ui.includes('pog_cloud_profile_'),"metric publishing requires explicit cloud consent and a linked cloud profile");
["label","heard","blob","session_state"].forEach(k=>check(!/return \{[^}]*\b"+k+"\s*:/.test(ui),"metrics publisher does not serialize "+k));
check(ui.includes('from("therapist_session_metrics").upsert')&&ui.includes('onConflict:"profile_id,session_id"'),"session aggregates sync idempotently");
check(ui.includes('from("profile_members").select("profile_id,role")')&&ui.includes('from("learner_profiles").select("id,display_name")'),"dashboard lists only explicitly shared profile memberships");
check(ui.includes('from("therapist_session_metrics").select("session_id,started_at,mode,item_count,spoken_count,avg_onset_ms,avg_wpm,avg_pauses,avg_longest_pause_ms")'),"dashboard queries only safe aggregate columns");
check(ui.includes("function exportCsv()"),"therapist can export aggregate history as CSV");
