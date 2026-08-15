import { describe, expect, it } from "vitest";
import {
  koraDocumentationGuides,
  koraProductKnowledgeCorpus,
  parseKoraDocumentationGuide,
  searchKoraDocumentation,
} from "@/lib/kora-documentation-corpus";

const validGuide = `---
slug: sample-guide
order: 1
category: Guide
title: Sample guide
summary: A concise summary.
readTime: 2 min read
hero: A useful introduction.
---

## First section

The first paragraph.

The second paragraph.
`;

describe("Kora documentation corpus", () => {
  it("loads the complete Markdown corpus in stable order", () => {
    expect(koraDocumentationGuides).toHaveLength(14);
    expect(koraDocumentationGuides[0]?.slug).toBe("getting-started-with-kora");
    expect(new Set(koraDocumentationGuides.map((guide) => guide.slug)).size).toBe(koraDocumentationGuides.length);
  });

  it("keeps product documentation in an explicit product corpus", () => {
    expect(koraProductKnowledgeCorpus.scope).toBe("product");
    expect(koraProductKnowledgeCorpus.documents).toBe(koraDocumentationGuides);
  });

  it("searches concept expansions without mixing organization documents", () => {
    const results = searchKoraDocumentation("How can teammates get access?");
    expect(results.some((result) => result.guide.slug === "manage-members-and-roles")).toBe(true);
    expect(results.every((result) => koraDocumentationGuides.includes(result.guide))).toBe(true);
  });

  it("parses sections and paragraphs from Markdown", () => {
    const guide = parseKoraDocumentationGuide(validGuide, "sample-guide.md");
    expect(guide.sections).toEqual([{ heading: "First section", body: ["The first paragraph.", "The second paragraph."] }]);
  });

  it("rejects malformed metadata and filename mismatches", () => {
    expect(() => parseKoraDocumentationGuide(validGuide.replace("order: 1", "order: nope"), "sample-guide.md")).toThrow(/positive integer/);
    expect(() => parseKoraDocumentationGuide(validGuide, "different-name.md")).toThrow(/match its filename/);
  });
});
