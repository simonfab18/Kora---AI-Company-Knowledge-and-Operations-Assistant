import { AuthForm } from "@/components/auth-form";
import { createOrganizationAction } from "@/app/auth/actions";
import { getCurrentUser, listUserOrganizations } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Create organization" };

export default async function OrganizationSetupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const organizations = await listUserOrganizations(user.id);
  const hasOrganizations = organizations.length > 0;
  const ownsOrganization = organizations.some((organization) => organization.role === "owner");

  if (hasOrganizations && !ownsOrganization) {
    redirect("/app");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 py-12 text-white">
      <div className="grain-overlay" />
      <section className="glass-panel w-full max-w-xl rounded-lg p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
          {hasOrganizations ? "New organization" : "Organization setup"}
        </p>
        <h1 className="font-outfit text-3xl font-semibold">
          {hasOrganizations ? "Create another workspace" : "Name your workspace"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {hasOrganizations
            ? "Create a separate organization with its own Notion connection, members, settings, knowledge, and conversations. You will become the owner."
            : "This creates your first organization and makes you the owner. After setup, connect Notion so Kora can sync approved workspace knowledge."}
        </p>
        {hasOrganizations ? (
          <Link href="/app/settings" className="mt-5 inline-flex text-sm font-semibold text-blue-300 hover:text-white">
            Back to current organization
          </Link>
        ) : null}
        <AuthForm mode="organization" action={createOrganizationAction} />
      </section>
    </main>
  );
}
