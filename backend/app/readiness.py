from app.core.config import Settings
from app.db import check_database


def configuration_check(configured: bool) -> dict[str, object]:
    return {
        "ok": configured,
        "status": "ok" if configured else "missing_configuration",
    }


def task_backend_check(settings: Settings) -> dict[str, object]:
    if settings.background_task_backend == "local":
        return {"ok": True, "status": "local"}

    return configuration_check(
        bool(
            settings.gcp_project_id
            and settings.gcp_region
            and settings.cloud_tasks_queue
            and settings.cloud_tasks_service_account_email
        )
    )


async def collect_readiness(settings: Settings) -> dict[str, object]:
    database = await check_database(settings)
    dependencies = {
        "database": database,
        "task_backend": task_backend_check(settings),
        "worker_secret": configuration_check(bool(settings.kora_internal_worker_secret)),
        "next_internal_base_url": configuration_check(bool(settings.next_internal_base_url)),
    }
    is_ready = all(bool(item["ok"]) for item in dependencies.values())
    return {
        "status": "ready" if is_ready else "degraded",
        "dependencies": dependencies,
    }
