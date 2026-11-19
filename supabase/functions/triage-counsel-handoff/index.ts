import { createClient } from "jsr:@supabase/supabase-js@2.49.8"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function env(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function bearerToken(header: string | null) {
  return header?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null
}

async function generateSuggestion(apiKey: string, prompt: string) {
  const result = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text:
              "You triage evidence preservation metadata only. Never invent court facts, filing events, admission events, dates, or record contents. If the supplied metadata does not establish a pathway, return null or unverified. Your output is an unverified suggestion requiring explicit human or counsel acceptance.",
          }],
        },
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  )
  if (!result.ok) throw new Error(`Gemini triage failed (${result.status})`)
  const payload = await result.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim()
  if (!text) throw new Error("Gemini returned no triage suggestion")
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders })
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405)

  const token = bearerToken(request.headers.get("Authorization"))
  if (!token) return response({ error: "Authentication required" }, 401)

  let body: { matterId?: unknown; handoffFileId?: unknown }
  try {
    body = await request.json()
  } catch {
    return response({ error: "A JSON request is required" }, 400)
  }
  const matterId = typeof body.matterId === "string" ? body.matterId : ""
  const handoffFileId = typeof body.handoffFileId === "string" ? body.handoffFileId : ""
  if (!UUID_PATTERN.test(matterId) || !UUID_PATTERN.test(handoffFileId)) {
    return response({ error: "A valid matter and handoff file are required" }, 400)
  }

  try {
    const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: user, error: userError } = await client.auth.getUser(token)
    if (userError || !user.user) throw new Error("Authentication required")

    const { data: member, error: memberError } = await client.rpc("is_matter_member", {
      target_matter_id: matterId,
    })
    if (memberError) throw memberError
    if (!member) return response({ error: "Matter access denied" }, 403)

    const { data: file, error: fileError } = await client
      .from("handoff_files")
      .select("id,matter_id,full_tree_path,file_name,mime_type,priority,preservation_flag")
      .eq("id", handoffFileId)
      .eq("matter_id", matterId)
      .single()
    if (fileError || !file) return response({ error: "Handoff record unavailable" }, 404)

    const { data: pathway, error: pathwayError } = await client
      .from("evidence_pathways")
      .select("clerk_filing_status,proffer_status,admission_status,transmitted_roa_status,pathway_rule")
      .eq("handoff_file_id", handoffFileId)
      .eq("matter_id", matterId)
      .maybeSingle()
    if (pathwayError) throw pathwayError

    const rules = `PATHWAY RULES AND DEFINITIONS:
- Rule 9.200(f): treat as a possible pathway rule only when supplied metadata explicitly identifies it; do not infer compliance.
- Filed With Clerk: only "filed" when the supplied record metadata explicitly says it was filed.
- Offered / Proffered: only "offered" when the supplied metadata explicitly says it was offered or proffered.
- Admitted as Evidence: only "admitted" when the supplied metadata explicitly says it was admitted.
- Included in Transmitted ROA: only "included" when the supplied metadata explicitly says it was included in the transmitted record on appeal.
- Otherwise preserve "unverified" and describe the item as an unverified archive item.`
    const prompt = `${rules}

Selected record metadata:
full_tree_path: ${file.full_tree_path}
file_name: ${file.file_name}
mime_type: ${file.mime_type ?? "unknown"}
current_priority: ${file.priority}
current_preservation_flag: ${file.preservation_flag}
clerk_filing_status: ${pathway?.clerk_filing_status ?? "unverified"}
proffer_status: ${pathway?.proffer_status ?? "unverified"}
admission_status: ${pathway?.admission_status ?? "unverified"}
transmitted_roa_status: ${pathway?.transmitted_roa_status ?? "unverified"}
pathway_rule: ${pathway?.pathway_rule ?? "none"}

Return JSON only:
{
  "pathway_rule": "Rule 9.200(f), another explicitly supplied rule, or null",
  "priority": "low | normal | high | urgent",
  "preservation_flag": true,
  "rationale": "metadata-only explanation; explicitly state what remains unverified"
}`

    const parsed = JSON.parse(await generateSuggestion(env("GEMINI_API_KEY"), prompt)) as {
      pathway_rule?: unknown
      priority?: unknown
      preservation_flag?: unknown
      rationale?: unknown
    }
    const priorities = ["low", "normal", "high", "urgent"] as const
    const priority = priorities.includes(parsed.priority as typeof priorities[number])
      ? parsed.priority as typeof priorities[number]
      : "normal"
    return response({
      pathwayRule: typeof parsed.pathway_rule === "string" ? parsed.pathway_rule : null,
      priority,
      preservationFlag: parsed.preservation_flag === true,
      rationale: typeof parsed.rationale === "string"
        ? parsed.rationale
        : "No definitive pathway is established by the supplied metadata.",
      unverified: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The triage request failed"
    console.error("triage-counsel-handoff failed", message)
    return response({ error: message }, 500)
  }
})
