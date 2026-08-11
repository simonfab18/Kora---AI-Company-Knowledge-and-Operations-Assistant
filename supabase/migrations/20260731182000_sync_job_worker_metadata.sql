alter table public.sync_jobs
  add column if not exists target_document_id uuid references public.documents(id) on delete set null,
  add column if not exists target_external_id text,
  add column if not exists attempt_count integer not null default 0 check (attempt_count >= 0),
  add column if not exists max_attempts integer not null default 3 check (max_attempts > 0),
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists locked_at timestamptz,
  add column if not exists correlation_id text,
  add column if not exists worker_error text;

create index if not exists sync_jobs_status_heartbeat_idx
  on public.sync_jobs (status, last_heartbeat_at, created_at);

create index if not exists sync_jobs_correlation_idx
  on public.sync_jobs (correlation_id)
  where correlation_id is not null;

revoke delete, truncate, references, trigger on public.sync_jobs from service_role;
grant select, insert, update on public.sync_jobs to service_role;
