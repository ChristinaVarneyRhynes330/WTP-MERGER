import { createClient } from "jsr:@supabase/supabase-js@2.49.8"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function required(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function adminClient() {
  return createClient(
    required("SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function authorizationMatchesServiceRole(header: string | undefined) {
  const match = header?.match(/^Bearer\s+(.+)$/i)
  return Boolean(match?.[1] && match[1] === required("SUPABASE_SERVICE_ROLE_KEY"))
}

async function geminiGenerate(
  apiKey: string,
  model: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
  if (!response.ok) {
    throw new Error(`Gemini ${model} request failed (${response.status})`)
  }
  return await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }
}

function extractedText(result: Awaited<ReturnType<typeof geminiGenerate>>) {
  const text = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim()
  if (!text) throw new Error("Gemini returned no extracted text")

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
  try {
    const parsed = JSON.parse(cleaned) as {
      pages?: Array<{ page?: unknown; text?: unknown }>
    }
    if (Array.isArray(parsed.pages)) {
      return parsed.pages
        .filter((page) => typeof page.text === "string")
        .map((page) => ({
          pageNumber:
            typeof page.page === "number" && page.page > 0
              ? page.page
              : null,
          text: (page.text as string).trim(),
        }))
        .filter((page) => page.text.length > 0)
    }
  } catch {
    // Plain text responses are accepted as a one-page fallback.
  }
  return [{ pageNumber: null, text }]
}

function chunksForPages(
  pages: Array<{ pageNumber: number | null; text: string }>,
) {
  const chunks: Array<{ pageNumber: number | null; text: string }> = []
  for (const page of pages) {
    const paragraphs = page.text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
    for (const paragraph of paragraphs.length ? paragraphs : [page.text]) {
      if (paragraph.length <= 1800) {
        chunks.push({ pageNumber: page.pageNumber, text: paragraph })
        continue
      }
      for (let index = 0; index < paragraph.length; index += 1800) {
        const chunk = paragraph.slice(index, index + 1800).trim()
        if (chunk) chunks.push({ pageNumber: page.pageNumber, text: chunk })
      }
    }
  }
  return chunks
}

async function geminiEmbedding(apiKey: string, text: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768,
      }),
    },
  )
  if (!response.ok) {
    throw new Error(`Gemini embedding request failed (${response.status})`)
  }
  const result = await response.json() as {
    embedding?: { values?: number[] }
  }
  const values = result.embedding?.values
  if (!values || values.length !== 768) {
    throw new Error("Gemini returned an invalid 768-dimension embedding")
  }
  return values
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }
  if (!authorizationMatchesServiceRole(request.headers.get("Authorization"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: { sourceId?: unknown; matterId?: unknown; sourceFileId?: unknown }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "A JSON request is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const sourceId = typeof body.sourceId === "string" ? body.sourceId : ""
  const matterId = typeof body.matterId === "string" ? body.matterId : ""
  const sourceFileId =
    typeof body.sourceFileId === "string" ? body.sourceFileId : ""
  if (
    !UUID_PATTERN.test(sourceId)
    || !UUID_PATTERN.test(matterId)
    || !UUID_PATTERN.test(sourceFileId)
  ) {
    return new Response(JSON.stringify({ error: "Invalid ingestion payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const admin = adminClient()
  const geminiKey = required("GEMINI_API_KEY")

  const { data: job, error: jobError } = await admin
    .from("processing_jobs")
    .select("id, attempt_count")
    .eq("matter_id", matterId)
    .eq("source_id", sourceId)
    .eq("job_type", "ocr_embeddings")
    .in("status", ["queued", "failed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (jobError || !job) {
    return new Response(JSON.stringify({ error: "Could not find processing job" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { error: runningError } = await admin
    .from("processing_jobs")
    .update({
      status: "running",
      attempt_count: (job.attempt_count ?? 0) + 1,
      process_version: "gemini-2.5-flash-text-embedding-004",
      started_at: new Date().toISOString(),
      error_code: null,
      error_message: null,
    })
    .eq("id", job.id)
  if (runningError) {
    return new Response(JSON.stringify({ error: "Could not start processing job" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { data: sourceFile, error: sourceFileError } = await admin
      .from("source_files")
      .select("id, object_path, original_name, media_type")
      .eq("id", sourceFileId)
      .eq("source_id", sourceId)
      .eq("matter_id", matterId)
      .single()
    if (sourceFileError || !sourceFile) {
      throw new Error("Source file not found")
    }

    const { data: downloaded, error: downloadError } = await admin.storage
      .from("matter-originals")
      .download(sourceFile.object_path)
    if (downloadError || !downloaded) {
      throw new Error("Original could not be downloaded")
    }

    const fileBuffer = await downloaded.arrayBuffer()
    if (fileBuffer.byteLength === 0) {
      throw new Error("Original is empty")
    }
    const bytes = new Uint8Array(fileBuffer)
    let binary = ""
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
    }
    const base64 = btoa(binary)

    const extracted = await geminiGenerate(
      geminiKey,
      "gemini-2.5-flash",
      {
        systemInstruction: {
          parts: [{
            text: "Preserve exact visible wording and page breaks. Do not summarize or interpret. Return only JSON.",
          }],
        },
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
        contents: [{
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: sourceFile.media_type || "application/octet-stream",
                data: base64,
              },
            },
            {
              text: "Extract all readable text. Return JSON as {\"pages\":[{\"page\":1,\"text\":\"...\"}]}.",
            },
          ],
        }],
      },
    )
    const pages = extractedText(extracted)

    const { data: derivative, error: derivativeError } = await admin
      .from("derivatives")
      .insert({
        matter_id: matterId,
        source_id: sourceId,
        source_file_id: sourceFileId,
        derivative_type: "ocr",
        body: pages.map((page) =>
          page.pageNumber ? `--- Page ${page.pageNumber} ---\n${page.text}` : page.text
        ).join("\n\n"),
        process_name: "Gemini OCR",
        process_version: "gemini-2.5-flash",
        content_type: "original_source",
        confirmation_state: "ai_suggested",
      })
      .select("id")
      .single()
    if (derivativeError || !derivative) {
      throw new Error("OCR derivative could not be saved")
    }

    await admin
      .from("source_chunks")
      .delete()
      .eq("matter_id", matterId)
      .eq("source_id", sourceId)

    const chunkRows = []
    for (const [chunkIndex, chunk] of chunksForPages(pages).entries()) {
      const embedding = await geminiEmbedding(geminiKey, chunk.text)
      chunkRows.push({
        matter_id: matterId,
        source_id: sourceId,
        derivative_id: derivative.id,
        page_number: chunk.pageNumber,
        chunk_index: chunkIndex,
        content: chunk.text,
        embedding,
      })
    }
    if (chunkRows.length === 0) {
      throw new Error("No text chunks could be created")
    }

    const { error: chunksError } = await admin
      .from("source_chunks")
      .insert(chunkRows)
    if (chunksError) throw new Error("Source chunks could not be saved")

    await admin
      .from("processing_jobs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
      })
      .eq("id", job.id)

    await admin
      .from("sources")
      .update({ confirmation_state: "ai_suggested" })
      .eq("id", sourceId)
      .eq("matter_id", matterId)

    return new Response(
      JSON.stringify({ status: "succeeded", chunkCount: chunkRows.length }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error"
    await admin
      .from("processing_jobs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_code: "INGESTION_FAILED",
        error_message: message.slice(0, 2000),
      })
      .eq("id", job.id)

    console.error("ingest-source failed", message)
    return new Response(
      JSON.stringify({ status: "failed", error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
