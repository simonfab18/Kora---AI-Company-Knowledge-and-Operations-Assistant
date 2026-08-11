# End-to-End QA Checklist

Use this checklist after Milestone 12 changes and before Production Readiness.

## Required Migration State

- `20260719080000_knowledge_gaps.sql`
- `20260719082000_message_feedback.sql`
- `20260719083000_feedback_gap_polish.sql`

## Product Smoke Flow

1. Sign up or log in.
2. Create or select an organization.
3. Open Settings and confirm:
   - Organization profile renders.
   - Notion connection card renders.
   - AI settings renders without console warnings.
   - Retrieval threshold saves.
4. Connect Notion or confirm connected state.
5. Run Sync Now.
6. Confirm Knowledge shows synced documents.
7. Open a document detail page and confirm chunks, source status, and citations render.
8. Ask Kora a question that should be answered from synced knowledge.
9. Confirm answer formatting, confidence, and citation cards render.
10. Open a citation/source viewer and confirm the exact source chunk is visible.
11. Submit Helpful feedback.
12. Submit Not helpful feedback with reason and comment.
13. Open Insights and confirm:
    - Date filters work.
    - Gap status filters work.
    - Trends render.
    - Knowledge gaps show missing topic and related source when available.
14. Open Members and confirm members, invitations, and audit activity render even when profile rows are missing.
15. Open Conversations and confirm history, confidence, and citation cards render.
16. Sign out and confirm protected app routes redirect to login.

## Automated Checks

```bash
node ./node_modules/eslint/bin/eslint.js .
node ./node_modules/typescript/bin/tsc --noEmit
node ./node_modules/vitest/vitest.mjs run
node ./node_modules/next/dist/bin/next build
```

## Known Manual Checks

- Browser console should have no React warnings such as `NaN defaultValue`.
- Server-rendered pages should not crash on empty Supabase result sets.
- Notion, Supabase, and AI provider errors should show safe user-facing messages.
- No service-role keys, Notion tokens, or AI keys should appear in browser output.

## Production readiness

1. Confirm `.env.local` or deployed environment variables match `docs/production_readiness.md`.
2. Confirm repeated login, signup, password reset, organization creation, admin/member actions, Ask AI, sync, re-index, feedback, and Notion connect attempts show friendly rate-limit messages instead of crashing.
3. Confirm operational logs include event names and IDs but do not expose tokens, keys, secrets, passwords, cookies, authorization headers, or ciphertext.
4. Confirm the full release checks in `docs/production_readiness.md` pass before deployment.