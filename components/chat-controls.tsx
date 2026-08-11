"use client";

import type { ActionState } from "@/lib/action-state";
import type { DailyAiUsage } from "@/lib/ai-usage";
import { Archive, Edit3, Loader2, MoreHorizontal, Pin, PinOff, RotateCcw, Send, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type FormAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

export function AskComposer({ conversationId, action, dailyUsage, defaultQuestion = "" }: { conversationId?: string | null; action: FormAction; dailyUsage: DailyAiUsage; defaultQuestion?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quotaBlocked = dailyUsage.userRemaining <= 0 || dailyUsage.globalRemaining <= 0;
  const resetTime = new Date(dailyUsage.resetAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  useEffect(() => {
    if (state.redirectTo) {
      setRequestId(crypto.randomUUID());
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();

    if (pending || quotaBlocked || !textareaRef.current?.value.trim()) return;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="border-t border-white/10 bg-black/10 p-4">
      <input type="hidden" name="conversationId" value={conversationId ?? ""} />
      <input type="hidden" name="requestId" value={requestId} />
      <label className="block">
        <span className="sr-only">Ask Kora</span>
        <textarea
          ref={textareaRef}
          name="question"
          defaultValue={defaultQuestion}
          rows={3}
          required
          placeholder={quotaBlocked ? "Daily AI quota reached" : "Ask a question about your approved workspace docs"}
          disabled={quotaBlocked || pending}
          onKeyDown={submitOnEnter}
          className="min-h-24 w-full resize-none rounded-lg border border-white/10 bg-black/25 p-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/50 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Your AI usage: <span className="font-semibold text-slate-300">{dailyUsage.userUsed}/{dailyUsage.userLimit}</span> used today, <span className="font-semibold text-slate-300">{dailyUsage.userRemaining}</span> left. Resets at {resetTime}. Press Enter to send, Shift+Enter for a new line.
        </p>
        <button
          type="submit"
          disabled={pending || quotaBlocked}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={15} aria-hidden="true" />
          {pending ? "Thinking" : quotaBlocked ? "Quota reached" : "Ask"}
        </button>
      </div>
      {quotaBlocked ? <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-400/10 p-3 text-sm text-amber-100">Daily AI quota reached. Your quota resets at {resetTime}.</p> : null}
      {pending ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-300/20 bg-blue-400/10 p-3 text-sm text-blue-100" aria-live="polite">
          <Loader2 className="animate-spin" size={15} aria-hidden="true" />
          Kora is retrieving approved context and checking citations.
        </div>
      ) : null}
      {state.error ? <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{state.error}</p> : null}
    </form>
  );
}

function MenuActionForm({ conversationId, action, children }: { conversationId: string; action: FormAction; children: ReactNode }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {state.error ? <p className="mt-2 px-3 text-xs text-rose-200">{state.error}</p> : null}
    </form>
  );
}

function TogglePinnedConversationForm({ conversationId, pinned, action }: { conversationId: string; pinned?: boolean; action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="pinned" value={pinned ? "true" : "false"} />
      <button type="submit" disabled={pending} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06] disabled:opacity-60">
        {pinned ? <PinOff size={15} aria-hidden="true" /> : <Pin size={15} aria-hidden="true" />}
        {pinned ? "Unpin" : "Pin"}
      </button>
      {state.error ? <p className="mt-2 px-3 text-xs text-rose-200">{state.error}</p> : null}
    </form>
  );
}
function DeleteConversationForm({ conversationId, action }: { conversationId: string; action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Delete this conversation permanently? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <button type="submit" disabled={pending} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-60">
        <Trash2 size={15} aria-hidden="true" /> Delete
      </button>
      {state.error ? <p className="mt-2 px-3 text-xs text-rose-200">{state.error}</p> : null}
    </form>
  );
}

export function ConversationActionsMenu({
  conversationId,
  title,
  pinned,
  archived,
  renameAction,
  togglePinnedAction,
  archiveAction,
  restoreAction,
  deleteAction,
  compact = false,
}: {
  conversationId: string;
  title: string;
  pinned?: boolean;
  archived?: boolean;
  renameAction: FormAction;
  togglePinnedAction: FormAction;
  archiveAction: FormAction;
  restoreAction: FormAction;
  deleteAction: FormAction;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameState, renameFormAction, renamePending] = useActionState(renameAction, {});

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${compact ? "h-8 w-8" : "h-10 w-10"} inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-slate-200 transition hover:border-white/25 hover:text-white`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Conversation menu"
      >
        <MoreHorizontal size={compact ? 16 : 18} aria-hidden="true" />
      </button>

      {open ? (
        <div className={`${compact ? "w-64" : "w-72"} absolute right-0 z-50 mt-2 rounded-lg border border-white/15 bg-[#15171c] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.85)]`}>
          <div className="mb-2 flex items-center justify-between border-b border-white/10 px-3 pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thread actions</p>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white" aria-label="Close menu">
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          {renaming ? (
            <form action={renameFormAction} className="space-y-2 p-2">
              <input type="hidden" name="conversationId" value={conversationId} />
              <input name="title" defaultValue={title} className="h-10 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-blue-300/50" />
              <div className="flex gap-2">
                <button type="submit" disabled={renamePending} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-ink disabled:opacity-60">
                  <Edit3 size={14} aria-hidden="true" /> Save
                </button>
                <button type="button" onClick={() => setRenaming(false)} className="h-9 rounded-lg border border-white/10 px-3 text-sm font-semibold text-slate-200">
                  Cancel
                </button>
              </div>
              {renameState.error || renameState.message ? <p className="text-xs text-slate-400">{renameState.error ?? renameState.message}</p> : null}
            </form>
          ) : (
            <button type="button" onClick={() => setRenaming(true)} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06]">
              <Edit3 size={15} aria-hidden="true" /> Rename
            </button>
          )}

          {!archived ? <TogglePinnedConversationForm conversationId={conversationId} pinned={pinned} action={togglePinnedAction} /> : null}

          {archived ? (
            <MenuActionForm conversationId={conversationId} action={restoreAction}>
              <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06]">
                <RotateCcw size={15} aria-hidden="true" /> Restore
              </button>
            </MenuActionForm>
          ) : (
            <MenuActionForm conversationId={conversationId} action={archiveAction}>
              <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06]">
                <Archive size={15} aria-hidden="true" /> Archive
              </button>
            </MenuActionForm>
          )}

          <div className="my-2 h-px bg-white/10" />
          <DeleteConversationForm conversationId={conversationId} action={deleteAction} />
        </div>
      ) : null}
    </div>
  );
}


