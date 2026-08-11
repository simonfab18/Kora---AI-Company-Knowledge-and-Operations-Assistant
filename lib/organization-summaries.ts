import type { AnswerConfidence, Document, DocumentStatus, KnowledgeGap, MessageFeedbackRating, NotionConnection, SyncJob } from "@/lib/database.types";
import { getCachedOrganizationSummary } from "@/lib/organization-summary-cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type DocumentStatusCounts = Record<DocumentStatus, number> & { total?: number };
export type AnswerCounts = Record<AnswerConfidence, number> & { total?: number };
export type GapCounts = Record<"open" | "reviewing" | "resolved" | "dismissed", number> & { total?: number; occurrences?: number };
export type FeedbackCounts = Record<MessageFeedbackRating, number> & { total: number };

export type TrendBucket = {
  label: string;
  shortLabel: string;
  total: number;
  weak: number;
  succeeded: number;
};

export type OverviewSummary = {
  connection: Pick<NotionConnection, "id" | "organization_id" | "notion_workspace_name" | "status" | "last_synced_at" | "last_error" | "updated_at"> | null;
  document_counts: DocumentStatusCounts;
  answer_counts: AnswerCounts;
  gap_counts: GapCounts;
  feedback_counts: FeedbackCounts;
  citation_count: number;
  active_member_count: number;
  latest_sync: SyncJob | null;
  recent_sync_jobs: SyncJob[];
  recent_failed_documents: Pick<Document, "id" | "title" | "sync_status" | "last_error" | "last_indexed_at" | "updated_at">[];
};

export type InsightsSummary = {
  top_questions: Array<{ question: string; count: number; lastAskedAt: string }>;
  answer_quality: {
    counts: AnswerCounts;
    total: number;
    weakCount: number;
    averageLatencyMs: number | null;
  };
  document_counts: DocumentStatusCounts;
  top_sources: Array<{ documentId: string; title: string; sourceUrl: string | null; citationCount: number; averageSimilarity: number | null }>;
  feedback_counts: FeedbackCounts;
  gap_counts: GapCounts;
  recent_gaps: KnowledgeGap[];
  recent_sync_jobs: Pick<SyncJob, "id" | "job_type" | "status" | "total_items" | "processed_items" | "failed_items" | "skipped_items" | "error_message" | "created_at" | "started_at" | "completed_at">[];
  recent_traces: Array<{
    id: string;
    question: string;
    answer_mode: string;
    retrieval_confidence: string;
    model: string | null;
    prompt_version: string;
    latency_ms: number | null;
    validation_status: Record<string, boolean>;
    created_at: string;
  }>;
  related_documents: Record<string, Pick<Document, "id" | "title" | "source_url" | "sync_status">>;
  trends: {
    questions: TrendBucket[];
    weak_answers: TrendBucket[];
    sync_wins: TrendBucket[];
    not_helpful: TrendBucket[];
  };
};

const emptyDocumentCounts: DocumentStatusCounts = { pending: 0, syncing: 0, indexed: 0, failed: 0, archived: 0, total: 0 };
const emptyAnswerCounts: AnswerCounts = { high: 0, medium: 0, low: 0, insufficient: 0, total: 0 };
const emptyGapCounts: GapCounts = { open: 0, reviewing: 0, resolved: 0, dismissed: 0, total: 0, occurrences: 0 };
const emptyFeedbackCounts: FeedbackCounts = { helpful: 0, not_helpful: 0, total: 0 };

function asObject<T>(value: unknown, fallback: T): T {
  return value && typeof value === "object" ? (value as T) : fallback;
}

export async function loadOverviewSummary(organizationId: string) {
  return getCachedOrganizationSummary<OverviewSummary>({
    organizationId,
    namespace: "overview:v1",
    ttlSeconds: 30,
    loader: async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc("get_organization_overview_summary", { p_organization_id: organizationId });
      if (error) throw new Error(`Could not load overview summary: ${error.message}`);
      const summary = asObject<Partial<OverviewSummary>>(data, {});
      return {
        connection: summary.connection ?? null,
        document_counts: { ...emptyDocumentCounts, ...summary.document_counts },
        answer_counts: { ...emptyAnswerCounts, ...summary.answer_counts },
        gap_counts: { ...emptyGapCounts, ...summary.gap_counts },
        feedback_counts: { ...emptyFeedbackCounts, ...summary.feedback_counts },
        citation_count: Number(summary.citation_count ?? 0),
        active_member_count: Number(summary.active_member_count ?? 0),
        latest_sync: summary.latest_sync ?? null,
        recent_sync_jobs: summary.recent_sync_jobs ?? [],
        recent_failed_documents: summary.recent_failed_documents ?? [],
      };
    },
  });
}

export async function loadInsightsSummary(input: { organizationId: string; since: string | null; gapStatus: string }) {
  return getCachedOrganizationSummary<InsightsSummary>({
    organizationId: input.organizationId,
    namespace: `insights:v1:${input.since ?? "all"}:${input.gapStatus}`,
    ttlSeconds: 30,
    loader: async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc("get_organization_insights_summary", {
        p_organization_id: input.organizationId,
        p_since: input.since,
        p_gap_status: input.gapStatus,
        p_limit: 20,
      });
      if (error) throw new Error(`Could not load insights summary: ${error.message}`);
      const summary = asObject<Partial<InsightsSummary>>(data, {});
      return {
        top_questions: summary.top_questions ?? [],
        answer_quality: {
          counts: { ...emptyAnswerCounts, ...summary.answer_quality?.counts },
          total: Number(summary.answer_quality?.total ?? 0),
          weakCount: Number(summary.answer_quality?.weakCount ?? 0),
          averageLatencyMs: summary.answer_quality?.averageLatencyMs ?? null,
        },
        document_counts: { ...emptyDocumentCounts, ...summary.document_counts },
        top_sources: summary.top_sources ?? [],
        feedback_counts: { ...emptyFeedbackCounts, ...summary.feedback_counts },
        gap_counts: { ...emptyGapCounts, ...summary.gap_counts },
        recent_gaps: summary.recent_gaps ?? [],
        recent_sync_jobs: summary.recent_sync_jobs ?? [],
        recent_traces: summary.recent_traces ?? [],
        related_documents: summary.related_documents ?? {},
        trends: {
          questions: summary.trends?.questions ?? [],
          weak_answers: summary.trends?.weak_answers ?? [],
          sync_wins: summary.trends?.sync_wins ?? [],
          not_helpful: summary.trends?.not_helpful ?? [],
        },
      };
    },
  });
}