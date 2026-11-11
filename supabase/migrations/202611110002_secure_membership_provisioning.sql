-- Lock membership grants behind the trusted profile-access Edge Function.
-- Client-side role changes are deliberately forbidden: a caregiver/therapist
-- must never be able to promote themselves or another member to owner.

drop policy if exists "signed-in users can create their own profiles" on public.learner_profiles;
drop policy if exists "profile managers can manage membership" on public.profile_members;

create policy "profile members can view membership"
  on public.profile_members for select
  using (public.is_profile_member(profile_id));

revoke insert, update, delete on public.learner_profiles from anon, authenticated;
revoke insert, update, delete on public.profile_members from anon, authenticated;

-- A signed-in owner/caregiver may update profile metadata, but membership is
-- provisioned only by the service-role Edge Function after authorization.
grant select, update on public.learner_profiles to authenticated;
grant select on public.profile_members to authenticated;

-- Harden SECURITY DEFINER function resolution against object-shadowing.
create or replace function public.is_profile_member(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profile_members m
    where m.profile_id = target_profile and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_profile_role(target_profile uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profile_members m
    where m.profile_id = target_profile
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_profile_member(uuid) from public;
revoke all on function public.has_profile_role(uuid, text[]) from public;
grant execute on function public.is_profile_member(uuid) to authenticated;
grant execute on function public.has_profile_role(uuid, text[]) to authenticated;
