# Phase 3 Limits And Quotas

Date: 2026-07-31

## Distributed Rate Limits

Application actions now call `checkDistributedRateLimit`. In production, configure Redis REST credentials:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

When those are missing, local development falls back to the in-process limiter so the app remains usable on localhost. Production environment validation marks missing Redis REST settings as a blocking readiness issue.

Covered surfaces include login, signup, password reset/update, Google auth, organization creation, Notion OAuth, onboarding sync start, manual sync, sync history clearing, invitations, member management, collection changes, support tickets, problem reports, feedback, and Ask AI.

## Atomic AI Quotas

Ask AI now reserves quota in Postgres before calling the AI provider.

Flow:

1. The browser submit includes a stable `requestId`.
2. `reserve_daily_ai_quota` atomically checks user and global daily caps using transaction advisory locks.
3. If allowed, a reservation is created with a unique `(organization_id, user_id, idempotency_key)` constraint.
4. If Kora saves an answer, `commit_ai_quota_reservation` marks the reservation committed and creates the authoritative `usage_events` record.
5. If generation or saving fails, `release_ai_quota_reservation` releases the reservation so the user is not charged.
6. UI usage reads committed usage plus active reservations from the same database state.

## Live Verification

A live Supabase smoke test reserved and released quota for an existing active member, then deleted the smoke reservation. No smoke reservations remained afterward.

Public RPC wrappers are `security invoker`; privileged quota logic lives in the `private` schema. Direct table privileges are not granted to `anon` or `authenticated`; `service_role` is limited to `SELECT`, `INSERT`, and `UPDATE` on quota reservations.

