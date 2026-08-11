from __future__ import annotations

import asyncio
import logging
from typing import Any, cast

import httpx
from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded

from app.core.config import get_settings
from app.db_connection import connect_database
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


class NonRetryableSyncJobError(Exception):
    """Raised when the internal sync runner rejects a job permanently."""


@celery_app.task(name="worker.ping")  # type: ignore[untyped-decorator]
def ping() -> dict[str, str]:
    return {"status": "ok", "service": "worker"}


async def _update_sync_job_failure(job_id: str, error_code: str, message: str) -> None:
    settings = get_settings()
    if not settings.database_url:
        return

    connection = await connect_database(settings.database_url, connect_timeout=5)
    try:
        await connection.execute(
            """
            update public.sync_jobs
            set status = 'failed',
                error_code = $2,
                error_message = $3,
                worker_error = $3,
                completed_at = now(),
                last_heartbeat_at = now()
            where id = $1::uuid
              and status in ('queued', 'running')
            """,
            job_id,
            error_code,
            message[:1000],
        )
    finally:
        await connection.close()


async def _post_internal_sync_runner(job_id: str, correlation_id: str) -> dict[str, Any]:
    settings = get_settings()
    if not settings.kora_internal_worker_secret:
        raise RuntimeError("KORA_INTERNAL_WORKER_SECRET is not configured.")

    async with httpx.AsyncClient(timeout=settings.sync_worker_http_timeout_seconds) as client:
        response = await client.post(
            f"{settings.next_internal_base_url}/api/internal/sync-jobs/run",
            headers={
                "X-Kora-Internal-Secret": settings.kora_internal_worker_secret,
                "X-Request-Id": correlation_id,
            },
            json={"jobId": job_id, "correlationId": correlation_id},
        )
        if 400 <= response.status_code < 500:
            raise NonRetryableSyncJobError(
                "Internal sync runner rejected job with "
                f"HTTP {response.status_code}: {response.text[:500]}"
            )
        response.raise_for_status()
        return cast(dict[str, Any], response.json())


@celery_app.task(
    bind=True,
    name="worker.process_notion_sync_job",
    autoretry_for=(httpx.HTTPError, RuntimeError),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=3,
    soft_time_limit=900,
    time_limit=960,
)  # type: ignore[untyped-decorator]
def process_notion_sync_job(
    self: Any,
    job_id: str,
    organization_id: str,
    requested_by: str | None,
    correlation_id: str,
) -> dict[str, Any]:
    logger.info(
        "sync_job_started",
        extra={
            "event": "sync.job_worker_started",
            "job_id": job_id,
            "organization_id": organization_id,
            "requested_by": requested_by,
            "correlation_id": correlation_id,
            "task_id": self.request.id,
            "attempt": self.request.retries + 1,
        },
    )
    try:
        result = asyncio.run(_post_internal_sync_runner(job_id, correlation_id))
    except NonRetryableSyncJobError as exc:
        asyncio.run(_update_sync_job_failure(job_id, "worker_rejected", str(exc)))
        raise
    except SoftTimeLimitExceeded:
        asyncio.run(
            _update_sync_job_failure(job_id, "worker_soft_timeout", "Sync worker timed out.")
        )
        raise
    except MaxRetriesExceededError:
        asyncio.run(
            _update_sync_job_failure(
                job_id, "worker_retries_exhausted", "Sync worker retries were exhausted."
            )
        )
        raise
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            asyncio.run(_update_sync_job_failure(job_id, "worker_failed", exc.__class__.__name__))
        raise

    logger.info(
        "sync_job_finished",
        extra={
            "event": "sync.job_worker_finished",
            "job_id": job_id,
            "organization_id": organization_id,
            "correlation_id": correlation_id,
            "task_id": self.request.id,
        },
    )
    return result


async def _recover_stale_sync_jobs(stale_minutes: int) -> int:
    settings = get_settings()
    if not settings.database_url:
        return 0

    connection = await connect_database(settings.database_url, connect_timeout=5)
    try:
        result = await connection.execute(
            """
            update public.sync_jobs
            set status = 'queued',
                locked_at = null,
                worker_error = 'Recovered after stale heartbeat.',
                last_heartbeat_at = now()
            where status = 'running'
              and coalesce(last_heartbeat_at, started_at, created_at)
                < now() - ($1::text || ' minutes')::interval
              and attempt_count < max_attempts
            """,
            str(stale_minutes),
        )
    finally:
        await connection.close()

    return int(result.rsplit(" ", 1)[-1])


@celery_app.task(name="worker.recover_stale_sync_jobs")  # type: ignore[untyped-decorator]
def recover_stale_sync_jobs(stale_minutes: int = 15) -> dict[str, int]:
    recovered = asyncio.run(_recover_stale_sync_jobs(stale_minutes))
    return {"recovered": recovered}


