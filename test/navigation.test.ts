import { describe, expect, it } from "vitest";
import { canAccessNavigationItem, appNavigation } from "@/lib/navigation";
import { normalizeSlug } from "@/lib/auth";

describe("navigation access", () => {
  it("allows members to ask questions but not manage settings", () => {
    const askItem = appNavigation.find((item) => item.href === "/app/ask");
    const settingsItem = appNavigation.find((item) => item.href === "/app/settings");

    expect(askItem).toBeDefined();
    expect(settingsItem).toBeDefined();
    expect(canAccessNavigationItem(askItem!, "member")).toBe(true);
    expect(canAccessNavigationItem(settingsItem!, "member")).toBe(false);
  });

  it("allows admins to access management pages", () => {
    const syncItem = appNavigation.find((item) => item.href === "/app/sync");

    expect(syncItem).toBeDefined();
    expect(canAccessNavigationItem(syncItem!, "admin")).toBe(true);
  });
});

describe("normalizeSlug", () => {
  it("creates stable URL-safe organization slugs", () => {
    expect(normalizeSlug(" Acme Operations, Inc. ")).toBe("acme-operations-inc");
  });
});
