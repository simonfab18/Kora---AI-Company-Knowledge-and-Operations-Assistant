import { describe, expect, it } from "vitest";
import { passwordCompromiseMessage, pwnedCountForSuffix } from "@/lib/password-security";

describe("password breach protection", () => {
  it("matches only the exact SHA-1 suffix from the padded range response", () => {
    const response = ["ABCDEF:12", "123456:0", "FEDCBA:900"].join("\r\n");
    expect(pwnedCountForSuffix(response, "abcdef")).toBe(12);
    expect(pwnedCountForSuffix(response, "AAAAAA")).toBe(0);
  });

  it("returns safe user-facing messages without exposing password data", () => {
    expect(passwordCompromiseMessage("compromised")).toMatch(/known data breach/i);
    expect(passwordCompromiseMessage("unavailable")).toMatch(/could not be verified/i);
    expect(passwordCompromiseMessage("safe")).toBeNull();
  });
});
