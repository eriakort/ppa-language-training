-- RLS limits rows, not columns. Revoke direct writes and table-level reads so
-- authenticated users can only read the fields shown by the therapist UI.
revoke all privileges on public.therapist_session_metrics from anon, authenticated;
grant select (
  profile_id,
  started_at,
  mode,
  item_count,
  spoken_count,
  avg_onset_ms,
  avg_wpm,
  avg_pauses,
  avg_longest_pause_ms
) on public.therapist_session_metrics to authenticated;

-- Browser writers use this fixed-column RPC. It checks each profile membership
-- before writing and never accepts or stores client-supplied JSON fields.
create or replace function public.upsert_therapist_session_metrics(p_metrics jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  entry jsonb;
  target_profile uuid;
  target_session text;
  target_started_at timestamptz;
  target_mode text;
  target_player_mode text;
  target_item_count integer;
  target_spoken_count integer;
  target_avg_onset_ms numeric;
  target_avg_wpm numeric;
  target_avg_pauses numeric;
  target_avg_longest_pause_ms numeric;
begin
  if jsonb_typeof(p_metrics) is distinct from 'array' then
    raise exception 'Invalid metrics payload';
  end if;
  if jsonb_array_length(p_metrics) > 60 then
    raise exception 'Too many metric rows';
  end if;

  for entry in select value from jsonb_array_elements(p_metrics) as items(value)
  loop
    if jsonb_typeof(entry) is distinct from 'object' then
      raise exception 'Invalid metrics row';
    end if;

    target_profile := (entry->>'profile_id')::uuid;
    if not public.has_profile_role(target_profile, array['owner', 'caregiver', 'learner']) then
      raise exception 'Not authorized to publish metrics';
    end if;

    target_session := entry->>'session_id';
    target_started_at := (entry->>'started_at')::timestamptz;
    target_mode := entry->>'mode';
    target_player_mode := entry->>'player_mode';
    target_item_count := (entry->>'item_count')::integer;
    target_spoken_count := (entry->>'spoken_count')::integer;
    target_avg_onset_ms := case when jsonb_typeof(entry->'avg_onset_ms') = 'null' then null else (entry->>'avg_onset_ms')::numeric end;
    target_avg_wpm := case when jsonb_typeof(entry->'avg_wpm') = 'null' then null else (entry->>'avg_wpm')::numeric end;
    target_avg_pauses := case when jsonb_typeof(entry->'avg_pauses') = 'null' then null else (entry->>'avg_pauses')::numeric end;
    target_avg_longest_pause_ms := case when jsonb_typeof(entry->'avg_longest_pause_ms') = 'null' then null else (entry->>'avg_longest_pause_ms')::numeric end;

    if target_session is null or target_session !~ '^[sp][0-9a-z]{1,24}$'
      or target_started_at is null
      or target_mode not in ('session', 'place')
      or target_player_mode not in ('solo', 'assisted')
      or target_item_count < 0 or target_spoken_count < 0 or target_spoken_count > target_item_count
      or target_avg_onset_ms < 0 or target_avg_onset_ms > 600000
      or target_avg_wpm < 0 or target_avg_wpm > 1000
      or target_avg_pauses < 0 or target_avg_pauses > 1000
      or target_avg_longest_pause_ms < 0 or target_avg_longest_pause_ms > 600000 then
      raise exception 'Invalid metrics row';
    end if;

    insert into public.therapist_session_metrics (
      profile_id, session_id, started_at, mode, player_mode, item_count,
      spoken_count, avg_onset_ms, avg_wpm, avg_pauses, avg_longest_pause_ms
    ) values (
      target_profile, target_session, target_started_at, target_mode, target_player_mode,
      target_item_count, target_spoken_count, target_avg_onset_ms, target_avg_wpm,
      target_avg_pauses, target_avg_longest_pause_ms
    )
    on conflict (profile_id, session_id) do update set
      started_at = excluded.started_at,
      mode = excluded.mode,
      player_mode = excluded.player_mode,
      item_count = excluded.item_count,
      spoken_count = excluded.spoken_count,
      avg_onset_ms = excluded.avg_onset_ms,
      avg_wpm = excluded.avg_wpm,
      avg_pauses = excluded.avg_pauses,
      avg_longest_pause_ms = excluded.avg_longest_pause_ms;
  end loop;
end;
$$;

revoke all on function public.upsert_therapist_session_metrics(jsonb) from public, anon;
grant execute on function public.upsert_therapist_session_metrics(jsonb) to authenticated;
