do $$
begin
  create type public.ai_quota_reservation_status as enum ('reserved', 'committed', 'released');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.ai_quota_reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  usage_date date not null default (timezone('utc', now()))::date,
  event_type text not null default 'chat',
  quantity integer not null default 1 check (quantity > 0),
  status public.ai_quota_reservation_status not null default 'reserved',
  provider text,
  model text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  committed_at timestamptz,
  released_at timestamptz,
  unique (organization_id, user_id, idempotency_key)
);

create index if not exists ai_quota_reservations_user_day_idx
  on public.ai_quota_reservations (user_id, usage_date, status);

create index if not exists ai_quota_reservations_day_idx
  on public.ai_quota_reservations (usage_date, status);

alter table public.ai_quota_reservations enable row level security;

revoke all on public.ai_quota_reservations from anon, authenticated;
grant select, insert, update on public.ai_quota_reservations to service_role;

drop policy if exists "Managers can read organization ai quota reservations" on public.ai_quota_reservations;
create policy "Managers can read organization ai quota reservations"
  on public.ai_quota_reservations
  for select
  to authenticated
  using (public.is_org_manager(organization_id));

create or replace function public.reserve_daily_ai_quota(
  p_organization_id uuid,
  p_user_id uuid,
  p_idempotency_key text,
  p_quantity integer default 1,
  p_user_limit integer default 20,
  p_global_limit integer default 100
)
returns table (
  allowed boolean,
  reservation_id uuid,
  reason text,
  user_used integer,
  user_limit integer,
  user_remaining integer,
  global_used integer,
  global_limit integer,
  global_remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_reset_at timestamptz := ((timezone('utc', now()))::date + interval '1 day') at time zone 'utc';
  v_quantity integer := greatest(coalesce(p_quantity, 1), 1);
  v_user_limit integer := greatest(coalesce(p_user_limit, 20), 1);
  v_global_limit integer := greatest(coalesce(p_global_limit, 100), 1);
  v_existing public.ai_quota_reservations%rowtype;
  v_user_used integer := 0;
  v_global_used integer := 0;
  v_reservation_id uuid;
  v_is_service_role boolean := coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
begin
  if auth.uid() is null and not v_is_service_role then
    raise exception 'Authentication required.';
  end if;

  if not v_is_service_role and auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Users can only reserve their own AI quota.';
  end if;

  if not v_is_service_role and auth.uid() is not null and not public.is_org_member(p_organization_id) then
    raise exception 'Organization access denied.';
  end if;

  if length(trim(coalesce(p_idempotency_key, ''))) < 12 then
    raise exception 'A stable idempotency key is required.';
  end if;

  perform pg_advisory_xact_lock(hashtext('kora_ai_quota_global'), hashtext(v_today::text));
  perform pg_advisory_xact_lock(hashtext('kora_ai_quota_user'), hashtext(p_user_id::text || ':' || v_today::text));

  select *
    into v_existing
  from public.ai_quota_reservations
  where organization_id = p_organization_id
    and user_id = p_user_id
    and idempotency_key = p_idempotency_key
  for update;

  if found then
    select coalesce(sum(quantity), 0)::integer
      into v_user_used
    from public.usage_events
    where user_id = p_user_id
      and event_type = 'chat'
      and created_at >= v_today::timestamptz
      and created_at < (v_today + 1)::timestamptz;

    select coalesce(sum(quantity), 0)::integer
      into v_global_used
    from public.usage_events
    where event_type = 'chat'
      and created_at >= v_today::timestamptz
      and created_at < (v_today + 1)::timestamptz;

    return query select
      v_existing.status <> 'released',
      v_existing.id,
      case when v_existing.status = 'released' then 'released' else null end,
      v_user_used,
      v_user_limit,
      greatest(v_user_limit - v_user_used, 0),
      v_global_used,
      v_global_limit,
      greatest(v_global_limit - v_global_used, 0),
      v_reset_at;
    return;
  end if;

  select coalesce(sum(quantity), 0)::integer
    into v_user_used
  from public.usage_events
  where user_id = p_user_id
    and event_type = 'chat'
    and created_at >= v_today::timestamptz
    and created_at < (v_today + 1)::timestamptz;

  select v_user_used + coalesce(sum(quantity), 0)::integer
    into v_user_used
  from public.ai_quota_reservations
  where user_id = p_user_id
    and usage_date = v_today
    and status = 'reserved';

  select coalesce(sum(quantity), 0)::integer
    into v_global_used
  from public.usage_events
  where event_type = 'chat'
    and created_at >= v_today::timestamptz
    and created_at < (v_today + 1)::timestamptz;

  select v_global_used + coalesce(sum(quantity), 0)::integer
    into v_global_used
  from public.ai_quota_reservations
  where usage_date = v_today
    and status = 'reserved';

  if v_user_used + v_quantity > v_user_limit then
    return query select false, null::uuid, 'user_limit', v_user_used, v_user_limit, greatest(v_user_limit - v_user_used, 0), v_global_used, v_global_limit, greatest(v_global_limit - v_global_used, 0), v_reset_at;
    return;
  end if;

  if v_global_used + v_quantity > v_global_limit then
    return query select false, null::uuid, 'global_limit', v_user_used, v_user_limit, greatest(v_user_limit - v_user_used, 0), v_global_used, v_global_limit, greatest(v_global_limit - v_global_used, 0), v_reset_at;
    return;
  end if;

  insert into public.ai_quota_reservations (organization_id, user_id, idempotency_key, usage_date, event_type, quantity)
  values (p_organization_id, p_user_id, p_idempotency_key, v_today, 'chat', v_quantity)
  returning id into v_reservation_id;

  return query select true, v_reservation_id, null::text, v_user_used + v_quantity, v_user_limit, greatest(v_user_limit - v_user_used - v_quantity, 0), v_global_used + v_quantity, v_global_limit, greatest(v_global_limit - v_global_used - v_quantity, 0), v_reset_at;
end;
$$;

create or replace function public.commit_ai_quota_reservation(
  p_reservation_id uuid,
  p_provider text default null,
  p_model text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.ai_quota_reservations%rowtype;
begin
  select *
    into v_reservation
  from public.ai_quota_reservations
  where id = p_reservation_id
  for update;

  if not found then
    return false;
  end if;

  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' and (auth.uid() is null or auth.uid() <> v_reservation.user_id) then
    raise exception 'Users can only commit their own AI quota reservation.';
  end if;

  if v_reservation.status = 'released' then
    return false;
  end if;

  if v_reservation.status = 'committed' then
    return true;
  end if;

  update public.ai_quota_reservations
  set status = 'committed',
      provider = p_provider,
      model = p_model,
      metadata = coalesce(p_metadata, '{}'::jsonb),
      committed_at = now(),
      updated_at = now()
  where id = p_reservation_id;

  insert into public.usage_events (organization_id, user_id, event_type, quantity, provider, model, metadata)
  values (
    v_reservation.organization_id,
    v_reservation.user_id,
    v_reservation.event_type,
    v_reservation.quantity,
    p_provider,
    p_model,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('ai_quota_reservation_id', p_reservation_id)
  );

  return true;
end;
$$;

create or replace function public.release_ai_quota_reservation(p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.ai_quota_reservations%rowtype;
begin
  select *
    into v_reservation
  from public.ai_quota_reservations
  where id = p_reservation_id
  for update;

  if not found then
    return false;
  end if;

  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' and (auth.uid() is null or auth.uid() <> v_reservation.user_id) then
    raise exception 'Users can only release their own AI quota reservation.';
  end if;

  if v_reservation.status = 'committed' then
    return false;
  end if;

  update public.ai_quota_reservations
  set status = 'released',
      released_at = coalesce(released_at, now()),
      updated_at = now()
  where id = p_reservation_id
    and status = 'reserved';

  return true;
end;
$$;

revoke all on function public.reserve_daily_ai_quota(uuid, uuid, text, integer, integer, integer) from public;
revoke all on function public.commit_ai_quota_reservation(uuid, text, text, jsonb) from public;
revoke all on function public.release_ai_quota_reservation(uuid) from public;

grant execute on function public.reserve_daily_ai_quota(uuid, uuid, text, integer, integer, integer) to authenticated, service_role;
grant execute on function public.commit_ai_quota_reservation(uuid, text, text, jsonb) to authenticated, service_role;
grant execute on function public.release_ai_quota_reservation(uuid) to authenticated, service_role;


