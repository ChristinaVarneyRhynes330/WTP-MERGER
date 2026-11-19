import { createClient } from "jsr:@supabase/supabase-js@2.49.8"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function env(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function bearerToken(header: string | null) {
  const match = header?.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

async function embedQuestion(apiKey: string, question: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: question }] },
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: 768,
      }),
    },
  )
  if (!response.ok) throw new Error(`Question embedding failed (${response.status})`)
  const result = await response.json() as { embedding?: { values?: number[] } }
  const values = result.embedding?.values
  if (!values || values.length !== 768) {
    throw new Error("Question embedding was invalid")
  }
  return values
}

async function generateInsight(apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: "You are a source-grounded case analyst. Give no legal advice or outcome predictions. Distinguish allegations, observations, recollections, professional opinions, inferences, and court findings. Never present an inference or missing fact as confirmed. Discrepancy does not establish falsehood.",
          }],
        },
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  )
  if (!response.ok) throw new Error(`Gemini analysis failed (${response.status})`)
  const result = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim()
  if (!text) throw new Error("Gemini returned no analysis")
  return text
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const token = bearerToken(request.headers.get("Authorization"))
  if (!token) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  let body: { matterId?: unknown; question?: unknown }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "A JSON request is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  const matterId = typeof body.matterId === "string" ? body.matterId : ""
  const question = typeof body.question === "string" ? body.question.trim() : ""
  if (!UUID_PATTERN.test(matterId) || question.length < 1 || question.length > 4000) {
    return new Response(JSON.stringify({ error: "A valid matter and question are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const url = env("SUPABASE_URL")
    const anonKey = env("SUPABASE_ANON_KEY")
    const apiKey = env("GEMINI_API_KEY")
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: authData, error: authError } = await client.auth.getUser(token)
    if (authError || !authData.user) throw new Error("Authentication required")

    const { data: membership } = await client.rpc("is_matter_member", {
      target_matter_id: matterId,
    })
    if (!membership) {
      return new Response(JSON.stringify({ error: "Matter access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: matter, error: matterError } = await client
      .from("matters")
      .select("representation,counsel_name")
      .eq("id", matterId)
      .single()
    if (matterError || !matter) throw new Error("Matter could not be loaded")

    const queryEmbedding = await embedQuestion(apiKey, question)
    const { data: chunks, error: chunksError } = await client.rpc(
      "match_source_chunks",
      {
        query_embedding: queryEmbedding,
        target_matter_id: matterId,
        match_threshold: 0.35,
        match_count: 5,
      },
    )
    if (chunksError) throw new Error("Relevant source chunks could not be retrieved")

    const retrieved = (chunks ?? []) as Array<{
      id: string
      source_id: string
      derivative_id: string | null
      page_number: number | null
      chunk_index: number
      content: string
      similarity: number
    }>
    if (retrieved.length === 0) {
      return new Response(JSON.stringify({
        answer: "No sufficiently relevant evidence was found for this question.",
        verifiedFacts: [],
        unverifiedOrMissing: ["A relevant source record or extraction is unavailable."],
        uncertainty: ["The answer cannot be grounded in the current matter records."],
        citations: [],
        suggestedAction: "Upload or verify a relevant source before drawing conclusions.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const representationVoice =
      matter.representation === "represented_by_counsel"
        ? `Represented by counsel${matter.counsel_name ? ` (${matter.counsel_name})` : ""}. Frame information for attorney review.`
        : matter.representation === "self_represented"
          ? "Self-represented. Use plain language and remind the user to verify court procedure with the clerk or a qualified legal self-help resource."
          : "Representation status is not confirmed. Use neutral plain language and do not give legal advice."

    const evidence = retrieved.map((chunk, index) =>
      `[CHUNK ${index + 1}] source_id=${chunk.source_id}; page=${chunk.page_number ?? "unknown"}\n${chunk.content}`
    ).join("\n\n")
    const prompt = `Matter voice: ${representationVoice}

Question:
${question}

Evidence chunks:
${evidence}

Return JSON only with this exact schema:
{
  "answer": "plain-language grounded answer",
  "verified_facts": ["only facts directly supported by the evidence"],
  "unverified_or_missing": ["missing or unsupported information"],
  "uncertainty": ["limits or competing interpretations"],
  "citations": [
    {
      "source_id": "exact source_id",
      "page_number": 1,
      "excerpt": "verbatim excerpt from the cited evidence chunk"
    }
  ],
  "suggested_action": "optional concrete next step or null"
}

Use only the evidence above. Every citation excerpt must be copied exactly from an evidence chunk. Do not add record facts not present in the evidence.`

    const raw = await generateInsight(apiKey, prompt)
    let parsed: {
      answer?: unknown
      verified_facts?: unknown
      unverified_or_missing?: unknown
      uncertainty?: unknown
      citations?: unknown
      suggested_action?: unknown
    }
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""))
    } catch {
      throw new Error("The analysis response could not be parsed")
    }

    const stringArray = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string").slice(0, 20)
        : []
    const verifiedCitation = (citation: unknown) => {
      if (!citation || typeof citation !== "object") return null
      const candidate = citation as {
        source_id?: unknown
        page_number?: unknown
        excerpt?: unknown
      }
      if (typeof candidate.source_id !== "string" ||
          typeof candidate.excerpt !== "string") return null
      const chunk = retrieved.find((item) =>
        item.source_id === candidate.source_id &&
        item.content.includes(candidate.excerpt)
      )
      if (!chunk) return null
      const pageNumber =
        typeof candidate.page_number === "number" && candidate.page_number > 0
          ? candidate.page_number
          : chunk.page_number
      return {
        sourceId: chunk.source_id,
        pageNumber,
        excerpt: candidate.excerpt,
        passageId: `source-${chunk.source_id}-p-${pageNumber ?? "unknown"}`,
        label: `Source ${chunk.source_id.slice(0, 8)} · ${pageNumber ? `p. ${pageNumber}` : "page unknown"}`,
      }
    }
    const citations = (Array.isArray(parsed.citations) ? parsed.citations : [])
      .map(verifiedCitation)
      .filter((citation): citation is NonNullable<typeof citation> => citation !== null)
      .slice(0, 5)

    const insight = {
      answer: typeof parsed.answer === "string"
        ? parsed.answer
        : "No grounded answer could be formed from the retrieved evidence.",
      verifiedFacts: stringArray(parsed.verified_facts),
      unverifiedOrMissing: stringArray(parsed.unverified_or_missing),
      uncertainty: stringArray(parsed.uncertainty),
      citations,
      suggestedAction:
        typeof parsed.suggested_action === "string"
          ? parsed.suggested_action
          : null,
    }
    return new Response(JSON.stringify(insight), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The AI request failed"
    console.error("ask-assistant failed", message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
