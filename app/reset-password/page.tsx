import Link from "next/link";
import { requestPasswordResetAction } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { PasswordResetForm } from "@/components/password-reset-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password reset"
      title="Recover access to Kora."
      description="Enter your account email and Kora will send a Supabase recovery link if the account exists."
    >
      <PasswordResetForm mode="request" action={requestPasswordResetAction} />
      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered it? <Link className="text-blue-400 hover:text-blue-300" href="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}