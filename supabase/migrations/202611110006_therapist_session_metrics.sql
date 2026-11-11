-- A narrow, therapist-readable projection of session activity.
-- Never copy exercise labels, personal phrases, recognition transcripts, or audio here.
create table if not exists public.therapist_session_metrics (
  profile_id uuid not null references public.learner_profiles(id) on delete cascade,
  session_id text not null,
  started_at timestamptz not null,
  mode text not null check (mode in ('session', 'place')),
  player_mode text not null default 'assisted' check (player_mode in ('solo', 'assisted')),
  item_count integer not null default 0 check (item_count >= 0),
  spoken_count integer not null default 0 check (spoken_count >= 0),
  result_counts jsonb not null default '{}'::jsonb,
  avg_onset_ms numeric,
  avg_wpm numeric,
  avg_pauses numeric,
  avg_longest_pause_ms numeric,
  primary key (profile_id, session_id)
);
create index if not exists therapist_session_metrics_profile_date
  on public.therapist_session_metrics (profile_id, started_at desc);
alter table public.therapist_session_metrics enable row level security;

drop policy if exists "therapists and profile managers can read session metrics" on public.therapist_session_metrics;
create policy "therapists and profile managers can read session metrics"
  on public.therapist_session_metrics for select
  using (public.has_profile_role(profile_id, array['owner', 'caregiver', 'therapist']));

drop policy if exists "learners and profile managers can write session metrics" on public.therapist_session_metrics;
create policy "learners and profile managers can write session metrics"
  on public.therapist_session_metrics for insert
  with check (public.has_profile_role(profile_id, array['owner', 'caregiver', 'learner']));

drop policy if exists "learners and profile managers can update session metrics" on public.therapist_session_metrics;
create policy "learners and profile managers can update session metrics"
  on public.therapist_session_metrics for update
  using (public.has_profile_role(profile_id, array['owner', 'caregiver', 'learner']))
  with check (public.has_profile_role(profile_id, array['owner', 'caregiver', 'learner']));
-- No DELETE policy: deletion and retention are handled in a later lifecycle increment.
