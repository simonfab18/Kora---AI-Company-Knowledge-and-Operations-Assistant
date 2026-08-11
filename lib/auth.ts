import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { OrganizationRole, MemberStatus } from "@/lib/database.types";

export type ActiveOrganization = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: OrganizationRole;
  status: MemberStatus;
};

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 72);
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

function toActiveOrganization(data: {
  role: unknown;
  status: unknown;
  organizations: unknown;
}): ActiveOrganization | null {
  const organization = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;

  if (
    !organization ||
    typeof organization !== "object" ||
    !("id" in organization) ||
    !("name" in organization) ||
    !("slug" in organization) ||
    !isOrganizationRole(data.role) ||
    !isMemberStatus(data.status)
  ) {
    return null;
  }

  return {
    organization: organization as ActiveOrganization["organization"],
    role: data.role,
    status: data.status,
  };
}

export async function listUserOrganizations(userId: string): Promise<ActiveOrganization[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, status, organizations(id, name, slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.flatMap((item) => {
    const organization = toActiveOrganization(item);
    return organization ? [organization] : [];
  });
}

export async function getPrimaryOrganization(userId: string): Promise<ActiveOrganization | null> {
  const organizations = await listUserOrganizations(userId);

  if (organizations.length === 0) {
    return null;
  }

  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get("kora_active_organization_id")?.value;

  if (activeOrganizationId) {
    const activeOrganization = organizations.find(
      (item) => item.organization.id === activeOrganizationId,
    );

    if (activeOrganization) {
      return activeOrganization;
    }
  }

  return organizations[0];
}

export function isOrganizationRole(value: unknown): value is OrganizationRole {
  return value === "owner" || value === "admin" || value === "member";
}

export function isMemberStatus(value: unknown): value is MemberStatus {
  return value === "invited" || value === "active" || value === "disabled";
}

export function canManageOrganization(role: OrganizationRole | null | undefined) {
  return role === "owner" || role === "admin";
}

