---
slug: getting-started-with-kora
order: 1
category: Guide
title: Getting started with Kora for your team
summary: Create your account, set up an organization, connect Notion, sync knowledge, and ask your first grounded question.
readTime: 8 min read
hero: Kora works best when your team starts with a small approved set of useful Notion pages, validates sync quality, then expands coverage over time.
---

## 1. Create your account

Start from Sign up on the landing page. Use your company email, set a strong password, and confirm your account if email confirmation is enabled in Supabase Auth.

After sign-in, Kora sends new users to organization setup before they can connect sources or ask workspace questions.

## 2. Create your organization

Your organization is the workspace boundary for members, Notion connections, synced documents, conversations, citations, usage, and knowledge gaps.

The first user becomes the owner. Owners can create up to three active organizations and can delete an organization from Settings with a typed confirmation phrase.

## 3. Connect Notion

Open Settings or Quick Create, choose Connect source, and approve the Notion workspace. Only pages shared with the integration can be synchronized.

If a page does not appear after sync, check Notion sharing first. Kora cannot index pages that the integration cannot see.

## 4. Run Sync Activity

Go to Sync Activity and start a full sync. Kora discovers approved pages, normalizes content, creates retrieval chunks, and prepares embeddings for Ask AI.

After syncing, open Knowledge to confirm documents are indexed. If a document failed, inspect the safe error message and retry after fixing the cause.

## 5. Ask your first question

Use Ask AI for questions that should be answerable from approved workspace documentation. Kora retrieves relevant chunks, answers from those chunks, and saves citations.

If Kora cannot find enough support, it should say it cannot answer confidently and create a knowledge gap instead of guessing.
