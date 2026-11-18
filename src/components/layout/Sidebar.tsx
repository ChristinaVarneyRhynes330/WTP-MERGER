import {
  CalendarDays,
  ChevronLeft,
  FileText,
  Gavel,
  MessageSquare,
  MessageSquarePlus,
  PanelLeftClose,
  PenLine as PenLineIcon,
  Settings,
  SquareArrowOutUpRight,
  X,
} from "lucide-react"
import { useRef } from "react"
import { Monogram } from "../brand"
import { cases } from "../../data/demo"
import { useApp } from "../../state/AppContext"
import type { ViewId } from "../../types"
import { IconButton, useMediaQuery, useModalSurface } from "../ui"

const navItems: {
  view: ViewId
  label: string
  icon: typeof FileText
}[] = [
  { view: "chat", label: "Conversation", icon: MessageSquare },
  { view: "evidence", label: "Evidence", icon: FileText },
  { view: "timeline", label: "Timeline", icon: CalendarDays },
  { view: "drafts", label: "Drafts", icon: PenLineIcon },
  { view: "hearing", label: "Hearing prep", icon: Gavel },
]

export function Sidebar({
  compact,
  open,
  onClose,
  onToggleCompact,
}: {
  compact: boolean
  open: boolean
  onClose: () => void
  onToggleCompact: () => void
}) {
  const { state, dispatch } = useApp()
  const drawerRef = useRef<HTMLElement>(null)
  const isModal = useMediaQuery("(max-width: 1023px)")
  useModalSurface(open && isModal, onClose, drawerRef)
  const conversations = state.conversations.filter(
    (conversation) => conversation.caseId === state.activeCaseId,
  )
  const selectCase = (caseId: string) => {
    const conversation = state.conversations.find(
      (item) => item.caseId === caseId,
    )
    if (conversation)
      dispatch({ type: "selectCase", caseId, conversationId: conversation.id })
  }
  return (
    <>
      {open && (
        <button
          className="drawer-scrim"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside
        ref={drawerRef}
        className={`sidebar ${compact ? "sidebar--compact" : ""} ${
          open ? "sidebar--open" : ""
        }`}
        aria-label="Workspace navigation"
        role={open && isModal ? "dialog" : undefined}
        aria-modal={open && isModal ? true : undefined}
        tabIndex={open && isModal ? -1 : undefined}
        inert={isModal && !open}
      >
        <div className="sidebar__brand">
          <button
            className="wordmark"
            onClick={() => dispatch({ type: "navigate", view: "chat" })}
          >
            <Monogram size={compact ? 52 : 104} />
            <span>We The Parent</span>
          </button>
          <IconButton
            label="Close navigation"
            icon={X}
            className="sidebar__mobile-close"
            onClick={onClose}
          />
        </div>

        <div className="case-switcher">
          {!compact && <label htmlFor="case-switcher">Active case</label>}
          <select
            id="case-switcher"
            value={state.activeCaseId}
            onChange={(event) => selectCase(event.target.value)}
            aria-label="Active case"
          >
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {compact ? item.shortName.slice(-1) : item.name}
              </option>
            ))}
          </select>
        </div>

        <nav className="primary-nav" aria-label="Case tools">
          {navItems.map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              title={label}
              className={`nav-row ${state.view === view ? "is-active" : ""}`}
              onClick={() => {
                dispatch({ type: "navigate", view })
                onClose()
              }}
            >
              <Icon size={19} />
              <span>{!compact && label}</span>
            </button>
          ))}
        </nav>
        {!compact && (
          <div className="recent">
            <p className="overline">Recent conversations</p>
            <button
              className="nav-row new-chat-row"
              onClick={() => dispatch({ type: "navigate", view: "chat" })}
            >
              <MessageSquarePlus size={18} aria-hidden="true" />
              <span>New conversation</span>
            </button>
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`conversation-link ${
                  conversation.id === state.activeConversationId &&
                  state.view === "chat"
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  dispatch({
                    type: "selectConversation",
                    conversationId: conversation.id,
                  })
                }
              >
                <span>{conversation.title}</span>
                <small>
                  {conversation.messageIds.length ? "Today" : "Sep 15"}
                </small>
              </button>
            ))}
          </div>
        )}


        <div className="sidebar__bottom">
          <a className="nav-row" href="#/" title="Return to website">
            <SquareArrowOutUpRight size={19} aria-hidden="true" />
            {!compact && <span>Return to website</span>}
          </a>
          <button
            className={`nav-row ${state.view === "settings" ? "is-active" : ""}`}
            title="Settings"
            onClick={() => dispatch({ type: "navigate", view: "settings" })}
          >
            <Settings size={19} aria-hidden="true" />
            {!compact && <span>Settings</span>}
          </button>
          <IconButton
            label={compact ? "Expand navigation" : "Collapse navigation"}
            icon={compact ? ChevronLeft : PanelLeftClose}
            onClick={onToggleCompact}
            className="compact-toggle"
          />
        </div>
      </aside>
    </>
  )
}
