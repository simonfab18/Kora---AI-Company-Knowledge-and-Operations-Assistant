import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/app/members/page.tsx", "utf8");
const action = readFileSync("app/app/organization-actions.ts", "utf8");
const directory = readFileSync("components/workspace-member-directory.tsx", "utf8");
const phase6Migration = readFileSync("supabase/migrations/20260802071849_phase_6_query_cache_optimization.sql", "utf8");

describe("managed member directory", () => {
  it("lists people only from organizations the actor manages", () => {
    expect(page).toContain('item.role === "owner" || item.role === "admin"');
    expect(page).toContain('supabase.rpc("list_managed_workspace_members"');
    expect(action).toContain('if (!managedOrganizationIds.includes(organizationId))');
    expect(action).toContain('That person is not part of an organization you manage.');
  });

  it("never grants ownership from the directory", () => {
    expect(action).toContain('role === "owner"');
    expect(directory).not.toContain('<option value="owner">');
  });

  it("supports profile search and cross-organization access", () => {
    expect(directory).toContain('person.email');
    expect(directory).toContain('person.department');
    expect(directory).toContain('Add access');
    expect(page).toContain('addAccessAction={addExistingMemberToOrganizationAction}');
  });

  it("shows ten recent people per page and excludes the signed-in user", () => {
    expect(directory).toContain("const PEOPLE_PER_PAGE = 10");
    expect(page).toContain("p_limit: directoryPageSize");
    expect(page).toContain("p_offset: (memberPage - 1) * directoryPageSize");
    expect(phase6Migration).toContain("where om.user_id <> p_manager_user_id");
    expect(phase6Migration).toContain("order by people.recent_activity_at desc");
  });
});
