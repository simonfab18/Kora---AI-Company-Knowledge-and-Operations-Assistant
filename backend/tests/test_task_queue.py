from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.internal import require_internal_secret
from app.main import app
from app.task_queue import SyncTaskPayload, enqueue_sync_task


def test_local_task_enqueue_returns_stable_id(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    submitted = []

    class FakeExecutor:
        def submit(self, fn, *args):  # type: ignore[no-untyped-def]
            submitted.append((fn, args))

    monkeypatch.setattr("app.task_queue._executor", FakeExecutor())
    settings = Settings(kora_internal_worker_secret="expected")
    payload = SyncTaskPayload(
        job_id="00000000-0000-0000-0000-000000000001",
        organization_id="00000000-0000-0000-0000-000000000002",
        requested_by=None,
        correlation_id="test-correlation-id",
    )

    result = enqueue_sync_task(settings, payload)

    assert result.task_id == "local-00000000-0000-0000-0000-000000000001"
    assert result.backend == "local"
    assert len(submitted) == 1


def test_cloud_tasks_requires_configuration() -> None:
    settings = Settings(
        background_task_backend="cloud_tasks",
        kora_internal_worker_secret="expected",
        gcp_project_id="flab11",
    )
    payload = SyncTaskPayload(
        job_id="00000000-0000-0000-0000-000000000001",
        organization_id="00000000-0000-0000-0000-000000000002",
        requested_by=None,
        correlation_id="test-correlation-id",
    )

    try:
        enqueue_sync_task(settings, payload)
    except RuntimeError as exc:
        assert "Cloud Tasks is not fully configured" in str(exc)
    else:
        raise AssertionError("incomplete Cloud Tasks settings were accepted")


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
