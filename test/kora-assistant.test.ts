import { describe, expect, it } from "vitest";
import {
  buildKoraProductPrompt,
  classifyAssistantLane,
  conversationalReply,
  formatKoraProductAnswer,
  KORA_PRODUCT_PROVIDER,
  retrieveKoraGuides,
} from "@/lib/kora-assistant";

describe("Kora assistant routing", () => {
  it("routes greetings and pleasantries away from workspace retrieval", () => {
    expect(classifyAssistantLane("Hi")).toBe("conversation");
    expect(classifyAssistantLane("Thank you so much!")).toBe("conversation");
    expect(classifyAssistantLane("Hi, how are you?")).toBe("conversation");
  });

  it("routes product setup and feature questions to Kora documentation", () => {
    expect(classifyAssistantLane("How do I connect Notion to Kora?")).toBe("product_help");
    expect(classifyAssistantLane("How do I create an account?")).toBe("product_help");
    expect(classifyAssistantLane("Where can I see collections?")).toBe("product_help");
  });

  it("keeps company-specific questions on the grounded workspace path", () => {
    expect(classifyAssistantLane("What is our refund approval policy?")).toBe("workspace_knowledge");
    expect(classifyAssistantLane("How are fleet accounts managed?")).toBe("workspace_knowledge");
  });

  it("keeps a short follow-up in the product-help lane", () => {
    expect(classifyAssistantLane("How do I do that?", [
      { role: "assistant", content: "Open Settings and connect Notion.", provider: KORA_PRODUCT_PROVIDER },
    ])).toBe("product_help");
  });

  it("does not let prior product help capture a new company-policy question", () => {
    expect(classifyAssistantLane("What is our refund policy?", [
      { role: "assistant", content: "Open Settings and connect Notion.", provider: KORA_PRODUCT_PROVIDER },
    ])).toBe("workspace_knowledge");
  });
});

describe("Kora product knowledge", () => {
  it("retrieves the relevant maintained guide", () => {
    const guides = retrieveKoraGuides("Why are my Notion pages not syncing?");
    expect(guides.some((guide) => guide.slug === "troubleshoot-notion-sync" || guide.slug === "sync-and-index-knowledge")).toBe(true);
  });

  it("builds a product prompt with explicit source boundaries", () => {
    const prompt = buildKoraProductPrompt("How do I connect Notion?", retrieveKoraGuides("connect Notion"));
    expect(prompt).toContain("Kora's product guide");
    expect(prompt).toContain("Do not answer private company-policy questions");
    expect(prompt).toContain("[K1]");
  });

  it("formats validated guide references as clickable documentation links", () => {
    const guides = retrieveKoraGuides("connect Notion");
    const result = formatKoraProductAnswer({
      answer: "Open Settings and authorize Notion. [K1]",
      answerMode: "fully_answerable",
      citationIds: ["K1"],
      followUpQuestion: null,
      suggestedFollowUps: [],
    }, guides);

    expect(result.answer).toContain("[1]");
    expect(result.answer).toContain(`/documentation/${guides[0].slug}`);
  });

  it("rejects guide IDs that were not supplied to the model", () => {
    const guides = retrieveKoraGuides("connect Notion");
    expect(() => formatKoraProductAnswer({
      answer: "Use an unavailable source. [K99]",
      answerMode: "fully_answerable",
      citationIds: ["K99"],
      followUpQuestion: null,
      suggestedFollowUps: [],
    }, guides)).toThrow(/unavailable Kora guide/i);
  });

  it("returns a natural greeting instead of an insufficient-context message", () => {
    expect(conversationalReply("hello")).toMatch(/I'm Kora/i);
    expect(conversationalReply("hello")).not.toMatch(/reliable answer|knowledge gap/i);
  });
});
