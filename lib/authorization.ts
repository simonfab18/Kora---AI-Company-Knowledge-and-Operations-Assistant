import { canManageOrganization, getCurrentUser, getPrimaryOrganization } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireActiveOrganization() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getPrimaryOrganization(user.id);

  if (!membership) {
    redirect("/setup/organization");
  }

  return { user, membership };
}

export async function requireOrganizationManager() {
  const context = await requireActiveOrganization();

  if (!canManageOrganization(context.membership.role)) {
    redirect("/app");
  }

  return context;
}

