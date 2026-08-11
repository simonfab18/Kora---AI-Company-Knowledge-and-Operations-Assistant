from redis.asyncio import Redis

from app.core.config import Settings
from app.db import check_database


async def check_redis(settings: Settings) -> dict[str, object]:
    client = Redis.from_url(settings.redis_url, socket_connect_timeout=3, socket_timeout=3)
    try:
        await client.ping()
    except Exception as exc:  # noqa: BLE001 - readiness must map provider errors safely.
        return {"status": "error", "ok": False, "detail": exc.__class__.__name__}
    finally:
        await client.aclose()

    return {"status": "ok", "ok": True}


def configuration_check(configured: bool) -> dict[str, object]:
    return {
        "ok": configured,
        "status": "ok" if configured else "missing_configuration",
    }


async def collect_readiness(settings: Settings) -> dict[str, object]:
    database = await check_database(settings)
    redis = await check_redis(settings)
    dependencies = {
        "database": database,
        "redis": redis,
        "worker_secret": configuration_check(bool(settings.kora_internal_worker_secret)),
        "next_internal_base_url": configuration_check(bool(settings.next_internal_base_url)),
    }
    is_ready = all(bool(item["ok"]) for item in dependencies.values())
    return {
        "status": "ready" if is_ready else "degraded",
        "dependencies": dependencies,
    }
