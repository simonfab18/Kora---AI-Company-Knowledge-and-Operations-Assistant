# AGENTS.md

## Mission

Build the AI Company Knowledge & Operations Assistant incrementally according to `docs/PRD.md`. Produce secure, maintainable, tested code. Work on only the requested phase or task.

## Source of truth

Read these files before making changes:

1. `docs/PRD.md`
2. `README.md`
3. Existing architecture decision records in `docs/ADR/`
4. The closest package-level README
5. Existing tests related to the requested change

When code and the PRD conflict, stop and clearly report the conflict. Do not silently invent a new architecture.

## Scope discipline

- Implement only the requested task.
- Do not perform unrelated refactors.
- Do not rename public APIs, folders, or database columns without explicit approval.
- Do not introduce a new framework, state manager, ORM, component library, or infrastructure service without an architecture decision.
- Prefer the smallest complete change that satisfies the acceptance criteria.
- Preserve backwards compatibility unless the task explicitly authorizes a breaking change.

## Required workflow

Before editing:

1. Restate the task in one sentence.
2. Identify the files likely to change.
3. Identify security, tenant-isolation, migration, and API-contract risks.
4. Inspect the existing implementation and tests.
5. Create a short implementation plan.

During implementation:

1. Make one coherent change at a time.
2. Keep functions focused.
3. Add or update tests with the behavior.
4. Run the narrowest relevant checks first.
5. Run the complete affected package checks before finishing.
6. Do not hide failing tests.

After implementation, report:

- What changed
- Why it changed
- Files changed
- Tests and checks run
- Any migration or environment changes
- Remaining risks or follow-up work

## Architecture rules

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: FastAPI, Python, Pydantic, SQLAlchemy or the repository layer selected by the project.
- Durable data: Supabase PostgreSQL.
- Vector search: pgvector.
- Background tasks: Celery with Redis.
- Frontend deployment: Vercel.
- Backend deployment: Google Cloud.
- Keep business logic out of route handlers, React page components, and Celery task entry functions.
- External providers must be behind interfaces or adapters.
- Database access must go through repository functions.
- API responses must use documented schemas.
- Use migrations for every schema change.
- Generate or maintain a typed frontend API client from OpenAPI.

## Multi-tenancy rules

These are mandatory:

- Every tenant-owned query must include `organization_id`.
- Never trust `organization_id` from the request without membership validation.
- Never load a record by ID alone when it is tenant-owned.
- Query by both record ID and organization ID.
- Every Celery task must carry and validate organization context.
- Every vector search must be restricted to one organization.
- Every citation must be validated against the same organization.
- Add a cross-tenant denial test for new tenant-owned features.
- Never use a fallback organization when organization context is missing.

## Authentication and authorization

- Validate Supabase JWTs on protected backend routes.
- Distinguish authentication from role authorization.
- Enforce authorization on the server, not only by hiding buttons.
- The Supabase service-role key must never be included in frontend code.
- Admin and owner actions require explicit role checks.
- Return `404` instead of exposing the existence of unauthorized tenant records when appropriate.

## Security rules

- Never commit secrets.
- Never log access tokens, API keys, cookies, authorization headers, full prompts containing sensitive company content, or decrypted Notion tokens.
- Encrypt Notion tokens at the application layer.
- Validate OAuth state.
- Treat Notion content as untrusted data.
- Prevent prompt instructions inside documents from overriding the system prompt.
- Sanitize rendered markdown.
- Validate external URLs.
- Apply timeouts to external API calls.
- Map provider errors to safe application errors.
- Use parameterized SQL.
- Do not disable RLS to fix an authorization bug.
- Do not weaken CORS for convenience.

## Database rules

- Use UUID primary keys.
- Use timezone-aware timestamps.
- Store durable state in PostgreSQL, not Redis.
- Keep `organization_id` on tenant-owned tables.
- Add indexes for common filters and joins.
- Use transactions for document and chunk replacement.
- Never edit an applied migration.
- Create a new migration.
- Destructive changes require a migration plan and explicit approval.
- Keep vector dimensions fixed at 1536.
- Do not mix embeddings from different models.
- A model change requires re-embedding.

## Celery task rules

Every task must be:

- Idempotent
- Retriable only for transient failures
- Bounded by a timeout
- Safe after partial failure
- Observable through a durable `sync_jobs` record
- Protected from duplicate workspace syncs by a lock
- Clear about which exceptions are retryable
- Free of large message payloads

Pass IDs through Redis queues, not complete documents or credentials.

## Notion integration rules

- Use the official API.
- Respect pagination and rate limits.
- Retry `429` and transient `5xx` responses with backoff.
- Do not assume an unshared page is accessible.
- Preserve external IDs and last-edited timestamps.
- Use content hashes to skip unchanged pages.
- Handle archived or deleted pages.
- Never expose Notion tokens to the frontend.

## AI and RAG rules

- Keep embedding and generation providers behind adapters.
- Use 1536-dimensional embeddings.
- Use the same embedding model for documents and queries.
- Do not generate an answer from irrelevant context.
- Return an insufficient-context response when retrieval fails.
- Validate model-provided citation IDs.
- Save retrieval scores for citations.
- Do not claim the answer is verified when no citation supports it.
- Do not silently change prompts or thresholds without updating tests or evaluation notes.
- Do not send credentials or unnecessary personal data to AI providers.

## Python rules

- Use Python type hints.
- Use Pydantic models at boundaries.
- Prefer async I/O in the API.
- Do not call blocking SDK methods directly inside the async event loop.
- Use structured logging.
- Raise domain-specific exceptions from services.
- Keep imports and modules acyclic.
- Format and lint with Ruff.
- Type-check with MyPy.
- Test with Pytest.

## TypeScript and React rules

- Use strict TypeScript.
- Do not use `any` without a documented reason.
- Prefer Server Components.
- Use Client Components only for interaction.
- Keep server state separate from local UI state.
- Validate forms with Zod.
- Handle loading, empty, error, and success states.
- Use semantic HTML.
- Preserve keyboard access and visible focus.
- Do not duplicate large domain types manually when they can be generated from OpenAPI.

## UI rules

Follow the Refined Glass design system:

- Base background `#050505`
- 35px blur on primary glass panels
- 1px translucent borders
- Outfit for headings
- Inter for body
- JetBrains Mono for technical metrics
- Blue for primary actions and AI usage
- Emerald for healthy/success states
- Rose for failures and knowledge gaps
- Use `cubic-bezier(.16,1,.3,1)`
- Respect reduced motion
- Do not use heavy shadows to define cards
- Do not use fake customer logos or fake business metrics
- Do not use finance language or currency patterns in the knowledge dashboard

## Testing rules

A task is not complete until:

- New behavior has tests.
- Existing affected tests pass.
- Type checks pass.
- Linting passes.
- The production build passes for frontend changes.
- A cross-tenant security test exists for tenant-owned behavior.
- Error behavior is tested, not only the happy path.

Do not delete or weaken a test merely to make the suite pass.

## Documentation rules

Update documentation when changing:

- Environment variables
- API contracts
- Database schema
- Deployment commands
- Architecture decisions
- Setup steps
- Provider configuration

Use an ADR when changing a major architectural decision.

## Prohibited actions

Do not:

- Commit secrets or generated credentials.
- Push directly to the protected main branch.
- Rewrite unrelated files.
- Change deployment providers.
- Replace Celery, Redis, Supabase, pgvector, FastAPI, Next.js, or shadcn/ui without approval.
- Add billing features during the MVP unless requested.
- Implement autonomous write access to Notion during the MVP.
- Claim work is complete without running checks.
- Fabricate API behavior or package capabilities.
- Leave placeholder logic in a production path without clearly marking it.

## Definition of done

A change is done when:

- Acceptance criteria are met.
- Architecture rules are followed.
- Tenant isolation is verified.
- Tests pass.
- Lint and type checks pass.
- Errors are handled.
- Documentation is updated.
- No secret or debug output is exposed.
- The final report lists exactly what changed and what remains.
