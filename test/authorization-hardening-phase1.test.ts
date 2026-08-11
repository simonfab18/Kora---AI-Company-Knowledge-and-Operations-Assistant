import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260731144716_authorization_hardening.sql", "utf8");
const rpcMigration = readFileSync("supabase/migrations/20260731152000_authorization_rpc_parameter_names.sql", "utf8");
const invokerMigration = readFileSync("supabase/migrations/20260731153500_authorization_rpc_invoker_boundary.sql", "utf8");
const actions = readFileSync("app/app/organization-actions.ts", "utf8");
const rollback = readFileSync("supabase/rollbacks/20260731144716_authorization_hardening.sql", "utf8");

describe("phase 1 authorization hardening", () => {
  it("revokes direct authenticated writes to sensitive organization state", () => {
    expect(migration).toContain("revoke all privileges on table public.organizations from anon, authenticated");
    expect(migration).toContain("revoke all privileges on table public.organization_members from anon, authenticated");
    expect(migration).toContain("grant select on table public.organizations to authenticated");
    expect(migration).toContain("revoke truncate on table public.organizations from service_role");
    expect(migration).toContain('drop policy if exists "Managers can update their organizations"');
    expect(migration).toContain('drop policy if exists "Managers can update memberships"');
  });

  it("enforces immutable ownership and canonical owner membership in PostgreSQL", () => {
    expect(migration).toContain("Organization ownership transfer is not available");
    expect(migration).toContain("The organization owner membership cannot be removed");
    expect(migration).toContain("The organization owner must keep an active owner membership");
    expect(migration).toContain("Only the canonical organization owner can have owner role");
    expect(migration).toContain("create trigger enforce_owner_membership");
  });

  it("exposes only narrow authenticated RPCs", () => {
    expect(migration).toContain("revoke execute on function private.manage_organization_member");
    expect(invokerMigration).toContain("security invoker");
    expect(invokerMigration).toContain("grant execute on function private.manage_organization_member");
    expect(rpcMigration).toContain("p_organization_id uuid");
    expect(rpcMigration).toContain("p_retrieval_threshold real");
    expect(rpcMigration).toContain("grant execute on function public.update_organization_profile");
    expect(migration).toContain("grant execute on function public.add_existing_organization_member");
    expect(migration).toContain("grant execute on function public.remove_organization_member");
  });

  it("routes application mutations through hardened RPCs", () => {
    expect(actions).toContain('rpc("update_organization_profile"');
    expect(actions).toContain('rpc("update_organization_retrieval_threshold"');
    expect(actions).toContain('rpc("add_existing_organization_member"');
    expect(actions).toContain('rpc("update_organization_member_role"');
    expect(actions).toContain('rpc("disable_organization_member"');
    expect(actions).toContain('rpc("remove_organization_member"');
    expect(actions).not.toContain("canManageTargetMember");
    expect(actions).toContain('if (role === "owner")');
  });

  it("ships a deliberate emergency rollback", () => {
    expect(rollback).toContain("WARNING: this restores the former broad manager-write surface");
    expect(rollback).toContain("grant update on table public.organizations to authenticated");
    expect(rollback).toContain('create policy "Managers can update memberships"');
  });
});