import { createHash } from "node:crypto";

const PASSWORD_RANGE_API = "https://api.pwnedpasswords.com/range";
const PASSWORD_CHECK_TIMEOUT_MS = 5_000;

export type PasswordCompromiseStatus = "safe" | "compromised" | "unavailable";

export function pwnedCountForSuffix(responseBody: string, suffix: string) {
  const normalizedSuffix = suffix.toUpperCase();
  for (const line of responseBody.split(/\r?\n/)) {
    const [candidate, count] = line.split(":");
    if (candidate?.trim().toUpperCase() === normalizedSuffix) {
      const parsed = Number.parseInt(count?.trim() ?? "0", 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }
  return 0;
}

export async function checkPasswordCompromise(password: string): Promise<PasswordCompromiseStatus> {
  if (process.env.PASSWORD_BREACH_CHECK_ENABLED === "false") return "safe";

  const digest = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PASSWORD_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${PASSWORD_RANGE_API}/${prefix}`, {
      headers: {
        "Add-Padding": "true",
        "User-Agent": "Kora-Password-Security",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return "unavailable";
    return pwnedCountForSuffix(await response.text(), suffix) > 0 ? "compromised" : "safe";
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timeout);
  }
}

export function passwordCompromiseMessage(status: PasswordCompromiseStatus) {
  if (status === "compromised") return "This password appears in a known data breach. Choose a unique password that you do not use elsewhere.";
  if (status === "unavailable") return "Password safety could not be verified right now. Please try again.";
  return null;
}
