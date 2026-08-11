import base64
import hashlib
import hmac
import json
from typing import Any

from fastapi.testclient import TestClient

from app.core.authorization import OrganizationMembership
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


def auth_headers(organization_id: str = "00000000-0000-0000-0000-000000000001") -> dict[str, str]:
    token = make_token(
        {
            "sub": "00000000-0000-0000-0000-000000000010",
            "email": "user@example.com",
            "aud": "authenticated",
            "role": "authenticated",
        }
    )
    return {"Authorization": f"Bearer {token}", "X-Organization-Id": organization_id}


def configure_auth(monkeypatch: Any) -> None:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", JWT_SECRET)
    from app.core.config import get_settings

    get_settings.cache_clear()


def test_organization_membership_requires_header(monkeypatch: Any) -> None:
    configure_auth(monkeypatch)
    client = TestClient(app)
    headers = auth_headers()
    headers.pop("X-Organization-Id")

    response = client.get("/auth/organization", headers=headers)

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "X-Organization-Id header required."


def test_organization_membership_rejects_non_member(monkeypatch: Any) -> None:
    configure_auth(monkeypatch)

    async def fake_fetch_membership(
        user_id: str, organization_id: str
    ) -> OrganizationMembership | None:
        return None

    monkeypatch.setattr("app.core.authorization.fetch_membership", fake_fetch_membership)
    client = TestClient(app)

    response = client.get("/auth/organization", headers=auth_headers())

    assert response.status_code == 403
    assert response.json()["error"]["message"] == "Active organization membership required."


def test_organization_membership_rejects_disabled_member(monkeypatch: Any) -> None:
    configure_auth(monkeypatch)

    async def fake_fetch_membership(
        user_id: str, organization_id: str
    ) -> OrganizationMembership | None:
        return OrganizationMembership(
            organization_id=organization_id,
            user_id=user_id,
            role="member",
            status="disabled",
        )

    monkeypatch.setattr("app.core.authorization.fetch_membership", fake_fetch_membership)
    client = TestClient(app)

    response = client.get("/auth/organization", headers=auth_headers())

    assert response.status_code == 403
    assert response.json()["error"]["message"] == "Active organization membership required."


def test_organization_membership_allows_active_member(monkeypatch: Any) -> None:
    configure_auth(monkeypatch)

    async def fake_fetch_membership(
        user_id: str, organization_id: str
    ) -> OrganizationMembership | None:
        return OrganizationMembership(
            organization_id=organization_id,
            user_id=user_id,
            role="member",
            status="active",
        )

    monkeypatch.setattr("app.core.authorization.fetch_membership", fake_fetch_membership)
    client = TestClient(app)

    response = client.get("/auth/organization", headers=auth_headers())

    assert response.status_code == 200
    assert response.json()["role"] == "member"
    assert response.json()["status"] == "active"


def test_organization_manager_rejects_member_role(monkeypatch: Any) -> None:
    configure_auth(monkeypatch)

    async def fake_fetch_membership(
        user_id: str, organization_id: str
    ) -> OrganizationMembership | None:
        return OrganizationMembership(
            organization_id=organization_id,
            user_id=user_id,
            role="member",
            status="active",
        )

    monkeypatch.setattr("app.core.authorization.fetch_membership", fake_fetch_membership)
    client = TestClient(app)

    response = client.get("/auth/organization/manage", headers=auth_headers())

    assert response.status_code == 403
    assert response.json()["error"]["message"] == "Owner or admin role required."


def test_organization_manager_allows_admin_role(monkeypatch: Any) -> None:
    configure_auth(monkeypatch)

    async def fake_fetch_membership(
        user_id: str, organization_id: str
    ) -> OrganizationMembership | None:
        return OrganizationMembership(
            organization_id=organization_id,
            user_id=user_id,
            role="admin",
            status="active",
        )

    monkeypatch.setattr("app.core.authorization.fetch_membership", fake_fetch_membership)
    client = TestClient(app)

    response = client.get("/auth/organization/manage", headers=auth_headers())

    assert response.status_code == 200
    assert response.json()["role"] == "admin"