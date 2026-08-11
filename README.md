# AI Company Knowledge & Operations Assistant

Kora is a portfolio-grade B2B SaaS project for turning approved Notion pages into searchable company knowledge with grounded AI answers, citations, synchronization health, and knowledge-gap insights.

## Current Status

The project follows the milestone order in `docs/milestones.md`. Milestones 0 through 12 are complete, and a production-readiness pass is documented in `docs/production_readiness.md`. The next full milestone phase is Milestone 13, scheduled synchronization and operational hardening.

Milestone 1 provides the local development foundation:

- Next.js App Router frontend
- FastAPI backend
- `/health` and `/ready` endpoints
- Celery worker
- Redis broker wiring
- Docker Compose for API, worker, and Redis
- Supabase/PostgreSQL configuration placeholders
- Frontend and backend quality checks
- GitHub Actions baseline

Milestone 2 adds the Refined Glass interface foundation:

- Public landing page at `/`
- Reusable glass design primitives
- Login, signup, and password-reset page shells
- Dashboard shell styling based on `docs/design_dashboard.md`

Milestone 3 adds authentication and profile foundations:

- Working Supabase email/password signup, login, logout, and password reset
- Automatic profile creation from Supabase Auth users
- Protected `/app` routes through Supabase SSR session restoration
- FastAPI bearer-token validation with `GET /auth/me`
- Backend auth tests for missing, invalid, expired, and valid JWTs

Milestone 4 adds organization and membership foundations:

- Active organization selection and organization switcher
- Organization profile update controls
- Member invitation, invitation acceptance, role changes, disable, and removal
- Permission-aware organization/member UI
- Supabase RLS policies and audit logs for membership actions

Before testing Milestone 4 against the hosted Supabase project, run `supabase/migrations/20260719033000_organization_memberships_authorization.sql` in the Supabase SQL editor.

Milestone 5 adds the authenticated application shell:

- Fixed desktop sidebar with active route states
- Responsive mobile navigation menu
- Header actions, search placeholder, user controls, and organization context
- Overview, Ask AI, Conversations, Knowledge, Sync Activity, Insights, Members, and Settings route shells
- Reusable empty, loading, and error states

Milestone 6 adds the Notion connection foundation:

- `/api/notion/authorize` OAuth start route
- `/api/notion/callback` OAuth callback route with state validation
- Encrypted Notion token storage
- Notion connection, reconnect, disconnect, and status UI
- Development-only internal-token fallback
- Audit events for Notion connection changes

Before testing Milestone 6 against the hosted Supabase project, run `supabase/migrations/20260719043000_notion_connections.sql` in the Supabase SQL editor.

Milestone 7 adds manual Notion synchronization and document ingestion:

- `documents` and `sync_jobs` persistence
- Manual Sync Now and Retry actions
- Organization-level active sync prevention
- Paginated Notion page discovery
- Nested block retrieval and supported block normalization
- Content hashing, unchanged-page skipping, and document upserts
- Sync job history and Knowledge page document preview

Before testing Milestone 7 against the hosted Supabase project, run `supabase/migrations/20260719050000_sync_jobs_documents.sql` in the Supabase SQL editor.
Milestone 8 adds the Knowledge Library for synchronized documents:

- Searchable document list with title search, status filters, and pagination
- Source links, source update timestamps, and last indexed timestamps
- Document detail pages with normalized content and metadata inspection
- Per-document re-index action with active sync protection
- Empty, failed, archived, and stale/sync status indicators
Milestone 9 adds semantic chunking, embeddings, and vector search:

- `document_chunks` and `usage_events` persistence
- Deterministic document chunking with heading paths and token estimates
- Gemini and OpenAI embedding adapters with fixed 1536-dimensional vectors
- Transactional chunk replacement through a Supabase RPC
- Organization-scoped vector search that filters archived, failed, and mixed-model content
- Retrieval tests for chunking, dimensions, and tenant/model guardrails

Before testing Milestone 9 against the hosted Supabase project, run `supabase/migrations/20260719062000_document_chunks_embeddings.sql` in the Supabase SQL editor. Then set `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` for the default Gemini embedding provider. If you switch an organization to OpenAI embeddings, set `OPENAI_API_KEY` server-side.
Milestone 10 adds grounded AI chat:

- Conversation creation, continuation, rename, archive, and history views
- Ask AI page with composer, message thread, loading state, and citation cards
- Gemini and OpenAI generation adapters behind a provider interface
- Query embedding, vector retrieval, grounded prompt construction, and insufficient-context behavior
- Citation validation that rejects model-fabricated citation IDs
- Message, citation, usage, latency, and confidence persistence
- Cross-tenant/user-scoped conversation and citation guardrail tests

Before testing Milestone 10 against the hosted Supabase project, run `supabase/migrations/20260719070000_grounded_chat.sql` in the Supabase SQL editor. Existing synced documents also need chunks before chat can answer, so run Sync again or re-index documents after the Milestone 9 migration and Gemini key are active.
Milestone 11 adds feedback and knowledge gaps:

- Helpful and not-helpful answer feedback
- Not-helpful reasons and optional comments
- Automatic knowledge-gap creation from weak answers and feedback
- Missing-topic hints, related-source references, status filters, and review/resolve/dismiss actions

Milestone 12 adds analytics and knowledge health:

- Live dashboard and Insights metrics
- Top questions, weak-answer rate, helpful feedback rate, cited pages, sync health, and open gaps
- Date-range filters, gap-status filters, and accessible trend summaries

Before testing Milestone 11/12 against the hosted Supabase project, run `supabase/migrations/20260719080000_knowledge_gaps.sql`, `supabase/migrations/20260719082000_message_feedback.sql`, and `supabase/migrations/20260719083000_feedback_gap_polish.sql` in the Supabase SQL editor.

## Prerequisites

- Node.js 22+
- Python 3.13+
- Docker Desktop for Redis/API/worker local infrastructure

## Environment

Copy `.env.example` to `.env.local` and fill values as needed.

For Milestone 1, `DATABASE_URL` may be empty. The API readiness endpoint will report the database dependency as `missing_configuration` instead of crashing.

For Milestone 3 backend JWT validation, set `SUPABASE_JWT_SECRET` from Supabase Dashboard > Project Settings > API > JWT Settings. Keep it server-only and never prefix it with `NEXT_PUBLIC_`.

For Milestone 6 Notion OAuth, set `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, `NOTION_REDIRECT_URI`, and `NOTION_TOKEN_ENCRYPTION_KEY`. Use a long random encryption key; a 32-byte base64 value is preferred. In development only, `NOTION_INTERNAL_INTEGRATION_TOKEN` can save an internal-token connection without OAuth.

For Milestone 7 synchronization, `SUPABASE_SERVICE_ROLE_KEY` must be set server-side so the server can read encrypted Notion tokens. Optional sync tuning: `NOTION_API_VERSION` defaults to `2022-06-28` and `NOTION_SYNC_MAX_PAGES` defaults to `50`.

For Milestone 9 embeddings, the default organization setting uses Gemini `gemini-embedding-001`, so set `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`. OpenAI embeddings are supported when an organization is configured for OpenAI and `OPENAI_API_KEY` is set.

For Milestone 10 chat, the default organization setting uses Gemini `gemini-flash-latest` for generation, so the same Gemini key can power answers. Kora only saves generated answers after validating that citations refer to retrieved chunks.

For Gemini retrieval tuning, run `supabase/migrations/20260719073000_tune_gemini_retrieval_threshold.sql` if Ask AI returns insufficient context even though `document_chunks` contains relevant synced content.

For production readiness, review `docs/production_readiness.md`. For the gated Vercel, Cloud Run, worker VM, database migration, and rollback workflows, follow `docs/deployment.md`. Ask AI daily quotas default to `KORA_DAILY_USER_AI_QUESTION_LIMIT=20` and `KORA_DAILY_GLOBAL_AI_QUESTION_LIMIT=100`.

## Install

```bash
npm install
py -3.13 -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -e backend[dev]
```

On macOS/Linux, replace `.venv\Scripts\python` with `.venv/bin/python`.

## Run Locally

Frontend:

```bash
node ./node_modules/next/dist/bin/next dev
```

API:

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

Worker:

```bash
cd backend
python -m celery -A app.worker.celery_app worker --loglevel=info
```

Redis/API/worker with Docker Compose:

```bash
docker compose up --build
```

## Health Checks

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

`/health` confirms the API process is alive. `/ready` reports Redis and database readiness.

## Checks

Frontend:

```bash
node ./node_modules/eslint/bin/eslint.js .
node ./node_modules/typescript/bin/tsc --noEmit
node ./node_modules/vitest/vitest.mjs run
node ./node_modules/next/dist/bin/next build
```

Backend:

```bash
cd backend
python -m ruff check .
python -m mypy app tests
python -m pytest
```

## Documentation

- Product requirements: `docs/prd.md`
- Architecture: `docs/system_architecture.md`
- Database schema: `docs/database_schema.md`
- Milestones: `docs/milestones.md`
- End-to-end QA checklist: `docs/e2e_qa_checklist.md`
- Agent rules: `docs/AGENTS.md`
