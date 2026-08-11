import { createHash } from "crypto";

export type ChunkingOptions = {
  targetTokens?: number;
  overlapTokens?: number;
};

export type DocumentChunkDraft = {
  chunkIndex: number;
  content: string;
  contentHash: string;
  tokenCount: number;
  headingPath: string[];
};

type Block = {
  text: string;
  headingPath: string[];
  isHeading: boolean;
};

type Section = {
  parts: string[];
  headingPath: string[];
};

const DEFAULT_TARGET_TOKENS = 420;
const DEFAULT_OVERLAP_TOKENS = 48;
const MIN_TARGET_TOKENS = 120;
const MAX_TARGET_TOKENS = 1400;
const MAX_OVERLAP_TOKENS = 160;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function estimateTokens(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  const wordEstimate = normalized.split(/\s+/).length;
  const characterEstimate = Math.ceil(normalized.length / 4);
  return Math.max(1, Math.ceil((wordEstimate + characterEstimate) / 2));
}

function hashContent(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function parseBlocks(content: string): Block[] {
  const headingPath: string[] = [];
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const heading = block.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        const title = heading[2].trim();
        headingPath.splice(level - 1);
        headingPath[level - 1] = title;
        return { text: block, headingPath: headingPath.filter(Boolean), isHeading: true };
      }

      return { text: block, headingPath: headingPath.filter(Boolean), isHeading: false };
    });
}

function hasBodyContent(parts: string[]) {
  return parts.some((part) => !/^#{1,6}\s+/.test(part));
}

function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  let parts: string[] = [];
  let activeHeadingPath: string[] = [];

  for (const block of parseBlocks(content)) {
    if (block.isHeading && parts.length > 0 && hasBodyContent(parts)) {
      sections.push({ parts, headingPath: activeHeadingPath });
      parts = [];
    }

    parts.push(block.text);
    activeHeadingPath = block.headingPath;
  }

  if (parts.length > 0) {
    sections.push({ parts, headingPath: activeHeadingPath });
  }

  return sections;
}

function overlapText(content: string, overlapTokens: number) {
  if (overlapTokens <= 0) {
    return "";
  }

  const words = content.trim().split(/\s+/).filter(Boolean);
  if (words.length <= overlapTokens) {
    return content.trim();
  }
  return words.slice(-overlapTokens).join(" ");
}

function makeChunk(index: number, parts: string[], headingPath: string[]): DocumentChunkDraft {
  const content = parts.join("\n\n").trim();
  return {
    chunkIndex: index,
    content,
    contentHash: hashContent(content),
    tokenCount: estimateTokens(content),
    headingPath,
  };
}

function splitLargeSection(section: Section, targetTokens: number, overlapTokens: number) {
  const chunks: Section[] = [];
  let parts: string[] = [];

  for (const part of section.parts) {
    const candidateParts = [...parts, part];
    if (parts.length > 0 && estimateTokens(candidateParts.join("\n\n")) > targetTokens) {
      chunks.push({ parts, headingPath: section.headingPath });
      const overlap = overlapText(parts.join("\n\n"), overlapTokens);
      parts = overlap ? [overlap, part] : [part];
    } else {
      parts = candidateParts;
    }
  }

  if (parts.length > 0) {
    chunks.push({ parts, headingPath: section.headingPath });
  }

  return chunks;
}

export function chunkDocumentContent(content: string, options: ChunkingOptions = {}): DocumentChunkDraft[] {
  const targetTokens = clamp(options.targetTokens ?? DEFAULT_TARGET_TOKENS, MIN_TARGET_TOKENS, MAX_TARGET_TOKENS);
  const overlapTokens = clamp(options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS, 0, Math.min(MAX_OVERLAP_TOKENS, targetTokens - 1));
  const chunks: DocumentChunkDraft[] = [];

  for (const section of parseSections(content)) {
    const sectionContent = section.parts.join("\n\n");
    const sectionTokens = estimateTokens(sectionContent);

    if (sectionTokens <= targetTokens) {
      chunks.push(makeChunk(chunks.length, section.parts, section.headingPath));
      continue;
    }

    for (const splitSection of splitLargeSection(section, targetTokens, overlapTokens)) {
      chunks.push(makeChunk(chunks.length, splitSection.parts, splitSection.headingPath));
    }
  }

  return chunks;
}