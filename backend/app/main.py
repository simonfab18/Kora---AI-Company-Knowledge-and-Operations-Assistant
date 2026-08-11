from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.authorization import (
    OrganizationMembership,
    require_organization_manager,
    require_organization_member,
)
from app.core.config import get_settings
from app.core.errors import install_error_handlers
from app.core.logging import configure_logging
from app.core.middleware import request_id_middleware
from app.core.security import AuthenticatedUser, require_current_user
from app.internal import router as internal_router
from app.metrics import collect_metrics
from app.readiness import collect_readiness

settings = get_settings()
configure_logging(settings)

app = FastAPI(title="Kora API", version="0.1.0")
app.middleware("http")(request_id_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.api_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
install_error_handlers(app)
app.include_router(internal_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "api"}


@app.get("/ready")
async def ready() -> dict[str, object]:
    return await collect_readiness(settings)


@app.get("/metrics")
async def metrics() -> dict[str, object]:
    return await collect_metrics(settings)


@app.get("/auth/me")
async def current_user(
    user: Annotated[AuthenticatedUser, Depends(require_current_user)],
) -> dict[str, object]:
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "expires_at": user.expires_at,
    }

@app.get("/auth/organization")
async def current_organization_membership(
    membership: Annotated[OrganizationMembership, Depends(require_organization_member)],
) -> dict[str, object]:
    return {
        "organization_id": membership.organization_id,
        "user_id": membership.user_id,
        "role": membership.role,
        "status": membership.status,
    }


@app.get("/auth/organization/manage")
async def current_organization_manager(
    membership: Annotated[OrganizationMembership, Depends(require_organization_manager)],
) -> dict[str, object]:
    return {
        "organization_id": membership.organization_id,
        "user_id": membership.user_id,
        "role": membership.role,
        "status": membership.status,
    }




