create schema if not exists private;

alter function public.reserve_daily_ai_quota(uuid, uuid, text, integer, integer, integer) set schema private;
alter function public.commit_ai_quota_reservation(uuid, text, text, jsonb) set schema private;
alter function public.release_ai_quota_reservation(uuid) set schema private;

revoke all on function private.reserve_daily_ai_quota(uuid, uuid, text, integer, integer, integer) from public;
revoke all on function private.commit_ai_quota_reservation(uuid, text, text, jsonb) from public;
revoke all on function private.release_ai_quota_reservation(uuid) from public;

grant execute on function private.reserve_daily_ai_quota(uuid, uuid, text, integer, integer, integer) to authenticated, service_role;
grant execute on function private.commit_ai_quota_reservation(uuid, text, text, jsonb) to authenticated, service_role;
grant execute on function private.release_ai_quota_reservation(uuid) to authenticated, service_role;

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
language sql
security invoker
set search_path = ''
as $$
  select * from private.reserve_daily_ai_quota(
    p_organization_id,
    p_user_id,
    p_idempotency_key,
    p_quantity,
    p_user_limit,
    p_global_limit
  );
$$;

create or replace function public.commit_ai_quota_reservation(
  p_reservation_id uuid,
  p_provider text default null,
  p_model text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.commit_ai_quota_reservation(p_reservation_id, p_provider, p_model, p_metadata);
$$;

create or replace function public.release_ai_quota_reservation(p_reservation_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.release_ai_quota_reservation(p_reservation_id);
$$;

revoke all on function public.reserve_daily_ai_quota(uuid, uuid, text, integer, integer, integer) from public;
revoke all on function public.commit_ai_quota_reservation(uuid, text, text, jsonb) from public;
revoke all on function public.release_ai_quota_reservation(uuid) from public;

grant execute on function public.reserve_daily_ai_quota(uuid, uuid, text, integer, integer, integer) to authenticated, service_role;
grant execute on function public.commit_ai_quota_reservation(uuid, text, text, jsonb) to authenticated, service_role;
grant execute on function public.release_ai_quota_reservation(uuid) to authenticated, service_role;
