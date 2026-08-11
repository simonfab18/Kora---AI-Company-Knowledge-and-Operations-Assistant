import { searchDocumentChunks, type RetrievedChunk } from "@/lib/document-indexing";
import type { ChatOrganization } from "@/lib/grounded-chat";
import { rewriteRetrievalQueries } from "@/lib/rag-quality";
import { createAdminClient } from "@/lib/supabase/admin";

type KeywordChunk = Omit<RetrievedChunk, "similarity"> & { keyword_score: number };

function normalizeKeywordScores(chunks: KeywordChunk[]) {
  const max = Math.max(0, ...chunks.map((chunk) => chunk.keyword_score));
  return chunks.map((chunk) => ({ ...chunk, keyword_score: max > 0 ? chunk.keyword_score / max : 0 }));
}

export function mergeHybridChunks(vectorChunks: RetrievedChunk[], keywordChunks: KeywordChunk[]) {
  const merged = new Map<string, RetrievedChunk>();
  for (const chunk of vectorChunks) merged.set(chunk.chunk_id, { ...chunk, keyword_score: chunk.keyword_score ?? 0 });
  for (const chunk of normalizeKeywordScores(keywordChunks)) {
    const existing = merged.get(chunk.chunk_id);
    merged.set(chunk.chunk_id, existing ? { ...existing, keyword_score: Math.max(existing.keyword_score ?? 0, chunk.keyword_score) } : { ...chunk, similarity: 0 });
  }
  return [...merged.values()];
}

async function searchKeywordChunks(organizationId: string, queries: string[]) {
  const supabase = createAdminClient();
  const results = await Promise.all(queries.map((query) => supabase.rpc("search_document_chunks_keyword", {
    p_organization_id: organizationId,
    p_query: query,
    p_match_count: 12,
  })));
  const chunks: KeywordChunk[] = [];
  for (const result of results) {
    if (result.error) throw result.error;
    chunks.push(...((result.data ?? []) as KeywordChunk[]));
  }
  return chunks;
}

export async function hydrateNeighborContext(organizationId: string, chunks: RetrievedChunk[]) {
  if (chunks.length === 0) return chunks;
  const supabase = createAdminClient();
  const documentIds = Array.from(new Set(chunks.map((chunk) => chunk.document_id)));
  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, chunk_index, content, documents!inner(organization_id, sync_status, is_archived)")
    .eq("organization_id", organizationId)
    .eq("documents.organization_id", organizationId)
    .eq("documents.sync_status", "indexed")
    .eq("documents.is_archived", false)
    .in("document_id", documentIds)
    .order("chunk_index", { ascending: true })
    .limit(300);
  if (error) throw error;

  const rows = (data ?? []) as Array<{ id: string; document_id: string; chunk_index: number; content: string }>;
  const indexById = new Map(rows.map((row) => [row.id, row]));
  return chunks.map((chunk) => {
    const selected = indexById.get(chunk.chunk_id);
    if (!selected) return chunk;
    const neighborContent = rows
      .filter((row) => row.document_id === selected.document_id && Math.abs(row.chunk_index - selected.chunk_index) === 1)
      .slice(0, 2)
      .map((row) => row.content);
    return { ...chunk, neighbor_content: neighborContent };
  });
}

export async function searchHybridDocumentChunks({ organization, question }: { organization: ChatOrganization; question: string }) {
  const rewrittenQueries = rewriteRetrievalQueries(question);
  const [vectorChunks, keywordChunks] = await Promise.all([
    searchDocumentChunks({ organization, query: question, matchCount: 14 }),
    searchKeywordChunks(organization.id, rewrittenQueries),
  ]);
  return { rewrittenQueries, chunks: mergeHybridChunks(vectorChunks, keywordChunks) };
}

