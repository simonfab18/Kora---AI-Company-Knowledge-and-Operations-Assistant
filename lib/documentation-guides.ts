export type DocumentationGuide = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  hero: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
};

export const documentationGuides: DocumentationGuide[] = [
  {
    slug: "getting-started-with-kora",
    category: "Guide",
    title: "Getting started with Kora for your team",
    summary: "Create your account, set up an organization, connect Notion, sync knowledge, and ask your first grounded question.",
    readTime: "8 min read",
    hero: "Kora works best when your team starts with a small approved set of useful Notion pages, validates sync quality, then expands coverage over time.",
    sections: [
      {
        heading: "1. Create your account",
        body: [
          "Start from Sign up on the landing page. Use your company email, set a strong password, and confirm your account if email confirmation is enabled in Supabase Auth.",
          "After sign-in, Kora sends new users to organization setup before they can connect sources or ask workspace questions.",
        ],
      },
      {
        heading: "2. Create your organization",
        body: [
          "Your organization is the workspace boundary for members, Notion connections, synced documents, conversations, citations, usage, and knowledge gaps.",
          "The first user becomes the owner. Owners can create up to three active organizations and can delete an organization from Settings with a typed confirmation phrase.",
        ],
      },
      {
        heading: "3. Connect Notion",
        body: [
          "Open Settings or Quick Create, choose Connect source, and approve the Notion workspace. Only pages shared with the integration can be synchronized.",
          "If a page does not appear after sync, check Notion sharing first. Kora cannot index pages that the integration cannot see.",
        ],
      },
      {
        heading: "4. Run Sync Activity",
        body: [
          "Go to Sync Activity and start a full sync. Kora discovers approved pages, normalizes content, creates retrieval chunks, and prepares embeddings for Ask AI.",
          "After syncing, open Knowledge to confirm documents are indexed. If a document failed, inspect the safe error message and retry after fixing the cause.",
        ],
      },
      {
        heading: "5. Ask your first question",
        body: [
          "Use Ask AI for questions that should be answerable from approved workspace documentation. Kora retrieves relevant chunks, answers from those chunks, and saves citations.",
          "If Kora cannot find enough support, it should say it cannot answer confidently and create a knowledge gap instead of guessing.",
        ],
      },
    ],
  },
  {
    slug: "connect-notion-step-by-step",
    category: "Guide",
    title: "Connecting Notion step by step",
    summary: "Approve the right Notion workspace and pages so Kora can synchronize only the knowledge you intend to use.",
    readTime: "7 min read",
    hero: "The Notion connection is the most important setup step. Kora can only answer from pages your Notion integration is allowed to read.",
    sections: [
      {
        heading: "Before you connect",
        body: [
          "Make sure you are signed in as an owner or admin in Kora. Members can use Ask AI, but source connection is an organization-level setup action.",
          "Decide which Notion pages should be approved first. Start with official SOPs, policies, FAQs, service guides, onboarding pages, or product documentation.",
        ],
      },
      {
        heading: "Start the OAuth flow",
        body: [
          "Open Settings and use the Notion connection card, or open Quick Create and choose Connect source. Kora sends you to Notion to approve access.",
          "After approval, Notion returns you to Kora. The Settings page should show the connected workspace name and connection status.",
        ],
      },
      {
        heading: "Share pages with the integration",
        body: [
          "In Notion, open the page or parent page you want Kora to read and share it with the integration. Child pages may need to be accessible depending on how the workspace is organized.",
          "If Sync Activity says no pages were synchronized, the most common cause is that the integration was connected but no useful pages were shared with it.",
        ],
      },
      {
        heading: "Verify the connection",
        body: [
          "Run Sync Activity. Then open Knowledge and confirm pages appear with indexed status. Finally, ask a question that clearly matches one of the synced pages and check whether citations appear.",
        ],
      },
    ],
  },
  {
    slug: "build-a-company-knowledge-base",
    category: "Guide",
    title: "Building a useful company knowledge base",
    summary: "Organize SOPs, policies, FAQs, and operational playbooks so employees can get reliable answers.",
    readTime: "8 min read",
    hero: "A strong knowledge base is not just a folder of pages. It is a set of clear, current, answerable documents that employees can trust.",
    sections: [
      {
        heading: "Choose source pages intentionally",
        body: [
          "Start with pages that answer real operational questions: onboarding, leave policies, customer service scripts, installation steps, troubleshooting, pricing rules, and escalation paths.",
          "Avoid syncing unfinished drafts unless the team clearly understands they are not official guidance.",
        ],
      },
      {
        heading: "Write for retrieval",
        body: [
          "Use descriptive headings, short sections, and direct language. Kora retrieves chunks, so a clear section title and a focused paragraph are easier to cite than a long mixed page.",
          "For procedures, use numbered steps. For policies, include eligibility, exceptions, approvals, deadlines, and owner roles.",
        ],
      },
      {
        heading: "Keep source ownership clear",
        body: [
          "Every important page should have an owner. When Kora detects a gap, admins need to know who should update or create the missing documentation.",
          "Review high-use and high-gap topics regularly from Insights.",
        ],
      },
    ],
  },
  {
    slug: "sync-and-index-knowledge",
    category: "Guide",
    title: "Syncing and indexing knowledge",
    summary: "Understand what happens during sync and what to check when pages fail, remain pending, or do not appear in Ask AI.",
    readTime: "6 min read",
    hero: "Sync Activity is the bridge between Notion pages and useful AI answers. It shows what Kora processed and what still needs attention.",
    sections: [
      {
        heading: "Start a sync",
        body: [
          "Use Sync Activity or Quick Create > Start sync. Kora checks that Notion is connected, prevents duplicate active jobs, and records progress safely.",
          "A full sync is best after initial setup or after sharing new pages with the Notion integration.",
        ],
      },
      {
        heading: "Read sync status",
        body: [
          "Queued means a job was created. Running means Kora is processing pages. Succeeded means pages were processed safely. Failed means Kora stopped and saved a safe error.",
          "Processed, unchanged, skipped, and failed counts help you understand whether the sync changed anything useful.",
        ],
      },
      {
        heading: "Check indexed documents",
        body: [
          "After sync, open Knowledge. Indexed documents are ready for retrieval. Failed documents need review before Ask AI can use them reliably.",
          "Open document detail to inspect retrieval chunks, source status, usage, last synced time, and errors.",
        ],
      },
    ],
  },
  {
    slug: "ask-ai-and-read-citations",
    category: "Guide",
    title: "Asking Kora questions and reading citations",
    summary: "Ask grounded questions, inspect source cards, and understand when an answer is strong enough to trust.",
    readTime: "7 min read",
    hero: "Kora is designed to answer from approved workspace context, not from guesses. Citations are how users verify the answer.",
    sections: [
      {
        heading: "Ask answerable questions",
        body: [
          "Ask questions that should exist in your company documentation: policies, SOP steps, troubleshooting, recommendations, eligibility, or escalation rules.",
          "If the question is too broad, Kora may answer with a summary and several citations. Narrow questions usually produce more precise source evidence.",
        ],
      },
      {
        heading: "Read confidence labels",
        body: [
          "High and medium confidence answers usually have enough supporting source context. Low confidence answers should be reviewed more carefully. Insufficient answers mean Kora did not find enough approved context.",
        ],
      },
      {
        heading: "Inspect citations",
        body: [
          "Citation cards show the source page, match score, and source text Kora used. Use View in Kora to inspect the exact local chunk before opening the original Notion page.",
          "If the source text does not fully support the answer, mark it Not helpful so admins can review the gap.",
        ],
      },
    ],
  },
  {
    slug: "review-knowledge-gaps",
    category: "Guide",
    title: "Reviewing and resolving knowledge gaps",
    summary: "Turn unanswered or low-confidence questions into documentation work your team can act on.",
    readTime: "6 min read",
    hero: "Knowledge gaps are signals that employees need clearer documentation, not just better AI answers.",
    sections: [
      {
        heading: "How gaps are created",
        body: [
          "Kora creates gaps when answers are insufficient, low-confidence, or marked not helpful. Repeated similar questions increase the occurrence count.",
          "Each gap includes the representative question, missing topic, confidence, possible related source, and status.",
        ],
      },
      {
        heading: "Review the cause",
        body: [
          "A gap can mean no document exists, the right document was not shared with Notion, the section is too vague, the answer was too broad, or the retrieval threshold is too strict.",
        ],
      },
      {
        heading: "Resolve with evidence",
        body: [
          "Update or create the Notion page, run sync again, ask the question again, and verify that Kora cites the improved source. Then mark the gap resolved with a note.",
        ],
      },
    ],
  },
  {
    slug: "manage-members-and-roles",
    category: "Guide",
    title: "Managing members and roles safely",
    summary: "Invite teammates, choose the right role, and keep organization permissions clear.",
    readTime: "5 min read",
    hero: "Good role hygiene keeps the workspace useful without giving everyone administrative control.",
    sections: [
      {
        heading: "Choose the right role",
        body: [
          "Owners control organization settings and deletion. Admins manage operational workflows like sync, invitations, and knowledge-gap review. Members ask questions and manage personal settings.",
        ],
      },
      {
        heading: "Invite teammates",
        body: [
          "Use Members or Quick Create to invite someone by email. Choose Admin only when the person needs operational control, otherwise choose Member.",
        ],
      },
      {
        heading: "Review access regularly",
        body: [
          "Use the Members page and audit trail to review who joined, which invitations are pending, and whether disabled or removed users still need follow-up.",
        ],
      },
    ],
  },
  {
    slug: "monitor-ai-usage",
    category: "Guide",
    title: "Monitoring AI usage on the Portfolio Free plan",
    summary: "Understand daily limits, global caps, and what usage means in this free portfolio project.",
    readTime: "4 min read",
    hero: "Usage is shown for transparency and quota protection. It is not billing, and no charges are made.",
    sections: [
      {
        heading: "Daily question limits",
        body: [
          "The app protects the free AI provider quota with soft limits. By default, each user has 20 AI questions per day and the app has a 100-question global daily cap.",
        ],
      },
      {
        heading: "What usage includes",
        body: [
          "Usage pages can show questions asked, answers generated, documents indexed, embedding chunks created, active users, and reset time.",
        ],
      },
      {
        heading: "No payment required",
        body: [
          "Billing is intentionally informational. The Portfolio Free plan has no payment method, invoices, checkout, or paid upgrade path.",
        ],
      },
    ],
  },
  {
    slug: "troubleshoot-notion-sync",
    category: "Guide",
    title: "Troubleshooting Notion connection and sync issues",
    summary: "Fix common setup problems when pages do not connect, sync, index, or appear in Ask AI.",
    readTime: "7 min read",
    hero: "Most sync issues come from connection settings, page sharing, database permissions, or AI provider configuration.",
    sections: [
      {
        heading: "Connection fails after Notion approval",
        body: [
          "Check the Notion client ID, client secret, redirect URI, token encryption key, and Supabase URL/key settings. The redirect URI must match what Notion expects.",
        ],
      },
      {
        heading: "No pages synchronized",
        body: [
          "Confirm the integration has access to the Notion pages. In Notion, share the page or parent page with the integration, then run a fresh sync.",
        ],
      },
      {
        heading: "Pages sync but Ask AI cannot answer",
        body: [
          "Check that documents are indexed, chunks exist, embeddings were created, and the retrieval threshold is not too high for your content. Then ask a question that matches the source wording closely enough to retrieve evidence.",
        ],
      },
    ],
  },
];

export function getDocumentationGuide(slug: string) {
  return documentationGuides.find((guide) => guide.slug === slug) ?? null;
}
