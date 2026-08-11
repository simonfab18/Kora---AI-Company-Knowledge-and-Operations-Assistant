**Phase 0: Baseline And Recovery**

Status: Repository work completed; awaiting verified Supabase backup and provider credential rotation.

Capture the current production schema, migration history, environment-variable inventory, route behavior, query timings, test results, and Supabase advisor output.

Exit criteria:

- Database backup and schema snapshot available.
- Existing frontend/backend tests pass.
- Critical user journeys documented.
- Rollback procedure prepared for every later migration.
- Previously exposed database and Gmail credentials rotated.

**Phase 1: Authorization Hardening**

Status: Completed on 2026-07-31. Live JWT/PostgREST authorization tests passed.

Move sensitive organization and membership changes behind narrowly scoped PostgreSQL functions.

Changes:

- Admins cannot promote themselves to owner.
- Admins cannot change `owner_user_id`.
- Admins cannot edit, disable, or remove owners.
- Direct authenticated writes to sensitive columns are revoked.
- Owner invariants are enforced inside PostgreSQL, not only the UI.
- Service-role usage remains server-only.

Testing:

- Live JWT tests for anonymous, member, admin, owner, and service-role users.
- Cross-organization access tests.
- Direct REST API bypass attempts.
- Owner removal and privilege-escalation tests.

No other phase proceeds until these tests pass.

**Phase 2: Migration Reconciliation**

Reconcile local migration files with the live Supabase migration history before adding automation.

Changes:

- Link and configure the Supabase CLI.
- Compare local files, live schema, and migration history.
- Capture manually applied changes into a clean baseline.
- Repair migration history only after schema comparison.
- Generate future migrations through the Supabase CLI.
- Add database reset, lint, type generation, and advisor checks to CI.
- Require production approval before `db push`.

Cloud and database credentials will remain in protected deployment secrets, never YAML.

**Phase 3: Distributed Limits And Atomic Quotas**

Replace the in-memory rate limiter with Redis-backed enforcement.

Changes:

- Distributed limits for login, signup, reset, invitations, support, sync, re-indexing, feedback, and Ask AI.
- Platform-level protection for public endpoints.
- Atomic PostgreSQL AI quota reservation.
- Idempotency keys prevent duplicate charging.
- Failed AI requests refund or release reservations.
- User and global quotas remain correct during concurrent requests.
- UI usage reads from the same authoritative quota state.

Testing will cover concurrent requests, multiple app instances, Redis restarts, midnight resets, retries, and provider failures.

**Phase 4: Durable Background Jobs**

Connect actual Notion synchronization and indexing to Celery.

Changes:

- Next.js creates a job and returns immediately.
- Celery performs discovery, extraction, chunking, embeddings, and indexing.
- Task payloads contain identifiers, never OAuth tokens.
- Workers retrieve and decrypt tokens server-side.
- Jobs receive retry policies, exponential backoff, timeouts, heartbeats, and idempotency protection.
- Stale jobs can be recovered safely.
- Progress remains visible in the existing Sync UI.
- Duplicate active jobs remain blocked at the database level.

Worker crashes, Redis outages, Notion failures, and partial indexing will be explicitly tested.

**Phase 5: Observability**

Add centralized monitoring while retaining product audit logs.

Changes:

- Hosted exception monitoring for Next.js, FastAPI, and Celery.
- Correlation/request IDs across browser actions, API calls, database jobs, and workers.
- Structured logs with stronger value-level secret redaction.
- Metrics for response latency, AI latency, retrieval quality, queue depth, sync duration, failures, and rate-limit blocks.
- Alerts for elevated errors, stuck jobs, worker outages, quota pressure, and database failures.
- Health and readiness checks expanded for required dependencies.

No document content, passwords, tokens, prompts, or credentials will be sent to logs by default.

**Phase 6: Query And Cache Optimization**

Status: Completed on 2026-08-02. Live Supabase summary functions applied and verified; TypeScript, lint, unit tests, and production build passed.

Replace large dashboard row downloads with database aggregation.

Changes:

- Aggregate SQL functions for dashboard and insight totals.
- Server-side pagination for conversations, members, audit logs, documents, jobs, questions, sources, and gaps.
- Remove Auth-user enumeration from signup and member loading.
- Add only indexes supported by actual query plans.
- Address relevant Supabase performance-advisor warnings.
- Introduce short-lived organization-summary caching with explicit invalidation.
- Never cache authentication decisions, OAuth tokens, or sensitive user-specific results.

Performance will be compared against the Phase 0 baseline before rollout.

**Phase 7: Controlled Refactoring**

Status: Completed on 2026-08-02. Dashboard summary loading, cache boundary, validation schemas, and member-directory pagination were split into safer focused modules without behavior changes.

Split large modules without changing their external behavior.

Proposed boundaries:

- Organization authorization, invitations, membership, and settings services.
- Notion discovery, extraction, synchronization, and indexing services.
- Retrieval, generation, citation, trace, and usage services.
- Dashboard query and presentation modules.
- Shared Zod schemas for client and server validation.
- Central error mapping and action-result handling.
- Generated Supabase database types.

Each extraction will be small, independently tested, and committed only after behavioral tests pass.

**Phase 8: Final Validation**

Status: Automated local and live pre-deployment validation completed on 2026-08-02. Staged deployment, manual browser E2E, and provider-dashboard checks remain external follow-ups.

Run the complete production-readiness suite:

- Lint, TypeScript, unit tests, backend tests, and production build.
- Live RLS integration tests.
- Playwright authentication and organization workflows.
- Notion connection and synchronization E2E.
- Ask AI, citations, quotas, and feedback E2E.
- Migration from a clean database and a production-like snapshot.
- Concurrent and load testing.
- Redis loss, worker termination, provider timeout, and retry recovery.
- Secret scan and Supabase security/performance advisors.
- Staged deployment with rollback validation.

The implementation order is strict: authorization first, migration safety second, infrastructure changes next, and structural refactoring only after the production boundaries are protected.

