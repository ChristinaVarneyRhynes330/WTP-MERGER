export type MatterRole = "owner" | "editor" | "viewer"

export type ConfirmationState =
  | "ai_suggested"
  | "user_confirmed"
  | "disputed"
  | "unverified"
  | "needs_source"

export type Matter = {
  id: string
  owner_id: string
  name: string
  jurisdiction: string | null
  court: string | null
  case_number: string | null
  stage: string | null
  active_proceeding: string | null
  representation: "represented_by_counsel" | "self_represented" | null
  counsel_name: string | null
  counsel_contact: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export type MatterInsert = Pick<Matter, "name" | "owner_id"> &
  Partial<
    Pick<
      Matter,
      | "jurisdiction"
      | "court"
      | "case_number"
      | "stage"
      | "active_proceeding"
      | "representation"
      | "counsel_name"
      | "counsel_contact"
    >
  >

export type MatterUpdate = Partial<
  Pick<
    Matter,
    | "name"
    | "jurisdiction"
    | "court"
    | "case_number"
    | "stage"
    | "active_proceeding"
    | "representation"
    | "counsel_name"
    | "counsel_contact"
    | "archived_at"
  >
>

export type MatterMember = {
  matter_id: string
  user_id: string
  role: MatterRole
  created_at: string
}

export type SourceFile = {
  id: string
  matter_id: string
  source_id: string
  bucket_id: "matter-originals"
  object_path: string
  original_name: string
  media_type: string | null
  byte_size: number | null
  sha256: string | null
  uploaded_by: string
  created_at: string
}

export type Source = {
  id: string
  matter_id: string
  title: string
  source_type: string
  origin: string | null
  source_date: string | null
  received_at: string | null
  custody_notes: string | null
  content_type: "original_source"
  confirmation_state: ConfirmationState
  created_by: string
  created_at: string
  updated_at: string
  archived_at: string | null
}

export type Confirmation = {
  id: string
  matter_id: string
  entity_type: string
  entity_id: string
  state: ConfirmationState
  note: string | null
  confirmed_by: string
  created_at: string
}

export type SourceChunk = {
  id: string
  matter_id: string
  source_id: string
  derivative_id: string | null
  page_number: number | null
  chunk_index: number
  content: string
  embedding: number[] | null
  created_at: string
  updated_at: string
}

export type HearingNote = {
  id: string
  matter_id: string
  hearing_at: string | null
  title: string
  requested: string | null
  discussed: string | null
  ruled: string | null
  to_verify: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type LearningProgress = {
  id: string
  matter_id: string
  module_number: number
  module_slug: string
  status: "not_started" | "in_progress" | "completed"
  progress_percent: number
  reflection: string | null
  knowledge_check_score: number | null
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type ProcessingJob = {
  id: string
  matter_id: string
  source_id: string
  job_type: string
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled"
  attempt_count: number
  process_version: string | null
  error_code: string | null
  error_message: string | null
  started_at: string | null
  finished_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      matters: Table<Matter, MatterInsert, MatterUpdate>
      matter_members: Table<
        MatterMember,
        Pick<MatterMember, "matter_id" | "user_id" | "role">,
        Pick<MatterMember, "role">
      >
      sources: Table<
        Source,
        Pick<Source, "matter_id" | "title" | "source_type" | "created_by"> &
          Partial<
            Pick<
              Source,
              | "id"
              | "origin"
              | "source_date"
              | "received_at"
              | "custody_notes"
              | "content_type"
              | "confirmation_state"
              | "archived_at"
            >
          >,
        Partial<
          Pick<
            Source,
            | "title"
            | "source_type"
            | "origin"
            | "source_date"
            | "received_at"
            | "custody_notes"
            | "confirmation_state"
            | "archived_at"
          >
        >
      >
      confirmations: Table<
        Confirmation,
        Pick<
          Confirmation,
          "matter_id" | "entity_type" | "entity_id" | "state"
        > &
          Partial<Pick<Confirmation, "id" | "note" | "confirmed_by">>,
        never
      >
      source_files: Table<
        SourceFile,
        Pick<
          SourceFile,
          | "matter_id"
          | "source_id"
          | "object_path"
          | "original_name"
          | "uploaded_by"
        > &
          Partial<
            Pick<
              SourceFile,
              "id" | "bucket_id" | "media_type" | "byte_size" | "sha256"
            >
          >,
        never
      >
      source_chunks: Table<
        SourceChunk,
        Pick<
          SourceChunk,
          "matter_id" | "source_id" | "content"
        > &
          Partial<
            Pick<
              SourceChunk,
              "id" | "derivative_id" | "page_number" | "chunk_index" | "embedding"
            >
          >,
        Partial<
          Pick<
            SourceChunk,
            "derivative_id" | "page_number" | "chunk_index" | "content" | "embedding"
          >
        >
      >
      hearing_notes: Table<
        HearingNote,
        Pick<HearingNote, "matter_id" | "title"> &
          Partial<
            Pick<
              HearingNote,
              "hearing_at" | "requested" | "discussed" | "ruled" | "to_verify" | "created_by"
            >
          >,
        Partial<
          Pick<
            HearingNote,
            "hearing_at" | "title" | "requested" | "discussed" | "ruled" | "to_verify"
          >
        >
      >
      learning_progress: Table<
        LearningProgress,
        Pick<
          LearningProgress,
          "matter_id" | "module_number" | "module_slug"
        > &
          Partial<
            Pick<
              LearningProgress,
              | "status"
              | "progress_percent"
              | "reflection"
              | "knowledge_check_score"
              | "completed_at"
              | "created_by"
            >
          >,
        Partial<
          Pick<
            LearningProgress,
            | "status"
            | "progress_percent"
            | "reflection"
            | "knowledge_check_score"
            | "completed_at"
          >
        >
      >
      processing_jobs: Table<
        ProcessingJob,
        Pick<
          ProcessingJob,
          "matter_id" | "source_id" | "job_type"
        > &
          Partial<
            Pick<
              ProcessingJob,
              | "status"
              | "attempt_count"
              | "process_version"
              | "error_code"
              | "error_message"
              | "started_at"
              | "finished_at"
              | "created_by"
            >
          >,
        Partial<
          Pick<
            ProcessingJob,
            | "status"
            | "attempt_count"
            | "process_version"
            | "error_code"
            | "error_message"
            | "started_at"
            | "finished_at"
          >
        >
      >
    }
    Views: Record<string, never>
    Functions: {
      can_edit_matter: {
        Args: { target_matter_id: string }
        Returns: boolean
      }
      is_matter_member: {
        Args: { target_matter_id: string }
        Returns: boolean
      }
      owns_matter: {
        Args: { target_matter_id: string }
        Returns: boolean
      }
      match_source_chunks: {
        Args: {
          query_embedding: number[]
          target_matter_id: string
          match_threshold?: number
          match_count?: number
        }
        Returns: Array<{
          id: string
          source_id: string
          derivative_id: string | null
          page_number: number | null
          chunk_index: number
          content: string
          similarity: number
        }>
      }
    }
    Enums: {
      matter_role: MatterRole
      confirmation_state:
        ConfirmationState
      content_type:
        | "original_source"
        | "source_assertion"
        | "user_recollection"
        | "legal_authority"
        | "user_interpretation"
        | "ai_summary"
        | "ai_inference"
        | "conflicting_account"
        | "unknown"
        | "draft"
    }
    CompositeTypes: Record<string, never>
  }
}
