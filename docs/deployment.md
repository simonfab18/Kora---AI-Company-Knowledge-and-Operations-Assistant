# Production Deployment

This runbook deploys Kora with a free-first architecture:

- Next.js frontend on Vercel.
- FastAPI API on Google Cloud Run with minimum instances set to `0`.
- Supabase for Auth, PostgreSQL, and pgvector.
- Google Cloud Tasks for background sync dispatch.
- Google Cloud Scheduler for scheduled sync triggers after the scheduled endpoint is enabled.
- Google Secret Manager for backend infrastructure secrets.
- Upstash Redis free tier for Next.js rate limits and lightweight caches when configured.

The repository contains deployment automation, but production deployment remains disabled until cloud resources, secrets, and protected GitHub environments are configured.

## Deployment Workflows

- `ci.yml`: tests every pull request and every push to `main`.
- `deploy-preview.yml`: creates a Vercel preview for same-repository pull requests when previews are enabled.
- `deploy-production.yml`: runs only after the `CI` workflow succeeds on `main` and production deployment is enabled.
- `database-migrate.yml`: manually applies reviewed Supabase migrations after two typed confirmations and GitHub environment approval.
- `rollback-production.yml`: restores a previous Cloud Run backend image and Vercel deployment after typed confirmation.

Database changes are deliberately separate from application deployment. Apply backward-compatible migrations first, verify them, then merge the application release.

## GitHub Environments

Create these environments under GitHub repository Settings > Environments. Create `ENABLE_PRODUCTION_DEPLOYMENT` and `ENABLE_PREVIEW_DEPLOYMENT` under GitHub repository Settings > Secrets and variables > Actions > Variables because workflow-level safety checks run before environment variables are loaded.

### `production`

Add at least one required reviewer. Restrict deployment branches to `main`.

Variables:

| Name | Example purpose |
| --- | --- |
| `GCP_PROJECT_ID` | Google Cloud project ID, such as `flab11`. |
| `GCP_REGION` | Cloud Run, Artifact Registry, and Cloud Tasks region, such as `australia-southeast1`. |
| `GCP_ARTIFACT_REPOSITORY` | Docker repository name, such as `kora`. |
| `GCP_CLOUD_RUN_SERVICE` | Cloud Run service name, such as `kora-api`. |
| `GCP_CLOUD_RUN_SERVICE_ACCOUNT` | Runtime service account email for Cloud Run. |
| `CLOUD_TASKS_QUEUE` | Queue name, such as `kora-sync`. |
| `CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL` | Service account used by Cloud Tasks OIDC requests. |
| `PRODUCTION_SITE_URL` | Final HTTPS frontend origin without a trailing slash. |

Secrets:

| Name | Source |
| --- | --- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full Google Workload Identity Provider resource name. |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Google deployment service account email. |
| `VERCEL_TOKEN` | Vercel account token. |
| `VERCEL_ORG_ID` | Vercel organization/team ID. |
| `VERCEL_PROJECT_ID` | Vercel project ID. |

### `preview`

Secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Preview deployment is restricted to branches in this repository. Pull requests from forks do not receive deployment secrets.

### `production-database`

Add a required reviewer and restrict deployment branches to `main`.

Secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

Run the workflow only after confirming a restorable backup and reviewing all pending migrations and rollback files.

## Vercel Setup

1. Create or import the Kora project in Vercel.
2. Link the project once with the Vercel CLI to obtain `.vercel/project.json` locally. The file is ignored by Git.
3. Copy the organization and project IDs into protected GitHub secrets.
4. Add production and preview environment variables in Vercel. Use `.env.example` as the inventory and set real values only in Vercel.
5. Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS domain.
6. Set `NEXT_PUBLIC_API_BASE_URL` to the Cloud Run service URL.
7. Set `NOTION_REDIRECT_URI` to `<production-site-url>/api/notion/callback` and register the exact same URL in Notion.
8. Set `KORA_INTERNAL_WORKER_SECRET` to the same value stored in Google Secret Manager.

Do not enable a second Vercel Git auto-deployment path while the repository workflows are enabled, or one commit can produce duplicate deployments.

## Google Cloud Resources

Enable these APIs:

- Artifact Registry
- Cloud Run
- Cloud Tasks
- Cloud Scheduler
- IAM Credentials and Security Token Service
- Secret Manager

Create:

1. A regional Docker Artifact Registry repository.
2. A Cloud Run runtime service account.
3. A deployment service account connected to GitHub through Workload Identity Federation.
4. A Cloud Tasks queue for sync jobs.
5. A Cloud Tasks caller service account that can mint OIDC tokens for internal sync requests.
6. Google Secret Manager secrets listed below.

The deployment service account needs narrowly scoped permissions for Artifact Registry uploads, Cloud Run deployment, service-account usage, and Cloud Tasks queue administration. The Cloud Run runtime service account needs Secret Manager access to Kora runtime secrets and permission to create Cloud Tasks.

## Secret Manager Names

Create these secret resources exactly as named because the deployment workflow refers to them by name:

- `kora-database-url`
- `kora-supabase-url`
- `kora-supabase-publishable-key`
- `kora-supabase-service-role-key`
- `kora-supabase-jwt-secret`
- `kora-internal-worker-secret`

Never store secret values in YAML, committed files, screenshots, or deployment logs.

## Background Work

Sync starts from the app by creating a durable `sync_jobs` row in Supabase, then calling the FastAPI enqueue endpoint. In production, FastAPI creates a Google Cloud Task that calls:

```text
POST <production-site-url>/api/internal/sync-jobs/run
```

The task request includes:

- a short job id payload
- `X-Kora-Internal-Secret`
- an OIDC token from `CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL`

The internal Next.js handler retrieves the encrypted Notion connection server-side, syncs approved content, generates embeddings, and updates the durable job status.

Local development uses `BACKGROUND_TASK_BACKEND=local`, which runs the same internal sync request in a short-lived background thread. No Redis or always-running worker is required.

## Scheduled Sync

Cloud Scheduler should call an authenticated scheduled-sync endpoint after that endpoint is implemented and verified. Until then, scheduled synchronization remains off and manual sync remains supported.

## Release Sequence

1. Confirm a restorable Supabase backup.
2. Run `Production database migration` when the release includes migrations.
3. Review the migration output and database lint result.
4. Merge the tested application change to `main`.
5. `CI` must pass.
6. `Production deployment` builds one commit-addressed backend image, deploys Cloud Run, verifies `/health` and `/ready`, deploys the prebuilt frontend, and verifies the frontend URL.
7. Complete the production smoke test in `e2e_qa_checklist.md`.

The backend image tag is the full Git commit SHA, providing an immutable rollback target.

## Rollback

Use the `Production rollback` workflow and provide:

- The full 40-character commit SHA of a previously healthy backend image.
- The previously healthy `https://...vercel.app` deployment URL.
- The exact confirmation `ROLLBACK PRODUCTION`.

Application rollback restores Cloud Run and the Vercel production alias. It never applies a database rollback automatically. Database rollback requires the reviewed migration-specific file under `supabase/rollbacks`, a backup check, and the production recovery procedure.

## Monitoring and Verification

After deployment, verify:

- Cloud Run `/health` returns success.
- Cloud Run `/ready` reports database, task backend, worker secret, and internal frontend URL as ready.
- Cloud Tasks queue exists and can dispatch to the internal sync handler.
- Google Cloud Logging contains API logs without secrets.
- Vercel runtime logs contain no application secrets.
- GitHub deployment summaries contain URLs and commit IDs, not credentials.
- Supabase RLS and authorization checks pass.

Hosted Sentry alerting remains optional until a Sentry project and DSN are configured.

## Safety Switches

- Leave `ENABLE_PRODUCTION_DEPLOYMENT=false` during initial cloud setup.
- Leave `ENABLE_PREVIEW_DEPLOYMENT=false` until Vercel preview variables are ready.
- Production and database environments should require human approval.
- Do not store JSON service-account keys in GitHub. The workflow uses short-lived Workload Identity Federation credentials.
- Do not store application credentials in YAML, repository variables, screenshots, or documentation.
