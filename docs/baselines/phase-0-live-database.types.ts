export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answer_evidence: {
        Row: {
          answer_trace_id: string
          chunk_id: string
          citation_number: number | null
          created_at: string
          id: string
          keyword_score: number | null
          organization_id: string
          reranker_score: number | null
          source_id: string
          used_in_answer: boolean
          vector_score: number | null
        }
        Insert: {
          answer_trace_id: string
          chunk_id: string
          citation_number?: number | null
          created_at?: string
          id?: string
          keyword_score?: number | null
          organization_id: string
          reranker_score?: number | null
          source_id: string
          used_in_answer?: boolean
          vector_score?: number | null
        }
        Update: {
          answer_trace_id?: string
          chunk_id?: string
          citation_number?: number | null
          created_at?: string
          id?: string
          keyword_score?: number | null
          organization_id?: string
          reranker_score?: number | null
          source_id?: string
          used_in_answer?: boolean
          vector_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_evidence_answer_trace_id_fkey"
            columns: ["answer_trace_id"]
            isOneToOne: false
            referencedRelation: "answer_traces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_evidence_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_traces: {
        Row: {
          answer: string
          answer_mode: string
          conversation_id: string | null
          created_at: string
          id: string
          input_tokens: number | null
          latency_ms: number | null
          message_id: string | null
          model: string | null
          organization_id: string
          output_tokens: number | null
          prompt_version: string
          question: string
          retrieval_confidence: string
          rewritten_queries: string[]
          user_id: string | null
          validation_status: Json
        }
        Insert: {
          answer: string
          answer_mode: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          message_id?: string | null
          model?: string | null
          organization_id: string
          output_tokens?: number | null
          prompt_version: string
          question: string
          retrieval_confidence: string
          rewritten_queries?: string[]
          user_id?: string | null
          validation_status?: Json
        }
        Update: {
          answer?: string
          answer_mode?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          message_id?: string | null
          model?: string | null
          organization_id?: string
          output_tokens?: number | null
          prompt_version?: string
          question?: string
          retrieval_confidence?: string
          rewritten_queries?: string[]
          user_id?: string | null
          validation_status?: Json
        }
        Relationships: [
          {
            foreignKeyName: "answer_traces_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_traces_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_traces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          organization_id: string
          pinned_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          pinned_at?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          pinned_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          content_hash: string
          created_at: string
          document_id: string
          embedding: string
          embedding_model: string
          heading_path: string[]
          id: string
          metadata: Json
          organization_id: string
          token_count: number
        }
        Insert: {
          chunk_index: number
          content: string
          content_hash: string
          created_at?: string
          document_id: string
          embedding: string
          embedding_model: string
          heading_path?: string[]
          id?: string
          metadata?: Json
          organization_id: string
          token_count: number
        }
        Update: {
          chunk_index?: number
          content?: string
          content_hash?: string
          created_at?: string
          document_id?: string
          embedding?: string
          embedding_model?: string
          heading_path?: string[]
          id?: string
          metadata?: Json
          organization_id?: string
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          connection_id: string
          content_hash: string
          created_at: string
          external_id: string
          id: string
          is_archived: boolean
          last_error: string | null
          last_indexed_at: string | null
          metadata: Json
          normalized_content: string
          organization_id: string
          parent_external_id: string | null
          source_created_at: string | null
          source_type: string
          source_updated_at: string | null
          source_url: string | null
          sync_status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
        }
        Insert: {
          connection_id: string
          content_hash: string
          created_at?: string
          external_id: string
          id?: string
          is_archived?: boolean
          last_error?: string | null
          last_indexed_at?: string | null
          metadata?: Json
          normalized_content?: string
          organization_id: string
          parent_external_id?: string | null
          source_created_at?: string | null
          source_type?: string
          source_updated_at?: string | null
          source_url?: string | null
          sync_status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
        }
        Update: {
          connection_id?: string
          content_hash?: string
          created_at?: string
          external_id?: string
          id?: string
          is_archived?: boolean
          last_error?: string | null
          last_indexed_at?: string | null
          metadata?: Json
          normalized_content?: string
          organization_id?: string
          parent_external_id?: string | null
          source_created_at?: string | null
          source_type?: string
          source_updated_at?: string | null
          source_url?: string | null
          sync_status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "notion_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_collection_documents: {
        Row: {
          added_by: string | null
          collection_id: string
          created_at: string
          document_id: string
          id: string
          organization_id: string
        }
        Insert: {
          added_by?: string | null
          collection_id: string
          created_at?: string
          document_id: string
          id?: string
          organization_id: string
        }
        Update: {
          added_by?: string | null
          collection_id?: string
          created_at?: string
          document_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_collection_documents_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "knowledge_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_collection_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_collection_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_collections: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_collections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_gaps: {
        Row: {
          confidence: Database["public"]["Enums"]["answer_confidence"] | null
          created_at: string
          first_seen_at: string
          id: string
          last_message_id: string | null
          last_seen_at: string
          missing_topic: string | null
          occurrence_count: number
          organization_id: string
          question_fingerprint: string
          reason: string
          related_document_id: string | null
          representative_question: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          trigger_message_id: string | null
          updated_at: string
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["answer_confidence"] | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_message_id?: string | null
          last_seen_at?: string
          missing_topic?: string | null
          occurrence_count?: number
          organization_id: string
          question_fingerprint: string
          reason?: string
          related_document_id?: string | null
          representative_question: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          trigger_message_id?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: Database["public"]["Enums"]["answer_confidence"] | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_message_id?: string | null
          last_seen_at?: string
          missing_topic?: string | null
          occurrence_count?: number
          organization_id?: string
          question_fingerprint?: string
          reason?: string
          related_document_id?: string | null
          representative_question?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          trigger_message_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_gaps_last_message_id_fkey"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_gaps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_gaps_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_gaps_trigger_message_id_fkey"
            columns: ["trigger_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_citations: {
        Row: {
          chunk_id: string
          citation_order: number
          created_at: string
          document_id: string
          id: string
          message_id: string
          quote_excerpt: string | null
          section_title: string | null
          similarity_score: number | null
        }
        Insert: {
          chunk_id: string
          citation_order: number
          created_at?: string
          document_id: string
          id?: string
          message_id: string
          quote_excerpt?: string | null
          section_title?: string | null
          similarity_score?: number | null
        }
        Update: {
          chunk_id?: string
          citation_order?: number
          created_at?: string
          document_id?: string
          id?: string
          message_id?: string
          quote_excerpt?: string | null
          section_title?: string | null
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_citations_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_citations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_citations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_feedback: {
        Row: {
          created_at: string
          id: string
          message_id: string
          note: string | null
          organization_id: string
          rating: string
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          note?: string | null
          organization_id: string
          rating: string
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          note?: string | null
          organization_id?: string
          rating?: string
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          answer_mode: string | null
          completion_tokens: number | null
          confidence: Database["public"]["Enums"]["answer_confidence"] | null
          content: string
          conversation_id: string
          created_at: string
          error_code: string | null
          follow_up_question: string | null
          id: string
          latency_ms: number | null
          model_name: string | null
          model_provider: string | null
          organization_id: string
          prompt_tokens: number | null
          role: Database["public"]["Enums"]["message_role"]
          status: Database["public"]["Enums"]["message_status"]
          suggested_follow_ups: string[]
        }
        Insert: {
          answer_mode?: string | null
          completion_tokens?: number | null
          confidence?: Database["public"]["Enums"]["answer_confidence"] | null
          content: string
          conversation_id: string
          created_at?: string
          error_code?: string | null
          follow_up_question?: string | null
          id?: string
          latency_ms?: number | null
          model_name?: string | null
          model_provider?: string | null
          organization_id: string
          prompt_tokens?: number | null
          role: Database["public"]["Enums"]["message_role"]
          status?: Database["public"]["Enums"]["message_status"]
          suggested_follow_ups?: string[]
        }
        Update: {
          answer_mode?: string | null
          completion_tokens?: number | null
          confidence?: Database["public"]["Enums"]["answer_confidence"] | null
          content?: string
          conversation_id?: string
          created_at?: string
          error_code?: string | null
          follow_up_question?: string | null
          id?: string
          latency_ms?: number | null
          model_name?: string | null
          model_provider?: string | null
          organization_id?: string
          prompt_tokens?: number | null
          role?: Database["public"]["Enums"]["message_role"]
          status?: Database["public"]["Enums"]["message_status"]
          suggested_follow_ups?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_connections: {
        Row: {
          access_token_ciphertext: string
          bot_id: string | null
          connected_by: string | null
          created_at: string
          disconnected_at: string | null
          id: string
          last_error: string | null
          last_synced_at: string | null
          notion_workspace_icon: string | null
          notion_workspace_id: string
          notion_workspace_name: string
          organization_id: string
          refresh_token_ciphertext: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_ciphertext: string
          bot_id?: string | null
          connected_by?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          notion_workspace_icon?: string | null
          notion_workspace_id: string
          notion_workspace_name: string
          organization_id: string
          refresh_token_ciphertext?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_ciphertext?: string
          bot_id?: string | null
          connected_by?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          notion_workspace_icon?: string | null
          notion_workspace_id?: string
          notion_workspace_name?: string
          organization_id?: string
          refresh_token_ciphertext?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notion_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_oauth_states: {
        Row: {
          consumed_at: string | null
          created_at: string
          created_by: string
          expires_at: string
          id: string
          organization_id: string
          return_to: string | null
          state_hash: string
          status: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          organization_id: string
          return_to?: string | null
          state_hash: string
          status?: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          organization_id?: string
          return_to?: string | null
          state_hash?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notion_oauth_states_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: string[]
          current_step: string
          organization_id: string
          skipped_steps: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[]
          current_step?: string
          organization_id: string
          skipped_steps?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[]
          current_step?: string
          organization_id?: string
          skipped_steps?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_preferences: {
        Row: {
          answer_length: string
          answer_tone: string
          citations_required: boolean
          created_at: string
          default_language: string
          initial_departments: string[]
          no_answer_behavior: string
          organization_id: string
          primary_use_cases: string[]
          updated_at: string
        }
        Insert: {
          answer_length?: string
          answer_tone?: string
          citations_required?: boolean
          created_at?: string
          default_language?: string
          initial_departments?: string[]
          no_answer_behavior?: string
          organization_id: string
          primary_use_cases?: string[]
          updated_at?: string
        }
        Update: {
          answer_length?: string
          answer_tone?: string
          citations_required?: boolean
          created_at?: string
          default_language?: string
          initial_departments?: string[]
          no_answer_behavior?: string
          organization_id?: string
          primary_use_cases?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_provider: string
          company_size: string | null
          created_at: string
          default_language: string | null
          description: string | null
          embedding_dimension: number
          embedding_model: string
          embedding_provider: string
          employee_term: string | null
          generation_model: string
          id: string
          industry: string | null
          name: string
          onboarding_completed_at: string | null
          onboarding_status: string
          owner_user_id: string
          plan: string
          retrieval_threshold: number
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          ai_provider?: string
          company_size?: string | null
          created_at?: string
          default_language?: string | null
          description?: string | null
          embedding_dimension?: number
          embedding_model?: string
          embedding_provider?: string
          employee_term?: string | null
          generation_model?: string
          id?: string
          industry?: string | null
          name: string
          onboarding_completed_at?: string | null
          onboarding_status?: string
          owner_user_id: string
          plan?: string
          retrieval_threshold?: number
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          ai_provider?: string
          company_size?: string | null
          created_at?: string
          default_language?: string | null
          description?: string | null
          embedding_dimension?: number
          embedding_model?: string
          embedding_provider?: string
          employee_term?: string | null
          generation_model?: string
          id?: string
          industry?: string | null
          name?: string
          onboarding_completed_at?: string | null
          onboarding_status?: string
          owner_user_id?: string
          plan?: string
          retrieval_threshold?: number
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      problem_reports: {
        Row: {
          category: string
          created_at: string
          expected_behavior: string
          id: string
          include_diagnostics: boolean
          organization_id: string | null
          page_url: string | null
          status: string
          steps_to_reproduce: string
          submitted_by: string | null
          title: string
          updated_at: string
          what_happened: string
        }
        Insert: {
          category: string
          created_at?: string
          expected_behavior: string
          id?: string
          include_diagnostics?: boolean
          organization_id?: string | null
          page_url?: string | null
          status?: string
          steps_to_reproduce: string
          submitted_by?: string | null
          title: string
          updated_at?: string
          what_happened: string
        }
        Update: {
          category?: string
          created_at?: string
          expected_behavior?: string
          id?: string
          include_diagnostics?: boolean
          organization_id?: string | null
          page_url?: string | null
          status?: string
          steps_to_reproduce?: string
          submitted_by?: string | null
          title?: string
          updated_at?: string
          what_happened?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          appearance_preference: string
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string | null
          full_name: string | null
          id: string
          job_title: string | null
          main_responsibility: string | null
          notification_preferences: Json
          onboarding_completed_at: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          appearance_preference?: string
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          main_responsibility?: string | null
          notification_preferences?: Json
          onboarding_completed_at?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          appearance_preference?: string
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          main_responsibility?: string | null
          notification_preferences?: Json
          onboarding_completed_at?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          email: string
          id: string
          name: string
          organization_id: string | null
          organization_name: string | null
          status: string
          subject: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          email: string
          id?: string
          name: string
          organization_id?: string | null
          organization_name?: string | null
          status?: string
          subject: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          name?: string
          organization_id?: string | null
          organization_name?: string | null
          status?: string
          subject?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_jobs: {
        Row: {
          celery_task_id: string | null
          completed_at: string | null
          connection_id: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          failed_items: number
          id: string
          job_type: string
          organization_id: string
          processed_items: number
          requested_by: string | null
          skipped_items: number
          started_at: string | null
          status: Database["public"]["Enums"]["sync_job_status"]
          total_items: number
        }
        Insert: {
          celery_task_id?: string | null
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          failed_items?: number
          id?: string
          job_type: string
          organization_id: string
          processed_items?: number
          requested_by?: string | null
          skipped_items?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_job_status"]
          total_items?: number
        }
        Update: {
          celery_task_id?: string | null
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          failed_items?: number
          id?: string
          job_type?: string
          organization_id?: string
          processed_items?: number
          requested_by?: string | null
          skipped_items?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_job_status"]
          total_items?: number
        }
        Relationships: [
          {
            foreignKeyName: "sync_jobs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "notion_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          model: string | null
          organization_id: string
          provider: string | null
          quantity: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          model?: string | null
          organization_id: string
          provider?: string | null
          quantity?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          model?: string | null
          organization_id?: string
          provider?: string | null
          quantity?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_reads: {
        Row: {
          id: string
          notification_id: string
          organization_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          organization_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          organization_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_reads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invitation: {
        Args: { p_token: string }
        Returns: string
      }
      add_existing_organization_member: {
        Args: {
          p_organization_id: string
          p_role: Database["public"]["Enums"]["organization_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      create_organization: {
        Args: { p_name: string; p_slug: string }
        Returns: string
      }
      disable_organization_member: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: undefined
      }
      is_org_manager: { Args: { target_org_id: string }; Returns: boolean }
      is_org_member: { Args: { target_org_id: string }; Returns: boolean }
      is_org_owner: { Args: { target_org_id: string }; Returns: boolean }
      match_document_chunks: {
        Args: {
          p_embedding_model: string
          p_match_count?: number
          p_min_similarity?: number
          p_organization_id: string
          p_query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          heading_path: string[]
          metadata: Json
          similarity: number
          source_url: string
          title: string
        }[]
      }
      remove_organization_member: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: undefined
      }
      replace_document_chunks: {
        Args: {
          p_chunks: Json
          p_document_id: string
          p_organization_id: string
        }
        Returns: number
      }
      search_document_chunks_keyword: {
        Args: {
          p_match_count?: number
          p_organization_id: string
          p_query: string
        }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          heading_path: string[]
          keyword_score: number
          metadata: Json
          source_url: string
          title: string
        }[]
      }
      update_organization_member_role: {
        Args: {
          p_organization_id: string
          p_role: Database["public"]["Enums"]["organization_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      update_organization_profile: {
        Args: { p_name: string; p_organization_id: string; p_slug: string }
        Returns: undefined
      }
      update_organization_retrieval_threshold: {
        Args: { p_organization_id: string; p_retrieval_threshold: number }
        Returns: undefined
      }
    }
    Enums: {
      answer_confidence: "high" | "medium" | "low" | "insufficient"
      document_status: "pending" | "syncing" | "indexed" | "failed" | "archived"
      member_status: "invited" | "active" | "disabled"
      message_role: "user" | "assistant" | "system"
      message_status: "pending" | "completed" | "failed"
      organization_role: "owner" | "admin" | "member"
      sync_job_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      answer_confidence: ["high", "medium", "low", "insufficient"],
      document_status: ["pending", "syncing", "indexed", "failed", "archived"],
      member_status: ["invited", "active", "disabled"],
      message_role: ["user", "assistant", "system"],
      message_status: ["pending", "completed", "failed"],
      organization_role: ["owner", "admin", "member"],
      sync_job_status: [
        "queued",
        "running",
        "succeeded",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
