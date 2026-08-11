import { AppShell } from "@/components/app-shell";
import { requireActiveOrganization } from "@/lib/authorization";
import type { KnowledgeGap, OrganizationInvitation, SyncJob } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Recently";
}

export default async function NotificationsPage() {
  const { membership } = await requireActiveOrganization();
  const supabase = createAdminClient();
  const organizationId = membership.organization.id;
  const [{ data: syncJobs }, { data: gaps }, { data: invitations }] = await Promise.all([
    supabase.from("sync_jobs").select("id, status, processed_items, failed_items, total_items, completed_at, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
    supabase.from("knowledge_gaps").select("id, representative_question, missing_topic, occurrence_count, status, last_seen_at").eq("organization_id", organizationId).order("last_seen_at", { ascending: false }).limit(20),
    supabase.from("organization_invitations").select("id, email, role, status, accepted_at, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
  ]);

  const items = [
    ...((syncJobs ?? []) as Pick<SyncJob, "id" | "status" | "processed_items" | "failed_items" | "total_items" | "completed_at" | "created_at">[]).map((job) => ({
      id: `sync-${job.id}`,
      label: "Sync",
      title: job.status === "succeeded" ? "Knowledge sync completed" : job.status === "failed" ? "Knowledge sync failed" : `Sync ${job.status}`,
      body: job.status === "succeeded" ? `${job.processed_items} pages were synchronized.` : job.status === "failed" ? `${job.failed_items || "Some"} pages could not be processed.` : "Sync status changed.",
      href: "/app/sync",
      date: job.completed_at ?? job.created_at,
    })),
    ...((gaps ?? []) as Pick<KnowledgeGap, "id" | "representative_question" | "missing_topic" | "occurrence_count" | "status" | "last_seen_at">[]).map((gap) => ({
      id: `gap-${gap.id}`,
      label: "Knowledge gap",
      title: gap.missing_topic || "Knowledge gap detected",
      body: `${gap.representative_question} (${gap.status}, ${gap.occurrence_count} occurrence${gap.occurrence_count === 1 ? "" : "s"})`,
      href: "/app/insights",
      date: gap.last_seen_at,
    })),
    ...((invitations ?? []) as Pick<OrganizationInvitation, "id" | "email" | "role" | "status" | "accepted_at" | "created_at">[]).map((invitation) => ({
      id: `invite-${invitation.id}`,
      label: "Member",
      title: invitation.status === "accepted" ? "Invitation accepted" : "Invitation update",
      body: `${invitation.email} · ${invitation.role} · ${invitation.status}`,
      href: "/app/members",
      date: invitation.accepted_at ?? invitation.created_at,
    })),
  ].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  return (
    <AppShell title="Notifications" description="Review sync updates, member activity, invitation state, and detected knowledge gaps.">
      <section className="glass-panel rounded-lg p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">History</p>
        <div className="mt-5 max-h-[620px] overflow-y-auto pr-2">
          {items.length ? items.map((item) => (
            <Link key={item.id} href={item.href} className="mb-3 block rounded-lg border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/20">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</span>
                  <h2 className="mt-3 font-outfit text-xl font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                </div>
                <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
              </div>
            </Link>
          )) : (
            <div className="rounded-lg border border-dashed border-white/10 p-10 text-center"><h2 className="font-outfit text-2xl font-semibold">You are all caught up</h2><p className="mt-2 text-sm text-slate-400">New sync updates, member activity, and knowledge gaps will appear here.</p></div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
