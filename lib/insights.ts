import type { AnswerConfidence, DocumentStatus, SyncJobStatus } from "@/lib/database.types";

export type InsightQuestionMessage = {
  content: string;
  created_at: string;
};

export type InsightAssistantMessage = {
  confidence: AnswerConfidence | null;
  latency_ms: number | null;
};

export type InsightCitation = {
  document_id: string;
  title: string;
  source_url: string | null;
  similarity_score: number | null;
};

export type InsightDocument = {
  sync_status: DocumentStatus;
};

export type InsightSyncJob = {
  status: SyncJobStatus;
  created_at: string;
  completed_at: string | null;
};

export function normalizeInsightQuestion(question: string) {
  return question
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 220);
}

export function topAskedQuestions(messages: InsightQuestionMessage[], limit = 5) {
  const grouped = new Map<string, { question: string; count: number; lastAskedAt: string }>();

  for (const message of messages) {
    const key = normalizeInsightQuestion(message.content);

    if (!key) continue;

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        question: message.content.trim(),
        count: 1,
        lastAskedAt: message.created_at,
      });
      continue;
    }

    existing.count += 1;

    if (new Date(message.created_at).getTime() > new Date(existing.lastAskedAt).getTime()) {
      existing.lastAskedAt = message.created_at;
      existing.question = message.content.trim();
    }
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.count - left.count || new Date(right.lastAskedAt).getTime() - new Date(left.lastAskedAt).getTime())
    .slice(0, limit);
}

export function answerQuality(messages: InsightAssistantMessage[]) {
  const counts: Record<AnswerConfidence, number> = {
    high: 0,
    medium: 0,
    low: 0,
    insufficient: 0,
  };
  let latencyTotal = 0;
  let latencyCount = 0;

  for (const message of messages) {
    if (message.confidence) {
      counts[message.confidence] += 1;
    }

    if (typeof message.latency_ms === "number") {
      latencyTotal += message.latency_ms;
      latencyCount += 1;
    }
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const weakCount = counts.low + counts.insufficient;

  return {
    counts,
    total,
    weakCount,
    weakRate: total ? Math.round((weakCount / total) * 100) : 0,
    averageLatencyMs: latencyCount ? Math.round(latencyTotal / latencyCount) : null,
  };
}

export function topCitedSources(citations: InsightCitation[], limit = 5) {
  const grouped = new Map<
    string,
    {
      documentId: string;
      title: string;
      sourceUrl: string | null;
      citationCount: number;
      similarityTotal: number;
      similarityCount: number;
    }
  >();

  for (const citation of citations) {
    const existing =
      grouped.get(citation.document_id) ??
      {
        documentId: citation.document_id,
        title: citation.title || "Untitled source",
        sourceUrl: citation.source_url,
        citationCount: 0,
        similarityTotal: 0,
        similarityCount: 0,
      };

    existing.citationCount += 1;

    if (typeof citation.similarity_score === "number") {
      existing.similarityTotal += citation.similarity_score;
      existing.similarityCount += 1;
    }

    grouped.set(citation.document_id, existing);
  }

  return Array.from(grouped.values())
    .map((source) => ({
      documentId: source.documentId,
      title: source.title,
      sourceUrl: source.sourceUrl,
      citationCount: source.citationCount,
      averageSimilarity: source.similarityCount ? source.similarityTotal / source.similarityCount : null,
    }))
    .sort((left, right) => right.citationCount - left.citationCount || (right.averageSimilarity ?? 0) - (left.averageSimilarity ?? 0))
    .slice(0, limit);
}

export function documentStatusCounts(documents: InsightDocument[]) {
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

export function latestSyncSummary(syncJobs: InsightSyncJob[]) {
  const [latest] = [...syncJobs].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

  return latest ?? null;
}

export type DateRangeKey = "7d" | "30d" | "90d" | "all";

export function insightDateRange(range: string | undefined, now = new Date()) {
  const key: DateRangeKey = range === "7d" || range === "90d" || range === "all" ? range : "30d";

  if (key === "all") {
    return { key, label: "All time", since: null as string | null };
  }

  const days = key === "7d" ? 7 : key === "90d" ? 90 : 30;
  const since = new Date(now);
  since.setDate(since.getDate() - days);
  return { key, label: `Last ${days} days`, since: since.toISOString() };
}

export type TrendInput = {
  created_at: string;
  weak?: boolean;
  succeeded?: boolean;
};

export function dailyTrend(rows: TrendInput[], days = 7, now = new Date()) {
  const buckets = new Map<string, { label: string; shortLabel: string; total: number; weak: number; succeeded: number }>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      shortLabel: date.toLocaleDateString(undefined, { day: "numeric" }),
      total: 0,
      weak: 0,
      succeeded: 0,
    });
  }

  for (const row of rows) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.total += 1;
    if (row.weak) bucket.weak += 1;
    if (row.succeeded) bucket.succeeded += 1;
  }

  return Array.from(buckets.values());
}