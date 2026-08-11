import { describe, expect, it } from "vitest";
import {
  analyzeQuestion,
  cleanGeneratedAnswer,
  extractInlineCitationIds,
  formatInlineCitations,
  normalizeSuggestedFollowUps,
  retrievalConfidence,
  rewriteRetrievalQueries,
} from "@/lib/rag-quality";
import type { CitationCandidate } from "@/lib/grounded-chat";

function candidate(citationId: string, documentId: string): CitationCandidate {
  return {
    citationId,
    chunk_id: "chunk-" + citationId,
    document_id: documentId,
    title: "Operations guide",
    source_url: null,
    content: "Use the approved workflow and confirm the result.",
    heading_path: ["Setup", "Verification"],
    metadata: {},
    similarity: 0.82,
    keyword_score: 0.7,
    reranker_score: 0.85,
  };
}

describe("RAG answer quality helpers", () => {
  it("analyzes and rewrites questions without domain-specific vocabulary", () => {
    expect(analyzeQuestion("How do I configure single sign-on?").intent).toBe("procedure");
    const queries = rewriteRetrievalQueries("What is the refund approval policy?");
    expect(queries.join(" ")).toContain("requirement");
    expect(queries.join(" ")).not.toContain("tire");
  });

  it("validates and formats inline source markers", () => {
    const citations = [candidate("C2", "doc-2"), candidate("C1", "doc-1")];
    expect(extractInlineCitationIds("Use this process [C2]. Confirm it [C1]. [C2]")).toEqual(["C2", "C1"]);
    expect(formatInlineCitations("Use this process [C2]. Confirm it [C1].", citations)).toBe("Use this process [1]. Confirm it [2].");
  });

  it("removes internal retrieval language from generated answers", () => {
    expect(cleanGeneratedAnswer("Based on the retrieved chunks, use the provided context.")).toBe(
      "Based on the company sources, use the company knowledge base.",
    );
  });

  it("uses composite evidence signals for confidence", () => {
    expect(retrievalConfidence({ vectorScore: 0.88, keywordScore: 0.8, rerankerScore: 0.9, sourceCount: 2, queryCoverage: 0.9 })).toBe("high");
    expect(retrievalConfidence({ vectorScore: 0, keywordScore: 0, rerankerScore: 0, sourceCount: 0, queryCoverage: 0 })).toBe("insufficient");
  });

  it("deduplicates and limits suggested follow-ups", () => {
    expect(normalizeSuggestedFollowUps(["Who approves this?", "Who approves this?", "What exceptions apply?", "Where is the form?", "A"]))
      .toEqual(["Who approves this?", "What exceptions apply?", "Where is the form?"]);
  });
});