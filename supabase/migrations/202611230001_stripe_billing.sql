-- Phase 4: Stripe Subscriptions, Customer Portal & Idempotent Webhook Sync.
-- Server-only webhook deduplication + atomic entitlement updates.

alter table public.user_entitlements
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_current_period_end timestamptz;

create index if not exists user_entitlements_stripe_customer_idx
  on public.user_entitlements (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  received_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from public, anon, authenticated;

-- Idempotently applies a verified Stripe checkout/subscription event to user_entitlements.
-- Invoked strictly by service_role from the stripe-billing Edge Function after HMAC verification.
create or replace function public.sync_stripe_entitlement(
  p_event_id text,
  p_event_type text,
  p_user_id uuid default null,
  p_customer_id text default null,
  p_subscription_id text default null,
  p_status text default 'inactive',
  p_current_period_end timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := now();
  v_uid uuid := p_user_id;
  v_cust text := nullif(trim(coalesce(p_customer_id, '')), '');
  v_sub text := nullif(trim(coalesce(p_subscription_id, '')), '');
  v_status text := lower(trim(coalesce(p_status, 'inactive')));
  v_period_end timestamptz := coalesce(p_current_period_end, v_now);
  v_grant_active boolean := false;
  v_downgrade boolean := false;
begin
  if p_event_id is not null and trim(p_event_id) <> '' then
    if exists (select 1 from public.stripe_webhook_events where event_id = trim(p_event_id)) then
      return jsonb_build_object('ok', true, 'duplicate', true, 'event_id', trim(p_event_id));
    end if;
  end if;

  if v_uid is null and v_cust is not null then
    select user_id into v_uid
      from public.user_entitlements
      where stripe_customer_id = v_cust
      limit 1;
  end if;

  if v_uid is null and v_sub is not null then
    select user_id into v_uid
      from public.user_entitlements
      where stripe_subscription_id = v_sub
      limit 1;
  end if;

  if p_event_id is not null and trim(p_event_id) <> '' then
    insert into public.stripe_webhook_events (event_id, event_type, user_id, received_at)
      values (trim(p_event_id), coalesce(nullif(trim(p_event_type), ''), 'unknown'), v_uid, v_now)
      on conflict (event_id) do nothing;
  end if;

  if v_uid is null then
    return jsonb_build_object('ok', true, 'ignored', true, 'reason', 'user_not_resolved');
  end if;

  v_grant_active := (v_status in ('active', 'trialing')) and (v_period_end > v_now);
  v_downgrade := v_status in ('canceled', 'unpaid', 'incomplete_expired', 'deleted');

  if v_grant_active then
    insert into public.user_entitlements (
      user_id, tier, source, active_until, source_code_id,
      stripe_customer_id, stripe_subscription_id, stripe_subscription_status,
      stripe_current_period_end, updated_at
    ) values (
      v_uid, 'full', 'stripe', v_period_end, null,
      v_cust, v_sub, v_status, v_period_end, v_now
    )
    on conflict (user_id) do update
      set tier = 'full',
          source = 'stripe',
          active_until = greatest(coalesce(public.user_entitlements.active_until, v_now), v_period_end),
          source_code_id = case
            when public.user_entitlements.active_until is not null and public.user_entitlements.active_until > v_period_end
              then public.user_entitlements.source_code_id
            else null
          end,
          stripe_customer_id = coalesce(excluded.stripe_customer_id, public.user_entitlements.stripe_customer_id),
          stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.user_entitlements.stripe_subscription_id),
          stripe_subscription_status = excluded.stripe_subscription_status,
          stripe_current_period_end = excluded.stripe_current_period_end,
          updated_at = v_now;
  elsif v_downgrade then
    update public.user_entitlements
      set stripe_customer_id = coalesce(v_cust, stripe_customer_id),
          stripe_subscription_id = coalesce(v_sub, stripe_subscription_id),
          stripe_subscription_status = v_status,
          stripe_current_period_end = v_period_end,
          tier = case when source = 'stripe' then 'free' else tier end,
          source = case when source = 'stripe' then 'free' else source end,
          active_until = case when source = 'stripe' then least(coalesce(active_until, v_now), v_now) else active_until end,
          updated_at = v_now
      where user_id = v_uid;
  else
    insert into public.user_entitlements (
      user_id, tier, source, active_until,
      stripe_customer_id, stripe_subscription_id, stripe_subscription_status,
      stripe_current_period_end, updated_at
    ) values (
      v_uid, 'free', 'free', null,
      v_cust, v_sub, v_status, v_period_end, v_now
    )
    on conflict (user_id) do update
      set stripe_customer_id = coalesce(excluded.stripe_customer_id, public.user_entitlements.stripe_customer_id),
          stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.user_entitlements.stripe_subscription_id),
          stripe_subscription_status = excluded.stripe_subscription_status,
          stripe_current_period_end = excluded.stripe_current_period_end,
          updated_at = v_now;
  end if;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_uid,
    'status', v_status,
    'grant_active', v_grant_active
  );
end;
$$;

revoke all on function public.sync_stripe_entitlement(text, text, uuid, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.sync_stripe_entitlement(text, text, uuid, text, text, text, timestamptz) to service_role;
