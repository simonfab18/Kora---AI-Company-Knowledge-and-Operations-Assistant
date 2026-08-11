import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260728013000_invitation_role_preservation.sql", "utf8");

describe("invitation role preservation", () => {
  it("does not change the role of an existing organization member", () => {
    expect(migration).toContain("set role = public.organization_members.role");
    expect(migration).not.toContain("set role = excluded.role");
  });
});
