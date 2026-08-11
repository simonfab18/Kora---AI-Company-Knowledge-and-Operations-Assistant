import { clearSyncHistoryAction, retryNotionSyncAction, syncNotionNowAction } from "@/app/app/sync-actions";
import { AppShell } from "@/components/app-shell";
import { DashboardEmptyState } from "@/components/dashboard-states";
import { ClearSyncHistoryButton, RetrySyncButton, SyncNowButton } from "@/components/sync-controls";
import { requireOrganizationManager } from "@/lib/authorization";
import type { Document, NotionConnection, SyncJob } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { documentStatusCounts, formatDuration, summarizeSyncJob, syncStatusTone } from "@/lib/sync-summary";
import { AlertTriangle, CheckCircle2, Clock3, Database, FileWarning, Link2, RefreshCw, RotateCcw } from "lucide-react";
import Link from "next/link";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not started";
}

function activeStatusLabel(job: SyncJob | undefined) {
  if (!job) return "Idle";
  if (job.status === "queued") return "Queued";
  if (job.status === "running") return "Running";
  return "Idle";
}

export default async function Page() {
  const { membership } = await requireOrganizationManager();
  const supabase = createAdminClient();
  const organizationId = membership.organization.id;

  const [{ data: connection }, { data: jobs }, { data: documents }, { data: failedDocuments }] = await Promise.all([
    supabase
      .from("notion_connections")
      .select(
        "id, organization_id, notion_workspace_id, notion_workspace_name, notion_workspace_icon, bot_id, status, last_synced_at, last_error, connected_by, disconnected_at, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .neq("status", "disconnected")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sync_jobs")
      .select("id, organization_id, connection_id, requested_by, job_type, status, celery_task_id, total_items, processed_items, failed_items, skipped_items, error_code, error_message, started_at, completed_at, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(14),
    supabase
      .from("documents")
      .select("sync_status")
      .eq("organization_id", organizationId)
      .limit(2000),
    supabase
      .from("documents")
      .select("id, title, sync_status, last_error, last_indexed_at, updated_at")
      .eq("organization_id", organizationId)
      .eq("sync_status", "failed")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const notionConnection = (connection as NotionConnection | null) ?? null;
  const syncJobs = (jobs ?? []) as SyncJob[];
  const documentRows = (documents ?? []) as Pick<Document, "sync_status">[];
  const failedDocumentRows = (failedDocuments ?? []) as Pick<Document, "id" | "title" | "sync_status" | "last_error" | "last_indexed_at" | "updated_at">[];
  const activeJob = syncJobs.find((job) => job.status === "queued" || job.status === "running");
  const latestJob = syncJobs[0];
  const latestSummary = latestJob ? summarizeSyncJob(latestJob) : null;
  const canSync = notionConnection?.status === "connected" && !activeJob;
  const documentCounts = documentStatusCounts(documentRows);
  const failedJobs = syncJobs.filter((job) => job.status === "failed").length;
  const succeededJobs = syncJobs.filter((job) => job.status === "succeeded").length;

  const metrics = [
    {
      label: "Sync state",
      value: activeStatusLabel(activeJob),
      helper: latestJob ? `Latest job ${latestJob.status}` : "No sync jobs yet",
      icon: RefreshCw,
      color: activeJob ? "text-blue-200" : "text-slate-300",
    },
    {
      label: "Indexed pages",
      value: String(documentCounts.indexed),
      helper: `${documentCounts.failed} failed, ${documentCounts.pending + documentCounts.syncing} waiting`,
      icon: Database,
      color: "text-emerald-200",
    },
    {
      label: "Job success",
      value: syncJobs.length ? `${Math.round((succeededJobs / syncJobs.length) * 100)}%` : "--",
      helper: `${succeededJobs} succeeded, ${failedJobs} failed`,
      icon: CheckCircle2,
      color: "text-blue-200",
    },
    {
      label: "Latest duration",
      value: latestSummary ? formatDuration(latestSummary.durationMs) : "--",
      helper: latestSummary ? `${latestSummary.completionRate}% completion` : "Run a sync to measure time",
      icon: Clock3,
      color: "text-amber-200",
    },
  ];

  return (
    <AppShell title="Sync Activity" description="Start manual Notion synchronization, track durable jobs, and inspect safe sync errors.">
      <div className="space-y-6">
        <section className="glass-panel rounded-lg p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`glass-soft rounded px-2 py-1 text-xs font-semibold capitalize ${notionConnection?.status === "connected" ? "text-emerald-200" : "text-rose-200"}`}>
                  {notionConnection?.status ?? "not connected"}
                </span>
                {activeJob ? <span className="rounded bg-blue-400/10 px-2 py-1 text-xs font-semibold text-blue-200">{activeJob.status}</span> : null}
              </div>
              <h2 className="mt-3 font-outfit text-2xl font-semibold">
                {notionConnection?.status === "connected" ? notionConnection.notion_workspace_name : "Notion is not connected"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {notionConnection?.status === "connected"
                  ? `Last workspace sync: ${formatDate(notionConnection.last_synced_at)}`
                  : "Connect Notion from settings before starting synchronization."}
              </p>
              {notionConnection?.last_error ? <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{notionConnection.last_error}</p> : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SyncNowButton action={syncNotionNowAction} disabled={!canSync} />
              <Link href="/app/settings" className="glass-soft inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-200 transition hover:border-white/20">
                <Link2 size={15} aria-hidden="true" />
                Manage connection
              </Link>
            </div>
          </div>
          {activeJob ? (
            <div className="mt-5 rounded-lg border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-100">
              Sync is {activeJob.status}. {activeJob.total_items > 0 ? `${summarizeSyncJob(activeJob).completionRate}% complete.` : "Kora is discovering workspace pages."}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="glass-panel rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                  <p className="mt-4 font-mono text-3xl font-semibold text-white">{metric.value}</p>
                </div>
                <metric.icon className={metric.color} size={22} aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{metric.helper}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <article className="glass-panel rounded-lg p-6">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Job history</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold">Synchronization timeline</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-500">{syncJobs.length} recent job{syncJobs.length === 1 ? "" : "s"}</p>
                <ClearSyncHistoryButton action={clearSyncHistoryAction} disabled={syncJobs.length === 0} />
              </div>
            </div>

            {syncJobs.length === 0 ? (
              <DashboardEmptyState
                title="No sync jobs yet"
                description="Click Sync now after connecting Notion. Kora will discover shared pages and store normalized documents for this organization."
              />
            ) : (
              <div className="space-y-3">
                {syncJobs.map((job) => {
                  const summary = summarizeSyncJob(job);
                  return (
                    <article key={job.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-sm text-white">{job.id.slice(0, 8)}</p>
                            <span className={`glass-soft rounded px-2 py-1 text-xs capitalize ${syncStatusTone(job.status)}`}>{job.status}</span>
                            <span className="glass-soft rounded px-2 py-1 text-xs text-slate-300 capitalize">{job.job_type}</span>
                            {job.error_code ? <span className="rounded bg-rose-500/15 px-2 py-1 text-xs text-rose-200">{job.error_code}</span> : null}
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                            <div className={`h-full rounded-full ${job.status === "failed" ? "bg-rose-300" : "bg-blue-300"}`} style={{ width: `${summary.completionRate}%` }} />
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-4">
                            <span>{summary.processedItems}/{summary.totalItems || summary.completedItems} processed</span>
                            <span>{summary.skippedItems} unchanged</span>
                            <span>{summary.failedItems} failed</span>
                            <span>{formatDuration(summary.durationMs)}</span>
                          </div>
                          {job.error_message ? <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{job.error_message}</p> : null}
                          <p className="mt-3 text-xs text-slate-500">Started {formatDate(job.started_at)} / Completed {formatDate(job.completed_at)}</p>
                        </div>
                        {job.status === "failed" ? <RetrySyncButton jobId={job.id} action={retryNotionSyncAction} /> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>

          <aside className="space-y-6">
            <section className="glass-panel rounded-lg p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Document state</p>
              <h2 className="mt-2 font-outfit text-2xl font-semibold">Indexing health</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {Object.entries(documentCounts).map(([status, count]) => (
                  <div key={status} className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                    <p className="text-xs capitalize text-slate-500">{status}</p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-white">{count}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Failed pages</p>
                  <h2 className="mt-2 font-outfit text-2xl font-semibold">Needs review</h2>
                </div>
                <FileWarning className="text-amber-200" size={22} aria-hidden="true" />
              </div>
              {failedDocumentRows.length === 0 ? (
                <p className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">No failed indexed pages right now.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {failedDocumentRows.map((document) => (
                    <Link key={document.id} href={`/app/knowledge/${document.id}`} className="block rounded-lg border border-white/10 bg-white/[0.025] p-4 transition-premium hover:border-white/25">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-1 shrink-0 text-rose-200" size={16} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-white">{document.title}</p>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-rose-100">{document.last_error ?? "Open details to review the latest indexing state."}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-panel rounded-lg p-6">
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-1 text-blue-200" size={18} aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Retry guidance</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Retry failed jobs after fixing connection, embedding, or permission errors. Re-index individual failed documents from Knowledge when only one page needs attention.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}