import { ArrowRight, FileText, FolderOpen, LockKeyhole, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { BotanicalArt, Monogram } from "../../components/brand"
import { getActiveMatterId } from "../../services/activeMatter"
import { getMatter } from "../../services/matters"
import { createOriginalSignedUrl, listSources, type SourceSummary } from "../../services/sources"
import { verifyOriginalBytes } from "../../lib/integrity"
import { FirstRecordJourney } from "./FirstRecordJourney"
import type { Matter } from "../../types/database"

// This screen reads only the selected, authorized matter. It deliberately does
// not mount AppProvider: that provider contains browser-local fictional demo data.

export function PrivateCaseHome() {
  const matterId = getActiveMatterId()
  const [matter, setMatter] = useState<Matter | null>(null)
  const [sources, setSources] = useState<SourceSummary[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const [matterError, setMatterError] = useState<string | null>(null)
  const [verifyingOriginalId, setVerifyingOriginalId] = useState<string | null>(null)
  const [verification, setVerification] = useState<{ originalId: string; ok: boolean; message: string } | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setMatterError(null)
    setSourceError(null)
    setSelectedSourceId(null)
    setVerification(null)
    if (!matterId) {
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const authorizedMatter = await getMatter(matterId)
        if (!active) return
        setMatter(authorizedMatter)
        try {
          const nextSources = await listSources(matterId)
          if (active) setSources(nextSources)
        } catch {
          if (active) setSourceError("Your source register could not be loaded. No records were changed.")
        }
      } catch {
        if (active) {
          setMatter(null)
          setMatterError("This matter is not available to your signed-in account. Choose another matter to continue.")
        }
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [matterId])

  const selected = sources.find((source) => source.id === selectedSourceId) ?? null
  const firstOriginal = selected?.source_files[0]

  const onPreserved = async (sourceId: string) => {
    if (!matterId) throw new Error("Choose a matter before uploading an original.")
    try {
      const next = await listSources(matterId)
      setSources(next)
      setSourceError(null)
      setSelectedSourceId(sourceId)
      setVerification(null)
    } catch (error) {
      setSourceError("The original was registered, but the source register could not be refreshed. Retry without re-uploading the file.")
      throw error
    }
  }

  const refreshSources = async () => {
    if (!matterId) return
    try {
      const next = await listSources(matterId)
      setSources(next)
      setSourceError(null)
    } catch {
      setSourceError("The source register could not be loaded. Your preserved records were not changed.")
    }
  }

  const verifySavedOriginal = async () => {
    if (!firstOriginal || verifyingOriginalId) return
    setVerification(null)
    setVerifyingOriginalId(firstOriginal.id)
    try {
      const { signedUrl } = await createOriginalSignedUrl(firstOriginal.id)
      const response = await fetch(signedUrl, { cache: "no-store" })
      if (!response.ok) throw new Error("The preserved original could not be retrieved.")
      const originalBytes = await response.arrayBuffer()
      await verifyOriginalBytes(originalBytes, firstOriginal.byte_size, firstOriginal.sha256)
      setVerification({
        originalId: firstOriginal.id,
        ok: true,
        message: "Retrieved bytes match the recorded SHA-256 and file size in this session. This confirms integrity relative to the saved original, not the truth of the source.",
      })
    } catch (error) {
      setVerification({
        originalId: firstOriginal.id,
        ok: false,
        message: error instanceof Error ? error.message : "Original integrity verification could not be completed.",
      })
    } finally {
      setVerifyingOriginalId(null)
    }
  }

  return (
    <div className="private-home">
      <BotanicalArt className="page-art" />
      <div className="private-home__frame">
        <nav className="private-home__rail" aria-label="Private workspace navigation">
          <a className="private-home__brand" href="#/" aria-label="WE THE PARENT website">
            <Monogram size={72} />
            <span>WE THE PARENT</span>
            <small>Case Headquarters</small>
          </a>
          <div className="private-home__case-label">
            <span className="overline">Selected matter</span>
            <strong>{matter?.name ?? "Secure workspace"}</strong>
          </div>
          <a className="private-home__nav-link is-active" href="#/app">Case Overview</a>
          <a className="private-home__nav-link" href="#/signin">Manage matters & originals</a>
          <div className="private-home__rail-bottom">
            <LockKeyhole size={16} aria-hidden="true" />
            Private, matter-authorized records
          </div>
        </nav>

        <main className="private-home__main">
          <header className="private-home__heading">
            <div>
              <span className="overline">Your private case workspace</span>
              <h1>Case Headquarters</h1>
              <p>Your authorized matter and preserved-source register, kept separate from the fictional design demo.</p>
            </div>
            <a className="button button--primary" href="#/signin">Manage matter <ArrowRight size={16} aria-hidden="true" /></a>
          </header>

          {loading ? (
            <div className="private-home__status" role="status">Opening your authorized matter…</div>
          ) : matterError || !matter ? (
            <div className="private-home__status" role="alert">
              <h2>Unable to open this matter</h2>
              <p>{matterError ?? "Select a matter to continue."}</p>
              <a className="button button--primary" href="#/signin">Choose a matter</a>
            </div>
          ) : (
            <>
              <div className="private-home__summary">
                <div className="glass-card">
                  <span className="overline">Active matter</span>
                  <strong>{matter.name}</strong>
                  <p>{matter.jurisdiction || "Jurisdiction not yet recorded"}</p>
                </div>
                <div className="glass-card">
                  <span className="overline">Preserved source records</span>
                  <strong>{sourceError ? "Unavailable" : sources.length}</strong>
                  <p>Original integrity is distinct from whether a statement is true.</p>
                </div>
                <div className="glass-card">
                  <span className="overline">Access</span>
                  <strong>Private</strong>
                  <p>Only records returned through authorized matter-scoped services appear here.</p>
                </div>
              </div>

              <FirstRecordJourney
                matter={matter}
                sources={sources}
                sourceRegisterAvailable={!sourceError}
                verifiedOriginalId={verification?.ok ? verification.originalId : null}
                onPreserved={onPreserved}
                onInspect={(sourceId) => {
                  setSelectedSourceId(sourceId)
                  setVerification(null)
                }}
              />

              <section className="private-home__records" aria-labelledby="private-source-list">
                <div className="private-home__section-heading">
                  <div>
                    <span className="overline">Evidence</span>
                    <h2 id="private-source-list">Source register</h2>
                  </div>
                  <button className="button" type="button" onClick={() => void refreshSources()}><RefreshCw size={15} aria-hidden="true" /> Refresh register</button>
                </div>
                {sourceError && <p className="private-home__feedback" role="alert">{sourceError}</p>}
                {!sourceError && sources.length === 0 && (
                  <div className="private-home__empty">
                    <FolderOpen size={24} aria-hidden="true" />
                    <p>No preserved source records are registered for this matter yet.</p>
                    <p>Use harmless fictional data while the pilot security gates remain open.</p>
                  </div>
                )}
                {!sourceError && sources.length > 0 && (
                  <div className="private-home__source-list">
                    {sources.slice(0, 30).map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        className={`private-home__source-row ${selectedSourceId === source.id ? "is-selected" : ""}`}
                        onClick={() => { setSelectedSourceId(source.id); setVerification(null) }}
                        aria-pressed={selectedSourceId === source.id}
                      >
                        <FileText size={18} aria-hidden="true" />
                        <span><strong>{source.title}</strong><small>{source.source_type} · {source.confirmation_state.replace(/_/g, " ")}</small></span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        <aside className="private-home__inspector" aria-label="Source context">
          <div className="private-home__inspector-header">
            <span className="overline">Source context</span>
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          {selected ? (
            <div className="private-home__source-detail">
              <h2>{selected.title}</h2>
              <dl>
                <dt>Record status</dt><dd>{selected.confirmation_state.replace(/_/g, " ")}</dd>
                <dt>Original file</dt><dd>{firstOriginal?.original_name ?? "No preserved original registered"}</dd>
                <dt>Date on source (not an inferred event date)</dt><dd>{selected.source_date ?? "Not recorded"}</dd>
                <dt>Record received</dt><dd>{selected.received_at ?? "Not recorded"}</dd>
                <dt>Added to register</dt><dd>{selected.created_at ? new Date(selected.created_at).toLocaleString() : "Not recorded"}</dd>
                <dt>Original fingerprint</dt><dd className="private-home__hash">{firstOriginal?.sha256 ? `${firstOriginal.sha256.slice(0, 24)}…` : "Not available"}</dd>
              </dl>
              <p>The saved checksum is metadata until the original bytes are retrieved and compared. It does not verify the truth of any statement.</p>
              {firstOriginal ? (
                <button className="button private-home__verify-button" type="button" disabled={Boolean(verifyingOriginalId)} onClick={() => void verifySavedOriginal()}>
                  <ShieldCheck size={16} aria-hidden="true" />
                  {verifyingOriginalId === firstOriginal.id ? "Checking saved original…" : "Verify retrieved original bytes"}
                </button>
              ) : <p className="private-home__feedback">No preserved original is registered for this source.</p>}
              {verification && verification.originalId === firstOriginal?.id && (
                <p className={`private-home__verification ${verification.ok ? "is-verified" : "is-error"}`} role={verification.ok ? "status" : "alert"}>
                  {verification.ok ? <CheckCircle2 size={17} aria-hidden="true" /> : <AlertCircle size={17} aria-hidden="true" />}
                  <span>{verification.message}</span>
                </p>
              )}
              <p>Further extraction and factual review have not been confirmed by this screen.</p>
            </div>
          ) : (
            <div className="private-home__source-placeholder">
              <FileText size={26} aria-hidden="true" />
              <h2>Source Viewer</h2>
              <p>Choose a source from the register to inspect its recorded metadata. Original-file viewing requires a separately verified retrieval workflow.</p>
            </div>
          )}
          <a className="private-home__inspector-return" href="#/signin">Matter controls <ArrowRight size={14} aria-hidden="true" /></a>
        </aside>
      </div>
    </div>
  )
}
