-- Emergency rollback for service-role quota table privileges.
-- This restores the broader default privileges that existed immediately after the
-- atomic quota table was created. Prefer keeping the tightened grant set unless
-- a verified production issue requires rollback.
grant select, insert, update, delete, truncate, references, trigger on public.ai_quota_reservations to service_role;
