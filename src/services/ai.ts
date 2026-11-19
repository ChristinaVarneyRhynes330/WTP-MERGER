import { isSupabaseConfigured, supabaseUrl, publishableKey, supabase } from "../lib/supabase"

export type AiCitation = {
  sourceId: string
  pageNumber: number | null
  excerpt: string
  passageId: string
  label: string
}

export type AiInsight = {
  answer: string
  verifiedFacts: string[]
  unverifiedOrMissing: string[]
  uncertainty: string[]
  citations: AiCitation[]
  suggestedAction: string | null
}

async function accessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session) throw new Error("Authentication required.")
  return data.session.access_token
}

export async function askAssistant(input: {
  matterId: string
  question: string
}) {
  if (!isSupabaseConfigured) throw new Error("The secure AI service is not configured.")
  if (!input.matterId || !input.question.trim()) {
    throw new Error("A matter and question are required.")
  }

  const token = await accessToken()
  const response = await fetch(`${supabaseUrl}/functions/v1/ask-assistant`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      matterId: input.matterId,
      question: input.question.trim(),
    }),
  })
  const payload = await response.json().catch(() => null) as
    | (AiInsight & { error?: string })
    | null
  if (!response.ok) throw new Error(payload?.error || "The AI request failed.")
  if (!payload) throw new Error("The AI returned an empty response.")
  return payload
}
