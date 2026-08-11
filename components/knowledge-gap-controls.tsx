"use client";

import type { ActionState } from "@/lib/action-state";
import type { KnowledgeGapStatus } from "@/lib/database.types";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useActionState } from "react";

type GapAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

type GapActionStatus = Exclude<KnowledgeGapStatus, "open">;

type GapStatusFormProps = {
  gapId: string;
  status: GapActionStatus;
  action: GapAction;
};

const statusConfig = {
  reviewing: { label: "Review", icon: Eye, className: "text-blue-100" },
  resolved: { label: "Resolve", icon: CheckCircle2, className: "text-emerald-100" },
  dismissed: { label: "Dismiss", icon: XCircle, className: "text-slate-200" },
} satisfies Record<GapActionStatus, { label: string; icon: typeof Eye; className: string }>;

export function KnowledgeGapStatusForm({ gapId, status, action }: GapStatusFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="gapId" value={gapId} />
      <input type="hidden" name="status" value={status} />
      {status === "resolved" ? (
        <textarea
          name="resolutionNotes"
          rows={2}
          placeholder="Optional resolution note"
          className="w-full resize-y rounded-lg border border-white/10 bg-black/20 p-2 text-xs leading-5 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/50"
        />
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`glass-soft inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${config.className}`}
      >
        <Icon size={14} aria-hidden="true" />
        {pending ? "Saving" : config.label}
      </button>
      {state.error || state.message ? <p className="text-xs text-slate-500">{state.error ?? state.message}</p> : null}
    </form>
  );
}