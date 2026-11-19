import {
  ArrowLeft,
  Check,
  Clipboard,
  FilePlus2,
  GripVertical,
  CalendarPlus,
  Info,
  NotebookPen,
  RotateCcw,
  SquareArrowOutUpRight,
  X,
  ArrowRight,
} from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { useApp } from "../../state/AppContext"
import type { Draft, Note, TimelineEntry } from "../../types"
import {
  Button,
  IconButton,
  Modal,
  ReadingSurface,
  useModalSurface,
} from "../../components/ui"
import { supabase } from "../../lib/supabase"
import { updateSourceConfirmation } from "../../services/sourceVerification"
import type { ConfirmationState } from "../../types/database"

export function SourceWorkbench({
  modal,
  width,
  onResize,
  onClose,
}: {
  modal: boolean
  width: number
  onResize: (width: number) => void
  onClose: () => void
}) {
  const { state, dispatch } = useApp()
  const [mode, setMode] = useState<"source" | "notes" | "draft">("source")
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [copied, setCopied] = useState(false)
  const [liveSource, setLiveSource] = useState<{
    id: string
    title: string
    confirmationState: ConfirmationState
  } | null>(null)
  const [liveExcerpt, setLiveExcerpt] = useState("")
  const [verificationMessage, setVerificationMessage] = useState("")
  const [verificationBusy, setVerificationBusy] = useState(false)
  const workbenchRef = useRef<HTMLElement>(null)
  useModalSurface(modal && !timelineOpen, onClose, workbenchRef)
  const liveCitation = state.messages
    .flatMap((message) => message.citations ?? [])
    .find((citation) => citation.passageId === state.selectedPassageId)
  const passage = state.passages.find(
    (item) => item.id === state.selectedPassageId,
  )
  const document = state.documents.find(
    (item) => item.id === passage?.documentId,
  )
  useEffect(() => {
    if (!liveCitation?.sourceId) {
      setLiveSource(null)
      setLiveExcerpt("")
      return
    }
    let active = true
    Promise.all([
      supabase
        .from("sources")
        .select("id,title,confirmation_state")
        .eq("id", liveCitation.sourceId)
        .single(),
      supabase
        .from("source_chunks")
        .select("content")
        .eq("source_id", liveCitation.sourceId)
        .eq("page_number", liveCitation.pageNumber ?? -1)
        .limit(5),
    ]).then(([sourceResult, chunkResult]) => {
      if (!active) return
      if (!sourceResult.error && sourceResult.data) {
        setLiveSource({
          id: sourceResult.data.id,
          title: sourceResult.data.title,
          confirmationState: sourceResult.data.confirmation_state,
        })
      }
      if (!chunkResult.error) {
        setLiveExcerpt(
          (chunkResult.data ?? [])
            .map((chunk) => chunk.content)
            .join("\n\n"),
        )
      }
    })
    return () => {
      active = false
    }
  }, [liveCitation?.sourceId, liveCitation?.pageNumber])

  const verifyLiveSource = async (stateValue: ConfirmationState) => {
    if (!liveSource) return
    setVerificationBusy(true)
    setVerificationMessage("")
    try {
      await updateSourceConfirmation(liveSource.id, stateValue)
      setLiveSource((current) =>
        current ? { ...current, confirmationState: stateValue } : current,
      )
      setVerificationMessage(
        stateValue === "user_confirmed"
          ? "Verified by user"
          : stateValue === "disputed"
            ? "Anomaly flagged"
            : "Record contested",
      )
    } catch (error) {
      setVerificationMessage(
        error instanceof Error ? error.message : "The verification could not be saved.",
      )
    } finally {
      setVerificationBusy(false)
    }
  }

  if (liveCitation?.sourceId && liveSource) {
    const confirmationLabel =
      liveSource.confirmationState === "user_confirmed"
        ? "Verified by user"
        : liveSource.confirmationState === "disputed"
          ? "Anomaly flagged"
          : liveSource.confirmationState === "needs_source"
            ? "Needs source"
            : liveSource.confirmationState === "ai_suggested"
              ? "AI suggested"
              : "Unverified"
    return (
      <aside
        ref={workbenchRef}
        className={`workbench ${modal ? "workbench--sheet" : ""}`}
        aria-labelledby="live-workbench-title"
        role={modal ? "dialog" : "complementary"}
        aria-modal={modal ? true : undefined}
      >
        <header className="workbench__header">
          {modal && <IconButton label="Back to conversation" icon={ArrowLeft} onClick={onClose} />}
          <div><span className="overline">Live source viewer</span></div>
          <IconButton label="Close source" icon={X} onClick={onClose} />
        </header>
        <h2 id="live-workbench-title" className="workbench__title">{liveSource.title}</h2>
        <p className="workbench__sub">
          {liveCitation.sourceId.slice(0, 8)} · {liveCitation.pageNumber ? `Page ${liveCitation.pageNumber}` : "Page unknown"}
        </p>
        <div className="workbench__scroll">
          <div className="paper" role="group" aria-label="Retrieved source text">
            <mark>{liveExcerpt || "Loading the retrieved source text…"}</mark>
          </div>
          <p className="workbench__note">
            <Info size={20} aria-hidden="true" />
            <span>Status: <strong>{confirmationLabel}</strong>. AI text requires human verification.</span>
          </p>
          <div className="verification-actions" aria-label="Human verification">
            <Button
              variant="primary"
              icon={Check}
              disabled={verificationBusy}
              onClick={() => verifyLiveSource("user_confirmed")}
            >
              Verify extraction
            </Button>
            <Button
              variant="secondary"
              disabled={verificationBusy}
              onClick={() => verifyLiveSource("disputed")}
            >
              Flag anomaly
            </Button>
            <Button
              variant="ghost"
              disabled={verificationBusy}
              onClick={() => verifyLiveSource("needs_source")}
            >
              Contest record
            </Button>
          </div>
          {verificationMessage && <p role="status" className="muted">{verificationMessage}</p>}
        </div>
      </aside>
    )
  }

  if (!passage || !document || document.caseId !== state.activeCaseId)
    return null

  const sourceMessage = state.messages.find((message) =>
    message.citations?.some((citation) => citation.passageId === passage.id),
  )
  const tabs = sourceMessage?.citations ?? []
  const existingNotes = state.notes.filter(
    (note) => note.passageId === passage.id,
  )
  const saveNote = () => {
    if (!noteText.trim()) return
    const note: Note = {
      id: crypto.randomUUID(),
      caseId: state.activeCaseId,
      passageId: passage.id,
      body: noteText.trim(),
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: "addNote", note })
    setNoteText("")
  }
  const createDraft = () => {
    const draft: Draft = {
      id: crypto.randomUUID(),
      caseId: state.activeCaseId,
      title: `Draft from ${document.id}`,
      type: "Working note",
      body: `Source: ${document.title}, ${passage.location}\n\n“${passage.text}”\n\nWorking analysis:\n`,
      sourcePassageIds: [passage.id],
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "saveDraft", draft })
    dispatch({ type: "navigate", view: "drafts" })
  }
  const copy = async () => {
    await navigator.clipboard.writeText(passage.text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  const linkedTimeline = state.timeline.filter((entry) =>
    entry.sourcePassageIds.includes(passage.id),
  )
  const linkedDrafts = state.drafts.filter((draft) =>
    draft.sourcePassageIds.includes(passage.id),
  )
  const beginResize = (event: PointerEvent<HTMLDivElement>) => {
    if (modal) return
    event.preventDefault()
    const startX = event.clientX
    const startWidth = width
    const move = (moveEvent: globalThis.PointerEvent) =>
      onResize(startWidth + startX - moveEvent.clientX)
    const stop = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop)
  }
  const handleResizeKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      onResize(width + 16)
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      onResize(width - 16)
    } else if (event.key === "Home") {
      event.preventDefault()
      onResize(368)
    }
  }

  return (
    <aside
      ref={workbenchRef}
      className={`workbench ${modal ? "workbench--sheet" : ""}`}
      aria-labelledby="workbench-title"
      role={modal ? "dialog" : "complementary"}
      aria-modal={modal ? true : undefined}
      tabIndex={modal ? -1 : undefined}
    >
      {!modal && (
        <div
          className="workbench__resize"
          role="separator"
          aria-label="Resize source workbench"
          aria-orientation="vertical"
          aria-valuemin={340}
          aria-valuemax={480}
          aria-valuenow={width}
          tabIndex={0}
          title="Drag to resize. Use arrow keys for precise adjustment."
          onPointerDown={beginResize}
          onKeyDown={handleResizeKey}
        >
          <GripVertical size={16} />
        </div>
      )}
      <header className="workbench__header">
        {modal && (
          <IconButton
            label="Back to conversation"
            icon={ArrowLeft}
            onClick={onClose}
          />
        )}
        <div>
          <span className="overline">Source viewer</span>
        </div>
        {tabs.length > 1 && (
          <div className="viewer-tabs" role="tablist" aria-label="Cited sources">
            {tabs.map((tab, index) => (
              <button
                key={tab.passageId}
                role="tab"
                aria-selected={tab.passageId === passage.id}
                aria-label={`Source ${index + 1}: ${tab.label}`}
                className={tab.passageId === passage.id ? "is-active" : ""}
                onClick={() =>
                  dispatch({ type: "setSource", passageId: tab.passageId })
                }
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
        {!modal && width !== 368 && (
          <IconButton
            label="Restore default workbench width"
            icon={RotateCcw}
            onClick={() => onResize(368)}
          />
        )}
        <IconButton label="Close source" icon={X} onClick={onClose} />
      </header>
      <h2 id="workbench-title" className="workbench__title">
        {document.title}
      </h2>
      <p className="workbench__sub">
        Fictional sample · {document.id} · {passage.location}
      </p>
      <div className="segmented" aria-label="Workbench mode">
        {(["source", "notes", "draft"] as const).map((item) => (
          <button
            key={item}
            className={mode === item ? "is-active" : ""}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="workbench__scroll">
        {mode === "source" && (
          <>
            <div className="paper" role="group" aria-label="Original passage">
              <div className="paper__lines" aria-hidden="true">
                <i /><i /><i />
              </div>
              <mark>{passage.text}</mark>
              <div className="paper__lines" aria-hidden="true">
                <i /><i /><i /><i />
              </div>
            </div>
            <p className="workbench__note">
              <Info size={20} aria-hidden="true" />
              <span>
                {passage.interpretation}{" "}
                <span className="type-label">{passage.assertionType}</span>
              </span>
            </p>
            <dl className="source-meta">
              <div>
                <dt>Document date</dt>
                <dd>
                  {document.documentDate
                    ? new Date(
                        `${document.documentDate}T12:00:00`,
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Unknown"}
                </dd>
              </div>
              <div>
                <dt>Record status</dt>
                <dd>
                  <Check size={14} />
                  Preview ready
                </dd>
              </div>
            </dl>
            <div className="source-section linked-work">
              <h3>Connected work</h3>
              <p>
                {linkedTimeline.length} timeline{" "}
                {linkedTimeline.length === 1 ? "entry" : "entries"} ·{" "}
                {linkedDrafts.length}{" "}
                {linkedDrafts.length === 1 ? "draft" : "drafts"}
              </p>
            </div>
          </>
        )}
        {mode === "notes" && (
          <div className="source-section notes-mode">
            <h3>Source-linked notes</h3>
            {existingNotes.map((note) => (
              <ReadingSurface key={note.id}>{note.body}</ReadingSurface>
            ))}
            {!existingNotes.length && (
              <p className="muted">
                No notes yet. Notes remain separate from the original passage.
              </p>
            )}
            <label htmlFor="source-note">Add a note</label>
            <textarea
              id="source-note"
              rows={5}
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="What should you remember or verify?"
            />
            <Button
              variant="primary"
              icon={NotebookPen}
              disabled={!noteText.trim()}
              onClick={saveNote}
            >
              Save note
            </Button>
          </div>
        )}
        {mode === "draft" && (
          <div className="source-section">
            <h3>Use this material</h3>
            <p>
              Create a simple working draft with the source citation and exact
              passage already linked.
            </p>
            <Button variant="primary" icon={FilePlus2} onClick={createDraft}>
              Create draft
            </Button>
          </div>
        )}
      </div>
      <footer className="workbench__actions">
        <span className="workbench__quick">
          <Button
            variant="ghost"
            icon={copied ? Check : Clipboard}
            onClick={copy}
          >
            {copied ? "Copied" : "Copy passage"}
          </Button>
          <Button variant="ghost" onClick={() => setMode("notes")}>
            Add note
          </Button>
        </span>
        <button
          className="pill"
          onClick={() => dispatch({ type: "navigate", view: "evidence" })}
        >
          <SquareArrowOutUpRight size={22} aria-hidden="true" />
          Open full record
          <ArrowRight size={22} aria-hidden="true" />
        </button>
        <button className="pill" onClick={() => setTimelineOpen(true)}>
          <CalendarPlus size={22} aria-hidden="true" />
          Add to timeline
          <ArrowRight size={22} aria-hidden="true" />
        </button>
      </footer>
      {timelineOpen && (
        <TimelineProposal
          passageId={passage.id}
          documentTitle={document.title}
          onClose={() => setTimelineOpen(false)}
        />
      )}
    </aside>
  )
}

function TimelineProposal({
  passageId,
  documentTitle,
  onClose,
}: {
  passageId: string
  documentTitle: string
  onClose: () => void
}) {
  const { state, dispatch } = useApp()
  const [title, setTitle] = useState(`${documentTitle}: appointment record`)
  const [description, setDescription] = useState(
    "Record this passage for comparison with the other account.",
  )
  const [date, setDate] = useState("2026-09-12")
  const [dateKind, setDateKind] =
    useState<TimelineEntry["dateKind"]>("disputed")
  const save = () => {
    dispatch({
      type: "addTimeline",
      entry: {
        id: crypto.randomUUID(),
        caseId: state.activeCaseId,
        title,
        description,
        eventDate: date,
        dateKind,
        sourcePassageIds: [passageId],
      },
    })
    onClose()
  }
  return (
    <Modal
      title="Review timeline entry"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            Save entry
          </Button>
        </>
      }
    >
      <p className="modal-intro">
        Review generated wording before saving. This entry remains linked to the
        original passage.
      </p>
      <label>
        Entry title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Event date
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <label>
        Date status
        <select
          value={dateKind}
          onChange={(event) =>
            setDateKind(event.target.value as TimelineEntry["dateKind"])
          }
        >
          <option value="exact">Exact</option>
          <option value="approximate">Approximate</option>
          <option value="disputed">Disputed</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>
      <label>
        Description
        <textarea
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
    </Modal>
  )
}
