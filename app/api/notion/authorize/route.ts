import { canManageOrganization, getCurrentUser, getPrimaryOrganization } from "@/lib/auth";
import { createNotionAuthorizeUrl, createOAuthState, safeNotionReturnTo } from "@/lib/notion";
import { logOperationalEvent } from "@/lib/operational-logging";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";


export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const membership = await getPrimaryOrganization(user.id);

  if (!membership) {
    return NextResponse.redirect(new URL("/setup/organization", appUrl));
  }

  if (!canManageOrganization(membership.role)) {
    return NextResponse.redirect(new URL("/app", appUrl));
  }

  const rateLimit = await checkDistributedRateLimit({
    key: `notion-oauth:${membership.organization.id}:${user.id}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.redirect(new URL("/app/settings?notion=rate_limited", appUrl));
  }

  try {
    const { state, stateHash } = createOAuthState();
    const supabase = await createClient();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from("notion_oauth_states").insert({
      organization_id: membership.organization.id,
      created_by: user.id,
      state_hash: stateHash,
      expires_at: expiresAt,
      return_to: safeNotionReturnTo(request.nextUrl.searchParams.get("returnTo")),
    });

    if (error) {
      throw error;
    }

    return NextResponse.redirect(createNotionAuthorizeUrl(state));
  } catch (error) {
    logOperationalEvent("error", "notion.oauth_authorize_failed", {
      error,
      organizationId: membership.organization.id,
      userId: user.id,
    });
    return NextResponse.redirect(new URL("/app/settings?notion=configuration_error", appUrl));
  }
}
