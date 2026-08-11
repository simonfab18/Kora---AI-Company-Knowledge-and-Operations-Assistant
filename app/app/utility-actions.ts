"use server";

import type { ActionState } from "@/lib/action-state";
import { getCurrentUser, getPrimaryOrganization } from "@/lib/auth";
import { requireActiveOrganization, requireOrganizationManager } from "@/lib/authorization";
import { checkDistributedRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return getString(formData, key) === "on";
}

function requiredLength(value: string, min: number, max: number) {
  return value.length >= min && value.length <= max;
}

async function optionalUserContext() {
  const user = await getCurrentUser();
  const membership = user ? await getPrimaryOrganization(user.id) : null;
  return { user, membership };
}

async function enforceLocalRateLimit(scope: string, identity: string, limit: number, windowMs: number): Promise<ActionState | null> {
  const result = await checkDistributedRateLimit({ key: `${scope}:${identity}`, limit, windowMs });
  return result.allowed ? null : { error: rateLimitMessage(result.retryAfterSeconds) };
}

async function createAuditLog(organizationId: string, actorUserId: string, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_user_id: actorUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

export async function updateProfileAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireActiveOrganization();
  const fullName = getString(formData, "fullName");
  const displayName = getString(formData, "displayName");
  const jobTitle = getString(formData, "jobTitle");
  const department = getString(formData, "department");
  const preferredLanguage = getString(formData, "preferredLanguage") || "English";

  if (!requiredLength(fullName, 2, 120)) {
    return { error: "Full name must be between 2 and 120 characters." };
  }

  const rateLimit = await enforceLocalRateLimit("profile-update", user.id, 20, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    display_name: displayName || null,
    job_title: jobTitle || null,
    department: department || null,
    preferred_language: preferredLanguage,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: "Profile could not be saved. Run the latest utility navigation migration, then try again." };
  }

  revalidatePath("/app/profile");
  revalidatePath("/", "layout");
  return { message: "Profile saved." };
}

export async function updateAccountPreferencesAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireActiveOrganization();
  const appearance = getString(formData, "appearancePreference") === "system" ? "system" : "dark";
  const notificationPreferences = {
    sync: getBoolean(formData, "notifySync"),
    members: getBoolean(formData, "notifyMembers"),
    gaps: getBoolean(formData, "notifyGaps"),
  };

  const rateLimit = await enforceLocalRateLimit("account-preferences-update", user.id, 20, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    appearance_preference: appearance,
    notification_preferences: notificationPreferences,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: "Account preferences could not be saved. Run the latest utility navigation migration, then try again." };
  }

  revalidatePath("/app/account");
  return { message: "Account preferences saved." };
}

export async function markNotificationsReadAction(formData: FormData): Promise<void> {
  const { user, membership } = await requireActiveOrganization();
  const notificationIds = formData.getAll("notificationId").filter((value): value is string => typeof value === "string" && value.length > 0).slice(0, 20);

  if (notificationIds.length === 0) return;

  const supabase = createAdminClient();
  await supabase.from("user_notification_reads").upsert(
    notificationIds.map((notificationId) => ({
      organization_id: membership.organization.id,
      user_id: user.id,
      notification_id: notificationId,
      read_at: new Date().toISOString(),
    })),
    { onConflict: "organization_id,user_id,notification_id" },
  );

  revalidatePath("/", "layout");
  revalidatePath("/app/notifications");
}

export async function createCollectionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { user, membership } = await requireOrganizationManager();
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const icon = getString(formData, "icon") || "book";
  const visibility = getString(formData, "visibility") === "managers" ? "managers" : "organization";

  if (!requiredLength(name, 2, 100)) {
    return { error: "Collection name must be between 2 and 100 characters." };
  }

  const rateLimit = await enforceLocalRateLimit("collection-create", `${membership.organization.id}:${user.id}`, 20, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("knowledge_collections")
    .insert({
      organization_id: membership.organization.id,
      name,
      description: description || null,
      icon,
      visibility,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Collection could not be created. Run the latest utility navigation migration, then try again." };
  }

  await createAuditLog(membership.organization.id, user.id, "knowledge_collection.created", "knowledge_collection", data.id, { name, visibility });
  revalidatePath("/app/collections/new");
  return { message: "Collection created." };
}


export async function updateCollectionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { user, membership } = await requireOrganizationManager();
  const collectionId = getString(formData, "collectionId");
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const visibility = getString(formData, "visibility") === "managers" ? "managers" : "organization";

  if (!collectionId) {
    return { error: "Choose a collection to update." };
  }

  if (!requiredLength(name, 2, 100)) {
    return { error: "Collection name must be between 2 and 100 characters." };
  }

  const rateLimit = await enforceLocalRateLimit("collection-update", `${membership.organization.id}:${user.id}`, 40, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("knowledge_collections")
    .update({
      name,
      description: description || null,
      visibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", collectionId)
    .eq("organization_id", membership.organization.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Collection could not be updated. Run the latest utility navigation migration, then try again." };
  }

  if (!data) {
    return { error: "Collection could not be found in this organization." };
  }

  await createAuditLog(membership.organization.id, user.id, "knowledge_collection.updated", "knowledge_collection", collectionId, { name, visibility });
  revalidatePath("/app/collections/new");
  return { message: "Collection saved." };
}

export async function deleteCollectionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { user, membership } = await requireOrganizationManager();
  const collectionId = getString(formData, "collectionId");
  const confirmation = getString(formData, "confirmation");

  if (!collectionId) {
    return { error: "Choose a collection to remove." };
  }

  const rateLimit = await enforceLocalRateLimit("collection-delete", `${membership.organization.id}:${user.id}`, 20, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const { data: collection, error: collectionError } = await supabase
    .from("knowledge_collections")
    .select("id, name")
    .eq("id", collectionId)
    .eq("organization_id", membership.organization.id)
    .maybeSingle();

  if (collectionError || !collection) {
    return { error: "Collection could not be found in this organization." };
  }

  const expectedConfirmation = `remove ${collection.name}`;
  if (confirmation !== expectedConfirmation) {
    return { error: `Type "${expectedConfirmation}" to confirm.` };
  }

  const { error } = await supabase
    .from("knowledge_collections")
    .delete()
    .eq("id", collectionId)
    .eq("organization_id", membership.organization.id);

  if (error) {
    return { error: "Collection could not be removed." };
  }

  await createAuditLog(membership.organization.id, user.id, "knowledge_collection.deleted", "knowledge_collection", collectionId, { name: collection.name });
  revalidatePath("/app/collections/new");
  return { message: "Collection removed. Knowledge documents were not deleted." };
}
export async function addDocumentToCollectionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { user, membership } = await requireOrganizationManager();
  const collectionId = getString(formData, "collectionId");
  const documentId = getString(formData, "documentId");

  if (!collectionId || !documentId) {
    return { error: "Choose a collection and document." };
  }

  const rateLimit = await enforceLocalRateLimit("collection-document-add", `${membership.organization.id}:${user.id}`, 40, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const [{ data: collection }, { data: document }] = await Promise.all([
    supabase
      .from("knowledge_collections")
      .select("id, name")
      .eq("id", collectionId)
      .eq("organization_id", membership.organization.id)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("id, title")
      .eq("id", documentId)
      .eq("organization_id", membership.organization.id)
      .maybeSingle(),
  ]);

  if (!collection || !document) {
    return { error: "Collection or document could not be found in this organization." };
  }

  const { error } = await supabase.from("knowledge_collection_documents").insert({
    organization_id: membership.organization.id,
    collection_id: collectionId,
    document_id: documentId,
    added_by: user.id,
  });

  if (error) {
    if (error.code === "42P01" || error.message.includes("knowledge_collection_documents")) {
      return { error: "Document assignments are not ready. Run supabase/migrations/20260726113000_collection_documents.sql in Supabase, then refresh." };
    }

    if (error.code === "23505") {
      return { message: `${document.title} is already in ${collection.name}.` };
    }

    if (error.code === "23503") {
      return { error: "That collection or document no longer exists." };
    }

    if (error.code === "42501") {
      return { error: "Document assignments are still blocked by database permissions. Run the latest collection documents migration again, then refresh." };
    }

    return { error: `Document could not be added to the collection. Database says: ${error.message}` };
  }

  await createAuditLog(membership.organization.id, user.id, "knowledge_collection.document_added", "document", documentId, {
    collection_id: collectionId,
  });
  revalidatePath("/app/collections/new");
  return { message: `Added ${document.title} to ${collection.name}.` };
}

export async function removeDocumentFromCollectionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { user, membership } = await requireOrganizationManager();
  const collectionId = getString(formData, "collectionId");
  const documentId = getString(formData, "documentId");

  if (!collectionId || !documentId) {
    return { error: "Choose a collection document to remove." };
  }

  const rateLimit = await enforceLocalRateLimit("collection-document-remove", `${membership.organization.id}:${user.id}`, 40, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("knowledge_collection_documents")
    .delete()
    .eq("organization_id", membership.organization.id)
    .eq("collection_id", collectionId)
    .eq("document_id", documentId);

  if (error) {
    return { error: "Document could not be removed from the collection." };
  }

  await createAuditLog(membership.organization.id, user.id, "knowledge_collection.document_removed", "document", documentId, {
    collection_id: collectionId,
  });
  revalidatePath("/app/collections/new");
  return { message: "Document removed from collection." };
}
export async function submitSupportTicketAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const context = await optionalUserContext();
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const organizationName = getString(formData, "organizationName");
  const subject = getString(formData, "subject");
  const category = getString(formData, "category");
  const description = getString(formData, "description");

  if (!requiredLength(name, 2, 120) || !email.includes("@") || !requiredLength(subject, 3, 160) || !requiredLength(description, 10, 4000)) {
    return { error: "Complete the required support fields before submitting." };
  }

  const rateLimit = await enforceLocalRateLimit("support-ticket", email, 5, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const { error } = await supabase.from("support_tickets").insert({
    organization_id: context.membership?.organization.id ?? null,
    submitted_by: context.user?.id ?? null,
    name,
    email,
    organization_name: organizationName || context.membership?.organization.name || null,
    subject,
    category: category || "General question",
    description,
  });

  if (error) {
    return { error: "Support request could not be saved. Run the latest utility navigation migration, then try again." };
  }

  return { message: "Support request saved." };
}

export async function submitProblemReportAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const context = await optionalUserContext();
  const title = getString(formData, "title");
  const category = getString(formData, "category");
  const pageUrl = getString(formData, "pageUrl");
  const whatHappened = getString(formData, "whatHappened");
  const expectedBehavior = getString(formData, "expectedBehavior");
  const stepsToReproduce = getString(formData, "stepsToReproduce");
  const includeDiagnostics = getBoolean(formData, "includeDiagnostics");
  const identity = context.user?.id ?? (pageUrl || title);

  if (!requiredLength(title, 3, 160) || !requiredLength(whatHappened, 10, 4000) || !requiredLength(expectedBehavior, 5, 2000) || !requiredLength(stepsToReproduce, 5, 4000)) {
    return { error: "Complete the required problem report fields before submitting." };
  }

  const rateLimit = await enforceLocalRateLimit("problem-report", identity, 5, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const supabase = createAdminClient();
  const { error } = await supabase.from("problem_reports").insert({
    organization_id: context.membership?.organization.id ?? null,
    submitted_by: context.user?.id ?? null,
    title,
    category: category || "Other",
    page_url: pageUrl || null,
    what_happened: whatHappened,
    expected_behavior: expectedBehavior,
    steps_to_reproduce: stepsToReproduce,
    include_diagnostics: includeDiagnostics,
  });

  if (error) {
    return { error: "Problem report could not be saved. Run the latest utility navigation migration, then try again." };
  }

  return { message: "Problem report saved." };
}

