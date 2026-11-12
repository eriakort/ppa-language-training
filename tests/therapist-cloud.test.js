"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611110006_therapist_session_metrics.sql"),"utf8");
const columnGrants=fs.readFileSync(path.join(root,"supabase/migrations/202611120002_limit_therapist_metric_columns.sql"),"utf8");
const ui=fs.readFileSync(path.join(root,"js/therapist-cloud.js"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(migration.includes("has_profile_role(profile_id, array['owner', 'caregiver', 'therapist'])"),"therapists can read only the dedicated metrics projection");
check(migration.includes("array['owner', 'caregiver', 'learner']"),"only non-therapist learner-side roles can write metrics");
check(!/create policy[^;]+for delete/is.test(migration),"no client-side delete policy exists");
["item_count","spoken_count","avg_onset_ms","avg_wpm","avg_pauses","avg_longest_pause_ms","result_counts"].forEach(k=>check(migration.includes(k),"metrics schema includes "+k));
check(ui.includes('pog_cloud_consent_')&&ui.includes('pog_cloud_profile_'),"metric publishing requires explicit cloud consent and a linked cloud profile");
["label","heard","blob","session_state"].forEach(k=>check(!/return \{[^}]*\b"+k+"\s*:/.test(ui),"metrics publisher does not serialize "+k));
check(ui.includes('rpc("upsert_therapist_session_metrics"')&&columnGrants.includes("on conflict (profile_id, session_id) do update"),"session aggregates sync idempotently through the membership-checked RPC");
check(ui.includes('from("profile_members").select("profile_id,role")')&&ui.includes('from("learner_profiles").select("id,display_name")'),"dashboard lists only explicitly shared profile memberships");
check(columnGrants.includes("revoke all privileges on public.therapist_session_metrics from anon, authenticated")&&columnGrants.includes("avg_longest_pause_ms"),"direct table access is revoked and authenticated users receive only approved metric reads");
check(!/grant select\s*\([^)]*\bresult_counts\b/is.test(columnGrants)&&columnGrants.includes("revoke all on function public.upsert_therapist_session_metrics(jsonb) from public, anon"),"caller-supplied JSON is not exposed and the write RPC is not public");
check(columnGrants.includes("has_profile_role(target_profile, array['owner', 'caregiver', 'learner'])")&&columnGrants.includes("target_session !~ '^[sp][0-9a-z]{1,24}$'"),"the write RPC checks membership and constrains opaque session identifiers");
check(ui.includes('from("therapist_session_metrics").select("profile_id,started_at,mode,item_count,spoken_count,avg_onset_ms,avg_wpm,avg_pauses,avg_longest_pause_ms")'),"dashboard queries only its approved aggregate columns");
check(ui.includes("function exportCsv()"),"therapist can export aggregate history as CSV");
