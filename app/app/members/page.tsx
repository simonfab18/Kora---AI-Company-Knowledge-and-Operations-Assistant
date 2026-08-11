import {
  addExistingMemberToOrganizationAction,
  disableMemberAction,
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
  updateMemberRoleAction,
} from "@/app/app/organization-actions";
import { AppShell } from "@/components/app-shell";
import { InviteMemberForm, RevokeInvitationForm } from "@/components/organization-forms";
import { WorkspaceMemberDirectory, type DirectoryPerson } from "@/components/workspace-member-directory";
import { requireOrganizationManager } from "@/lib/authorization";
import { listUserOrganizations } from "@/lib/auth";
import type { AuditLog, MemberStatus, OrganizationInvitationStatus, OrganizationRole } from "@/lib/database.types";
import { roleDescription, summarizeInvitations, summarizeMembers } from "@/lib/member-summary";
import { createAdminClient } from "@/lib/supabase/admin";
import { Activity, Crown, Mail, ShieldCheck, UserCheck, UserCog, UserRoundX, Users } from "lucide-react";

const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type MemberRow = {
  user_id: string;
  role: OrganizationRole;
  status: MemberStatus;
  joined_at: string | null;
  created_at: string;
};

type InvitationRow = {
  id: string;
  email: string;
  role: OrganizationRole;
  status: OrganizationInvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function invitationExpired(invitation: InvitationRow) {
  return invitation.status === "pending" && new Date(invitation.expires_at).getTime() <= Date.now();
}

function roleTone(role: OrganizationRole) {
  if (role === "owner") return "text-amber-200";
  if (role === "admin") return "text-blue-200";
  return "text-slate-300";
}

function statusTone(status: MemberStatus | OrganizationInvitationStatus) {
  if (status === "active" || status === "accepted") return "text-emerald-200";
  if (status === "disabled" || status === "revoked") return "text-rose-200";
  return "text-amber-200";
}

type MembersPageProps = {
  searchParams: Promise<{ memberPage?: string; memberSearch?: string }>;
};

function parsePositiveInt(value: string | undefined, fallback = 1) {
  const next = Number(value ?? String(fallback));
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : fallback;
}

type DirectoryRpcResult = { total?: number; people?: DirectoryPerson[] };

export default async function Page({ searchParams }: MembersPageProps) {
  const [{ user, membership }, params] = await Promise.all([requireOrganizationManager(), searchParams]);
  const supabase = createAdminClient();
  const organizationId = membership.organization.id;
  const memberPage = parsePositiveInt(params.memberPage);
  const memberSearch = (params.memberSearch ?? "").trim().slice(0, 100);
  const directoryPageSize = 10;

  const userOrganizations = await listUserOrganizations(user.id);
  const managedOrganizations = userOrganizations
    .filter((item) => item.role === "owner" || item.role === "admin")
    .map((item) => ({ id: item.organization.id, name: item.organization.name }));

  const [membersResult, invitationsResult, auditLogsResult, directoryResult] = await Promise.all([
    supabase
      .from("organization_members")
      .select("user_id, role, status, joined_at, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_invitations")
      .select("id, email, role, status, token, expires_at, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_logs")
      .select("id, organization_id, actor_user_id, action, target_type, target_id, metadata, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.rpc("list_managed_workspace_members", {
      p_manager_user_id: user.id,
      p_limit: directoryPageSize,
      p_offset: (memberPage - 1) * directoryPageSize,
      p_search: memberSearch,
    }),
  ]);

  const memberRows = (membersResult.data ?? []) as MemberRow[];
  const invitationRows = (invitationsResult.data ?? []) as InvitationRow[];
  const invitationLoadError = invitationsResult.error?.message ?? null;
  const directoryData = (directoryResult.data ?? {}) as DirectoryRpcResult;
  const directoryPeople = directoryData.people ?? [];
  const directoryTotal = directoryData.total ?? directoryPeople.length;
  const memberSummary = summarizeMembers(memberRows);
  const invitationSummary = summarizeInvitations(invitationRows);

  const metrics = [
    {
      label: "Active members",
      value: String(memberSummary.statuses.active),
      helper: `${memberSummary.total} total accounts`,
      icon: Users,
      color: "text-emerald-200",
    },
    {
      label: "Managers",
      value: String(memberSummary.managerCount),
      helper: `${memberSummary.roles.owner} owner, ${memberSummary.roles.admin} admin`,
      icon: ShieldCheck,
      color: "text-blue-200",
    },
    {
      label: "Pending invites",
      value: String(invitationSummary.statuses.pending),
      helper: `${invitationSummary.total} invitation records`,
      icon: Mail,
      color: "text-amber-200",
    },
    {
      label: "Disabled",
      value: String(memberSummary.statuses.disabled),
      helper: "Accounts blocked from access",
      icon: UserRoundX,
      color: "text-rose-200",
    },
  ];

  return (
    <AppShell title="Members" description="Invite teammates, review active members, and enforce organization-scoped roles.">
      <div className="space-y-6">
        <section className="glass-strong rounded-lg p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Access control</p>
              <h2 className="mt-3 font-outfit text-3xl font-semibold md:text-4xl">{membership.organization.name}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Owners and admins can manage organization settings, Notion sync, knowledge indexing, insights, and member access. Members keep the product focused on asking Kora and reviewing their own conversations.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your role</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-ink">
                  <Crown size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xl font-semibold capitalize text-white">{membership.role}</p>
                  <p className="text-sm text-slate-500">{roleDescription(membership.role)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="glass-panel rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                  <p className="mt-4 font-mono text-3xl font-semibold text-white">{metric.value}</p>
                </div>
                <metric.icon className={metric.color} size={22} aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{metric.helper}</p>
            </article>
          ))}
        </section>

        <InviteMemberForm organizationName={membership.organization.name} action={inviteMemberAction} />

        <WorkspaceMemberDirectory
          people={directoryPeople}
          organizations={managedOrganizations}
          activeOrganizationId={organizationId}
          addAccessAction={addExistingMemberToOrganizationAction}
          updateRoleAction={updateMemberRoleAction}
          disableAction={disableMemberAction}
          removeAction={removeMemberAction}
          totalPeople={directoryTotal}
          page={memberPage}
          search={memberSearch}
        />
        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="glass-panel rounded-lg p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Invitations</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold">Pending access</h2>
              </div>
              <Mail className="text-blue-200" size={22} aria-hidden="true" />
            </div>
            <div className="space-y-3">
              {invitationLoadError ? (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">Could not load invitations. Database says: {invitationLoadError}</p>
              ) : invitationRows.length === 0 ? (
                <p className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-400">No invitations yet.</p>
              ) : (
                invitationRows.map((invite) => (
                  <article key={invite.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{invite.email}</p>
                          <span className={`glass-soft rounded px-2 py-1 text-xs capitalize ${roleTone(invite.role)}`}>{invite.role}</span>
                          <span className={`glass-soft rounded px-2 py-1 text-xs capitalize ${invitationExpired(invite) ? "text-rose-200" : statusTone(invite.status)}`}>{invitationExpired(invite) ? "expired" : invite.status}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Created {formatDate(invite.created_at)} / Expires {formatDate(invite.expires_at)}</p>
                        {invite.status === "pending" && !invitationExpired(invite) ? <p className="mt-2 break-all font-mono text-xs text-blue-300">{appUrl}/invitations/{invite.token}</p> : null}
                      </div>
                      {invite.status === "pending" && !invitationExpired(invite) ? <RevokeInvitationForm invitationId={invite.id} action={revokeInvitationAction} /> : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel rounded-lg p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Audit trail</p>
                <h2 className="mt-2 font-outfit text-2xl font-semibold">Recent access events</h2>
              </div>
              <Activity className="text-blue-200" size={22} aria-hidden="true" />
            </div>
            <div className="kora-scroll-panel max-h-[520px] space-y-3 overflow-y-auto pr-2">
              {((auditLogsResult.data ?? []) as AuditLog[]).length === 0 ? (
                <p className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-400">No audit events yet.</p>
              ) : (
                ((auditLogsResult.data ?? []) as AuditLog[]).map((event) => (
                  <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                    <div className="flex items-start gap-3">
                      <UserCog className="mt-1 shrink-0 text-blue-200" size={16} aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{event.action}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(event.created_at)}</p>
                        {event.target_type ? <p className="mt-1 text-xs text-slate-500">{event.target_type}{event.target_id ? ` / ${event.target_id.slice(0, 8)}` : ""}</p> : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-lg p-6">
          <div className="flex items-start gap-3">
            <UserCheck className="mt-1 text-blue-200" size={22} aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Access model</p>
              <h2 className="mt-2 font-outfit text-2xl font-semibold">Least-privilege roles</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Keep most teammates as members unless they need to manage sync, settings, insights, or users. Owner accounts should stay limited because they can manage other managers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
