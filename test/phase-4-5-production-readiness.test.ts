import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const syncActions = readFileSync("app/app/sync-actions.ts", "utf8");
const knowledgeActions = readFileSync("app/app/knowledge/actions.ts", "utf8");
const internalRunner = readFileSync("app/api/internal/sync-jobs/run/route.ts", "utf8");
const backendTaskQueue = readFileSync("backend/app/task_queue.py", "utf8");
const backendMain = readFileSync("backend/app/main.py", "utf8");
const syncMetadataMigration = readFileSync("supabase/migrations/20260731182000_sync_job_worker_metadata.sql", "utf8");
const clearSyncHistoryMigration = readFileSync("supabase/migrations/20260813000500_allow_service_role_clear_sync_history.sql", "utf8");
const syncControls = readFileSync("components/sync-controls.tsx", "utf8");

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

  it("keeps OAuth tokens out of queue payloads", () => {
    expect(backendTaskQueue).toContain("SyncTaskPayload");
    expect(backendTaskQueue).toContain("job_id");
    expect(backendTaskQueue).not.toContain("access_token_ciphertext");
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

  it("allows the service role to clear completed sync history", () => {
    expect(clearSyncHistoryMigration).toContain("grant delete on public.sync_jobs to service_role");
  });

  it("uses an in-app confirmation instead of a browser alert for clear history", () => {
    expect(syncControls).toContain("Clear completed job history?");
    expect(syncControls).not.toContain("window.confirm");
  });
});

describe("phase 5 observability", () => {
  it("exposes backend metrics and request id middleware", () => {
    expect(backendMain).toContain("/metrics");
    expect(backendMain).toContain("request_id_middleware");
  });

  it("logs background task correlation fields", () => {
    expect(backendTaskQueue).toContain("correlation_id");
    expect(backendTaskQueue).toContain("sync.local_task_failed");
  });
});
