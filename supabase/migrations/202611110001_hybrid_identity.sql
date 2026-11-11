-- Hybrid identity and cloud-persistence foundation.
-- Apply in a Supabase project only after reviewing the privacy notice and obtaining
-- the appropriate consent. No client data is uploaded by this migration or by the
-- current app implementation.

create extension if not exists pgcrypto;

create table if not exists public.learner_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_members (
  profile_id uuid not null references public.learner_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'caregiver', 'therapist', 'learner')),
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);

create table if not exists public.profile_data (
  profile_id uuid primary key references public.learner_profiles(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  placement jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_sessions (
  id text primary key,
  profile_id uuid not null references public.learner_profiles(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'interrupted', 'abandoned')),
  mode text not null check (mode in ('session', 'place')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  session_state jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb
);

create index if not exists learning_sessions_profile_updated
  on public.learning_sessions (profile_id, updated_at desc);

create or replace function public.is_profile_member(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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
set search_path = public
as $$
  select exists (
    select 1 from public.profile_members m
    where m.profile_id = target_profile
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

alter table public.learner_profiles enable row level security;
alter table public.profile_members enable row level security;
alter table public.profile_data enable row level security;
alter table public.learning_sessions enable row level security;

drop policy if exists "profile members can view profiles" on public.learner_profiles;
create policy "profile members can view profiles"
  on public.learner_profiles for select
  using (public.is_profile_member(id));

drop policy if exists "signed-in users can create their own profiles" on public.learner_profiles;
create policy "signed-in users can create their own profiles"
  on public.learner_profiles for insert
  with check (auth.uid() = created_by);

drop policy if exists "profile managers can update profiles" on public.learner_profiles;
create policy "profile managers can update profiles"
  on public.learner_profiles for update
  using (public.has_profile_role(id, array['owner', 'caregiver']))
  with check (public.has_profile_role(id, array['owner', 'caregiver']));

drop policy if exists "members can view profile membership" on public.profile_members;
create policy "members can view profile membership"
  on public.profile_members for select
  using (public.is_profile_member(profile_id));

drop policy if exists "profile managers can manage membership" on public.profile_members;
create policy "profile managers can manage membership"
  on public.profile_members for all
  using (public.has_profile_role(profile_id, array['owner', 'caregiver']))
  with check (public.has_profile_role(profile_id, array['owner', 'caregiver']));

drop policy if exists "members can read profile data" on public.profile_data;
create policy "members can read profile data"
  on public.profile_data for select
  using (public.is_profile_member(profile_id));

drop policy if exists "profile managers can write profile data" on public.profile_data;
create policy "profile managers can write profile data"
  on public.profile_data for all
  using (public.has_profile_role(profile_id, array['owner', 'caregiver', 'therapist']))
  with check (public.has_profile_role(profile_id, array['owner', 'caregiver', 'therapist']));

drop policy if exists "members can read learning sessions" on public.learning_sessions;
create policy "members can read learning sessions"
  on public.learning_sessions for select
  using (public.is_profile_member(profile_id));

drop policy if exists "members can save learning sessions" on public.learning_sessions;
create policy "members can save learning sessions"
  on public.learning_sessions for insert
  with check (public.is_profile_member(profile_id));

drop policy if exists "members can update learning sessions" on public.learning_sessions;
create policy "members can update learning sessions"
  on public.learning_sessions for update
  using (public.is_profile_member(profile_id))
  with check (public.is_profile_member(profile_id));

-- Membership creation is intentionally not granted to arbitrary clients.
-- A trusted signup/invitation flow must create the owner membership and invite
-- caregivers/therapists through Supabase Auth before cloud sync is enabled.
