# Phase 2 Migration Reconciliation

Date: 2026-07-31
Project ref: gcunbxduzixilquodcow

## Current State

Supabase is configured locally in `supabase/config.toml` and protected migration checks are available through `npm run db:migration:safety`.

Recent live migration history observed through Supabase includes the Phase 3 migrations:

- `20260731081437` - `tighten_ai_quota_reservation_grants`
- `20260731080701` - `private_ai_quota_functions`
- `20260731080535` - `atomic_ai_quotas_phase_3`
- `20260731071621` - `authorization_rpc_invoker_boundary`
- `20260731071314` - `authorization_rpc_parameter_names`
- `20260731070941` - `authorization_hardening_phase_1`

Matching local migration files:

- `supabase/migrations/20260731170500_tighten_ai_quota_reservation_grants.sql`
- `supabase/migrations/20260731165000_private_ai_quota_functions.sql`
- `supabase/migrations/20260731162000_atomic_ai_quotas.sql`
- `supabase/migrations/20260731153500_authorization_rpc_invoker_boundary.sql`
- `supabase/migrations/20260731152000_authorization_rpc_parameter_names.sql`
- `supabase/migrations/20260731144716_authorization_hardening.sql`

## Important Caveat

The Supabase MCP `apply_migration` tool records migration versions using its own applied timestamp. That means recent live versions do not exactly match local filename timestamps even though the migration names and SQL state are reconciled.

Do not manually update `supabase_migrations.schema_migrations` unless a full schema diff has been reviewed and a restorable backup has been verified.

## Guardrails Added

- `supabase/config.toml` links the project ref for CLI work.
- `scripts/check-migration-safety.mjs` checks migration naming, ordering, config, and rollback coverage for protected migrations.
- `scripts/guard-production-db-push.mjs` blocks production database pushes unless an explicit approval phrase is set.
- `scripts/production-db-push.mjs` runs the approval gate before `supabase db push`.
- CI runs migration safety checks and optionally runs Supabase advisors when CI secrets are configured.

## Future Migration Rule

Create future migrations through Supabase CLI and use the guarded push script for production:

```bash
npm run db:migration:safety
npm run db:push:production
```

For production, set `KORA_APPROVE_PRODUCTION_DB_PUSH` only after backup, review, and deployment approval.


