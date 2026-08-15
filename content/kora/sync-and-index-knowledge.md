---
slug: sync-and-index-knowledge
order: 4
category: Guide
title: Syncing and indexing knowledge
summary: Understand what happens during sync and what to check when pages fail, remain pending, or do not appear in Ask AI.
readTime: 6 min read
hero: Sync Activity is the bridge between Notion pages and useful AI answers. It shows what Kora processed and what still needs attention.
---

## Start a sync

Use Sync Activity or Quick Create > Start sync. Kora checks that Notion is connected, prevents duplicate active jobs, and records progress safely.

A full sync is best after initial setup or after sharing new pages with the Notion integration.

## Read sync status

Queued means a job was created. Running means Kora is processing pages. Succeeded means pages were processed safely. Failed means Kora stopped and saved a safe error.

Processed, unchanged, skipped, and failed counts help you understand whether the sync changed anything useful.

## Check indexed documents

After sync, open Knowledge. Indexed documents are ready for retrieval. Failed documents need review before Ask AI can use them reliably.

Open document detail to inspect retrieval chunks, source status, usage, last synced time, and errors.
