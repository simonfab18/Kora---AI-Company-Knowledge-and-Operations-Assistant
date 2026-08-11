import Link from "next/link";
import { acceptInvitationAction } from "@/app/app/organization-actions";
import { AuthShell } from "@/components/auth-shell";
import { AcceptInvitationForm } from "@/components/organization-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();

  return (
    <AuthShell
      eyebrow="Organization invite"
      title="Join a Kora workspace."
      description="Accept this invitation with the account that matches the invited email address."
    >
      {user ? (
        <AcceptInvitationForm token={token} action={acceptInvitationAction} />
      ) : (
        <div className="mt-8 space-y-4">
          <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-100">
            Sign in or create an account with the invited email address before accepting this invitation.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link className="h-11 rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-ink" href={`/login?next=/invitations/${token}`}>
              Sign in
            </Link>
            <Link className="glass-soft h-11 rounded-lg px-4 py-3 text-center text-sm font-semibold text-white" href={`/signup?next=${encodeURIComponent(`/invitations/${token}`)}`}>
              Create account
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}