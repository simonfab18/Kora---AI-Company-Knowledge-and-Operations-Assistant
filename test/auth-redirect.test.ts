import { describe, expect, it } from "vitest";
import { getSafeAuthRedirect, isInvitationRedirect } from "@/lib/auth-redirect";

describe("auth redirects", () => {
  it("preserves an invitation route through signup and confirmation", () => {
    const path = getSafeAuthRedirect("/invitations/invite-token", "/setup/organization");

    expect(path).toBe("/invitations/invite-token");
    expect(isInvitationRedirect(path)).toBe(true);
  });

  it("uses organization setup for a normal new account", () => {
    expect(getSafeAuthRedirect(undefined, "/setup/organization")).toBe("/setup/organization");
  });

  it("rejects protocol-relative and external redirects", () => {
    expect(getSafeAuthRedirect("//example.com", "/app")).toBe("/app");
    expect(getSafeAuthRedirect("https://example.com", "/app")).toBe("/app");
  });
});