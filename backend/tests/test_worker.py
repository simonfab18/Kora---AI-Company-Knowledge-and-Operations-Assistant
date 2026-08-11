from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.internal import require_internal_secret
from app.main import app
from app.worker.tasks import ping, recover_stale_sync_jobs


def test_celery_ping_task_executes_eagerly(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setitem(ping.app.conf, "task_always_eager", True)

    result = ping.delay()

    assert result.get(timeout=5) == {"status": "ok", "service": "worker"}


def test_recover_stale_sync_jobs_noops_without_database(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setitem(recover_stale_sync_jobs.app.conf, "task_always_eager", True)
    monkeypatch.setenv("DATABASE_URL", "")
    get_settings.cache_clear()

    result = recover_stale_sync_jobs.delay()

    assert result.get(timeout=5) == {"recovered": 0}
    get_settings.cache_clear()


def test_internal_secret_rejects_invalid_secret(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv("KORA_INTERNAL_WORKER_SECRET", "expected")
    get_settings.cache_clear()

    try:
        require_internal_secret("wrong")
    except Exception as exc:  # noqa: BLE001 - assert FastAPI exception mapping.
        assert exc.status_code == 401  # type: ignore[attr-defined]
    else:
        raise AssertionError("invalid secret was accepted")
    finally:
        get_settings.cache_clear()


def test_internal_enqueue_endpoint_requires_secret(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv("KORA_INTERNAL_WORKER_SECRET", "expected")
    get_settings.cache_clear()
    client = TestClient(app)

    response = client.post(
        "/internal/sync-jobs/enqueue",
        json={
            "job_id": "00000000-0000-0000-0000-000000000001",
            "organization_id": "00000000-0000-0000-0000-000000000002",
            "requested_by": None,
            "correlation_id": "test-correlation-id",
        },
    )

    assert response.status_code == 401
    get_settings.cache_clear()

