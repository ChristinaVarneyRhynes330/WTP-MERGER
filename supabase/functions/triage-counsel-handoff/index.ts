import { createClient } from "jsr:@supabase/supabase-js@2.49.8"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN")?.trim() || "*"
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
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

async function generateSuggestion(apiKey: string, model: string, prompt: string) {
  const result = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text:
              "You triage appellate evidence metadata only. Never invent docket numbers, filing dates, transcript citations, court rulings, or record contents. Possession in Drive does not prove filing, proffer, admission, or inclusion in the transmitted ROA. Rule 9.200(f) cannot add evidence never presented below. Every output is an unverified suggestion requiring explicit counsel acceptance.",
          }],
        },
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              suggested_pathway_rule: {
                type: "STRING",
                enum: ["Rule 9.200(f)", "Proffer / Record", "Unverified Source"],
              },
              suggested_priority: {
                type: "STRING",
                enum: ["Urgent / Critical", "High", "Standard", "Low"],
              },
              suggested_preservation_flag: { type: "BOOLEAN" },
              flag_reason: { type: "STRING" },
              recommended_next_step: { type: "STRING" },
              rationale: { type: "STRING" },
              rule_9200_limitation_note: { type: "STRING" },
            },
            required: [
              "suggested_pathway_rule",
              "suggested_priority",
              "suggested_preservation_flag",
              "flag_reason",
              "recommended_next_step",
              "rationale",
              "rule_9200_limitation_note",
            ],
          },
        },
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

  let body: { matterId?: unknown; handoffFileId?: unknown; matter_id?: unknown; handoff_file_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return response({ error: "A JSON request is required" }, 400)
  }
  const matterId =
    typeof body.matterId === "string"
      ? body.matterId
      : typeof body.matter_id === "string"
        ? body.matter_id
        : ""
  const handoffFileId =
    typeof body.handoffFileId === "string"
      ? body.handoffFileId
      : typeof body.handoff_file_id === "string"
        ? body.handoff_file_id
        : ""
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
      .select("id,matter_id,full_tree_path,file_name,mime_type,last_updated,review_status,priority,assigned_to,notes,preservation_flag")
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

Return only structured JSON matching the configured response schema.`

    const model = Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-2.5-flash"
    const parsed = JSON.parse(await generateSuggestion(env("GEMINI_API_KEY"), model, prompt)) as {
      suggested_pathway_rule?: unknown
      suggested_priority?: unknown
      suggested_preservation_flag?: unknown
      flag_reason?: unknown
      recommended_next_step?: unknown
      rationale?: unknown
      rule_9200_limitation_note?: unknown
    }
    const priorityMap: Record<string, "low" | "normal" | "high" | "urgent"> = {
      "Urgent / Critical": "urgent",
      High: "high",
      Standard: "normal",
      Low: "low",
    }
    const suggestedPriority =
      typeof parsed.suggested_priority === "string"
        ? priorityMap[parsed.suggested_priority] ?? "normal"
        : "normal"
    const suggestion = {
      suggested_pathway_rule:
        typeof parsed.suggested_pathway_rule === "string"
          ? parsed.suggested_pathway_rule
          : "Unverified Source",
      suggested_priority:
        typeof parsed.suggested_priority === "string"
          ? parsed.suggested_priority
          : "Standard",
      suggested_preservation_flag: parsed.suggested_preservation_flag === true,
      flag_reason: typeof parsed.flag_reason === "string" ? parsed.flag_reason : "",
      recommended_next_step:
        typeof parsed.recommended_next_step === "string"
          ? parsed.recommended_next_step
          : "Verify the item against the lower-tribunal docket and transmitted ROA.",
      rationale:
        typeof parsed.rationale === "string"
          ? parsed.rationale
          : "No definitive pathway is established by the supplied metadata.",
      rule_9200_limitation_note:
        typeof parsed.rule_9200_limitation_note === "string"
          ? parsed.rule_9200_limitation_note
          : "Rule 9.200(f) cannot be used to insert brand-new evidence never presented below.",
      is_unverified_suggestion: true,
    }
    return response({
      handoff_file_id: handoffFileId,
      matter_id: matterId,
      model,
      suggestion,
      pathwayRule:
        suggestion.suggested_pathway_rule === "Unverified Source"
          ? "Unverified Source"
          : suggestion.suggested_pathway_rule,
      priority: suggestedPriority,
      preservationFlag: suggestion.suggested_preservation_flag,
      rationale: suggestion.rationale,
      unverified: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The triage request failed"
    console.error("triage-counsel-handoff failed", message)
    return response({ error: message }, 500)
  }
})
