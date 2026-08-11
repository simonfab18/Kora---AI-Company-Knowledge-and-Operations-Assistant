from dataclasses import dataclass
from typing import Annotated, Literal, cast

import asyncpg  # type: ignore[import-untyped]
from fastapi import Depends, Header, HTTPException, status

from app.core.config import get_settings
from app.core.security import AuthenticatedUser, require_current_user
from app.db_connection import connect_database

OrganizationRole = Literal["owner", "admin", "member"]


@dataclass(frozen=True)
class OrganizationMembership:
    organization_id: str
    user_id: str
    role: OrganizationRole
    status: str


async def fetch_membership(user_id: str, organization_id: str) -> OrganizationMembership | None:
    settings = get_settings()

    if not settings.database_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database access is not configured.",
        )

    connection = await connect_database(settings.database_url, connect_timeout=3)
    try:
        row = await connection.fetchrow(
            """
            select organization_id::text as organization_id, user_id::text as user_id, role, status
            from public.organization_members
            where organization_id = $1::uuid and user_id = $2::uuid
            limit 1
            """,
            organization_id,
            user_id,
        )
    finally:
        await connection.close()

    if row is None:
        return None

    role = cast(str, row["role"])
    if role not in ("owner", "admin", "member"):
        return None

    return OrganizationMembership(
        organization_id=cast(str, row["organization_id"]),
        user_id=cast(str, row["user_id"]),
        role=cast(OrganizationRole, role),
        status=cast(str, row["status"]),
    )


async def require_organization_member(
    user: Annotated[AuthenticatedUser, Depends(require_current_user)],
    organization_id: Annotated[str | None, Header(alias="X-Organization-Id")] = None,
) -> OrganizationMembership:
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Organization-Id header required.",
        )

    try:
        membership = await fetch_membership(user.id, organization_id)
    except asyncpg.InvalidTextRepresentationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Organization-Id must be a valid organization id.",
        ) from exc

    if membership is None or membership.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active organization membership required.",
        )

    return membership


async def require_organization_manager(
    membership: Annotated[OrganizationMembership, Depends(require_organization_member)],
) -> OrganizationMembership:
    if membership.role not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner or admin role required.",
        )

    return membership