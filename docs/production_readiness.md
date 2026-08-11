# Production Readiness Checklist

Use this checklist before deploying Kora outside local development.

## Required Environment Variables

Frontend and Supabase client:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Server-only Supabase access:

- `SUPABASE_SERVICE_ROLE_KEY`

Notion OAuth and encrypted token storage:

- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `NOTION_REDIRECT_URI`
- `NOTION_TOKEN_ENCRYPTION_KEY`

AI provider keys:

- `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`
- `OPENAI_API_KEY` only if an organization uses OpenAI models

Backend services:

- `DATABASE_URL`
- `SUPABASE_JWT_SECRET`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `API_CORS_ORIGINS`

Production-only values:

- `APP_ENV=production`
- `NEXT_PUBLIC_SITE_URL` must use the deployed HTTPS URL
- `NOTION_REDIRECT_URI` must exactly match the Notion integration redirect URL

## Database Preparation

Run every migration in `supabase/migrations` in order against the production Supabase project.

After migrations, confirm:

- `vector` extension is enabled.
- `documents`, `document_chunks`, `messages`, `message_citations`, `message_feedback`, `knowledge_gaps`, and `usage_events` exist.
- RLS is enabled on tenant-owned tables.
- Service-role grants are present for sync, indexing, and chat tables.

## Operational Safeguards

Implemented in the app:

- Login rate limit: 10 attempts per email/request fingerprint every 10 minutes.
- Signup rate limit: 5 attempts per email/request fingerprint every 30 minutes.
- Password reset request rate limit: 3 attempts per email/request fingerprint every 30 minutes.
- Password update rate limit: 5 attempts per active session/request fingerprint every 30 minutes.
- Organization creation rate limit: 3 organizations per user every hour.
- Organization profile update rate limit: 20 updates per manager per organization every hour.
- AI settings update rate limit: 20 updates per manager per organization every hour.
- Member invite rate limit: 10 invitations per manager per organization every hour.
- Member role/disable/remove/revoke actions: 20 attempts per manager per organization every hour for each action type.
- Invitation acceptance rate limit: 10 attempts per invitation token every 30 minutes.
- Ask AI burst rate limit: 20 questions per user per organization every 10 minutes.
- Ask AI daily user quota: 20 questions per user per day by default, configurable with `KORA_DAILY_USER_AI_QUESTION_LIMIT`.
- Ask AI daily global safety quota: 100 questions per day by default, configurable with `KORA_DAILY_GLOBAL_AI_QUESTION_LIMIT`.
- Feedback rate limit: 60 ratings per user per organization every 10 minutes.
- Sync rate limit: 5 sync requests per manager per organization every 15 minutes.
- Re-index rate limit: 10 document re-index requests per manager per organization every 15 minutes.
- Notion OAuth start limit: 10 connection attempts per manager per organization every 10 minutes.
- Structured operational logs redact token, key, password, secret, cookie, authorization, and ciphertext fields.
- Supabase admin client now reports the exact missing server environment setting.

The daily AI quota uses saved `usage_events`, so it survives page refreshes and app restarts. Distributed burst limits and organization summary caches use Upstash Redis when its REST URL and token are configured. Development can fall back to process memory, but production readiness reports a warning until distributed Redis is available.

## Smoke Test Before Launch

1. Open the landing page.
2. Sign up or sign in.
3. Create or select an organization.
4. Connect Notion.
5. Run Sync Now.
6. Confirm Knowledge shows indexed documents and chunks.
7. Ask Kora a question answerable from the synced document.
8. Confirm citations open and show the exact source chunk.
9. Mark one answer helpful and one answer not helpful.
10. Confirm the not-helpful answer creates or updates a knowledge gap.
11. Confirm Insights shows usage, weak-answer rate, cited pages, sync health, and open gaps.
12. Confirm Settings shows safe AI configuration values.
13. Confirm Members permissions match owner/admin/member expectations.

## Release Checks

Run these before deploying:

```bash
node ./node_modules/eslint/bin/eslint.js .
node ./node_modules/typescript/bin/tsc --noEmit
node ./node_modules/vitest/vitest.mjs run
node ./node_modules/next/dist/bin/next build
cd backend
python -m ruff check .
python -m mypy app tests
python -m pytest
```

## Known Production Follow-Ups

- Add hosted log drains or application monitoring.
- Add scheduled sync infrastructure when Milestone 13 is built fully.
- Complete the provider setup and first staged rollout using `docs/deployment.md`.
## Provider AI quota

The app cannot know the exact remaining Gemini/OpenAI provider quota unless the provider exposes that value through billing or usage APIs. Kora protects the provider key with its own app-level caps:

- Per-user daily cap controls fair use.
- Global daily cap protects the shared AI key from being drained by all users together.
- Provider-side limits should still be configured in the AI provider dashboard when available.

For a portfolio deployment, start with `KORA_DAILY_USER_AI_QUESTION_LIMIT=20` and `KORA_DAILY_GLOBAL_AI_QUESTION_LIMIT=100`, then lower the global cap if the provider free tier is smaller.