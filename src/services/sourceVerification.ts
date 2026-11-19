import { supabase } from "../lib/supabase"
import type { ConfirmationState } from "../types/database"

export async function updateSourceConfirmation(
  sourceId: string,
  state: ConfirmationState,
  note?: string,
) {
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .update({ confirmation_state: state })
    .eq("id", sourceId)
    .select("id,matter_id")
    .single()
  if (sourceError) throw sourceError

  const { error: confirmationError } = await supabase
    .from("confirmations")
    .insert({
      matter_id: source.matter_id,
      entity_type: "source",
      entity_id: source.id,
      state,
      note: note?.trim() || null,
    })
  if (confirmationError) throw confirmationError
  return source
}
