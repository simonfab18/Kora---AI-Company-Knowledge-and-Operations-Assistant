import type { AnswerConfidence, DocumentStatus, KnowledgeGapStatus, MessageFeedbackRating, SyncJobStatus } from "@/lib/database.types";

export type OverviewHealthInput = {
  connectionReady: boolean;
  documentCounts: Record<DocumentStatus, number>;
  answerCounts: Record<AnswerConfidence, number>;
  openGapCount: number;
};

export function overviewWeakAnswerRate(answerCounts: Record<AnswerConfidence, number>) {
  const total = Object.values(answerCounts).reduce((sum, count) => sum + count, 0);
  if (!total) return 0;
  return Math.round(((answerCounts.low + answerCounts.insufficient) / total) * 100);
}

export function overviewHelpfulRate(feedbackRatings: MessageFeedbackRating[]) {
  if (feedbackRatings.length === 0) return null;
  const helpful = feedbackRatings.filter((rating) => rating === "helpful").length;
  return Math.round((helpful / feedbackRatings.length) * 100);
}

export function countAnswers(confidences: Array<AnswerConfidence | null>) {
  const counts: Record<AnswerConfidence, number> = {
    high: 0,
    medium: 0,
    low: 0,
    insufficient: 0,
  };

  for (const confidence of confidences) {
    if (confidence) counts[confidence] += 1;
  }

  return counts;
}

export function countKnowledgeGapStatuses(statuses: KnowledgeGapStatus[]) {
  return statuses.reduce(
    (counts, status) => {
      counts[status] += 1;
      return counts;
    },
    {
      open: 0,
      reviewing: 0,
      resolved: 0,
      dismissed: 0,
    } satisfies Record<KnowledgeGapStatus, number>,
  );
}

export function overviewHealthScore(input: OverviewHealthInput) {
  let score = 0;

  if (input.connectionReady) score += 20;
  if (input.documentCounts.indexed > 0) score += 25;
  if (input.documentCounts.failed === 0) score += 15;

  const weakRate = overviewWeakAnswerRate(input.answerCounts);
  if (weakRate <= 10) score += 20;
  else if (weakRate <= 30) score += 10;

  if (input.openGapCount === 0) score += 20;
  else if (input.openGapCount <= 3) score += 10;

  return Math.min(100, score);
}

export function syncStatusLabel(status: SyncJobStatus | null) {
  if (!status) return "No sync yet";
  if (status === "succeeded") return "Healthy";
  if (status === "failed") return "Needs review";
  if (status === "queued") return "Queued";
  if (status === "running") return "Running";
  return "Cancelled";
}
