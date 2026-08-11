import type { DocumentStatus, SyncJob } from "@/lib/database.types";

export type SyncJobProgress = {
  totalItems: number;
  processedItems: number;
  failedItems: number;
  skippedItems: number;
  completedItems: number;
  completionRate: number;
  failureRate: number;
  durationMs: number | null;
};

export function summarizeSyncJob(job: Pick<SyncJob, "total_items" | "processed_items" | "failed_items" | "skipped_items" | "started_at" | "completed_at" | "created_at">): SyncJobProgress {
  const totalItems = Math.max(0, job.total_items);
  const processedItems = Math.max(0, job.processed_items);
  const failedItems = Math.max(0, job.failed_items);
  const skippedItems = Math.max(0, job.skipped_items);
  const completedItems = processedItems + failedItems + skippedItems;
  const denominator = totalItems > 0 ? totalItems : completedItems;

  return {
    totalItems,
    processedItems,
    failedItems,
    skippedItems,
    completedItems,
    completionRate: denominator ? Math.min(100, Math.round((completedItems / denominator) * 100)) : 0,
    failureRate: denominator ? Math.round((failedItems / denominator) * 100) : 0,
    durationMs: syncJobDurationMs(job),
  };
}

export function syncJobDurationMs(job: Pick<SyncJob, "started_at" | "completed_at" | "created_at">) {
  const start = new Date(job.started_at ?? job.created_at).getTime();
  const end = job.completed_at ? new Date(job.completed_at).getTime() : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return end - start;
}

export function formatDuration(durationMs: number | null) {
  if (durationMs === null) return "Unknown";

  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function documentStatusCounts(documents: Array<{ sync_status: DocumentStatus }>) {
  const counts: Record<DocumentStatus, number> = {
    pending: 0,
    syncing: 0,
    indexed: 0,
    failed: 0,
    archived: 0,
  };

  for (const document of documents) {
    counts[document.sync_status] += 1;
  }

  return counts;
}

export function syncStatusTone(status: SyncJob["status"]) {
  if (status === "succeeded") return "text-emerald-200";
  if (status === "failed") return "text-rose-200";
  if (status === "running" || status === "queued") return "text-blue-200";
  return "text-slate-300";
}
