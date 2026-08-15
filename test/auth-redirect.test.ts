import { describe, expect, it } from "vitest";
import { getAuthCallbackUrl, getSafeAuthRedirect, isInvitationRedirect, isPasswordResetRedirect } from "@/lib/auth-redirect";

describe("auth redirects", () => {
  it("preserves an invitation route through signup and confirmation", () => {
    const path = getSafeAuthRedirect("/invitations/invite-token", "/setup/organization");

    expect(path).toBe("/invitations/invite-token");
    expect(isInvitationRedirect(path)).toBe(true);
  });

  it("uses organization setup for a normal new account", () => {
    expect(getSafeAuthRedirect(undefined, "/setup/organization")).toBe("/setup/organization");
  });

  it("recognizes only the protected password update route as recovery", () => {
    expect(isPasswordResetRedirect("/reset-password/update")).toBe(true);
    expect(isPasswordResetRedirect("/reset-password")).toBe(false);
  });

  it("routes password recovery through the PKCE callback", () => {
    expect(getAuthCallbackUrl("https://kora.example.com/", "/reset-password/update")).toBe(
      "https://kora.example.com/auth/callback?next=%2Freset-password%2Fupdate",
    );
  });

  it("rejects protocol-relative and external redirects", () => {
    expect(getSafeAuthRedirect("//example.com", "/app")).toBe("/app");
    expect(getSafeAuthRedirect("https://example.com", "/app")).toBe("/app");
  });
});
