import pytest

from app.core.config import Settings
from app.readiness import collect_readiness


@pytest.mark.asyncio
async def test_ready_reports_missing_database_without_crashing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = Settings(database_url=None)

    readiness = await collect_readiness(settings)

    assert readiness["status"] == "degraded"
    dependencies = readiness["dependencies"]
    assert isinstance(dependencies, dict)
    assert dependencies["database"]["status"] == "missing_configuration"
    assert dependencies["task_backend"]["status"] == "local"
