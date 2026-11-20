-- Transactional account deletion preparation and anonymized audit log.
-- Allows a signed-in user with no owned profiles or pending ownership transfers
-- to revoke remaining shared memberships and clear creator foreign keys atomically
-- before the trusted Edge Function deletes their auth.users record.

alter table public.learner_profiles
  alter column created_by drop not null;

alter table public.learner_profiles
  drop constraint if exists learner_profiles_created_by_fkey;

alter table public.learner_profiles
  add constraint learner_profiles_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

create table if not exists public.account_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  revoked_memberships integer not null default 0,
  cleared_creators integer not null default 0,
  deleted_at timestamptz not null default now()
);

alter table public.account_deletion_audit enable row level security;
revoke all on public.account_deletion_audit from public, anon, authenticated;

-- Serializes against concurrent transfer or deletion requests on all profiles
-- associated with p_user_id, verifies zero ownership or active transfer blockers,
-- revokes remaining shared memberships, and records an anonymized audit row.
create or replace function public.prepare_account_deletion(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  revoked_count integer := 0;
  cleared_count integer := 0;
begin
  perform id from public.learner_profiles
    where id in (
      select profile_id from public.profile_members where user_id = p_user_id
    ) or created_by = p_user_id
    order by id
    for update;

  update public.profile_ownership_transfers
    set status = 'expired'
    where status = 'pending'
      and expires_at <= now()
      and (from_user_id = p_user_id or to_user_id = p_user_id);

  if exists (
    select 1 from public.profile_members
    where user_id = p_user_id and role = 'owner'
  ) then
    raise exception 'Resolve owned profiles before deleting your account';
  end if;

  if exists (
    select 1 from public.profile_ownership_transfers
    where status = 'pending'
      and expires_at > now()
      and (from_user_id = p_user_id or to_user_id = p_user_id)
  ) then
    raise exception 'Resolve pending ownership transfers before deleting your account';
  end if;

  delete from public.profile_members
    where user_id = p_user_id and role <> 'owner';
  get diagnostics revoked_count = row_count;

  update public.learner_profiles
    set created_by = null
    where created_by = p_user_id;
  get diagnostics cleared_count = row_count;

  insert into public.account_deletion_audit (revoked_memberships, cleared_creators)
    values (revoked_count, cleared_count);

  return jsonb_build_object(
    'ok', true,
    'revoked_memberships', revoked_count,
    'cleared_creators', cleared_count
  );
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
