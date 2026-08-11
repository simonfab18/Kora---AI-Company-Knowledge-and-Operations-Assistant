import { chunkDocumentContent } from "@/lib/chunking";
import { createEmbeddingProvider, configuredEmbeddingModelId, vectorToSql } from "@/lib/embeddings";
import type { Document, Organization } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type IndexingStats = {
  chunkCount: number;
  embeddingModel: string;
};

export type RetrievedChunk = {
  chunk_id: string;
  document_id: string;
  title: string;
  source_url: string | null;
  content: string;
  heading_path: string[];
  metadata: Record<string, unknown>;
  similarity: number;
  keyword_score?: number;
  reranker_score?: number;
  neighbor_content?: string[];
};

type IndexableDocument = Pick<
  Document,
  "id" | "organization_id" | "title" | "source_url" | "normalized_content" | "content_hash" | "sync_status" | "is_archived"
>;

type EmbeddingOrganization = Pick<
  Organization,
  "id" | "embedding_provider" | "embedding_model" | "embedding_dimension" | "retrieval_threshold"
>;

function ensureIndexable(document: IndexableDocument) {
  if (document.sync_status !== "indexed" || document.is_archived) {
    throw new Error("Only active indexed documents can be embedded.");
  }
}

export async function indexDocumentChunks(
  document: IndexableDocument,
  organization: EmbeddingOrganization,
): Promise<IndexingStats> {
  ensureIndexable(document);
  const chunks = chunkDocumentContent(document.normalized_content);
  const embeddingProvider = createEmbeddingProvider({
    provider: organization.embedding_provider,
    model: organization.embedding_model,
    dimension: organization.embedding_dimension,
  });
  const embeddingModel = configuredEmbeddingModelId({
    provider: embeddingProvider.provider,
    model: embeddingProvider.model,
    dimension: embeddingProvider.dimension,
  });

  const batch = await embeddingProvider.embedBatch(chunks.map((chunk) => chunk.content));
  const rows = chunks.map((chunk, index) => ({
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    content_hash: chunk.contentHash,
    token_count: chunk.tokenCount,
    heading_path: chunk.headingPath,
    metadata: {
      document_title: document.title,
      document_content_hash: document.content_hash,
      source_url: document.source_url,
    },
    embedding_model: embeddingModel,
    embedding: vectorToSql(batch.embeddings[index]),
  }));

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("replace_document_chunks", {
    p_organization_id: organization.id,
    p_document_id: document.id,
    p_chunks: rows,
  });

  if (error) {
    throw error;
  }

  await supabase.from("usage_events").insert({
    organization_id: organization.id,
    event_type: "embedding",
    quantity: chunks.length,
    provider: embeddingProvider.provider,
    model: embeddingProvider.model,
    metadata: {
      document_id: document.id,
      embedding_model: embeddingModel,
      chunk_count: chunks.length,
      input_tokens: batch.usage?.inputTokens ?? null,
      total_tokens: batch.usage?.totalTokens ?? null,
    },
  });

  return { chunkCount: chunks.length, embeddingModel };
}

export async function indexDocumentById(documentId: string, organizationId: string): Promise<IndexingStats> {
  const supabase = createAdminClient();
  const [{ data: document, error: documentError }, { data: organization, error: organizationError }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, organization_id, title, source_url, normalized_content, content_hash, sync_status, is_archived")
      .eq("id", documentId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("id, embedding_provider, embedding_model, embedding_dimension, retrieval_threshold")
      .eq("id", organizationId)
      .maybeSingle(),
  ]);

  if (documentError || !document) {
    throw documentError ?? new Error("Document was not found for indexing.");
  }
  if (organizationError || !organization) {
    throw organizationError ?? new Error("Organization embedding settings were not found.");
  }

  return indexDocumentChunks(document as IndexableDocument, organization as EmbeddingOrganization);
}

export function effectiveRetrievalThreshold(organization: Pick<EmbeddingOrganization, "embedding_provider" | "retrieval_threshold">) {
  return organization.retrieval_threshold;
}

export async function searchDocumentChunks({
  organization,
  query,
  matchCount = 8,
  minSimilarity,
}: {
  organization: EmbeddingOrganization;
  query: string;
  matchCount?: number;
  minSimilarity?: number;
}): Promise<RetrievedChunk[]> {
  const embeddingProvider = createEmbeddingProvider({
    provider: organization.embedding_provider,
    model: organization.embedding_model,
    dimension: organization.embedding_dimension,
  });
  const embeddingModel = configuredEmbeddingModelId({
    provider: embeddingProvider.provider,
    model: embeddingProvider.model,
    dimension: embeddingProvider.dimension,
  });
  const batch = await embeddingProvider.embedBatch([query]);
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_document_chunks", {
    p_organization_id: organization.id,
    p_query_embedding: vectorToSql(batch.embeddings[0]),
    p_embedding_model: embeddingModel,
    p_match_count: matchCount,
    p_min_similarity: minSimilarity ?? effectiveRetrievalThreshold(organization),
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as RetrievedChunk[];
}