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

type EncryptedConnection = {
  id: string;
  organization_id: string;
  access_token_ciphertext: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function createAuditLog(
  organizationId: string,
  actorUserId: string,
  action: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_user_id: actorUserId,
    action,
    target_type: "sync_job",
    target_id: targetId,
    metadata,
  });
}

async function markEnqueueFailed(jobId: string, organizationId: string, message: string) {
  const supabase = createAdminClient();
  await supabase
    .from("sync_jobs")
    .update({
      status: "failed",
      error_code: "sync_enqueue_failed",
      error_message: message,
      worker_error: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("organization_id", organizationId);
}

async function startNotionSync(jobType: "full" | "incremental", retryJobId?: string): Promise<ActionState> {
  const { user, membership } = await requireOrganizationManager();
  const supabase = createAdminClient();
  const correlationId = randomUUID();
  const rateLimit = await checkDistributedRateLimit({
    key: `sync:${membership.organization.id}:${user.id}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  const { data: activeJob } = await supabase
    .from("sync_jobs")
    .select("id")
    .eq("organization_id", membership.organization.id)
    .in("status", ["queued", "running"])
    .maybeSingle();

  if (activeJob) {
    return { error: "A sync is already running for this organization." };
  }

  const { data: connection, error: connectionError } = await supabase
    .from("notion_connections")
    .select("id, organization_id, access_token_ciphertext")
    .eq("organization_id", membership.organization.id)
    .eq("status", "connected")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError) {
    return { error: "Could not read the active Notion connection." };
  }

  if (!connection) {
    return { error: "Connect Notion before starting a sync." };
  }

  const encryptedConnection = connection as EncryptedConnection;
  const { data: job, error: jobError } = await supabase
    .from("sync_jobs")
    .insert({
      organization_id: membership.organization.id,
      connection_id: encryptedConnection.id,
      requested_by: user.id,
      job_type: jobType,
      status: "queued",
      correlation_id: correlationId,
      max_attempts: 3,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return { error: jobError?.message ?? "Could not create sync job." };
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
    await createAuditLog(membership.organization.id, user.id, retryJobId ? "notion.sync_retry_queued" : "notion.sync_queued", job.id, {
      celery_task_id: enqueueResult.taskId,
      correlation_id: correlationId,
      retry_job_id: retryJobId ?? null,
    });
    revalidatePath("/app/sync");
    revalidatePath("/app/knowledge");
    revalidatePath("/app");
    return { message: "Sync job queued. Progress will update in Sync Activity." };
  } catch (error) {
    const message = "Sync worker could not be reached. Check the backend and worker, then retry.";
    logOperationalEvent("error", "notion.sync_enqueue_failed", {
      error,
      organizationId: membership.organization.id,
      userId: user.id,
      jobId: job.id,
      correlationId,
      retryJobId,
    });
    await markEnqueueFailed(job.id, membership.organization.id, message);
    await createAuditLog(membership.organization.id, user.id, "notion.sync_enqueue_failed", job.id, { correlation_id: correlationId });
    revalidatePath("/app/sync");
    return { error: message };
  }
}

export async function syncNotionNowAction(): Promise<ActionState> {
  return startNotionSync("full");
}

export async function retryNotionSyncAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const jobId = getString(formData, "jobId");

  if (!jobId) {
    return { error: "Choose a sync job to retry." };
  }

  return startNotionSync("full", jobId);
}

export async function clearSyncHistoryAction(): Promise<ActionState> {
  const { user, membership } = await requireOrganizationManager();
  const supabase = createAdminClient();
  const rateLimit = await checkDistributedRateLimit({
    key: `sync-clear:${membership.organization.id}:${user.id}`,
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  const { error } = await supabase
    .from("sync_jobs")
    .delete()
    .eq("organization_id", membership.organization.id)
    .in("status", ["succeeded", "failed", "cancelled"]);

  if (error) {
    return { error: "Sync history could not be cleared." };
  }

  await createAuditLog(membership.organization.id, user.id, "notion.sync_history_cleared", null);
  revalidatePath("/app/sync");
  revalidatePath("/app");
  return { message: "Cleared completed sync history." };
}

