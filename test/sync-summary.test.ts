import { describe, expect, it, vi } from "vitest";
import { documentStatusCounts, formatDuration, summarizeSyncJob, syncStatusTone } from "@/lib/sync-summary";

describe("sync summary helpers", () => {
  it("calculates job completion, failure rate, and duration", () => {
    const summary = summarizeSyncJob({
      total_items: 10,
      processed_items: 6,
      failed_items: 2,
      skipped_items: 2,
      started_at: "2026-07-25T01:00:00.000Z",
      completed_at: "2026-07-25T01:02:05.000Z",
      created_at: "2026-07-25T00:59:00.000Z",
    });

    expect(summary).toMatchObject({
      completedItems: 10,
      completionRate: 100,
      failureRate: 20,
      durationMs: 125000,
    });
  });

  it("uses current time for active job duration", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T01:01:00.000Z"));

    expect(
      summarizeSyncJob({
        total_items: 0,
        processed_items: 0,
        failed_items: 0,
        skipped_items: 0,
        started_at: "2026-07-25T01:00:00.000Z",
        completed_at: null,
        created_at: "2026-07-25T00:59:00.000Z",
      }).durationMs,
    ).toBe(60000);

    vi.useRealTimers();
  });

  it("formats durations for readable sync cards", () => {
    expect(formatDuration(null)).toBe("Unknown");
    expect(formatDuration(12_000)).toBe("12s");
    expect(formatDuration(125_000)).toBe("2m 5s");
    expect(formatDuration(3_720_000)).toBe("1h 2m");
  });

  it("counts document states and maps sync status tones", () => {
    expect(
      documentStatusCounts([
        { sync_status: "indexed" },
        { sync_status: "indexed" },
        { sync_status: "failed" },
        { sync_status: "syncing" },
      ]),
    ).toMatchObject({ indexed: 2, failed: 1, syncing: 1, pending: 0 });

    expect(syncStatusTone("succeeded")).toBe("text-emerald-200");
    expect(syncStatusTone("failed")).toBe("text-rose-200");
    expect(syncStatusTone("running")).toBe("text-blue-200");
  });
});
