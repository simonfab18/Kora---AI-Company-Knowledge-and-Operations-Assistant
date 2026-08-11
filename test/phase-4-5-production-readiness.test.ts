import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const syncActions = readFileSync("app/app/sync-actions.ts", "utf8");
const knowledgeActions = readFileSync("app/app/knowledge/actions.ts", "utf8");
const internalRunner = readFileSync("app/api/internal/sync-jobs/run/route.ts", "utf8");
const backendTasks = readFileSync("backend/app/worker/tasks.py", "utf8");
const backendMain = readFileSync("backend/app/main.py", "utf8");
const syncMetadataMigration = readFileSync("supabase/migrations/20260731182000_sync_job_worker_metadata.sql", "utf8");

describe("phase 4 durable background jobs", () => {
  it("queues full Notion sync instead of running ingestion in the server action", () => {
    expect(syncActions).toContain("enqueueNotionSyncJob");
    expect(syncActions).not.toContain("runNotionSyncJob(");
  });

  it("queues document re-index jobs with target identifiers", () => {
    expect(knowledgeActions).toContain("enqueueNotionSyncJob");
    expect(knowledgeActions).toContain("target_document_id");
    expect(knowledgeActions).toContain("target_external_id");
  });

  it("keeps OAuth tokens out of Celery payloads", () => {
    expect(backendTasks).toContain("process_notion_sync_job");
    expect(backendTasks).toContain("job_id");
    expect(backendTasks).not.toContain("access_token_ciphertext");
  });

  it("runs sync through a protected internal endpoint", () => {
    expect(internalRunner).toContain("x-kora-internal-secret");
    expect(internalRunner).toContain("runNotionSyncJob");
    expect(internalRunner).toContain("runNotionPageSyncJob");
  });

  it("adds heartbeat and retry metadata to sync jobs", () => {
    expect(syncMetadataMigration).toContain("last_heartbeat_at");
    expect(syncMetadataMigration).toContain("attempt_count");
    expect(syncMetadataMigration).toContain("correlation_id");
  });
});

describe("phase 5 observability", () => {
  it("exposes backend metrics and request id middleware", () => {
    expect(backendMain).toContain("/metrics");
    expect(backendMain).toContain("request_id_middleware");
  });

  it("logs worker correlation fields", () => {
    expect(backendTasks).toContain("correlation_id");
    expect(backendTasks).toContain("sync.job_worker_started");
    expect(backendTasks).toContain("sync.job_worker_finished");
  });
});
