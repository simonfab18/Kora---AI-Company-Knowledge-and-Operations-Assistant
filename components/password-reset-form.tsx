"use client";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { useActionState } from "react";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none transition duration-300 ease-premium placeholder:text-slate-600 focus:border-blue-400 focus:bg-white/[0.06]";

type PasswordResetFormProps = {
  mode: "request" | "update";
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function PasswordResetForm({ mode, action }: PasswordResetFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {mode === "request" ? (
        <label className="block text-sm font-medium text-slate-300">
          Email
          <input className={inputClass} name="email" type="email" placeholder="you@company.com" required />
        </label>
      ) : (
        <>
          <label className="block text-sm font-medium text-slate-300">
            New password
            <input
              className={inputClass}
              name="password"
              type="password"
              placeholder="At least 8 characters with number and symbol"
              required
              minLength={8}
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Confirm password
            <input
              className={inputClass}
              name="confirmPassword"
              type="password"
              placeholder="Repeat your strong password"
              required
              minLength={8}
            />
          </label>
        </>
      )}

      {state.error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {state.message}
        </p>
      ) : null}

      <button
        className="h-11 w-full rounded-lg bg-white text-sm font-semibold text-ink shadow-[0_10px_28px_-8px_rgba(255,255,255,0.4)] transition duration-300 ease-premium hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? (mode === "request" ? "Sending reset link..." : "Updating securely...") : mode === "request" ? "Send reset link" : "Update password"}
      </button>
    </form>
  );
}