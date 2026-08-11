from __future__ import annotations

import contextvars
import uuid

request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "request_id", default=None
)


def get_request_id() -> str:
    current = request_id_var.get()
    if current:
        return current
    generated = str(uuid.uuid4())
    request_id_var.set(generated)
    return generated


def set_request_id(value: str | None) -> str:
    request_id = value.strip() if value and value.strip() else str(uuid.uuid4())
    request_id_var.set(request_id[:120])
    return request_id_var.get() or request_id
