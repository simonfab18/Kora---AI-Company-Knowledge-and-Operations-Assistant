import { updateKnowledgeGapStatusAction } from "@/app/app/insights/actions";
import { AppShell } from "@/components/app-shell";
import { DashboardEmptyState } from "@/components/dashboard-states";
import { KnowledgeGapStatusForm } from "@/components/knowledge-gap-controls";
import { requireOrganizationManager } from "@/lib/authorization";
import type { KnowledgeGap } from "@/lib/database.types";
import { insightDateRange, latestSyncSummary } from "@/lib/insights";
import { loadInsightsSummary } from "@/lib/organization-summaries";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Database, FileText, MessageSquareText, Quote, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Insights" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function formatShortDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Unknown";
}

function reasonLabel(reason: KnowledgeGap["reason"]) {
  if (reason === "insufficient_context") return "Insufficient context";
  if (reason === "negative_feedback") return "Negative feedback";
  return "Low confidence";
}

function statusClass(status: KnowledgeGap["status"]) {
  if (status === "open") return "text-amber-200";
  if (status === "reviewing") return "text-blue-200";
  if (status === "resolved") return "text-emerald-200";
  return "text-slate-300";
}

function confidenceLabel(confidence: string) {
  if (confidence === "insufficient") return "Insufficient";
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}


type InsightsPageProps = {
  searchParams: Promise<{ range?: string; gapStatus?: string }>;
};

export default async function Page({ searchParams }: InsightsPageProps) {
  const params = await searchParams;
  const { membership } = await requireOrganizationManager();
  const organizationId = membership.organization.id;
  const range = insightDateRange(params.range);
  const gapStatus = params.gapStatus === "open" || params.gapStatus === "reviewing" || params.gapStatus === "resolved" || params.gapStatus === "dismissed" ? params.gapStatus : "all";

  const summary = await loadInsightsSummary({ organizationId, since: range.since, gapStatus });

  const gapRows = summary.recent_gaps;
  const questions = summary.top_questions;
  const quality = {
    ...summary.answer_quality,
    weakRate: summary.answer_quality.total ? Math.round((summary.answer_quality.weakCount / summary.answer_quality.total) * 100) : 0,
  };
  const sources = summary.top_sources;
  const feedbackCounts = summary.feedback_counts;
  const helpfulCount = feedbackCounts.helpful;
  const notHelpfulCount = feedbackCounts.not_helpful;
  const helpfulRate = feedbackCounts.total ? Math.round((helpfulCount / feedbackCounts.total) * 100) : 0;
  const documentCounts = summary.document_counts;
  const relatedDocuments = new Map(Object.entries(summary.related_documents));
  const recentSyncJobs = summary.recent_sync_jobs;
  const latestSync = latestSyncSummary(recentSyncJobs);
  const traceRows = summary.recent_traces;
  const openGaps = gapRows.filter((gap) => gap.status === "open" || gap.status === "reviewing");
  const resolvedGaps = gapRows.filter((gap) => gap.status === "resolved");
  const totalOccurrences = summary.gap_counts.occurrences ?? gapRows.reduce((total, gap) => total + gap.occurrence_count, 0);

  const questionTrend = summary.trends.questions;
  const weakAnswerTrend = summary.trends.weak_answers;
  const syncTrend = summary.trends.sync_wins;
  const feedbackTrend = summary.trends.not_helpful;
  const rangeOptions = [
    { href: "/app/insights?range=7d", label: "7 days", active: range.key === "7d" },
    { href: "/app/insights?range=30d", label: "30 days", active: range.key === "30d" },
    { href: "/app/insights?range=90d", label: "90 days", active: range.key === "90d" },
    { href: "/app/insights?range=all", label: "All", active: range.key === "all" },
  ];

  const gapStatusOptions = ["all", "open", "reviewing", "resolved", "dismissed"];
  const metrics = [
    {
      label: "Open gaps",
      value: String(openGaps.length),
      helper: "Questions needing documentation review",
      icon: AlertTriangle,
      color: "text-amber-200",
    },
    {
      label: "Weak answer rate",
      value: `${quality.weakRate}%`,
      helper: `${quality.weakCount} of ${quality.total} recent answers need stronger context`,
      icon: BarChart3,
      color: "text-rose-200",
    },
    {
      label: "Indexed pages",
      value: String(documentCounts.indexed),
      helper: `${documentCounts.failed} failed, ${documentCounts.pending + documentCounts.syncing} pending or syncing`,
      icon: Database,
      color: "text-blue-200",
    },
    {
      label: "Helpful rate",
      value: feedbackCounts.total ? `${helpfulRate}%` : "--",
      helper: `${helpfulCount} helpful, ${notHelpfulCount} not helpful`,
      icon: CheckCircle2,
      color: "text-emerald-200",
    },
    {
      label: "Resolved",
      value: String(resolvedGaps.length),
      helper: `${totalOccurrences} total gap occurrence${totalOccurrences === 1 ? "" : "s"} tracked`,
      icon: CheckCircle2,
      color: "text-emerald-200",
    },
  ];

  return (
    <AppShell title="Insights" description="See what employees ask, which sources Kora trusts, and where documentation needs attention.">
      <div className="space-y-6">
        <section className="glass-strong rounded-lg p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Analytics window</p>
              <h2 className="mt-2 font-outfit text-2xl font-semibold text-white">{range.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Filter usage, gaps, answer quality, cited pages, and sync health without leaving the dashboard.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {rangeOptions.map((option) => (
                <Link key={option.href} href={option.href} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-premium ${option.active ? "border-blue-300/40 bg-blue-400/15 text-blue-100" : "border-white/10 bg-white/[0.025] text-slate-300 hover:border-white/25"}`}>
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {gapStatusOptions.map((status) => {
              const href = `/app/insights?range=${range.key}&gapStatus=${status}`;
              const active = gapStatus === status;
              return (
                <Link key={status} href={href} className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-premium ${active ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/25 hover:text-white"}`}>
                  {status === "all" ? "All gaps" : status}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Question trend", rows: questionTrend, valueKey: "total", icon: MessageSquareText, helper: "Questions asked per day", barClass: "bg-blue-300/80" },
            { label: "Weak answers", rows: weakAnswerTrend, valueKey: "weak", icon: AlertTriangle, helper: "Low or insufficient answers", barClass: "bg-rose-300/80" },
            { label: "Sync wins", rows: syncTrend, valueKey: "succeeded", icon: RefreshCw, helper: "Successful sync jobs", barClass: "bg-emerald-300/80" },
            { label: "Not helpful", rows: feedbackTrend, valueKey: "weak", icon: Activity, helper: "Negative feedback by day", barClass: "bg-amber-300/80" },
          ].map((trend) => {
            const values = trend.rows.map((row) => Number(row[trend.valueKey as "total" | "weak" | "succeeded"]));
            const max = Math.max(1, ...values);
            const hasActivity = values.some((value) => value > 0);
            const total = values.reduce((sum, value) => sum + value, 0);
            const Icon = trend.icon;

            return (
              <article key={trend.label} className="glass-panel rounded-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{trend.label}</p>
                    <p className="mt-2 text-sm text-slate-400">{trend.helper}</p>
                  </div>
                  <Icon className="text-blue-200" size={20} aria-hidden="true" />
                </div>
                {hasActivity ? (
                  <>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>Latest 7 days</span>
                      <span className="font-mono text-slate-300">{total} total</span>
                    </div>
                    <div
                      className="mt-3 grid h-28 grid-cols-7 gap-2"
                      aria-label={trend.label + ": " + trend.rows.map((row) => row.label + " " + Number(row[trend.valueKey as "total" | "weak" | "succeeded"])).join(", ")}
                    >
                      {trend.rows.map((row) => {
                        const value = Number(row[trend.valueKey as "total" | "weak" | "succeeded"]);
                        const height = value ? Math.max(12, Math.round((value / max) * 82)) : 3;

                        return (
                          <div key={row.label} className="flex min-w-0 flex-col items-center gap-2">
                            <div className="relative flex min-h-0 w-full flex-1 items-end justify-center overflow-hidden rounded bg-white/[0.025]" title={row.label + ": " + value}>
                              {value > 0 ? <span className="absolute top-1 z-10 font-mono text-[10px] text-white">{value}</span> : null}
                              <div className={"w-3/5 rounded-t " + trend.barClass} style={{ height: String(height) + "%" }} />
                            </div>
                            <span className="text-[10px] text-slate-500" title={row.label}>{row.shortLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="mt-5 flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.025] px-4 text-center">
                    <p className="text-xs font-medium text-slate-400">No activity in the latest 7 days</p>
                    <p className="mt-1 text-[11px] text-slate-600">This chart will populate when matching events are recorded.</p>
                  </div>
                )}
              </article>
            );
          })}
        </section>
        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="glass-panel rounded-lg p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Answer quality</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold text-white">Confidence trend</h2>
              </div>
              <Sparkles className="text-blue-200" size={22} aria-hidden="true" />
            </div>
            <div className="space-y-4">
              {Object.entries(quality.counts).map(([confidence, count]) => {
                const width = quality.total ? Math.max(4, Math.round((count / quality.total) * 100)) : 0;

                return (
                  <div key={confidence}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-200">{confidenceLabel(confidence)}</span>
                      <span className="font-mono text-slate-400">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-blue-300" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Average response time: {quality.averageLatencyMs ? `${(quality.averageLatencyMs / 1000).toFixed(1)}s` : "Not enough data yet"}
            </p>
          </article>

          <article className="glass-panel rounded-lg p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Sync health</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold text-white">Workspace indexing</h2>
              </div>
              <RefreshCw className="text-blue-200" size={22} aria-hidden="true" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(documentCounts).map(([status, count]) => (
                <div key={status} className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-xs capitalize text-slate-500">{status}</p>
                  <p className="mt-2 font-mono text-2xl font-semibold text-white">{count}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest sync</p>
              {latestSync ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold capitalize text-white">{latestSync.status}</p>
                    <p className="text-sm text-slate-400">Started {formatShortDate(latestSync.created_at)}</p>
                  </div>
                  <p className="text-sm text-slate-500">Completed {formatShortDate(latestSync.completed_at)}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">No sync jobs recorded yet.</p>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="glass-panel rounded-lg p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Questions</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold text-white">Top asked</h2>
              </div>
              <MessageSquareText className="text-blue-200" size={22} aria-hidden="true" />
            </div>
            {questions.length === 0 ? (
              <p className="text-sm text-slate-400">Questions will appear after employees start using Ask AI.</p>
            ) : (
              <div className="kora-scroll-panel max-h-[520px] space-y-3 overflow-y-auto pr-2">
                {questions.map((question, index) => (
                  <div key={`${question.question}-${question.lastAskedAt}`} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-sm text-blue-300">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-6 text-white">{question.question}</p>
                        <p className="mt-2 text-xs text-slate-500">Asked {question.count}x / Last asked {formatShortDate(question.lastAskedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="glass-panel rounded-lg p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Sources</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold text-white">Most cited</h2>
              </div>
              <Quote className="text-blue-200" size={22} aria-hidden="true" />
            </div>
            {sources.length === 0 ? (
              <p className="text-sm text-slate-400">Cited sources will appear after Kora answers with grounded references.</p>
            ) : (
              <div className="kora-scroll-panel max-h-[520px] space-y-3 overflow-y-auto pr-2">
                {sources.map((source) => (
                  <div key={source.documentId} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-1 shrink-0 text-blue-200" size={18} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{source.title}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {source.citationCount} citation{source.citationCount === 1 ? "" : "s"}
                          {source.averageSimilarity ? ` / ${Math.round(source.averageSimilarity * 100)}% average match` : ""}
                        </p>
                        {source.sourceUrl ? (
                          <a className="mt-3 inline-flex text-xs font-semibold text-blue-300 transition-premium hover:text-white" href={source.sourceUrl} target="_blank" rel="noreferrer">
                            Open source
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="glass-panel rounded-lg p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Answer diagnostics</p>
              <h2 className="mt-2 font-outfit text-2xl font-semibold text-white">Recent grounded answers</h2>
              <p className="mt-2 text-sm text-slate-400">Admin-only traces show answer mode, validation, model, prompt version, and response time.</p>
            </div>
            <Sparkles className="text-blue-200" size={22} aria-hidden="true" />
          </div>
          {traceRows.length === 0 ? (
            <p className="text-sm text-slate-400">Diagnostics will appear after the next Ask AI response.</p>
          ) : (
            <div className="kora-scroll-panel max-h-[480px] space-y-3 overflow-y-auto pr-2">
              {traceRows.map((trace) => {
                const validationPassed = Object.values(trace.validation_status ?? {}).every(Boolean);
                return (
                  <article key={trace.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded bg-blue-400/10 px-2 py-1 font-semibold capitalize text-blue-100">{trace.answer_mode.replaceAll("_", " ")}</span>
                      <span className="rounded bg-white/5 px-2 py-1 capitalize text-slate-300">{trace.retrieval_confidence} confidence</span>
                      <span className={validationPassed ? "rounded bg-emerald-400/10 px-2 py-1 font-semibold text-emerald-100" : "rounded bg-rose-400/10 px-2 py-1 font-semibold text-rose-100"}>{validationPassed ? "Validated" : "Review needed"}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white">{trace.question}</p>
                    <p className="mt-2 text-xs text-slate-500">{trace.model ?? "No model call"} / {trace.prompt_version} / {trace.latency_ms ? (trace.latency_ms / 1000).toFixed(1) + "s" : "No latency"} / {formatShortDate(trace.created_at)}</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        {gapRows.length === 0 ? (
          <DashboardEmptyState
            title="No knowledge gaps yet"
            description="When Kora cannot answer confidently, the question will appear here so admins can improve the workspace docs."
          />
        ) : (
          <section className="glass-panel rounded-lg p-6">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Knowledge gaps</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold">Documentation improvement queue</h2>
              </div>
              <p className="text-sm text-slate-500">{gapRows.length} recent gap{gapRows.length === 1 ? "" : "s"}</p>
            </div>

            <div className="kora-scroll-panel max-h-[760px] space-y-3 overflow-y-auto pr-2">
              {gapRows.map((gap) => (
                <article key={gap.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                  <div className="grid gap-4 xl:grid-cols-[1fr_270px] xl:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`glass-soft rounded px-2 py-1 text-xs capitalize ${statusClass(gap.status)}`}>{gap.status}</span>
                        <span className="glass-soft rounded px-2 py-1 text-xs text-slate-300">{reasonLabel(gap.reason)}</span>
                        <span className="rounded bg-white/5 px-2 py-1 font-mono text-xs text-slate-400">{gap.occurrence_count}x</span>
                        {gap.confidence ? <span className="rounded bg-white/5 px-2 py-1 text-xs capitalize text-slate-400">{gap.confidence}</span> : null}
                      </div>
                      <p className="mt-3 text-base font-semibold leading-7 text-white">{gap.representative_question}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Missing topic</p>
                          <p className="mt-2 text-sm font-medium text-slate-200">{gap.missing_topic || "Topic needs review"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Related source</p>
                          {gap.related_document_id && relatedDocuments.get(gap.related_document_id) ? (
                            <a className="mt-2 block truncate text-sm font-semibold text-blue-300 hover:text-white" href={relatedDocuments.get(gap.related_document_id)?.source_url ?? `/app/knowledge/${gap.related_document_id}`} target={relatedDocuments.get(gap.related_document_id)?.source_url ? "_blank" : undefined} rel="noreferrer">
                              {relatedDocuments.get(gap.related_document_id)?.title ?? "Open source"}
                            </a>
                          ) : (
                            <p className="mt-2 text-sm text-slate-400">No nearby source captured.</p>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        First seen {formatDate(gap.first_seen_at)} / Last seen {formatDate(gap.last_seen_at)}
                      </p>
                      {gap.resolution_notes ? <p className="mt-3 rounded-lg border border-emerald-400/15 bg-emerald-400/10 p-3 text-sm text-emerald-100">{gap.resolution_notes}</p> : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                      {gap.status !== "reviewing" && gap.status !== "resolved" && gap.status !== "dismissed" ? (
                        <KnowledgeGapStatusForm gapId={gap.id} status="reviewing" action={updateKnowledgeGapStatusAction} />
                      ) : null}
                      {gap.status !== "resolved" ? <KnowledgeGapStatusForm gapId={gap.id} status="resolved" action={updateKnowledgeGapStatusAction} /> : null}
                      {gap.status !== "dismissed" ? <KnowledgeGapStatusForm gapId={gap.id} status="dismissed" action={updateKnowledgeGapStatusAction} /> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
