import { afterEach, describe, expect, it, vi } from "vitest";
import { createNotionAuthorizeUrl, notionOAuthRedirectPath, safeNotionReturnTo } from "@/lib/notion";
import { decryptSecret, encryptSecret, hashSecret } from "@/lib/notion-crypto";
import { safeErrorMessage } from "@/lib/notion-ingestion";

describe("Notion token encryption", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encrypts tokens without storing plaintext", () => {
    const secret = "test-encryption-key";
    const token = "secret_notion_token";

    const ciphertext = encryptSecret(token, secret);

    expect(ciphertext).not.toContain(token);
    expect(ciphertext.startsWith("kora:v1:")).toBe(true);
    expect(decryptSecret(ciphertext, secret)).toBe(token);
  });

  it("hashes OAuth state deterministically", () => {
    expect(hashSecret("state-value")).toBe(hashSecret("state-value"));
    expect(hashSecret("state-value")).not.toBe("state-value");
  });
});

describe("Notion OAuth URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes client, redirect, owner, and state parameters", () => {
    vi.stubEnv("NOTION_CLIENT_ID", "client_123");
    vi.stubEnv("NOTION_REDIRECT_URI", "http://localhost:3000/api/notion/callback");

    const url = new URL(createNotionAuthorizeUrl("state_123"));

    expect(url.origin + url.pathname).toBe("https://api.notion.com/v1/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("client_123");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("owner")).toBe("user");
    expect(url.searchParams.get("state")).toBe("state_123");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/notion/callback");
  });
});
describe("Notion sync errors", () => {
  it("maps provider status errors without exposing token details", () => {
    expect(safeErrorMessage(new Error("notion_429"))).toBe("Notion returned HTTP 429.");
    expect(safeErrorMessage(new Error("secret_token_failure"))).toBe("Notion synchronization failed safely.");
    expect(safeErrorMessage(new Error("embedding_http_403"))).toBe("Embedding provider rejected the request. Check the embedding API key, model, and API permissions.");
    expect(safeErrorMessage(new Error("embedding_http_404"))).toBe("Embedding model is unavailable. Update the organization embedding model to gemini-embedding-001, then retry sync.");
    expect(safeErrorMessage({ message: "Could not find the function public.replace_document_chunks" })).toBe("Vector chunk storage is not ready. Run the document chunks and embeddings SQL migration, then retry sync.");
    expect(safeErrorMessage({ message: "permission denied for table organizations" })).toBe("Database permissions blocked sync on organizations. Run the service-role AI grants SQL migration, then retry sync.");
  });
});
describe("Notion onboarding OAuth flow", () => {
  it("accepts only the onboarding return destination", () => {
    expect(safeNotionReturnTo("/onboarding/sync")).toBe("/onboarding/sync");
    expect(safeNotionReturnTo("https://example.com/steal-state")).toBe("/app/settings");
    expect(safeNotionReturnTo(null)).toBe("/app/settings");
  });

  it("continues onboarding after a successful connection", () => {
    expect(notionOAuthRedirectPath("/onboarding/sync", "connected")).toBe("/onboarding/sync?notion=connected");
  });

  it("returns onboarding failures to the Notion step", () => {
    expect(notionOAuthRedirectPath("/onboarding/sync", "connection_failed")).toBe("/onboarding/connect-notion?notion=connection_failed");
  });
});
