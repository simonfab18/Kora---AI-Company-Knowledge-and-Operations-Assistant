from __future__ import annotations

import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Any

import httpx
from google.cloud import tasks_v2
from google.protobuf import duration_pb2

from app.core.config import Settings

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="kora-local-task")


@dataclass(frozen=True)
class SyncTaskPayload:
    job_id: str
    organization_id: str
    requested_by: str | None
    correlation_id: str


@dataclass(frozen=True)
class EnqueuedTask:
    task_id: str
    backend: str


async def run_internal_sync_job(settings: Settings, payload: SyncTaskPayload) -> dict[str, Any]:
    if not settings.kora_internal_worker_secret:
        raise RuntimeError("KORA_INTERNAL_WORKER_SECRET is not configured.")

    async with httpx.AsyncClient(timeout=settings.sync_worker_http_timeout_seconds) as client:
        response = await client.post(
            f"{settings.next_internal_base_url}/api/internal/sync-jobs/run",
            headers={
                "X-Kora-Internal-Secret": settings.kora_internal_worker_secret,
                "X-Request-Id": payload.correlation_id,
            },
            json={"jobId": payload.job_id, "correlationId": payload.correlation_id},
        )
        response.raise_for_status()
        return response.json()


def _run_local_task(settings: Settings, payload: SyncTaskPayload) -> None:
    try:
        asyncio.run(run_internal_sync_job(settings, payload))
    except Exception:
        logger.exception(
            "local_sync_task_failed",
            extra={
                "event": "sync.local_task_failed",
                "job_id": payload.job_id,
                "organization_id": payload.organization_id,
                "correlation_id": payload.correlation_id,
            },
        )


def _enqueue_local_task(settings: Settings, payload: SyncTaskPayload) -> EnqueuedTask:
    _executor.submit(_run_local_task, settings, payload)
    return EnqueuedTask(task_id=f"local-{payload.job_id}", backend="local")


def _enqueue_cloud_task(settings: Settings, payload: SyncTaskPayload) -> EnqueuedTask:
    if not settings.kora_internal_worker_secret:
        raise RuntimeError("KORA_INTERNAL_WORKER_SECRET is not configured.")
    if not (
        settings.gcp_project_id
        and settings.gcp_region
        and settings.cloud_tasks_queue
        and settings.cloud_tasks_service_account_email
    ):
        raise RuntimeError("Cloud Tasks is not fully configured.")

    client = tasks_v2.CloudTasksClient()
    parent = client.queue_path(
        settings.gcp_project_id,
        settings.gcp_region,
        settings.cloud_tasks_queue,
    )
    target_url = f"{settings.next_internal_base_url}/api/internal/sync-jobs/run"
    timeout = duration_pb2.Duration()
    timeout.FromSeconds(int(settings.sync_worker_http_timeout_seconds))

    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST,
            "url": target_url,
            "headers": {
                "Content-Type": "application/json",
                "X-Kora-Internal-Secret": settings.kora_internal_worker_secret,
                "X-Request-Id": payload.correlation_id,
            },
            "body": json.dumps(
                {"jobId": payload.job_id, "correlationId": payload.correlation_id}
            ).encode(),
            "oidc_token": {
                "service_account_email": settings.cloud_tasks_service_account_email,
                "audience": target_url,
            },
        },
        "dispatch_deadline": timeout,
    }

    created = client.create_task(request={"parent": parent, "task": task})
    return EnqueuedTask(task_id=created.name.rsplit("/", 1)[-1], backend="cloud_tasks")


def enqueue_sync_task(settings: Settings, payload: SyncTaskPayload) -> EnqueuedTask:
    if settings.background_task_backend == "cloud_tasks":
        return _enqueue_cloud_task(settings, payload)
    return _enqueue_local_task(settings, payload)
