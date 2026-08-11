# Production Recovery Runbook

## Before Every Database Migration

1. Confirm a restorable Supabase backup or point-in-time recovery window exists.
2. Save the migration SQL and a separate rollback SQL under `supabase/rollbacks`.
3. Record affected tables, functions, policies, grants, expected locks, and data transformations.
4. Run local checks and apply to a development branch or clean database first.
5. Define verification queries and a rollback decision threshold.
6. Obtain production approval before applying the migration.

## Deployment

1. Pause conflicting background jobs when a migration changes their tables.
2. Apply one migration at a time through the approved migration tool.
3. Verify migration history, table/function shape, RLS, grants, and invariants immediately.
4. Run critical smoke journeys and inspect application/database logs.
5. Resume workers only after the schema and application are compatible.

## Rollback

1. Stop new writes or affected workers if continuing writes could worsen the incident.
2. Prefer a forward corrective migration when data has already changed.
3. Use the matching rollback only when it is transactionally safe and reviewed.
4. Re-run policy, grant, invariant, and smoke tests after rollback.
5. Restore from backup when a destructive migration cannot be reversed safely.
6. Record the incident, impact window, restored version, and follow-up migration.

## Phase 1 Specific Recovery

Rollback file: `supabase/rollbacks/20260731144716_authorization_hardening.sql`.

This rollback intentionally restores broad manager writes to recover availability. It is a temporary security downgrade. Reapply all three Phase 1 migrations as soon as the application issue is corrected.

After either rollout or rollback, verify:

- Every organization has exactly one active canonical owner membership.
- No noncanonical membership has role `owner`.
- Authenticated direct table writes match the intended privilege matrix.
- Public RPC parameter names are visible to PostgREST.
- Temporary live-test users and organizations have been removed.

## Credential Rotation

When a secret is exposed:

1. Revoke or rotate it in the provider dashboard first.
2. Update protected local/deployment environment variables.
3. Restart or redeploy services that cache environment variables.
4. Verify the old credential fails and the new credential works.
5. Never paste the replacement into chat, source code, logs, or tickets.