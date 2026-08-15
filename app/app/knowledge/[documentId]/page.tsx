import { reindexDocumentAction } from "@/app/app/knowledge/actions";
import { AppShell } from "@/components/app-shell";
import { ReindexDocumentButton } from "@/components/knowledge-controls";
import { requireOrganizationManager } from "@/lib/authorization";
import type { AnswerConfidence, Document, DocumentChunk, MessageCitation } from "@/lib/database.types";
import { assessKnowledgeDocument, documentStatusTone, summarizeDocumentChunks } from "@/lib/knowledge-detail";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, Database, ExternalLink, FileText, Hash, Layers3, Quote, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Knowledge document" };

type DocumentDetailPageProps = {
  params: Promise<{ documentId: string }>;
};

type CitationWithMessage = Pick<MessageCitation, "id" | "message_id" | "citation_order" | "quote_excerpt" | "similarity_score" | "created_at"> & {
  messages:
    | {
        content: string;
        confidence: AnswerConfidence | null;
        created_at: string;
      }
    | Array<{
        content: string;
        confidence: AnswerConfidence | null;
        created_at: string;
      }>
    | null;
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function messageForCitation(citation: CitationWithMessage) {
  return Array.isArray(citation.messages) ? citation.messages[0] : citation.messages;
}

function headingLabel(path: string[]) {
  return path.length > 0 ? path.join(" / ") : "Untitled section";
}

export default async function Page({ params }: DocumentDetailPageProps) {
  const [{ membership }, { documentId }] = await Promise.all([requireOrganizationManager(), params]);
  const supabase = createAdminClient();
  const organizationId = membership.organization.id;

  const [{ data }, { data: chunks }, { data: citations }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, organization_id, connection_id, source_type, external_id, parent_external_id, title, source_url, normalized_content, content_hash, metadata, source_created_at, source_updated_at, last_indexed_at, sync_status, is_archived, last_error, created_at, updated_at")
      .eq("id", documentId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("document_chunks")
      .select("id, organization_id, document_id, chunk_index, content, content_hash, token_count, heading_path, metadata, embedding_model, created_at")
      .eq("document_id", documentId)
      .eq("organization_id", organizationId)
      .order("chunk_index", { ascending: true })
      .limit(80),
    supabase
      .from("message_citations")
      .select("id, message_id, citation_order, quote_excerpt, similarity_score, created_at, messages(content, confidence, created_at)")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (!data) {
    notFound();
  }

  const document = data as Document;
  const chunkRows = (chunks ?? []) as DocumentChunk[];
  const citationRows = (citations ?? []) as CitationWithMessage[];
  const chunkSummary = summarizeDocumentChunks(chunkRows);
  const health = assessKnowledgeDocument(document, chunkSummary.chunkCount);
  const healthIcon = health.status === "ready" ? ShieldCheck : TriangleAlert;
  const HealthIcon = healthIcon;

  const metrics = [
    {
      label: "Chunks",
      value: formatNumber(chunkSummary.chunkCount),
      helper: `${formatNumber(chunkSummary.totalTokens)} estimated tokens`,
      icon: Layers3,
    },
    {
      label: "Average size",
      value: formatNumber(chunkSummary.averageTokens),
      helper: "Tokens per chunk",
      icon: Database,
    },
    {
      label: "Headed chunks",
      value: formatNumber(chunkSummary.headingCount),
      helper: "Chunks with section context",
      icon: FileText,
    },
    {
      label: "Citations",
      value: formatNumber(citationRows.length),
      helper: "Recent answers using this source",
      icon: Quote,
    },
  ];

  return (
    <AppShell title="Document Detail" description="Inspect synchronized Notion content, retrieval chunks, citations, and indexing state.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/app/knowledge" className="glass-soft inline-flex h-10 w-fit items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-200">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Knowledge
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row">
            {document.source_url ? (
              <a href={document.source_url} target="_blank" rel="noreferrer" className="glass-soft inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-200">
                <ExternalLink size={15} aria-hidden="true" />
                Open Notion source
              </a>
            ) : null}
            <ReindexDocumentButton documentId={document.id} action={reindexDocumentAction} />
          </div>
        </div>

        <section className="glass-strong rounded-lg p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`glass-soft rounded px-2 py-1 text-xs font-semibold capitalize ${documentStatusTone(document.sync_status)}`}>{document.sync_status}</span>
                {document.is_archived ? <span className="rounded bg-amber-500/15 px-2 py-1 text-xs text-amber-200">Archived</span> : null}
                <span className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400">{document.source_type.replace("_", " ")}</span>
              </div>
              <h2 className="mt-4 font-outfit text-3xl font-semibold leading-tight md:text-4xl">{document.title}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                Source updated {formatDate(document.source_updated_at)} / Indexed {formatDate(document.last_indexed_at)}
              </p>
              {document.last_error ? <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{document.last_error}</p> : null}
            </div>
            <aside className={`rounded-lg border p-4 ${health.status === "ready" ? "border-emerald-300/20 bg-emerald-400/10" : "border-amber-300/20 bg-amber-400/10"}`}>
              <div className="flex items-center gap-3">
                <HealthIcon className={health.status === "ready" ? "text-emerald-200" : "text-amber-200"} size={22} aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Retrieval health</p>
                  <p className="mt-1 font-semibold text-white">{health.label}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                {health.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="glass-panel rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                  <p className="mt-4 font-mono text-3xl font-semibold text-white">{metric.value}</p>
                </div>
                <metric.icon className="text-blue-200" size={22} aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{metric.helper}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <article className="glass-panel rounded-lg p-6">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Retrieval chunks</p>
                <h3 className="mt-2 font-outfit text-2xl font-semibold">What Kora can search</h3>
              </div>
              <p className="text-sm text-slate-500">Embedding model: {chunkSummary.embeddingModels.join(", ") || "Unknown"}</p>
            </div>
            {chunkRows.length === 0 ? (
              <p className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">No chunks are stored yet. Re-index this document after checking sync health.</p>
            ) : (
              <div className="kora-scroll-panel max-h-[760px] space-y-3 overflow-y-auto pr-2">
                {chunkRows.map((chunk) => (
                  <article key={chunk.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Chunk {chunk.chunk_index + 1}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{headingLabel(chunk.heading_path)}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="rounded bg-white/5 px-2 py-1 font-mono">{chunk.token_count} tokens</span>
                        <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-1 font-mono">
                          <Hash size={11} aria-hidden="true" /> {chunk.content_hash.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{chunk.content}</p>
                  </article>
                ))}
              </div>
            )}
          </article>

          <aside className="space-y-6">
            <section className="glass-panel rounded-lg p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Source usage</p>
              <h3 className="mt-2 font-outfit text-2xl font-semibold">Recent citations</h3>
              {citationRows.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-slate-400">Kora has not cited this document in a saved answer yet.</p>
              ) : (
                <div className="kora-scroll-panel mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-2">
                  {citationRows.map((citation) => {
                    const message = messageForCitation(citation);
                    return (
                      <article key={citation.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-blue-400/10 px-2 py-1 text-xs font-semibold text-blue-200">Source {citation.citation_order}</span>
                          {citation.similarity_score ? <span className="rounded bg-white/5 px-2 py-1 font-mono text-xs text-slate-400">{Math.round(citation.similarity_score * 100)}% match</span> : null}
                          {message?.confidence ? <span className="rounded bg-white/5 px-2 py-1 text-xs capitalize text-slate-400">{message.confidence}</span> : null}
                        </div>
                        {citation.quote_excerpt ? <p className="mt-3 text-sm leading-6 text-slate-300">{citation.quote_excerpt}</p> : null}
                        {message?.content ? <p className="mt-3 line-clamp-3 border-t border-white/10 pt-3 text-xs leading-5 text-slate-500">Answer: {message.content}</p> : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="glass-panel rounded-lg p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Metadata</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-xs text-slate-500">Content hash</p>
                  <p className="mt-2 truncate font-mono text-xs text-white">{document.content_hash}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-xs text-slate-500">External ID</p>
                  <p className="mt-2 truncate font-mono text-xs text-white">{document.external_id}</p>
                </div>
              </div>
              <pre className="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-4 font-mono text-xs leading-5 text-slate-300">
                {JSON.stringify(document.metadata, null, 2)}
              </pre>
            </section>
          </aside>
        </section>

        <section className="glass-panel rounded-lg p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Normalized content</p>
          <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-4 font-mono text-sm leading-6 text-slate-200">
            {document.normalized_content}
          </pre>
        </section>
      </div>
    </AppShell>
  );
}
