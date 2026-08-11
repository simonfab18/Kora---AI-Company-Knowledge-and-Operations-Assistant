import type { Document, DocumentChunk, DocumentStatus } from "@/lib/database.types";

export type KnowledgeDocumentHealth = {
  status: "ready" | "warning" | "blocked";
  label: string;
  reasons: string[];
};

export function summarizeDocumentChunks(chunks: Pick<DocumentChunk, "token_count" | "embedding_model" | "heading_path">[]) {
  const totalTokens = chunks.reduce((total, chunk) => total + chunk.token_count, 0);
  const embeddingModels = Array.from(new Set(chunks.map((chunk) => chunk.embedding_model))).sort();
  const headingCount = chunks.filter((chunk) => chunk.heading_path.length > 0).length;

  return {
    chunkCount: chunks.length,
    totalTokens,
    averageTokens: chunks.length ? Math.round(totalTokens / chunks.length) : 0,
    embeddingModels,
    headingCount,
  };
}

export function documentStatusTone(status: DocumentStatus) {
  if (status === "indexed") return "text-emerald-200";
  if (status === "failed") return "text-rose-200";
  if (status === "archived") return "text-amber-200";
  return "text-blue-200";
}

export function assessKnowledgeDocument(document: Pick<Document, "sync_status" | "is_archived" | "last_error" | "last_indexed_at">, chunkCount: number): KnowledgeDocumentHealth {
  const reasons: string[] = [];

  if (document.is_archived) {
    reasons.push("This Notion page is archived and should not be used for fresh answers.");
  }

  if (document.sync_status !== "indexed") {
    reasons.push(`Document status is ${document.sync_status}.`);
  }

  if (document.last_error) {
    reasons.push("The latest sync or indexing attempt saved an error.");
  }

  if (!document.last_indexed_at) {
    reasons.push("The document has not recorded a successful indexing time.");
  }

  if (chunkCount === 0) {
    reasons.push("No retrievable chunks are stored for this document.");
  }

  if (reasons.length === 0) {
    return {
      status: "ready",
      label: "Retrieval ready",
      reasons: ["Kora can retrieve this document when a matching question is asked."],
    };
  }

  return {
    status: document.sync_status === "failed" || chunkCount === 0 ? "blocked" : "warning",
    label: document.sync_status === "failed" || chunkCount === 0 ? "Needs attention" : "Review suggested",
    reasons,
  };
}
