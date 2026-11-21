-- Phase 1: Access codes, redemptions tracking, and user entitlements.
-- Supports single-use and group-use access codes with configurable duration,
-- optional cohort expiry, revocation, and atomic transaction-safe redemption.
-- Client writes are strictly forbidden; mutations occur only through trusted
-- SECURITY DEFINER functions invoked by the access-codes Edge Function.

create table if not exists public.access_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{6,32}$'),
  code_type text not null check (code_type in ('single', 'group')),
  max_uses integer check (max_uses is null or max_uses > 0),
  constraint access_codes_type_cap_chk check (
    (code_type = 'single' and max_uses = 1) or
    (code_type = 'group' and (max_uses is null or max_uses > 1))
  ),
  used_count integer not null default 0 check (used_count >= 0),
  duration_days integer not null check (duration_days between 1 and 3650),
  redeem_by timestamptz,
  fixed_expires_at timestamptz,
  scope text not null default 'full_app' check (scope in ('full_app')),
  recipient_note text not null default '' check (char_length(recipient_note) <= 200),
  revoked boolean not null default false,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists access_codes_created_idx
  on public.access_codes (created_at desc);

create table if not exists public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.access_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  redeemed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (code_id, user_id)
);

create index if not exists code_redemptions_code_idx
  on public.code_redemptions (code_id, redeemed_at desc);

create index if not exists code_redemptions_user_idx
  on public.code_redemptions (user_id, redeemed_at desc);

create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'full')),
  source text not null default 'free' check (source in ('free', 'code', 'stripe')),
  active_until timestamptz,
  source_code_id uuid references public.access_codes(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_status text,
  updated_at timestamptz not null default now()
);

alter table public.access_admins enable row level security;
alter table public.access_codes enable row level security;
alter table public.code_redemptions enable row level security;
alter table public.user_entitlements enable row level security;

revoke all on public.access_admins from public, anon, authenticated;
revoke all on public.access_codes from public, anon, authenticated;
revoke all on public.code_redemptions from public, anon, authenticated;
revoke all on public.user_entitlements from public, anon, authenticated;

grant select on public.code_redemptions to authenticated;
grant select on public.user_entitlements to authenticated;

drop policy if exists "users view own code redemptions" on public.code_redemptions;
create policy "users view own code redemptions"
  on public.code_redemptions for select
  using (user_id = auth.uid());

drop policy if exists "users view own entitlement" on public.user_entitlements;
create policy "users view own entitlement"
  on public.user_entitlements for select
  using (user_id = auth.uid());

-- Atomically validates and redeems a single-user or group-user access code.
-- Uses FOR UPDATE on the code row to guarantee seat limits cannot be exceeded
-- under concurrent redemptions, and prevents repeat redemption by the same user.
create or replace function public.redeem_access_code(
  p_user_id uuid,
  p_code text,
  p_user_email text default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_code text;
  v_row public.access_codes%rowtype;
  v_actual_uses integer := 0;
  v_now timestamptz := now();
  v_expires timestamptz;
  v_active_until timestamptz;
begin
  if p_user_id is null then
    raise exception 'sign_in_required';
  end if;

  v_code := upper(trim(coalesce(p_code, '')));
  if v_code = '' or v_code !~ '^[A-Z0-9-]{6,32}$' then
    raise exception 'invalid_code';
  end if;

  select * into v_row
    from public.access_codes
    where code = v_code
    for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  if v_row.revoked then
    raise exception 'code_revoked';
  end if;

  if v_row.redeem_by is not null and v_row.redeem_by <= v_now then
    raise exception 'code_expired';
  end if;

  if v_row.fixed_expires_at is not null and v_row.fixed_expires_at <= v_now then
    raise exception 'code_expired';
  end if;

  if exists (
    select 1 from public.code_redemptions
    where code_id = v_row.id and user_id = p_user_id
  ) then
    raise exception 'already_redeemed';
  end if;

  select count(*) into v_actual_uses
    from public.code_redemptions
    where code_id = v_row.id;

  if v_row.max_uses is not null and greatest(v_row.used_count, v_actual_uses) >= v_row.max_uses then
    raise exception 'code_exhausted';
  end if;

  v_expires := v_now + make_interval(days => v_row.duration_days);
  if v_row.fixed_expires_at is not null and v_row.fixed_expires_at < v_expires then
    v_expires := v_row.fixed_expires_at;
  end if;

  insert into public.code_redemptions (code_id, user_id, user_email, redeemed_at, expires_at)
    values (v_row.id, p_user_id, nullif(trim(coalesce(p_user_email, '')), ''), v_now, v_expires);

  update public.access_codes
    set used_count = greatest(used_count, v_actual_uses) + 1
    where id = v_row.id;

  insert into public.user_entitlements (user_id, tier, source, active_until, source_code_id, updated_at)
    values (p_user_id, 'full', 'code', v_expires, v_row.id, v_now)
    on conflict (user_id) do update
      set tier = 'full',
          source = case
            when user_entitlements.source = 'stripe' and user_entitlements.active_until > v_expires then 'stripe'
            else 'code'
          end,
          active_until = greatest(coalesce(user_entitlements.active_until, v_now), v_expires),
          source_code_id = case
            when user_entitlements.active_until is not null and user_entitlements.active_until > v_expires then user_entitlements.source_code_id
            else v_row.id
          end,
          updated_at = v_now
    returning active_until into v_active_until;

  return jsonb_build_object(
    'ok', true,
    'code', v_row.code,
    'code_type', v_row.code_type,
    'scope', v_row.scope,
    'tier', 'full',
    'expires_at', v_expires,
    'active_until', v_active_until
  );
end;
$$;

-- Allows admins (via service-role Edge Function) to deactivate a code and
-- optionally revoke active entitlements granted by that code.
create or replace function public.revoke_access_code_grant(
  p_code_id uuid,
  p_revoke_active_grants boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := now();
  v_downgraded integer := 0;
begin
  perform id from public.access_codes
    where id = p_code_id
    for update;

  if not found then
    raise exception 'code_not_found';
  end if;

  update public.access_codes
    set revoked = true,
        revoked_at = coalesce(revoked_at, v_now)
    where id = p_code_id;

  if p_revoke_active_grants then
    update public.user_entitlements
      set tier = 'free',
          source = 'free',
          active_until = v_now,
          updated_at = v_now
      where source_code_id = p_code_id
        and source = 'code';
    get diagnostics v_downgraded = row_count;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code_id', p_code_id,
    'revoked_active', v_downgraded
  );
end;
$$;

-- Read-only helper returning server-authoritative entitlement status for the signed-in user.
create or replace function public.get_my_entitlement()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_row public.user_entitlements%rowtype;
  v_is_full boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('tier', 'free', 'source', 'free', 'active_until', null, 'server_now', v_now);
  end if;

  select * into v_row
    from public.user_entitlements
    where user_id = v_uid;

  if found and v_row.tier = 'full' and v_row.active_until is not null and v_row.active_until > v_now then
    v_is_full := true;
  end if;

  return jsonb_build_object(
    'tier', case when v_is_full then 'full' else 'free' end,
    'source', case when v_is_full then v_row.source else 'free' end,
    'active_until', v_row.active_until,
    'server_now', v_now
  );
end;
$$;

revoke all on function public.redeem_access_code(uuid, text, text) from public, anon, authenticated;
grant execute on function public.redeem_access_code(uuid, text, text) to service_role;

revoke all on function public.revoke_access_code_grant(uuid, boolean) from public, anon, authenticated;
grant execute on function public.revoke_access_code_grant(uuid, boolean) to service_role;

revoke all on function public.get_my_entitlement() from public, anon;
grant execute on function public.get_my_entitlement() to authenticated;
