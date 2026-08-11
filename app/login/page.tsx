import Link from "next/link";
import { signInAction, signInWithGoogleAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redirectedFrom?: string }>;
}) {
  const params = await searchParams;
  const nextPath = getSafeAuthRedirect(params.next || params.redirectedFrom);
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your company knowledge workspace."
      description="Continue to your workspace, ask from approved Notion knowledge, and review grounded answers with citations."
    >
      <AuthForm mode="login" action={signInAction} googleAction={signInWithGoogleAction} nextPath={nextPath} />
      <div className="mt-6 flex flex-col gap-3 text-center text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <Link className="text-blue-400 hover:text-blue-300" href="/reset-password">
          Forgot password?
        </Link>
        <span>
          Need an account? <Link className="text-blue-400 hover:text-blue-300" href="/signup">Sign up</Link>
        </span>
      </div>
    </AuthShell>
  );
}