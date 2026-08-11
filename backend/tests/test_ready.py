import pytest

from app.core.config import Settings
from app.readiness import collect_readiness


@pytest.mark.asyncio
async def test_ready_reports_missing_database_without_crashing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_check_redis(_settings: Settings) -> dict[str, object]:
        return {"status": "ok", "ok": True}

    monkeypatch.setattr("app.readiness.check_redis", fake_check_redis)
    settings = Settings(database_url=None, redis_url="redis://localhost:6379/0")

    readiness = await collect_readiness(settings)

    assert readiness["status"] == "degraded"
    dependencies = readiness["dependencies"]
    assert isinstance(dependencies, dict)
    assert dependencies["database"]["status"] == "missing_configuration"
    assert dependencies["redis"]["status"] == "ok"
