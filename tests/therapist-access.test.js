"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/202611110005_therapist_read_only_access.sql"), "utf8") +
  fs.readFileSync(path.join(root, "supabase/migrations/202611120001_restrict_therapist_session_payloads.sql"), "utf8");

function check(ok, label) {
  if (!ok) { console.error("FAIL " + label); process.exitCode = 1; }
  else console.log("ok   " + label);
}

check(migration.includes("has_profile_role(profile_id, array['owner', 'caregiver', 'learner'])"), "therapists cannot create or update learning sessions");
check(migration.includes("create policy \"non-therapist members can read learning sessions\"") && migration.includes("has_profile_role(profile_id, array['owner', 'caregiver', 'learner'])"), "therapists cannot read unrestricted session checkpoint or summary data");
check(migration.includes("has_profile_role(profile_id, array['owner', 'caregiver'])"), "only owners and caregivers can write the cloud profile snapshot");
check(migration.includes("create policy \"non-therapist members can read profile data\"") && migration.includes("array['owner', 'caregiver', 'learner']"), "therapists cannot read the broader profile snapshot");
check(!/create policy[^;]+on public\.learning_sessions for delete/is.test(migration), "session history has no client delete policy");
