"use client";

import type { ActionState } from "@/lib/action-state";
import { RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useActionState } from "react";

type SyncNowAction = () => Promise<ActionState>;
type RetryAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;
type ClearAction = () => Promise<ActionState>;

export function SyncNowButton({ action, disabled }: { action: SyncNowAction; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(() => action(), {});

  return (
    <form action={formAction} className="space-y-3">
      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={pending ? "animate-spin" : ""} size={16} aria-hidden="true" />
        {pending ? "Syncing" : "Sync now"}
      </button>
      {state.error || state.message ? (
        <p className="text-sm text-slate-300">{state.error ?? state.message}</p>
      ) : null}
    </form>
  );
}

export function RetrySyncButton({ jobId, action }: { jobId: string; action: RetryAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="jobId" value={jobId} />
      <button
        type="submit"
        disabled={pending}
        className="glass-soft inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCcw size={14} aria-hidden="true" />
        {pending ? "Retrying" : "Retry"}
      </button>
      {state.error || state.message ? <p className="text-xs text-slate-400">{state.error ?? state.message}</p> : null}
    </form>
  );
}
export function ClearSyncHistoryButton({ action, disabled }: { action: ClearAction; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(() => action(), {});

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (!window.confirm("Clear completed sync job history? Active queued or running jobs will stay.")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={disabled || pending}
        className="glass-soft inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={14} aria-hidden="true" />
        {pending ? "Clearing" : "Clear history"}
      </button>
      {state.error || state.message ? <p className="text-xs text-slate-400">{state.error ?? state.message}</p> : null}
    </form>
  );
}