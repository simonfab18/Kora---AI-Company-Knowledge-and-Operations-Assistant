"use client";

import type { ActionState } from "@/lib/action-state";
import type { MessageFeedbackRating } from "@/lib/database.types";
import { MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { useActionState } from "react";

type FeedbackAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

const reasonOptions = [
  { value: "missing_context", label: "Missing information" },
  { value: "wrong_answer", label: "Wrong answer" },
  { value: "wrong_citation", label: "Wrong citation" },
  { value: "too_vague", label: "Too vague" },
  { value: "too_long", label: "Too long" },
  { value: "unclear", label: "Unclear" },
  { value: "outdated", label: "Outdated" },
  { value: "other", label: "Other" },
];

export function MessageFeedbackControls({
  messageId,
  currentRating,
  action,
}: {
  messageId: string;
  currentRating: MessageFeedbackRating | null;
  action: FeedbackAction;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="relative z-30 mt-4 border-t border-white/10 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Answer feedback</p>
      <div className="flex flex-wrap items-center gap-2">
        <form action={formAction}>
          <input type="hidden" name="messageId" value={messageId} />
          <input type="hidden" name="rating" value="helpful" />
          <button
            type="submit"
            disabled={pending}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-premium disabled:opacity-60 ${
              currentRating === "helpful" ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100" : "border-white/15 bg-white/[0.08] text-slate-100 hover:border-white/30"
            }`}
          >
            <ThumbsUp size={14} aria-hidden="true" />
            Helpful
          </button>
        </form>

        <details className="group relative">
          <summary
            className={`inline-flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-premium group-open:border-amber-300/40 group-open:bg-amber-400/10 ${
              currentRating === "not_helpful" ? "border-amber-300/40 bg-amber-400/15 text-amber-100" : "border-white/15 bg-white/[0.08] text-slate-100 hover:border-white/30"
            }`}
          >
            <ThumbsDown size={14} aria-hidden="true" />
            Not helpful
          </summary>
          <form action={formAction} className="absolute left-0 z-50 mt-2 w-[min(380px,calc(100vw-48px))] rounded-lg border border-white/20 bg-[#15171c] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
            <input type="hidden" name="messageId" value={messageId} />
            <input type="hidden" name="rating" value="not_helpful" />
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              Reason
              <select name="reason" className="mt-2 h-10 w-full rounded-lg border border-white/20 bg-[#090b0f] px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-blue-300/50" defaultValue="missing_context">
                {reasonOptions.map((reason) => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              Comment
              <textarea
                name="note"
                rows={3}
                maxLength={500}
                placeholder="Optional: what was missing or incorrect?"
                className="mt-2 w-full resize-y rounded-lg border border-white/20 bg-[#090b0f] p-3 text-sm normal-case leading-5 tracking-normal text-white outline-none placeholder:text-slate-400 focus:border-blue-300/50"
              />
            </label>
            <button className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-ink disabled:opacity-60" type="submit" disabled={pending}>
              <MessageSquareText size={14} aria-hidden="true" />
              {pending ? "Saving..." : "Send feedback"}
            </button>
          </form>
        </details>
        {state.message ? <span className="text-xs text-slate-400">{state.message}</span> : null}
        {state.error ? <span className="text-xs text-rose-200">{state.error}</span> : null}
      </div>
    </div>
  );
}