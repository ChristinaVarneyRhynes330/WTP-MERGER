import { createClient } from "jsr:@supabase/supabase-js@2.49.8"
import { Hono } from "npm:hono"
import { cors } from "npm:hono/cors"
import { logger } from "npm:hono/logger"

const API_PREFIX = "/make-server-82d9c8b6"
const ORIGINALS_BUCKET = "matter-originals"
const MAX_FILE_BYTES = 50 * 1024 * 1024
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/
const BLOCKED_EXTENSIONS = new Set([
  "app",
  "bat",
  "cmd",
  "com",
  "dll",
  "dmg",
  "exe",
  "hta",
  "jar",
  "js",
  "jse",
  "msi",
  "ps1",
  "scr",
  "sh",
  "vbs",
])
const BLOCKED_MEDIA_TYPES = new Set([
  "application/java-archive",
  "application/vnd.microsoft.portable-executable",
  "application/x-dosexec",
  "application/x-executable",
  "application/x-msdownload",
  "application/x-sh",
])

const app = new Hono()

app.use("*", logger(console.log))
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
)

function requiredEnvironment() {
  const url = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Supabase environment is incomplete")
  }
  return { url, anonKey, serviceRoleKey }
}

function bearerToken(header: string | undefined) {
  const match = header?.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

function userClient(token: string) {
  const { url, anonKey } = requiredEnvironment()
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })
}

function adminClient() {
  const { url, serviceRoleKey } = requiredEnvironment()
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function authenticate(authorization: string | undefined) {
  const token = bearerToken(authorization)
  if (!token) return null

  const client = userClient(token)
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token)
  if (error || !user) return null
  return { client, user }
}

function formText(form: FormData, name: string) {
  const value = form.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function safeFileName(fileName: string) {
  return (
    fileName
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180) || "original"
  )
}

function extension(fileName: string) {
  const parts = fileName.toLowerCase().split(".")
  return parts.length > 1 ? parts.at(-1) ?? "" : ""
}

function validUpload(file: File) {
  if (!file.name || file.size <= 0 || file.size > MAX_FILE_BYTES) return false
  if (file.name.length > 255 || CONTROL_CHARACTER_PATTERN.test(file.name)) {
    return false
  }
  if (BLOCKED_EXTENSIONS.has(extension(file.name))) return false
  if (file.type && BLOCKED_MEDIA_TYPES.has(file.type.toLowerCase())) return false
  return true
}

function validDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value)
}

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function cleanupPartialUpload(
  sourceId: string,
  sourceFileId: string,
  objectPath: string | null,
) {
  const admin = adminClient()
  const cleanupErrors: string[] = []
  const { error: sourceFileError } = await admin
    .from("source_files")
    .delete()
    .eq("id", sourceFileId)
  if (sourceFileError) cleanupErrors.push("source_file")

  if (objectPath) {
    const { error: storageError } = await admin.storage
      .from(ORIGINALS_BUCKET)
      .remove([objectPath])
    if (storageError) cleanupErrors.push("storage")
  }

  const { error: sourceError } = await admin
    .from("sources")
    .delete()
    .eq("id", sourceId)
  if (sourceError) cleanupErrors.push("source")
  if (cleanupErrors.length) {
    console.error("partial ingestion cleanup failed", cleanupErrors.join(","))
  }
}

app.get(`${API_PREFIX}/health`, (c) => {
  return c.json({ status: "ok" })
})

app.post(`${API_PREFIX}/sources/list`, async (c) => {
  const auth = await authenticate(c.req.header("Authorization"))
  if (!auth) return c.json({ error: "Authentication required" }, 401)

  let body: { matterId?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "A JSON request is required" }, 400)
  }

  const matterId = typeof body.matterId === "string" ? body.matterId.trim() : ""
  if (!UUID_PATTERN.test(matterId)) {
    return c.json({ error: "A valid matter ID is required" }, 400)
  }

  const { data, error } = await auth.client
    .from("sources")
    .select(
      "id, matter_id, title, source_type, origin, source_date, received_at, confirmation_state, created_at, source_files(id, original_name, media_type, byte_size, sha256, created_at)",
    )
    .eq("matter_id", matterId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("source list failed", error.code)
    return c.json({ error: "Sources could not be loaded" }, 500)
  }
  return c.json({ sources: data })
})

app.post(`${API_PREFIX}/sources`, async (c) => {
  const auth = await authenticate(c.req.header("Authorization"))
  if (!auth) return c.json({ error: "Authentication required" }, 401)

  const contentLength = Number(c.req.header("Content-Length") ?? 0)
  if (contentLength > MAX_FILE_BYTES + 1_000_000) {
    return c.json({ error: "The original exceeds the 50 MB limit" }, 413)
  }

  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    return c.json({ error: "A multipart form upload is required" }, 400)
  }

  const matterId = formText(form, "matterId")
  const title = formText(form, "title")
  const sourceType = formText(form, "sourceType") || "document"
  const origin = formText(form, "origin")
  const sourceDate = formText(form, "sourceDate")
  const file = form.get("file")

  if (!UUID_PATTERN.test(matterId)) {
    return c.json({ error: "A valid matter ID is required" }, 400)
  }
  if (
    !title ||
    title.length > 200 ||
    CONTROL_CHARACTER_PATTERN.test(title)
  ) {
    return c.json({ error: "A source title between 1 and 200 characters is required" }, 400)
  }
  if (
    sourceType.length > 80 ||
    origin.length > 500 ||
    CONTROL_CHARACTER_PATTERN.test(sourceType) ||
    CONTROL_CHARACTER_PATTERN.test(origin)
  ) {
    return c.json({ error: "Source metadata is too long" }, 400)
  }
  if (sourceDate && !validDate(sourceDate)) {
    return c.json({ error: "Source date must use YYYY-MM-DD" }, 400)
  }
  if (!(file instanceof File) || !validUpload(file)) {
    return c.json(
      { error: "Choose a non-executable original between 1 byte and 50 MB" },
      400,
    )
  }

  const { data: canEdit, error: accessError } = await auth.client.rpc(
    "can_edit_matter",
    { target_matter_id: matterId },
  )
  if (accessError || !canEdit) {
    return c.json({ error: "Matter access denied" }, 403)
  }

  const sourceId = crypto.randomUUID()
  const sourceFileId = crypto.randomUUID()
  const objectPath = `${matterId}/${sourceFileId}/${safeFileName(file.name)}`
  const mediaType = file.type || "application/octet-stream"

  try {
    const checksum = await sha256(file)
    const { error: sourceError } = await auth.client.from("sources").insert({
      id: sourceId,
      matter_id: matterId,
      title,
      source_type: sourceType,
      origin: origin || null,
      source_date: sourceDate || null,
      confirmation_state: "unverified",
      content_type: "original_source",
      created_by: auth.user.id,
    })
    if (sourceError) throw sourceError

    const { error: uploadError } = await auth.client.storage
      .from(ORIGINALS_BUCKET)
      .upload(objectPath, file, {
        cacheControl: "0",
        contentType: mediaType,
        upsert: false,
      })
    if (uploadError) throw uploadError

    const { error: fileError } = await auth.client.from("source_files").insert({
      id: sourceFileId,
      matter_id: matterId,
      source_id: sourceId,
      bucket_id: ORIGINALS_BUCKET,
      object_path: objectPath,
      original_name: file.name,
      media_type: mediaType,
      byte_size: file.size,
      sha256: checksum,
      uploaded_by: auth.user.id,
    })
    if (fileError) throw fileError

    return c.json(
      {
        source: {
          id: sourceId,
          matterId,
          title,
          sourceType,
          origin: origin || null,
          sourceDate: sourceDate || null,
          confirmationState: "unverified",
        },
        original: {
          id: sourceFileId,
          originalName: file.name,
          mediaType,
          byteSize: file.size,
          sha256: checksum,
          preserved: true,
        },
        processing: {
          status: "not_requested",
          message: "The unchanged original is preserved. Extraction is not connected yet.",
        },
      },
      201,
    )
  } catch (error) {
    console.error(
      "source ingestion failed",
      error && typeof error === "object" && "code" in error ? error.code : "unknown",
    )
    await cleanupPartialUpload(sourceId, sourceFileId, objectPath)
    return c.json({ error: "The original could not be preserved" }, 500)
  }
})

app.post(`${API_PREFIX}/originals/signed-url`, async (c) => {
  const auth = await authenticate(c.req.header("Authorization"))
  if (!auth) return c.json({ error: "Authentication required" }, 401)

  let body: { sourceFileId?: unknown; expiresInSeconds?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "A JSON request is required" }, 400)
  }

  const sourceFileId =
    typeof body.sourceFileId === "string" ? body.sourceFileId.trim() : ""
  if (!UUID_PATTERN.test(sourceFileId)) {
    return c.json({ error: "A valid source file ID is required" }, 400)
  }

  const requestedExpiry =
    typeof body.expiresInSeconds === "number" &&
    Number.isFinite(body.expiresInSeconds)
      ? body.expiresInSeconds
      : 60
  const expiresInSeconds = Math.min(Math.max(Math.round(requestedExpiry), 15), 300)

  const { data: sourceFile, error: fileError } = await auth.client
    .from("source_files")
    .select("object_path, original_name")
    .eq("id", sourceFileId)
    .single()
  if (fileError || !sourceFile) {
    return c.json({ error: "Original not found" }, 404)
  }

  const { data, error } = await auth.client.storage
    .from(ORIGINALS_BUCKET)
    .createSignedUrl(sourceFile.object_path, expiresInSeconds, {
      download: safeFileName(sourceFile.original_name),
    })
  if (error) {
    console.error("signed URL creation failed", error.name)
    return c.json({ error: "Original access could not be prepared" }, 500)
  }

  return c.json({
    signedUrl: data.signedUrl,
    expiresInSeconds,
  })
})

Deno.serve(app.fetch)

