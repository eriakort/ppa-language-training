-- Therapist dashboards use therapist_session_metrics, a narrow aggregate
-- projection. Do not expose unrestricted checkpoint or summary JSON through
-- learning_sessions to therapist accounts.
drop policy if exists "profile members can read learning sessions" on public.learning_sessions;
create policy "non-therapist members can read learning sessions"
  on public.learning_sessions for select
  using (public.has_profile_role(profile_id, array['owner', 'caregiver', 'learner']));
