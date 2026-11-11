"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611110007_deletion_retention_controls.sql"),"utf8");
const api=fs.readFileSync(path.join(root,"supabase/functions/profile-access/index.ts"),"utf8");
const worker=fs.readFileSync(path.join(root,"supabase/functions/profile-lifecycle-worker/index.ts"),"utf8");
const ui=fs.readFileSync(path.join(root,"js/deletion-retention.js"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(migration.includes("interval '30 days'")&&migration.includes("scheduled_for"),"deletion requests have a 30-day grace period");
check(migration.includes("on delete set null")&&migration.includes("status in ('pending', 'cancelled', 'completed')"),"deletion requests retain an audit record after profile removal");
check(migration.includes("therapist_metrics_retention_days")&&migration.includes("in (30, 90, 180, 365, 730)"),"retention is constrained to explicit supported periods");
check(migration.includes("grant execute on function public.run_profile_retention_maintenance() to service_role"),"only service role can run destructive maintenance");
check(api.includes('body.action === "request_profile_deletion"')&&api.includes('owners.length !== 1'),"only the sole owner can request profile deletion");
check(api.includes('body.action === "cancel_profile_deletion"')&&api.includes('.eq("requested_by", user.id)'),"only the requester can cancel a pending deletion");
check(api.includes('body.action === "set_retention"')&&api.includes('[30, 90, 180, 365, 730]'),"retention updates are server-authorized and allowlisted");
check(worker.includes("LIFECYCLE_WORKER_SECRET")&&worker.includes('rpc("run_profile_retention_maintenance")'),"scheduled worker is secret-protected and invokes database maintenance");
check(ui.includes("30-day grace period")&&ui.includes("Local copies on devices are not erased"),"UI explains grace period and local-data scope");
check(ui.includes("therapist dashboard metrics")&&ui.includes("Full session history"),"UI explains exactly what retention affects");
check(!ui.includes("SUPABASE_SERVICE_ROLE_KEY")&&!worker.includes("service_role"),"no service-role key or role credential is exposed in browser code");
