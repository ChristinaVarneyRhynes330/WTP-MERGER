import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"
import { initialState } from "../data/demo"
import type {
  AppState,
  DocumentRecord,
  Draft,
  Message,
  Note,
  Preferences,
  TimelineEntry,
  ViewId,
} from "../types"

type NavigateAction = {
  type: "navigate"
  view: ViewId
}
type SelectCaseAction = {
  type: "selectCase"
  caseId: string
  conversationId: string
}
type SelectConversationAction = {
  type: "selectConversation"
  conversationId: string
}
type SetSourceAction = {
  type: "setSource"
  passageId?: string
}
type SetComposerAction = {
  type: "setComposer"
  conversationId: string
  value: string
}
type AddMessagesAction = {
  type: "addMessages"
  messages: Message[]
}
type AddTimelineAction = {
  type: "addTimeline"
  entry: TimelineEntry
}
type UpdateTimelineAction = {
  type: "updateTimeline"
  entry: TimelineEntry
}
type AddNoteAction = {
  type: "addNote"
  note: Note
}
type SaveDraftAction = {
  type: "saveDraft"
  draft: Draft
}
type SaveDocumentAction = {
  type: "saveDocument"
  document: DocumentRecord
}
type PreferencesAction = {
  type: "preferences"
  preferences: Partial<Preferences>
}
type ResetAction = { type: "reset" }
type Action = NavigateAction | SelectCaseAction | SelectConversationAction | SetSourceAction | SetComposerAction | AddMessagesAction | AddTimelineAction | UpdateTimelineAction | AddNoteAction | SaveDraftAction | SaveDocumentAction | PreferencesAction | ResetAction

const STORAGE_KEY = "we-the-parent-demo-v2"

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "navigate":
      return { ...state, previousView: state.view, view: action.view }
    case "selectCase":
      return {
        ...state,
        activeCaseId: action.caseId,
        activeConversationId: action.conversationId,
        selectedPassageId: undefined,
        view: "chat",
      }
    case "selectConversation":
      return {
        ...state,
        activeConversationId: action.conversationId,
        selectedPassageId: undefined,
        view: "chat",
      }
    case "setSource":
      return { ...state, selectedPassageId: action.passageId }
    case "setComposer":
      return {
        ...state,
        composerDrafts: {
          ...state.composerDrafts,
          [action.conversationId]: action.value,
        },
      }
    case "addMessages": {
      const ids = action.messages.map((message) => message.id)
      return {
        ...state,
        messages: [...state.messages, ...action.messages],
        conversations: state.conversations.map((conversation) =>
          conversation.id === state.activeConversationId
            ? {
                ...conversation,
                messageIds: [...conversation.messageIds, ...ids],
                updatedAt: new Date().toISOString(),
              }
            : conversation,
        ),
        composerDrafts: {
          ...state.composerDrafts,
          [state.activeConversationId]: "",
        },
      }
    }
    case "addTimeline":
      return { ...state, timeline: [...state.timeline, action.entry] }
    case "updateTimeline":
      return {
        ...state,
        timeline: state.timeline.map((entry) =>
          entry.id === action.entry.id ? action.entry : entry,
        ),
      }
    case "addNote":
      return { ...state, notes: [...state.notes, action.note] }
    case "saveDraft": {
      const exists = state.drafts.some((draft) => draft.id === action.draft.id)
      return {
        ...state,
        drafts: exists
          ? state.drafts.map((draft) =>
              draft.id === action.draft.id ? action.draft : draft,
            )
          : [...state.drafts, action.draft],
      }
    }
    case "saveDocument": {
      const exists = state.documents.some(
        (document) => document.id === action.document.id,
      )
      return {
        ...state,
        documents: exists
          ? state.documents.map((document) =>
              document.id === action.document.id ? action.document : document,
            )
          : [...state.documents, action.document],
      }
    }
    case "preferences":
      return {
        ...state,
        preferences: { ...state.preferences, ...action.preferences },
      }
    case "reset":
      return initialState
    default:
      return state
  }
}

function loadState(): AppState {
  try {
    const hashView = location.hash.replace("#/", "") as ViewId
    const initialView: ViewId = [
      "chat",
      "evidence",
      "timeline",
      "drafts",
      "hearing",
      "settings",
      "design-review",
      "signin",
      "learning",
    ].includes(hashView)
      ? hashView
      : "chat"
    const stored = localStorage.getItem(STORAGE_KEY)
    const seedPassage =
      initialView === "chat" && window.matchMedia("(min-width: 1280px)").matches
        ? "passage-001"
        : undefined
    if (!stored)
      return { ...initialState, view: initialView, selectedPassageId: seedPassage }
    const parsed = JSON.parse(stored) as AppState
    return {
      ...initialState,
      ...parsed,
      documents: (parsed.documents ?? initialState.documents).map((document) =>
        document.isLocal
          ? { ...document, status: "Reselect file to preview" }
          : document,
      ),
      view: initialView,
      selectedPassageId: seedPassage,
    }
  } catch {
    return initialState
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
  saveError: string | null
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const saveError = useMemo(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      return null
    } catch {
      return "Changes could not be saved in this browser. Keep this tab open to avoid losing work."
    }
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = state.preferences.theme
    document.documentElement.dataset.textScale = state.preferences.textScale
    document.documentElement.dataset.transparency = state.preferences
      .reducedTransparency
      ? "reduced"
      : "full"
    document.documentElement.dataset.motion = state.preferences.reducedMotion
      ? "reduced"
      : "full"
  }, [state.preferences])

  return (
    <AppContext.Provider value={{ state, dispatch, saveError }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error("useApp must be used inside AppProvider")
  return value
}
