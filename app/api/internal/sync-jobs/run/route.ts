import { runNotionPageSyncJob, runNotionSyncJob, safeErrorMessage, type ConnectionRecord } from "@/lib/notion-ingestion";
import { invalidateOrganizationSummaryCache } from "@/lib/organization-summary-cache";
import { logOperationalEvent } from "@/lib/operational-logging";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

type SyncJobRunnerRequest = {
  jobId?: string;
  correlationId?: string;
};

type SyncJobRow = {
  id: string;
  organization_id: string;
  connection_id: string | null;
  requested_by: string | null;
  job_type: "full" | "incremental" | "page" | "delete";
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  target_document_id: string | null;
  target_external_id: string | null;
  attempt_count: number;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function getInternalSecret() {
  return process.env.KORA_INTERNAL_WORKER_SECRET?.trim() || null;
}

async function createAuditLog(input: {
  organizationId: string;
  actorUserId: string | null;
  action: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    action: input.action,
    target_type: "sync_job",
    target_id: input.targetId,
    metadata: input.metadata ?? {},
  });
}

export async function POST(request: NextRequest) {
  const secret = getInternalSecret();
  if (!secret || request.headers.get("x-kora-internal-secret") !== secret) {
    return unauthorized();
  }

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const body = (await request.json().catch(() => ({}))) as SyncJobRunnerRequest;
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const correlationId = typeof body.correlationId === "string" ? body.correlationId : requestId;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400, headers: { "X-Request-Id": requestId } });
  }

  const supabase = createAdminClient();
  const { data: job, error: jobError } = await supabase
    .from("sync_jobs")
    .select("id, organization_id, connection_id, requested_by, job_type, status, target_document_id, target_external_id, attempt_count")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json({ error: "Sync job was not found." }, { status: 404, headers: { "X-Request-Id": requestId } });
  }

  const syncJob = job as SyncJobRow;
  if (syncJob.status !== "queued" && syncJob.status !== "running") {
    return NextResponse.json({ status: syncJob.status, skipped: true }, { headers: { "X-Request-Id": requestId } });
  }

  if (!syncJob.connection_id) {
    await supabase
      .from("sync_jobs")
      .update({ status: "failed", error_code: "missing_connection", error_message: "Sync job has no active connection.", completed_at: new Date().toISOString() })
      .eq("id", syncJob.id)
      .eq("organization_id", syncJob.organization_id);
    return NextResponse.json({ error: "Sync job has no active connection." }, { status: 400, headers: { "X-Request-Id": requestId } });
  }

  const { data: connection, error: connectionError } = await supabase
    .from("notion_connections")
    .select("id, organization_id, access_token_ciphertext")
    .eq("id", syncJob.connection_id)
    .eq("organization_id", syncJob.organization_id)
    .eq("status", "connected")
    .maybeSingle();

  if (connectionError || !connection) {
    await supabase
      .from("sync_jobs")
      .update({ status: "failed", error_code: "missing_connection", error_message: "The active Notion connection could not be read.", completed_at: new Date().toISOString() })
      .eq("id", syncJob.id)
      .eq("organization_id", syncJob.organization_id);
    return NextResponse.json({ error: "The active Notion connection could not be read." }, { status: 400, headers: { "X-Request-Id": requestId } });
  }

  await supabase
    .from("sync_jobs")
    .update({
      status: "running",
      attempt_count: (syncJob.attempt_count ?? 0) + 1,
      locked_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
      correlation_id: correlationId,
      worker_error: null,
    })
    .eq("id", syncJob.id)
    .eq("organization_id", syncJob.organization_id);

  try {
    const stats = syncJob.job_type === "page"
      ? await runNotionPageSyncJob(syncJob.id, connection as ConnectionRecord, syncJob.target_external_id ?? "")
      : await runNotionSyncJob(syncJob.id, connection as ConnectionRecord);
    await invalidateOrganizationSummaryCache(syncJob.organization_id);

    await createAuditLog({
      organizationId: syncJob.organization_id,
      actorUserId: syncJob.requested_by,
      action: syncJob.job_type === "page" ? "notion.document_reindexed" : "notion.sync_completed",
      targetId: syncJob.id,
      metadata: { ...stats, correlation_id: correlationId, target_document_id: syncJob.target_document_id },
    });

    return NextResponse.json({ status: "completed", stats, correlationId }, { headers: { "X-Request-Id": requestId } });
  } catch (error) {
    const message = safeErrorMessage(error);
    logOperationalEvent("error", "sync.internal_runner_failed", {
      error,
      jobId: syncJob.id,
      organizationId: syncJob.organization_id,
      correlationId,
    });
    await supabase
      .from("sync_jobs")
      .update({
        status: "failed",
        error_code: syncJob.job_type === "page" ? "notion_page_sync_failed" : "notion_sync_failed",
        error_message: message,
        worker_error: message,
        completed_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString(),
      })
      .eq("id", syncJob.id)
      .eq("organization_id", syncJob.organization_id);
    await invalidateOrganizationSummaryCache(syncJob.organization_id);
    await createAuditLog({
      organizationId: syncJob.organization_id,
      actorUserId: syncJob.requested_by,
      action: "notion.sync_failed",
      targetId: syncJob.id,
      metadata: { correlation_id: correlationId, error: message },
    });
    return NextResponse.json({ error: message, correlationId }, { status: 500, headers: { "X-Request-Id": requestId } });
  }
}

