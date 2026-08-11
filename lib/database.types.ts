export type OrganizationRole = "owner" | "admin" | "member";
export type MemberStatus = "invited" | "active" | "disabled";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  display_name: string | null;
  job_title: string | null;
  department: string | null;
  main_responsibility: string | null;
  preferred_language: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  plan: string;
  ai_provider: string;
  generation_model: string;
  embedding_provider: string;
  embedding_model: string;
  embedding_dimension: number;
  retrieval_threshold: number;
  industry: string | null;
  company_size: string | null;
  website: string | null;
  description: string | null;
  employee_term: string | null;
  default_language: string | null;
  onboarding_status: string;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationPreference = {
  organization_id: string;
  primary_use_cases: string[];
  initial_departments: string[];
  answer_length: "concise" | "balanced" | "detailed";
  answer_tone: "professional" | "friendly" | "direct" | "technical";
  default_language: "english" | "filipino" | "question_language";
  citations_required: boolean;
  no_answer_behavior: string;
  created_at: string;
  updated_at: string;
};

export type OnboardingProgress = {
  organization_id: string;
  user_id: string;
  current_step: string;
  completed_steps: string[];
  skipped_steps: string[];
  completed_at: string | null;
  updated_at: string;
};
export type OrganizationMember = {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  status: MemberStatus;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
};

export type OrganizationInvitationStatus = "pending" | "accepted" | "revoked";

export type OrganizationInvitation = {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  status: OrganizationInvitationStatus;
  token: string;
  invited_by: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type NotionConnectionStatus = "connected" | "error" | "disconnected";

export type NotionConnection = {
  id: string;
  organization_id: string;
  notion_workspace_id: string;
  notion_workspace_name: string;
  notion_workspace_icon: string | null;
  bot_id: string | null;
  status: NotionConnectionStatus;
  last_synced_at: string | null;
  last_error: string | null;
  connected_by: string | null;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotionOAuthState = {
  id: string;
  organization_id: string;
  created_by: string;
  state_hash: string;
  status: "pending" | "used" | "expired";
  expires_at: string;
  return_to: string | null;
  consumed_at: string | null;
  created_at: string;
};
export type DocumentStatus = "pending" | "syncing" | "indexed" | "failed" | "archived";
export type SyncJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type Document = {
  id: string;
  organization_id: string;
  connection_id: string;
  source_type: "notion_page";
  external_id: string;
  parent_external_id: string | null;
  title: string;
  source_url: string | null;
  normalized_content: string;
  content_hash: string;
  metadata: Record<string, unknown>;
  source_created_at: string | null;
  source_updated_at: string | null;
  last_indexed_at: string | null;
  sync_status: DocumentStatus;
  is_archived: boolean;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type SyncJob = {
  id: string;
  organization_id: string;
  connection_id: string | null;
  requested_by: string | null;
  job_type: "full" | "incremental" | "page" | "delete";
  status: SyncJobStatus;
  celery_task_id: string | null;
  total_items: number;
  processed_items: number;
  failed_items: number;
  skipped_items: number;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};
export type DocumentChunk = {
  id: string;
  organization_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  content_hash: string;
  token_count: number;
  heading_path: string[];
  metadata: Record<string, unknown>;
  embedding_model: string;
  created_at: string;
};

export type UsageEvent = {
  id: string;
  organization_id: string;
  user_id: string | null;
  event_type: string;
  quantity: number;
  provider: string | null;
  model: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "pending" | "completed" | "failed";
export type AnswerConfidence = "high" | "medium" | "low" | "insufficient";
export type AnswerMode = "fully_answerable" | "partially_answerable" | "ambiguous" | "no_reliable_answer" | "restricted";

export type Conversation = {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  pinned_at: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  organization_id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  confidence: AnswerConfidence | null;
  model_provider: string | null;
  model_name: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  latency_ms: number | null;
  error_code: string | null;
  answer_mode: AnswerMode | null;
  follow_up_question: string | null;
  suggested_follow_ups: string[];
  created_at: string;
};

export type MessageCitation = {
  id: string;
  message_id: string;
  document_id: string;
  chunk_id: string;
  citation_order: number;
  quote_excerpt: string | null;
  similarity_score: number | null;
  section_title: string | null;
  created_at: string;
};

export type MessageFeedbackRating = "helpful" | "not_helpful";
export type MessageFeedbackReason = "wrong_answer" | "missing_context" | "wrong_citation" | "unclear" | "too_vague" | "too_long" | "outdated" | "other";

export type MessageFeedback = {
  id: string;
  organization_id: string;
  message_id: string;
  user_id: string;
  rating: MessageFeedbackRating;
  reason: MessageFeedbackReason | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeGapStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type KnowledgeGapReason = "insufficient_context" | "low_confidence" | "negative_feedback";

export type KnowledgeGap = {
  id: string;
  organization_id: string;
  representative_question: string;
  question_fingerprint: string;
  missing_topic: string | null;
  related_document_id: string | null;
  trigger_message_id: string | null;
  last_message_id: string | null;
  confidence: AnswerConfidence | null;
  reason: KnowledgeGapReason;
  occurrence_count: number;
  status: KnowledgeGapStatus;
  resolution_notes: string | null;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

