type LogLevel = "info" | "warn" | "error";

const SECRET_KEY_PATTERN = /(authorization|cookie|password|secret|token|key|ciphertext)/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeLogMetadata(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogMetadata(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SECRET_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeLogMetadata(entry),
    ]),
  );
}

export function logOperationalEvent(level: LogLevel, event: string, metadata: Record<string, unknown> = {}) {
  const sanitizedMetadata = sanitizeLogMetadata(metadata) as Record<string, unknown>;
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ...sanitizedMetadata,
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}