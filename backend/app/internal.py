from __future__ import annotations

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.task_queue import SyncTaskPayload, enqueue_sync_task

router = APIRouter(prefix="/internal", tags=["internal"])
logger = logging.getLogger(__name__)


class EnqueueSyncJobRequest(BaseModel):
    job_id: uuid.UUID
    organization_id: uuid.UUID
    requested_by: uuid.UUID | None = None
    correlation_id: str = Field(min_length=8, max_length=120)


class EnqueueSyncJobResponse(BaseModel):
    accepted: bool
    task_id: str


def require_internal_secret(secret: str | None) -> None:
    settings = get_settings()
    if not settings.kora_internal_worker_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal worker secret is not configured.",
        )
    if secret != settings.kora_internal_worker_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized.")


@router.post("/sync-jobs/enqueue", response_model=EnqueueSyncJobResponse)
def enqueue_sync_job(
    payload: EnqueueSyncJobRequest,
    x_kora_internal_secret: Annotated[str | None, Header()] = None,
) -> EnqueueSyncJobResponse:
    require_internal_secret(x_kora_internal_secret)
    settings = get_settings()
    task = enqueue_sync_task(
        settings,
        SyncTaskPayload(
            job_id=str(payload.job_id),
            organization_id=str(payload.organization_id),
            requested_by=str(payload.requested_by) if payload.requested_by else None,
            correlation_id=payload.correlation_id,
        ),
    )
    logger.info(
        "sync_job_enqueued",
        extra={
            "event": "sync.job_enqueued",
            "job_id": str(payload.job_id),
            "organization_id": str(payload.organization_id),
            "task_id": task.task_id,
            "task_backend": task.backend,
            "correlation_id": payload.correlation_id,
        },
    )
    return EnqueueSyncJobResponse(accepted=True, task_id=task.task_id)
