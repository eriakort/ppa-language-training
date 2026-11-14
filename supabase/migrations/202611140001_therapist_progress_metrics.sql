-- Per-exercise and speech check-in aggregates for the remote "Progress and statistics" view.
-- Like therapist_session_metrics, these hold numbers only: never exercise labels, personal
-- phrases, recognised words, check-in transcripts or audio.

-- One row per exercise per session: level, how many items, accuracy and timing medians.
create table if not exists public.therapist_game_metrics (
  profile_id uuid not null,
  session_id text not null,
  game text not null check (game in ('describe', 'mystery', 'crossword', 'name', 'wordbuild', 'script', 'read', 'echo', 'seq')),
  level smallint not null check (level between 1 and 4),
  item_count smallint not null check (item_count between 1 and 100),
  accuracy numeric not null check (accuracy >= 0 and accuracy <= 1),
  avg_hints numeric check (avg_hints >= 0 and avg_hints <= 10),
  median_item_ms integer check (median_item_ms >= 0 and median_item_ms <= 600000),
  median_onset_ms integer check (median_onset_ms >= 0 and median_onset_ms <= 600000),
  median_wpm numeric check (median_wpm >= 0 and median_wpm <= 1000),
  primary key (profile_id, session_id, game),
  -- Rows live and die with their session aggregate, so retention and profile deletion apply.
  foreign key (profile_id, session_id) references public.therapist_session_metrics (profile_id, session_id) on delete cascade
);
alter table public.therapist_game_metrics enable row level security;
drop policy if exists "therapists and profile managers can read game metrics" on public.therapist_game_metrics;
create policy "therapists and profile managers can read game metrics"
  on public.therapist_game_metrics for select
  using (public.has_profile_role(profile_id, array['owner', 'caregiver', 'therapist']));

-- One row per speech check-in: scores only.
create table if not exists public.therapist_checkin_metrics (
  profile_id uuid not null references public.learner_profiles(id) on delete cascade,
  checkin_id text not null check (checkin_id ~ '^k[0-9a-z]{1,24}$'),
  started_at timestamptz not null,
  player_mode text not null check (player_mode in ('solo', 'assisted')),
  naming_correct smallint check (naming_correct between 0 and 10),
  naming_total smallint check (naming_total between 0 and 10),
  fluency_count smallint check (fluency_count between 0 and 300),
  repetition numeric check (repetition >= 0 and repetition <= 1),
  description_wpm numeric check (description_wpm >= 0 and description_wpm <= 1000),
  primary key (profile_id, checkin_id)
);
create index if not exists therapist_checkin_metrics_profile_date on public.therapist_checkin_metrics (profile_id, started_at desc);
alter table public.therapist_checkin_metrics enable row level security;
drop policy if exists "therapists and profile managers can read checkin metrics" on public.therapist_checkin_metrics;
create policy "therapists and profile managers can read checkin metrics"
  on public.therapist_checkin_metrics for select
  using (public.has_profile_role(profile_id, array['owner', 'caregiver', 'therapist']));

-- Same finite / not-in-the-future rule as session metrics, so retention can't be dodged.
drop trigger if exists therapist_checkin_timestamp_guard on public.therapist_checkin_metrics;
create trigger therapist_checkin_timestamp_guard
  before insert or update on public.therapist_checkin_metrics
  for each row execute function public.validate_therapist_metric_timestamp();

-- No client writes or deletes: reads of the approved columns only; writes go through the RPC below.
revoke all privileges on public.therapist_game_metrics from anon, authenticated;
revoke all privileges on public.therapist_checkin_metrics from anon, authenticated;
grant select (profile_id, session_id, game, level, item_count, accuracy, avg_hints, median_item_ms, median_onset_ms, median_wpm)
  on public.therapist_game_metrics to authenticated;
grant select (profile_id, checkin_id, started_at, player_mode, naming_correct, naming_total, fluency_count, repetition, description_wpm)
  on public.therapist_checkin_metrics to authenticated;
-- The statistics view joins exercises to sessions and filters by on-my-own / with-help.
grant select (session_id, player_mode) on public.therapist_session_metrics to authenticated;

-- Fixed-column writer, membership-checked per row, like upsert_therapist_session_metrics.
create or replace function public.upsert_therapist_progress_metrics(p_games jsonb, p_checkins jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  entry jsonb;
  target_profile uuid;
  v_game text; v_session text; v_level smallint; v_items smallint; v_acc numeric; v_hints numeric;
  v_item_ms integer; v_onset integer; v_wpm numeric;
  v_checkin text; v_started timestamptz; v_mode text; v_nc smallint; v_nt smallint; v_flu smallint; v_rep numeric; v_dwpm numeric;
begin
  if jsonb_typeof(coalesce(p_games, '[]'::jsonb)) is distinct from 'array'
    or jsonb_typeof(coalesce(p_checkins, '[]'::jsonb)) is distinct from 'array' then
    raise exception 'Invalid progress payload';
  end if;
  if jsonb_array_length(coalesce(p_games, '[]'::jsonb)) > 600 or jsonb_array_length(coalesce(p_checkins, '[]'::jsonb)) > 60 then
    raise exception 'Too many progress rows';
  end if;

  for entry in select value from jsonb_array_elements(coalesce(p_games, '[]'::jsonb)) as items(value)
  loop
    if jsonb_typeof(entry) is distinct from 'object' then raise exception 'Invalid game row'; end if;
    target_profile := (entry->>'profile_id')::uuid;
    if not public.has_profile_role(target_profile, array['owner', 'caregiver', 'learner']) then
      raise exception 'Not authorized to publish metrics';
    end if;
    v_session := entry->>'session_id';
    v_game := entry->>'game';
    v_level := (entry->>'level')::smallint;
    v_items := (entry->>'item_count')::smallint;
    v_acc := (entry->>'accuracy')::numeric;
    v_hints := case when jsonb_typeof(entry->'avg_hints') in ('number') then (entry->>'avg_hints')::numeric else null end;
    v_item_ms := case when jsonb_typeof(entry->'median_item_ms') in ('number') then round((entry->>'median_item_ms')::numeric)::integer else null end;
    v_onset := case when jsonb_typeof(entry->'median_onset_ms') in ('number') then round((entry->>'median_onset_ms')::numeric)::integer else null end;
    v_wpm := case when jsonb_typeof(entry->'median_wpm') in ('number') then (entry->>'median_wpm')::numeric else null end;
    if v_session is null or v_session !~ '^s[0-9a-z]{1,24}$' then raise exception 'Invalid game row'; end if;
    -- The session aggregate must already exist (and belong to this profile): enforced by the foreign key.
    insert into public.therapist_game_metrics (profile_id, session_id, game, level, item_count, accuracy, avg_hints, median_item_ms, median_onset_ms, median_wpm)
    values (target_profile, v_session, v_game, v_level, v_items, v_acc, v_hints, v_item_ms, v_onset, v_wpm)
    on conflict (profile_id, session_id, game) do update set
      level = excluded.level, item_count = excluded.item_count, accuracy = excluded.accuracy, avg_hints = excluded.avg_hints,
      median_item_ms = excluded.median_item_ms, median_onset_ms = excluded.median_onset_ms, median_wpm = excluded.median_wpm;
  end loop;

  for entry in select value from jsonb_array_elements(coalesce(p_checkins, '[]'::jsonb)) as items(value)
  loop
    if jsonb_typeof(entry) is distinct from 'object' then raise exception 'Invalid check-in row'; end if;
    target_profile := (entry->>'profile_id')::uuid;
    if not public.has_profile_role(target_profile, array['owner', 'caregiver', 'learner']) then
      raise exception 'Not authorized to publish metrics';
    end if;
    v_checkin := entry->>'checkin_id';
    v_started := (entry->>'started_at')::timestamptz;
    v_mode := entry->>'player_mode';
    v_nc := case when jsonb_typeof(entry->'naming_correct') = 'number' then (entry->>'naming_correct')::smallint else null end;
    v_nt := case when jsonb_typeof(entry->'naming_total') = 'number' then (entry->>'naming_total')::smallint else null end;
    v_flu := case when jsonb_typeof(entry->'fluency_count') = 'number' then (entry->>'fluency_count')::smallint else null end;
    v_rep := case when jsonb_typeof(entry->'repetition') = 'number' then (entry->>'repetition')::numeric else null end;
    v_dwpm := case when jsonb_typeof(entry->'description_wpm') = 'number' then (entry->>'description_wpm')::numeric else null end;
    if v_checkin is null or v_started is null or v_mode not in ('solo', 'assisted') or (v_nc is not null and v_nt is not null and v_nc > v_nt) then
      raise exception 'Invalid check-in row';
    end if;
    insert into public.therapist_checkin_metrics (profile_id, checkin_id, started_at, player_mode, naming_correct, naming_total, fluency_count, repetition, description_wpm)
    values (target_profile, v_checkin, v_started, v_mode, v_nc, v_nt, v_flu, v_rep, v_dwpm)
    on conflict (profile_id, checkin_id) do update set
      started_at = excluded.started_at, player_mode = excluded.player_mode, naming_correct = excluded.naming_correct,
      naming_total = excluded.naming_total, fluency_count = excluded.fluency_count, repetition = excluded.repetition,
      description_wpm = excluded.description_wpm;
  end loop;
end;
$$;
revoke all on function public.upsert_therapist_progress_metrics(jsonb, jsonb) from public, anon;
grant execute on function public.upsert_therapist_progress_metrics(jsonb, jsonb) to authenticated;

-- Retention: check-in aggregates follow the same per-profile retention as session metrics
-- (exercise rows are removed with their session through the foreign key).
create or replace function public.run_profile_retention_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  metrics_removed integer := 0;
  checkins_removed integer := 0;
  profiles_removed integer := 0;
  due record;
begin
  delete from public.therapist_session_metrics m
  using public.profile_retention_settings s
  where m.profile_id = s.profile_id
    and m.started_at < now() - make_interval(days => s.therapist_metrics_retention_days);
  get diagnostics metrics_removed = row_count;

  delete from public.therapist_checkin_metrics c
  using public.profile_retention_settings s
  where c.profile_id = s.profile_id
    and c.started_at < now() - make_interval(days => s.therapist_metrics_retention_days);
  get diagnostics checkins_removed = row_count;

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

  return jsonb_build_object('metrics_removed', metrics_removed, 'checkins_removed', checkins_removed, 'profiles_removed', profiles_removed);
end;
$$;
revoke all on function public.run_profile_retention_maintenance() from public, anon, authenticated;
grant execute on function public.run_profile_retention_maintenance() to service_role;
