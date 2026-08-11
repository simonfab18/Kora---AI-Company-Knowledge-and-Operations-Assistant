"use client";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useActionState } from "react";

type OnboardingFormProps = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  children?: ReactNode;
  className?: string;
  submitLabel: string;
  pendingLabel?: string;
  submitClassName: string;
  submitContainerClassName?: string;
};

export function OnboardingForm({
  action,
  children,
  className,
  submitLabel,
  pendingLabel = "Saving...",
  submitClassName,
  submitContainerClassName,
}: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className={className}>
      {children}
      <div className={submitContainerClassName}>
        <button className={submitClassName} type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : null}
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
      {state.error ? (
        <p className="col-span-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="col-span-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}