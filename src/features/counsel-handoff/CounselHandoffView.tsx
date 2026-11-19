import { AlertTriangle, Check, FileText, LockKeyhole, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button, EmptyState, ReadingSurface } from "../../components/ui"
import {
  COUNSEL_HANDOFF_CASE_NUMBER,
  COUNSEL_HANDOFF_LOWER_TRIBUNAL,
  loadCounselHandoff,
  type CounselHandoffData,
} from "../../services/counselHandoff"

const pathwayLabels = [
  ["clerk_filing_status", "Filed With Clerk?"],
  ["proffer_status", "Offered / Proffered?"],
  ["admission_status", "Admitted as Evidence?"],
  ["transmitted_roa_status", "Included in Transmitted ROA?"],
] as const

function statusLabel(value: string) {
  return value.replace(/_/g, " ")
}

export function CounselHandoffView() {
  const [data, setData] = useState<CounselHandoffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setData(await loadCounselHandoff())
    } catch {
      setData(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <main className="page-view">
        <ReadingSurface>
          <p className="muted">Checking private matter access…</p>
        </ReadingSurface>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page-view">
        <EmptyState icon={LockKeyhole} title="Private handoff unavailable">
          <p>
            This module requires authenticated access to the authorized matter.
            No handoff records were exposed.
          </p>
          <Button icon={RefreshCw} variant="secondary" onClick={() => void load()}>
            Check access again
          </Button>
        </EmptyState>
      </main>
    )
  }

  return (
    <main className="page-view counsel-handoff">
      <header className="page-header">
        <div>
          <span className="overline">Counsel handoff · private module</span>
          <h1>Appeal {COUNSEL_HANDOFF_CASE_NUMBER}</h1>
          <p>
            Lower Tribunal {COUNSEL_HANDOFF_LOWER_TRIBUNAL} · {data.matter.name}
          </p>
        </div>
        <Button icon={RefreshCw} variant="secondary" onClick={() => void load()}>
          Refresh scan
        </Button>
      </header>

      <ReadingSurface className="counsel-handoff__guardrail">
        <LockKeyhole size={18} aria-hidden="true" />
        <span>
          <strong>Authorized matter access only.</strong> Drive scans update
          file metadata without overwriting counsel review fields.
        </span>
      </ReadingSurface>

      <section className="counsel-handoff__summary" aria-label="Handoff summary">
        <div className="glass-card">
          <span className="overline">Files in scan</span>
          <strong>{data.files.length}</strong>
        </div>
        <div className="glass-card">
          <span className="overline">Active questions</span>
          <strong>{data.activeQuestions.length}</strong>
        </div>
        <div className="glass-card">
          <span className="overline">Record status</span>
          <strong>Review required</strong>
        </div>
      </section>

      <section className="counsel-handoff__section" aria-labelledby="handoff-files-title">
        <div className="section-heading">
          <div>
            <span className="overline">Drive scan register</span>
            <h2 id="handoff-files-title">Handoff files</h2>
          </div>
          <span className="muted">{data.files.length} records</span>
        </div>
        {data.files.length === 0 ? (
          <ReadingSurface>
            <p className="muted">
              No Drive scan has been imported for this matter yet.
            </p>
          </ReadingSurface>
        ) : (
          <div className="counsel-handoff__files">
            {data.files.map((file) => {
              const pathway = file.evidence_pathways[0]
              return (
                <article className="glass-card counsel-handoff__file" key={file.id}>
                  <div className="counsel-handoff__file-heading">
                    <FileText size={20} aria-hidden="true" />
                    <div>
                      <h3>{file.file_name}</h3>
                      <p>{file.full_tree_path}</p>
                    </div>
                    <span className={`status-text status-text--${file.review_status}`}>
                      {file.review_status === "verified" && <Check size={14} />}
                      {statusLabel(file.review_status)}
                    </span>
                  </div>
                  <dl className="counsel-handoff__pathways">
                    {pathwayLabels.map(([key, label]) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd>{statusLabel(pathway?.[key] ?? "unverified")}</dd>
                      </div>
                    ))}
                    <div>
                      <dt>Rule 9.200(f)</dt>
                      <dd>{pathway?.pathway_rule || "Unverified archive item"}</dd>
                    </div>
                  </dl>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="counsel-handoff__section" aria-labelledby="counsel-qa-title">
        <div className="section-heading">
          <div>
            <span className="overline">Counsel review queue</span>
            <h2 id="counsel-qa-title">Questions awaiting review</h2>
          </div>
        </div>
        {data.activeQuestions.length === 0 ? (
          <ReadingSurface>
            <p className="muted">No active or unverified questions are queued.</p>
          </ReadingSurface>
        ) : (
          <div className="counsel-handoff__questions">
            {data.activeQuestions.map((item) => (
              <article className="glass-card" key={item.id}>
                <div className="counsel-handoff__question-status">
                  <AlertTriangle size={16} aria-hidden="true" />
                  {statusLabel(item.status)}
                </div>
                <p>{item.question}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
