import { describe, expect, it } from "vitest";
import { excerptText, summarizeConversations } from "@/lib/conversation-summary";

describe("conversation summaries", () => {
  it("summarizes message counts, confidence, citations, and feedback by conversation", () => {
    const summaries = summarizeConversations({
      messages: [
        {
          id: "m1",
          conversation_id: "c1",
          role: "user",
          content: "How do I install a tire?",
          confidence: null,
          created_at: "2026-07-25T01:00:00.000Z",
        },
        {
          id: "m2",
          conversation_id: "c1",
          role: "assistant",
          content: "Use the standard installation steps.",
          confidence: "medium",
          created_at: "2026-07-25T01:01:00.000Z",
        },
        {
          id: "m3",
          conversation_id: "c1",
          role: "assistant",
          content: "I do not have enough context.",
          confidence: "insufficient",
          created_at: "2026-07-25T01:02:00.000Z",
        },
      ],
      citationMessageIds: ["m2", "m2"],
      feedback: [
        { message_id: "m2", rating: "helpful" },
        { message_id: "m3", rating: "not_helpful" },
      ],
    });

    expect(summaries.get("c1")).toMatchObject({
      messageCount: 3,
      assistantCount: 2,
      weakAnswerCount: 1,
      citationCount: 2,
      helpfulCount: 1,
      notHelpfulCount: 1,
      lastQuestion: "How do I install a tire?",
      lastAnswer: "I do not have enough context.",
      lastConfidence: "insufficient",
    });
  });

  it("compacts long previews without changing short text", () => {
    expect(excerptText("Short answer", 20)).toBe("Short answer");
    expect(excerptText("This is a long answer with many words", 16)).toBe("This is a long...");
    expect(excerptText(null)).toBeNull();
  });
});
