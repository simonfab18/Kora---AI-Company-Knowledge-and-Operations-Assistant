-- Emergency rollback restores the broader historical sync job grants.
-- Prefer keeping sync job writes server-only through the queued worker flow.
grant select, insert, update on public.sync_jobs to authenticated;
grant select, insert, update, delete, truncate, references, trigger on public.sync_jobs to service_role;
