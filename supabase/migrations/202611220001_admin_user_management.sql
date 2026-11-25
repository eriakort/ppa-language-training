-- Admin User & Role Management (App GUI + direct Supabase SQL Editor support).
-- Adds 'admin' manual-grant source on user_entitlements, tracks who granted
-- access_admins rows, and exposes service-role-only SECURITY DEFINER RPCs for
-- listing users, promoting/demoting admins, and granting/revoking user access.

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.user_entitlements'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~ '\msource\M'
  loop
    execute format('alter table public.user_entitlements drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.user_entitlements
  add constraint user_entitlements_source_check
  check (source in ('free', 'code', 'stripe', 'admin'));

alter table public.access_admins
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create or replace function public.admin_list_users(
  p_search text default null,
  p_limit integer default 200
) returns table (
  user_id uuid,
  email text,
  display_name text,
  email_confirmed boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  tier text,
  source text,
  active_until timestamptz,
  is_db_admin boolean,
  admin_note text,
  admin_since timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_q text := trim(coalesce(p_search, ''));
  v_esc text;
  v_lim integer := greatest(1, least(coalesce(p_limit, 200), 500));
begin
  if v_q <> '' then
    v_esc := replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_');
    v_esc := '%' || v_esc || '%';
  end if;

  return query
  select
    u.id as user_id,
    coalesce(u.email, '')::text as email,
    coalesce(u.raw_user_meta_data ->> 'display_name', '')::text as display_name,
    (u.email_confirmed_at is not null) as email_confirmed,
    u.created_at,
    u.last_sign_in_at,
    coalesce(e.tier, 'free')::text as tier,
    coalesce(e.source, 'free')::text as source,
    e.active_until,
    (a.user_id is not null) as is_db_admin,
    coalesce(a.note, '')::text as admin_note,
    a.created_at as admin_since
  from auth.users u
  left join public.user_entitlements e on e.user_id = u.id
  left join public.access_admins a on a.user_id = u.id
  where v_q = ''
     or coalesce(u.email, '') ilike v_esc escape '\'
     or coalesce(u.raw_user_meta_data ->> 'display_name', '') ilike v_esc escape '\'
     or coalesce(a.note, '') ilike v_esc escape '\'
  order by (a.user_id is not null) desc, u.created_at desc
  limit v_lim;
end;
$$;

create or replace function public.admin_set_user_role(
  p_target_user_id uuid default null,
  p_email text default null,
  p_is_admin boolean default false,
  p_note text default '',
  p_actor_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid;
  v_email text;
  v_confirmed timestamptz;
  v_note text := left(trim(coalesce(p_note, '')), 200);
begin
  select id, email, email_confirmed_at
    into v_uid, v_email, v_confirmed
    from auth.users
    where (p_target_user_id is not null and id = p_target_user_id)
       or (p_target_user_id is null and p_email is not null and lower(email) = lower(trim(p_email)))
    limit 1;

  if not found then
    raise exception 'user_not_found';
  end if;

  if not p_is_admin and p_actor_id is not null and p_actor_id = v_uid then
    raise exception 'cannot_demote_self';
  end if;

  if p_is_admin then
    if v_confirmed is null then
      raise exception 'email_not_confirmed';
    end if;
    insert into public.access_admins (user_id, note, created_by)
      values (v_uid, v_note, p_actor_id)
      on conflict (user_id) do update
        set note = case when excluded.note <> '' then excluded.note else public.access_admins.note end,
            created_by = coalesce(public.access_admins.created_by, excluded.created_by);
  else
    delete from public.access_admins where user_id = v_uid;
  end if;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_uid,
    'email', v_email,
    'is_db_admin', p_is_admin
  );
end;
$$;

create or replace function public.admin_set_user_entitlement(
  p_target_user_id uuid default null,
  p_email text default null,
  p_tier text default 'free',
  p_duration_days integer default 30
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid;
  v_email text;
  v_now timestamptz := now();
  v_until timestamptz := null;
  v_source text := 'free';
begin
  if p_tier not in ('free', 'full') then
    raise exception 'invalid_tier';
  end if;

  if p_tier = 'full' and (p_duration_days is null or p_duration_days < 1 or p_duration_days > 3650) then
    raise exception 'invalid_duration';
  end if;

  select id, email
    into v_uid, v_email
    from auth.users
    where (p_target_user_id is not null and id = p_target_user_id)
       or (p_target_user_id is null and p_email is not null and lower(email) = lower(trim(p_email)))
    limit 1;

  if not found then
    raise exception 'user_not_found';
  end if;

  if p_tier = 'full' then
    v_until := v_now + make_interval(days => p_duration_days);
    v_source := 'admin';
  else
    v_until := v_now;
    v_source := 'free';
  end if;

  insert into public.user_entitlements (user_id, tier, source, active_until, source_code_id, updated_at)
    values (v_uid, p_tier, v_source, v_until, null, v_now)
    on conflict (user_id) do update
      set tier = excluded.tier,
          source = excluded.source,
          active_until = excluded.active_until,
          source_code_id = null,
          updated_at = v_now;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_uid,
    'email', v_email,
    'tier', p_tier,
    'source', v_source,
    'active_until', v_until
  );
end;
$$;

revoke all on function public.admin_list_users(text, integer) from public, anon, authenticated;
grant execute on function public.admin_list_users(text, integer) to service_role;

revoke all on function public.admin_set_user_role(uuid, text, boolean, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_user_role(uuid, text, boolean, text, uuid) to service_role;

revoke all on function public.admin_set_user_entitlement(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.admin_set_user_entitlement(uuid, text, text, integer) to service_role;
