import { supabase, supabaseUrl, publishableKey, isSupabaseConfigured } from "../lib/supabase"

const API_ROOT = `${supabaseUrl}/functions/v1/make-server-82d9c8b6`

export type SourceSummary = {
  id: string
  matter_id: string
  title: string
  source_type: string
  origin: string | null
  source_date: string | null
  received_at: string | null
  confirmation_state: string
  created_at: string
  source_files: Array<{
    id: string
    original_name: string
    media_type: string | null
    byte_size: number | null
    sha256: string | null
    created_at: string
  }>
}

export type UploadOriginalInput = {
  matterId: string
  title: string
  sourceType: string
  origin?: string
  sourceDate?: string
  file: File
}

export type UploadOriginalResult = {
  source: {
    id: string
    matterId: string
    title: string
    sourceType: string
    origin: string | null
    sourceDate: string | null
    confirmationState: "unverified"
  }
  original: {
    id: string
    originalName: string
    mediaType: string
    byteSize: number
    sha256: string
    preserved: true
  }
  processing: {
    status: "not_requested"
    message: string
  }
}

async function accessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  if (!session) throw new Error("Authentication required.")
  return session.access_token
}

async function request<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>
  } = {},
) {
  if (!isSupabaseConfigured) throw new Error("Private backend is not configured.")
  const token = await accessToken()
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null
  if (!response.ok) {
    throw new Error(payload?.error || "The secure request failed.")
  }
  if (!payload) throw new Error("The secure response was empty.")
  return payload
}

export async function listSources(matterId: string) {
  const result = await request<{ sources: SourceSummary[] }>(
    "/sources/list",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matterId }),
    },
  )
  return result.sources
}

export async function uploadOriginalSource(
  input: UploadOriginalInput,
): Promise<UploadOriginalResult> {
  const form = new FormData()
  form.set("matterId", input.matterId)
  form.set("title", input.title)
  form.set("sourceType", input.sourceType)
  form.set("origin", input.origin ?? "")
  form.set("sourceDate", input.sourceDate ?? "")
  form.set("file", input.file, input.file.name)

  return request<UploadOriginalResult>("/sources", {
    method: "POST",
    body: form,
  })
}

export async function createOriginalSignedUrl(
  sourceFileId: string,
  expiresInSeconds = 60,
) {
  const result = await request<{
    signedUrl: string
    expiresInSeconds: number
  }>("/originals/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceFileId, expiresInSeconds }),
  })
  return result
}
