import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  LockKeyhole,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, EmptyState, ReadingSurface } from "../../components/ui"
import { BotanicalArt } from "../../components/brand"
import {
  loadCounselHandoff,
  triageHandoffFile,
  updateHandoffReview,
  type CounselHandoffData,
  type CounselTriageSuggestion,
} from "../../services/counselHandoff"
import type { HandoffFile } from "../../types/database"

const pathwayLabels = [
  ["clerk_filing_status", "Filed With Clerk?"],
  ["proffer_status", "Offered / Proffered?"],
  ["admission_status", "Admitted as Evidence?"],
  ["transmitted_roa_status", "Included in Transmitted ROA?"],
] as const

type TreeNode = {
  name: string
  path: string
  children: TreeNode[]
  files: HandoffFile[]
}

function statusLabel(value: string) {
  return value.replace(/_/g, " ")
}

function buildTree(files: HandoffFile[]) {
  const root: TreeNode = { name: "All handoff records", path: "", children: [], files: [] }
  for (const file of files) {
    const segments = file.full_tree_path.split(/[\\/]+/).filter(Boolean)
    let node = root
    for (const segment of segments.slice(0, -1)) {
      const path = node.path ? `${node.path}/${segment}` : segment
      let child = node.children.find((item) => item.path === path)
      if (!child) {
        child = { name: segment, path, children: [], files: [] }
        node.children.push(child)
      }
      node = child
    }
    node.files.push(file)
  }
  return root
}

function countTreeFiles(node: TreeNode): number {
  return node.files.length + node.children.reduce((total, child) => total + countTreeFiles(child), 0)
}

function FolderTree({
  node,
  selectedPath,
  collapsed,
  onSelect,
  onToggle,
}: {
  node: TreeNode
  selectedPath: string
  collapsed: Set<string>
  onSelect: (path: string) => void
  onToggle: (path: string) => void
}) {
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsed.has(node.path)
  return (
    <li>
      <div className={`handoff-tree__row ${selectedPath === node.path ? "is-selected" : ""}`}>
        {hasChildren ? (
          <button
            className="handoff-tree__toggle"
            aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${node.name}`}
            onClick={() => onToggle(node.path)}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
          </button>
        ) : (
          <span className="handoff-tree__spacer" />
        )}
        <button className="handoff-tree__label" onClick={() => onSelect(node.path)}>
          <FileText size={15} aria-hidden="true" />
          <span>{node.name}</span>
          <small title={`${countTreeFiles(node)} records in this folder and its subfolders`}>{countTreeFiles(node)}</small>
        </button>
      </div>
      {!isCollapsed && hasChildren && (
        <ul className="handoff-tree__children">
          {node.children.map((child) => (
            <FolderTree
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              collapsed={collapsed}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function CounselHandoffView({ matterId }: { matterId: string }) {
  const [data, setData] = useState<CounselHandoffData | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string>()
  const [selectedPath, setSelectedPath] = useState("")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState("")
  const [redFlagsOnly, setRedFlagsOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const next = await loadCounselHandoff(matterId)
      setData(next)
      setSelectedFileId((current) =>
        current && next.files.some((file) => file.id === current)
          ? current
          : next.files[0]?.id,
      )
    } catch {
      setData(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [matterId])

  useEffect(() => {
    void load()
  }, [load])

  const tree = useMemo(() => buildTree(data?.files ?? []), [data?.files])
  const selectedFile = data?.files.find((file) => file.id === selectedFileId)
  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return (data?.files ?? []).filter((file) => {
      const matchesPath = !selectedPath || file.full_tree_path.startsWith(selectedPath)
      const matchesQuery =
        !normalized ||
        `${file.file_name} ${file.full_tree_path} ${file.mime_type ?? ""}`
          .toLowerCase()
          .includes(normalized)
      return matchesPath && matchesQuery && (!redFlagsOnly || file.preservation_flag)
    })
  }, [data?.files, query, redFlagsOnly, selectedPath])

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
          <p>This module requires authenticated access to the authorized matter.</p>
          <Button icon={RefreshCw} variant="secondary" onClick={() => void load()}>
            Check access again
          </Button>
        </EmptyState>
      </main>
    )
  }

  return (
    <main className="page-view counsel-handoff">
      <BotanicalArt kind="app" className="counsel-handoff__art" />
      <header className="page-header counsel-handoff__header">
        <div>
          <a className="counsel-handoff__back" href={`#/app/matters/${encodeURIComponent(matterId)}`}>
            <ChevronRight size={14} aria-hidden="true" /> Back to Parent Headquarters
          </a>
          <span className="overline">Counsel / reviewer workspace · {data.role} matter role</span>
          <h1>{data.matter.name}</h1>
          <p>{data.matter.case_number ? `Case ${data.matter.case_number}` : "Case number not entered"} · {data.matter.active_proceeding || "Matter-specific counsel review"}</p>
        </div>
        <div className="counsel-handoff__header-actions">
          <span className="counsel-handoff__workspace-tag">Controlled review · development</span>
          <Button icon={RefreshCw} variant="secondary" onClick={() => void load()}>
            Refresh scan
          </Button>
        </div>
      </header>

      <ReadingSurface className="counsel-handoff__guardrail">
        <LockKeyhole size={18} aria-hidden="true" />
        <span>
          <strong>Draft access boundary.</strong> This view checks matter membership, but
          object-specific sharing and Counsel Private isolation are not yet validated.
          AI triage remains an unverified suggestion requiring human acceptance.
        </span>
      </ReadingSurface>

      <div className="counsel-handoff__workspace">
        <aside className="glass-card handoff-tree" aria-label="Drive folder tree">
          <div className="handoff-pane__heading">
            <span className="overline">Drive hierarchy</span>
            <button className="text-button" onClick={() => setCollapsed(new Set())}>
              Expand all
            </button>
          </div>
          <ul className="handoff-tree__list">
            <FolderTree
              node={tree}
              selectedPath={selectedPath}
              collapsed={collapsed}
              onSelect={setSelectedPath}
              onToggle={(path) =>
                setCollapsed((current) => {
                  const next = new Set(current)
                  if (next.has(path)) next.delete(path)
                  else next.add(path)
                  return next
                })
              }
            />
          </ul>
        </aside>

        <section className="glass-card handoff-records" aria-labelledby="pathways-title">
          <div className="handoff-pane__heading">
            <div>
              <span className="overline">Evidence Record Pathways</span>
              <h2 id="pathways-title">Preservation register</h2>
            </div>
            <span className="muted">{filteredFiles.length} shown</span>
          </div>
          <div className="handoff-filters">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter filename, path, MIME…"
              aria-label="Filter evidence pathways"
            />
            <label className="handoff-filter-check">
              <input
                type="checkbox"
                checked={redFlagsOnly}
                onChange={(event) => setRedFlagsOnly(event.target.checked)}
              />
              Preservation Red Flags
            </label>
          </div>
          <div className="handoff-table-wrap">
            <table className="handoff-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Pathway status</th>
                  <th>Priority</th>
                  <th>Preservation</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const pathway = file.evidence_pathways[0]
                  return (
                    <tr
                      key={file.id}
                      className={file.id === selectedFileId ? "is-selected" : ""}
                      onClick={() => setSelectedFileId(file.id)}
                    >
                      <td>
                        <strong>{file.file_name}</strong>
                        <small>{file.full_tree_path}</small>
                      </td>
                      <td>
                        {pathway?.pathway_rule || "Unverified archive item"}
                        <small>{statusLabel(file.review_status)}</small>
                      </td>
                      <td>{file.priority}</td>
                      <td>
                        {file.preservation_flag ? (
                          <span className="handoff-red-flag">
                            <AlertTriangle size={14} /> Flagged
                          </span>
                        ) : (
                          "Not flagged"
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <HandoffInspector
          data={data}
          file={selectedFile}
          onSaved={load}
        />
      </div>
    </main>
  )
}

function HandoffInspector({
  data,
  file,
  onSaved,
}: {
  data: CounselHandoffData
  file: CounselHandoffData["files"][number] | undefined
  onSaved: () => Promise<void>
}) {
  const [priority, setPriority] = useState<HandoffFile["priority"]>("normal")
  const [preservationFlag, setPreservationFlag] = useState(false)
  const [pathwayRule, setPathwayRule] = useState("")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [suggestion, setSuggestion] = useState<CounselTriageSuggestion | null>(null)

  useEffect(() => {
    const pathway = file?.evidence_pathways[0]
    setPriority(file?.priority ?? "normal")
    setPreservationFlag(file?.preservation_flag ?? false)
    setPathwayRule(pathway?.pathway_rule ?? "")
    setNotes(file?.notes ?? "")
    setSuggestion(null)
    setMessage("")
  }, [file])

  if (!file) {
    return (
      <aside className="glass-card handoff-inspector">
        <p className="muted">Select a record to inspect.</p>
      </aside>
    )
  }

  const save = async () => {
    if (data.role === "viewer") return
    setBusy(true)
    setMessage("")
    try {
      await updateHandoffReview({
        matterId: data.matter.id,
        fileId: file.id,
        priority,
        preservationFlag,
        notes,
        pathwayRule,
      })
      setMessage("Counsel review fields saved.")
      await onSaved()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The review could not be saved.")
    } finally {
      setBusy(false)
    }
  }

  const triage = async () => {
    if (data.role === "viewer") return
    setBusy(true)
    setMessage("")
    try {
      setSuggestion(await triageHandoffFile(data.matter.id, file.id))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI triage could not be completed.")
    } finally {
      setBusy(false)
    }
  }

  const acceptSuggestion = () => {
    if (!suggestion) return
    setPriority(suggestion.priority)
    setPreservationFlag(suggestion.preservationFlag)
    setPathwayRule(suggestion.pathwayRule ?? "")
    setMessage("Suggestion loaded into the review form. Save explicitly to accept it.")
  }
  const dismissSuggestion = () => {
    setSuggestion(null)
    setMessage("Unverified AI suggestion dismissed.")
  }

  return (
    <aside className="glass-card handoff-inspector" aria-label="Record inspector">
      <div className="handoff-pane__heading">
        <div>
          <span className="overline">Right-hand inspector</span>
          <h2>Review record</h2>
        </div>
        <FileText size={18} aria-hidden="true" />
      </div>
      <h3>{file.file_name}</h3>
      <p className="muted handoff-inspector__path">{file.full_tree_path}</p>
      <dl className="handoff-inspector__meta">
        <div><dt>MIME</dt><dd>{file.mime_type || "Unknown"}</dd></div>
        <div><dt>Review status</dt><dd>{statusLabel(file.review_status)}</dd></div>
      </dl>
      <label>
        Pathway rule
        <input disabled={data.role === "viewer"} value={pathwayRule} onChange={(event) => setPathwayRule(event.target.value)} placeholder="Rule 9.200(f) or unverified" />
      </label>
      <label>
        Priority
        <select disabled={data.role === "viewer"} value={priority} onChange={(event) => setPriority(event.target.value as HandoffFile["priority"])}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </label>
      <label className="handoff-filter-check">
        <input type="checkbox" disabled={data.role === "viewer"} checked={preservationFlag} onChange={(event) => setPreservationFlag(event.target.checked)} />
        Preservation Red Flag
      </label>
      <label>
        Counsel notes
        <textarea disabled={data.role === "viewer"} rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Record a review note without changing the source scan." />
      </label>
      <div className="handoff-inspector__actions">
        <Button icon={Save} variant="primary" disabled={busy || data.role === "viewer"} onClick={() => void save()}>
          Save review
        </Button>
        <Button icon={Sparkles} variant="secondary" disabled={busy || data.role === "viewer"} onClick={() => void triage()}>
          Suggest triage
        </Button>
      </div>
      {suggestion && (
        <ReadingSurface className="handoff-suggestion">
          <strong><Sparkles size={15} /> Unverified AI suggestion</strong>
          <p>{suggestion.rationale}</p>
          <dl>
            <div><dt>Pathway</dt><dd>{suggestion.pathwayRule || "Unverified archive item"}</dd></div>
            <div><dt>Priority</dt><dd>{suggestion.priority}</dd></div>
            <div><dt>Preservation</dt><dd>{suggestion.preservationFlag ? "Flagged" : "Not flagged"}</dd></div>
            {suggestion.flagReason && <div><dt>Flag reason</dt><dd>{suggestion.flagReason}</dd></div>}
            {suggestion.recommendedNextStep && <div><dt>Next step</dt><dd>{suggestion.recommendedNextStep}</dd></div>}
            {suggestion.rule9200LimitationNote && <div><dt>Rule 9.200(f) limitation</dt><dd>{suggestion.rule9200LimitationNote}</dd></div>}
          </dl>
          <div className="handoff-inspector__actions">
            <Button variant="primary" disabled={data.role === "viewer"} onClick={acceptSuggestion}>Accept suggestion</Button>
            <Button variant="ghost" onClick={dismissSuggestion}>Dismiss</Button>
          </div>
        </ReadingSurface>
      )}
      {message && <p className="muted" role="status">{message}</p>}
    </aside>
  )
}
