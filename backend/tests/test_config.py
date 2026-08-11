import pytest

from app.core.config import Settings


def test_settings_parse_comma_separated_cors_origins(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(
        "API_CORS_ORIGINS",
        "http://localhost:3000,https://example.com",
    )

    settings = Settings()

    assert settings.api_cors_origins == [
        "http://localhost:3000",
        "https://example.com",
    ]

def test_settings_ignore_empty_optional_env_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("SUPABASE_URL", "")

    settings = Settings()

    assert settings.supabase_url is None
