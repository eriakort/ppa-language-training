-- Serialize destructive deletion and ownership handoff through the learner profile row.
-- This prevents an active transfer invitation from being orphaned by a deletion request
-- and closes races between deletion, transfer creation, and transfer acceptance.

-- Preserve profiles that already have an active transfer invitation while repairing
-- any deletion requests created before these lifecycle operations were serialized.
update public.profile_deletion_requests deletion
  set status = 'cancelled', cancelled_at = now()
  where deletion.status = 'pending'
    and exists (select 1 from public.profile_ownership_transfers transfer
      where transfer.profile_id = deletion.profile_id
        and transfer.status = 'pending' and transfer.expires_at > now());

create or replace function public.request_profile_deletion(
  p_profile_id uuid,
  p_requester_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  deletion public.profile_deletion_requests%rowtype;
  owner_count integer;
begin
  perform id from public.learner_profiles where id = p_profile_id for update;
  if not found then raise exception 'Profile does not exist'; end if;

  select count(*) into owner_count from public.profile_members
    where profile_id = p_profile_id and role = 'owner';
  if owner_count <> 1 or not exists (
    select 1 from public.profile_members
    where profile_id = p_profile_id and user_id = p_requester_id and role = 'owner'
  ) then raise exception 'Only the sole profile owner can request deletion'; end if;

  if exists (select 1 from public.profile_deletion_requests
      where profile_id = p_profile_id and status = 'pending') then
    raise exception 'A deletion request is already pending';
  end if;
  if exists (select 1 from public.profile_ownership_transfers
      where profile_id = p_profile_id and status = 'pending' and expires_at > now()) then
    raise exception 'Resolve the active ownership transfer before requesting deletion';
  end if;

  insert into public.profile_deletion_requests(profile_id, requested_by, scheduled_for)
    values (p_profile_id, p_requester_id, now() + interval '30 days')
    returning * into deletion;
  return jsonb_build_object('id', deletion.id, 'status', deletion.status,
    'requested_at', deletion.requested_at, 'scheduled_for', deletion.scheduled_for);
end;
$$;
revoke all on function public.request_profile_deletion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.request_profile_deletion(uuid, uuid) to service_role;

create or replace function public.request_profile_ownership_transfer(
  p_profile_id uuid,
  p_from_user_id uuid,
  p_to_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  transfer public.profile_ownership_transfers%rowtype;
  source_role text;
  target_role text;
begin
  perform id from public.learner_profiles where id = p_profile_id for update;
  if not found then raise exception 'Profile does not exist'; end if;

  select role into source_role from public.profile_members
    where profile_id = p_profile_id and user_id = p_from_user_id;
  select role into target_role from public.profile_members
    where profile_id = p_profile_id and user_id = p_to_user_id;
  if source_role is distinct from 'owner' then raise exception 'Only the current owner can transfer ownership'; end if;
  if target_role is distinct from 'caregiver' then raise exception 'The new owner must be a caregiver'; end if;
  if exists (select 1 from public.profile_deletion_requests
      where profile_id = p_profile_id and status = 'pending') then
    raise exception 'Cancel the pending profile deletion before transferring ownership';
  end if;

  update public.profile_ownership_transfers set status = 'expired'
    where profile_id = p_profile_id and status = 'pending' and expires_at <= now();
  insert into public.profile_ownership_transfers(profile_id, from_user_id, to_user_id)
    values (p_profile_id, p_from_user_id, p_to_user_id)
    returning * into transfer;
  return jsonb_build_object('id', transfer.id, 'status', transfer.status, 'expires_at', transfer.expires_at);
end;
$$;
revoke all on function public.request_profile_ownership_transfer(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.request_profile_ownership_transfer(uuid, uuid, uuid) to service_role;

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
  transfer_profile_id uuid;
  target_role text;
  source_role text;
begin
  select profile_id into transfer_profile_id from public.profile_ownership_transfers
    where id = transfer_id;
  if not found then raise exception 'Transfer is no longer pending'; end if;
  perform id from public.learner_profiles where id = transfer_profile_id for update;
  if not found then raise exception 'Profile does not exist'; end if;

  select * into transfer from public.profile_ownership_transfers
    where id = transfer_id and status = 'pending' for update;
  if not found then raise exception 'Transfer is no longer pending'; end if;
  if transfer.to_user_id is distinct from accepting_user_id then raise exception 'Only the invited member can accept'; end if;
  if transfer.expires_at <= now() then raise exception 'Transfer invitation has expired'; end if;

  select role into source_role from public.profile_members
    where profile_id = transfer.profile_id and user_id = transfer.from_user_id for update;
  select role into target_role from public.profile_members
    where profile_id = transfer.profile_id and user_id = accepting_user_id for update;
  if source_role is distinct from 'owner' then raise exception 'Current owner is no longer eligible'; end if;
  if target_role is distinct from 'caregiver' then raise exception 'Only an existing caregiver can become owner'; end if;
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
