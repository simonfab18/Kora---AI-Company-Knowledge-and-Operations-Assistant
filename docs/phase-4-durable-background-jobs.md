# Phase 4 Durable Background Jobs

Date: 2026-07-31

## What Changed

Notion synchronization no longer runs inside the Next.js server action. The web action now creates a durable `sync_jobs` row, enqueues a Celery task, stores the Celery task id, and returns immediately.

The Celery payload contains identifiers only:

- `job_id`
- `organization_id`
- `requested_by`
- `correlation_id`

OAuth tokens are not sent through Redis or Celery. The worker calls a protected internal Next.js endpoint, and that endpoint retrieves the encrypted Notion connection server-side before running the existing ingestion/indexing pipeline.

## Worker Flow

1. User starts sync or document re-index.
2. Next.js creates `sync_jobs` with `queued` status and a correlation id.
3. Next.js calls the backend internal enqueue endpoint.
4. Backend enqueues `worker.process_notion_sync_job` in Celery.
5. Celery calls `/api/internal/sync-jobs/run` with `X-Kora-Internal-Secret`.
6. The internal runner marks the job running, updates heartbeat/progress, syncs Notion, indexes documents, and writes completion/failure state.

## Recovery And Safety

`sync_jobs` now stores worker metadata:

- `celery_task_id`
- `attempt_count`
- `max_attempts`
- `last_heartbeat_at`
- `locked_at`
- `correlation_id`
- `worker_error`
- `target_document_id`
- `target_external_id`

A Celery recovery task, `worker.recover_stale_sync_jobs`, can move stale running jobs back to queued when the heartbeat is old and attempts remain.

## Required Environment

Set the same strong random value in both Next.js and the backend/worker:

```env
KORA_INTERNAL_WORKER_SECRET=
```

Set backend-to-Next internal URL for the worker:

```env
NEXT_INTERNAL_BASE_URL=http://localhost:3000
```

The existing backend URL is still used by Next.js to enqueue jobs:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
