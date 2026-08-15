---
slug: troubleshoot-notion-sync
order: 9
category: Guide
title: Troubleshooting Notion connection and sync issues
summary: Fix common setup problems when pages do not connect, sync, index, or appear in Ask AI.
readTime: 7 min read
hero: Most sync issues come from connection settings, page sharing, database permissions, or AI provider configuration.
---

## Connection fails after Notion approval

Check the Notion client ID, client secret, redirect URI, token encryption key, and Supabase URL/key settings. The redirect URI must match what Notion expects.

## No pages synchronized

Confirm the integration has access to the Notion pages. In Notion, share the page or parent page with the integration, then run a fresh sync.

## Pages sync but Ask AI cannot answer

Check that documents are indexed, chunks exist, embeddings were created, and the retrieval threshold is not too high for your content. Then ask a question that matches the source wording closely enough to retrieve evidence.
