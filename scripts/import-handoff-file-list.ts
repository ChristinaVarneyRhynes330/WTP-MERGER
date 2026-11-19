import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

type RawRow = Record<string, string>

type ImportRow = {
  driveFileId: string
  fullTreePath: string
  fileName: string
  fileUrl: string | null
  mimeType: string | null
  lastUpdated: string | null
  reviewStatus: "unverified" | "in_review" | "verified" | "archived"
  priority: "low" | "normal" | "high" | "urgent"
  assignedTo: string | null
  notes: string | null
  preservationFlag: boolean
  pathwayRule: string | null
  clerkFilingStatus: "unknown" | "filed" | "not_filed" | "unverified"
  profferStatus: "unknown" | "offered" | "not_offered" | "unverified"
  admissionStatus: "unknown" | "admitted" | "not_admitted" | "unverified"
  transmittedRoaStatus: "unknown" | "included" | "not_included" | "unverified"
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ""
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
const matterId = process.env.HANDOFF_MATTER_ID ?? ""
const createdBy = process.env.HANDOFF_CREATED_BY ?? ""
const batchSize = Number(process.env.IMPORT_BATCH_SIZE ?? "100")

if (!supabaseUrl || !serviceRoleKey || !matterId || !createdBy) {
  console.error(
    "Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HANDOFF_MATTER_ID, HANDOFF_CREATED_BY",
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function value(row: RawRow, ...keys: string[]) {
  for (const key of keys) {
    const result = row[key]?.trim()
    if (result) return result
  }
  return ""
}

function parseCsv(input: string): RawRow[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]
    const next = input[index + 1]
    if (quoted) {
      if (character === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        cell += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ",") {
      row.push(cell.trim())
      cell = ""
    } else if (character === "\r" && next === "\n") {
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ""
      index += 1
    } else if (character === "\n" || character === "\r") {
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ""
    } else {
      cell += character
    }
  }
  if (cell || row.length) {
    row.push(cell.trim())
    rows.push(row)
  }
  if (rows.length < 2) return []

  const headers = rows[0].map((header) =>
    header.replace(/^\uFEFF/, "").trim(),
  )
  return rows.slice(1).flatMap((cells) => {
    if (cells.every((item) => !item)) return []
    return [
      Object.fromEntries(
        headers.map((header, index) => [header, cells[index] ?? ""]),
      ),
    ]
  })
}

function driveId(row: RawRow, fullTreePath: string, fileName: string) {
  const explicit = value(row, "Drive File ID", "File ID")
  if (explicit) return explicit
  const url = value(row, "File URL", "Drive URL")
  const fromUrl =
    url.match(/\/d\/([^/]+)/)?.[1] ??
    url.match(/[?&]id=([^&]+)/)?.[1]
  if (fromUrl) return fromUrl
  const key = `${matterId}::${fullTreePath.toLowerCase()}::${fileName.toLowerCase()}`
  return `import:${crypto.createHash("sha256").update(key).digest("hex")}`
}

function dateValue(raw: string) {
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function statusValue(
  raw: string,
  allowed: string[],
): string {
  const normalized = raw.toLowerCase().replace(/[\s/-]+/g, "_")
  if (normalized.includes("not_verified") || normalized === "unverified") {
    return "unverified"
  }
  return allowed.includes(normalized) ? normalized : "unknown"
}

function normalizeRows(rows: RawRow[]) {
  const deduped = new Map<string, ImportRow>()
  for (const row of rows) {
    const fullTreePath = value(row, "Full Tree Path", "Path")
    const fileName = value(row, "File Name", "Name") || fullTreePath.split(/[\\/]/).pop()
    if (!fileName) continue

    const review = value(row, "Review Status").toLowerCase()
    const priority = value(row, "Priority").toLowerCase()
    const candidate: ImportRow = {
      driveFileId: driveId(row, fullTreePath || fileName, fileName),
      fullTreePath: fullTreePath || fileName,
      fileName,
      fileUrl: value(row, "File URL", "Drive URL") || null,
      mimeType: value(row, "MIME Type", "Mime Type") || null,
      lastUpdated: dateValue(value(row, "Last Updated")),
      reviewStatus: review === "verified"
        ? "verified"
        : review === "archived"
          ? "archived"
          : review === "in_review" || review === "in review"
            ? "in_review"
            : "unverified",
      priority: ["low", "normal", "high", "urgent"].includes(priority)
        ? priority as ImportRow["priority"]
        : "normal",
      assignedTo: /^[0-9a-f-]{36}$/i.test(value(row, "Assigned To"))
        ? value(row, "Assigned To")
        : null,
      notes: value(row, "Action / Relevance Notes", "Notes") || null,
      preservationFlag: /^(true|yes|flagged|red flag)$/i.test(
        value(row, "Preservation Flag"),
      ),
      pathwayRule: value(row, "Pathway Rule", "Rule") || "Unverified Source",
      clerkFilingStatus: statusValue(
        value(row, "Filed With Clerk?", "Filed With Clerk"),
        ["filed", "not_filed"],
      ) as ImportRow["clerkFilingStatus"],
      profferStatus: statusValue(
        value(row, "Offered / Proffered?", "Offered / Proffered"),
        ["offered", "not_offered"],
      ) as ImportRow["profferStatus"],
      admissionStatus: statusValue(
        value(row, "Admitted as Evidence?", "Admitted"),
        ["admitted", "not_admitted"],
      ) as ImportRow["admissionStatus"],
      transmittedRoaStatus: statusValue(
        value(row, "Included in Transmitted ROA?", "Included in ROA"),
        ["included", "not_included"],
      ) as ImportRow["transmittedRoaStatus"],
    }
    const existing = deduped.get(candidate.driveFileId)
    if (!existing || (candidate.notes?.length ?? 0) > (existing.notes?.length ?? 0)) {
      deduped.set(candidate.driveFileId, candidate)
    }
  }
  return [...deduped.values()]
}

async function importRows(rows: ImportRow[]) {
  const { data: existing, error: existingError } = await supabase
    .from("handoff_files")
    .select("id,drive_file_id")
    .eq("matter_id", matterId)
  if (existingError) throw existingError
  const existingByDriveId = new Map(
    (existing ?? []).map((item) => [item.drive_file_id, item.id]),
  )

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize)
    const newRows = batch.filter((row) => !existingByDriveId.has(row.driveFileId))
    const existingRows = batch.filter((row) => existingByDriveId.has(row.driveFileId))

    if (newRows.length) {
      const { data: inserted, error: insertError } = await supabase
        .from("handoff_files")
        .insert(
          newRows.map((row) => ({
            matter_id: matterId,
            drive_file_id: row.driveFileId,
            full_tree_path: row.fullTreePath,
            file_name: row.fileName,
            file_url: row.fileUrl,
            mime_type: row.mimeType,
            last_updated: row.lastUpdated,
            review_status: row.reviewStatus,
            priority: row.priority,
            assigned_to: row.assignedTo,
            notes: row.notes,
            preservation_flag: row.preservationFlag,
            created_by: createdBy,
          })),
        )
        .select("id,drive_file_id")
      if (insertError) throw insertError

      const insertedByDriveId = new Map(
        (inserted ?? []).map((item) => [item.drive_file_id, item.id]),
      )
      const pathways = newRows.flatMap((row) => {
        const id = insertedByDriveId.get(row.driveFileId)
        return id
          ? [{
              matter_id: matterId,
              handoff_file_id: id,
              clerk_filing_status: row.clerkFilingStatus,
              proffer_status: row.profferStatus,
              admission_status: row.admissionStatus,
              transmitted_roa_status: row.transmittedRoaStatus,
              pathway_rule: row.pathwayRule,
              created_by: createdBy,
            }]
          : []
      })
      if (pathways.length) {
        const { error: pathwayError } = await supabase
          .from("evidence_pathways")
          .insert(pathways)
        if (pathwayError) throw pathwayError
      }
    }

    for (const row of existingRows) {
      const id = existingByDriveId.get(row.driveFileId)
      if (!id) continue
      const { error } = await supabase
        .from("handoff_files")
        .update({
          full_tree_path: row.fullTreePath,
          file_name: row.fileName,
          file_url: row.fileUrl,
          mime_type: row.mimeType,
          last_updated: row.lastUpdated,
        })
        .eq("id", id)
        .eq("matter_id", matterId)
      if (error) throw error
    }
    console.log(`Processed ${Math.min(start + batchSize, rows.length)} / ${rows.length}`)
  }
}

const input = process.argv[2]
if (!input) {
  console.error("Usage: npm run import:handoff -- <file-list.csv|file-list.json>")
  process.exit(1)
}

const inputPath = path.resolve(input)
if (!fs.existsSync(inputPath)) throw new Error(`Input file not found: ${inputPath}`)
const raw = fs.readFileSync(inputPath, "utf8")
const rows = inputPath.toLowerCase().endsWith(".json")
  ? JSON.parse(raw) as RawRow[]
  : parseCsv(raw)
const normalized = normalizeRows(rows)
console.log(`Parsed ${rows.length} rows into ${normalized.length} unique records.`)
await importRows(normalized)
console.log("Handoff import completed without overwriting existing counsel review fields.")
