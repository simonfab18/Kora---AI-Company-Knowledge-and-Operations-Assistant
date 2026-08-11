import { describe, expect, it } from "vitest";
import { publicDocumentationGuides } from "@/lib/public-documentation-guides";
import { publicNavigation, publicRoutes } from "@/lib/public-site";

describe("public website expansion", () => {
  it("publishes every core navigation destination", () => {
    expect(publicNavigation.map((item) => item.href)).toEqual([
      "/product", "/solutions", "/how-it-works", "/security", "/integrations", "/pricing",
    ]);
    expect(publicRoutes).toEqual(expect.arrayContaining([
      "", "/about", "/documentation", "/knowledge-gaps", "/roadmap", "/changelog", "/support", "/privacy", "/terms",
    ]));
  });

  it("keeps guide slugs unique and covers critical operations", () => {
    const slugs = publicDocumentationGuides.map((guide) => guide.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(expect.arrayContaining([
      "getting-started-with-kora", "connect-notion-step-by-step", "sync-and-index-knowledge",
      "ask-ai-and-read-citations", "review-knowledge-gaps", "manage-members-and-roles",
      "configure-ai-settings", "security-and-data-boundaries", "troubleshoot-notion-sync",
    ]));
  });

  it("does not expose authenticated app routes in the public route list", () => {
    expect(publicRoutes.some((route) => route.startsWith("/app"))).toBe(false);
    expect(publicRoutes.some((route) => route.startsWith("/api"))).toBe(false);
  });
});
