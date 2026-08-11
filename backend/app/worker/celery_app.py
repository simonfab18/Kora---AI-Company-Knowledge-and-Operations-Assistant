from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "kora_worker",
    broker=settings.broker_url,
    backend=settings.result_backend,
    include=["app.worker.tasks"],
)
celery_app.conf.update(
    task_always_eager=settings.celery_task_always_eager,
    task_ignore_result=False,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    broker_connection_retry_on_startup=True,
    task_time_limit=60,
    task_soft_time_limit=45,
)

