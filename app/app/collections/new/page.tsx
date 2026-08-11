import { addDocumentToCollectionAction, createCollectionAction, deleteCollectionAction, removeDocumentFromCollectionAction, updateCollectionAction } from "@/app/app/utility-actions";
import { AppShell } from "@/components/app-shell";
import { CollectionCreateForm, CollectionDocumentManager, type CollectionManagerCollection, type CollectionManagerDocument } from "@/components/utility-forms";
import { requireOrganizationManager } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookOpen } from "lucide-react";

type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  visibility: string;
  created_at: string;
};

type DocumentRow = {
  id: string;
  title: string;
  sync_status: string;
  source_url: string | null;
};

type AssignmentRow = {
  collection_id: string;
  document_id: string;
};

export default async function NewCollectionPage() {
  const { membership } = await requireOrganizationManager();
  const supabase = createAdminClient();
  const organizationId = membership.organization.id;

  const [{ data: collectionRows }, { data: documentRows }, assignmentResult] = await Promise.all([
    supabase
      .from("knowledge_collections")
      .select("id, name, description, icon, visibility, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("documents")
      .select("id, title, sync_status, source_url")
      .eq("organization_id", organizationId)
      .eq("sync_status", "indexed")
      .eq("is_archived", false)
      .order("title", { ascending: true })
      .limit(1000),
    supabase
      .from("knowledge_collection_documents")
      .select("collection_id, document_id")
      .eq("organization_id", organizationId)
      .limit(5000),
  ]);

  const collections = (collectionRows ?? []) as CollectionRow[];
  const documents: CollectionManagerDocument[] = ((documentRows ?? []) as DocumentRow[]).map((document) => ({
    id: document.id,
    title: document.title,
    status: document.sync_status,
    sourceUrl: document.source_url,
  }));
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const assignments = ((assignmentResult.data ?? []) as AssignmentRow[]).filter((assignment) => documentById.has(assignment.document_id));
  const documentsByCollection = new Map<string, CollectionManagerDocument[]>();

  for (const assignment of assignments) {
    const document = documentById.get(assignment.document_id);
    if (!document) continue;
    const existing = documentsByCollection.get(assignment.collection_id) ?? [];
    existing.push(document);
    documentsByCollection.set(assignment.collection_id, existing);
  }

  const collectionManagers: CollectionManagerCollection[] = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    visibility: collection.visibility,
    documents: documentsByCollection.get(collection.id) ?? [],
  }));
  const migrationReady = !assignmentResult.error;
  const migrationError = assignmentResult.error ? `${assignmentResult.error.code}: ${assignmentResult.error.message}` : null;

  return (
    <AppShell title="Create Collection" description="Create logical groups for synced knowledge documents.">
      <section className="glass-panel rounded-lg p-6 md:p-8">
        <div className="flex items-start gap-4">
          <BookOpen className="text-blue-200" size={26} aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Collection</p>
            <h2 className="mt-3 font-outfit text-3xl font-semibold">Organize knowledge by team or topic</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Create groups like Human Resources, Company Policies, Product Documentation, Customer Support, and Operations.</p>
          </div>
        </div>
        <CollectionCreateForm action={createCollectionAction} />
      </section>

      <section className="glass-panel mt-6 rounded-lg p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Manage documents</p>
            <h2 className="mt-2 font-outfit text-2xl font-semibold">Assign indexed pages into collections</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Only indexed, active Knowledge documents are available here. Run Sync Activity if a page is missing.</p>
          </div>
          <span className="rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{documents.length} indexed docs</span>
        </div>
        <CollectionDocumentManager
          collections={collectionManagers}
          documents={documents}
          addAction={addDocumentToCollectionAction}
          removeAction={removeDocumentFromCollectionAction}
          updateAction={updateCollectionAction}
          deleteAction={deleteCollectionAction}
          migrationReady={migrationReady}
          migrationError={migrationError}
        />
      </section>
    </AppShell>
  );
}
