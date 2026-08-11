import { randomBytes } from "crypto";
import { encryptSecret, hashSecret } from "@/lib/notion-crypto";

const NOTION_AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize";
const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";
const NOTION_VERSION = "2026-03-11";

export type NotionTokenResponse = {
  access_token: string;
  refresh_token: string | null;
  bot_id: string | null;
  workspace_id: string | null;
  workspace_name: string | null;
  workspace_icon: string | null;
  duplicated_template_id?: string | null;
  owner?: unknown;
};

export type NotionOAuthStatus = "connected" | "connection_failed";

export function safeNotionReturnTo(value: string | null | undefined) {
  return value === "/onboarding/sync" ? "/onboarding/sync" : "/app/settings";
}

export function notionOAuthRedirectPath(returnTo: string | null, status: NotionOAuthStatus) {
  if (returnTo === "/onboarding/sync") {
    const step = status === "connected" ? "sync" : "connect-notion";
    return `/onboarding/${step}?notion=${status}`;
  }

  return `/app/settings?notion=${status}`;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function getNotionRedirectUri() {
  return process.env.NOTION_REDIRECT_URI || `${getSiteUrl()}/api/notion/callback`;
}

export function createOAuthState() {
  const state = randomBytes(32).toString("base64url");
  return { state, stateHash: hashSecret(state) };
}

export function createNotionAuthorizeUrl(state: string) {
  const clientId = process.env.NOTION_CLIENT_ID;

  if (!clientId) {
    throw new Error("NOTION_CLIENT_ID is required.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: getNotionRedirectUri(),
    state,
  });

  return `${NOTION_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeNotionCode(code: string): Promise<NotionTokenResponse> {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Notion OAuth credentials are not configured.");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(NOTION_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: getNotionRedirectUri(),
    }),
  });

  if (!response.ok) {
    throw new Error("Notion authorization failed.");
  }

  const data = (await response.json()) as Partial<NotionTokenResponse>;

  if (!data.access_token) {
    throw new Error("Notion did not return an access token.");
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    bot_id: data.bot_id ?? null,
    workspace_id: data.workspace_id ?? null,
    workspace_name: data.workspace_name ?? null,
    workspace_icon: data.workspace_icon ?? null,
    duplicated_template_id: data.duplicated_template_id ?? null,
    owner: data.owner,
  };
}

export function encryptedNotionTokenPayload(token: string) {
  return encryptSecret(token);
}

export function getDevelopmentNotionConnection() {
  const token = process.env.NOTION_INTERNAL_INTEGRATION_TOKEN;

  if (process.env.APP_ENV === "production" || !token) {
    return null;
  }

  const workspaceId = process.env.NOTION_INTERNAL_WORKSPACE_ID || `development-${hashSecret(token).slice(0, 16)}`;
  const workspaceName = process.env.NOTION_INTERNAL_WORKSPACE_NAME || "Development Notion workspace";

  return {
    accessTokenCiphertext: encryptSecret(token),
    workspaceId,
    workspaceName,
  };
}