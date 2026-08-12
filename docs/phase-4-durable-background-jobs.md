# Phase 4 Durable Background Jobs

Date: 2026-07-31
Updated: 2026-08-12

## What Changed

Notion synchronization no longer runs inside the initial Next.js server action. The web action creates a durable `sync_jobs` row, asks the FastAPI backend to enqueue the job, stores the returned task id, and returns immediately.

The production queue is Google Cloud Tasks. Local development uses a lightweight in-process background task fallback so Docker does not need Redis or a long-running worker.

The task payload contains identifiers only:

- `job_id`
- `organization_id`
- `requested_by`
- `correlation_id`

OAuth tokens are not sent through the task queue. The task calls a protected internal Next.js endpoint, and that endpoint retrieves the encrypted Notion connection server-side before running the existing ingestion/indexing pipeline.

## Worker Flow

1. User starts sync or document re-index.
2. Next.js creates `sync_jobs` with `queued` status and a correlation id.
3. Next.js calls the backend internal enqueue endpoint.
4. In production, FastAPI enqueues a Google Cloud Task.
5. Cloud Tasks calls `/api/internal/sync-jobs/run` with `X-Kora-Internal-Secret`.
6. The internal runner marks the job running, updates heartbeat/progress, syncs Notion, indexes documents, and writes completion/failure state.

## Local Development

Set:

```env
BACKGROUND_TASK_BACKEND=local
```

The backend starts a short-lived local background task that calls the same protected internal sync runner. This is enough for localhost testing and avoids a Redis/Celery dependency.

## Production Environment

Set the same strong random value in both Next.js and the backend:

```env
KORA_INTERNAL_WORKER_SECRET=
```

Set backend-to-Next internal URL:

```env
NEXT_INTERNAL_BASE_URL=https://your-production-domain.example
```

Set backend-to-Cloud Tasks configuration:

```env
BACKGROUND_TASK_BACKEND=cloud_tasks
GCP_PROJECT_ID=
GCP_REGION=
CLOUD_TASKS_QUEUE=
CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL=
```

The existing backend URL is still used by Next.js to enqueue jobs:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-cloud-run-api.example
```

## Recovery And Safety

`sync_jobs` stores worker metadata:

- `celery_task_id`
- `attempt_count`
- `max_attempts`
- `last_heartbeat_at`
- `locked_at`
- `correlation_id`
- `worker_error`
- `target_document_id`
- `target_external_id`

The historical column name `celery_task_id` is retained for compatibility, but new values can represent Cloud Tasks task ids or local task ids.

Retries are handled by Cloud Tasks in production and by explicit job retry actions in the app. Stale running-job recovery remains a follow-up for scheduled maintenance.
