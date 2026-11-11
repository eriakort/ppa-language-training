"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const fn=fs.readFileSync(path.join(root,"supabase/functions/profile-access/index.ts"),"utf8");
const ui=fs.readFileSync(path.join(root,"js/profile-lifecycle.js"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(fn.includes('body.action === "list_members"')&&fn.includes('body.action === "remove_member"'),"membership listing and revocation use the trusted edge function");
check(fn.includes('membership.role !== "owner"')&&fn.includes('target.role !== "owner"'),"only owners can revoke non-owner memberships");
check(fn.includes('membership.role === "caregiver" && target.role === "learner"'),"caregivers can revoke learner access only");
check(fn.includes('admin.from("profile_members").delete()'),"revocation is performed server-side");
check(ui.includes("profileId:id")&&ui.includes("exportedAt")&&ui.includes('JSON.stringify(data,null,2)'),"local profile export is portable JSON");
check(ui.includes('"active_session"')&&ui.includes('"scripts_it"')&&ui.includes('"scripts_en"'),"export includes checkpoint and bilingual personal phrases");
check(ui.includes("Device-only audio recordings")&&ui.includes("registrazioni audio"),"export clearly discloses excluded device-only audio");
check(ui.includes('action:"list_members"')&&ui.includes('action:"remove_member"'),"client uses the approved lifecycle actions");
check(!ui.includes("SUPABASE_SERVICE_ROLE_KEY"),"browser lifecycle code contains no service-role secret");
