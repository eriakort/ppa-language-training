"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/202611120004_validate_therapist_metric_timestamps.sql"),"utf8");
const retention=fs.readFileSync(path.join(root,"supabase/migrations/202611110007_deletion_retention_controls.sql"),"utf8");
const metrics=fs.readFileSync(path.join(root,"supabase/migrations/202611120002_limit_therapist_metric_columns.sql"),"utf8");
function check(ok,label){if(!ok){console.error("FAIL "+label);process.exitCode=1;}else console.log("ok   "+label);}
check(migration.includes("not isfinite(started_at::timestamp)")&&migration.includes("started_at > now() + interval '5 minutes'"),"existing infinite and materially future-dated metrics are removed");
check(migration.includes("before insert or update on public.therapist_session_metrics")&&migration.includes("not isfinite(new.started_at::timestamp)")&&migration.includes("new.started_at > now() + interval '5 minutes'"),"database rejects non-finite or future timestamps from every metric write path");
check(retention.includes("m.started_at < now() - make_interval(days => s.therapist_metrics_retention_days)"),"scheduled retention is based on the validated session timestamp");
check(metrics.includes("grant execute on function public.upsert_therapist_session_metrics(jsonb) to authenticated"),"the metric timestamp guard protects authenticated RPC writes");
