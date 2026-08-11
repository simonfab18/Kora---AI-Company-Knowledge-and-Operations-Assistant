import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { switchActiveOrganizationAction } from "@/app/app/organization-actions";
import { inviteMemberAction } from "@/app/app/organization-actions";
import { markNotificationsReadAction } from "@/app/app/utility-actions";
import { syncNotionNowAction } from "@/app/app/sync-actions";
import { MobileAppNavigation, SidebarNavigation } from "@/components/app-navigation";
import { TopNavigation } from "@/components/top-navigation";
import { loadDailyAiUsage } from "@/lib/ai-usage";
import { getCurrentUser, getPrimaryOrganization, listUserOrganizations } from "@/lib/auth";
import type { KnowledgeGap, OrganizationInvitation, Profile, SyncJob } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowRight, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
};

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Recently";
}

export async function AppShell({ children, title, description }: AppShellProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getPrimaryOrganization(user.id);
  const role = membership?.role ?? null;
  const email = user.email ?? "Signed in";
  const organizations = await listUserOrganizations(user.id);
  const today = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const organizationName = membership?.organization.name ?? "Workspace setup";
  const canManage = role === "owner" || role === "admin";
  const canCreateOrganization = role === "owner";
  const supabase = createAdminClient();

  const [{ data: profile }, dailyUsage, { data: latestSyncJobs }, { data: openGaps }, { data: acceptedInvitations }, { data: notificationReads }] = membership
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, created_at, updated_at")
          .eq("id", user.id)
          .maybeSingle(),
        loadDailyAiUsage(membership.organization.id, user.id),
        supabase
          .from("sync_jobs")
          .select("id, status, processed_items, failed_items, total_items, error_message, completed_at, created_at")
          .eq("organization_id", membership.organization.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("knowledge_gaps")
          .select("id, representative_question, missing_topic, occurrence_count, status, last_seen_at")
          .eq("organization_id", membership.organization.id)
          .in("status", ["open", "reviewing"])
          .order("last_seen_at", { ascending: false })
          .limit(2),
        supabase
          .from("organization_invitations")
          .select("id, email, role, status, accepted_at, created_at")
          .eq("organization_id", membership.organization.id)
          .eq("status", "accepted")
          .order("accepted_at", { ascending: false })
          .limit(2),
        supabase
          .from("user_notification_reads")
          .select("notification_id")
          .eq("organization_id", membership.organization.id)
          .eq("user_id", user.id)
          .limit(100),
      ])
    : [
        { data: null },
        null,
        { data: [] },
        { data: [] },
        { data: [] },
        { data: [] },
      ];

  const profileRow = profile as Profile | null;
  const userName = profileRow?.full_name || (typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : email.split("@")[0]);
  const syncNotifications = ((latestSyncJobs ?? []) as Pick<SyncJob, "id" | "status" | "processed_items" | "failed_items" | "total_items" | "error_message" | "completed_at" | "created_at">[]).map((job) => ({
    id: `sync-${job.id}`,
    title: job.status === "succeeded" ? "Knowledge sync completed" : job.status === "failed" ? "Knowledge sync failed" : "Knowledge sync update",
    body: job.status === "succeeded"
      ? `${job.processed_items} pages were synchronized${job.total_items ? ` out of ${job.total_items}` : ""}.`
      : job.status === "failed"
        ? `${job.failed_items || "Some"} pages could not be processed. Review the sync details and try again.`
        : `Sync is ${job.status}.`,
    href: "/app/sync",
    timestamp: formatTimestamp(job.completed_at ?? job.created_at),
    tone: job.status === "failed" ? "error" as const : job.status === "succeeded" ? "success" as const : "info" as const,
    unread: job.status === "failed" || job.status === "succeeded",
  }));
  const gapNotifications = ((openGaps ?? []) as Pick<KnowledgeGap, "id" | "representative_question" | "missing_topic" | "occurrence_count" | "last_seen_at">[]).map((gap) => ({
    id: `gap-${gap.id}`,
    title: "New knowledge gap detected",
    body: `${gap.missing_topic || gap.representative_question} needs review${gap.occurrence_count > 1 ? ` after ${gap.occurrence_count} occurrences` : ""}.`,
    href: "/app/insights",
    timestamp: formatTimestamp(gap.last_seen_at),
    tone: "warning" as const,
    unread: true,
  }));
  const memberNotifications = ((acceptedInvitations ?? []) as Pick<OrganizationInvitation, "id" | "email" | "role" | "accepted_at" | "created_at">[]).map((invitation) => ({
    id: `member-${invitation.id}`,
    title: "Invitation accepted",
    body: `${invitation.email} joined ${organizationName} as ${invitation.role}.`,
    href: "/app/members",
    timestamp: formatTimestamp(invitation.accepted_at ?? invitation.created_at),
    tone: "success" as const,
    unread: false,
  }));
  const notifications = [...syncNotifications, ...gapNotifications, ...memberNotifications].slice(0, 6);
  const readNotificationIds = ((notificationReads ?? []) as { notification_id: string }[]).map((item) => item.notification_id);

  return (
    <div className="app-surface ambient-bg min-h-screen bg-ink text-white">
      <div className="grain-overlay" />
<MobileAppNavigation
        role={role}
        organizationName={organizationName}
        userLabel={email}
        organizations={organizations}
        activeOrganizationId={membership?.organization.id}
        switchOrganizationAction={switchActiveOrganizationAction}
      />
      <div className="min-h-screen w-full">
        <aside className="glass-soft fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-white/10 p-5 lg:flex">
          <Link href="/app" className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-ink">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-outfit text-xl font-semibold">Kora</span>
              <span className="block text-xs text-slate-500">Knowledge ops</span>
            </span>
          </Link>
          <SidebarNavigation role={role} />
          <div className="mt-auto space-y-4">
            <div className="glass-panel rounded-lg p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Active org</p>
              {membership && organizations.length > 1 ? (
                <form action={switchActiveOrganizationAction} className="mt-3">
                  <select
                    className="h-10 w-full rounded-lg border border-white/10 bg-[#111] px-3 text-sm text-white outline-none"
                    name="organizationId"
                    defaultValue={membership.organization.id}
                    aria-label="Switch organization"
                  >
                    {organizations.map((item) => (
                      <option key={item.organization.id} value={item.organization.id}>
                        {item.organization.name}
                      </option>
                    ))}
                  </select>
                  <button className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-slate-200" type="submit">
                    Switch organization
                  </button>
                </form>
              ) : (
                <p className="mt-3 truncate font-outfit text-lg font-semibold text-white">
                  {membership?.organization.name ?? "No organization"}
                </p>
              )}
              <p className="mt-2 text-xs capitalize text-slate-500">{membership?.role ?? "setup required"}</p>
              {canManage || !membership ? (
                <div className="mt-4 grid gap-2">
                  {canManage ? (
                    <Link
                      href="/app/settings"
                      className="inline-flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-slate-200"
                    >
                      Manage
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link
                      href="/setup/organization"
                      className="inline-flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-slate-200"
                    >
                      Create org
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  )}
                  {canCreateOrganization ? (
                    <Link
                      href="/setup/organization"
                      className="inline-flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                    >
                      New organization
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="relative z-10 min-h-screen w-full min-w-0 px-5 py-6 md:px-8 lg:ml-[280px] lg:w-[calc(100%-280px)] lg:px-10">
          <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="mb-2 text-sm text-slate-500">{today} / {organizationName}</p>
              <h1 className="font-outfit text-3xl font-semibold md:text-[30px]">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
            </div>
            <TopNavigation
              userName={userName}
              email={email}
              organizationName={organizationName}
              role={role}
              avatarUrl={profileRow?.avatar_url}
              dailyUsage={dailyUsage}
              notifications={notifications}
              canManage={canManage}
              inviteMemberAction={inviteMemberAction}
              startSyncAction={syncNotionNowAction}
              signOutAction={signOutAction}
              readNotificationIds={readNotificationIds}
              markNotificationsReadAction={markNotificationsReadAction}
            />
          </header>

          {!membership ? (
            <section className="mb-6 rounded-lg border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-100">
              Create an organization before connecting Notion or asking questions.
            </section>
          ) : null}
          <div className="fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
