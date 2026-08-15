import { afterEach, describe, expect, it, vi } from "vitest";
import { createGenerationProvider } from "@/lib/generation";

describe("generation providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back from legacy Gemini model settings to the current default", () => {
    process.env.GEMINI_API_KEY = "test-key";

    const provider = createGenerationProvider({
      provider: "gemini",
      model: "gemini-2.0-flash",
    });

    expect(provider.model).toBe("gemini-flash-latest");
  });

  it("normalizes malformed provider JSON into a safe generation error", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"answer":"broken",}' }] } }] }),
    }));
    const provider = createGenerationProvider({ provider: "gemini", model: "gemini-flash-latest" });
    await expect(provider.generateGroundedAnswer("test prompt")).rejects.toThrow("generation_invalid_json");
  });
});
