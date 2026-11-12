-- Keep client-supplied session timestamps finite and close to real time so a
-- future-dated row cannot evade the profile's scheduled metric-retention policy.
delete from public.therapist_session_metrics
  where not isfinite(started_at::timestamp)
    or started_at > now() + interval '5 minutes';

create or replace function public.validate_therapist_metric_timestamp()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if not isfinite(new.started_at::timestamp)
    or new.started_at > now() + interval '5 minutes' then
    raise exception 'Session timestamp must be finite and not in the future';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_therapist_metric_timestamp() from public, anon, authenticated;

drop trigger if exists therapist_metric_timestamp_guard on public.therapist_session_metrics;
create trigger therapist_metric_timestamp_guard
  before insert or update on public.therapist_session_metrics
  for each row execute function public.validate_therapist_metric_timestamp();
