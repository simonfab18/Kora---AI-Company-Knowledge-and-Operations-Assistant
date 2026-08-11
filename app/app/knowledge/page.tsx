import { reindexDocumentAction } from "@/app/app/knowledge/actions";
import { AppShell } from "@/components/app-shell";
import { DashboardEmptyState } from "@/components/dashboard-states";
import { ReindexDocumentButton } from "@/components/knowledge-controls";
import { KnowledgeCollectionsRow, type KnowledgeCollectionCard } from "@/components/knowledge-collections-row";
import { requireOrganizationManager } from "@/lib/authorization";
import type { Document, DocumentStatus } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { ExternalLink, FileText, Search, X } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;
const statusOptions: Array<"all" | DocumentStatus> = ["all", "indexed", "failed", "archived", "pending", "syncing"];

type KnowledgePageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string; collection?: string }>;
};

type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
};

type AssignmentRow = {
  collection_id: string;
  document_id: string;
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function parsePage(value: string | undefined) {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function parseStatus(value: string | undefined): "all" | DocumentStatus {
  return statusOptions.includes(value as "all" | DocumentStatus)
    ? (value as "all" | DocumentStatus)
    : "all";
}

function knowledgeHref({ page, query, status, collectionId }: { page?: number; query: string; status: string; collectionId?: string }) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status !== "all") params.set("status", status);
  if (collectionId) params.set("collection", collectionId);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/app/knowledge?${qs}` : "/app/knowledge";
}

function statusClass(status: DocumentStatus) {
  if (status === "indexed") return "text-emerald-200";
  if (status === "failed") return "text-rose-200";
  if (status === "archived") return "text-amber-200";
  return "text-blue-200";
}

function matchesCollectionSearch(collection: CollectionRow, query: string) {
  if (!query) return true;
  const search = query.toLowerCase();
  return collection.name.toLowerCase().includes(search) || (collection.description ?? "").toLowerCase().includes(search);
}

export default async function Page({ searchParams }: KnowledgePageProps) {
  const [{ membership }, params] = await Promise.all([requireOrganizationManager(), searchParams]);
  const query = (params.q ?? "").trim();
  const status = parseStatus(params.status);
  const selectedCollectionId = (params.collection ?? "").trim();
  const page = parsePage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const organizationId = membership.organization.id;

  const supabase = await createClient();
  const [{ data: collectionData }, assignmentResult] = await Promise.all([
    supabase
      .from("knowledge_collections")
      .select("id, name, description, visibility, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("knowledge_collection_documents")
      .select("collection_id, document_id")
      .eq("organization_id", organizationId)
      .limit(10000),
  ]);

  const collectionRows = ((collectionData ?? []) as CollectionRow[]).filter((collection) => matchesCollectionSearch(collection, query));
  const assignments = (assignmentResult.data ?? []) as AssignmentRow[];
  const documentCountByCollection = new Map<string, number>();
  const selectedCollectionDocumentIds: string[] = [];

  for (const assignment of assignments) {
    documentCountByCollection.set(assignment.collection_id, (documentCountByCollection.get(assignment.collection_id) ?? 0) + 1);
    if (assignment.collection_id === selectedCollectionId) {
      selectedCollectionDocumentIds.push(assignment.document_id);
    }
  }

  const selectedCollection = ((collectionData ?? []) as CollectionRow[]).find((collection) => collection.id === selectedCollectionId) ?? null;
  const collectionCards: KnowledgeCollectionCard[] = collectionRows.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    visibility: collection.visibility,
    documentCount: documentCountByCollection.get(collection.id) ?? 0,
    href: knowledgeHref({ query, status, collectionId: collection.id }),
    active: collection.id === selectedCollectionId,
  }));

  let documentRows: Document[] = [];
  let totalCount = 0;

  if (!selectedCollectionId || selectedCollectionDocumentIds.length > 0) {
    let request = supabase
      .from("documents")
      .select("id, organization_id, connection_id, source_type, external_id, parent_external_id, title, source_url, normalized_content, content_hash, metadata, source_created_at, source_updated_at, last_indexed_at, sync_status, is_archived, last_error, created_at, updated_at", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("source_updated_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (selectedCollectionId) {
      request = request.in("id", selectedCollectionDocumentIds);
    }

    if (query) {
      request = request.ilike("title", `%${query}%`);
    }

    if (status !== "all") {
      request = request.eq("sync_status", status);
    }

    const { data: documents, count } = await request;
    documentRows = (documents ?? []) as Document[];
    totalCount = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const emptyTitle = selectedCollection ? "No pages in this folder match" : "No documents match";
  const emptyDescription = selectedCollection
    ? "Try a different search or assign indexed documents to this collection."
    : "Try a different title search or status filter. If this workspace has not synced yet, run Sync now from Sync Activity.";

  return (
    <AppShell title="Knowledge" description="Search synchronized Notion pages, inspect status, and open document details.">
      <div className="space-y-6">
        <section className="glass-panel rounded-lg p-6">
          <form className="grid gap-3 xl:grid-cols-[1fr_220px_auto] xl:items-end">
            {selectedCollectionId ? <input type="hidden" name="collection" value={selectedCollectionId} /> : null}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search folders and pages</span>
              <span className="glass-soft flex h-11 items-center gap-2 rounded-lg px-3 text-sm text-slate-400">
                <Search size={16} aria-hidden="true" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Find a folder or Notion page"
                  className="w-full bg-transparent text-white outline-none placeholder:text-slate-600"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
              <select name="status" defaultValue={status} className="glass-soft h-11 w-full rounded-lg px-3 text-sm text-white outline-none">
                {statusOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#111] capitalize">
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <button className="h-11 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200" type="submit">
              Apply filters
            </button>
          </form>
        </section>

        <KnowledgeCollectionsRow collections={collectionCards} manageHref="/app/collections/new" />

        {selectedCollection ? (
          <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Open folder</p>
              <h2 className="mt-1 font-outfit text-xl font-semibold text-white">{selectedCollection.name}</h2>
            </div>
            <Link href={knowledgeHref({ query, status })} className="glass-soft inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-200 hover:text-white">
              <X size={16} aria-hidden="true" />
              Show all pages
            </Link>
          </div>
        ) : null}

        {documentRows.length === 0 ? (
          <DashboardEmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <section className="glass-panel rounded-lg p-6">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Documents</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold">{selectedCollection ? `${selectedCollection.name} pages` : "Synchronized Notion pages"}</h2>
              </div>
              <p className="text-sm text-slate-500">{totalCount} page{totalCount === 1 ? "" : "s"}</p>
            </div>
            <div className="space-y-3">
              {documentRows.map((document) => (
                <article key={document.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                  <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText size={16} className="text-blue-300" aria-hidden="true" />
                        <Link href={`/app/knowledge/${document.id}`} className="truncate font-semibold text-white hover:text-blue-200">
                          {document.title}
                        </Link>
                        <span className={`glass-soft rounded px-2 py-1 text-xs capitalize ${statusClass(document.sync_status)}`}>{document.sync_status}</span>
                        {document.is_archived ? <span className="rounded bg-amber-500/15 px-2 py-1 text-xs text-amber-200">Archived</span> : null}
                        {document.last_error ? <span className="rounded bg-rose-500/15 px-2 py-1 text-xs text-rose-200">Error</span> : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {document.normalized_content.replace(/^#\s+/, "").slice(0, 220)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">Source updated {formatDate(document.source_updated_at)} / Indexed {formatDate(document.last_indexed_at)}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                      <Link href={`/app/knowledge/${document.id}`} className="glass-soft inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-slate-200">
                        Details
                      </Link>
                      {document.source_url ? (
                        <a href={document.source_url} target="_blank" rel="noreferrer" className="glass-soft inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-200">
                          <ExternalLink size={15} aria-hidden="true" />
                          Source
                        </a>
                      ) : null}
                      <ReindexDocumentButton documentId={document.id} action={reindexDocumentAction} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Link aria-disabled={page <= 1} href={knowledgeHref({ page: Math.max(1, page - 1), query, status, collectionId: selectedCollectionId })} className={`glass-soft rounded-lg px-3 py-2 text-sm font-semibold ${page <= 1 ? "pointer-events-none opacity-40" : "text-slate-200"}`}>
                  Previous
                </Link>
                <Link aria-disabled={page >= totalPages} href={knowledgeHref({ page: Math.min(totalPages, page + 1), query, status, collectionId: selectedCollectionId })} className={`glass-soft rounded-lg px-3 py-2 text-sm font-semibold ${page >= totalPages ? "pointer-events-none opacity-40" : "text-slate-200"}`}>
                  Next
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}