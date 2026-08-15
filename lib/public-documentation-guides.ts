import { documentationGuides as coreGuides } from "@/lib/documentation-guides";

const supplementalGuides = [
  {
    slug: "what-is-kora",
    category: "Concept",
    title: "What Kora is and how it helps",
    summary: "Kora turns approved Notion pages into a searchable AI assistant that answers employee questions, links supported claims to their sources, and shows admins where documentation is missing.",
    readTime: "5 min read",
    hero: "Kora brings company knowledge, grounded AI answers, source verification, and documentation improvement into one organization-scoped workspace.",
    sections: [
      { heading: "For employees", body: ["Employees ask natural-language questions instead of manually searching across approved Notion pages. Kora retrieves relevant source sections, writes a useful answer, and keeps citations available for verification."] },
      { heading: "For administrators", body: ["Owners and admins connect Notion, synchronize approved pages, inspect document and sync health, manage members, review usage, and turn weak answers or negative feedback into knowledge gaps."] },
      { heading: "Trust boundaries", body: ["Kora searches only the active organization's indexed knowledge. When company sources do not support an answer, it reports insufficient context instead of inventing a policy. Product-help questions use Kora's maintained documentation rather than private company sources."] },
    ],
  },
  {
    slug: "configure-ai-settings",
    category: "Guide",
    title: "Configuring retrieval and answer settings",
    summary: "Understand retrieval thresholds, provider details, response language, tone, and answer format.",
    readTime: "6 min read",
    hero: "AI settings change how Kora selects evidence and presents an answer; they do not bypass the grounding rules.",
    sections: [
      { heading: "Retrieval threshold", body: ["The threshold controls the minimum source similarity Kora accepts. Raising it can improve precision but may create more insufficient answers. Lowering it can improve coverage but may include less relevant context."] },
      { heading: "Language and answer style", body: ["Admins can save response language, tone, and answer format for the organization. These preferences shape presentation while citation validation and source boundaries remain enforced."] },
      { heading: "Model compatibility", body: ["The generation model can change without re-indexing. Changing the embedding model or dimensions requires a full compatible re-index, so the current interface keeps that model display locked."] },
    ],
  },
  {
    slug: "security-and-data-boundaries",
    category: "Concept",
    title: "Security and organization data boundaries",
    summary: "Learn how roles, organization filters, source approvals, secrets, and citation validation protect the workspace.",
    readTime: "7 min read",
    hero: "Kora combines application authorization with database policies and organization-scoped retrieval.",
    sections: [
      { heading: "Organization isolation", body: ["Every member works inside an active organization. Documents, conversations, messages, citations, gaps, usage, sync jobs, and settings are scoped to that organization."] },
      { heading: "Roles and secrets", body: ["Owner, admin, and member permissions restrict management actions. Notion tokens, AI keys, encryption keys, and service credentials stay server-side."] },
      { heading: "Grounding boundary", body: ["Connected content is untrusted data, not an instruction to the model. Kora validates citation IDs against retrieved context and refuses unsupported company-specific claims."] },
    ],
  },
  {
    slug: "manage-organizations",
    category: "Guide",
    title: "Creating and managing organizations",
    summary: "Create up to three active owner organizations, switch workspaces, share access, and delete safely.",
    readTime: "5 min read",
    hero: "Organizations keep memberships, sources, conversations, usage, and settings separated.",
    sections: [
      { heading: "Create and switch", body: ["Owners can create up to three active organizations. Use the workspace switcher to move between organizations where you have access."] },
      { heading: "Share access", body: ["Invite a new email or add a directory member to another organization you manage. Roles apply independently in each organization."] },
      { heading: "Delete carefully", body: ["Organization deletion removes related workspace data. Kora requires the exact organization confirmation phrase before the destructive action can continue."] },
    ],
  },
  {
    slug: "understand-retrieval-and-citations",
    category: "Concept",
    title: "Understanding retrieval, confidence, and citations",
    summary: "See how Kora selects chunks, judges evidence coverage, and links claims to source context.",
    readTime: "8 min read",
    hero: "A fluent answer is not enough. Kora also needs relevant source context and valid citations.",
    sections: [
      { heading: "Hybrid retrieval", body: ["Kora combines semantic similarity with lexical signals, deduplicates near-identical chunks, and prefers useful title and heading diversity within the active organization."] },
      { heading: "Confidence", body: ["Confidence reflects retrieval and evidence conditions, not a universal probability that every sentence is true. Always inspect citations for sensitive operational decisions."] },
      { heading: "Exact source context", body: ["Citation cards show the document, match information, and exact stored chunk used by the answer, with a separate link to the original Notion page."] },
    ],
  },
];

export const publicDocumentationGuides = [...coreGuides, ...supplementalGuides];
export function getPublicDocumentationGuide(slug: string) { return publicDocumentationGuides.find((guide) => guide.slug === slug) ?? null; }
