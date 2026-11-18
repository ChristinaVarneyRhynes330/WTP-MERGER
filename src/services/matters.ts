import { supabase } from "../lib/supabase"
import type { Matter, MatterUpdate } from "../types/database"

export type CreateMatterInput = {
  name: string
  jurisdiction?: string
  court?: string
  caseNumber?: string
  stage?: string
  activeProceeding?: string
}

function optional(value: string | undefined) {
  const normalized = value?.trim()
  return normalized || null
}

export async function listMatters(): Promise<Matter[]> {
  const { data, error } = await supabase
    .from("matters")
    .select("*")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getMatter(matterId: string): Promise<Matter> {
  const { data, error } = await supabase
    .from("matters")
    .select("*")
    .eq("id", matterId)
    .single()

  if (error) throw error
  return data
}

export async function createMatter(
  input: CreateMatterInput,
): Promise<Matter> {
  const name = input.name.trim()
  if (!name) throw new Error("Matter name is required.")

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("You must be signed in to create a matter.")

  const { data, error } = await supabase
    .from("matters")
    .insert({
      owner_id: user.id,
      name,
      jurisdiction: optional(input.jurisdiction),
      court: optional(input.court),
      case_number: optional(input.caseNumber),
      stage: optional(input.stage),
      active_proceeding: optional(input.activeProceeding),
    })
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function updateMatter(
  matterId: string,
  updates: MatterUpdate,
): Promise<Matter> {
  const { data, error } = await supabase
    .from("matters")
    .update(updates)
    .eq("id", matterId)
    .select("*")
    .single()

  if (error) throw error
  return data
}
