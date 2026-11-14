"use strict";
/* Static checks for the cloud "Progress and statistics" data (per-exercise and check-in aggregates).
   The migration was also exercised against PostgreSQL 16 with a Supabase-like stub during development. */
const fs=require("fs"),path=require("path"),vm=require("vm"),root=path.resolve(__dirname,"..");
const sql=fs.readFileSync(path.join(root,"supabase/migrations/202611140001_therapist_progress_metrics.sql"),"utf8");
const ui=fs.readFileSync(path.join(root,"js/therapist-cloud.js"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(/create table if not exists public\.therapist_game_metrics[\s\S]*check \(game in \('describe', 'mystery', 'crossword', 'name', 'wordbuild', 'script', 'read', 'echo', 'seq'\)\)/.test(sql),"exercise rows accept only known game names, never free text");
check(/references public\.therapist_session_metrics \(profile_id, session_id\) on delete cascade/.test(sql),"exercise rows are removed with their session (retention and deletion)");
check(/therapist_checkin_metrics \([\s\S]*references public\.learner_profiles\(id\) on delete cascade/.test(sql),"check-in rows are removed with the profile");
check((sql.match(/has_profile_role\(profile_id, array\['owner', 'caregiver', 'therapist'\]\)/g)||[]).length===2,"therapists and profile managers can read both new tables");
check(!/create policy[^;]+for (insert|update|delete)/i.test(sql),"no client insert, update or delete policies");
check(sql.includes("revoke all privileges on public.therapist_game_metrics from anon, authenticated")&&sql.includes("revoke all privileges on public.therapist_checkin_metrics from anon, authenticated"),"direct table access is revoked");
check(/grant select \(profile_id, session_id, game, level, item_count, accuracy, avg_hints, median_item_ms, median_onset_ms, median_wpm\)/.test(sql),"only the approved exercise columns are readable");
check((sql.match(/has_profile_role\(target_profile, array\['owner', 'caregiver', 'learner'\]\)/g)||[]).length===2,"the writer RPC checks learner-side membership for every row");
check(sql.includes("revoke all on function public.upsert_therapist_progress_metrics(jsonb, jsonb) from public, anon"),"the writer RPC is not public");
check(sql.includes("execute function public.validate_therapist_metric_timestamp()")&&sql.includes("on public.therapist_checkin_metrics"),"check-in timestamps can't be in the future");
check(sql.includes("delete from public.therapist_checkin_metrics c")&&sql.includes("c.started_at < now() - make_interval(days => s.therapist_metrics_retention_days)"),"check-in rows follow the profile's retention period");
check(sql.includes("grant execute on function public.run_profile_retention_maintenance() to service_role"),"retention stays callable only by the scheduled worker");
check(ui.includes('rpc("upsert_therapist_progress_metrics"')&&/publishProgress[\s\S]*pog_cloud_consent_/.test(ui),"publishing uses the RPC and needs cloud consent");
// the payload builder never includes labels, heard words, transcripts or audio
const start=ui.indexOf("  function progressPayload("), end=ui.indexOf("  async function publishProgress(");
const ctx={Math,Number,String,Date,isFinite,JSON,Array};vm.createContext(ctx);
vm.runInContext("var PROGRESS_GAMES="+JSON.stringify(["describe","mystery","crossword","name","wordbuild","script","read","echo","seq"])+";var BASE_SCORE={good:1,almost:0.5,choice:0.5,model:0,done:1,skip:0,retry:0};"+
  "function average(values){var a=values.filter(function(v){return typeof v==='number'&&isFinite(v);});return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:null;}"+
  ui.slice(ui.indexOf("  function median("),ui.indexOf("  function progressPayload("))+ui.slice(start,end)+";this.f=progressPayload;",ctx);
const out=ctx.f("cloud-1",[{id:"s1",mode:"session",date:"2026-11-10T10:00:00Z",items:[{game:"name",lv:2,label:"Anna",heard:"è Anna",result:"good",score:1,hints:1,ms:8000,meas:{onsetMs:1400,wpm:null}},{game:"name",lv:2,label:"cane",heard:"gatto",result:"retry",hints:3,ms:9000,meas:null},{game:"calc",lv:null,result:"good"}]},{id:"p1",mode:"place",items:[{game:"name",lv:1,result:"good"}]}],
  [{id:"kabc",date:"2026-11-09T10:00:00Z",who:"solo",naming:{correct:8,total:10,items:[{w:"pesce",heard:"pesce"}]},flu:{count:12,words:["cane","gatto"]},rep:{avg:0.8,items:[{heard:"il gatto"}]},desc:{wpm:100,transcript:"una signora"}}]);
check(out.games.length===1&&out.games[0].game==="name"&&out.games[0].accuracy===0.5&&out.games[0].level===2,"payload: one row per exercise with level and accuracy (extras and the starting check left out)");
const flat=JSON.stringify(out);
check(!/Anna|gatto|cane|pesce|signora|heard|label|transcript|words/.test(flat),"payload: no labels, recognised words, transcripts or word lists leave the device");
check(out.checkins.length===1&&out.checkins[0].naming_correct===8&&out.checkins[0].fluency_count===12&&out.checkins[0].player_mode==="solo","payload: check-ins carry scores only");
