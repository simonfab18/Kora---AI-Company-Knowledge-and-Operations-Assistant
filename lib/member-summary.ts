import type { MemberStatus, OrganizationInvitationStatus, OrganizationRole } from "@/lib/database.types";

export type MemberSummaryInput = {
  role: OrganizationRole;
  status: MemberStatus;
};

export type InvitationSummaryInput = {
  status: OrganizationInvitationStatus;
};

export function summarizeMembers(members: MemberSummaryInput[]) {
  const roles: Record<OrganizationRole, number> = {
    owner: 0,
    admin: 0,
    member: 0,
  };
  const statuses: Record<MemberStatus, number> = {
    invited: 0,
    active: 0,
    disabled: 0,
  };

  for (const member of members) {
    roles[member.role] += 1;
    statuses[member.status] += 1;
  }

  return {
    total: members.length,
    roles,
    statuses,
    managerCount: roles.owner + roles.admin,
  };
}

export function summarizeInvitations(invitations: InvitationSummaryInput[]) {
  const statuses: Record<OrganizationInvitationStatus, number> = {
    pending: 0,
    accepted: 0,
    revoked: 0,
  };

  for (const invitation of invitations) {
    statuses[invitation.status] += 1;
  }

  return {
    total: invitations.length,
    statuses,
  };
}

export function memberDisplayName(fullName: string | null | undefined, userId: string) {
  return fullName?.trim() || `User ${userId.slice(0, 8)}`;
}

export function roleDescription(role: OrganizationRole) {
  if (role === "owner") return "Full workspace ownership and admin control.";
  if (role === "admin") return "Can manage settings, sync, members, and insights.";
  return "Can ask Kora and review their own conversations.";
}
