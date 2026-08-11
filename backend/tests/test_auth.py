import base64
import hashlib
import hmac
import json
import time
from typing import Any

from fastapi.testclient import TestClient

from app.main import app

JWT_SECRET = "test-jwt-secret"


def encode_part(value: dict[str, Any]) -> str:
    raw = json.dumps(value, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def make_token(payload: dict[str, Any], secret: str = JWT_SECRET) -> str:
    header = encode_part({"alg": "HS256", "typ": "JWT"})
    body = encode_part(payload)
    signature = hmac.new(secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{header}.{body}.{encoded_signature}"


def test_auth_me_requires_bearer_token() -> None:
    client = TestClient(app)

    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Bearer token required."


def test_auth_me_rejects_invalid_token_signature(monkeypatch: Any) -> None:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", JWT_SECRET)
    from app.core.config import get_settings

    get_settings.cache_clear()
    client = TestClient(app)
    token = make_token(
        {
            "sub": "user-1",
            "email": "user@example.com",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
        },
        secret="wrong-secret",
    )

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Invalid bearer token signature."
    get_settings.cache_clear()


def test_auth_me_rejects_expired_token(monkeypatch: Any) -> None:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", JWT_SECRET)
    from app.core.config import get_settings

    get_settings.cache_clear()
    client = TestClient(app)
    token = make_token(
        {
            "sub": "user-1",
            "email": "user@example.com",
            "aud": "authenticated",
            "exp": int(time.time()) - 1,
        }
    )

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Bearer token has expired."
    get_settings.cache_clear()


def test_auth_me_returns_current_user(monkeypatch: Any) -> None:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", JWT_SECRET)
    from app.core.config import get_settings

    get_settings.cache_clear()
    client = TestClient(app)
    expires_at = int(time.time()) + 3600
    token = make_token(
        {
            "sub": "user-1",
            "email": "user@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "exp": expires_at,
        }
    )

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json() == {
        "id": "user-1",
        "email": "user@example.com",
        "role": "authenticated",
        "expires_at": expires_at,
    }
    get_settings.cache_clear()