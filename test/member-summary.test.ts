import { describe, expect, it } from "vitest";
import { memberDisplayName, roleDescription, summarizeInvitations, summarizeMembers } from "@/lib/member-summary";

describe("member summary helpers", () => {
  it("summarizes roles and member statuses", () => {
    expect(
      summarizeMembers([
        { role: "owner", status: "active" },
        { role: "admin", status: "active" },
        { role: "member", status: "disabled" },
      ]),
    ).toEqual({
      total: 3,
      roles: { owner: 1, admin: 1, member: 1 },
      statuses: { invited: 0, active: 2, disabled: 1 },
      managerCount: 2,
    });
  });

  it("summarizes invitation statuses", () => {
    expect(
      summarizeInvitations([
        { status: "pending" },
        { status: "pending" },
        { status: "accepted" },
        { status: "revoked" },
      ]),
    ).toEqual({
      total: 4,
      statuses: { pending: 2, accepted: 1, revoked: 1 },
    });
  });

  it("formats fallback display names and role descriptions", () => {
    expect(memberDisplayName("  Stanley  ", "abc123456789")).toBe("Stanley");
    expect(memberDisplayName(null, "abc123456789")).toBe("User abc12345");
    expect(roleDescription("owner")).toContain("ownership");
    expect(roleDescription("member")).toContain("ask Kora");
  });
});
