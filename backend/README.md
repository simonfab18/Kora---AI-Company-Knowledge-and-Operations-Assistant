# Kora Backend

FastAPI API foundation for local development.

The backend provides health/readiness checks, environment validation, database connectivity, and background sync enqueueing. Production uses Google Cloud Tasks, while local development uses a lightweight in-process task fallback.
