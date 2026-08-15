---
slug: configure-ai-settings
order: 11
category: Guide
title: Configuring retrieval and answer settings
summary: Understand retrieval thresholds, provider details, response language, tone, and answer format.
readTime: 6 min read
hero: AI settings change how Kora selects evidence and presents an answer; they do not bypass the grounding rules.
---

## Retrieval threshold

The threshold controls the minimum source similarity Kora accepts. Raising it can improve precision but may create more insufficient answers. Lowering it can improve coverage but may include less relevant context.

## Language and answer style

Admins can save response language, tone, and answer format for the organization. These preferences shape presentation while citation validation and source boundaries remain enforced.

## Model compatibility

The generation model can change without re-indexing. Changing the embedding model or dimensions requires a full compatible re-index, so the current interface keeps that model display locked.
