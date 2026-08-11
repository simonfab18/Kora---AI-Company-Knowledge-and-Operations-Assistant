"use client";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { DEFAULT_RETRIEVAL_THRESHOLD, MAX_RETRIEVAL_THRESHOLD, MIN_RETRIEVAL_THRESHOLD, retrievalThresholdTone } from "@/lib/ai-settings";
import type { MemberStatus, OrganizationPreference, OrganizationRole } from "@/lib/database.types";
import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none transition duration-300 ease-premium placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.06]";
const selectClass =
  "h-10 rounded-lg border border-white/10 bg-[#111] px-3 text-sm text-white outline-none transition duration-300 ease-premium focus:border-blue-400";
const buttonClass =
  "h-10 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60";
const quietButtonClass =
  "glass-soft h-10 rounded-lg px-4 text-sm font-semibold text-slate-200 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60";

type ServerAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{state.error}</p>;
  }

  if (state.message) {
    return <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{state.message}</p>;
  }

  return null;
}

export function OrganizationProfileForm({
  name,
  slug,
  action,
}: {
  name: string;
  slug: string;
  action: ServerAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="glass-panel rounded-lg p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Organization profile</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-300">
          Name
          <input className={inputClass} name="name" defaultValue={name} required minLength={2} maxLength={100} />
        </label>
        <label className="block text-sm font-medium text-slate-300">
          Slug
          <input className={inputClass} name="slug" defaultValue={slug} required minLength={2} maxLength={72} />
        </label>
      </div>
      <button className={`${buttonClass} mt-5`} type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save organization"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function AiSettingsForm({
  aiProvider,
  generationModel,
  embeddingProvider,
  embeddingModel,
  embeddingDimension,
  retrievalThreshold,
  answerLength,
  answerTone,
  defaultLanguage,
  action,
}: {
  aiProvider: string;
  generationModel: string;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimension: number;
  retrievalThreshold: number;
  answerLength: OrganizationPreference["answer_length"];
  answerTone: OrganizationPreference["answer_tone"];
  defaultLanguage: OrganizationPreference["default_language"];
  action: ServerAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const router = useRouter();
  const numericThreshold = Number(retrievalThreshold);
  const safeThreshold = Number.isFinite(numericThreshold)
    ? Math.min(MAX_RETRIEVAL_THRESHOLD, Math.max(MIN_RETRIEVAL_THRESHOLD, numericThreshold))
    : DEFAULT_RETRIEVAL_THRESHOLD;
  const initialThresholdPercent = String(Math.round(safeThreshold * 100));
  const [thresholdPercent, setThresholdPercent] = useState(initialThresholdPercent);
  const [selectedAnswerLength, setSelectedAnswerLength] = useState(answerLength);
  const [selectedAnswerTone, setSelectedAnswerTone] = useState(answerTone);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const parsedThresholdPercent = Number(thresholdPercent);
  const sliderPercent = Number.isFinite(parsedThresholdPercent)
    ? Math.min(MAX_RETRIEVAL_THRESHOLD * 100, Math.max(MIN_RETRIEVAL_THRESHOLD * 100, parsedThresholdPercent))
    : MIN_RETRIEVAL_THRESHOLD * 100;
  const tone = retrievalThresholdTone(sliderPercent / 100);

  useEffect(() => {
    setThresholdPercent(initialThresholdPercent);
  }, [initialThresholdPercent]);

  useEffect(() => {
    setSelectedAnswerLength(answerLength);
    setSelectedAnswerTone(answerTone);
    setSelectedLanguage(defaultLanguage);
  }, [answerLength, answerTone, defaultLanguage]);

  useEffect(() => {
    if (state.message) router.refresh();
  }, [router, state]);

  return (
    <form action={formAction} className="glass-panel rounded-lg p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">AI settings</p>
          <h2 className="mt-3 font-outfit text-2xl font-semibold text-white">Retrieval and answer controls</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Set the minimum source match and the organization-wide response style Kora uses for grounded answers. Model switching stays locked because changing embedding models requires re-indexing.
          </p>
        </div>
        <span className="glass-soft rounded px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">{tone.label}</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <label className="block text-sm font-medium text-slate-300">
            Retrieval threshold
            <input
              className="mt-3 w-full accent-blue-300"
              type="range"
              min={Math.round(MIN_RETRIEVAL_THRESHOLD * 100)}
              max={Math.round(MAX_RETRIEVAL_THRESHOLD * 100)}
              step="1"
              value={sliderPercent}
              onChange={(event) => setThresholdPercent(event.target.value)}
            />
          </label>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <label className="block text-sm font-medium text-slate-300">
              Percent
              <input
                className={inputClass + " max-w-32 font-mono"}
                name="retrievalThreshold"
                type="number"
                min={Math.round(MIN_RETRIEVAL_THRESHOLD * 100)}
                max={Math.round(MAX_RETRIEVAL_THRESHOLD * 100)}
                step="1"
                value={thresholdPercent}
                onChange={(event) => setThresholdPercent(event.target.value)}
              />
            </label>
            <p className="max-w-sm text-sm leading-6 text-slate-400">{tone.helper}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active generation model</p>
            <p className="mt-3 truncate font-mono text-sm font-semibold text-white">{generationModel}</p>
            <p className="mt-1 text-sm text-slate-400">Provider: {aiProvider}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active embedding model</p>
            <p className="mt-3 truncate font-mono text-sm font-semibold text-white">{embeddingModel}</p>
            <p className="mt-1 text-sm text-slate-400">{embeddingProvider}, {embeddingDimension} dimensions</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Answer style</p>
            <div className="mt-3 grid gap-3">
              <label className="text-sm text-slate-300">
                Length
                <select className={selectClass + " mt-2 w-full"} name="answerLength" value={selectedAnswerLength} onChange={(event) => setSelectedAnswerLength(event.target.value as OrganizationPreference["answer_length"])}>
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Tone
                <select className={selectClass + " mt-2 w-full"} name="answerTone" value={selectedAnswerTone} onChange={(event) => setSelectedAnswerTone(event.target.value as OrganizationPreference["answer_tone"])}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="direct">Direct</option>
                  <option value="technical">Technical</option>
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Language
                <select className={selectClass + " mt-2 w-full"} name="defaultLanguage" value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value as OrganizationPreference["default_language"])}>
                  <option value="question_language">Use question language</option>
                  <option value="english">English</option>
                  <option value="filipino">Filipino</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <button className={buttonClass + " mt-5"} type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save AI settings"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}
export function DeleteOrganizationForm({
  organizationName,
  action,
}: {
  organizationName: string;
  action: ServerAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [confirmation, setConfirmation] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const canSubmit = confirmation === organizationName && !pending;

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        setIsOpen(false);
        setConfirmation("");
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, pending]);

  function closeModal() {
    if (pending) return;
    setIsOpen(false);
    setConfirmation("");
  }

  return (
    <div className="flex justify-end border-t border-white/10 pt-6">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-400/35 px-4 text-sm font-semibold text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/10"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 size={16} aria-hidden="true" />
        Delete organization
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
          <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" type="button" aria-label="Close delete organization dialog" onClick={closeModal} />
          <div className="glass-strong relative z-10 w-full max-w-lg rounded-lg p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-organization-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">Permanent action</p>
                <h2 id="delete-organization-title" className="mt-3 font-outfit text-2xl font-semibold text-white">Delete organization?</h2>
              </div>
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white"
                type="button"
                onClick={closeModal}
                disabled={pending}
                aria-label="Close dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              This permanently deletes the workspace, synced knowledge, conversations, citations, members, invitations, and activity history. This cannot be undone.
            </p>

            <form action={formAction} className="mt-6">
              <input type="hidden" name="organizationName" value={organizationName} />
              <label className="block text-sm font-medium text-slate-300">
                Type <span className="font-mono font-semibold text-white">{organizationName}</span> to confirm
                <input
                  className={inputClass + " border-rose-500/20 focus:border-rose-300"}
                  name="confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  autoFocus
                  placeholder="Organization name"
                />
              </label>

              <ActionMessage state={state} />
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:border-white/20" type="button" onClick={closeModal} disabled={pending}>
                  Cancel
                </button>
                <button className="h-10 rounded-lg bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!canSubmit}>
                  {pending ? "Deleting..." : "Permanently delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
export function InviteMemberForm({ action, organizationName }: { action: ServerAction; organizationName?: string }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="glass-panel rounded-lg p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Invite member</p>
      {organizationName ? <p className="mt-2 text-sm text-slate-400">This invitation grants access to {organizationName}. Switch organizations before inviting someone to a different workspace.</p> : null}
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
        <label className="block text-sm font-medium text-slate-300">
          Email
          <input className={inputClass} name="email" type="email" placeholder="teammate@company.com" required />
        </label>
        <label className="block text-sm font-medium text-slate-300">
          Role
          <select className={`${selectClass} mt-2 w-full`} name="role" defaultValue="member">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className={buttonClass} type="submit" disabled={pending}>
          {pending ? "Inviting..." : "Invite"}
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function MemberActionForms({
  userId,
  role,
  status,
  isCurrentUser,
  updateRoleAction,
  disableAction,
  removeAction,
}: {
  userId: string;
  role: OrganizationRole;
  status: MemberStatus;
  isCurrentUser: boolean;
  updateRoleAction: ServerAction;
  disableAction: ServerAction;
  removeAction: ServerAction;
}) {
  const [roleState, roleFormAction, rolePending] = useActionState(updateRoleAction, initialActionState);
  const [disableState, disableFormAction, disablePending] = useActionState(disableAction, initialActionState);
  const [removeState, removeFormAction, removePending] = useActionState(removeAction, initialActionState);

  return (
    <div className="space-y-2">
      <form action={roleFormAction} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="userId" value={userId} />
        <select className={selectClass} name="role" defaultValue={role} disabled={isCurrentUser}>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
        <button className={quietButtonClass} type="submit" disabled={rolePending || isCurrentUser}>
          Update role
        </button>
      </form>
      <div className="flex flex-wrap justify-end gap-2">
        <form action={disableFormAction}>
          <input type="hidden" name="userId" value={userId} />
          <button className={quietButtonClass} type="submit" disabled={disablePending || isCurrentUser || status === "disabled"}>
            Disable
          </button>
        </form>
        <form action={removeFormAction}>
          <input type="hidden" name="userId" value={userId} />
          <button className="h-10 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 text-sm font-semibold text-rose-100 transition hover:border-rose-400/50 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={removePending || isCurrentUser}>
            Remove
          </button>
        </form>
      </div>
      <ActionMessage state={roleState} />
      <ActionMessage state={disableState} />
      <ActionMessage state={removeState} />
    </div>
  );
}

export function RevokeInvitationForm({
  invitationId,
  action,
}: {
  invitationId: string;
  action: ServerAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="text-right">
      <input type="hidden" name="invitationId" value={invitationId} />
      <button className={quietButtonClass} type="submit" disabled={pending}>
        Revoke
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function AcceptInvitationForm({ token, action }: { token: string; action: ServerAction }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="token" value={token} />
      <button className="h-11 w-full rounded-lg bg-white text-sm font-semibold text-ink shadow-[0_10px_28px_-8px_rgba(255,255,255,0.4)] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={pending}>
        {pending ? "Accepting..." : "Accept invitation"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}
