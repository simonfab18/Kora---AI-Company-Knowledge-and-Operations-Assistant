import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const productionWorkflow = read(".github/workflows/deploy-production.yml");
const previewWorkflow = read(".github/workflows/deploy-preview.yml");
const migrationWorkflow = read(".github/workflows/database-migrate.yml");
const rollbackWorkflow = read(".github/workflows/rollback-production.yml");
const workerCompose = read("deploy/worker/docker-compose.yml");
const workerDeploy = read("deploy/worker/deploy.sh");
const dockerfile = read("backend/Dockerfile");

function expectNoCredentialValues(content: string) {
  expect(content).not.toMatch(/postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/i);
  expect(content).not.toMatch(/sb_secret_[A-Za-z0-9_-]+/);
  expect(content).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
  expect(content).not.toMatch(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/);
}

describe("production deployment configuration", () => {
  it("deploys only a successful tested main commit behind the repository switch", () => {
    expect(productionWorkflow).toContain("vars.ENABLE_PRODUCTION_DEPLOYMENT == 'true'");
    expect(productionWorkflow).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(productionWorkflow).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(productionWorkflow).toContain("ref: ${{ github.event.workflow_run.head_sha }}");
  });

  it("uses short-lived Google identity and immutable backend image tags", () => {
    expect(productionWorkflow).toContain("google-github-actions/auth@v3");
    expect(productionWorkflow).toContain("workload_identity_provider");
    expect(productionWorkflow).toContain("kora-backend:${RELEASE_SHA}");
    expect(productionWorkflow).not.toContain("credentials_json");
  });

  it("checks Cloud Run readiness and waits for worker health", () => {
    expect(productionWorkflow).toContain("--startup-probe=");
    expect(productionWorkflow).toContain("--liveness-probe=");
    expect(productionWorkflow).toContain(".status == \"ready\"");
    expect(workerDeploy).toContain("--wait --wait-timeout 120");
  });

  it("keeps preview credentials away from fork pull requests", () => {
    expect(previewWorkflow).toContain("github.event.pull_request.head.repo.full_name == github.repository");
    expect(previewWorkflow).toContain("vars.ENABLE_PREVIEW_DEPLOYMENT == 'true'");
  });

  it("requires manual backup and migration confirmations", () => {
    expect(migrationWorkflow).toContain("RESTORABLE BACKUP CONFIRMED");
    expect(migrationWorkflow).toContain("APPLY PRODUCTION MIGRATIONS");
    expect(migrationWorkflow).toContain("environment:");
    expect(migrationWorkflow).toContain("name: production-database");
  });

  it("keeps application and database rollback separate", () => {
    expect(rollbackWorkflow).toContain("ROLLBACK PRODUCTION");
    expect(rollbackWorkflow).toContain("Database rollback is intentionally separate");
    expect(rollbackWorkflow).toContain("^[0-9a-f]{40}$");
  });

  it("runs the production API as a non-root PORT-aware process", () => {
    expect(dockerfile).toContain("USER kora");
    expect(dockerfile).toContain("${PORT:-8000}");
    expect(dockerfile).not.toContain(".[dev]");
  });

  it("protects and persists the production Redis broker", () => {
    expect(workerCompose).toContain("--requirepass");
    expect(workerCompose).toContain("redis-data:/data");
    expect(workerCompose).toContain("restart: unless-stopped");
    expect(workerCompose).not.toContain(".env.local");
  });

  it("contains no committed credential values", () => {
    for (const content of [productionWorkflow, previewWorkflow, migrationWorkflow, rollbackWorkflow, workerCompose]) {
      expectNoCredentialValues(content);
    }
  });
});
