"use client";

import type { ActionState } from "@/lib/action-state";
import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

type ReindexAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

export function ReindexDocumentButton({ documentId, action }: { documentId: string; action: ReindexAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="documentId" value={documentId} />
      <button
        type="submit"
        disabled={pending}
        className="glass-soft inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={pending ? "animate-spin" : ""} size={15} aria-hidden="true" />
        {pending ? "Re-indexing" : "Re-index"}
      </button>
      {state.error || state.message ? <p className="max-w-sm text-xs text-slate-400">{state.error ?? state.message}</p> : null}
    </form>
  );
}