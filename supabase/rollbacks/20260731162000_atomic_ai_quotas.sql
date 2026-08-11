drop function if exists public.release_ai_quota_reservation(uuid);
drop function if exists public.commit_ai_quota_reservation(uuid, text, text, jsonb);
drop function if exists public.reserve_daily_ai_quota(uuid, uuid, text, integer, integer, integer);
drop policy if exists "Managers can read organization ai quota reservations" on public.ai_quota_reservations;
drop table if exists public.ai_quota_reservations;
drop type if exists public.ai_quota_reservation_status;
