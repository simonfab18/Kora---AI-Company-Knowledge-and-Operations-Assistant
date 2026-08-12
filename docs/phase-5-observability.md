# Phase 5 Observability

Date: 2026-07-31

## Implemented Signals

- Request ids are assigned by the FastAPI middleware and returned as `X-Request-Id`.
- Backend JSON logs include `request_id` plus task fields such as `event`, `job_id`, `organization_id`, `task_id`, `task_backend`, and `correlation_id`.
- Next.js operational logs already redact secret-like fields and now include sync enqueue/runner events.
- Backend `/ready` checks database, task backend, worker secret, and internal Next URL configuration.
- Backend `/metrics` returns sync job counts for the last 24 hours.
- Cloud Tasks dispatches production sync jobs to the protected internal runner. Local development uses a short-lived background task fallback.

## Hosted Monitoring

`SENTRY_DSN` is included in environment validation as the hosted exception-monitoring hook. It is not configured until a hosted monitoring project exists. No document content, prompts, tokens, cookies, passwords, or OAuth secrets should be sent to monitoring by default.

## Recommended Alerts

Configure hosted alerts for:

- Elevated backend or Next.js exception rate
- Sync jobs stuck in `running` without heartbeat
- Task enqueue failures
- Cloud Tasks readiness failures
- Database readiness failures
- AI quota pressure or rate-limit blocks

## Metrics To Watch

- Sync jobs by status
- Cloud Tasks queue health
- Sync duration and failure rate
- Ask AI latency and provider failures
- Retrieval confidence and low-confidence answers
- Rate-limit blocks by action family
