import { supabase } from "../lib/supabase"
import type {
  CounselQaItem,
  EvidencePathway,
  HandoffFile,
  Matter,
} from "../types/database"

export type CounselHandoffData = {
  matter: Matter
  files: Array<
    HandoffFile & {
      evidence_pathways: EvidencePathway[]
    }
  >
  activeQuestions: CounselQaItem[]
}

export type CounselTriageSuggestion = {
  pathwayRule: string | null
  priority: HandoffFile["priority"]
  preservationFlag: boolean
  rationale: string
  unverified: true
  suggestedPathwayRule?: string
  suggestedPriority?: string
  flagReason?: string
  recommendedNextStep?: string
  rule9200LimitationNote?: string
}

export async function updateHandoffReview(input: {
  matterId: string
  fileId: string
  priority: HandoffFile["priority"]
  preservationFlag: boolean
  notes: string | null
  pathwayRule: string | null
}) {
  const { data: file, error: fileError } = await supabase
    .from("handoff_files")
    .update({
      priority: input.priority,
      preservation_flag: input.preservationFlag,
      notes: input.notes?.trim() || null,
    })
    .eq("id", input.fileId)
    .eq("matter_id", input.matterId)
    .select("*")
    .single()
  if (fileError) throw fileError

  const { data: existingPathway, error: existingPathwayError } = await supabase
    .from("evidence_pathways")
    .select("id")
    .eq("matter_id", input.matterId)
    .eq("handoff_file_id", input.fileId)
    .maybeSingle()
  if (existingPathwayError) throw existingPathwayError

  const pathwayQuery = existingPathway
    ? supabase
        .from("evidence_pathways")
        .update({ pathway_rule: input.pathwayRule?.trim() || null })
        .eq("id", existingPathway.id)
        .eq("matter_id", input.matterId)
    : supabase.from("evidence_pathways").insert({
        matter_id: input.matterId,
        handoff_file_id: input.fileId,
        pathway_rule: input.pathwayRule?.trim() || null,
      })
  const { data: pathway, error: pathwayError } = await pathwayQuery
    .select("*")
    .single()
  if (pathwayError) throw pathwayError

  return { file, pathway }
}

export async function triageHandoffFile(
  matterId: string,
  fileId: string,
): Promise<CounselTriageSuggestion> {
  const { data, error } = await supabase.functions.invoke(
    "triage-counsel-handoff",
    { body: { matter_id: matterId, handoff_file_id: fileId } },
  )
  if (error) throw error
  const payload = data as {
    suggestion?: {
      suggested_pathway_rule?: unknown
      suggested_priority?: unknown
      suggested_preservation_flag?: unknown
      flag_reason?: unknown
      recommended_next_step?: unknown
      rationale?: unknown
      rule_9200_limitation_note?: unknown
      is_unverified_suggestion?: unknown
    }
    pathwayRule?: unknown
    priority?: unknown
    preservationFlag?: unknown
    rationale?: unknown
  }
  const suggestion = payload.suggestion
  const pathwayRule =
    typeof payload.pathwayRule === "string"
      ? payload.pathwayRule
      : typeof suggestion?.suggested_pathway_rule === "string"
        ? suggestion.suggested_pathway_rule
        : "Unverified Source"
  const priorityMap: Record<string, HandoffFile["priority"]> = {
    urgent: "urgent",
    high: "high",
    normal: "normal",
    low: "low",
  }
  const priority =
    typeof payload.priority === "string"
      ? priorityMap[payload.priority] ?? "normal"
      : "normal"
  return {
    pathwayRule,
    priority,
    preservationFlag:
      typeof payload.preservationFlag === "boolean"
        ? payload.preservationFlag
        : suggestion?.suggested_preservation_flag === true,
    rationale:
      typeof payload.rationale === "string"
        ? payload.rationale
        : typeof suggestion?.rationale === "string"
          ? suggestion.rationale
          : "No definitive pathway is established by the supplied metadata.",
    unverified: true,
    suggestedPathwayRule:
      typeof suggestion?.suggested_pathway_rule === "string"
        ? suggestion.suggested_pathway_rule
        : undefined,
    suggestedPriority:
      typeof suggestion?.suggested_priority === "string"
        ? suggestion.suggested_priority
        : undefined,
    flagReason:
      typeof suggestion?.flag_reason === "string"
        ? suggestion.flag_reason
        : undefined,
    recommendedNextStep:
      typeof suggestion?.recommended_next_step === "string"
        ? suggestion.recommended_next_step
        : undefined,
    rule9200LimitationNote:
      typeof suggestion?.rule_9200_limitation_note === "string"
        ? suggestion.rule_9200_limitation_note
        : undefined,
  }
}

export async function loadCounselHandoff(matterId: string): Promise<CounselHandoffData> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matterId)) {
    throw new Error("A valid authorized matter identifier is required.")
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error("Authentication is required.")

  const { data: member, error: memberError } = await supabase.rpc("is_matter_member", {
    target_matter_id: matterId,
  })
  if (memberError || !member) throw new Error("You are not authorized to access this matter.")

  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .select("*")
    .eq("id", matterId)
    .is("archived_at", null)
    .single()
  if (matterError) throw matterError

  const { data: files, error: filesError } = await supabase
    .from("handoff_files")
    .select("*")
    .eq("matter_id", matter.id)
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false })
  if (filesError) throw filesError

  const { data: pathways, error: pathwaysError } = await supabase
    .from("evidence_pathways")
    .select("*")
    .eq("matter_id", matter.id)
  if (pathwaysError) throw pathwaysError

  const { data: activeQuestions, error: questionsError } = await supabase
    .from("counsel_qa_items")
    .select("*")
    .eq("matter_id", matter.id)
    .in("status", ["active", "unverified"])
    .order("updated_at", { ascending: false })
  if (questionsError) throw questionsError

  return {
    matter,
    files: (files ?? []).map((file) => ({
      ...(file as HandoffFile),
      evidence_pathways: (pathways ?? []).filter(
        (pathway) => pathway.handoff_file_id === file.id,
      ) as EvidencePathway[],
    })),
    activeQuestions: activeQuestions ?? [],
  }
}
