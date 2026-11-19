import {
  ArrowLeft,
  Menu,
  PanelRightOpen,
} from "lucide-react"
import { cases, proceedings } from "../../data/demo"
import { useApp } from "../../state/AppContext"
import { Button, IconButton, rememberModalTrigger } from "../ui"

export function ContextBar({
  onMenu,
  onSource,
  privateMode = false,
}: {
  onMenu: () => void
  onSource: () => void
  privateMode?: boolean
}) {
  const { state, dispatch } = useApp()
  const activeCase = cases.find((item) => item.id === state.activeCaseId)!
  const proceeding = proceedings.find(
    (item) => item.id === activeCase.proceedingId,
  )!
  return (
    <header className="context-bar" data-view={state.view}>
      <IconButton
        label="Open navigation"
        icon={Menu}
        className="mobile-menu"
        onClick={(event) => {
          rememberModalTrigger(event.currentTarget)
          onMenu()
        }}
      />
      {state.view !== "chat" && (
        <IconButton
          label="Back to conversation"
          icon={ArrowLeft}
          onClick={() => dispatch({ type: "navigate", view: "chat" })}
        />
      )}
      <div className="context-bar__identity">
        <strong>
          {state.view === "chat" ? "Compare your records" : activeCase.name}
        </strong>
        <span>
          {state.view === "chat"
            ? `${activeCase.name} · ${proceeding.name}`
            : proceeding.name}
        </span>
      </div>
      <span className="demo-pill">{privateMode ? "Private workspace" : "Fictional demo"}</span>
      <Button
        icon={PanelRightOpen}
        variant="ghost"
        className="source-reopen"
        onClick={(event) => {
          rememberModalTrigger(event.currentTarget)
          onSource()
        }}
        disabled={!state.selectedPassageId}
        title={
          state.selectedPassageId
            ? "Open selected source"
            : "Select a citation to open its source"
        }
      >
        Source
      </Button>
    </header>
  )
}
