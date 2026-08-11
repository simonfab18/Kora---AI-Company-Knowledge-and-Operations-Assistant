import type { DocumentStatus, NotionConnectionStatus, OrganizationRole } from "@/lib/database.types";

export type SettingsReadinessInput = {
  role: OrganizationRole;
  notionStatus: NotionConnectionStatus | null;
  indexedDocuments: number;
  failedDocuments: number;
  openGaps: number;
};

export type SettingsReadinessItem = {
  label: string;
  ready: boolean;
  helper: string;
};

export function settingsReadinessItems(input: SettingsReadinessInput): SettingsReadinessItem[] {
  return [
    {
      label: "Manager access",
      ready: input.role === "owner" || input.role === "admin",
      helper: "Only owners and admins can change organization, integration, and member settings.",
    },
    {
      label: "Notion connected",
      ready: input.notionStatus === "connected",
      helper: "Kora needs an approved Notion workspace before synchronization can run.",
    },
    {
      label: "Knowledge indexed",
      ready: input.indexedDocuments > 0,
      helper: "At least one page should be indexed before employees rely on Ask AI.",
    },
    {
      label: "No failed documents",
      ready: input.failedDocuments === 0,
      helper: "Failed pages should be re-indexed or removed from the shared Notion scope.",
    },
    {
      label: "Gap queue reviewed",
      ready: input.openGaps === 0,
      helper: "Open gaps mean users asked questions that documentation did not support well.",
    },
  ];
}

export function settingsReadinessScore(items: SettingsReadinessItem[]) {
  if (items.length === 0) return 0;
  return Math.round((items.filter((item) => item.ready).length / items.length) * 100);
}

export function countDocumentStatuses(statuses: DocumentStatus[]) {
  return statuses.reduce(
    (counts, status) => {
      counts[status] += 1;
      return counts;
    },
    {
      pending: 0,
      syncing: 0,
      indexed: 0,
      failed: 0,
      archived: 0,
    } satisfies Record<DocumentStatus, number>,
  );
}
