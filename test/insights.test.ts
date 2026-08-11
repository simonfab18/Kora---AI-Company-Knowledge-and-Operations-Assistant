import { describe, expect, it } from "vitest";
import { answerQuality, dailyTrend, documentStatusCounts, insightDateRange, latestSyncSummary, normalizeInsightQuestion, topAskedQuestions, topCitedSources } from "@/lib/insights";

describe("insights reporting helpers", () => {
  it("normalizes and groups repeated employee questions", () => {
    const questions = topAskedQuestions([
      { content: "How do I install a tire?", created_at: "2026-07-25T02:00:00.000Z" },
      { content: "how do i install a tire", created_at: "2026-07-25T03:00:00.000Z" },
      { content: "What tires do we sell?", created_at: "2026-07-25T04:00:00.000Z" },
    ]);

    expect(normalizeInsightQuestion(" How do I install a tire?! ")).toBe("how do i install a tire");
    expect(questions[0]).toMatchObject({
      question: "how do i install a tire",
      count: 2,
      lastAskedAt: "2026-07-25T03:00:00.000Z",
    });
  });

  it("calculates answer quality and response latency", () => {
    const quality = answerQuality([
      { confidence: "high", latency_ms: 1000 },
      { confidence: "medium", latency_ms: 2000 },
      { confidence: "low", latency_ms: 3000 },
      { confidence: "insufficient", latency_ms: null },
    ]);

    expect(quality.counts).toMatchObject({ high: 1, medium: 1, low: 1, insufficient: 1 });
    expect(quality.weakCount).toBe(2);
    expect(quality.weakRate).toBe(50);
    expect(quality.averageLatencyMs).toBe(2000);
  });

  it("ranks cited sources by citation count and average match", () => {
    const sources = topCitedSources([
      { document_id: "doc-a", title: "Install SOP", source_url: null, similarity_score: 0.6 },
      { document_id: "doc-b", title: "Sales Guide", source_url: "https://example.com", similarity_score: 0.8 },
      { document_id: "doc-a", title: "Install SOP", source_url: null, similarity_score: 0.7 },
    ]);

    expect(sources[0]).toMatchObject({
      documentId: "doc-a",
      title: "Install SOP",
      citationCount: 2,
      averageSimilarity: 0.6499999999999999,
    });
  });

  it("builds date ranges and daily trends", () => {
    const now = new Date("2026-07-25T00:00:00.000Z");

    expect(insightDateRange("7d", now)).toMatchObject({ key: "7d", label: "Last 7 days" });
    expect(insightDateRange("unknown", now)).toMatchObject({ key: "30d" });
    expect(dailyTrend([{ created_at: "2026-07-25T00:00:00.000Z", weak: true }], 2, now).at(-1)).toMatchObject({ total: 1, weak: 1 });
  });

  it("summarizes document status and latest sync job", () => {
    expect(
      documentStatusCounts([
        { sync_status: "indexed" },
        { sync_status: "indexed" },
        { sync_status: "failed" },
      ]),
    ).toMatchObject({ indexed: 2, failed: 1, pending: 0 });

    expect(
      latestSyncSummary([
        { status: "failed", created_at: "2026-07-25T01:00:00.000Z", completed_at: null },
        { status: "succeeded", created_at: "2026-07-25T02:00:00.000Z", completed_at: "2026-07-25T02:10:00.000Z" },
      ]),
    ).toMatchObject({ status: "succeeded" });
  });
});
