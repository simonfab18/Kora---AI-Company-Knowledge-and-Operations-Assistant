import { describe, expect, it } from "vitest";
import { countDocumentStatuses, settingsReadinessItems, settingsReadinessScore } from "@/lib/settings-summary";

describe("settings summary helpers", () => {
  it("builds manager readiness checks from workspace state", () => {
    const items = settingsReadinessItems({
      role: "owner",
      notionStatus: "connected",
      indexedDocuments: 4,
      failedDocuments: 0,
      openGaps: 0,
    });

    expect(items.every((item) => item.ready)).toBe(true);
    expect(settingsReadinessScore(items)).toBe(100);
  });

  it("flags missing setup work", () => {
    const items = settingsReadinessItems({
      role: "member",
      notionStatus: null,
      indexedDocuments: 0,
      failedDocuments: 2,
      openGaps: 3,
    });

    expect(items.map((item) => item.ready)).toEqual([false, false, false, false, false]);
    expect(settingsReadinessScore(items)).toBe(0);
  });

  it("counts document statuses for settings cards", () => {
    expect(countDocumentStatuses(["indexed", "indexed", "failed", "pending"])).toMatchObject({
      indexed: 2,
      failed: 1,
      pending: 1,
      syncing: 0,
      archived: 0,
    });
  });
});
