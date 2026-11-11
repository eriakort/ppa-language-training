"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611110008_profile_ownership_transfer.sql"),"utf8");
const api=fs.readFileSync(path.join(root,"supabase/functions/profile-access/index.ts"),"utf8");
const ui=fs.readFileSync(path.join(root,"js/ownership-transfer.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(migration.includes("one_pending_ownership_transfer_per_profile")&&migration.includes("interval '7 days'"),"one pending transfer per profile with a seven-day expiry");
check(migration.includes("grant execute on function public.complete_profile_ownership_transfer(uuid, uuid) to service_role"),"only service role can execute the atomic ownership change");
check(migration.includes("target_role is distinct from 'caregiver'")&&migration.includes("source_role is distinct from 'owner'"),"only an existing caregiver can accept from the current owner");
check(migration.includes("set role = 'caregiver'")&&migration.includes("set role = 'owner'"),"acceptance promotes recipient and retains former owner as caregiver");
check(migration.includes("profile_deletion_requests")&&migration.includes("status = 'pending'"),"pending profile deletion blocks ownership transfer");
check(api.includes('body.action === "request_ownership_transfer"')&&api.includes('target?.role !== "caregiver"'),"trusted API limits requests to existing caregivers");
check(api.includes('body.action === "accept_ownership_transfer"')&&api.includes('accepting_user_id: user.id'),"acceptance is bound to the authenticated recipient");
check(api.includes('body.action === "cancel_ownership_transfer"')&&api.includes('.eq("from_user_id", user.id)')&&api.includes('body.action === "list_outgoing_transfers"'),"only the requesting owner can cancel");
check(ui.includes("7 days")&&ui.includes("caregiver")&&ui.includes("list_incoming_transfers"),"bilingual UI explains eligibility and incoming invitations");
check(html.includes('js/ownership-transfer.js'),"ownership transfer interface is loaded by the app");
check(!ui.includes("SUPABASE_SERVICE_ROLE_KEY"),"browser code contains no service-role secret");
