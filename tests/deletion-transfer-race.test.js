"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611120003_serialize_profile_deletion_and_transfer.sql"),"utf8");
const api=fs.readFileSync(path.join(root,"supabase/functions/profile-access/index.ts"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
function functionBody(name){const start=migration.indexOf("create or replace function public."+name);if(start<0)return "";const end=migration.indexOf("$$;",start);return end<0?"":migration.slice(start,end);}
const deletion=functionBody("request_profile_deletion");
const transfer=functionBody("request_profile_ownership_transfer");
const acceptance=functionBody("complete_profile_ownership_transfer");
check(deletion.includes("for update")&&deletion.includes("profile_ownership_transfers")&&deletion.includes("expires_at > now()"),"deletion requests serialize on the profile and reject active transfer invitations");
check(migration.includes("set status = 'cancelled', cancelled_at = now()")&&migration.includes("Preserve profiles that already have an active transfer invitation"),"migration cancels older deletion requests that conflict with an active transfer");
check(transfer.includes("for update")&&transfer.includes("profile_deletion_requests")&&transfer.includes("status = 'pending'"),"ownership transfer creation serializes on the profile and rejects pending deletion");
check(acceptance.indexOf("perform id from public.learner_profiles")<acceptance.indexOf("for update")&&acceptance.indexOf("perform id from public.learner_profiles")<acceptance.indexOf("where id = transfer_id and status = 'pending' for update"),"transfer acceptance locks the same profile before locking its invitation");
check(api.includes('rpc("request_profile_deletion"')&&api.includes('rpc("request_profile_ownership_transfer"'),"trusted API routes both lifecycle changes through the atomic database functions");
check(migration.includes("grant execute on function public.request_profile_deletion(uuid, uuid) to service_role")&&migration.includes("grant execute on function public.request_profile_ownership_transfer(uuid, uuid, uuid) to service_role"),"only the trusted service role can request deletion or ownership transfer");
