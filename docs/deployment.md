# Production Deployment

This runbook deploys Kora using the architecture selected in `system_architecture.md`:

- Next.js frontend on Vercel.
- FastAPI API on Google Cloud Run.
- Celery worker and password-protected Redis on a small Google Compute Engine VM.
- Supabase for Auth, PostgreSQL, and pgvector.
- Google Secret Manager for backend infrastructure secrets.

The repository contains deployment automation, but deployment remains disabled until the cloud resources and protected GitHub environments below are configured.

## Deployment Workflows

- `ci.yml`: tests every pull request and every push to `main`.
- `deploy-preview.yml`: creates a Vercel preview for same-repository pull requests when previews are enabled.
- `deploy-production.yml`: runs only after the `CI` workflow succeeds on `main` and production deployment is enabled.
- `database-migrate.yml`: manually applies reviewed Supabase migrations after two typed confirmations and GitHub environment approval.
- `rollback-production.yml`: manually restores a previous backend image and Vercel deployment after typed confirmation.

Database changes are deliberately separate from application deployment. Apply backward-compatible migrations first, verify them, then merge the application release.

## GitHub Environments

Create these environments under GitHub repository Settings > Environments. Create `ENABLE_PRODUCTION_DEPLOYMENT` and `ENABLE_PREVIEW_DEPLOYMENT` under GitHub repository Settings > Secrets and variables > Actions > Variables because workflow-level safety checks run before environment variables are loaded:

### `production`

Add at least one required reviewer. Restrict deployment branches to `main`.

Variables:

| Name | Example purpose |
| --- | --- |
| `GCP_PROJECT_ID` | Google Cloud project ID. |
| `GCP_REGION` | Cloud Run and Artifact Registry region, such as `australia-southeast1`. |
| `GCP_ARTIFACT_REPOSITORY` | Docker repository name, such as `kora`. |
| `GCP_CLOUD_RUN_SERVICE` | Cloud Run service name, such as `kora-api`. |
| `GCP_CLOUD_RUN_SERVICE_ACCOUNT` | Runtime service account email for Cloud Run. |
| `GCP_VPC_NETWORK` | VPC network used to reach the Redis VM privately. |
| `GCP_VPC_SUBNET` | Regional subnet used by Cloud Run Direct VPC egress. |
| `GCP_WORKER_VM` | Compute Engine worker VM name. |
| `GCP_WORKER_ZONE` | Zone containing the worker VM. |
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
3. Copy the organization and project IDs into the protected GitHub environment secrets.
4. Add production and preview environment variables in Vercel. Use `.env.example` as the inventory and set real values only in Vercel.
5. Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS domain.
6. Set `NEXT_PUBLIC_API_BASE_URL` to the Cloud Run service URL.
7. Set `NOTION_REDIRECT_URI` to `<production-site-url>/api/notion/callback` and register the exact same URL in Notion.
8. Set `KORA_INTERNAL_WORKER_SECRET` to the same value stored in Google Secret Manager.

Do not enable a second Vercel Git auto-deployment path while the repository workflows are enabled, or one commit can produce duplicate deployments.

Current preview verification uses the GitHub Actions preview workflow against the linked Vercel project. Production deployment remains disabled until backend cloud resources and protected environments are configured.

## Google Cloud Resources

Enable these APIs:

- Artifact Registry
- Cloud Run
- Compute Engine
- IAM Credentials and Security Token Service
- Identity-Aware Proxy
- Secret Manager

Create:

1. A regional Docker Artifact Registry repository.
2. A Cloud Run runtime service account.
3. A deployment service account connected to GitHub through Workload Identity Federation.
4. A small Compute Engine VM with no public IP, Docker Engine, Docker Compose v2, and OS Login enabled.
5. A VPC and regional subnet shared by Cloud Run Direct VPC egress and the worker VM.
6. A firewall rule allowing TCP `6379` to the worker VM only from the selected Cloud Run subnet.
7. An IAP SSH firewall rule and IAM access for the deployment service account.

The deployment service account needs narrowly scoped permissions for Artifact Registry uploads, Cloud Run deployment, service-account usage, IAP tunneling, OS Admin Login, and updating the selected VM. The Cloud Run runtime service account needs Secret Manager access only to the Kora runtime secrets. The VM service account needs Artifact Registry read access and access to the worker secrets used by `provision-env.sh`.

## Secret Manager Names

Create these secret resources exactly as named because the deployment workflow refers to them by name:

- `kora-database-url`
- `kora-supabase-url`
- `kora-supabase-publishable-key`
- `kora-supabase-service-role-key`
- `kora-supabase-jwt-secret`
- `kora-redis-password`
- `kora-redis-url`
- `kora-redis-result-url`
- `kora-internal-worker-secret`

`kora-redis-url` should use Redis database `0`; `kora-redis-result-url` should use database `1`. Both URLs use the worker VM private IP and the password stored in `kora-redis-password`. Never use the VM public address.

## Worker VM Preparation

Copy `deploy/worker/provision-env.sh` to the VM and run it with elevated privileges:

```bash
sudo bash provision-env.sh YOUR_GCP_PROJECT_ID https://your-production-domain.example
```

This reads the required values from Secret Manager and creates `/etc/kora/worker.env` with mode `0600`. It does not print secret values.

Configure Docker authentication for the VM's Artifact Registry region. Then install the Compose and deployment files under `/opt/kora`. Subsequent successful production workflows update the worker automatically through IAP.

Redis is password protected, persists data in a named Docker volume, rotates local container logs, and restarts unless explicitly stopped. Do not open port `6379` to the public internet.

## Release Sequence

1. Confirm a restorable Supabase backup.
2. Run `Production database migration` when the release includes migrations.
3. Review the migration output and database lint result.
4. Merge the tested application change to `main`.
5. `CI` must pass.
6. `Production deployment` builds one commit-addressed backend image, deploys Cloud Run, verifies `/health` and `/ready`, updates the worker VM, deploys the prebuilt frontend, and verifies the frontend URL.
7. Complete the production smoke test in `e2e_qa_checklist.md`.

The backend image tag is the full Git commit SHA, providing an immutable rollback target.

## Rollback

Use the `Production rollback` workflow and provide:

- The full 40-character commit SHA of a previously healthy backend image.
- The previously healthy `https://...vercel.app` deployment URL.
- The exact confirmation `ROLLBACK PRODUCTION`.

Application rollback restores Cloud Run, the Celery worker, and the Vercel production alias. It never applies a database rollback automatically. Database rollback requires the reviewed migration-specific file under `supabase/rollbacks`, a backup check, and the production recovery procedure.

## Monitoring and Verification

After deployment, verify:

- Cloud Run `/health` returns success.
- Cloud Run `/ready` reports database, Redis, worker secret, and internal frontend URL as ready.
- The worker service is healthy in `docker compose ps`.
- Redis is not publicly reachable.
- Google Cloud Logging contains API logs without secrets.
- Vercel runtime logs contain no application secrets.
- GitHub deployment summaries contain URLs and commit IDs, not credentials.
- Supabase RLS and authorization checks pass.

Hosted Sentry alerting remains optional until a Sentry project and DSN are configured. Scheduled synchronization is not provisioned by this workflow until the authenticated scheduled-sync endpoint is implemented and verified.

## Safety Switches

- Leave `ENABLE_PRODUCTION_DEPLOYMENT=false` during initial cloud setup.
- Leave `ENABLE_PREVIEW_DEPLOYMENT=false` until Vercel preview variables are ready.
- Production and database environments should require human approval.
- Do not store JSON service-account keys in GitHub. The workflow uses short-lived Workload Identity Federation credentials.
- Do not store application credentials in YAML, repository variables, screenshots, or documentation.
