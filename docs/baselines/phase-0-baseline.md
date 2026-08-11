# Phase 0 Baseline And Recovery

Captured: 2026-07-31 (Asia/Singapore)
Supabase project: `gcunbxduzixilquodcow`

## Status

Repository baseline is complete. Two provider-console gates remain before Phase 0 can be marked fully completed:

- Verify or create a restorable Supabase database backup.
- Rotate the previously exposed Supabase database password and Gmail app password, then update protected environment variables.

Do not place replacement credentials in documentation, source files, chat, issue descriptions, or CI YAML.

## Live Database Baseline

- PostgreSQL 17.6.
- 25 application tables in `public`.
- Row-level security enabled on all 25 tables.
- Point-in-time generated schema types: `docs/baselines/phase-0-live-database.types.ts`.
- Owner invariants before Phase 1: 0 noncanonical owners, 0 invalid canonical owner memberships, 0 missing canonical owner memberships.
- Live data scale at capture: 3 profiles, 3 organizations, 5 memberships, 54 documents, 108 chunks, 7 conversations, and 37 messages.

Before Phase 1, authenticated users had direct organization updates and membership insert/update/delete privileges. Anonymous and authenticated roles also inherited `TRUNCATE`, which RLS does not protect. Phase 1 removed those privileges.

## Migration History

The live migration ledger contained only the recent migration series, while the repository contains earlier schema files as well. This drift is intentionally recorded and must be reconciled in Phase 2 before automated database pushes.

Phase 1 added these live migrations:

- `authorization_hardening_phase_1`
- `authorization_rpc_parameter_names`
- `authorization_rpc_invoker_boundary`

No migration-history repair was attempted in Phase 0 or Phase 1.

## Environment Inventory

Public browser configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_BASE_URL`

Server-only secrets and infrastructure configuration:

- Supabase service role, database URL, and JWT secret
- Notion OAuth credentials and token-encryption key
- Gemini/OpenAI provider keys
- SMTP credentials
- Redis and Celery URLs
- API CORS, app environment, and log level
- User/global AI quota settings

`.env.local` is excluded by `.gitignore`. A source scan found no project credential values outside ignored local environment files. `.env.example` contains names and empty placeholders only.

## Route Baseline

- 43 Next.js page or route source files.
- 59 generated routes/static paths in the production build.
- FastAPI endpoints: `/health`, `/ready`, `/auth/me`, `/auth/organization`, and `/auth/organization/manage`.
- Critical journeys are defined in `docs/critical-user-journeys.md`.

## Query Timing Baseline

Representative live `EXPLAIN ANALYZE` results at the captured data size:

| Query | Rows | Execution |
| --- | ---: | ---: |
| Documents by organization | 27 | 7.805 ms |
| Messages by organization | 29 | 0.364 ms |
| Global daily AI usage | 0 | 0.307 ms |

These are small-data reference timings, not load-test results. Phase 6 must compare equivalent plans and realistic-volume measurements against this baseline.

## Verification Baseline

- ESLint: passed.
- TypeScript: passed.
- Vitest: 24 files, 103 tests passed.
- Backend pytest: 15 passed; one upstream Starlette/httpx deprecation warning.
- Next.js production build: passed, 59 static/generated routes.
- Live Phase 1 JWT/PostgREST suite: passed for anonymous, member, admin, owner, cross-organization, and service-role cases.
- Temporary authorization test users and organizations remaining: 0.

## Advisor Baseline

Security advisor after Phase 1:

- Only `auth_leaked_password_protection` remains. Enable it in Supabase Auth settings.

Performance advisor findings are recorded for Phase 6, including unindexed foreign keys, one Auth RLS init-plan warning, several multiple-permissive-policy warnings, and unused-index candidates. Indexes will not be changed without query-plan evidence.

## Recovery Artifacts

- Phase 1 rollback: `supabase/rollbacks/20260731144716_authorization_hardening.sql`.
- Recovery procedure: `docs/production-recovery-runbook.md`.
- Live schema type snapshot: `docs/baselines/phase-0-live-database.types.ts`.
- Live authorization test: `scripts/live-authorization-phase1.mjs`.