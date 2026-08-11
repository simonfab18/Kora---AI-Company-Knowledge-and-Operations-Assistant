import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { chunkDocumentContent } from "@/lib/chunking";
import { effectiveRetrievalThreshold } from "@/lib/document-indexing";
import {
  configuredEmbeddingModelId,
  createDeterministicEmbeddingProvider,
  vectorToSql,
} from "@/lib/embeddings";

describe("document chunking", () => {
  const content = `# Handbook

## Leave Policy

Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests. Employees can request leave in BambooHR. Direct managers approve ordinary requests.

Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval. Requests longer than three days require department head approval.

## Security

Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter. Passwords must not be shared. Security reviews happen every quarter.`;

  it("keeps neighboring headings in separate chunks when sections are short", () => {
    const chunks = chunkDocumentContent(`# Tire Sales

## Performance Tires

Performance tires provide stronger handling, steering response, and grip. They may wear faster than touring tires.

## Touring Tires

Touring tires are built for comfort, lower road noise, and longer tread life.`, { targetTokens: 160, overlapTokens: 12 });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].headingPath).toEqual(["Tire Sales", "Performance Tires"]);
    expect(chunks[0].content).toContain("stronger handling");
    expect(chunks[0].content).not.toContain("Touring tires are built");
    expect(chunks[1].headingPath).toEqual(["Tire Sales", "Touring Tires"]);
  });
  it("chunks documents deterministically with heading context", () => {
    const first = chunkDocumentContent(content, { targetTokens: 120, overlapTokens: 8 });
    const second = chunkDocumentContent(content, { targetTokens: 120, overlapTokens: 8 });

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(1);
    expect(first[0].chunkIndex).toBe(0);
    expect(first[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.some((chunk) => chunk.headingPath.includes("Leave Policy"))).toBe(true);
    expect(first.every((chunk) => chunk.tokenCount > 0)).toBe(true);
  });
});

describe("embedding providers", () => {
  it("creates fixed 1536-dimensional embeddings", async () => {
    const provider = createDeterministicEmbeddingProvider({
      provider: "test",
      model: "fixture",
      dimension: 1536,
    });

    const result = await provider.embedBatch(["leave policy", "security policy"]);

    expect(result.embeddings).toHaveLength(2);
    expect(result.embeddings[0]).toHaveLength(1536);
    expect(vectorToSql(result.embeddings[0]).startsWith("[")).toBe(true);
    expect(configuredEmbeddingModelId(provider)).toBe("test:fixture:1536");
  });

  it("rejects mixed embedding dimensions", () => {
    expect(() =>
      createDeterministicEmbeddingProvider({ provider: "test", model: "fixture", dimension: 768 }),
    ).toThrow(/1536-dimensional/);
  });
});

describe("vector search SQL", () => {
  it("keeps retrieval tenant-scoped and model-scoped", () => {
    const migration = readFileSync("supabase/migrations/20260719062000_document_chunks_embeddings.sql", "utf8");

    expect(migration).toContain("dc.organization_id = p_organization_id");
    expect(migration).toContain("d.organization_id = p_organization_id");
    expect(migration).toContain("dc.embedding_model = p_embedding_model");
    expect(migration).toContain("OPERATOR(extensions.<=>)");
    expect(migration).toContain("jsonb_array_elements_text(chunk_record.heading_path)");
    expect(migration).toContain("d.sync_status = 'indexed'");
    expect(migration).toContain("d.is_archived = false");
  });
});
describe("retrieval threshold tuning", () => {
  it("uses the saved organization threshold for every embedding provider", () => {
    expect(effectiveRetrievalThreshold({ embedding_provider: "gemini", retrieval_threshold: 0.68 })).toBe(0.68);
    expect(effectiveRetrievalThreshold({ embedding_provider: "openai", retrieval_threshold: 0.68 })).toBe(0.68);
  });
});