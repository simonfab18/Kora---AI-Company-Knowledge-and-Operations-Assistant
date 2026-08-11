# AI Company Knowledge & Operations Assistant
## Milestones and Build Phases

**Version:** 1.0  
**Purpose:** Define the exact implementation order for building the product in controlled phases.  
**Primary product reference:** `prd.md`  
**Technical references:** `system_architecture.md`, `database_schema.md`, `AGENTS.md`

---

## 1. How to Use This Document

This document defines what should be built first, what each phase must deliver, and what must be verified before moving to the next phase.

Each phase includes:

- Goal
- Dependencies
- Features to build
- Deliverables
- Tests and verification
- Acceptance criteria
- Items that must not be built yet
- Exit gate

The coding agent must work only on the requested phase or task. Completing one phase does not automatically authorize starting the next phase.

Deployment is not required for every phase. A phase should normally end after implementation, tests, linting, type checking, build verification, and documentation updates. Deployment happens only when explicitly requested or during the production deployment milestone.

---

## 2. General Phase Completion Rules

Before starting a phase:

1. Read `prd.md`.
2. Read the relevant sections of `system_architecture.md`.
3. Read the relevant sections of `database_schema.md`.
4. Follow `AGENTS.md`.
5. Inspect the existing implementation and tests.
6. Confirm all dependencies are complete.
7. Limit changes to the requested phase.

A phase is complete only when:

- Required features are implemented.
- Acceptance criteria are satisfied.
- Relevant automated tests pass.
- Linting and type checks pass.
- The affected production build passes.
- Documentation is updated.
- No known critical security or tenant-isolation defect remains.
- Remaining risks are reported clearly.

---

# Milestone 0 — Planning and Repository Preparation — Completed

## Goal

Prepare the repository and documentation so development can begin without ambiguity.

## Dependencies

None.

## Build

- Create the repository.
- Add separate documentation files:
  - `prd.md`
  - `system_architecture.md`
  - `database_schema.md`
  - `milestones.md`
  - `AGENTS.md`
  - `design_dashboard.md`
- Add a root `README.md`.
- Define the repository folder structure.
- Add `.gitignore`.
- Add `.editorconfig`.
- Add `.env.example`.
- Define branch naming and pull-request expectations.

## Deliverables

- Initialized repository.
- Separate approved project documents.
- Root README with product overview.
- Clear repository conventions.

## Verification

- Markdown links work.
- Documents do not contradict each other.
- Product terminology is consistent.
- No credentials or secrets are included.

## Acceptance Criteria

- A coding agent can understand the product from the documents.
- All required documents exist separately.
- The repository has clear rules and structure.

## Do Not Build Yet

- Frontend application
- Backend API
- Authentication
- Database migrations
- Notion integration
- AI features
- Deployment

## Exit Gate

Proceed only after the project documents are approved.

---

# Milestone 1 — Local Development Foundation — Completed

## Goal

Create a working local development environment for the frontend, backend, worker, Redis, and database connectivity.

## Dependencies

- Milestone 0 complete

## Build

### Frontend

- Next.js App Router project.
- Strict TypeScript.
- Tailwind CSS.
- shadcn/ui readiness.
- Minimal home page.
- Environment configuration.

### Backend

- FastAPI application.
- `GET /health`.
- `GET /ready`.
- Environment validation.
- Structured logging.
- CORS configuration.
- Standard API error structure.
- Database connection module.

### Background Processing

- Celery configuration.
- Redis broker configuration.
- Simple test task.
- Worker connectivity verification.

### Local Infrastructure

- Docker Compose for API, worker, and Redis.
- Supabase/PostgreSQL placeholders.
- Development commands through Makefile or scripts.

### Quality Tooling

Frontend:

- ESLint
- Type checking
- Unit-test setup
- Production build command

Backend:

- Ruff
- MyPy
- Pytest

Repository:

- GitHub Actions baseline
- Secret scanning
- Setup instructions

## Deliverables

- Running Next.js frontend.
- Running FastAPI backend.
- Running Celery worker.
- Running Redis.
- Database readiness check.
- CI workflow.
- Local setup documentation.

## Tests and Verification

- Frontend lint passes.
- Frontend type check passes.
- Frontend production build passes.
- Backend Ruff passes.
- Backend MyPy passes.
- Backend tests pass.
- `/health` returns success.
- `/ready` reports dependencies correctly.
- Celery test task executes successfully.

## Acceptance Criteria

- A developer can clone and run the project locally.
- Frontend and backend communicate.
- Worker consumes a task.
- Missing required configuration fails safely.

## Do Not Build Yet

- Authentication
- Organizations
- Notion OAuth
- Document indexing
- AI chat
- Vector search
- Analytics
- Production deployment

## Exit Gate

All local services and CI checks pass.

---

# Milestone 2 — Design System and Landing Page — Completed

## Goal

Create the visual foundation and public landing page using the Refined Glass theme.

## Dependencies

- Milestone 1 complete
- `design_dashboard.md` available

## Build

### Design System

- Global color, spacing, radius, and motion tokens.
- Deep black base background.
- Grain texture.
- Ambient radial glows.
- Glass panel primitives.
- Buttons, inputs, badges, tooltips, and dialogs.
- Empty, loading, and error states.
- Outfit, Inter, and JetBrains Mono fonts.
- Reduced-motion support.

### Landing Page

- Public navigation.
- Hero section.
- Product dashboard mockup.
- Technology trust strip.
- Problem section.
- Product-value section.
- How It Works section.
- Feature grid.
- Security section.
- Final call to action.
- Footer.

### Authentication Page Shells

- Login layout.
- Signup layout.
- Password-reset layout.

Forms may remain non-functional until the authentication phase.

## Deliverables

- Responsive landing page.
- Reusable design-system components.
- Public navigation and footer.
- Authentication page shells.

## Tests and Verification

- Mobile, tablet, and desktop layouts work.
- Keyboard navigation works.
- Visible focus states exist.
- Reduced motion is respected.
- Text contrast is acceptable.
- No finance-specific copy remains.
- No fake customer logos or claims are used.
- Frontend production build passes.

## Acceptance Criteria

- Landing page matches the Refined Glass specification.
- Design components can be reused in the application dashboard.
- Product messaging matches `prd.md`.

## Do Not Build Yet

- Real authentication
- Notion connection
- Real dashboard data
- AI chat
- Vector search
- Analytics

## Exit Gate

Landing page and design system are approved.

---

# Milestone 3 — Authentication and User Profiles — Completed

## Goal

Implement secure user authentication and profile creation.

## Dependencies

- Milestone 1 complete
- Milestone 2 components available
- Supabase project configured

## Build

- Supabase Auth configuration.
- Email/password signup.
- Email/password login.
- Logout.
- Password reset.
- Authentication callback.
- Protected application routes.
- User profile creation.
- Session restoration.
- Backend Supabase JWT validation.
- Current-user endpoint.
- Authentication error handling.

## Deliverables

- Working signup, login, logout, and password reset.
- Protected `/app` routes.
- Backend authentication dependency.
- Profile record for each user.

## Tests and Verification

- Valid signup succeeds.
- Duplicate signup is handled.
- Invalid login is handled.
- Protected routes reject unauthenticated users.
- Invalid or expired JWTs are rejected.
- Logout clears the session.

## Acceptance Criteria

- A user can create and access an account.
- Authentication survives refresh.
- Protected data requires a valid session.
- Service-role credentials never reach the browser.

## Do Not Build Yet

- Organizations
- Roles
- Notion
- Synchronization
- AI chat
- Analytics

## Exit Gate

Authentication tests pass.

---

# Milestone 4 — Organizations, Memberships, and Authorization — Completed

## Goal

Implement multi-tenant organizations and role-based access control.

## Dependencies

- Milestone 3 complete
- Organization schema available

## Build

### Organizations

- Create organization.
- View and update organization.
- Organization slug.
- Active organization selection.
- Organization switcher.

### Memberships

- Owner membership on organization creation.
- Invite member.
- Accept invitation.
- List members.
- Change member role.
- Disable or remove member.

### Roles

- Owner
- Admin
- Member

### Authorization

- Backend membership dependency.
- Backend role checks.
- Organization-scoped repositories.
- Permission-based UI.
- RLS as defense in depth.
- Audit events for membership changes.

## Deliverables

- Organization onboarding.
- Organization switcher.
- Member-management interface.
- Role-based backend enforcement.

## Tests and Verification

- User can create an organization.
- Owner is automatically added.
- Member cannot perform admin actions.
- Organization A cannot access organization B.
- Forged organization IDs are rejected.
- Disabled member loses access.

## Acceptance Criteria

- Every tenant-owned request validates organization membership.
- Roles are enforced by the server.
- Cross-organization data access is blocked.

## Do Not Build Yet

- Notion integration
- Synchronization
- Embeddings
- AI chat
- Analytics

## Exit Gate

Cross-tenant authorization tests pass.

---

# Milestone 5 — Authenticated Application Shell — Completed

## Goal

Create the complete authenticated navigation and dashboard structure before connecting real data.

## Dependencies

- Milestone 2 complete
- Milestone 4 complete

## Build

- Fixed desktop sidebar.
- Responsive mobile navigation.
- Header.
- Organization switcher.
- User menu.
- Permission-aware navigation.
- Overview page.
- Ask AI page shell.
- Conversations page shell.
- Knowledge page shell.
- Sync Activity page shell.
- Insights page shell.
- Members page.
- Settings pages.
- Dashboard empty, loading, and error states.
- API-shaped mock dashboard data.

## Deliverables

- Authenticated application layout.
- All primary application routes.
- Responsive navigation.
- Dashboard component structure.

## Tests and Verification

- Owner, admin, and member navigation differs correctly.
- All routes render.
- Mobile navigation works.
- Keyboard access works.
- Production build passes.

## Acceptance Criteria

- Application structure matches the PRD.
- Mock data is isolated and easy to replace.
- Restricted navigation is hidden appropriately.

## Do Not Build Yet

- Notion OAuth
- Synchronization
- Embeddings
- AI chat
- Real analytics

## Exit Gate

The application shell is stable and approved.

---

# Milestone 6 — Notion Integration — Completed

## Goal

Allow an owner or administrator to securely connect and disconnect a Notion workspace.

## Dependencies

- Milestone 4 complete
- Milestone 5 settings UI available
- Notion integration configured

## Build

- Notion authorization endpoint.
- OAuth state generation and validation.
- Notion callback endpoint.
- Authorization-code exchange.
- Token encryption.
- Connection persistence.
- Workspace name and icon display.
- Connection-status UI.
- Disconnect and reconnect behavior.
- Development-only internal-token fallback.
- Audit events.

## Deliverables

- Connect Notion flow.
- Encrypted stored credentials.
- Connection settings card.
- Disconnect action.
- Error states.

## Tests and Verification

- Valid callback succeeds.
- Invalid or expired state fails.
- Provider errors are mapped safely.
- Tokens never appear in frontend responses or logs.
- Members cannot manage the connection.
- Connections are tenant-scoped.

## Acceptance Criteria

- Owner or admin can connect Notion.
- Connection details display correctly.
- Tokens are encrypted.
- Disconnecting prevents new synchronization.

## Do Not Build Yet

- Full page synchronization
- Embeddings
- AI chat
- Knowledge gaps
- Analytics

## Exit Gate

OAuth security and token-storage tests pass.

---

# Milestone 7 — Synchronization and Document Ingestion — Completed

## Goal

Synchronize approved Notion pages and store normalized documents.

## Dependencies

- Milestone 6 complete
- Celery and Redis operational
- Document and sync-job tables migrated

## Build

### Jobs

- Create and enqueue sync job.
- Queued, running, succeeded, and failed states.
- Progress counters.
- Retry action.
- Organization-level sync lock.

### Notion Ingestion

- Paginated page discovery.
- Nested block retrieval.
- Supported block normalization.
- Title and metadata extraction.
- Parent-child relationships.
- Source timestamps.
- Content hashing.
- Document upsert.
- Unchanged-page skipping.
- Archived and deleted page handling.

### UI

- Sync Now.
- Job history.
- Job detail.
- Progress display.
- Safe error messages.
- Retry button.

## Deliverables

- Initial full synchronization.
- Incremental synchronization.
- Stored normalized documents.
- Durable job status.
- Sync Activity page.

## Tests and Verification

- Initial sync imports pages.
- Repeated sync creates no duplicates.
- Unchanged pages are skipped.
- Changed pages update correctly.
- Archived pages are excluded.
- Temporary provider errors retry.
- Permanent errors fail safely.
- Duplicate organization sync is prevented.
- Members cannot start or retry sync.

## Acceptance Criteria

- Connected pages are stored as documents.
- Jobs are observable and retryable.
- Existing usable content survives failed syncs.
- Admins can review results.

## Do Not Build Yet

- Embeddings
- Vector search
- AI generation
- Conversations
- Knowledge gaps

## Exit Gate

Document-ingestion and retry tests pass.

---

# Milestone 8 — Knowledge Library — Completed

## Goal

Give administrators a usable view of synchronized company knowledge.

## Dependencies

- Milestone 7 complete

## Build

- Document list.
- Search by title.
- Status filters.
- Pagination.
- Source link.
- Last source update.
- Last synchronization.
- Document detail.
- Metadata view.
- Re-index action.
- Stale-page indicator.
- Failed-document indicator.
- Empty states.

## Deliverables

- Knowledge page.
- Document detail interface.
- Re-index flow.
- Stale and failed content views.

## Tests and Verification

- Only active organization documents display.
- Filters and pagination work.
- Re-index creates a new job.
- Source links are correct.
- Archived content follows the designed visibility rules.

## Acceptance Criteria

- Admin can inspect synchronized pages.
- Admin can identify failed or stale documents.
- A single document can be re-indexed.

## Do Not Build Yet

- Embeddings
- AI chat
- Knowledge gaps
- Usage analytics

## Exit Gate

Knowledge-library flows work with real synchronized documents.

---

# Milestone 9 — Chunking, Embeddings, and Vector Search — Completed

## Goal

Convert synchronized documents into searchable semantic chunks.

## Dependencies

- Milestone 7 complete
- pgvector enabled
- Embedding credentials available

## Build

### Chunking

- Deterministic chunking.
- Heading-path preservation.
- Token estimates.
- Configurable target size and overlap.
- Content hashes.
- Transactional chunk replacement.

### Embeddings

- Embedding-provider interface.
- Gemini implementation.
- Optional OpenAI implementation.
- Fixed 1536 dimensions.
- Batch embedding.
- Retry handling.
- Usage recording.

### Retrieval

- Organization-scoped vector search.
- Configurable candidate count.
- Configurable similarity threshold.
- Exclusion of archived and failed documents.
- Retrieval fixtures or evaluation script.

## Deliverables

- Chunker.
- Embedding adapter.
- Stored vectors.
- Vector-search function.
- Retrieval tests.

## Tests and Verification

- Chunking is deterministic.
- Every embedding has 1536 dimensions.
- Documents and queries use the same model.
- Re-index removes superseded chunks.
- Search returns relevant fixture content.
- Search cannot return another organization's data.
- Low-similarity results are handled.
- Mixed embedding models are rejected.

## Acceptance Criteria

- Documents become semantically searchable.
- Retrieval is tenant-scoped.
- Updated documents replace outdated vector content.

## Do Not Build Yet

- Final AI answer generation
- Conversations
- Feedback
- Knowledge gaps
- Analytics

## Exit Gate

Relevance and cross-tenant retrieval tests pass.

---

# Milestone 10 — Grounded AI Chat — Completed

## Goal

Allow users to ask company questions and receive answers grounded in retrieved Notion content.

## Dependencies

- Milestone 9 complete
- Generation provider configured
- Conversation schema migrated

## Build

### Conversations

- Create conversation.
- List own conversations.
- Open conversation.
- Continue conversation.
- Rename conversation.
- Archive conversation.

### Answer Generation

- Accept question.
- Create query embedding.
- Retrieve relevant chunks.
- Enforce relevance threshold.
- Build grounded prompt.
- Generate answer.
- Validate citation IDs.
- Store messages and citations.
- Record usage and latency.
- Stream response when stable.

### Chat UI

- Composer.
- Thread.
- Loading and streaming states.
- Error state.
- Citation cards.
- Open-source action.
- Insufficient-context state.

## Deliverables

- Working Ask AI page.
- Conversation history.
- Grounded answers.
- Valid citations.
- Insufficient-information behavior.

## Tests and Verification

- Relevant question receives a supported answer.
- Every citation refers to a retrieved chunk.
- Fabricated citation IDs are rejected.
- No-context questions do not produce invented company policy.
- Prompt injection inside documents does not override system rules.
- Users see only their own conversations.
- Cross-tenant message access is denied.
- Provider timeouts are handled.

## Acceptance Criteria

- Member can ask a question and receive a grounded answer.
- Citations open correct Notion pages.
- Insufficient context produces an honest response.
- Conversation history reloads correctly.

## Do Not Build Yet

- Knowledge-gap grouping
- Feedback analytics
- Full insights dashboard
- Autonomous actions

## Exit Gate

Grounding, citation, and cross-tenant tests pass.

---

# Milestone 11 — Feedback and Knowledge Gaps — Completed

## Goal

Collect answer-quality feedback and identify missing company documentation.

## Dependencies

- Milestone 10 complete

## Build

### Feedback

- Helpful rating.
- Unhelpful rating.
- Unhelpful reason.
- Optional comment.
- Feedback update behavior.

### Knowledge Gaps

- Create gap from insufficient retrieval.
- Create gap from missing-information feedback.
- Group similar unanswered questions.
- Track occurrence count.
- Store example questions.
- Reviewing, resolved, and dismissed states.
- Resolution notes.

### UI

- Feedback controls.
- Knowledge Gaps page.
- Gap detail.
- Status filters.

## Deliverables

- Feedback records.
- Knowledge-gap records.
- Gap-management interface.
- Basic grouping logic.

## Tests and Verification

- Helpful and unhelpful feedback save correctly.
- Duplicate feedback follows defined behavior.
- Low-confidence questions create or increment gaps.
- Similar questions group appropriately.
- Cross-tenant gap access is denied.
- Members cannot perform admin gap actions.

## Acceptance Criteria

- Users can rate answers.
- Missing topics appear as gaps.
- Admin can review, resolve, or dismiss gaps.

## Do Not Build Yet

- Suggested Notion drafts
- Automatic page creation
- Billing
- Advanced clustering

## Exit Gate

Feedback and gap-management tests pass.

---

# Milestone 12 — Analytics and Knowledge Health — Completed

## Goal

Replace dashboard mock data with real product metrics.

## Dependencies

- Milestone 7 complete
- Milestone 10 complete
- Milestone 11 complete

## Build

### Metrics

- Indexed pages.
- Searchable chunks.
- Questions asked.
- Successful answers.
- Insufficient answers.
- Helpful feedback rate.
- Sync success rate.
- Open knowledge gaps.
- Stale pages.
- Most referenced pages.
- Recent activity.

### Visualizations

- Question trend.
- Knowledge-coverage trend.
- Sync-health trend.
- Feedback breakdown.
- Segmented AI usage ring.
- Accessible chart summaries.

### Filters

- Date range.
- Organization context.
- Relevant status filters.

## Deliverables

- Real dashboard metrics.
- Insights page.
- Top pages view.
- Recent activity feed.
- Accessible charts.

## Tests and Verification

- Metrics match known fixtures.
- Empty datasets display correctly.
- Date filtering works.
- Restricted analytics are protected.
- Charts include text alternatives.
- No production mock data remains.

## Acceptance Criteria

- Dashboard reflects real stored data.
- Admin can understand knowledge health.
- Stale pages and open gaps are visible.

## Do Not Build Yet

- Paid subscriptions
- Employee scoring
- Autonomous recommendations

## Exit Gate

Metric and access-control tests pass.

---

# Milestone 13 — Scheduled Synchronization and Operational Hardening

## Goal

Keep knowledge synchronized reliably without requiring manual intervention.

## Dependencies

- Milestone 7 complete
- Milestone 12 recommended

## Build

- Synchronization schedule setting.
- Internal scheduled endpoint.
- Google Cloud Scheduler integration.
- Selection of due organizations.
- Incremental scheduled sync.
- Retry limits.
- Exponential backoff and jitter.
- External request timeouts.
- Graceful worker shutdown.
- Stale-job detection.
- Queue monitoring.
- Sanitized structured logs.
- Request and job IDs.
- Audit events.

## Deliverables

- Scheduled synchronization.
- Reliable retry behavior.
- Operational logs.
- Failure runbook.
- Job-health information.

## Tests and Verification

- Scheduler authentication is required.
- Only due organizations are queued.
- Duplicate scheduled syncs are prevented.
- Transient errors retry.
- Permanent errors do not retry indefinitely.
- Stale jobs are detectable.
- Logs contain no secrets.

## Acceptance Criteria

- Knowledge can remain updated automatically.
- Failures are observable.
- Retry behavior is bounded.
- Manual retry remains available.

## Do Not Build Yet

- Multi-region workers
- Enterprise queues
- High-availability infrastructure
- Billing

## Exit Gate

Scheduled synchronization and reliability tests pass.

---

# Milestone 14 — Production Deployment

## Goal

Deploy a fully working portfolio version.

## Dependencies

- Required MVP milestones complete
- Production secrets prepared
- Security review completed

## Build

### Frontend

- Vercel project.
- Production and preview environment variables.
- Production domain.

### API

- FastAPI container.
- Artifact Registry.
- Cloud Run service.
- Health and readiness configuration.
- Restricted CORS.
- Service account permissions.

### Worker and Redis

- Small Google Compute Engine VM.
- Celery worker deployment.
- Redis deployment or secured connection.
- Restart policy.
- Deployment/update script.

### Database

- Production Supabase project.
- Migrations.
- pgvector.
- RLS verification.
- Required indexes.

### Secrets and Scheduling

- Google Secret Manager.
- Cloud Scheduler.
- Notion OAuth production callback.
- AI provider credentials.

### Cost Controls

- Google Cloud budget alerts.
- Provider usage limits.
- Application rate limits.
- Small resource configuration.
- Cost-risk documentation.

## Deliverables

- Live frontend.
- Live API.
- Running worker and Redis.
- Production database.
- Working Notion connection.
- Working synchronization.
- Working grounded chat.
- Monitoring and budget alerts.

## Tests and Verification

Production smoke test:

1. Sign up.
2. Create organization.
3. Connect Notion.
4. Start sync.
5. Confirm indexed pages.
6. Ask a grounded question.
7. Open a citation.
8. Submit feedback.
9. Confirm gap behavior.
10. Confirm dashboard metrics.

Also verify:

- No secrets appear in browser output.
- Cross-tenant access is blocked.
- CORS only accepts approved origins.
- Worker recovers after restart.
- Failed jobs are visible.
- Budget alerts are active.

## Acceptance Criteria

- Complete product flow works in production.
- No manual database edits are required for the demo.
- No critical security defect remains.
- Recovery steps are documented.

## Do Not Build Yet

- Paid production scaling
- Enterprise features
- Multi-region deployment
- High-availability Redis
- Complex billing

## Exit Gate

Production smoke test and security checklist pass.

---

# Milestone 15 — Portfolio Release

## Goal

Present the project clearly to recruiters, interviewers, and potential clients.

## Dependencies

- Milestone 14 complete

## Build

- Complete root README.
- Product screenshots.
- Architecture diagram.
- Setup instructions.
- Feature list.
- Technical decisions.
- Security section.
- Testing section.
- Deployment section.
- Known limitations.
- Future roadmap.
- Product demonstration video.
- Safe demo workspace.
- Portfolio description.
- Resume-ready bullet points.

## Deliverables

- Public repository documentation.
- Live demo URL.
- Demo instructions.
- Product video.
- Architecture image.
- Portfolio and resume copy.

## Tests and Verification

- README instructions are accurate.
- Public links work.
- Demo data contains no private information.
- Screenshots contain no credentials.
- Claims are accurate.
- Repository secret scan passes.

## Acceptance Criteria

- A recruiter can understand the problem, solution, architecture, and technical depth.
- A reviewer can use the live project.
- A developer can run the project.
- Limitations and trade-offs are explained honestly.

## Exit Gate

The project is ready to list as a completed portfolio project.

---

## 3. Milestone Summary

| Order | Milestone | Main Outcome |
|---:|---|---|
| 0 | Planning and Repository Preparation | Approved documentation and repository rules |
| 1 | Local Development Foundation | Running frontend, API, worker, Redis, and CI |
| 2 | Design System and Landing Page | Refined Glass public interface |
| 3 | Authentication and User Profiles | Secure user accounts |
| 4 | Organizations and Authorization | Multi-tenant roles and isolation |
| 5 | Application Shell | Complete authenticated navigation |
| 6 | Notion Integration | Secure Notion connection |
| 7 | Synchronization and Ingestion | Notion pages stored as documents |
| 8 | Knowledge Library | Admin document management |
| 9 | Embeddings and Vector Search | Semantic retrieval |
| 10 | Grounded AI Chat | Answers with valid citations |
| 11 | Feedback and Knowledge Gaps | Missing-topic detection |
| 12 | Analytics and Knowledge Health | Real dashboard metrics |
| 13 | Operational Hardening | Scheduled sync and reliable jobs |
| 14 | Production Deployment | Fully working live application |
| 15 | Portfolio Release | Recruiter-ready presentation |

---

## 4. First Coding-Agent Task

```text
Implement Milestone 1 from milestones.md.

Build only the local development foundation:
- Next.js App Router frontend with TypeScript, Tailwind CSS, and shadcn/ui readiness
- FastAPI backend
- /health and /ready endpoints
- Celery worker
- Redis integration
- Docker Compose
- PostgreSQL/Supabase configuration placeholders
- Ruff, MyPy, Pytest, ESLint, and TypeScript checks
- GitHub Actions baseline
- .env.example
- README setup instructions

Do not implement authentication, organizations, Notion, AI, pgvector, analytics, or production deployment.

Follow AGENTS.md and run all required checks before reporting completion.
```

After Milestone 1 is reviewed and approved, continue to Milestone 2. Do not ask the coding agent to build all milestones in one task.
