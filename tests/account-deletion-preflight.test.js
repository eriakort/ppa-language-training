"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const api=fs.readFileSync(path.join(root,"supabase/functions/profile-access/index.ts"),"utf8");
const ui=fs.readFileSync(path.join(root,"js/account-deletion-review.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const docs=fs.readFileSync(path.join(root,"docs/IDENTITY-PERSISTENCE.md"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(api.includes('body.action === "account_deletion_preflight"'),"preflight is a dedicated authenticated server action");
check((api.match(/gt\("expires_at", new Date\(\)\.toISOString\(\)\)/g)||[]).length>=2,"expired ownership invitations do not block account review");
check(api.includes('.eq("user_id", user.id)')&&api.includes('profile_ownership_transfers'),"preflight inspects all account memberships and pending transfers");
check(api.includes('owner_count: owners.length')&&api.includes('caregiver_count: caregivers.length'),"preflight evaluates profile ownership and available caregivers");
check(api.includes('deletion_pending: Boolean(pendingDeletion)')&&api.includes('profile_deletion_requests'),"preflight detects pending profile deletion");
check(api.includes('ready: blockers.length === 0')&&api.includes('membership_will_be_revoked'),"preflight reports blockers and non-owner memberships");
check(ui.includes("Read-only review")&&ui.includes("non elimina l'account"),"UI clearly states review does not delete account");
check(ui.includes("Local data and audio recordings")&&ui.includes("caregiver"),"UI discloses local data boundary and ownership resolution");
check(html.includes('js/account-deletion-review.js'),"account deletion review panel is loaded");
check(docs.includes("Account deletion preflight (read-only)")&&docs.includes("transactionally"),"docs describe read-only preflight and future transactional gate");
check(!ui.includes("SUPABASE_SERVICE_ROLE_KEY"),"browser UI contains no service-role secret");
