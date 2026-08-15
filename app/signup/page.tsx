import Link from "next/link";
import { signUpAction, signInWithGoogleAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { getSafeAuthRedirect, isInvitationRedirect } from "@/lib/auth-redirect";

export const metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = getSafeAuthRedirect(params.next, "/setup/organization");
  const joiningOrganization = isInvitationRedirect(nextPath);

  return (
    <AuthShell
      eyebrow="Create account"
      title={joiningOrganization ? "Create your account to join the workspace." : "Start building a trusted internal assistant."}
      description={joiningOrganization
        ? "Use the invited email address. After confirmation, Kora will return you to the invitation instead of asking you to create another organization."
        : "Create your account, then set up your workspace and connect Notion so Kora can sync approved knowledge."}
    >
      <AuthForm mode="signup" action={signUpAction} googleAction={signInWithGoogleAction} nextPath={nextPath} />
      <p className="mt-6 text-center text-sm text-slate-400">
        Already registered? <Link className="text-blue-400 hover:text-blue-300" href={`/login?next=${encodeURIComponent(nextPath)}`}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
