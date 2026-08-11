import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260728083711_restrict_organization_creation_to_owners.sql", "utf8");
const deletionMigration = readFileSync("supabase/migrations/20260728085809_grant_service_role_organization_delete.sql", "utf8");
const action = readFileSync("app/auth/actions.ts", "utf8");
const setupPage = readFileSync("app/setup/organization/page.tsx", "utf8");
const appShell = readFileSync("components/app-shell.tsx", "utf8");
const topNavigation = readFileSync("components/top-navigation.tsx", "utf8");

describe("organization creation permissions", () => {
  it("blocks existing non-owner members at the database boundary", () => {
    expect(migration).toContain("active_membership_count > 0 and owned_organization_count = 0");
    expect(migration).toContain("Only organization owners can create another organization");
  });

  it("keeps organization deletion behind the server-only role", () => {
    expect(deletionMigration).toContain("grant delete on table public.organizations to service_role");
    expect(deletionMigration).not.toContain("to authenticated");
  });
  it("checks the same rule before calling the organization RPC", () => {
    expect(action).toContain("(activeMembershipCount ?? 0) > 0 && (ownedOrganizationCount ?? 0) === 0");
    expect(action).toContain("Only organization owners can create another organization.");
  });

  it("keeps organization creation controls owner-only", () => {
    expect(setupPage).toContain("hasOrganizations && !ownsOrganization");
    expect(appShell).toContain('const canCreateOrganization = role === "owner"');
    expect(topNavigation).toContain("props.canManage ? <QuickCreateMenu");
  });
});