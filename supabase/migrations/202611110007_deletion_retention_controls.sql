-- Profile deletion requests and configurable retention for therapist aggregate metrics.
-- Destructive processing is performed only by the trusted scheduled maintenance function.

create table if not exists public.profile_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.learner_profiles(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'cancelled', 'completed')),
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null default (now() + interval '30 days'),
  cancelled_at timestamptz,
  completed_at timestamptz,
  check ((status = 'cancelled' and cancelled_at is not null)
      or (status <> 'cancelled' and cancelled_at is null)),
  check ((status = 'completed' and completed_at is not null)
      or (status <> 'completed' and completed_at is null))
);
create unique index if not exists one_pending_deletion_per_profile
  on public.profile_deletion_requests(profile_id) where status = 'pending' and profile_id is not null;
create index if not exists profile_deletion_due
  on public.profile_deletion_requests(scheduled_for) where status = 'pending';

create table if not exists public.profile_retention_settings (
  profile_id uuid primary key references public.learner_profiles(id) on delete cascade,
  therapist_metrics_retention_days integer not null default 365
    check (therapist_metrics_retention_days in (30, 90, 180, 365, 730)),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.profile_retention_settings(profile_id)
select id from public.learner_profiles
on conflict (profile_id) do nothing;

create or replace function public.initialize_profile_retention()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  insert into public.profile_retention_settings(profile_id) values (new.id)
  on conflict (profile_id) do nothing;
  return new;
end;
$$;
drop trigger if exists learner_profile_retention_init on public.learner_profiles;
create trigger learner_profile_retention_init after insert on public.learner_profiles
for each row execute function public.initialize_profile_retention();
revoke all on function public.initialize_profile_retention() from public;

alter table public.profile_deletion_requests enable row level security;
alter table public.profile_retention_settings enable row level security;

drop policy if exists "owners can view profile deletion requests" on public.profile_deletion_requests;
create policy "owners can view profile deletion requests"
  on public.profile_deletion_requests for select
  using (public.has_profile_role(profile_id, array['owner']));
drop policy if exists "profile managers can view retention settings" on public.profile_retention_settings;
create policy "profile managers can view retention settings"
  on public.profile_retention_settings for select
  using (public.has_profile_role(profile_id, array['owner', 'caregiver']));

revoke all on public.profile_deletion_requests from anon, authenticated;
revoke all on public.profile_retention_settings from anon, authenticated;
grant select on public.profile_deletion_requests to authenticated;
grant select on public.profile_retention_settings to authenticated;

-- This function is invoked only by the trusted scheduled worker using the service role.
-- It applies per-profile retention to aggregate therapist metrics and completes due
-- profile deletion requests in the same database transaction.
create or replace function public.run_profile_retention_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  metrics_removed integer := 0;
  profiles_removed integer := 0;
  due record;
begin
  delete from public.therapist_session_metrics m
  using public.profile_retention_settings s
  where m.profile_id = s.profile_id
    and m.started_at < now() - make_interval(days => s.therapist_metrics_retention_days);
  get diagnostics metrics_removed = row_count;

  for due in
    select id, profile_id from public.profile_deletion_requests
    where status = 'pending' and profile_id is not null and scheduled_for <= now()
    for update
  loop
    update public.profile_deletion_requests
      set status = 'completed', completed_at = now()
      where id = due.id and status = 'pending';
    delete from public.learner_profiles where id = due.profile_id;
    if found then profiles_removed := profiles_removed + 1; end if;
  end loop;

  return jsonb_build_object('metrics_removed', metrics_removed, 'profiles_removed', profiles_removed);
end;
$$;
revoke all on function public.run_profile_retention_maintenance() from public, anon, authenticated;
grant execute on function public.run_profile_retention_maintenance() to service_role;
