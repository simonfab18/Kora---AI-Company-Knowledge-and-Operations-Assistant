from app.core.config import Settings
from app.db_connection import connect_database


async def check_database(settings: Settings) -> dict[str, object]:
    if not settings.database_url:
        return {
            "status": "missing_configuration",
            "ok": False,
            "detail": "DATABASE_URL is not configured.",
        }

    try:
        connection = await connect_database(settings.database_url, connect_timeout=3)
        try:
            await connection.execute("select 1")
        finally:
            await connection.close()
    except Exception as exc:  # noqa: BLE001 - readiness must map provider errors safely.
        return {"status": "error", "ok": False, "detail": exc.__class__.__name__}

    return {"status": "ok", "ok": True}
