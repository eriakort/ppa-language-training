-- Therapist membership is deliberately read-only.
-- Therapists can review session history, but cannot read the broad profile snapshot
-- (which may contain personal phrases, settings and identifying information), or
-- create, update or delete learner data.

drop policy if exists "members can read profile data" on public.profile_data;
drop policy if exists "non-therapist members can read profile data" on public.profile_data;
create policy "non-therapist members can read profile data"
  on public.profile_data for select
  using (public.has_profile_role(profile_id, array['owner', 'caregiver', 'learner']));

drop policy if exists "profile managers can write profile data" on public.profile_data;
create policy "profile managers can write profile data"
  on public.profile_data for all
  using (public.has_profile_role(profile_id, array['owner', 'caregiver']))
  with check (public.has_profile_role(profile_id, array['owner', 'caregiver']));

drop policy if exists "members can read learning sessions" on public.learning_sessions;
create policy "profile members can read learning sessions"
  on public.learning_sessions for select
  using (public.is_profile_member(profile_id));

drop policy if exists "members can save learning sessions" on public.learning_sessions;
create policy "non-therapist members can create learning sessions"
  on public.learning_sessions for insert
  with check (public.has_profile_role(profile_id, array['owner', 'caregiver', 'learner']));

drop policy if exists "members can update learning sessions" on public.learning_sessions;
create policy "non-therapist members can update learning sessions"
  on public.learning_sessions for update
  using (public.has_profile_role(profile_id, array['owner', 'caregiver', 'learner']))
  with check (public.has_profile_role(profile_id, array['owner', 'caregiver', 'learner']));

-- No DELETE policy is created for learning_sessions. Session history is retained
-- until an authorized profile lifecycle operation is implemented in a later step.
