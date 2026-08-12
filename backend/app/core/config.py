from functools import lru_cache
from typing import Annotated, Literal

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
    )

    app_env: Literal["development", "test", "production"] = "development"
    log_level: str = "INFO"
    api_cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )
    database_url: str | None = None
    supabase_url: AnyHttpUrl | None = None
    supabase_publishable_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None
    next_internal_base_url: str = "http://localhost:3000"
    kora_internal_worker_secret: str | None = None
    sentry_dsn: str | None = None
    sync_worker_http_timeout_seconds: float = 30.0
    background_task_backend: Literal["local", "cloud_tasks"] = "local"
    gcp_project_id: str | None = None
    gcp_region: str | None = None
    cloud_tasks_queue: str | None = None
    cloud_tasks_service_account_email: str | None = None

    @field_validator("api_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, list):
            return [str(origin) for origin in value]
        return ["http://localhost:3000"]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()



