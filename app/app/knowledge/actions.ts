"use server";

import type { ActionState } from "@/lib/action-state";
import { invalidateOrganizationSummaryCache } from "@/lib/organization-summary-cache";
import { requireOrganizationManager } from "@/lib/authorization";
import { enqueueNotionSyncJob } from "@/lib/background-sync";
import { logOperationalEvent } from "@/lib/operational-logging";
import { checkDistributedRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function markEnqueueFailed(jobId: string, organizationId: string, message: string) {
  const supabase = createAdminClient();
  await supabase
    .from("sync_jobs")
    .update({
      status: "failed",
      error_code: "reindex_enqueue_failed",
      error_message: message,
      worker_error: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("organization_id", organizationId);
}

export async function reindexDocumentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const documentId = getString(formData, "documentId");
  const { user, membership } = await requireOrganizationManager();
  const correlationId = randomUUID();
  const rateLimit = await checkDistributedRateLimit({
    key: `reindex:${membership.organization.id}:${user.id}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  if (!documentId) {
    return { error: "Choose a document to re-index." };
  }

  const supabase = createAdminClient();
  const { data: activeJob } = await supabase
    .from("sync_jobs")
    .select("id")
    .eq("organization_id", membership.organization.id)
    .in("status", ["queued", "running"])
    .maybeSingle();

  if (activeJob) {
    return { error: "A sync is already running for this organization." };
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, organization_id, connection_id, external_id, title")
    .eq("id", documentId)
    .eq("organization_id", membership.organization.id)
    .maybeSingle();

  if (documentError || !document) {
    return { error: "Document was not found in this organization." };
  }

  const { data: connection, error: connectionError } = await supabase
    .from("notion_connections")
    .select("id")
    .eq("id", document.connection_id)
    .eq("organization_id", membership.organization.id)
    .eq("status", "connected")
    .maybeSingle();

  if (connectionError || !connection) {
    return { error: "The document's Notion connection is not active." };
  }

  const { data: job, error: jobError } = await supabase
    .from("sync_jobs")
    .insert({
      organization_id: membership.organization.id,
      connection_id: connection.id,
      requested_by: user.id,
      job_type: "page",
      status: "queued",
      total_items: 1,
      target_document_id: document.id,
      target_external_id: document.external_id,
      correlation_id: correlationId,
      max_attempts: 3,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return { error: jobError?.message ?? "Could not create re-index job." };
  }

  try {
    const enqueueResult = await enqueueNotionSyncJob({
      jobId: job.id,
      organizationId: membership.organization.id,
      requestedBy: user.id,
      correlationId,
    });
    await supabase
      .from("sync_jobs")
      .update({ celery_task_id: enqueueResult.taskId })
      .eq("id", job.id)
      .eq("organization_id", membership.organization.id);
    await invalidateOrganizationSummaryCache(membership.organization.id);
    await supabase.from("audit_logs").insert({
      organization_id: membership.organization.id,
      actor_user_id: user.id,
      action: "notion.document_reindex_queued",
      target_type: "document",
      target_id: document.id,
      metadata: {
        job_id: job.id,
        title: document.title,
        celery_task_id: enqueueResult.taskId,
        correlation_id: correlationId,
      },
    });
    revalidatePath("/app/knowledge");
    revalidatePath(`/app/knowledge/${document.id}`);
    revalidatePath("/app/sync");
    return { message: "Re-index job queued. Progress will update in Sync Activity." };
  } catch (error) {
    const message = "Sync worker could not be reached. Check the backend and worker, then retry.";
    logOperationalEvent("error", "knowledge.reindex_enqueue_failed", {
      error,
      organizationId: membership.organization.id,
      userId: user.id,
      documentId,
      jobId: job.id,
      correlationId,
    });
    await markEnqueueFailed(job.id, membership.organization.id, message);
    revalidatePath("/app/sync");
    return { error: message };
  }
}

