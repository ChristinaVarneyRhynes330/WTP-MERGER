import {
  ArrowRight, BookOpen, CalendarDays, CalendarPlus, Check, ChevronRight,
  FilePlus2, FileQuestion, FileText, Files, FolderSearch, Gavel, Info,
  Link2, MessageSquare, NotebookPen, Plus, RotateCcw, Search,
} from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useApp } from "../../state/AppContext"
import { LocalFileService } from "../../services/localFiles"
import type { DocumentRecord, Draft, Note, TimelineEntry } from "../../types"

type InspectTab = "source" | "connections" | "actions"
type RecordStatus = "all" | "ready" | "local" | "unavailable"
type Order = "newest" | "oldest"

export function EvidenceHub({
  onAdd,
  onReselect,
}: {
  onAdd: () => void
  onReselect: (record: DocumentRecord) => void
}) {
  const { state, dispatch } = useApp()
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<RecordStatus>("all")
  const [order, setOrder] = useState<Order>("newest")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [passageId, setPassageId] = useState<string | null>(null)
  const [tab, setTab] = useState<InspectTab>("source")
  const [noteDraft, setNoteDraft] = useState("")
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [dateKind, setDateKind] = useState<TimelineEntry["dateKind"]>("disputed")
  const [feedback, setFeedback] = useState("")

  // All derived records, passages and linked work are confined to the active
  // fictional demo case. Nothing queries or updates private Supabase matters.
  const caseRecords = useMemo(
    () => state.documents.filter(record => record.caseId === state.activeCaseId),
    [state.documents, state.activeCaseId],
  )
  const casePassages = useMemo(
    () => state.passages.filter(p => p.caseId === state.activeCaseId),
    [state.passages, state.activeCaseId],
  )
  const types = useMemo(
    () => Array.from(new Set(caseRecords.map(record => record.type))).sort(),
    [caseRecords],
  )

  useEffect(() => {
    setSelectedId(null)
    setPassageId(null)
    setTab("source")
    setFeedback("")
    setQuery("")
    setTypeFilter("all")
    setStatusFilter("all")
  }, [state.activeCaseId])

  const search = query.trim().toLocaleLowerCase()
  const visible = useMemo(() => caseRecords.filter(record => {
    const sourceText = casePassages
      .filter(p => p.documentId === record.id)
      .map(p => [p.text, p.location].join(" "))
      .join(" ")
    const matchesText = !search || [
      record.title, record.id, record.type, record.receivedFrom ?? "",
      record.tags.join(" "), sourceText,
    ].join(" ").toLocaleLowerCase().includes(search)
    const matchesType = typeFilter === "all" || record.type === typeFilter
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "ready" && !record.isLocal && record.status === "Ready") ||
      (statusFilter === "local" && Boolean(record.isLocal)) ||
      (statusFilter === "unavailable" &&
        (record.status === "Preview unavailable" || record.status === "Reselect file to preview"))
    return matchesText && matchesType && matchesStatus
  }).sort((a, b) => {
    const first = a.documentDate || ""
    const second = b.documentDate || ""
    if (!first) return 1
    if (!second) return -1
    return order === "newest" ? second.localeCompare(first) : first.localeCompare(second)
  }), [caseRecords, casePassages, search, typeFilter, statusFilter, order])

  const selected = visible.find(record => record.id === selectedId) ?? visible[0] ?? null
  const availablePassages = casePassages.filter(p => p.documentId === selected?.id)
  const selectedPassage = availablePassages.find(p => p.id === passageId) ?? availablePassages[0] ?? null
  const allPassageIds = availablePassages.map(p => p.id)
  const linkedEvents = state.timeline.filter(
    item => item.caseId === state.activeCaseId &&
      item.sourcePassageIds.some(id => allPassageIds.includes(id)),
  )
  const linkedDrafts = state.drafts.filter(
    item => item.caseId === state.activeCaseId &&
      item.sourcePassageIds.some(id => allPassageIds.includes(id)),
  )
  const linkedNotes = state.notes.filter(
    item => item.caseId === state.activeCaseId && allPassageIds.includes(item.passageId),
  )
  const caseEventCount = state.timeline.filter(item => item.caseId === state.activeCaseId).length

  const inspect = (id: string) => {
    setSelectedId(id)
    setPassageId(null)
    setTab("source")
    setFeedback("")
    if (window.matchMedia("(max-width: 900px)").matches) {
      window.requestAnimationFrame(() => {
        const inspector = document.getElementById("evidence-hub-inspector")
        inspector?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        })
        inspector?.focus({ preventScroll: true })
      })
    }
  }

  const saveNote = () => {
    if (!selectedPassage || !noteDraft.trim()) return
    const note: Note = {
      id: crypto.randomUUID(),
      caseId: state.activeCaseId,
      passageId: selectedPassage.id,
      body: noteDraft.trim(),
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: "addNote", note })
    setNoteDraft("")
    setTab("connections")
    setFeedback("Source-linked practice note saved in this fictional demo. It does not change the source.")
  }

  const createDraft = () => {
    if (!selectedPassage || !selected) return
    const draft: Draft = {
      id: crypto.randomUUID(),
      caseId: state.activeCaseId,
      title: `Working notes — ${selected.title}`,
      type: "Working note · fictional demo",
      body: `Illustrative source: ${selected.title} (${selected.id})\nLocation: ${selectedPassage.location}\n\nIllustrative passage (not independently verified):\n“${selectedPassage.text}”\n\nQuestions to verify:\n`,
      sourcePassageIds: [selectedPassage.id],
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "saveDraft", draft })
    setTab("connections")
    setFeedback("Working draft saved in the fictional demo. It is not a court filing.")
  }

  const createTimelineEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPassage || !eventTitle.trim() ||
      (dateKind !== "unknown" && !eventDate)) return
    const entry: TimelineEntry = {
      id: crypto.randomUUID(),
      caseId: state.activeCaseId,
      title: eventTitle.trim(),
      description: "User-entered demo timeline proposal. The cited passage does not independently establish the event.",
      eventDate: dateKind === "unknown" ? "" : eventDate,
      dateKind,
      sourcePassageIds: [selectedPassage.id],
    }
    dispatch({ type: "addTimeline", entry })
    setEventFormOpen(false)
    setEventTitle("")
    setEventDate("")
    setDateKind("disputed")
    setTab("connections")
    setFeedback("Source-linked timeline entry saved in the fictional demo. Its date remains a user-entered proposal.")
  }

  return (
    <main className="page-view wtp-evidence-hub">
      <div className="wtp-evidence-hub__header">
        <div>
          <span className="wtp-evidence-hub__eyebrow">CASE RECORDS · FICTIONAL DESIGN DEMO</span>
          <h1>Evidence Hub</h1>
          <p>Find a record, inspect its illustrative passage, follow related events, and prepare your next question—all in one workspace.</p>
        </div>
        <button type="button" className="wtp-evidence-hub__primary" onClick={onAdd}>
          <Plus size={17} aria-hidden="true" /> Add local document
        </button>
      </div>

      <div className="wtp-evidence-hub__stats" aria-label="Active sample case summary">
        <div><span>Records</span><strong>{caseRecords.length}</strong><small>In this demo case</small></div>
        <div><span>Illustrative passages</span><strong>{casePassages.length}</strong><small>Not verified originals</small></div>
        <div><span>Timeline entries</span><strong>{caseEventCount}</strong><small>Linked or unlinked</small></div>
      </div>

      <div className="wtp-evidence-hub__toolbar">
        <label className="wtp-evidence-hub__search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search records, tags and sample passages</span>
          <input value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Search records, tags, or passages…" />
        </label>
        <label className="wtp-evidence-hub__select">
          <span>Type</span>
          <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} aria-label="Filter by record type">
            <option value="all">All types</option>
            {types.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="wtp-evidence-hub__select">
          <span>Status</span>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as RecordStatus)} aria-label="Filter by preview status">
            <option value="all">All statuses</option>
            <option value="ready">Sample ready</option>
            <option value="local">Local files</option>
            <option value="unavailable">Preview unavailable</option>
          </select>
        </label>
        <label className="wtp-evidence-hub__select">
          <span>Sort</span>
          <select value={order} onChange={event => setOrder(event.target.value as Order)} aria-label="Sort by document date">
            <option value="newest">Newest document date</option>
            <option value="oldest">Oldest document date</option>
          </select>
        </label>
      </div>

      <div className="wtp-evidence-hub__columns">
        <section className="wtp-evidence-hub__library" aria-label="Search results">
          <div className="wtp-evidence-hub__section-top">
            <h2>Record library</h2>
            <span role="status">{visible.length} of {caseRecords.length}</span>
          </div>
          {visible.length === 0 && (
            <div className="wtp-evidence-hub__empty">
              <FolderSearch size={27} aria-hidden="true" />
              <h3>No matching records</h3>
              <p>Try another search term or clear the filters. Nothing was deleted.</p>
              <button type="button" onClick={() => { setQuery(""); setTypeFilter("all"); setStatusFilter("all") }}>
                <RotateCcw size={15} aria-hidden="true" /> Clear filters
              </button>
            </div>
          )}
          <div className="wtp-evidence-hub__list">
            {visible.map(record => {
              const count = casePassages.filter(p => p.documentId === record.id).length
              return (
                <button key={record.id} type="button"
                  className={`wtp-evidence-hub__record ${selected?.id === record.id ? "is-selected" : ""}`}
                  aria-pressed={selected?.id === record.id} onClick={() => inspect(record.id)}>
                  <span className="wtp-evidence-hub__file-icon">
                    {record.status === "Preview unavailable" || record.status === "Reselect file to preview"
                      ? <FileQuestion size={19} aria-hidden="true" />
                      : <FileText size={19} aria-hidden="true" />}
                  </span>
                  <span className="wtp-evidence-hub__record-body">
                    <strong>{record.title}</strong>
                    <small>{record.id} · {record.type}</small>
                    <span className="wtp-evidence-hub__record-tags">
                      <em>{record.isLocal ? "Local demo metadata" : "Fictional sample"}</em>
                      <em>{count} {count === 1 ? "passage" : "passages"}</em>
                      {record.tags.slice(0, 2).map(tag => <em key={tag}>{tag}</em>)}
                    </span>
                    <span className="wtp-evidence-hub__record-date">
                      Document date: {record.documentDate || "Unknown"} · {record.status}
                    </span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </section>

        <aside id="evidence-hub-inspector" className="wtp-evidence-hub__inspector"
          aria-label="Selected source and connected work" tabIndex={-1}>
          {!selected ? (
            <div className="wtp-evidence-hub__empty">
              <Files size={25} aria-hidden="true" />
              <h2>Select a record</h2>
              <p>Choose a document to view its context, connections and available actions.</p>
            </div>
          ) : (
            <>
              <div className="wtp-evidence-hub__inspector-title">
                <span className="wtp-evidence-hub__eyebrow">SOURCE CONTEXT · {selected.id}</span>
                <h2>{selected.title}</h2>
                <p>Document date: {selected.documentDate || "not recorded"} · {selected.receivedFrom || "source unknown"}</p>
              </div>
              <div className="wtp-evidence-hub__tabs" role="group" aria-label="Source context panels">
                {(["source", "connections", "actions"] as const).map(name => (
                  <button key={name} type="button" aria-pressed={tab === name}
                    className={tab === name ? "is-active" : ""}
                    onClick={() => { setTab(name); setFeedback("") }}>
                    {name === "source" ? "Source" : name === "connections" ? "Connections" : "Actions"}
                  </button>
                ))}
              </div>
              {feedback && <p className="wtp-evidence-hub__feedback" role="status"><Check size={15} aria-hidden="true" />{feedback}</p>}

              {tab === "source" && (
                <div className="wtp-evidence-hub__detail">
                  <div className="wtp-evidence-hub__info">
                    <Info size={17} aria-hidden="true" />
                    <span>{selected.isLocal
                      ? "Locally added metadata is not an immutable original. The file remains in memory only and may need reselection after refresh."
                      : "This is a fictional sample passage, not a retrieved or independently authenticated original."}</span>
                  </div>
                  {availablePassages.length > 1 && (
                    <label className="wtp-evidence-hub__passage-select">
                      Passage
                      <select value={selectedPassage?.id ?? ""} onChange={event => setPassageId(event.target.value)}>
                        {availablePassages.map((p, i) =>
                          <option value={p.id} key={p.id}>{i + 1}. {p.location}</option>)}
                      </select>
                    </label>
                  )}
                  {selectedPassage ? (
                    <>
                      <div className="wtp-evidence-hub__paper">
                        <span>ILLUSTRATIVE PASSAGE · {selectedPassage.location}</span>
                        <blockquote>{selectedPassage.text}</blockquote>
                      </div>
                      <div className="wtp-evidence-hub__interpretation">
                        <strong>Record interpretation · not a finding</strong>
                        <p>{selectedPassage.interpretation}</p>
                        <small>{selectedPassage.assertionType}</small>
                      </div>
                      <button type="button" className="wtp-evidence-hub__text-button"
                        onClick={() => {
                          dispatch({ type: "setSource", passageId: selectedPassage.id })
                          dispatch({ type: "navigate", view: "chat" })
                        }}>
                        <MessageSquare size={16} aria-hidden="true" /> Open source in conversation <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <div className="wtp-evidence-hub__empty">
                      <FileQuestion size={23} aria-hidden="true" />
                      <p>No source passage is associated with this local record. This screen does not extract or invent one.</p>
                      {selected.isLocal && (
                        <button type="button" onClick={() => onReselect(selected)}>Reselect or update local file</button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === "connections" && (
                <div className="wtp-evidence-hub__detail">
                  <div className="wtp-evidence-hub__connected">
                    <h3>Timeline <span>{linkedEvents.length}</span></h3>
                    {linkedEvents.length === 0 && <p>No linked timeline events yet.</p>}
                    {linkedEvents.map(item => (
                      <div className="wtp-evidence-hub__connected-item" key={item.id}>
                        <strong>{item.title}</strong>
                        <small>Event date: {item.eventDate || "Unknown"} · {item.dateKind}</small>
                      </div>
                    ))}
                    {linkedEvents.length > 0 && (
                      <button type="button" onClick={() => dispatch({ type: "navigate", view: "timeline" })}>
                        View timeline <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="wtp-evidence-hub__connected">
                    <h3>Working drafts <span>{linkedDrafts.length}</span></h3>
                    {linkedDrafts.length === 0 && <p>No linked drafts.</p>}
                    {linkedDrafts.map(item => (
                      <div className="wtp-evidence-hub__connected-item" key={item.id}><strong>{item.title}</strong><small>{item.type}</small></div>
                    ))}
                    {linkedDrafts.length > 0 && (
                      <button type="button" onClick={() => dispatch({ type: "navigate", view: "drafts" })}>
                        View drafts <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="wtp-evidence-hub__connected">
                    <h3>Source-linked notes <span>{linkedNotes.length}</span></h3>
                    {linkedNotes.length === 0 && <p>No notes attached to the sample passages.</p>}
                    {linkedNotes.map(item => (
                      <div className="wtp-evidence-hub__connected-item" key={item.id}>
                        <p>{item.body}</p><small>Working note · separate from source text</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "actions" && (
                <div className="wtp-evidence-hub__detail">
                  {!selectedPassage ? (
                    <div className="wtp-evidence-hub__info"><Info size={17} aria-hidden="true" />
                      <span>Source-linked actions need a passage. Local metadata alone is insufficient.</span>
                    </div>
                  ) : (
                    <>
                      <section className="wtp-evidence-hub__action">
                        <h3><NotebookPen size={17} aria-hidden="true" /> Add working note</h3>
                        <p>The note is linked to the selected sample passage, without changing its text.</p>
                        <label>
                          <span className="sr-only">Working note</span>
                          <textarea value={noteDraft} maxLength={5000} rows={3}
                            onChange={event => setNoteDraft(event.target.value)}
                            placeholder="What should be checked or clarified?" />
                        </label>
                        <button type="button" onClick={saveNote} disabled={!noteDraft.trim()}>Save linked note</button>
                      </section>
                      <section className="wtp-evidence-hub__action">
                        <h3><FilePlus2 size={17} aria-hidden="true" /> Prepare working draft</h3>
                        <p>Create an editable working note with a source link. It is not a court filing.</p>
                        <button type="button" onClick={createDraft}>Create source-linked draft</button>
                      </section>
                      <section className="wtp-evidence-hub__action">
                        <h3><CalendarPlus size={17} aria-hidden="true" /> Propose timeline event</h3>
                        <p>Enter an event date separately from the document date. Nothing is inferred automatically.</p>
                        <button type="button" aria-expanded={eventFormOpen} onClick={() => setEventFormOpen(open => !open)}>
                          {eventFormOpen ? "Close event form" : "Add an event proposal"}
                        </button>
                        {eventFormOpen && (
                          <form className="wtp-evidence-hub__event-form" onSubmit={createTimelineEvent}>
                            <label>Event title
                              <input value={eventTitle} maxLength={180} required
                                placeholder="What event is being proposed?"
                                onChange={event => setEventTitle(event.target.value)} />
                            </label>
                            <label>Certainty of event date
                              <select value={dateKind}
                                onChange={event => setDateKind(event.target.value as TimelineEntry["dateKind"])}>
                                <option value="disputed">Disputed</option>
                                <option value="approximate">Approximate</option>
                                <option value="exact">Exact (user-entered)</option>
                                <option value="unknown">Unknown</option>
                              </select>
                            </label>
                            {dateKind !== "unknown" && (
                              <label>Proposed event date
                                <input type="date" required value={eventDate}
                                  onChange={event => setEventDate(event.target.value)} />
                              </label>
                            )}
                            <button type="submit" disabled={!eventTitle.trim() || (dateKind !== "unknown" && !eventDate)}>
                              Save demo timeline proposal
                            </button>
                          </form>
                        )}
                      </section>
                    </>
                  )}
                </div>
              )}
              <div className="wtp-evidence-hub__inspector-footer">
                <Link2 size={15} aria-hidden="true" />
                <span>Fictional demo only · No original-file authentication or court submission</span>
              </div>
            </>
          )}
        </aside>
      </div>

      <nav className="wtp-evidence-hub__mobile-nav" aria-label="Evidence Hub mobile shortcuts">
        <button type="button" onClick={() => dispatch({ type: "navigate", view: "chat" })}>
          <MessageSquare size={18} aria-hidden="true" /><span>Chat</span>
        </button>
        <span aria-current="page"><Files size={18} aria-hidden="true" /><span>Evidence</span></span>
        <button type="button" onClick={() => dispatch({ type: "navigate", view: "timeline" })}>
          <CalendarDays size={18} aria-hidden="true" /><span>Timeline</span>
        </button>
        <button type="button" onClick={() => dispatch({ type: "navigate", view: "learning" })}>
          <BookOpen size={18} aria-hidden="true" /><span>Learn</span>
        </button>
        <button type="button" onClick={() => dispatch({ type: "navigate", view: "hearing" })}>
          <Gavel size={18} aria-hidden="true" /><span>Prepare</span>
        </button>
      </nav>
    </main>
  )
}
