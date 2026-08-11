import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { deriveMissingTopic, normalizeKnowledgeGapQuestion, reasonForGap } from "@/lib/knowledge-gaps";

describe("knowledge gap detection", () => {
  it("normalizes repeated question wording into a stable fingerprint", () => {
    expect(normalizeKnowledgeGapQuestion("  How do I INSTALL the app?! ")).toBe("how do i install the app");
    expect(normalizeKnowledgeGapQuestion("How   do I install the app")).toBe("how do i install the app");
  });

  it("derives a useful missing topic from a question", () => {
    expect(deriveMissingTopic("How do I install a tire for a customer?")).toBe("install tire");
  });

  it("creates gaps only for insufficient or low confidence answers", () => {
    expect(reasonForGap("insufficient")).toBe("insufficient_context");
    expect(reasonForGap("low")).toBe("low_confidence");
    expect(reasonForGap("medium")).toBeNull();
    expect(reasonForGap("high")).toBeNull();
  });

  it("keeps knowledge gaps tenant-scoped and manager-controlled", () => {
    const migration = readFileSync("supabase/migrations/20260719080000_knowledge_gaps.sql", "utf8");

    expect(migration).toContain("organization_id uuid not null references public.organizations");
    expect(migration).toContain("knowledge_gaps_open_fingerprint_idx");
    expect(migration).toContain("public.is_org_manager(organization_id)");
    expect(migration).toContain("grant select, insert, update, delete on public.knowledge_gaps to service_role");
  });

  it("stores answer feedback with conversation-scoped RLS", () => {
    const migration = readFileSync("supabase/migrations/20260719082000_message_feedback.sql", "utf8");

    expect(migration).toContain("create table if not exists public.message_feedback");
    expect(migration).toContain("check (rating in ('helpful', 'not_helpful'))");
    expect(migration).toContain("unique (message_id, user_id)");
    expect(migration).toContain("m.role = 'assistant'");
    expect(migration).toContain("c.user_id = (select auth.uid())");
    expect(migration).toContain("grant select, insert, update on public.message_feedback to authenticated");
  });
});