import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileImage,
  FileQuestion,
  FileText,
  Filter,
  Focus,
  Link2,
  Plus,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Upload,
} from "lucide-react"
import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import type { Session } from "@supabase/supabase-js"
import { LocalFileService } from "../services/localFiles"
import { verifyOriginalBytes } from "../lib/integrity"
import {
  getSession,
  onAuthStateChange,
  requestPasswordReset,
  signIn,
  signOut,
} from "../services/auth"
import { SiteFrame } from "./site/Site"
import { setLook, useLook } from "../lib/look"
import { createMatter, listMatters } from "../services/matters"
import { setActiveMatterId } from "../services/activeMatter"
import {
  createOriginalSignedUrl,
  listSources,
  uploadOriginalSource,
  type SourceSummary,
} from "../services/sources"
import { useApp } from "../state/AppContext"
import type {
  DocumentRecord,
  Draft,
  ThemeId,
  TimelineEntry as TimelineEntryType,
} from "../types"
import type { Matter } from "../types/database"
import {
  Button,
  EmptyState,
  IconButton,
  Modal,
  ReadingSurface,
  rememberModalTrigger,
} from "../components/ui"

function PageHeader({
  overline,
  title,
  description,
  actions,
}: {
  overline: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <span className="overline">{overline}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}

export function EvidenceView() {
  const { state, dispatch } = useApp()
  const [query, setQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [reselectDocument, setReselectDocument] =
    useState<DocumentRecord | null>(null)
  const documents = state.documents.filter(
    (document) =>
      document.caseId === state.activeCaseId &&
      `${document.title} ${document.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const openDocument = (
    document: DocumentRecord,
    trigger: HTMLButtonElement,
  ) => {
    const passage = state.passages.find(
      (item) => item.documentId === document.id,
    )
    if (passage) {
      rememberModalTrigger(trigger)
      dispatch({ type: "setSource", passageId: passage.id })
      dispatch({ type: "navigate", view: "chat" })
    } else if (document.isLocal) {
      setReselectDocument(document)
    }
  }
  return (
    <main className="page-view">
      <PageHeader
        overline="Case records"
        title="Evidence"
        description="Find records, keep their original language visible, and trace work back to its source."
        actions={
          <Button
            icon={Plus}
            variant="primary"
            onClick={() => setAddOpen(true)}
          >
            Add document
          </Button>
        }
      />
      <div className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Search evidence</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents and tags"
          />
        </label>
        <Button icon={Filter}>Filter</Button>
      </div>
      <div className="evidence-list">
        <div className="list-header">
          <span>Document</span>
          <span>Type</span>
          <span>Date</span>
          <span>Status</span>
          <span />
        </div>
        {documents.map((document) => (
          <button
            className="evidence-row"
            key={document.id}
            onClick={(event) => openDocument(document, event.currentTarget)}
          >
            <span className="document-cell">
              <span className="file-icon">
                <FileText size={20} />
              </span>
              <span>
                <strong>{document.title}</strong>
                <small>
                  {document.id} · {document.receivedFrom}
                </small>
                <span className="tag-list">
                  {document.tags.map((tag) => (
                    <em key={tag}>{tag}</em>
                  ))}
                </span>
              </span>
            </span>
            <span>{document.type}</span>
            <span>{document.documentDate ?? "Unknown"}</span>
            <span className="status-text">
              {document.status === "Reselect file to preview" ? (
                <FileQuestion size={15} />
              ) : (
                <Check size={15} />
              )}
              {LocalFileService.has(document.id) &&
              document.status === "Reselect file to preview"
                ? "Local file available"
                : document.status}
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      {addOpen && <AddDocumentModal onClose={() => setAddOpen(false)} />}
      {reselectDocument && (
        <AddDocumentModal
          document={reselectDocument}
          onClose={() => setReselectDocument(null)}
        />
      )}
    </main>
  )
}

function AddDocumentModal({
  document,
  onClose,
}: {
  document?: DocumentRecord
  onClose: () => void
}) {
  const { state, dispatch } = useApp()
  const [file, setFile] = useState<File | null>(() =>
    document ? (LocalFileService.get(document.id) ?? null) : null,
  )
  const [textPreview, setTextPreview] = useState("")
  const [title, setTitle] = useState(document?.title ?? "")
  const [type, setType] = useState(document?.type ?? "Email or letter")
  const [documentDate, setDocumentDate] = useState(document?.documentDate ?? "")
  const [receivedFrom, setReceivedFrom] = useState(document?.receivedFrom ?? "")
  const imagePreview = useMemo(
    () => (file?.type.startsWith("image/") ? URL.createObjectURL(file) : ""),
    [file],
  )
  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    },
    [imagePreview],
  )
  useEffect(() => {
    let active = true
    if (file?.type === "text/plain") {
      file.text().then((text) => active && setTextPreview(text.slice(0, 4000)))
    } else {
      setTextPreview("")
    }
    return () => {
      active = false
    }
  }, [file])
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    if (selected && !title) setTitle(selected.name.replace(/\.[^.]+$/, ""))
  }
  const save = () => {
    if (!file || !title.trim()) return
    const id =
      document?.id ??
      `LOCAL-${Date.now().toString(36).toUpperCase()}-${crypto
        .randomUUID()
        .slice(0, 4)
        .toUpperCase()}`
    LocalFileService.set(id, file)
    const supportsPreview =
      file.type.startsWith("image/") || file.type === "text/plain"
    dispatch({
      type: "saveDocument",
      document: {
        id,
        caseId: state.activeCaseId,
        title: title.trim(),
        type,
        documentDate: documentDate || undefined,
        receivedFrom: receivedFrom.trim() || "Added locally",
        tags: document?.tags ?? ["local"],
        status: supportsPreview ? "Local preview" : "Preview unavailable",
        isLocal: true,
        localFileName: file.name,
        localMimeType: file.type || "Unknown type",
        localFileSize: file.size,
      },
    })
    onClose()
  }
  return (
    <Modal
      title={
        document
          ? file
            ? "Local document details"
            : "Reselect local file"
          : "Add a local document"
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" disabled={!file || !title} onClick={save}>
            {document
              ? "Save metadata and local file"
              : "Save document metadata"}
          </Button>
        </>
      }
    >
      <p className="modal-intro">
        Metadata is saved in this demo workspace. File bytes stay in memory only
        and must be reselected after refresh. Nothing is uploaded or analyzed.
      </p>
      <label className="file-drop">
        <Upload size={24} />
        <strong>{file ? file.name : "Choose a file"}</strong>
        <span>
          {file
            ? `${file.type || "Unknown type"} · ${Math.ceil(file.size / 1024)} KB`
            : "Images and text files can be previewed. PDF extraction is not connected."}
        </span>
        <input type="file" accept="image/*,.txt,.pdf" onChange={choose} />
      </label>
      <label>
        Document title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Document type
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option>Email or letter</option>
          <option>Service record</option>
          <option>Photo or image</option>
          <option>Other</option>
        </select>
      </label>
      <label>
        Document date
        <input
          type="date"
          value={documentDate}
          onChange={(event) => setDocumentDate(event.target.value)}
        />
      </label>
      <label>
        Received from
        <input
          value={receivedFrom}
          onChange={(event) => setReceivedFrom(event.target.value)}
          placeholder="Optional source or sender"
        />
      </label>
      {file &&
        (file.type.startsWith("image/") ? (
          <div className="local-file-preview">
            <div className="preview-note">
              <FileImage size={18} />
              Local image preview · not uploaded
            </div>
            <img src={imagePreview} alt={`Local preview of ${file.name}`} />
          </div>
        ) : file.type === "text/plain" ? (
          <div className="local-file-preview">
            <div className="preview-note">
              <FileText size={18} />
              Local text preview · not analyzed
            </div>
            <pre>{textPreview || "Preparing local preview…"}</pre>
          </div>
        ) : (
          <div className="preview-note">
            <FileQuestion size={18} />
            {file.type === "text/plain"
              ? "Text preview supported after adding."
              : "Preview is unavailable for this format in the demo."}
          </div>
        ))}
    </Modal>
  )
}

export function TimelineView() {
  const { state, dispatch } = useApp()
  const [filter, setFilter] = useState<"all" | TimelineEntryType["dateKind"]>(
    "all",
  )
  const [editing, setEditing] = useState<TimelineEntryType | null>(null)
  const entries = state.timeline
    .filter(
      (entry) =>
        entry.caseId === state.activeCaseId &&
        (filter === "all" || entry.dateKind === filter),
    )
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  const openSource = (entry: TimelineEntryType, trigger: HTMLButtonElement) => {
    rememberModalTrigger(trigger)
    dispatch({ type: "setSource", passageId: entry.sourcePassageIds[0] })
    dispatch({ type: "navigate", view: "chat" })
  }
  return (
    <main className="page-view">
      <PageHeader
        overline="Source-linked chronology"
        title="Timeline"
        description="Event dates remain distinct from document dates, with uncertainty visible."
        actions={
          <label className="compact-select">
            <Filter size={17} />
            <span className="sr-only">Filter by date status</span>
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as typeof filter)
              }
            >
              <option value="all">All dates</option>
              <option value="exact">Exact</option>
              <option value="approximate">Approximate</option>
              <option value="disputed">Disputed</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
        }
      />
      <div className="timeline-list">
        {entries.map((entry) => {
          const date = entry.eventDate
            ? new Date(`${entry.eventDate}T12:00:00`)
            : null
          return (
            <article className="timeline-entry" key={entry.id}>
              <div className="timeline-entry__date">
                <strong>
                  {date
                    ? date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "Date"}
                </strong>
                <span>{date ? date.getFullYear() : "unknown"}</span>
              </div>
              <div className="timeline-entry__line">
                <span />
              </div>
              <ReadingSurface className="timeline-entry__content">
                <div className="timeline-entry__heading">
                  <div>
                    <span className={`date-kind date-kind--${entry.dateKind}`}>
                      {entry.dateKind} date
                    </span>
                    <h2>{entry.title}</h2>
                  </div>
                  <Button variant="ghost" onClick={() => setEditing(entry)}>
                    Edit
                  </Button>
                </div>
                <p>{entry.description}</p>
                <button
                  className="source-link"
                  onClick={(event) => openSource(entry, event.currentTarget)}
                >
                  <Link2 size={16} />
                  Open linked source
                </button>
              </ReadingSurface>
            </article>
          )
        })}
      </div>
      {editing && (
        <EditTimeline entry={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}

function EditTimeline({
  entry,
  onClose,
}: {
  entry: TimelineEntryType
  onClose: () => void
}) {
  const { dispatch } = useApp()
  const [value, setValue] = useState(entry)
  return (
    <Modal
      title="Edit timeline entry"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              dispatch({ type: "updateTimeline", entry: value })
              onClose()
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <label>
        Entry title
        <input
          value={value.title}
          onChange={(event) =>
            setValue({ ...value, title: event.target.value })
          }
        />
      </label>
      <label>
        Event date
        <input
          type="date"
          value={value.eventDate}
          onChange={(event) =>
            setValue({ ...value, eventDate: event.target.value })
          }
        />
      </label>
      <label>
        Description
        <textarea
          rows={4}
          value={value.description}
          onChange={(event) =>
            setValue({ ...value, description: event.target.value })
          }
        />
      </label>
    </Modal>
  )
}

export function DraftsView() {
  const { state, dispatch } = useApp()
  const drafts = state.drafts.filter(
    (draft) => draft.caseId === state.activeCaseId,
  )
  const [activeId, setActiveId] = useState(drafts[0]?.id)
  const original = drafts.find((draft) => draft.id === activeId)
  const [local, setLocal] = useState<Draft | undefined>(original)
  const select = (draft: Draft) => {
    setActiveId(draft.id)
    setLocal(draft)
  }
  if (!drafts.length)
    return (
      <main className="page-view">
        <PageHeader
          overline="Source-linked writing"
          title="Drafts"
          description="Develop working text while keeping source links close."
        />
        <EmptyState icon={FileText} title="No drafts yet">
          <p>Open a source and choose Use in draft to begin.</p>
        </EmptyState>
      </main>
    )
  return (
    <main className="page-view page-view--split">
      <aside className="draft-list">
        <PageHeader
          overline="Working documents"
          title="Drafts"
          description="Saved locally in this demo."
        />
        {drafts.map((draft) => (
          <button
            key={draft.id}
            className={draft.id === activeId ? "is-active" : ""}
            onClick={() => select(draft)}
          >
            <strong>{draft.title}</strong>
            <span>{draft.type}</span>
            <small>{draft.sourcePassageIds.length} linked sources</small>
          </button>
        ))}
      </aside>
      {local && (
        <section className="draft-editor">
          <div className="draft-editor__bar">
            <span>
              <Check size={15} />
              Local draft
            </span>
            <Button
              variant="primary"
              onClick={() =>
                dispatch({
                  type: "saveDraft",
                  draft: { ...local, updatedAt: new Date().toISOString() },
                })
              }
            >
              Save draft
            </Button>
          </div>
          <label>
            Title
            <input
              value={local.title}
              onChange={(event) =>
                setLocal({ ...local, title: event.target.value })
              }
            />
          </label>
          <label>
            Draft type
            <select
              value={local.type}
              onChange={(event) =>
                setLocal({ ...local, type: event.target.value })
              }
            >
              <option>Question list</option>
              <option>Working note</option>
              <option>Hearing outline</option>
            </select>
          </label>
          <label className="draft-body">
            Body
            <textarea
              value={local.body}
              onChange={(event) =>
                setLocal({ ...local, body: event.target.value })
              }
            />
          </label>
          <div className="linked-sources">
            <Link2 size={16} />
            <strong>{local.sourcePassageIds.length} linked sources</strong>
            <span>
              Last edited {new Date(local.updatedAt).toLocaleString()}
            </span>
          </div>
        </section>
      )}
    </main>
  )
}

export function HearingView() {
  const { state, dispatch } = useApp()
  const [focus, setFocus] = useState(false)
  const plan = state.hearingPlans.find(
    (item) => item.caseId === state.activeCaseId,
  )
  if (!plan)
    return (
      <main className="page-view">
        <PageHeader
          overline="Hearing preparation"
          title="Hearing prep"
          description="Gather issues, questions, and sources without losing their context."
        />
        <EmptyState icon={Focus} title="No hearing plan yet">
          <p>This separate sample case has no hearing plan.</p>
        </EmptyState>
      </main>
    )
  return (
    <main className={`page-view hearing-view ${focus ? "is-focus" : ""}`}>
      <PageHeader
        overline="Focused preparation"
        title="Hearing prep"
        description="A compact view of what to raise and what the records can support."
        actions={
          <Button
            icon={focus ? ArrowLeft : Focus}
            variant={focus ? "primary" : "secondary"}
            onClick={() => setFocus(!focus)}
          >
            {focus ? "Exit focus" : "Focus mode"}
          </Button>
        }
      />
      <div className="hearing-grid">
        <ReadingSurface>
          <span className="section-number">01</span>
          <h2>Issues</h2>
          <ul>
            {plan.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </ReadingSurface>
        <ReadingSurface>
          <span className="section-number">02</span>
          <h2>Questions</h2>
          <ol>
            {plan.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </ReadingSurface>
        <ReadingSurface>
          <span className="section-number">03</span>
          <h2>Referenced sources</h2>
          {plan.sourcePassageIds.map((id) => {
            const passage = state.passages.find((item) => item.id === id)!
            return (
              <button
                key={id}
                className="hearing-source"
                onClick={(event) => {
                  rememberModalTrigger(event.currentTarget)
                  dispatch({ type: "setSource", passageId: id })
                  dispatch({ type: "navigate", view: "chat" })
                }}
              >
                <FileText size={18} />
                <span>
                  <strong>{passage.documentId}</strong>
                  <small>{passage.location}</small>
                </span>
                <ChevronRight size={17} />
              </button>
            )
          })}
        </ReadingSurface>
        <ReadingSurface>
          <span className="section-number">04</span>
          <h2>Notes</h2>
          <p>{plan.notes}</p>
        </ReadingSurface>
      </div>
    </main>
  )
}

const themes: {
  id: ThemeId
  name: string
  description: string
}[] = [
  {
    id: "champagne",
    name: "Champagne + Smoke",
    description: "Warm metal and smoked charcoal",
  },
  {
    id: "rose",
    name: "Rose Copper + Ink",
    description: "Soft copper against deep ink",
  },
  {
    id: "pearl",
    name: "Pearl + Sage",
    description: "Quiet light surfaces and grounded sage",
  },
]

export function SettingsView() {
  const { state, dispatch } = useApp()
  const [resetOpen, setResetOpen] = useState(false)
  const look = useLook()
  return (
    <main className="page-view settings-view">
      <PageHeader
        overline="Workspace preferences"
        title="Settings"
        description="Adjust visual comfort without changing records or layout."
      />
      <section className="settings-section">
        <h2>Background</h2>
        <div className="setting-row">
          <span>
            <strong>Floral background</strong>
            <small>Applies to the website, sign-in and workspace panels.</small>
          </span>
          <select
            aria-label="Floral background"
            value={look}
            onChange={(event) => setLook(event.target.value as "botanical" | "sepia")}
          >
            <option value="botanical">Botanical</option>
            <option value="sepia">Sepia</option>
          </select>
        </div>
      </section>
      <section className="settings-section">
        <h2>Appearance</h2>
        <div className="theme-options">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={
                state.preferences.theme === theme.id ? "is-active" : ""
              }
              onClick={() =>
                dispatch({
                  type: "preferences",
                  preferences: { theme: theme.id },
                })
              }
            >
              <span className={`theme-swatch theme-swatch--${theme.id}`}>
                <i />
                <i />
                <i />
              </span>
              <span>
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
              </span>
              {state.preferences.theme === theme.id && <Check size={18} />}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <h2>Reading comfort</h2>
        <label className="setting-row">
          <span>
            <strong>Larger interface text</strong>
            <small>
              Increase body and control text throughout the workspace.
            </small>
          </span>
          <input
            type="checkbox"
            checked={state.preferences.textScale === "large"}
            onChange={(event) =>
              dispatch({
                type: "preferences",
                preferences: {
                  textScale: event.target.checked ? "large" : "default",
                },
              })
            }
          />
        </label>
        <label className="setting-row">
          <span>
            <strong>Reduce transparency</strong>
            <small>Replace glass surfaces with opaque equivalents.</small>
          </span>
          <input
            type="checkbox"
            checked={state.preferences.reducedTransparency}
            onChange={(event) =>
              dispatch({
                type: "preferences",
                preferences: { reducedTransparency: event.target.checked },
              })
            }
          />
        </label>
        <label className="setting-row">
          <span>
            <strong>Reduce motion</strong>
            <small>Minimize interface transitions and movement.</small>
          </span>
          <input
            type="checkbox"
            checked={state.preferences.reducedMotion}
            onChange={(event) =>
              dispatch({
                type: "preferences",
                preferences: { reducedMotion: event.target.checked },
              })
            }
          />
        </label>
      </section>
      <section className="settings-section settings-links">
        <button
          onClick={() => dispatch({ type: "navigate", view: "design-review" })}
        >
          <span>
            <SlidersHorizontal size={19} />
            <span>
              <strong>Design review</strong>
              <small>Review type, color, materials, and controls.</small>
            </span>
          </span>
          <ChevronRight size={18} />
        </button>
        <button onClick={() => dispatch({ type: "navigate", view: "signin" })}>
          <span>
            <Shield size={19} />
            <span>
              <strong>Sign-in design</strong>
              <small>Preview the supporting first-impression screen.</small>
            </span>
          </span>
          <ChevronRight size={18} />
        </button>
      </section>
      <section className="settings-section danger-zone">
        <h2>Demo data</h2>
        <p>
          Reset all local notes, timeline changes, drafts, and preferences to
          their original fictional examples.
        </p>
        <Button
          icon={RotateCcw}
          variant="danger"
          onClick={() => setResetOpen(true)}
        >
          Reset demo data
        </Button>
      </section>
      {resetOpen && (
        <Modal
          title="Reset demo data?"
          onClose={() => setResetOpen(false)}
          footer={
            <>
              <Button onClick={() => setResetOpen(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  dispatch({ type: "reset" })
                  setResetOpen(false)
                }}
              >
                Reset everything
              </Button>
            </>
          }
        >
          <p>
            This removes local changes in this browser. It cannot be undone.
          </p>
        </Modal>
      )}
    </main>
  )
}

export function DesignReviewView() {
  const { state, dispatch } = useApp()
  const tokens = [
    "Background base",
    "Solid surface",
    "Raised surface",
    "Reading surface",
    "Primary text",
    "Accent",
    "Focus",
  ]
  return (
    <main className="page-view design-review">
      <PageHeader
        overline="Separate review surface"
        title="Design review"
        description="Provisional foundations for We The Parent. None of these directions are marked approved."
      />
      <section>
        <h2>Wordmark and typography</h2>
        <div className="review-type">
          <div className="wordmark-large">
            We The Parent<span>Composed, capable, and personal.</span>
          </div>
          <div>
            <p className="display-sample">Understand the record.</p>
            <p>
              Manrope supports readable interface and conversation copy. Signika
              gives the wordmark and introductory headings a warmer voice.
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2>Theme previews</h2>
        <div className="review-themes">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`mini-workspace mini-workspace--${theme.id} ${
                state.preferences.theme === theme.id ? "is-active" : ""
              }`}
              onClick={() =>
                dispatch({
                  type: "preferences",
                  preferences: { theme: theme.id },
                })
              }
            >
              <span className="mini-workspace__frame">
                <i />
                <span>
                  <b />
                  <b />
                  <b />
                </span>
                <em />
              </span>
              <strong>{theme.name}</strong>
              <small>Same layout · token swap only</small>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2>Semantic palette</h2>
        <div className="token-grid">
          {tokens.map((token, index) => (
            <div key={token}>
              <span className={`token-color token-color--${index + 1}`} />
              <strong>{token}</strong>
              <small>CSS custom property</small>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Materials and states</h2>
        <div className="material-grid">
          <div className="material-sample material-sample--frame">
            <strong>Structural frame</strong>
            <span>One dominant polished rim</span>
          </div>
          <div className="material-sample material-sample--frost">
            <strong>Frosted organization</strong>
            <span>Quiet spatial grouping</span>
          </div>
          <ReadingSurface className="material-sample">
            <strong>Reading surface</strong>
            <span>Nearly opaque for long text</span>
          </ReadingSurface>
          <div className="control-samples">
            <Button variant="primary">Primary action</Button>
            <Button>Secondary</Button>
            <input placeholder="Input state" />
            <input placeholder="Focused state" autoFocus />
          </div>
        </div>
      </section>
    </main>
  )
}

export function SignInView() {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [matters, setMatters] = useState<Matter[]>([])
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null)
  const [primaryValue, setPrimaryValue] = useState("")
  const [secondaryValue, setSecondaryValue] = useState("")
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingMatters, setLoadingMatters] = useState(false)
  const [sources, setSources] = useState<SourceSummary[]>([])
  const [loadingSources, setLoadingSources] = useState(false)
  const [sourceRefresh, setSourceRefresh] = useState(0)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadSourceType, setUploadSourceType] = useState("document")
  const [uploadOrigin, setUploadOrigin] = useState("")
  const [uploadSourceDate, setUploadSourceDate] = useState("")
  const [uploadingOriginal, setUploadingOriginal] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [uploadInputKey, setUploadInputKey] = useState(0)
  const [downloadingSourceId, setDownloadingSourceId] = useState<string | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const busy = submitting || loadingMatters

  useEffect(() => {
    let active = true
    getSession()
      .then((nextSession) => {
        if (active) setSession(nextSession)
      })
      .catch(() => {
        if (active) {
          setError("The secure session could not be restored. Please sign in.")
        }
      })
      .finally(() => {
        if (active) setSessionReady(true)
      })

    const unsubscribe = onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setSelectedMatter(null)
      setPrimaryValue("")
      setSecondaryValue("")
      setError(null)
      setSessionReady(true)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setMatters([])
      return
    }

    let active = true
    setLoadingMatters(true)
    listMatters()
      .then((nextMatters) => {
        if (active) setMatters(nextMatters)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        const detail =
          loadError instanceof Error ? loadError.message.toLowerCase() : ""
        setError(
          detail.includes("matters") || detail.includes("schema")
            ? "The secure matter schema is not available yet. Apply the Founder Alpha migration before continuing."
            : "Your matters could not be loaded. Please try again.",
        )
      })
      .finally(() => {
        if (active) setLoadingMatters(false)
      })

    return () => {
      active = false
    }
  }, [session])

  useEffect(() => {
    if (!selectedMatter) {
      setSources([])
      setSourceError(null)
      return
    }

    let active = true
    setLoadingSources(true)
    setSourceError(null)
    listSources(selectedMatter.id)
      .then((nextSources) => {
        if (active) setSources(nextSources)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        const detail =
          loadError instanceof Error ? loadError.message.toLowerCase() : ""
        setSourceError(
          detail.includes("not found") ||
            detail.includes("failed to send") ||
            detail.includes("secure request")
            ? "The secure source service is not available yet. Deploy the updated Edge Function before continuing."
            : "Source records could not be loaded. Please try again.",
        )
      })
      .finally(() => {
        if (active) setLoadingSources(false)
      })

    return () => {
      active = false
    }
  }, [selectedMatter, sourceRefresh])

  const submit = async () => {
    if (!sessionReady || busy) return
    setError(null)
    setSubmitting(true)
    try {
      if (!session) {
        await signIn(primaryValue, secondaryValue)
        return
      }
      if (selectedMatter) return
      const matter = await createMatter({
        name: primaryValue,
        jurisdiction: secondaryValue,
      })
      setMatters((current) => [matter, ...current])
      setSelectedMatter(matter)
      setActiveMatterId(matter.id)
      setPrimaryValue("")
      setSecondaryValue("")
      location.hash = "#/app"
    } catch (submitError) {
      const detail =
        submitError instanceof Error ? submitError.message.toLowerCase() : ""
      setError(
        !session && detail.includes("invalid login")
          ? "The email or password was not recognized."
          : detail.includes("matter name")
            ? "Enter a name for this matter."
            : "The secure request could not be completed. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const forgotPassword = async () => {
    setResetMessage(null)
    if (!primaryValue.trim()) {
      setError("Enter your email address first, then choose Forgot password.")
      return
    }
    setError(null)
    try {
      await requestPasswordReset(primaryValue)
    } catch {
      setError("The password reset request could not be submitted. Please retry when the service is available.")
      return
    }
    setResetMessage(
      "If an account exists for that email, a reset link has been sent.",
    )
  }

  const endSession = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await signOut()
      setActiveMatterId(null)
    } catch {
      setError("Sign out could not be completed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const downloadOriginal = async (source: SourceSummary) => {
    const original = source.source_files[0]
    if (!original) {
      setSourceError("This source does not have a preserved original.")
      return
    }

    setSourceError(null)
    setDownloadingSourceId(source.id)
    try {
      const { signedUrl } = await createOriginalSignedUrl(original.id)
      const response = await fetch(signedUrl, { cache: "no-store" })
      if (!response.ok) throw new Error("Original download failed")
      const bytes = await response.arrayBuffer()
      await verifyOriginalBytes(bytes, original.byte_size, original.sha256)
      const url = URL.createObjectURL(new Blob([bytes]))
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = original.original_name.replace(/[\\/\u0000-\u001f]/g, "_")
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setUploadMessage(`Verified SHA-256 and downloaded: ${original.original_name}`)
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : "Original download verification failed")
    } finally {
      setDownloadingSourceId(null)
    }
  }

  const chooseOriginal = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    setUploadFile(selected)
    setUploadMessage(null)
    if (selected && !uploadTitle.trim()) {
      setUploadTitle(selected.name.replace(/\.[^.]+$/, ""))
    }
  }

  const preserveOriginal = async () => {
    if (
      !selectedMatter ||
      !uploadFile ||
      !uploadTitle.trim() ||
      uploadingOriginal
    ) {
      return
    }

    setSourceError(null)
    setUploadMessage(null)
    setUploadingOriginal(true)
    try {
      const result = await uploadOriginalSource({
        matterId: selectedMatter.id,
        title: uploadTitle.trim(),
        sourceType: uploadSourceType.trim() || "document",
        origin: uploadOrigin.trim() || undefined,
        sourceDate: uploadSourceDate || undefined,
        file: uploadFile,
      })

      setUploadMessage(
        `Preserved unchanged original: ${result.original.originalName} · SHA-256 ${result.original.sha256.slice(0, 16)}…`,
      )
      setUploadFile(null)
      setUploadTitle("")
      setUploadSourceType("document")
      setUploadOrigin("")
      setUploadSourceDate("")
      setUploadInputKey((current) => current + 1)
      setSourceRefresh((current) => current + 1)
    } catch (uploadError) {
      const detail =
        uploadError instanceof Error ? uploadError.message : ""
      setSourceError(
        detail || "The original could not be preserved. Please try again.",
      )
    } finally {
      setUploadingOriginal(false)
    }
  }

  const authenticated = Boolean(session)
  const noticeTitle = error || sourceError
    ? "Unable to continue"
    : selectedMatter
      ? "Matter boundary active"
      : authenticated
        ? "Authenticated workspace"
        : "Protected by Supabase"
  const noticeBody = error || sourceError
    ? error || sourceError
    : selectedMatter
      ? loadingSources
        ? `Loading the source register for ${selectedMatter.name}.`
        : sources.length
          ? `${selectedMatter.name} contains ${sources.length} authorized source record${sources.length === 1 ? "" : "s"}.`
          : `${selectedMatter.name} is selected. No source records have been preserved yet.`
      : authenticated
        ? "Choose an existing matter or create a private matter workspace."
        : "Your session is encrypted in transit. Matter access is enforced by database policies."

  const showNotice = authenticated || Boolean(error || sourceError)
  return (
    <SiteFrame route="signin">
      <div className="entrance">
        <div className="entrance__copy">
          <div>
            <p className="entrance__eyebrow">Private case workspace</p>
            <p className="entrance__name">We The Parent</p>
            <hr className="entrance__rule" />
          </div>
          <div>
            <h1 className="entrance__title">Return to the work that matters.</h1>
            <p className="entrance__lede">
              {selectedMatter
                ? "This secure foundation keeps every future source, statement, event, and task inside the selected matter."
                : "Keep conversations, source records, and prepared work connected in one calm workspace."}
            </p>
          </div>
        </div>
        <section className="glass-card entrance-card" aria-labelledby="entrance-title">
          <h2 id="entrance-title">
            {authenticated ? "Your workspace" : "Welcome back"}
          </h2>
          <p className="entrance-card__sub">
            {authenticated
              ? selectedMatter
                ? selectedMatter.name
                : "Choose a matter to continue."
              : "Sign in to your workspace."}
          </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          {showNotice && (
            <div className="auth-notice" role="status">
              <Shield size={17} />
              <span>
                <strong>{noticeTitle}</strong>
                {noticeBody}
              </span>
            </div>
          )}
          {authenticated &&
            !selectedMatter &&
            matters.map((matter) => (
              <Button
                type="button"
                key={matter.id}
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setSelectedMatter(matter)
                  setActiveMatterId(matter.id)
                  location.hash = "#/app"
                }}
              >
                {matter.name}
              </Button>
            ))}
          {selectedMatter && (
            <>
              <div className="divider">
                <span>preserve a test original</span>
              </div>
              <p className="modal-intro">
                Use a harmless test file first. The unchanged original is stored
                privately inside this matter and registered with a SHA-256 checksum.
              </p>
              <label className="file-drop">
                <Upload size={24} />
                <strong>{uploadFile ? uploadFile.name : "Choose a harmless test file"}</strong>
                <span>
                  {uploadFile
                    ? `${uploadFile.type || "Unknown type"} · ${Math.ceil(uploadFile.size / 1024)} KB`
                    : "Up to 50 MB. Executable files are blocked."}
                </span>
                <input
                  key={uploadInputKey}
                  type="file"
                  onChange={chooseOriginal}
                  disabled={uploadingOriginal}
                />
              </label>
              <label>
                Source title
                <input
                  value={uploadTitle}
                  disabled={uploadingOriginal}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="e.g. Harmless source preservation test"
                />
              </label>
              <label>
                Source type
                <select
                  value={uploadSourceType}
                  disabled={uploadingOriginal}
                  onChange={(event) => setUploadSourceType(event.target.value)}
                >
                  <option value="document">Document</option>
                  <option value="email">Email</option>
                  <option value="photo">Photo or image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="court_filing">Court filing</option>
                  <option value="agency_record">Agency record</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Source date
                <input
                  type="date"
                  value={uploadSourceDate}
                  disabled={uploadingOriginal}
                  onChange={(event) => setUploadSourceDate(event.target.value)}
                />
              </label>
              <label>
                Origin
                <input
                  value={uploadOrigin}
                  disabled={uploadingOriginal}
                  onChange={(event) => setUploadOrigin(event.target.value)}
                  placeholder="Optional sender, agency, court, or source"
                />
              </label>
              <Button
                type="button"
                icon={Upload}
                variant="primary"
                disabled={
                  uploadingOriginal ||
                  !uploadFile ||
                  !uploadTitle.trim()
                }
                onClick={() => void preserveOriginal()}
              >
                {uploadingOriginal ? "Preserving unchanged original…" : "Preserve original"}
              </Button>
              {uploadMessage && (
                <div className="preview-note">
                  <Check size={18} />
                  <span>{uploadMessage}</span>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      location.hash = "#/app"
                    }}
                  >
                    Open workspace
                  </Button>
                </div>
              )}
              <div className="divider">
                <span>preserved sources</span>
              </div>
            </>
          )}
          {selectedMatter &&
            sources.slice(0, 5).map((source) => {
              const original = source.source_files[0]
              return (
                <Button
                  type="button"
                  key={source.id}
                  icon={Download}
                  variant="secondary"
                  disabled={
                    loadingSources ||
                    !original ||
                    downloadingSourceId === source.id
                  }
                  title={
                    original
                      ? `Download preserved original: ${original.original_name}`
                      : "Preserved original unavailable"
                  }
                  onClick={() => void downloadOriginal(source)}
                >
                  {downloadingSourceId === source.id
                    ? "Preparing secure download…"
                    : `${source.title} · ${original?.original_name ?? "Original unavailable"}`}
                </Button>
              )
            })}
          <label>
            {authenticated ? "Matter name" : "Email address"}
            <input
              type={authenticated ? "text" : "email"}
              autoComplete={authenticated ? "off" : "email"}
              placeholder={
                authenticated ? "e.g. Family matter" : "you@example.com"
              }
              value={selectedMatter?.name ?? primaryValue}
              disabled={busy || Boolean(selectedMatter)}
              onChange={(event) => setPrimaryValue(event.target.value)}
            />
          </label>
          <label>
            {authenticated ? "Jurisdiction" : "Password"}
            <span className="password-field">
              <input
                type={authenticated || visible ? "text" : "password"}
                autoComplete={authenticated ? "off" : "current-password"}
                placeholder={
                  authenticated
                    ? "State, province, or territory"
                    : "Enter your password"
                }
                value={selectedMatter?.jurisdiction ?? secondaryValue}
                disabled={busy || Boolean(selectedMatter)}
                onChange={(event) => setSecondaryValue(event.target.value)}
              />
              {!authenticated && (
                <IconButton
                  type="button"
                  label={visible ? "Hide password" : "Show password"}
                  icon={visible ? EyeOff : Eye}
                  onClick={() => setVisible(!visible)}
                />
              )}
            </span>
          </label>
          {!authenticated && (
            <button
              type="button"
              className="entrance-card__link entrance-card__forgot"
              onClick={() => void forgotPassword()}
            >
              Forgot password?
            </button>
          )}
          {resetMessage && !authenticated && (
            <div className="preview-note" role="status">
              <Check size={18} />
              {resetMessage}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={
              busy ||
              !sessionReady ||
              Boolean(selectedMatter) ||
              !primaryValue.trim() ||
              (!authenticated && !secondaryValue)
            }
          >
            {busy ? (
              "Working securely…"
            ) : authenticated ? (
              "Create private matter"
            ) : (
              <>
                Sign in
                <ArrowRight size={28} aria-hidden="true" />
              </>
            )}
          </Button>
          {!authenticated && (
            <div className="entrance-card__links">
              <span>Account creation is by invitation only.</span>
              <a href="#/">Back to home</a>
            </div>
          )}
          {authenticated && (
            <>
          <Button
            type="button"
            disabled={busy || !authenticated}
            onClick={() => void endSession()}
          >
            Sign out
          </Button>
          <div className="divider">
            <span>{selectedMatter ? "matter controls" : "secure access"}</span>
          </div>
          <Button
            type="button"
            icon={RotateCcw}
            variant="secondary"
            disabled={!selectedMatter || loadingSources}
            onClick={() => setSourceRefresh((current) => current + 1)}
          >
            {loadingSources ? "Loading source records…" : "Refresh sources"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!selectedMatter}
            onClick={() => {
              setSelectedMatter(null)
              setActiveMatterId(null)
            }}
          >
            {selectedMatter
              ? "Choose another matter"
              : "Select a matter to continue"}
          </Button>
            </>
          )}
        </form>
        </section>
      </div>
    </SiteFrame>
  )
}
