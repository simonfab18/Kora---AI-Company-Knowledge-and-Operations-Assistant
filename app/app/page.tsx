import { AppShell } from "@/components/app-shell";
import { loadDailyAiUsage } from "@/lib/ai-usage";
import { requireActiveOrganization } from "@/lib/authorization";
import type { OnboardingProgress } from "@/lib/database.types";
import { safeStepForRole } from "@/lib/onboarding";
import { overviewHealthScore, overviewWeakAnswerRate, syncStatusLabel } from "@/lib/overview-summary";
import { loadOverviewSummary } from "@/lib/organization-summaries";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDuration, summarizeSyncJob, syncStatusTone } from "@/lib/sync-summary";
import { Activity, AlertTriangle, CheckCircle2, Database, FileText, MessageSquareText, RefreshCw, Sparkles, ThumbsUp, Users } from "lucide-react";
import Link from "next/link";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function formatShortDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Unknown";
}

function healthTone(score: number) {
  if (score >= 80) return "text-emerald-200";
  if (score >= 55) return "text-blue-200";
  if (score >= 35) return "text-amber-200";
  return "text-rose-200";
}

function ringDash(score: number) {
  const circumference = 289;
  return `${Math.round((score / 100) * circumference)} ${circumference}`;
}

export default async function AppOverviewPage() {
  const { user, membership } = await requireActiveOrganization();
  const canManage = membership.role === "owner" || membership.role === "admin";
  const supabase = createAdminClient();
  const organizationId = membership.organization.id;

  const [summary, { data: onboardingProgress }, dailyUsage] = await Promise.all([
    loadOverviewSummary(organizationId),
    supabase
      .from("onboarding_progress")
      .select("organization_id, user_id, current_step, completed_steps, skipped_steps, completed_at, updated_at")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle(),
    loadDailyAiUsage(organizationId, user.id),
  ]);

  const notionConnection = summary.connection;
  const documentCounts = summary.document_counts;
  const syncJobRows = summary.recent_sync_jobs;
  const latestSync = summary.latest_sync ?? syncJobRows[0] ?? null;
  const latestSyncSummary = latestSync ? summarizeSyncJob(latestSync) : null;
  const answerCounts = summary.answer_counts;
  const assistantAnswerCount = answerCounts.total ?? Object.values(answerCounts).reduce((total, count) => total + Number(count), 0);
  const weakRate = overviewWeakAnswerRate(answerCounts);
  const feedbackTotal = summary.feedback_counts.total;
  const helpfulRate = feedbackTotal ? Math.round((summary.feedback_counts.helpful / feedbackTotal) * 100) : null;
  const gapCounts = summary.gap_counts;
  const openGapCount = gapCounts.open + gapCounts.reviewing;
  const healthScore = overviewHealthScore({
    connectionReady: notionConnection?.status === "connected",
    documentCounts,
    answerCounts,
    openGapCount,
  });
  const recentFailedDocuments = summary.recent_failed_documents;
  const onboardingRow = onboardingProgress as OnboardingProgress | null;
  const onboardingComplete = Boolean(onboardingRow?.completed_at);
  const resumeStep = safeStepForRole(membership.role, onboardingRow?.current_step);
  const onboardingHref = `/onboarding/${resumeStep}`;

  const metrics = [
    {
      label: "Indexed pages",
      value: String(documentCounts.indexed),
      helper: `${documentCounts.failed} failed, ${documentCounts.pending + documentCounts.syncing} waiting`,
      icon: Database,
      href: "/app/knowledge",
      color: "text-emerald-200",
    },
    {
      label: "Questions answered",
      value: String(assistantAnswerCount),
      helper: `${weakRate}% weak answer rate`,
      icon: MessageSquareText,
      href: "/app/conversations",
      color: "text-blue-200",
    },
    {
      label: "Open gaps",
      value: String(openGapCount),
      helper: `${gapCounts.resolved} resolved, ${gapCounts.dismissed} dismissed`,
      icon: AlertTriangle,
      href: "/app/insights",
      color: openGapCount > 0 ? "text-amber-200" : "text-emerald-200",
    },
    {
      label: "Global AI cap",
      value: String(dailyUsage.globalRemaining),
      helper: `${dailyUsage.globalUsed}/${dailyUsage.globalLimit} workspace questions used today`,
      icon: Activity,
      href: "/app/insights",
      color: dailyUsage.globalRemaining > 10 ? "text-emerald-200" : "text-amber-200",
    },
    {
      label: "Helpful rate",
      value: helpfulRate === null ? "--" : `${helpfulRate}%`,
      helper: `${feedbackTotal} answer rating${feedbackTotal === 1 ? "" : "s"}`,
      icon: ThumbsUp,
      href: "/app/insights",
      color: "text-emerald-200",
    },
  ];

  const activity = [
    {
      title: latestSync ? `Latest sync ${latestSync.status}` : "No sync jobs yet",
      detail: latestSync ? `${latestSync.processed_items}/${latestSync.total_items || latestSync.processed_items + latestSync.failed_items + latestSync.skipped_items} processed` : "Connect Notion and run your first sync",
      value: latestSync ? formatShortDate(latestSync.completed_at ?? latestSync.created_at) : "Start",
      href: "/app/sync",
      icon: RefreshCw,
      color: latestSync ? syncStatusTone(latestSync.status) : "text-blue-200",
    },
    {
      title: `${documentCounts.indexed} pages indexed`,
      detail: recentFailedDocuments.length > 0 ? `${recentFailedDocuments.length} failed page${recentFailedDocuments.length === 1 ? "" : "s"} need review` : "Knowledge base is ready for retrieval",
      value: `${documentCounts.total ?? 0}`,
      href: "/app/knowledge",
      icon: FileText,
      color: documentCounts.failed > 0 ? "text-amber-200" : "text-emerald-200",
    },
    {
      title: `${openGapCount} open knowledge gaps`,
      detail: openGapCount > 0 ? "Review missing documentation from low-confidence answers" : "No open gap queue items",
      value: String(openGapCount),
      href: "/app/insights",
      icon: Sparkles,
      color: openGapCount > 0 ? "text-amber-200" : "text-emerald-200",
    },
    {
      title: `${summary.active_member_count} active member${summary.active_member_count === 1 ? "" : "s"}`,
      detail: canManage ? "Manage access from Members" : "Your active organization membership",
      value: membership.role,
      href: "/app/members",
      icon: Users,
      color: "text-blue-200",
    },
  ];

  return (
    <AppShell title="Overview" description="Live workspace health for knowledge coverage, sync status, questions, citations, and gaps.">
      {!onboardingComplete ? (
        <section className="mb-6 flex flex-col gap-4 rounded-lg border border-blue-300/25 bg-blue-400/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Setup is still available</p>
            <h2 className="mt-2 font-outfit text-xl font-semibold text-white">Continue personalizing your Kora workspace</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Your progress is saved. Resume at {resumeStep === "welcome" ? "the beginning" : resumeStep.replaceAll("-", " ")} whenever you are ready.
            </p>
          </div>
          <Link href={onboardingHref} className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200">
            Resume setup
          </Link>
        </section>
      ) : null}
      <section className="glass-strong mb-6 overflow-hidden rounded-lg p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_360px] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="glass-soft rounded px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{membership.role}</span>
              <span className={`glass-soft rounded px-2 py-1 text-xs font-semibold capitalize ${notionConnection?.status === "connected" ? "text-emerald-200" : "text-rose-200"}`}>
                {notionConnection?.status ?? "not connected"}
              </span>
            </div>
            <h2 className="mt-4 font-outfit text-4xl font-semibold leading-tight md:text-5xl">{membership.organization.name}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              {canManage
                ? "Admin overview for workspace knowledge health, sync readiness, employee questions, citations, feedback, and documentation gaps."
                : "Your workspace is ready for asking grounded questions and reviewing your saved conversations."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/ask" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200">
                <MessageSquareText size={15} aria-hidden="true" /> Ask Kora
              </Link>
              {canManage ? (
                <Link href="/app/sync" className="glass-soft inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-200">
                  <RefreshCw size={15} aria-hidden="true" /> Sync activity
                </Link>
              ) : null}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-40 w-40" role="img" aria-label={`Workspace health score ${healthScore}`}>
                <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(100,116,139,0.28)" strokeWidth="14" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" className={healthTone(healthScore)} strokeWidth="14" strokeDasharray={ringDash(healthScore)} strokeLinecap="round" transform="rotate(-90 60 60)" />
                <text x="60" y="57" textAnchor="middle" className="fill-white font-mono text-2xl font-semibold">{healthScore}</text>
                <text x="60" y="75" textAnchor="middle" className="fill-slate-500 text-[10px] uppercase tracking-[0.18em]">health</text>
              </svg>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="font-mono text-lg font-semibold">{syncStatusLabel(latestSync?.status ?? null)}</p>
                <p className="text-xs text-slate-500">Sync</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold">{summary.citation_count}</p>
                <p className="text-xs text-slate-500">Citations</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold">{latestSyncSummary ? formatDuration(latestSyncSummary.durationMs) : "--"}</p>
                <p className="text-xs text-slate-500">Latest run</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="glass-panel rounded-lg p-5 transition-premium hover:border-white/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                <p className="mt-4 font-mono text-3xl font-semibold text-white">{metric.value}</p>
              </div>
              <metric.icon className={metric.color} size={22} aria-hidden="true" />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{metric.helper}</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-strong rounded-lg p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Recent activity</p>
              <h2 className="mt-2 font-outfit text-2xl font-semibold">Workspace signals</h2>
            </div>
            <Link href="/app/insights" className="text-sm text-slate-500 hover:text-white">View insights</Link>
          </div>
          <div className="space-y-2">
            {activity.map((item) => (
              <Link key={item.title} href={item.href} className="flex items-center gap-4 rounded-lg p-3 transition duration-300 ease-premium hover:bg-white/[0.025]">
                <span className={`glass-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                  <p className="truncate text-xs text-slate-500">{item.detail}</p>
                </div>
                <p className="font-mono text-sm text-slate-300">{item.value}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">AI quality</p>
              <h2 className="mt-2 font-outfit text-2xl font-semibold">Answer confidence</h2>
            </div>
            <Activity className="text-blue-300" size={22} aria-hidden="true" />
          </div>
          <div className="mt-6 space-y-4">
            {Object.entries(answerCounts).map(([confidence, count]) => {
              const total = assistantAnswerCount || 1;
              const width = Math.max(assistantAnswerCount ? 4 : 0, Math.round((count / total) * 100));
              return (
                <div key={confidence}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-300">{confidence}</span>
                    <span className="font-mono text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-300" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className={weakRate <= 30 ? "text-emerald-200" : "text-amber-200"} size={18} aria-hidden="true" />
              <p className="text-sm leading-6 text-slate-400">
                {assistantAnswerCount === 0
                  ? "Ask Kora a question to start measuring answer confidence."
                  : `${weakRate}% of recent answers are low or insufficient confidence. Use Insights to close recurring gaps.`}
              </p>
            </div>
          </div>
        </article>
      </section>

      {recentFailedDocuments.length > 0 ? (
        <section className="mt-6 glass-panel rounded-lg p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Needs attention</p>
          <h2 className="mt-2 font-outfit text-2xl font-semibold">Failed documents</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recentFailedDocuments.map((document) => (
              <Link key={document.id} href={`/app/knowledge/${document.id}`} className="rounded-lg border border-white/10 bg-white/[0.025] p-4 transition-premium hover:border-white/25">
                <p className="line-clamp-2 text-sm font-semibold text-white">{document.title}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-rose-100">{document.last_error ?? "Open details to review the latest indexing state."}</p>
                <p className="mt-3 text-xs text-slate-500">Updated {formatDate(document.updated_at)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}