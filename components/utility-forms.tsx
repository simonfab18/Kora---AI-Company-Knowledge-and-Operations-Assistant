"use client";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { useActionState, useState } from "react";

type ServerAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

const inputClass = "mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300";
const textareaClass = "mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300";
const selectClass = "mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#111] px-3 text-white outline-none focus:border-blue-300";
const buttonClass = "h-11 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60";

function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) return <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{state.error}</p>;
  if (state.message) return <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{state.message}</p>;
  return null;
}

export function ProfileSettingsForm({
  action,
  fullName,
  displayName,
  jobTitle,
  department,
  preferredLanguage,
}: {
  action: ServerAction;
  fullName: string;
  displayName: string;
  jobTitle: string;
  department: string;
  preferredLanguage: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-slate-300">Full name<input className={inputClass} name="fullName" defaultValue={fullName} required minLength={2} maxLength={120} /></label>
      <label className="text-sm font-medium text-slate-300">Display name<input className={inputClass} name="displayName" defaultValue={displayName} maxLength={80} /></label>
      <label className="text-sm font-medium text-slate-300">Job title<input className={inputClass} name="jobTitle" defaultValue={jobTitle} maxLength={120} /></label>
      <label className="text-sm font-medium text-slate-300">Department<input className={inputClass} name="department" defaultValue={department} maxLength={120} /></label>
      <label className="text-sm font-medium text-slate-300 md:col-span-2">Preferred language<select className={selectClass} name="preferredLanguage" defaultValue={preferredLanguage || "English"}><option>English</option><option>Filipino</option><option>Spanish</option><option>French</option><option>Japanese</option></select></label>
      <div className="md:col-span-2"><button className={buttonClass} type="submit" disabled={pending}>{pending ? "Saving..." : "Save profile"}</button><ActionMessage state={state} /></div>
    </form>
  );
}

export function AccountPreferencesForm({
  action,
  appearancePreference,
  notificationPreferences,
}: {
  action: ServerAction;
  appearancePreference: string;
  notificationPreferences: { sync?: boolean; members?: boolean; gaps?: boolean };
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-5 grid gap-4 text-sm text-slate-300">
      <label className="font-medium">Appearance<select className={selectClass} name="appearancePreference" defaultValue={appearancePreference === "system" ? "system" : "dark"}><option value="dark">Dark</option><option value="system">System</option></select></label>
      <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
        <p className="font-semibold text-white">Notification preferences</p>
        <label className="mt-3 flex items-center gap-3"><input className="accent-blue-300" name="notifySync" type="checkbox" defaultChecked={notificationPreferences.sync !== false} /> Sync updates</label>
        <label className="mt-3 flex items-center gap-3"><input className="accent-blue-300" name="notifyMembers" type="checkbox" defaultChecked={notificationPreferences.members !== false} /> Member and invitation activity</label>
        <label className="mt-3 flex items-center gap-3"><input className="accent-blue-300" name="notifyGaps" type="checkbox" defaultChecked={notificationPreferences.gaps !== false} /> Knowledge gap alerts</label>
      </div>
      <button className={buttonClass} type="submit" disabled={pending}>{pending ? "Saving..." : "Save account preferences"}</button>
      <ActionMessage state={state} />
    </form>
  );
}

export function CollectionCreateForm({ action }: { action: ServerAction }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-8 grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-slate-300">Collection name<input className={inputClass} name="name" placeholder="Company Policies" required minLength={2} maxLength={100} /></label>
      <label className="text-sm font-medium text-slate-300">Icon<select className={selectClass} name="icon" defaultValue="book"><option value="book">Book</option><option value="users">People</option><option value="shield">Policy</option><option value="sparkles">AI</option><option value="wrench">Operations</option></select></label>
      <label className="text-sm font-medium text-slate-300 md:col-span-2">Description<textarea className={textareaClass} name="description" placeholder="What belongs in this collection?" maxLength={1000} /></label>
      <label className="text-sm font-medium text-slate-300 md:col-span-2">Visibility<select className={selectClass} name="visibility" defaultValue="organization"><option value="organization">Organization</option><option value="managers">Managers only</option></select></label>
      <div className="md:col-span-2"><button className={buttonClass} type="submit" disabled={pending}>{pending ? "Creating..." : "Create collection"}</button><ActionMessage state={state} /></div>
    </form>
  );
}

export function SupportTicketForm({ action }: { action: ServerAction }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-300">Name<input className={inputClass} name="name" required /></label><label className="text-sm font-medium text-slate-300">Email<input className={inputClass} name="email" type="email" required /></label></div>
      <label className="text-sm font-medium text-slate-300">Organization<input className={inputClass} name="organizationName" /></label>
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-300">Subject<input className={inputClass} name="subject" required minLength={3} /></label><label className="text-sm font-medium text-slate-300">Category<select className={selectClass} name="category"><option>Account issue</option><option>Notion connection</option><option>Synchronization</option><option>AI answer issue</option><option>Member management</option><option>General question</option></select></label></div>
      <label className="text-sm font-medium text-slate-300">Description<textarea className={textareaClass} name="description" required minLength={10} /></label>
      <button className={buttonClass} type="submit" disabled={pending}>{pending ? "Submitting..." : "Submit support request"}</button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ProblemReportForm({ action }: { action: ServerAction }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <label className="text-sm font-medium text-slate-300">Problem title<input className={inputClass} name="title" required minLength={3} /></label>
      <label className="text-sm font-medium text-slate-300">What happened?<textarea className={textareaClass} name="whatHappened" required minLength={10} /></label>
      <label className="text-sm font-medium text-slate-300">What did you expect?<textarea className={textareaClass} name="expectedBehavior" required minLength={5} /></label>
      <label className="text-sm font-medium text-slate-300">Steps to reproduce<textarea className={textareaClass} name="stepsToReproduce" required minLength={5} /></label>
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-300">Page URL<input className={inputClass} name="pageUrl" /></label><label className="text-sm font-medium text-slate-300">Category<select className={selectClass} name="category"><option>User interface</option><option>Authentication</option><option>Notion connection</option><option>Synchronization</option><option>Knowledge search</option><option>AI response</option><option>Notifications</option><option>Members and permissions</option><option>Other</option></select></label></div>
      <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-300"><input className="mt-1 accent-blue-300" name="includeDiagnostics" type="checkbox" /> Include safe diagnostic details such as browser, route, and request ID when available.</label>
      <button className={buttonClass} type="submit" disabled={pending}>{pending ? "Submitting..." : "Submit problem report"}</button>
      <ActionMessage state={state} />
    </form>
  );
}

export type CollectionManagerCollection = {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  documents: Array<{ id: string; title: string; status: string; sourceUrl: string | null }>;
};

export type CollectionManagerDocument = {
  id: string;
  title: string;
  status: string;
  sourceUrl: string | null;
};

export function CollectionDocumentManager({
  collections,
  documents,
  addAction,
  removeAction,
  updateAction,
  deleteAction,
  migrationReady,
  migrationError,
}: {
  collections: CollectionManagerCollection[];
  documents: CollectionManagerDocument[];
  addAction: ServerAction;
  removeAction: ServerAction;
  updateAction: ServerAction;
  deleteAction: ServerAction;
  migrationReady: boolean;
  migrationError?: string | null;
}) {
  const [addState, addFormAction, addPending] = useActionState(addAction, initialActionState);
  const [removeState, removeFormAction, removePending] = useActionState(removeAction, initialActionState);
  const [updateState, updateFormAction, updatePending] = useActionState(updateAction, initialActionState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteAction, initialActionState);
  const [deleteConfirmById, setDeleteConfirmById] = useState<Record<string, string>>({});

  if (!migrationReady) {
    return (
      <div className="mt-5 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
        <p>Document assignments are not ready yet. Run <span className="font-mono text-xs">supabase/migrations/20260726113000_collection_documents.sql</span> in Supabase, then refresh this page.</p>
        {migrationError ? <p className="mt-2 text-xs text-amber-100/75">Database says: {migrationError}</p> : null}
      </div>
    );
  }

  if (collections.length === 0) {
    return <p className="mt-5 rounded-lg border border-dashed border-white/10 p-6 text-sm text-slate-400">Create a collection first, then assign synced documents into it.</p>;
  }

  return (
    <div className="mt-5 space-y-4">
      {collections.map((collection) => {
        const assignedIds = new Set(collection.documents.map((document) => document.id));
        const availableDocuments = documents.filter((document) => !assignedIds.has(document.id));
        const expectedDelete = `remove ${collection.name}`;
        const deleteConfirmation = deleteConfirmById[collection.id] ?? "";

        return (
          <article key={collection.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-outfit text-xl font-semibold text-white">{collection.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{collection.description || "No description yet."}</p>
              </div>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{collection.visibility}</span>
            </div>

            <details className="mt-4 rounded-lg border border-white/10 bg-black/10 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-200 marker:text-slate-500">Edit collection</summary>
              <div className="mt-4 grid gap-4">
                <form action={updateFormAction} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="collectionId" value={collection.id} />
                  <label className="text-sm font-medium text-slate-300">
                    Name
                    <input className={inputClass} name="name" defaultValue={collection.name} required minLength={2} maxLength={100} />
                  </label>
                  <label className="text-sm font-medium text-slate-300">
                    Visibility
                    <select className={selectClass} name="visibility" defaultValue={collection.visibility === "managers" ? "managers" : "organization"}>
                      <option value="organization">Organization</option>
                      <option value="managers">Managers only</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-300 md:col-span-2">
                    Description
                    <textarea className={textareaClass} name="description" defaultValue={collection.description ?? ""} maxLength={1000} />
                  </label>
                  <div className="md:col-span-2">
                    <button className={buttonClass} type="submit" disabled={updatePending}>{updatePending ? "Saving..." : "Save collection"}</button>
                  </div>
                </form>

                <form action={deleteFormAction} className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-3">
                  <input type="hidden" name="collectionId" value={collection.id} />
                  <p className="text-sm font-semibold text-rose-50">Remove collection</p>
                  <p className="mt-1 text-xs leading-5 text-rose-100/75">This removes the collection and its document assignments. The Knowledge documents stay in your workspace.</p>
                  <label className="mt-3 block text-sm font-medium text-rose-50">
                    Type <span className="font-mono text-xs">{expectedDelete}</span>
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-rose-300/25 bg-black/20 px-3 text-white outline-none placeholder:text-rose-100/35 focus:border-rose-200"
                      name="confirmation"
                      placeholder={expectedDelete}
                      value={deleteConfirmation}
                      onChange={(event) => setDeleteConfirmById((current) => ({ ...current, [collection.id]: event.target.value }))}
                    />
                  </label>
                  <button
                    className="mt-3 h-10 rounded-lg border border-rose-300/30 bg-rose-500/15 px-4 text-sm font-semibold text-rose-50 transition hover:border-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={deletePending || deleteConfirmation !== expectedDelete}
                  >
                    {deletePending ? "Removing..." : "Remove collection"}
                  </button>
                </form>
              </div>
            </details>

            <form action={addFormAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <input type="hidden" name="collectionId" value={collection.id} />
              <label className="text-sm font-medium text-slate-300">
                Add synced document
                <select className={selectClass} name="documentId" defaultValue="" disabled={availableDocuments.length === 0} required>
                  <option value="" disabled>{availableDocuments.length ? "Choose a document" : "All indexed documents are already assigned"}</option>
                  {availableDocuments.map((document) => (
                    <option key={document.id} value={document.id}>{document.title}</option>
                  ))}
                </select>
              </label>
              <button className={buttonClass} type="submit" disabled={addPending || availableDocuments.length === 0}>{addPending ? "Adding..." : "Add document"}</button>
            </form>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/10">
              <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assigned documents</div>
              <div className="max-h-60 overflow-y-auto p-3">
                {collection.documents.length ? collection.documents.map((document) => (
                  <div key={document.id} className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{document.title}</p>
                      <p className="mt-1 text-xs capitalize text-slate-500">{document.status}</p>
                    </div>
                    <form action={removeFormAction}>
                      <input type="hidden" name="collectionId" value={collection.id} />
                      <input type="hidden" name="documentId" value={document.id} />
                      <button className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:border-rose-300/50 disabled:opacity-60" type="submit" disabled={removePending}>Remove</button>
                    </form>
                  </div>
                )) : <p className="rounded-md border border-dashed border-white/10 p-4 text-sm text-slate-500">No documents assigned yet.</p>}
              </div>
            </div>
          </article>
        );
      })}
      <ActionMessage state={addState} />
      <ActionMessage state={removeState} />
      <ActionMessage state={updateState} />
      <ActionMessage state={deleteState} />
    </div>
  );
}