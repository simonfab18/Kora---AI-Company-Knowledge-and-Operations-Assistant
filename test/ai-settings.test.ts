import { normalizeAiSettings, parseRetrievalThresholdPercent, retrievalThresholdTone } from "@/lib/ai-settings";
import { describe, expect, it } from "vitest";

describe("AI settings helpers", () => {
  it("accepts safe retrieval threshold percentages", () => {
    expect(parseRetrievalThresholdPercent("50")).toEqual({ ok: true, value: 0.5 });
    expect(parseRetrievalThresholdPercent("85")).toEqual({ ok: true, value: 0.85 });
  });

  it("rejects invalid or unsafe retrieval thresholds", () => {
    expect(parseRetrievalThresholdPercent("not-a-number").ok).toBe(false);
    expect(parseRetrievalThresholdPercent("10").ok).toBe(false);
    expect(parseRetrievalThresholdPercent("95").ok).toBe(false);
  });

  it("labels threshold posture for managers", () => {
    expect(retrievalThresholdTone(0.35).label).toBe("Flexible");
    expect(retrievalThresholdTone(0.5).label).toBe("Balanced");
    expect(retrievalThresholdTone(0.75).label).toBe("Strict");
  });

  it("normalizes missing AI settings to valid workspace defaults", () => {
    expect(normalizeAiSettings(undefined)).toEqual({
      aiProvider: "gemini",
      generationModel: "gemini-flash-latest",
      embeddingProvider: "gemini",
      embeddingModel: "gemini-embedding-001",
      embeddingDimension: 1536,
      retrievalThreshold: 0.5,
    });
  });

  it("trims model values and clamps invalid display thresholds", () => {
    expect(normalizeAiSettings({
      ai_provider: " gemini ",
      generation_model: " gemini-flash-latest ",
      embedding_provider: "gemini",
      embedding_model: "gemini-embedding-001",
      embedding_dimension: "1536",
      retrieval_threshold: 4,
    })).toMatchObject({
      aiProvider: "gemini",
      generationModel: "gemini-flash-latest",
      embeddingDimension: 1536,
      retrievalThreshold: 0.85,
    });
  });
});
