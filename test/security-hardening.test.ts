import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260728010000_security_hardening.sql", "utf8");
const organizationActions = readFileSync("app/app/organization-actions.ts", "utf8");

describe("database security hardening", () => {
  it("removes anonymous execution from organization security helpers", () => {
    expect(migration).toContain("revoke execute on function public.is_org_member(uuid) from public, anon");
    expect(migration).toContain("revoke execute on function public.is_org_manager(uuid) from public, anon");
    expect(migration).toContain("revoke execute on function public.is_org_owner(uuid) from public, anon");
    expect(migration).toContain("grant execute on function public.is_org_member(uuid) to authenticated, service_role");
  });

  it("keeps intentional RPCs authenticated and hides the event-trigger function", () => {
    expect(migration).toContain("grant execute on function public.create_organization(text, text) to authenticated");
    expect(migration).toContain("grant execute on function public.accept_organization_invitation(uuid) to authenticated");
    expect(migration).toContain("revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role");
  });

  it("serializes the organization cap and rejects anonymous identities", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("owned_organization_count >= 3");
    expect(migration).toContain("auth.jwt() ->> 'is_anonymous'");
  });

  it("expires, locks, and email-binds invitation acceptance", () => {
    expect(migration).toContain("expires_at > now()");
    expect(migration).toContain("lower(oi.email) = current_email");
    expect(migration).toContain("for update");
    expect(organizationActions).toContain("expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()");
  });
});
