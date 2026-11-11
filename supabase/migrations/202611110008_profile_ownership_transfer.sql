-- Controlled ownership transfer for shared learner profiles.
-- Only an existing caregiver can accept; transfer is atomic and leaves the former
-- owner as a caregiver so access is not silently removed.

create table if not exists public.profile_ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.learner_profiles(id) on delete cascade,
  from_user_id uuid references auth.users(id) on delete set null,
  to_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  cancelled_at timestamptz,
  check (from_user_id is distinct from to_user_id)
);
create unique index if not exists one_pending_ownership_transfer_per_profile
  on public.profile_ownership_transfers(profile_id) where status = 'pending';
create index if not exists ownership_transfers_incoming
  on public.profile_ownership_transfers(to_user_id, expires_at) where status = 'pending';

alter table public.profile_ownership_transfers enable row level security;
revoke all on public.profile_ownership_transfers from anon, authenticated;

-- Called only by profile-access after it has authenticated the accepting user.
create or replace function public.complete_profile_ownership_transfer(
  transfer_id uuid,
  accepting_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  transfer public.profile_ownership_transfers%rowtype;
  target_role text;
  source_role text;
begin
  select * into transfer from public.profile_ownership_transfers
    where id = transfer_id and status = 'pending' for update;
  if not found then raise exception 'Transfer is no longer pending'; end if;
  if transfer.to_user_id is distinct from accepting_user_id then raise exception 'Only the invited member can accept'; end if;
  if transfer.expires_at <= now() then
    update public.profile_ownership_transfers set status = 'expired' where id = transfer.id;
    raise exception 'Transfer invitation has expired';
  end if;

  select role into source_role from public.profile_members
    where profile_id = transfer.profile_id and user_id = transfer.from_user_id for update;
  select role into target_role from public.profile_members
    where profile_id = transfer.profile_id and user_id = accepting_user_id for update;
  if source_role <> 'owner' then raise exception 'Current owner is no longer eligible'; end if;
  if target_role <> 'caregiver' then raise exception 'Only an existing caregiver can become owner'; end if;
  if exists (select 1 from public.profile_deletion_requests
      where profile_id = transfer.profile_id and status = 'pending') then
    raise exception 'Cancel the pending profile deletion before transferring ownership';
  end if;

  update public.profile_members set role = 'caregiver'
    where profile_id = transfer.profile_id and user_id = transfer.from_user_id;
  update public.profile_members set role = 'owner'
    where profile_id = transfer.profile_id and user_id = accepting_user_id;
  update public.profile_ownership_transfers set status = 'accepted', accepted_at = now()
    where id = transfer.id;
  return jsonb_build_object('profile_id', transfer.profile_id, 'previous_owner_role', 'caregiver', 'new_owner_role', 'owner');
end;
$$;
revoke all on function public.complete_profile_ownership_transfer(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_profile_ownership_transfer(uuid, uuid) to service_role;
