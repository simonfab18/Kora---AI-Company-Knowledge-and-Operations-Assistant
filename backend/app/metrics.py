from __future__ import annotations

from app.core.config import Settings
from app.db_connection import connect_database


async def collect_metrics(settings: Settings) -> dict[str, object]:
    if not settings.database_url:
        return {"database_configured": False, "sync_jobs": {}}

    connection = await connect_database(settings.database_url, connect_timeout=5)
    try:
        rows = await connection.fetch(
            """
            select status, count(*)::integer as count
            from public.sync_jobs
            where created_at >= now() - interval '24 hours'
            group by status
            order by status
            """
        )
    finally:
        await connection.close()

    return {
        "database_configured": True,
        "sync_jobs": {row["status"]: row["count"] for row in rows},
    }
