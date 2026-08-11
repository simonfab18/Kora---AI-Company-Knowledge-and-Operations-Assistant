"use server";

import { getDevelopmentNotionConnection } from "@/lib/notion";
import type { ActionState } from "@/lib/action-state";
import { requireOrganizationManager } from "@/lib/authorization";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function createAuditLog(
  organizationId: string,
  actorUserId: string,
  action: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_user_id: actorUserId,
    action,
    target_type: "notion_connection",
    target_id: targetId,
    metadata,
  });
}

export async function disconnectNotionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const connectionId = getString(formData, "connectionId");
  const { user, membership } = await requireOrganizationManager();

  if (!connectionId) {
    return { error: "Choose a Notion connection to disconnect." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notion_connections")
    .update({
      status: "disconnected",
      disconnected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("organization_id", membership.organization.id);

  if (error) {
    return { error: error.message };
  }

  await createAuditLog(membership.organization.id, user.id, "notion.disconnected", connectionId);
  revalidatePath("/app/settings");
  revalidatePath("/app/sync");
  return { message: "Notion disconnected." };
}

export async function connectDevelopmentNotionAction(): Promise<ActionState> {
  const { user, membership } = await requireOrganizationManager();
  const developmentConnection = getDevelopmentNotionConnection();

  if (!developmentConnection) {
    return { error: "Development Notion token is not configured." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notion_connections")
    .upsert(
      {
        organization_id: membership.organization.id,
        notion_workspace_id: developmentConnection.workspaceId,
        notion_workspace_name: developmentConnection.workspaceName,
        notion_workspace_icon: null,
        bot_id: null,
        access_token_ciphertext: developmentConnection.accessTokenCiphertext,
        refresh_token_ciphertext: null,
        token_expires_at: null,
        status: "connected",
        last_error: null,
        connected_by: user.id,
        disconnected_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,notion_workspace_id" },
    )
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await createAuditLog(membership.organization.id, user.id, "notion.connected_development", data.id, {
    workspace_id: developmentConnection.workspaceId,
    workspace_name: developmentConnection.workspaceName,
  });
  revalidatePath("/app/settings");
  revalidatePath("/app/sync");
  return { message: "Development Notion connection saved." };
}