"use server";

import type { ActionState } from "@/lib/action-state";
import { invalidateOrganizationSummaryCache } from "@/lib/organization-summary-cache";
import { requireOrganizationManager } from "@/lib/authorization";
import type { KnowledgeGapStatus } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const nextStatuses = new Set<KnowledgeGapStatus>(["open", "reviewing", "resolved", "dismissed"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function createAuditLog(
  organizationId: string,
  actorUserId: string,
  gapId: string,
  metadata: Record<string, unknown>,
) {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_user_id: actorUserId,
    action: "knowledge_gap.updated",
    target_type: "knowledge_gap",
    target_id: gapId,
    metadata,
  });
}

export async function updateKnowledgeGapStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const gapId = getString(formData, "gapId");
  const status = getString(formData, "status") as KnowledgeGapStatus;
  const notes = getString(formData, "resolutionNotes").slice(0, 1000);
  const { user, membership } = await requireOrganizationManager();

  if (!gapId || !nextStatuses.has(status)) {
    return { error: "Choose a valid gap action." };
  }

  const patch = {
    status,
    resolution_notes: notes || null,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("knowledge_gaps")
    .update(patch)
    .eq("id", gapId)
    .eq("organization_id", membership.organization.id);

  if (error) {
    return { error: "Knowledge gap could not be updated." };
  }

  await createAuditLog(membership.organization.id, user.id, gapId, { status, has_notes: Boolean(notes) });
  await invalidateOrganizationSummaryCache(membership.organization.id);
  revalidatePath("/app/insights");
  revalidatePath("/app");
  return { message: `Gap marked ${status}.` };
}
