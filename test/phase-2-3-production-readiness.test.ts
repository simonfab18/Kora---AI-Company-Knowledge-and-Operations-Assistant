import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const quotaMigration = readFileSync("supabase/migrations/20260731162000_atomic_ai_quotas.sql", "utf8");
const migrationSafetyScript = readFileSync("scripts/check-migration-safety.mjs", "utf8");
const productionPushGuard = readFileSync("scripts/guard-production-db-push.mjs", "utf8");

describe("phase 2 migration safety", () => {
  it("requires protected migrations to have rollback files", () => {
    expect(migrationSafetyScript).toContain("rollback file is required for protected migration");
    expect(migrationSafetyScript).toContain("20260731144716");
  });

  it("blocks production db push without an approval phrase", () => {
    expect(productionPushGuard).toContain("KORA_APPROVE_PRODUCTION_DB_PUSH");
    expect(productionPushGuard).toContain("I approve production db push for gcunbxduzixilquodcow");
  });
});

describe("phase 3 atomic ai quotas", () => {
  it("reserves, commits, and releases quota in database functions", () => {
    expect(quotaMigration).toContain("create table if not exists public.ai_quota_reservations");
    expect(quotaMigration).toContain("create or replace function public.reserve_daily_ai_quota");
    expect(quotaMigration).toContain("create or replace function public.commit_ai_quota_reservation");
    expect(quotaMigration).toContain("create or replace function public.release_ai_quota_reservation");
  });

  it("uses transaction-scoped advisory locks and idempotency keys", () => {
    expect(quotaMigration).toContain("pg_advisory_xact_lock");
    expect(quotaMigration).toContain("unique (organization_id, user_id, idempotency_key)");
  });

  it("uses Supabase JWT role claims for service-role boundaries", () => {
    expect(quotaMigration).toContain("request.jwt.claim.role");
    expect(quotaMigration).not.toContain("current_user <> 'service_role'");
  });
});
