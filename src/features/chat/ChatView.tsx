import {
  ArrowUp,
  CalendarDays,
  Check,
  ChevronRight,
  Clipboard,
  FilePlus2,
  FileText,
  PenLine,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Volume2,
  X,
} from "lucide-react"
import {
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
} from "react"
import { Monogram } from "../../components/brand"
import { sampleQuestion, sampleResponse } from "../../data/demo"
import { askAssistant } from "../../services/ai"
import { getActiveMatterId } from "../../services/activeMatter"
import { useApp } from "../../state/AppContext"
import type { Attachment, Message as MessageType } from "../../types"
import {
  Button,
  EmptyState,
  IconButton,
  ReadingSurface,
  rememberModalTrigger,
} from "../../components/ui"

function CitationChip({
  passageId,
  label,
  index,
}: {
  passageId: string
  label: string
  index: number
}) {
  const { state, dispatch } = useApp()
  return (
    <button
      id={`citation-${passageId}`}
      className={`citation-chip ${
        state.selectedPassageId === passageId ? "is-selected" : ""
      }`}
      aria-label={`Open source ${index}: ${label}`}
      onClick={(event) => {
        rememberModalTrigger(event.currentTarget)
        dispatch({ type: "setSource", passageId })
      }}
    >
      <span className="citation-chip__num" aria-hidden="true">
        {index}
      </span>
      <span>{label}</span>
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  )
}

function localVoice() {
  if (!("speechSynthesis" in window)) return undefined
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.localService && voice.lang.startsWith("en"))
}

function Message({ message }: { message: MessageType }) {
  const { dispatch } = useApp()
  const [copied, setCopied] = useState(false)
  const paragraphs = message.body.split("\n\n")
  const isUser = message.role === "user"
  const time = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.body)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable: leave the button unchanged */
    }
  }
  /* Read aloud only uses an on-device voice, so message text is never sent to a speech service. */
  const speak = () => {
    const voice = localVoice()
    if (!voice) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message.body)
    utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }
  return (
    <article className={`message message--${message.role}`}>
      <span className="message__avatar">
        {isUser ? (
          <UserRound size={24} aria-hidden="true" />
        ) : (
          <Monogram size={44} />
        )}
      </span>
      <div className="message__bubble">
        {message.sample && (
          <div className="message__meta">
            <span>
              <Sparkles size={13} />
              Sample response
            </span>
          </div>
        )}
        <div className="message__body">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0 && message.citations && paragraph.length < 40
                  ? "message__lead"
                  : undefined
              }
            >
              {paragraph}
            </p>
          ))}
        </div>
        {message.citations && (
          <div className="message__citations">
            {message.citations.map((citation, index) => (
              <CitationChip
                key={citation.passageId}
                {...citation}
                index={index + 1}
              />
            ))}
            <button
              className="citation-chip"
              onClick={() => dispatch({ type: "navigate", view: "timeline" })}
            >
              <CalendarDays size={18} aria-hidden="true" />
              <span>Review timeline entry</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        {isUser ? (
          <time className="message__time">{time}</time>
        ) : (
          <div className="message__tools">
            <span>
              <IconButton
                label={copied ? "Copied" : "Copy message"}
                icon={copied ? Check : Clipboard}
                onClick={copy}
              />
              <IconButton
                label="Read aloud with an on-device voice"
                icon={Volume2}
                onClick={speak}
              />
            </span>
            <time className="message__time">{time}</time>
          </div>
        )}
      </div>
    </article>
  )
}

function Composer() {
  const { state, dispatch } = useApp()
  const text = state.composerDrafts[state.activeConversationId] ?? ""
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isComposing, setIsComposing] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || "Unknown type",
        size: file.size,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      })),
    ])
    event.target.value = ""
  }

  const submit = async () => {
    const value = text.trim()
    if (!value && !attachments.length) return
    setStatus("loading")
    const now = new Date().toISOString()
    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      conversationId: state.activeConversationId,
      role: "user",
      body: value || `Attached ${attachments.length} local file(s) for review.`,
      createdAt: now,
    }
    const matterId = getActiveMatterId()

    try {
      if (matterId) {
        if (!value) throw new Error("Enter a text question for source-grounded analysis.")
        const insight = await askAssistant({ matterId, question: value })
        const sections = [
          insight.answer,
          insight.verifiedFacts.length
            ? `What the records show\n${insight.verifiedFacts.map((item) => `• ${item}`).join("\n")}`
            : "",
          insight.unverifiedOrMissing.length
            ? `Unverified or missing\n${insight.unverifiedOrMissing.map((item) => `• ${item}`).join("\n")}`
            : "",
          insight.uncertainty.length
            ? `Uncertainty notes\n${insight.uncertainty.map((item) => `• ${item}`).join("\n")}`
            : "",
          insight.suggestedAction
            ? `Suggested next action\n${insight.suggestedAction}`
            : "",
        ].filter(Boolean)
        const response: MessageType = {
          id: crypto.randomUUID(),
          conversationId: state.activeConversationId,
          role: "assistant",
          body: sections.join("\n\n"),
          citations: insight.citations.map((citation) => ({
            passageId: citation.passageId,
            label: citation.label,
            sourceId: citation.sourceId,
            pageNumber: citation.pageNumber ?? undefined,
          })),
          createdAt: now,
        }
        dispatch({ type: "addMessages", messages: [userMessage, response] })
      } else {
        const isSample =
          value.toLowerCase().includes("provider email") &&
          value.toLowerCase().includes("service summary")
        const response: MessageType = isSample
          ? {
              id: crypto.randomUUID(),
              conversationId: state.activeConversationId,
              role: "assistant",
              body: sampleResponse,
              sample: true,
              citations: [
                { passageId: "passage-001", label: "DOC-001 · Email body" },
                { passageId: "passage-002", label: "DOC-002 · Page 2" },
              ],
              createdAt: now,
            }
          : {
              id: crypto.randomUUID(),
              conversationId: state.activeConversationId,
              role: "assistant",
              body: "Live AI is not connected for this demo conversation. Your question was saved locally.",
              sample: true,
              createdAt: now,
            }
        await new Promise((resolve) => window.setTimeout(resolve, 650))
        dispatch({ type: "addMessages", messages: [userMessage, response] })
      }
      setAttachments([])
      setStatus("idle")
    } catch (error) {
      const response: MessageType = {
        id: crypto.randomUUID(),
        conversationId: state.activeConversationId,
        role: "assistant",
        body:
          error instanceof Error
            ? `The AI request could not be completed: ${error.message}`
            : "The AI request could not be completed.",
        createdAt: now,
      }
      dispatch({ type: "addMessages", messages: [userMessage, response] })
      setStatus("error")
    }
  }

  const handleKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !isComposing &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="composer-wrap">
      {attachments.length > 0 && (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <div className="attachment-chip" key={attachment.id}>
              <FileText size={16} />
              <span>
                <strong>{attachment.name}</strong>
                <small>{attachment.type} · Local until refresh</small>
              </span>
              <IconButton
                label={`Remove ${attachment.name}`}
                icon={X}
                onClick={() =>
                  setAttachments((items) =>
                    items.filter((item) => item.id !== attachment.id),
                  )
                }
              />
            </div>
          ))}
        </div>
      )}
      <div className="composer">
        <label className="attach-button" title="Attach a local file">
          <Plus size={26} />
          <span className="sr-only">Attach a local file</span>
          <input type="file" multiple onChange={addFiles} />
        </label>
        <textarea
          ref={inputRef}
          value={text}
          rows={1}
          placeholder="Ask about your records..."
          aria-label="Message"
          onChange={(event) =>
            dispatch({
              type: "setComposer",
              conversationId: state.activeConversationId,
              value: event.target.value,
            })
          }
          onKeyDown={handleKey}
          onCompositionStart={(_: CompositionEvent) => setIsComposing(true)}
          onCompositionEnd={(_: CompositionEvent) => setIsComposing(false)}
        />
        <button
          className="send-button"
          aria-label="Send message"
          onClick={submit}
          disabled={
            (!text.trim() && !attachments.length) || status === "loading"
          }
        >
          {status === "loading" ? (
            <span className="spinner" />
          ) : (
            <ArrowUp size={20} />
          )}
        </button>
      </div>
      <div className="composer__hint">
        <span>
          {status === "loading"
            ? "Preparing a sample response…"
            : "Enter to send · Shift+Enter for a new line"}
        </span>
        <span>
          <Check size={13} />
          Draft saved locally
        </span>
      </div>
    </div>
  )
}

export function ChatView() {
  const { state, dispatch } = useApp()
  const conversation = state.conversations.find(
    (item) => item.id === state.activeConversationId,
  )!
  const messages = conversation.messageIds
    .map((id) => state.messages.find((message) => message.id === id))
    .filter(Boolean) as MessageType[]
  const alreadyAsked = messages.some(
    (message) => message.body === sampleQuestion,
  )
  const useSuggestion = (question: string) =>
    dispatch({
      type: "setComposer",
      conversationId: state.activeConversationId,
      value: question,
    })
  return (
    <main className="chat-view">
      <div className="message-scroll">
        <div className="conversation">
          {messages.length === 0 ? (
            <EmptyState icon={Sparkles} title="Where would you like to begin?">
              <p>Ask a question or choose a practical starting point.</p>
              <div className="suggestion-grid">
                {[
                  "Review a document",
                  "Build a timeline",
                  "Prepare for a hearing",
                ].map((label) => (
                  <Button
                    key={label}
                    variant="secondary"
                    onClick={() => useSuggestion(label)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </EmptyState>
          ) : (
            <>
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {!alreadyAsked && (
                <ReadingSurface className="sample-prompt">
                  <div>
                    <span>Try an example</span>
                    <p>{sampleQuestion}</p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => useSuggestion(sampleQuestion)}
                  >
                    Use this question
                  </Button>
                </ReadingSurface>
              )}
            </>
          )}
        </div>
      </div>
      <Composer />
      <nav className="quick-actions" aria-label="Quick actions">
        <button className="pill" onClick={() => dispatch({ type: "navigate", view: "evidence" })}>
          <FilePlus2 size={24} aria-hidden="true" />
          Add records
        </button>
        <button className="pill" onClick={() => dispatch({ type: "navigate", view: "evidence" })}>
          <Search size={24} aria-hidden="true" />
          Search evidence
        </button>
        <button className="pill" onClick={() => dispatch({ type: "navigate", view: "timeline" })}>
          <CalendarDays size={24} aria-hidden="true" />
          View timeline
        </button>
        <button className="pill" onClick={() => dispatch({ type: "navigate", view: "drafts" })}>
          <PenLine size={24} aria-hidden="true" />
          Create draft
        </button>
      </nav>
    </main>
  )
}
