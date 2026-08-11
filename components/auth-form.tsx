"use client";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";

type AuthFormProps = {
  mode: "login" | "signup" | "organization";
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  googleAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  nextPath?: string;
};

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-white/15 bg-white/[0.07] px-3 text-white outline-none transition duration-300 ease-premium placeholder:text-slate-500 focus:border-blue-300 focus:bg-white/[0.09]";

type PasswordStrength = {
  score: number;
  label: string;
  helper: string;
  tone: string;
};

function passwordStrength(password: string, email: string, firstName: string, lastName: string): PasswordStrength {
  const lowerPassword = password.toLowerCase();
  const blockedTerms = [email.split("@")[0], firstName, lastName].map((value) => value.toLowerCase()).filter((value) => value.length >= 3);
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length === 0 || !blockedTerms.some((term) => lowerPassword.includes(term)),
  ];
  const score = checks.filter(Boolean).length;

  if (!password) return { score: 0, label: "Password strength", helper: "Use 8+ characters with a number and symbol.", tone: "bg-slate-600" };
  if (score <= 2) return { score, label: "Weak", helper: "Make it longer and mix letter types, numbers, and symbols.", tone: "bg-rose-300" };
  if (score <= 4) return { score, label: "Almost there", helper: "Add the missing piece so this is harder to guess.", tone: "bg-amber-300" };
  return { score, label: "Strong", helper: "Good. This password meets the workspace requirement.", tone: "bg-emerald-300" };
}

function PasswordInput({ name, label, placeholder, value, onChange, autoComplete }: { name: string; label: string; placeholder: string; value?: string; onChange?: (value: string) => void; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm font-medium text-slate-200">
      {label}
      <span className="relative block">
        <input
          className={`${inputClass} pr-11`}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          required
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          autoComplete={autoComplete ?? (name === "confirmPassword" ? "new-password" : "current-password")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute bottom-0 right-2 top-2 inline-flex h-11 w-8 items-center justify-center text-slate-400 hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

function LoadingNotice({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-blue-300/20 bg-blue-400/10 p-3 text-sm text-blue-100" aria-live="polite">
      <span className="inline-flex items-center gap-2">
        <Loader2 className="animate-spin" size={15} aria-hidden="true" />
        {text}
      </span>
    </div>
  );
}

export function AuthForm({ mode, action, googleAction, nextPath }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [googleState, googleFormAction, googlePending] = useActionState(googleAction ?? action, initialActionState);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const strength = useMemo(() => passwordStrength(password, email, firstName, lastName), [email, firstName, lastName, password]);
  const passwordsMismatch = mode === "signup" && confirmPassword.length > 0 && password !== confirmPassword;
  const busy = pending || googlePending;

  useEffect(() => {
    if (mode !== "login") return;
    const rememberedEmail = window.localStorage.getItem("kora_remembered_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "login") return;
    if (remember && email) {
      window.localStorage.setItem("kora_remembered_email", email);
    } else if (!remember) {
      window.localStorage.removeItem("kora_remembered_email");
    }
  }, [email, mode, remember]);

  return (
    <div className="mt-8 space-y-4">
      {googleAction && mode !== "organization" ? (
        <form action={googleFormAction}>
          <input type="hidden" name="mode" value={mode} />
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          <button
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/[0.08] text-sm font-semibold text-white transition duration-300 hover:border-white/30 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={busy}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-semibold text-ink">G</span>
            {googlePending ? "Opening Google..." : mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          </button>
        </form>
      ) : null}

      {googleAction && mode !== "organization" ? (
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          or use email
          <span className="h-px flex-1 bg-white/10" />
        </div>
      ) : null}

      <form action={formAction} className="space-y-4" noValidate>
        {(mode === "login" || mode === "signup") && nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        {mode === "signup" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-200">
              First name
              <input className={inputClass} name="firstName" type="text" placeholder="Alex" required value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Last name
              <input className={inputClass} name="lastName" type="text" placeholder="Morgan" required value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" />
            </label>
          </div>
        ) : null}

        {mode === "organization" ? (
          <label className="block text-sm font-medium text-slate-200">
            Organization name
            <input
              className={inputClass}
              name="organizationName"
              type="text"
              placeholder="Acme Operations"
              required
              autoComplete="organization"
            />
          </label>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-200">
              Company email
              <span className="relative block">
                <input className={`${inputClass} pl-10`} name="email" type="email" placeholder="you@company.com" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                <Mail className="absolute bottom-0 left-3 top-[21px] text-slate-500" size={15} aria-hidden="true" />
              </span>
            </label>
            <PasswordInput name="password" label="Password" placeholder={mode === "signup" ? "Use a strong password" : "Enter your password"} value={password} onChange={setPassword} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            {mode === "signup" ? (
              <>
                <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <span>{strength.label}</span>
                    <span>{Math.round((strength.score / 5) * 100)}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${strength.tone} transition-all duration-300`} style={{ width: `${Math.max((strength.score / 5) * 100, password ? 14 : 0)}%` }} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{strength.helper}</p>
                </div>
                <PasswordInput name="confirmPassword" label="Confirm password" placeholder="Repeat your password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
                {passwordsMismatch ? <p className="text-sm text-rose-200">Passwords do not match.</p> : null}
                <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-slate-300">
                  <input className="mt-1 accent-blue-300" type="checkbox" name="confirmAccount" required />
                  <span>
                    I agree to the <Link href="/privacy" className="text-blue-300 hover:text-blue-200">Kora Privacy Policy</Link> and <Link href="/terms" className="text-blue-300 hover:text-blue-200">Terms</Link>.
                  </span>
                </label>
              </>
            ) : (
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input className="accent-blue-300" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                Remember me on this device
              </label>
            )}
          </>
        )}

        {busy ? <LoadingNotice text={mode === "organization" ? "Creating workspace and preparing Notion setup..." : mode === "signup" ? "Creating account securely..." : "Signing you in securely..."} /> : null}
        {state.error || googleState.error ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {state.error ?? googleState.error}
          </p>
        ) : null}
        {state.message || googleState.message ? (
          <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100">
            <p>{state.message ?? googleState.message}</p>
            {mode === "signup" ? (
              <Link
                className="inline-flex font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                href={`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
              >
                Already confirmed? Sign in to continue
              </Link>
            ) : null}
          </div>
        ) : null}

        <button
          className="h-11 w-full rounded-lg bg-white text-sm font-semibold text-ink shadow-[0_10px_28px_-8px_rgba(255,255,255,0.4)] transition duration-300 ease-premium hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {pending
            ? mode === "organization"
              ? "Preparing Notion setup..."
              : mode === "signup"
                ? "Creating account..."
                : "Signing in..."
            : mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Create workspace"}
        </button>
      </form>
    </div>
  );
}