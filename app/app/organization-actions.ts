"use server";

import { normalizeSlug, getCurrentUser, getPrimaryOrganization, listUserOrganizations } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import { invalidateOrganizationSummaryCache } from "@/lib/organization-summary-cache";
import { parseRetrievalThresholdPercent } from "@/lib/ai-settings";
import { checkDistributedRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import type { OrganizationPreference, OrganizationRole } from "@/lib/database.types";
import { sendInvitationEmail } from "@/lib/invitation-email";
import { logOperationalEvent } from "@/lib/operational-logging";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { answerLanguageSchema, answerLengthSchema, answerToneSchema, getFormString, organizationRoleSchema, parseWithSchema } from "@/lib/validation/action-schemas";

function getString(formData: FormData, key: string) {
  return getFormString(formData, key);
}

function parseRole(value: string): OrganizationRole | null {
  return parseWithSchema(organizationRoleSchema, value);
}

function parseAnswerLength(value: string): OrganizationPreference["answer_length"] | null {
  return parseWithSchema(answerLengthSchema, value);
}

function parseAnswerTone(value: string): OrganizationPreference["answer_tone"] | null {
  return parseWithSchema(answerToneSchema, value);
}

function parseAnswerLanguage(value: string): OrganizationPreference["default_language"] | null {
  return parseWithSchema(answerLanguageSchema, value);
}

async function requireManagerContext(): Promise<{
  userId: string;
  organizationId: string;
  role: OrganizationRole;
}> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getPrimaryOrganization(user.id);

  if (!membership) {
    redirect("/setup/organization");
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return redirect("/app");
  }

  return {
    userId: user.id,
    organizationId: membership.organization.id,
    role: membership.role,
  };
}

async function createAuditLog(
  organizationId: string,
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_user_id: actorUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

async function getTargetMember(organizationId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function enforceManagerRateLimit(context: { userId: string; organizationId: string }, scope: string, limit: number, windowMs: number): Promise<ActionState | null> {
  const rateLimit = await checkDistributedRateLimit({
    key: `${scope}:${context.organizationId}:${context.userId}`,
    limit,
    windowMs,
  });

  return rateLimit.allowed ? null : { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
}

export async function switchActiveOrganizationAction(formData: FormData) {
  const organizationId = getString(formData, "organizationId");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const organizations = await listUserOrganizations(user.id);
  const canAccess = organizations.some((item) => item.organization.id === organizationId);

  if (!canAccess) {
    redirect("/app");
  }

  const cookieStore = await cookies();
  cookieStore.set("kora_active_organization_id", organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function updateOrganizationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireManagerContext();
  const rateLimitError = await enforceManagerRateLimit(context, "organization-update", 20, 60 * 60 * 1000);

  if (rateLimitError) {
    return rateLimitError;
  }

  const name = getString(formData, "name");
  const requestedSlug = getString(formData, "slug");
  const slug = normalizeSlug(requestedSlug || name);

  if (name.length < 2 || name.length > 100) {
    return { error: "Organization name must be between 2 and 100 characters." };
  }

  if (slug.length < 2) {
    return { error: "Organization slug must contain at least 2 URL-safe characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_organization_profile", {
    p_organization_id: context.organizationId,
    p_name: name,
    p_slug: slug,
  });

  if (error) {
    return { error: error.message };
  }

  await createAuditLog(context.organizationId, context.userId, "organization.updated", "organization", context.organizationId, { name, slug });
  revalidatePath("/", "layout");
  return { message: "Organization updated." };
}

export async function updateAiSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireManagerContext();
  const rateLimitError = await enforceManagerRateLimit(context, "ai-settings-update", 20, 60 * 60 * 1000);

  if (rateLimitError) {
    return rateLimitError;
  }

  const threshold = parseRetrievalThresholdPercent(getString(formData, "retrievalThreshold"));
  const answerLength = parseAnswerLength(getString(formData, "answerLength"));
  const answerTone = parseAnswerTone(getString(formData, "answerTone"));
  const defaultLanguage = parseAnswerLanguage(getString(formData, "defaultLanguage"));

  if (!threshold.ok) {
    return { error: threshold.error };
  }
  if (!answerLength) {
    return { error: "Choose a valid answer length." };
  }
  if (!answerTone) {
    return { error: "Choose a valid answer tone." };
  }
  if (!defaultLanguage) {
    return { error: "Choose a valid answer language." };
  }

  const supabase = await createClient();
  const updatedAt = new Date().toISOString();
  const { error: organizationError } = await supabase.rpc("update_organization_retrieval_threshold", {
    p_organization_id: context.organizationId,
    p_retrieval_threshold: threshold.value,
  });

  if (organizationError) {
    return { error: organizationError.message };
  }

  const { error: preferenceError } = await supabase
    .from("organization_preferences")
    .upsert({
      organization_id: context.organizationId,
      answer_length: answerLength,
      answer_tone: answerTone,
      default_language: defaultLanguage,
      citations_required: true,
      no_answer_behavior: "clear_gap",
      updated_at: updatedAt,
    }, { onConflict: "organization_id" });

  if (preferenceError) {
    return { error: preferenceError.message };
  }

  await createAuditLog(context.organizationId, context.userId, "ai_settings.updated", "organization", context.organizationId, {
    retrieval_threshold: threshold.value,
    answer_length: answerLength,
    answer_tone: answerTone,
    default_language: defaultLanguage,
  });
  revalidatePath("/", "layout");
  revalidatePath("/app/settings");
  return { message: "AI settings updated." };
}
export async function deleteOrganizationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireManagerContext();

  if (context.role !== "owner") {
    return { error: "Only the organization owner can delete this organization." };
  }

  const submittedOrganizationName = getString(formData, "organizationName");
  const confirmation = getString(formData, "confirmation");

  if (!submittedOrganizationName) {
    return { error: "Organization confirmation is missing. Refresh and try again." };
  }

  const rateLimitError = await enforceManagerRateLimit(context, "organization-delete", 3, 60 * 60 * 1000);

  if (rateLimitError) {
    return rateLimitError;
  }

  const admin = createAdminClient();
  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .select("id, name, owner_user_id")
    .eq("id", context.organizationId)
    .maybeSingle();

  if (organizationError || !organization) {
    return { error: "Organization could not be found." };
  }

  if (organization.owner_user_id !== context.userId) {
    return { error: "Only the organization owner can delete this organization." };
  }

  if (organization.name !== submittedOrganizationName) {
    return { error: "Organization confirmation no longer matches. Refresh and try again." };
  }

  if (confirmation !== organization.name) {
    return { error: 'Type "' + organization.name + '" to confirm deletion.' };
  }

  const { error: deleteError } = await admin
    .from("organizations")
    .delete()
    .eq("id", context.organizationId)
    .eq("owner_user_id", context.userId);

  if (deleteError) {
    logOperationalEvent("error", "organization.delete_failed", {
      organizationId: context.organizationId,
      actorUserId: context.userId,
      code: deleteError.code,
      error: deleteError.message,
    });
    return { error: "Organization could not be deleted. Try again or check database permissions." };
  }

  const { data: remainingMemberships } = await admin
    .from("organization_members")
    .select("organization_id, created_at")
    .eq("user_id", context.userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  const cookieStore = await cookies();
  const nextOrganizationId = remainingMemberships?.[0]?.organization_id;

  if (nextOrganizationId) {
    cookieStore.set("kora_active_organization_id", nextOrganizationId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    cookieStore.delete("kora_active_organization_id");
  }

  revalidatePath("/", "layout");
  redirect(nextOrganizationId ? "/app" : "/setup/organization");
}
export async function inviteMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireManagerContext();
  const rateLimitError = await enforceManagerRateLimit(context, "member-invite", 10, 60 * 60 * 1000);

  if (rateLimitError) {
    return rateLimitError;
  }

  const email = getString(formData, "email").toLowerCase();
  const role = parseRole(getString(formData, "role"));

  if (!email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  if (!role || role === "owner") {
    return { error: "Invite members as admin or member. Ownership transfer is not available yet." };
  }

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("organization_invitations")
    .upsert(
      {
        organization_id: context.organizationId,
        email,
        role,
        status: "pending",
        invited_by: context.userId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "organization_id,email" },
    )
    .select("id, token")
    .single();

  if (error) {
    return { error: error.message };
  }

  const admin = createAdminClient();
  const [{ data: organization }, { data: profile }] = await Promise.all([
    admin.from("organizations").select("name").eq("id", context.organizationId).maybeSingle(),
    admin.from("profiles").select("full_name, display_name").eq("id", context.userId).maybeSingle(),
  ]);
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const invitationUrl = `${appUrl}/invitations/${data.token}`;
  const organizationName = organization?.name ?? "your Kora workspace";
  const inviterName = profile?.display_name || profile?.full_name || "A workspace admin";

  let delivery;

  try {
    delivery = await sendInvitationEmail({
      to: email,
      organizationName,
      inviterName,
      role,
      invitationUrl,
    });
  } catch (emailError) {
    await createAuditLog(context.organizationId, context.userId, "member.invite_email_failed", "organization_invitation", data.id, {
      email,
      role,
      error: emailError instanceof Error ? emailError.message : "Unknown email error",
    });
    await invalidateOrganizationSummaryCache(context.organizationId);
    revalidatePath("/app/members");
    return { error: `Invitation was created, but the email could not be sent. Share ${invitationUrl} with ${email}.` };
  }

  await createAuditLog(context.organizationId, context.userId, "member.invited", "organization_invitation", data.id, { email, role, delivery });
  await invalidateOrganizationSummaryCache(context.organizationId);
  revalidatePath("/app/members");

  const deliveryStatus = delivery.rejected.length > 0 ? "Gmail reported a rejected recipient" : "Gmail accepted the email";
  return { message: `${deliveryStatus}. Invite link: ${invitationUrl}` };
}
export async function addExistingMemberToOrganizationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = getString(formData, "userId");
  const organizationId = getString(formData, "organizationId");
  const role = parseRole(getString(formData, "role"));

  if (!userId || !organizationId || !role || role === "owner") {
    return { error: "Choose a person, organization, and member or admin role." };
  }

  const rateLimit = await checkDistributedRateLimit({
    key: `member-add-existing:${organizationId}:${user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  const admin = createAdminClient();
  const { data: actorMemberships, error: actorError } = await admin
    .from("organization_members")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"]);

  if (actorError) {
    return { error: "Could not verify your managed organizations." };
  }

  const managedOrganizationIds = (actorMemberships ?? []).map((membership) => membership.organization_id);

  if (!managedOrganizationIds.includes(organizationId)) {
    return { error: "You can only add people to organizations you manage." };
  }

  const { data: knownMembership, error: knownError } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .in("organization_id", managedOrganizationIds)
    .limit(1)
    .maybeSingle();

  if (knownError || !knownMembership) {
    return { error: "That person is not part of an organization you manage." };
  }

  const { data: existingMembership, error: existingError } = await admin
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    return { error: "Could not check the person's existing access." };
  }

  if (existingMembership?.role === "owner") {
    return { error: "Owner access cannot be changed from this directory." };
  }

  if (existingMembership?.status === "active") {
    return { error: "That person already has access to this organization." };
  }

  const supabase = await createClient();
  const { error: membershipError } = await supabase.rpc("add_existing_organization_member", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_role: role,
  });

  if (membershipError) {
    logOperationalEvent("error", "member.existing_access_failed", {
      organizationId,
      actorUserId: user.id,
      targetUserId: userId,
      code: membershipError.code,
      error: membershipError.message,
    });
    return { error: "Organization access could not be added." };
  }

  await createAuditLog(organizationId, user.id, "member.access_added", "user", userId, {
    role,
    source: "managed_directory",
  });
  await invalidateOrganizationSummaryCache(organizationId);
  revalidatePath("/app/members");
  revalidatePath("/", "layout");
  return { message: "Organization access added." };
}
export async function updateMemberRoleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireManagerContext();
  const rateLimitError = await enforceManagerRateLimit(context, "member-role-update", 20, 60 * 60 * 1000);

  if (rateLimitError) {
    return rateLimitError;
  }

  const userId = getString(formData, "userId");
  const role = parseRole(getString(formData, "role"));

  if (!userId || !role) {
    return { error: "Choose a member and role." };
  }

  if (userId === context.userId) {
    return { error: "You cannot change your own role." };
  }

  if (role === "owner") {
    return { error: "Ownership transfer is not available yet." };
  }

  const targetMember = await getTargetMember(context.organizationId, userId);

  if (!targetMember) {
    return { error: "That member is no longer active in this organization." };
  }

  if (targetMember.role === "owner") {
    return { error: "Owner access cannot be changed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_organization_member_role", {
    p_organization_id: context.organizationId,
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    return { error: error.message };
  }

  await createAuditLog(context.organizationId, context.userId, "member.role_updated", "user", userId, { role });
  await invalidateOrganizationSummaryCache(context.organizationId);
  revalidatePath("/app/members");
  return { message: "Member role updated." };
}

export async function disableMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireManagerContext();
  const rateLimitError = await enforceManagerRateLimit(context, "member-disable", 20, 60 * 60 * 1000);

  if (rateLimitError) {
    return rateLimitError;
  }

  const userId = getString(formData, "userId");

  if (!userId) {
    return { error: "Choose a member to disable." };
  }

  if (userId === context.userId) {
    return { error: "You cannot disable yourself." };
  }

  const targetMember = await getTargetMember(context.organizationId, userId);

  if (!targetMember) {
    return { error: "That member is no longer active in this organization." };
  }

  if (targetMember.role === "owner") {
    return { error: "Owner access cannot be changed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("disable_organization_member", {
    p_organization_id: context.organizationId,
    p_user_id: userId,
  });

  if (error) {
    return { error: error.message };
  }

  await createAuditLog(context.organizationId, context.userId, "member.disabled", "user", userId);
  await invalidateOrganizationSummaryCache(context.organizationId);
  revalidatePath("/app/members");
  return { message: "Member disabled." };
}

export async function removeMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireManagerContext();
  const rateLimitError = await enforceManagerRateLimit(context, "member-remove", 20, 60 * 60 * 1000);

  if (rateLimitError) {
    return rateLimitError;
  }

  const userId = getString(formData, "userId");

  if (!userId) {
    return { error: "Choose a member to remove." };
  }

  if (userId === context.userId) {
    return { error: "You cannot remove yourself." };
  }

  const targetMember = await getTargetMember(context.organizationId, userId);

  if (!targetMember) {
    return { error: "That member is no longer active in this organization." };
  }

  if (targetMember.role === "owner") {
    return { error: "Owner access cannot be changed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_organization_member", {
    p_organization_id: context.organizationId,
    p_user_id: userId,
  });

  if (error) {
    return { error: error.message };
  }

  await createAuditLog(context.organizationId, context.userId, "member.removed", "user", userId);
  await invalidateOrganizationSummaryCache(context.organizationId);
  revalidatePath("/app/members");
  return { message: "Member removed." };
}

export async function revokeInvitationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireManagerContext();
  const rateLimitError = await enforceManagerRateLimit(context, "member-invitation-revoke", 20, 60 * 60 * 1000);

  if (rateLimitError) {
    return rateLimitError;
  }

  const invitationId = getString(formData, "invitationId");

  if (!invitationId) {
    return { error: "Choose an invitation to revoke." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "revoked" })
    .eq("organization_id", context.organizationId)
    .eq("id", invitationId);

  if (error) {
    return { error: error.message };
  }

  await createAuditLog(context.organizationId, context.userId, "member.invitation_revoked", "organization_invitation", invitationId);
  await invalidateOrganizationSummaryCache(context.organizationId);
  revalidatePath("/app/members");
  return { message: "Invitation revoked." };
}

export async function acceptInvitationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = getString(formData, "token");
  const rateLimit = await checkDistributedRateLimit({
    key: `invitation-accept:${token || "missing"}`,
    limit: 10,
    windowMs: 30 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterSeconds) };
  }

  if (!token) {
    return { error: "Invitation token is missing." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_organization_invitation", {
    p_token: token,
  });

  if (error) {
    return { error: error.message };
  }

  if (typeof data === "string") {
    const cookieStore = await cookies();
    cookieStore.set("kora_active_organization_id", data, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/", "layout");
  redirect("/onboarding/welcome");
}


