import { describe, expect, it } from "vitest";
import { countAnswers, countKnowledgeGapStatuses, overviewHealthScore, overviewHelpfulRate, overviewWeakAnswerRate, syncStatusLabel } from "@/lib/overview-summary";

describe("overview summary helpers", () => {
  it("counts answer confidence and weak answer rate", () => {
    const counts = countAnswers(["high", "medium", "low", "insufficient", null]);

    expect(counts).toEqual({
      high: 1,
      medium: 1,
      low: 1,
      insufficient: 1,
    });
    expect(overviewWeakAnswerRate(counts)).toBe(50);
  });

  it("calculates helpful feedback rate", () => {
    expect(overviewHelpfulRate([])).toBeNull();
    expect(overviewHelpfulRate(["helpful", "helpful", "not_helpful"])).toBe(67);
  });

  it("counts knowledge gap statuses", () => {
    expect(countKnowledgeGapStatuses(["open", "open", "reviewing", "resolved", "dismissed"])).toEqual({
      open: 2,
      reviewing: 1,
      resolved: 1,
      dismissed: 1,
    });
  });

  it("scores workspace health from connection, documents, answer quality, and gaps", () => {
    expect(
      overviewHealthScore({
        connectionReady: true,
        documentCounts: { indexed: 4, failed: 0, pending: 0, syncing: 0, archived: 0 },
        answerCounts: { high: 8, medium: 2, low: 0, insufficient: 0 },
        openGapCount: 0,
      }),
    ).toBe(100);

    expect(
      overviewHealthScore({
        connectionReady: false,
        documentCounts: { indexed: 0, failed: 2, pending: 0, syncing: 0, archived: 0 },
        answerCounts: { high: 0, medium: 0, low: 4, insufficient: 2 },
        openGapCount: 7,
      }),
    ).toBe(0);
  });

  it("labels latest sync status for overview cards", () => {
    expect(syncStatusLabel(null)).toBe("No sync yet");
    expect(syncStatusLabel("succeeded")).toBe("Healthy");
    expect(syncStatusLabel("failed")).toBe("Needs review");
    expect(syncStatusLabel("running")).toBe("Running");
  });
});
