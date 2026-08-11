import { z } from "zod";

export const organizationRoleSchema = z.enum(["owner", "admin", "member"]);
export const assignableOrganizationRoleSchema = z.enum(["admin", "member"]);

export const answerLengthSchema = z.enum(["concise", "balanced", "detailed"]);
export const answerToneSchema = z.enum(["professional", "friendly", "direct", "technical"]);
export const answerLanguageSchema = z.enum(["english", "filipino", "question_language"]);

export function parseWithSchema<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}