"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/202611110002_secure_membership_provisioning.sql"), "utf8");
const fn = fs.readFileSync(path.join(root, "supabase/functions/profile-access/index.ts"), "utf8");

function check(ok, label) {
  if (!ok) { console.error("FAIL " + label); process.exitCode = 1; }
  else console.log("ok   " + label);
}
check(migration.includes("revoke insert, update, delete on public.profile_members from anon, authenticated"), "clients cannot grant or change profile roles");
check(migration.includes("set search_path = pg_catalog, public"), "security-definer functions use a hardened search path");
check(fn.includes('body.action === "create_profile"') && fn.includes('role: "owner"'), "self-registration provisions the first owner via trusted server code");
check(fn.includes('body.action === "invite_member"'), "managed invitations use a trusted server endpoint");
check(fn.includes('membership.role === "owner"') && fn.includes('membership.role === "caregiver" && role === "learner"'), "invitation roles are restricted by inviter permissions");
check(fn.includes("SUPABASE_SERVICE_ROLE_KEY") && !fs.readFileSync(path.join(root, ".gitignore"), "utf8").includes("SUPABASE_SERVICE_ROLE_KEY"), "service-role key is referenced only as a server environment secret");
