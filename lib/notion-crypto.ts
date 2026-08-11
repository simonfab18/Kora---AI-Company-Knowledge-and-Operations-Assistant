import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENCRYPTION_PREFIX = "kora:v1";

function keyFromSecret(secret: string) {
  if (!secret.trim()) {
    throw new Error("NOTION_TOKEN_ENCRYPTION_KEY is required.");
  }

  try {
    const decoded = Buffer.from(secret, "base64");
    if (decoded.length === 32) {
      return decoded;
    }
  } catch {
    // Fall back to hashing the provided development secret below.
  }

  return createHash("sha256").update(secret).digest();
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function encryptSecret(plaintext: string, secret = process.env.NOTION_TOKEN_ENCRYPTION_KEY) {
  if (!secret) {
    throw new Error("NOTION_TOKEN_ENCRYPTION_KEY is required.");
  }

  const key = keyFromSecret(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [ENCRYPTION_PREFIX, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptSecret(ciphertext: string, secret = process.env.NOTION_TOKEN_ENCRYPTION_KEY) {
  if (!secret) {
    throw new Error("NOTION_TOKEN_ENCRYPTION_KEY is required.");
  }

  const [prefix, version, ivValue, tagValue, encryptedValue] = ciphertext.split(":");
  if (`${prefix}:${version}` !== ENCRYPTION_PREFIX || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted token format.");
  }

  const key = keyFromSecret(secret);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}