# Critical User Journeys

These journeys are the behavioral contract for production changes. Run the relevant subset before each release and the full set in Phase 8.

## Authentication

1. Sign up with a unique company email and a valid password.
2. Confirm the email and return to the intended onboarding or invitation flow.
3. Sign in with email/password and Google.
4. Request a password reset and set a new password.
5. Sign out and verify protected routes redirect to login.

Expected: duplicate emails are rejected safely, secrets never appear in the browser, and an invited user joins the invited organization instead of creating a new one.

## Organization And Onboarding

1. A new owner creates the first organization.
2. An existing owner creates up to three owned organizations.
3. A member/admin cannot create an organization.
4. Complete or resume personalization onboarding.
5. Switch active organizations and verify tenant data changes with the selection.
6. Delete an owned organization only after exact-name confirmation.

Expected: canonical owner membership remains active and no cross-organization data appears.

## Members And Invitations

1. Owner/admin invites a member and the invitation appears as pending.
2. Recipient accepts with the matching email.
3. Owner/admin changes a non-owner between member and admin.
4. Owner/admin adds a known managed user to another managed organization.
5. Disable and remove a non-owner.
6. Attempt self-promotion, owner editing, owner disabling/removal, and cross-organization mutation.

Expected: legitimate non-owner operations work; every owner or cross-tenant attack is denied by PostgreSQL and the API.

## Notion And Knowledge

1. Connect Notion through OAuth and return to the correct onboarding/app route.
2. Run full synchronization and inspect job progress.
3. Verify documents and chunks appear in Knowledge.
4. Re-index a changed document.
5. Create, rename, search, and remove a collection; add/remove documents from it.

Expected: tokens remain encrypted/server-only, sync failures are recoverable, and one organization cannot read another's sources.

## Ask AI

1. Ask a question supported by approved knowledge.
2. Verify answer formatting, confidence, exact source chunks, and Notion links.
3. Ask an unsupported question and verify a knowledge gap is created.
4. Submit helpful/not-helpful feedback.
5. Reach user/global limits and verify requests are blocked without duplicate charging.

Expected: grounded claims have valid citations, unsupported answers are refused, and conversations remain scoped to their creator and organization.

## Administration And Support

1. Review dashboard, insights, sync health, gaps, members, and audit history.
2. Save AI retrieval and answer preferences and verify immediate UI refresh.
3. Open documentation/help/support from app and public routes.
4. Submit support and problem reports.

Expected: admin-only data is protected, saved settings affect subsequent answers, and app-origin navigation returns to the app.