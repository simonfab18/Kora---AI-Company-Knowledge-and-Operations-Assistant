import { getSafeAuthRedirect, isInvitationRedirect, isPasswordResetRedirect } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function userHasOrganization(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = getSafeAuthRedirect(requestUrl.searchParams.get("next"));
  let next = requestedNext;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const hasOrganization = await userHasOrganization(user.id);
      const isInvitationFlow = isInvitationRedirect(requestedNext);
      const isPasswordResetFlow = isPasswordResetRedirect(requestedNext);
      if (!hasOrganization && !isInvitationFlow && !isPasswordResetFlow) {
        next = "/setup/organization";
      } else if (requestedNext === "/setup/organization") {
        next = "/app";
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
