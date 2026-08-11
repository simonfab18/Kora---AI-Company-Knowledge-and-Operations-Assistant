revoke all on public.sync_jobs from anon;
revoke insert, update, delete, truncate, references, trigger on public.sync_jobs from authenticated;
revoke delete, truncate, references, trigger on public.sync_jobs from service_role;
grant select on public.sync_jobs to authenticated;
grant select, insert, update on public.sync_jobs to service_role;
