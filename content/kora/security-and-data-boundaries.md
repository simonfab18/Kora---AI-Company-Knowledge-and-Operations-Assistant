---
slug: security-and-data-boundaries
order: 12
category: Concept
title: Security and organization data boundaries
summary: Learn how roles, organization filters, source approvals, secrets, and citation validation protect the workspace.
readTime: 7 min read
hero: Kora combines application authorization with database policies and organization-scoped retrieval.
---

## Organization isolation

Every member works inside an active organization. Documents, conversations, messages, citations, gaps, usage, sync jobs, and settings are scoped to that organization.

## Roles and secrets

Owner, admin, and member permissions restrict management actions. Notion tokens, AI keys, encryption keys, and service credentials stay server-side.

## Grounding boundary

Connected content is untrusted data, not an instruction to the model. Kora validates citation IDs against retrieved context and refuses unsupported company-specific claims.
