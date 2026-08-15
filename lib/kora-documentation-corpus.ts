import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type KoraDocumentationSection = {
  heading: string;
  body: string[];
};

export type KoraDocumentationGuide = {
  slug: string;
  order: number;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  hero: string;
  sections: KoraDocumentationSection[];
};

export type KoraDocumentationSearchResult = {
  guide: KoraDocumentationGuide;
  content: string;
  score: number;
};

export type KnowledgeCorpus<TDocument, TResult> = {
  scope: "product" | "organization";
  documents: readonly TDocument[];
  search(query: string, limit?: number): TResult[];
};

const CORPUS_DIRECTORY = path.join(process.cwd(), "content", "kora");
const REQUIRED_FIELDS = ["slug", "order", "category", "title", "summary", "readTime", "hero"] as const;
const ALLOWED_FIELDS = new Set<string>(REQUIRED_FIELDS);
const SEARCH_STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "can", "could", "do", "does", "for", "from", "how", "i", "in", "is", "it", "me", "my",
  "of", "on", "or", "please", "should", "that", "the", "this", "to", "what", "when", "where", "which", "who", "why", "with", "would", "you", "your",
]);
const SEARCH_CONCEPTS: Record<string, string[]> = {
  account: ["signup", "login", "profile", "password"],
  answer: ["ask", "citations", "confidence", "sources"],
  citation: ["source", "evidence", "answer"],
  connect: ["notion", "oauth", "integration", "setup"],
  document: ["knowledge", "notion", "indexed", "chunks"],
  invite: ["members", "roles", "access"],
  member: ["invite", "roles", "access", "organization"],
  notion: ["connect", "oauth", "sync", "pages"],
  organization: ["workspace", "owner", "members", "switch"],
  setup: ["getting", "started", "connect", "sync"],
  source: ["citation", "notion", "document"],
  sync: ["notion", "index", "documents", "activity"],
  usage: ["quota", "limits", "questions"],
};
const PRODUCT_OVERVIEW_PATTERN = /\b(?:what is|what does|tell me about)\s+(?:this\s+)?kora\b|\bwhat\s+is\s+kora\s+about\b/;

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function searchTerms(value: string) {
  const base = normalizeSearchText(value).split(" ").filter((term) => term.length > 2 && !SEARCH_STOP_WORDS.has(term));
  return Array.from(new Set(base.flatMap((term) => [term, ...(SEARCH_CONCEPTS[term] ?? [])])));
}

export function koraGuideSearchText(guide: KoraDocumentationGuide) {
  return [
    guide.title,
    guide.summary,
    guide.hero,
    ...guide.sections.flatMap((section) => [section.heading, ...section.body]),
  ].join("\n");
}

function parseFrontmatter(source: string, filename: string) {
  const match = source.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Kora guide ${filename} must start with valid frontmatter.`);

  const metadata: Record<string, string> = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const separator = rawLine.indexOf(":");
    if (separator < 1) throw new Error(`Kora guide ${filename} has invalid frontmatter: ${rawLine}`);
    const key = rawLine.slice(0, separator).trim();
    const value = rawLine.slice(separator + 1).trim();
    if (!ALLOWED_FIELDS.has(key)) throw new Error(`Kora guide ${filename} has unsupported field ${key}.`);
    if (metadata[key]) throw new Error(`Kora guide ${filename} repeats field ${key}.`);
    if (!value) throw new Error(`Kora guide ${filename} has an empty ${key} field.`);
    metadata[key] = value;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!metadata[field]) throw new Error(`Kora guide ${filename} is missing ${field}.`);
  }

  return { metadata, body: match[2].trim() };
}

function parseSections(body: string, filename: string): KoraDocumentationSection[] {
  const sections: KoraDocumentationSection[] = [];
  let heading: string | null = null;
  let paragraphLines: string[] = [];
  let paragraphs: string[] = [];

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();
    if (paragraph) paragraphs.push(paragraph);
    paragraphLines = [];
  };
  const flushSection = () => {
    flushParagraph();
    if (!heading) return;
    if (paragraphs.length === 0) throw new Error(`Kora guide ${filename} section ${heading} has no content.`);
    sections.push({ heading, body: paragraphs });
    paragraphs = [];
  };

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      flushSection();
      heading = line.slice(3).trim();
      if (!heading) throw new Error(`Kora guide ${filename} has an empty section heading.`);
      continue;
    }
    if (!heading && line) throw new Error(`Kora guide ${filename} has content before its first section.`);
    if (!line) {
      flushParagraph();
      continue;
    }
    paragraphLines.push(line);
  }
  flushSection();

  if (sections.length === 0) throw new Error(`Kora guide ${filename} must contain at least one section.`);
  return sections;
}

export function parseKoraDocumentationGuide(source: string, filename: string): KoraDocumentationGuide {
  const { metadata, body } = parseFrontmatter(source, filename);
  const expectedSlug = filename.replace(/\.md$/, "");
  if (metadata.slug !== expectedSlug) {
    throw new Error(`Kora guide ${filename} slug must match its filename.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug)) {
    throw new Error(`Kora guide ${filename} has an invalid slug.`);
  }
  const order = Number(metadata.order);
  if (!Number.isSafeInteger(order) || order < 1) {
    throw new Error(`Kora guide ${filename} order must be a positive integer.`);
  }

  return {
    slug: metadata.slug,
    order,
    category: metadata.category,
    title: metadata.title,
    summary: metadata.summary,
    readTime: metadata.readTime,
    hero: metadata.hero,
    sections: parseSections(body, filename),
  };
}

function loadKoraDocumentationCorpus() {
  const guides = readdirSync(CORPUS_DIRECTORY)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => parseKoraDocumentationGuide(readFileSync(path.join(CORPUS_DIRECTORY, filename), "utf8"), filename))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  const slugs = new Set<string>();
  const orders = new Set<number>();
  for (const guide of guides) {
    if (slugs.has(guide.slug)) throw new Error(`Duplicate Kora guide slug: ${guide.slug}`);
    if (orders.has(guide.order)) throw new Error(`Duplicate Kora guide order: ${guide.order}`);
    slugs.add(guide.slug);
    orders.add(guide.order);
  }
  if (guides.length === 0) throw new Error("The Kora documentation corpus is empty.");
  return guides;
}

export const koraDocumentationGuides = loadKoraDocumentationCorpus();

export function searchKoraDocumentation(query: string, limit = 4): KoraDocumentationSearchResult[] {
  const queryTerms = searchTerms(query);
  const normalizedQuery = normalizeSearchText(query);
  const ranked = koraDocumentationGuides.map((guide) => {
    const title = normalizeSearchText(guide.title);
    const headings = normalizeSearchText(guide.sections.map((section) => section.heading).join(" "));
    const content = koraGuideSearchText(guide);
    const searchable = normalizeSearchText(content);
    const overviewBonus = PRODUCT_OVERVIEW_PATTERN.test(normalizedQuery) && guide.slug === "what-is-kora" ? 20 : 0;
    const score = queryTerms.reduce((total, term) => {
      if (title.includes(term)) return total + 6;
      if (headings.includes(term)) return total + 3;
      if (searchable.includes(term)) return total + 1;
      return total;
    }, (normalizedQuery && searchable.includes(normalizedQuery) ? 8 : 0) + overviewBonus);
    return { guide, content, score };
  }).sort((a, b) => b.score - a.score || a.guide.order - b.guide.order);

  const selected = ranked.filter((item) => item.score > 0).slice(0, limit);
  if (selected.length === 0) {
    const defaults = new Set(["getting-started-with-kora", "ask-ai-and-read-citations"]);
    selected.push(...ranked.filter((item) => defaults.has(item.guide.slug)));
  }
  return selected.slice(0, limit);
}

export const koraProductKnowledgeCorpus: KnowledgeCorpus<KoraDocumentationGuide, KoraDocumentationSearchResult> = {
  scope: "product",
  documents: koraDocumentationGuides,
  search: searchKoraDocumentation,
};

export function getKoraDocumentationGuide(slug: string) {
  return koraDocumentationGuides.find((guide) => guide.slug === slug) ?? null;
}
