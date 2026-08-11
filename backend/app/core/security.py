import base64
import binascii
import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)
BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str | None
    role: str | None
    expires_at: int | None


def _decode_base64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _json_part(value: str) -> dict[str, Any]:
    decoded = json.loads(_decode_base64url(value))
    if not isinstance(decoded, dict):
        raise ValueError("JWT part must decode to an object")
    return decoded


def verify_supabase_jwt(token: str, jwt_secret: str) -> AuthenticatedUser:
    try:
        header_part, payload_part, signature_part = token.split(".")
        header = _json_part(header_part)
        payload = _json_part(payload_part)
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError, binascii.Error) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token.",
        ) from exc

    if header.get("alg") != "HS256":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsupported token algorithm.",
        )

    signed_content = f"{header_part}.{payload_part}".encode()
    expected_signature = hmac.new(jwt_secret.encode(), signed_content, hashlib.sha256).digest()
    actual_signature = _decode_base64url(signature_part)

    if not hmac.compare_digest(expected_signature, actual_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token signature.",
        )

    expires_at = payload.get("exp")
    if isinstance(expires_at, int) and expires_at < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token has expired.",
        )

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is missing a subject.",
        )

    audience = payload.get("aud")
    if audience not in (None, "authenticated"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token has an invalid audience.",
        )

    email = payload.get("email")
    role = payload.get("role")

    return AuthenticatedUser(
        id=subject,
        email=email if isinstance(email, str) else None,
        role=role if isinstance(role, str) else None,
        expires_at=expires_at if isinstance(expires_at, int) else None,
    )


async def require_current_user(credentials: BearerCredentials) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required.",
        )

    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase JWT validation is not configured.",
        )

    return verify_supabase_jwt(credentials.credentials, settings.supabase_jwt_secret)