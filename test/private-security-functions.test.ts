import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260728011500_private_security_functions.sql", "utf8");

describe("private security function boundary", () => {
  it("keeps privileged implementations in a non-exposed schema", () => {
    expect(migration).toContain("create schema if not exists private");
    expect(migration).toContain("create or replace function private.is_org_member");
    expect(migration).toContain("create or replace function private.create_organization");
    expect(migration).toContain("revoke all on schema private from public, anon");
  });

  it("preserves stable public invoker wrappers for RLS and RPC callers", () => {
    expect(migration).toContain("create or replace function public.is_org_member");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("select private.is_org_member(target_org_id)");
    expect(migration).toContain("select private.accept_organization_invitation(p_token)");
  });
});
