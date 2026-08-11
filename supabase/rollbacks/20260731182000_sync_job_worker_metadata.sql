alter table public.sync_jobs
  drop column if exists worker_error,
  drop column if exists correlation_id,
  drop column if exists locked_at,
  drop column if exists last_heartbeat_at,
  drop column if exists max_attempts,
  drop column if exists attempt_count,
  drop column if exists target_external_id,
  drop column if exists target_document_id;
