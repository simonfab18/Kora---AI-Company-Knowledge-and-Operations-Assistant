import { describe, expect, it } from "vitest";
import { createGenerationProvider } from "@/lib/generation";

describe("generation providers", () => {
  it("falls back from legacy Gemini model settings to the current default", () => {
    process.env.GEMINI_API_KEY = "test-key";

    const provider = createGenerationProvider({
      provider: "gemini",
      model: "gemini-2.0-flash",
    });

    expect(provider.model).toBe("gemini-flash-latest");
  });
});