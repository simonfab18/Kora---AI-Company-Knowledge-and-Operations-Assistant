import { createHash } from "crypto";
import { indexDocumentById } from "@/lib/document-indexing";
import { decryptSecret } from "@/lib/notion-crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_API_VERSION = process.env.NOTION_API_VERSION || "2022-06-28";
const MAX_PAGES_PER_SYNC = Number(process.env.NOTION_SYNC_MAX_PAGES || "50");

type RichText = {
  plain_text?: string;
  href?: string | null;
};

type NotionPage = {
  id: string;
  object: "page";
  archived?: boolean;
  in_trash?: boolean;
  url?: string;
  public_url?: string | null;
  created_time?: string;
  last_edited_time?: string;
  parent?: {
    type?: string;
    page_id?: string;
    database_id?: string;
    block_id?: string;
  };
  properties?: Record<string, NotionProperty>;
};

type NotionProperty = {
  id?: string;
  type?: string;
  title?: RichText[];
  rich_text?: RichText[];
};

type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

type SearchResponse = {
  results?: unknown[];
  has_more?: boolean;
  next_cursor?: string | null;
};

type ChildrenResponse = {
  results?: NotionBlock[];
  has_more?: boolean;
  next_cursor?: string | null;
};

export type SyncStats = {
  totalItems: number;
  processedItems: number;
  failedItems: number;
  skippedItems: number;
};

export type ConnectionRecord = {
  id: string;
  organization_id: string;
  access_token_ciphertext: string;
};

function richTextToPlainText(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || !("plain_text" in item)) {
        return "";
      }
      return typeof item.plain_text === "string" ? item.plain_text : "";
    })
    .join("")
    .trim();
}

function getPageTitle(page: NotionPage) {
  const properties = page.properties ?? {};
  for (const property of Object.values(properties)) {
    if (property.type === "title") {
      const title = richTextToPlainText(property.title);
      if (title) {
        return title;
      }
    }
  }
  return "Untitled Notion page";
}

function getParentExternalId(page: NotionPage) {
  const parent = page.parent;
  return parent?.page_id ?? parent?.database_id ?? parent?.block_id ?? null;
}

function contentHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function blockText(block: NotionBlock, childrenText: string) {
  const value = block[block.type];
  if (!value || typeof value !== "object") {
    return childrenText;
  }

  const payload = value as Record<string, unknown>;
  const text = richTextToPlainText(payload.rich_text);

  switch (block.type) {
    case "heading_1":
      return [`# ${text}`, childrenText].filter(Boolean).join("\n");
    case "heading_2":
      return [`## ${text}`, childrenText].filter(Boolean).join("\n");
    case "heading_3":
      return [`### ${text}`, childrenText].filter(Boolean).join("\n");
    case "bulleted_list_item":
      return [`- ${text}`, childrenText].filter(Boolean).join("\n");
    case "numbered_list_item":
      return [`1. ${text}`, childrenText].filter(Boolean).join("\n");
    case "to_do": {
      const checked = payload.checked === true ? "x" : " ";
      return [`- [${checked}] ${text}`, childrenText].filter(Boolean).join("\n");
    }
    case "quote":
      return [`> ${text}`, childrenText].filter(Boolean).join("\n");
    case "code":
      return ["```", text, "```"].filter(Boolean).join("\n");
    case "callout":
    case "paragraph":
      return [text, childrenText].filter(Boolean).join("\n");
    default:
      return [text, childrenText].filter(Boolean).join("\n");
  }
}

export async function notionRequest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`notion_${response.status}`);
  }

  return (await response.json()) as T;
}

async function discoverPages(token: string) {
  const pages: NotionPage[] = [];
  let startCursor: string | null = null;

  do {
    const body: Record<string, unknown> = {
      page_size: Math.min(100, Math.max(1, MAX_PAGES_PER_SYNC - pages.length)),
      filter: { property: "object", value: "page" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
    };

    if (startCursor) {
      body.start_cursor = startCursor;
    }

    const data = await notionRequest<SearchResponse>(token, "/search", {
      method: "POST",
      body: JSON.stringify(body),
    });

    for (const item of data.results ?? []) {
      if (
        item &&
        typeof item === "object" &&
        "object" in item &&
        item.object === "page" &&
        pages.length < MAX_PAGES_PER_SYNC
      ) {
        pages.push(item as NotionPage);
      }
    }

    startCursor = data.has_more && pages.length < MAX_PAGES_PER_SYNC ? data.next_cursor ?? null : null;
  } while (startCursor);

  return pages;
}

async function retrieveBlockChildren(token: string, blockId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let startCursor: string | null = null;

  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (startCursor) {
      query.set("start_cursor", startCursor);
    }

    const data = await notionRequest<ChildrenResponse>(token, `/blocks/${blockId}/children?${query.toString()}`);
    blocks.push(...(data.results ?? []));
    startCursor = data.has_more ? data.next_cursor ?? null : null;
  } while (startCursor);

  return blocks;
}

async function normalizeBlocks(token: string, blocks: NotionBlock[]): Promise<string> {
  const lines: string[] = [];

  for (const block of blocks) {
    const childText = block.has_children
      ? await normalizeBlocks(token, await retrieveBlockChildren(token, block.id))
      : "";
    const text = blockText(block, childText);
    if (text.trim()) {
      lines.push(text.trim());
    }
  }

  return lines.join("\n\n");
}

function errorText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const parts: string[] = [];
    for (const key of ["message", "details", "hint", "code"]) {
      if (key in error && typeof error[key as keyof typeof error] === "string") {
        parts.push(error[key as keyof typeof error] as string);
      }
    }
    return parts.join(" ");
  }
  return "";
}

function safeErrorMessage(error: unknown) {
  const message = errorText(error);
  if (/^notion_\d+$/.test(message)) {
    return `Notion returned ${message.replace("notion_", "HTTP ")}.`;
  }
  if (/^embedding_http_404$/.test(message)) {
    return "Embedding model is unavailable. Update the organization embedding model to gemini-embedding-001, then retry sync.";
  }
  if (/^embedding_http_(400|401|403)$/.test(message)) {
    return "Embedding provider rejected the request. Check the embedding API key, model, and API permissions.";
  }
  if (/^embedding_http_(429|500|502|503|504)$/.test(message)) {
    return "Embedding provider is temporarily unavailable or rate limited. Try again shortly.";
  }
  if (message.includes("Embedding provider returned an incomplete batch")) {
    return "Embedding provider returned no vectors. Check that the Gemini key is valid for the embedding model.";
  }
  if (message.includes("Gemini embedding key is not configured")) {
    return "Gemini embedding key is not configured. Add GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY and restart the dev server.";
  }
  if (message.includes("replace_document_chunks") || message.includes("function public.replace_document_chunks")) {
    return "Vector chunk storage is not ready. Run the document chunks and embeddings SQL migration, then retry sync.";
  }
  if (message.includes("document_chunks")) {
    return "Document chunks table is not ready. Run the document chunks and embeddings SQL migration, then retry sync.";
  }
  if (message.includes("usage_events")) {
    return "Usage event storage is not ready. Run the document chunks and embeddings SQL migration, then retry sync.";
  }
  if (message.includes("permission denied")) {
    const table = message.match(/table ([a-zA-Z0-9_]+)/)?.[1];
    return table
      ? `Database permissions blocked sync on ${table}. Run the service-role AI grants SQL migration, then retry sync.`
      : "Database permissions blocked sync. Run the service-role AI grants SQL migration, then retry sync.";
  }
  if (message.includes("invalid input syntax for type vector") || message.includes("vector")) {
    return "Vector storage rejected the embedding format. Rerun the corrected document chunks and embeddings SQL migration.";
  }
  return "Notion synchronization failed safely.";
}

async function syncPageDocument(
  token: string,
  supabase: ReturnType<typeof createAdminClient>,
  connection: ConnectionRecord,
  page: NotionPage,
): Promise<"processed" | "skipped"> {
  const title = getPageTitle(page);
  const blocks = await retrieveBlockChildren(token, page.id);
  const blockContent = await normalizeBlocks(token, blocks);
  const normalizedContent = [`# ${title}`, blockContent].filter(Boolean).join("\n\n");
  const hash = contentHash(normalizedContent);

  const { data: existingDocument, error: lookupError } = await supabase
    .from("documents")
    .select("id, content_hash")
    .eq("organization_id", connection.organization_id)
    .eq("source_type", "notion_page")
    .eq("external_id", page.id)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  const now = new Date().toISOString();
  const payload = {
    connection_id: connection.id,
    parent_external_id: getParentExternalId(page),
    title,
    source_url: page.url ?? page.public_url ?? null,
    normalized_content: normalizedContent,
    content_hash: hash,
    metadata: {
      notion_object: page.object,
      parent: page.parent ?? null,
      imported_by: "manual_sync",
    },
    source_created_at: page.created_time ?? null,
    source_updated_at: page.last_edited_time ?? null,
    last_indexed_at: now,
    sync_status: "indexed",
    is_archived: false,
    last_error: null,
    updated_at: now,
  };

  if (existingDocument?.content_hash === hash) {
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        connection_id: connection.id,
        source_updated_at: page.last_edited_time ?? null,
        last_indexed_at: now,
        sync_status: "indexed",
        is_archived: false,
        last_error: null,
        updated_at: now,
      })
      .eq("id", existingDocument.id)
      .eq("organization_id", connection.organization_id);

    if (updateError) {
      throw updateError;
    }

    const { count, error: chunkCountError } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", connection.organization_id)
      .eq("document_id", existingDocument.id);

    if (chunkCountError) {
      throw chunkCountError;
    }

    if ((count ?? 0) === 0) {
      await indexDocumentOrMarkFailed(supabase, existingDocument.id, connection.organization_id);
      return "processed";
    }

    return "skipped";
  }

  let documentId = existingDocument?.id ?? null;

  if (existingDocument) {
    const { error: updateError } = await supabase
      .from("documents")
      .update(payload)
      .eq("id", existingDocument.id)
      .eq("organization_id", connection.organization_id);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { data: insertedDocument, error: insertError } = await supabase
      .from("documents")
      .insert({
        organization_id: connection.organization_id,
        source_type: "notion_page",
        external_id: page.id,
        ...payload,
      })
      .select("id")
      .single();

    if (insertError || !insertedDocument) {
      throw insertError ?? new Error("Document insert failed.");
    }

    documentId = insertedDocument.id;
  }

  if (!documentId) {
    throw new Error("Document indexing target was not found.");
  }

  await indexDocumentOrMarkFailed(supabase, documentId, connection.organization_id);
  return "processed";
}

async function indexDocumentOrMarkFailed(
  supabase: ReturnType<typeof createAdminClient>,
  documentId: string,
  organizationId: string,
) {
  try {
    await indexDocumentById(documentId, organizationId);
  } catch (error) {
    await supabase
      .from("documents")
      .update({
        sync_status: "failed",
        last_error: safeErrorMessage(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("organization_id", organizationId);
    throw error;
  }
}

export async function retrieveNotionPage(token: string, pageId: string): Promise<NotionPage> {
  const page = await notionRequest<unknown>(token, `/pages/${pageId}`);
  if (!page || typeof page !== "object" || !("object" in page) || page.object !== "page") {
    throw new Error("notion_invalid_page");
  }
  return page as NotionPage;
}
export async function runNotionSyncJob(jobId: string, connection: ConnectionRecord): Promise<SyncStats> {
  const supabase = createAdminClient();
  const token = decryptSecret(connection.access_token_ciphertext);
  const startedAt = new Date().toISOString();

  await supabase
    .from("sync_jobs")
    .update({ status: "running", started_at: startedAt, last_heartbeat_at: startedAt })
    .eq("id", jobId)
    .eq("organization_id", connection.organization_id);

  const pages = await discoverPages(token);
  const activePages = pages.filter((page) => !page.archived && !page.in_trash);
  let processedItems = 0;
  let failedItems = 0;
  let skippedItems = 0;
  let firstErrorMessage: string | null = null;

  await supabase
    .from("sync_jobs")
    .update({ total_items: activePages.length, last_heartbeat_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("organization_id", connection.organization_id);

  for (const page of activePages) {
    try {
      const result = await syncPageDocument(token, supabase, connection, page);
      if (result === "skipped") {
        skippedItems += 1;
      }
      processedItems += 1;
    } catch (error) {
      failedItems += 1;
      firstErrorMessage ??= safeErrorMessage(error);
    }

    await supabase
      .from("sync_jobs")
      .update({ processed_items: processedItems, failed_items: failedItems, skipped_items: skippedItems, last_heartbeat_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("organization_id", connection.organization_id);
  }

  const completedAt = new Date().toISOString();
  const status = failedItems > 0 && processedItems === 0 ? "failed" : "succeeded";
  await supabase
    .from("sync_jobs")
    .update({
      status,
      completed_at: completedAt,
      error_code: status === "failed" ? "notion_sync_failed" : null,
      error_message: status === "failed" ? firstErrorMessage ?? "No Notion pages could be synchronized." : null,
      last_heartbeat_at: completedAt,
    })
    .eq("id", jobId)
    .eq("organization_id", connection.organization_id);

  if (status === "succeeded") {
    await supabase
      .from("notion_connections")
      .update({ last_synced_at: completedAt, last_error: null, updated_at: completedAt })
      .eq("id", connection.id)
      .eq("organization_id", connection.organization_id);
  }

  return { totalItems: activePages.length, processedItems, failedItems, skippedItems };
}

export async function runNotionPageSyncJob(
  jobId: string,
  connection: ConnectionRecord,
  pageId: string,
): Promise<SyncStats> {
  const supabase = createAdminClient();
  const token = decryptSecret(connection.access_token_ciphertext);
  const startedAt = new Date().toISOString();

  await supabase
    .from("sync_jobs")
    .update({ status: "running", started_at: startedAt, total_items: 1, last_heartbeat_at: startedAt })
    .eq("id", jobId)
    .eq("organization_id", connection.organization_id);

  let processedItems = 0;
  let failedItems = 0;
  let skippedItems = 0;

  let firstErrorMessage: string | null = null;

  try {
    const page = await retrieveNotionPage(token, pageId);
    if (page.archived || page.in_trash) {
      await supabase
        .from("documents")
        .update({ sync_status: "archived", is_archived: true, updated_at: new Date().toISOString() })
        .eq("organization_id", connection.organization_id)
        .eq("source_type", "notion_page")
        .eq("external_id", pageId);
      skippedItems = 1;
    } else {
      const result = await syncPageDocument(token, supabase, connection, page);
      if (result === "skipped") {
        skippedItems = 1;
      }
      processedItems = 1;
    }
  } catch (error) {
    failedItems = 1;
    firstErrorMessage = safeErrorMessage(error);
  }

  const completedAt = new Date().toISOString();
  const status = failedItems > 0 ? "failed" : "succeeded";
  await supabase
    .from("sync_jobs")
    .update({
      status,
      processed_items: processedItems,
      failed_items: failedItems,
      skipped_items: skippedItems,
      completed_at: completedAt,
      error_code: status === "failed" ? "notion_page_sync_failed" : null,
      error_message: status === "failed" ? firstErrorMessage ?? "The selected Notion page could not be re-indexed." : null,
      last_heartbeat_at: completedAt,
    })
    .eq("id", jobId)
    .eq("organization_id", connection.organization_id);

  return { totalItems: 1, processedItems, failedItems, skippedItems };
}
export { safeErrorMessage };
