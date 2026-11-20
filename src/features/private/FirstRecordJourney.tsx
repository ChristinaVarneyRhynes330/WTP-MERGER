import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileCheck2,
  FilePlus2,
  Info,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react"
import { useState, type ChangeEvent, type FormEvent } from "react"
import { uploadOriginalSource, type SourceSummary } from "../../services/sources"
import type { Matter } from "../../types/database"

type FirstRecordJourneyProps = {
  matter: Matter
  sources: SourceSummary[]
  sourceRegisterAvailable: boolean
  verifiedOriginalId: string | null
  onPreserved: (sourceId: string) => Promise<void>
  onInspect: (sourceId: string) => void
}

type Step = { label: string; detail: string; status: "recorded" | "pending" | "available" | "future" }

const MAX_PILOT_BYTES = 64 * 1024

/** Steps reflect observed backend records or completed checks, never page visits. */
function journeySteps(
  matter: Matter,
  sources: SourceSummary[],
  registerAvailable: boolean,
  verifiedOriginalId: string | null,
): Step[] {
  const saved = sources.find((source) => source.source_files.some((file) => Boolean(file.id)))
  const registeredOriginal = saved?.source_files.find((file) => Boolean(file.id)) ?? null
  const verified = Boolean(verifiedOriginalId && sources.some((source) => source.source_files.some((file) => file.id === verifiedOriginalId)))
  const sourceState = saved?.confirmation_state ?? "unverified"

  return [
    { label: "Create or select a matter", detail: matter.name, status: "recorded" },
    {
      label: "Add a test record",
      detail: !registerAvailable ? "Source register unavailable" : saved ? "Source registered" : "Choose a fictional .txt file",
      status: !registerAvailable ? "pending" : saved ? "recorded" : "available",
    },
    {
      label: "Preserve the original",
      detail: registeredOriginal?.sha256 ? "Stored checksum recorded; retrieve to verify bytes" : "Original + checksum not yet registered",
      status: registeredOriginal?.sha256 ? "recorded" : "pending",
    },
    {
      label: "Process",
      detail: "Extraction completion is not connected to this view",
      status: "future",
    },
    {
      label: "Review what we found",
      detail: !saved ? "Add a record first" : sourceState === "user_confirmed" ? "Record labeled user-confirmed; claims are not independently proven" : "Metadata and dates still need review",
      status: saved ? "available" : "pending",
    },
    {
      label: "Source-check",
      detail: verified ? "Retrieved bytes matched the saved SHA-256 in this session" : "Retrieve and compare the preserved file",
      status: verified ? "recorded" : saved ? "available" : "pending",
    },
    { label: "Organize", detail: "Private timeline integration not yet enabled", status: "future" },
    { label: "Ask", detail: "Private source-grounded conversation not yet enabled", status: "future" },
    { label: "Learn in context", detail: "Fictional lessons available separately", status: "future" },
    { label: "Prepare", detail: "Private linked tasks not yet enabled", status: "future" },
  ]
}

export function FirstRecordJourney({
  matter,
  sources,
  sourceRegisterAvailable,
  verifiedOriginalId,
  onPreserved,
  onInspect,
}: FirstRecordJourneyProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [documentDate, setDocumentDate] = useState("")
  const [pilotConfirmed, setPilotConfirmed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)
  const [inputVersion, setInputVersion] = useState(0)

  // UI guard only: real authorization still lives in Supabase/RLS.
  // Keep fictional pilot artifacts out of existing real matter workspaces.
  const fictionalMatter = /^(fictional|demo|test)(?:[\\s:_-]|$)/i.test(matter.name.trim())
  const steps = journeySteps(matter, sources, sourceRegisterAvailable, verifiedOriginalId)
  const hasRegisteredOriginal = sources.some((source) => source.source_files.some((original) => Boolean(original.id)))
  const firstSource = sources.find((source) => source.source_files.some((original) => Boolean(original.id)))

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null
    setFile(next)
    setUploadError(null)
    setOutcome(null)
    if (next) setTitle(next.name.replace(/\.txt$/i, "").slice(0, 200))
  }

  const preserve = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (uploading) return
    setUploadError(null)
    setOutcome(null)

    if (!sourceRegisterAvailable) {
      setUploadError("The source register is unavailable. No file was sent.")
      return
    }
    if (!fictionalMatter) {
      setUploadError("Create or select a separately labeled fictional matter before uploading test records.")
      return
    }
    if (!pilotConfirmed) {
      setUploadError("Confirm that this is harmless fictional test material before continuing.")
      return
    }
    if (!file || !/\.txt$/i.test(file.name) || !file.size || file.size > MAX_PILOT_BYTES) {
      setUploadError("Choose a nonempty fictional .txt file no larger than 64 KiB.")
      return
    }
    if (!title.trim() || title.trim().length > 200) {
      setUploadError("Enter a source title between 1 and 200 characters.")
      return
    }

    setUploading(true)
    try {
      const result = await uploadOriginalSource({
        matterId: matter.id,
        title: title.trim(),
        sourceType: "document",
        origin: "Fictional pilot test",
        sourceDate: documentDate || undefined,
        file,
      })

      if (!result.original.preserved || !result.original.sha256) {
        throw new Error("The preservation service did not confirm a stored checksum.")
      }
      setOutcome(
        `Server registered ${result.original.originalName} with a stored SHA-256 fingerprint. ` +
        "The retrieved bytes have not yet been rechecked. Extraction completion is not confirmed.",
      )
      setFile(null)
      setTitle("")
      setDocumentDate("")
      setPilotConfirmed(false)
      setInputVersion((current) => current + 1)

      // A successful server write is not undone if refreshing the list later fails.
      try {
        await onPreserved(result.source.id)
      } catch {
        setUploadError("The original was registered, but the list could not be refreshed. Reload the source register before continuing.")
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The original could not be registered.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="private-first-record" aria-labelledby="first-record-title">
      <div className="private-home__section-heading">
        <div>
          <span className="overline">A guided beginning</span>
          <h2 id="first-record-title">Start with what you have.</h2>
          <p>Follow the first-record journey. Steps change only when an underlying operation or check actually succeeds.</p>
        </div>
        <span className="private-first-record__scope"><ShieldAlert size={15} aria-hidden="true" /> Fictional test files only</span>
      </div>

      <ol className="private-first-record__steps" aria-label="Parent first-record journey">
        {steps.map((step, index) => (
          <li className={`private-first-record__step private-first-record__step--${step.status}`} key={step.label}>
            <span className="private-first-record__index" aria-hidden="true">
              {step.status === "recorded" ? <CheckCircle2 size={18} /> : step.status === "future" ? <CircleDashed size={18} /> : String(index + 1).padStart(2, "0")}
            </span>
            <span className="private-first-record__step-copy"><strong>{step.label}</strong><small>{step.detail}</small></span>
          </li>
        ))}
      </ol>

      <div className="private-first-record__actions">
        <details className="private-first-record__intake" open={!hasRegisteredOriginal}>
          <summary><FilePlus2 size={18} aria-hidden="true" /> Preserve a fictional test original <ArrowRight size={16} aria-hidden="true" /></summary>
          <div className="private-first-record__intake-body">
            <p>This staging flow preserves an original inside the selected authorized matter. Do not upload confidential or real family records while the security gates remain open.</p>
            {!fictionalMatter && (
              <p className="private-first-record__feedback private-first-record__feedback--error" role="status">
                This matter is not labeled as a fictional test matter. To avoid mixing demonstration material with actual case work, create a separate matter named "Fictional Test Matter" from the matter controls before using this uploader.
                {" "}<a href="#/signin">Open matter controls</a>
              </p>
            )}
            <form onSubmit={(event) => void preserve(event)}>
              <label>
                Harmless fictional text file
                <input key={inputVersion} type="file" accept=".txt,text/plain" disabled={uploading || !fictionalMatter} onChange={chooseFile} />
              </label>
              <label>
                Source title
                <input value={title} maxLength={200} disabled={uploading || !fictionalMatter} placeholder="e.g. Fictional appointment note" onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label>
                Date written on document (optional, not the event date)
                <input type="date" value={documentDate} disabled={uploading || !fictionalMatter} onChange={(event) => setDocumentDate(event.target.value)} />
              </label>
              <label className="private-first-record__confirm">
                <input type="checkbox" checked={pilotConfirmed} disabled={uploading || !fictionalMatter} onChange={(event) => setPilotConfirmed(event.target.checked)} />
                <span>This file contains only harmless fictional test information and no confidential case data.</span>
              </label>
              <button type="submit" className="button button--primary" disabled={uploading || !sourceRegisterAvailable || !fictionalMatter || !file || !title.trim()}>
                {uploading ? <LoaderCircle size={16} aria-hidden="true" /> : <FilePlus2 size={16} aria-hidden="true" />}
                {uploading ? "Registering original…" : "Preserve test original"}
              </button>
            </form>
            <p className="private-first-record__fine-print"><Info size={14} aria-hidden="true" /> Date fields remain separate. A file checksum establishes integrity relative to the saved copy, not the truth of its contents.</p>
          </div>
        </details>
        {firstSource && (
          <button className="private-first-record__review-link" type="button" onClick={() => onInspect(firstSource.id)}>
            <FileCheck2 size={18} aria-hidden="true" />
            Inspect an existing record and check its original
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {outcome && <p className="private-first-record__feedback" role="status">{outcome}</p>}
      {uploadError && <p className="private-first-record__feedback private-first-record__feedback--error" role="alert">{uploadError}</p>}
    </section>
  )
}
