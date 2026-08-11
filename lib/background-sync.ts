import { logOperationalEvent } from "@/lib/operational-logging";

export type EnqueueSyncJobInput = {
  jobId: string;
  organizationId: string;
  requestedBy: string | null;
  correlationId: string;
};

export type EnqueueSyncJobResult = {
  taskId: string;
};

function backendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
}

function internalSecret() {
  return process.env.KORA_INTERNAL_WORKER_SECRET?.trim() || null;
}

export async function enqueueNotionSyncJob(input: EnqueueSyncJobInput): Promise<EnqueueSyncJobResult> {
  const secret = internalSecret();
  if (!secret) {
    throw new Error("KORA_INTERNAL_WORKER_SECRET is not configured.");
  }

  const response = await fetch(`${backendBaseUrl()}/internal/sync-jobs/enqueue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kora-Internal-Secret": secret,
      "X-Request-Id": input.correlationId,
    },
    body: JSON.stringify({
      job_id: input.jobId,
      organization_id: input.organizationId,
      requested_by: input.requestedBy,
      correlation_id: input.correlationId,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    logOperationalEvent("error", "sync.enqueue_failed", {
      status: response.status,
      jobId: input.jobId,
      organizationId: input.organizationId,
      correlationId: input.correlationId,
    });
    throw new Error(`sync_enqueue_${response.status}`);
  }

  const data = (await response.json()) as { task_id?: string };
  if (!data.task_id) {
    throw new Error("sync_enqueue_missing_task_id");
  }

  return { taskId: data.task_id };
}
