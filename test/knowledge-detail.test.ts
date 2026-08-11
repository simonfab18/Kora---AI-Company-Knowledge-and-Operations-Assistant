import { describe, expect, it } from "vitest";
import { assessKnowledgeDocument, documentStatusTone, summarizeDocumentChunks } from "@/lib/knowledge-detail";

describe("knowledge document detail helpers", () => {
  it("summarizes chunk counts, tokens, headings, and embedding models", () => {
    const summary = summarizeDocumentChunks([
      { token_count: 100, embedding_model: "model-a", heading_path: ["Install"] },
      { token_count: 140, embedding_model: "model-a", heading_path: [] },
      { token_count: 60, embedding_model: "model-b", heading_path: ["Install", "Torque"] },
    ]);

    expect(summary).toEqual({
      chunkCount: 3,
      totalTokens: 300,
      averageTokens: 100,
      embeddingModels: ["model-a", "model-b"],
      headingCount: 2,
    });
  });

  it("marks indexed documents with chunks as retrieval ready", () => {
    expect(
      assessKnowledgeDocument(
        {
          sync_status: "indexed",
          is_archived: false,
          last_error: null,
          last_indexed_at: "2026-07-25T00:00:00.000Z",
        },
        4,
      ),
    ).toMatchObject({ status: "ready", label: "Retrieval ready" });
  });

  it("flags failed or unchunked documents as needing attention", () => {
    expect(
      assessKnowledgeDocument(
        {
          sync_status: "failed",
          is_archived: false,
          last_error: "Embedding failed",
          last_indexed_at: null,
        },
        0,
      ),
    ).toMatchObject({ status: "blocked", label: "Needs attention" });
  });

  it("maps document status to dashboard text tones", () => {
    expect(documentStatusTone("indexed")).toBe("text-emerald-200");
    expect(documentStatusTone("failed")).toBe("text-rose-200");
    expect(documentStatusTone("archived")).toBe("text-amber-200");
    expect(documentStatusTone("syncing")).toBe("text-blue-200");
  });
});
