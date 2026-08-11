import { getCurrentUser } from "@/lib/auth";
import { exchangeNotionCode, encryptedNotionTokenPayload, notionOAuthRedirectPath, type NotionOAuthStatus } from "@/lib/notion";
import { hashSecret } from "@/lib/notion-crypto";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type NotionOAuthStateRow = {
  id: string;
  organization_id: string;
  created_by: string;
  status: string;
  expires_at: string;
  return_to: string | null;
};

function redirectToSettings(status: string) {
  return NextResponse.redirect(new URL(`/app/settings?notion=${status}`, appUrl));
}

function redirectAfterOAuth(oauthState: NotionOAuthStateRow, status: NotionOAuthStatus) {
  return NextResponse.redirect(new URL(notionOAuthRedirectPath(oauthState.return_to, status), appUrl));
}

async function completeConnectNotionStep(
  supabase: Awaited<ReturnType<typeof createClient>>,
  oauthState: NotionOAuthStateRow,
) {
  if (oauthState.return_to !== "/onboarding/sync") return;

  const { data: existing, error: readError } = await supabase
    .from("onboarding_progress")
    .select("completed_steps, skipped_steps")
    .eq("organization_id", oauthState.organization_id)
    .eq("user_id", oauthState.created_by)
    .maybeSingle();

  if (readError) throw readError;

  const completedSteps = new Set<string>((existing?.completed_steps as string[] | null) ?? []);
  const skippedSteps = new Set<string>((existing?.skipped_steps as string[] | null) ?? []);
  completedSteps.add("connect-notion");
  skippedSteps.delete("connect-notion");

  const { error: progressError } = await supabase.from("onboarding_progress").upsert({
    organization_id: oauthState.organization_id,
    user_id: oauthState.created_by,
    current_step: "sync",
    completed_steps: [...completedSteps],
    skipped_steps: [...skippedSteps],
    updated_at: new Date().toISOString(),
  });

  if (progressError) throw progressError;
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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const error = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (error) {
    return redirectToSettings("provider_error");
  }

  if (!code || !state) {
    return redirectToSettings("invalid_callback");
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=/app/settings`, appUrl));
  }

  const supabase = await createClient();
  const stateHash = hashSecret(state);
  const { data: stateRow, error: stateError } = await supabase
    .from("notion_oauth_states")
    .select("id, organization_id, created_by, status, expires_at, return_to")
    .eq("state_hash", stateHash)
    .maybeSingle();

  if (stateError || !stateRow) {
    return redirectToSettings("invalid_state");
  }

  const oauthState = stateRow as NotionOAuthStateRow;

  if (oauthState.created_by !== user.id || oauthState.status !== "pending") {
    return redirectToSettings("invalid_state");
  }

  if (new Date(oauthState.expires_at).getTime() < Date.now()) {
    await supabase
      .from("notion_oauth_states")
      .update({ status: "expired" })
      .eq("id", oauthState.id);
    return redirectToSettings("expired_state");
  }

  try {
    const notionToken = await exchangeNotionCode(code);
    const workspaceId = notionToken.workspace_id || notionToken.bot_id || `workspace-${hashSecret(notionToken.access_token).slice(0, 16)}`;
    const workspaceName = notionToken.workspace_name || "Notion workspace";
    const connectionPayload = {
      notion_workspace_name: workspaceName,
      notion_workspace_icon: notionToken.workspace_icon,
      bot_id: notionToken.bot_id,
      access_token_ciphertext: encryptedNotionTokenPayload(notionToken.access_token),
      refresh_token_ciphertext: notionToken.refresh_token
        ? encryptedNotionTokenPayload(notionToken.refresh_token)
        : null,
      token_expires_at: null,
      status: "connected",
      last_error: null,
      connected_by: user.id,
      disconnected_at: null,
    };

    const { data: existingConnection, error: lookupError } = await supabase
      .from("notion_connections")
      .select("id")
      .eq("organization_id", oauthState.organization_id)
      .eq("notion_workspace_id", workspaceId)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    const { data: connection, error: connectionError } = existingConnection
      ? await supabase
          .from("notion_connections")
          .update({ ...connectionPayload, updated_at: new Date().toISOString() })
          .eq("id", existingConnection.id)
          .eq("organization_id", oauthState.organization_id)
          .select("id")
          .single()
      : await supabase
          .from("notion_connections")
          .insert({
            organization_id: oauthState.organization_id,
            notion_workspace_id: workspaceId,
            ...connectionPayload,
          })
          .select("id")
          .single();

    if (connectionError) {
      throw connectionError;
    }

    await supabase
      .from("notion_oauth_states")
      .update({ status: "used", consumed_at: new Date().toISOString() })
      .eq("id", oauthState.id);

    await createAuditLog(oauthState.organization_id, user.id, "notion.connected", connection.id, {
      workspace_id: workspaceId,
      workspace_name: workspaceName,
    });

    await completeConnectNotionStep(supabase, oauthState);

    return redirectAfterOAuth(oauthState, "connected");
  } catch {
    await createAuditLog(oauthState.organization_id, user.id, "notion.connection_failed", null);
    return redirectAfterOAuth(oauthState, "connection_failed");
  }
}