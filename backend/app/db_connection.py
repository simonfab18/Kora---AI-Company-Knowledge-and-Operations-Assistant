import asyncpg  # type: ignore[import-untyped]


async def connect_database(database_url: str, connect_timeout: float = 5) -> asyncpg.Connection:
    """Open an asyncpg connection compatible with Supabase transaction pooler."""

    return await asyncpg.connect(
        database_url,
        timeout=connect_timeout,
        statement_cache_size=0,
    )