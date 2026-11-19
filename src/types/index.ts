export type ThemeId = "champagne" | "rose" | "pearl"
export type ViewId = "chat" | "evidence" | "timeline" | "drafts" | "hearing" | "settings" | "design-review" | "signin"

export interface Case {
  id: string
  name: string
  shortName: string
  proceedingId: string
}

export interface Proceeding {
  id: string
  caseId: string
  name: string
}

export interface Citation {
  passageId: string
  label: string
  sourceId?: string
  pageNumber?: number
}

export interface Message {
  id: string
  conversationId: string
  role: "user" | "assistant"
  body: string
  citations?: Citation[]
  sample?: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  caseId: string
  title: string
  messageIds: string[]
  updatedAt: string
}

export interface DocumentRecord {
  id: string
  caseId: string
  title: string
  type: string
  documentDate?: string
  receivedFrom?: string
  tags: string[]
  status: "Ready" | "Local preview" | "Preview unavailable" | "Reselect file to preview"
  fictional?: boolean
  isLocal?: boolean
  localFileName?: string
  localMimeType?: string
  localFileSize?: number
}

export interface SourcePassage {
  id: string
  documentId: string
  caseId: string
  location: string
  text: string
  interpretation: string
  assertionType: "documentary statement" | "conflicting account" | "unknown"
}

export interface TimelineEntry {
  id: string
  caseId: string
  title: string
  description: string
  eventDate: string
  dateKind: "exact" | "approximate" | "unknown" | "disputed"
  sourcePassageIds: string[]
}

export interface Note {
  id: string
  caseId: string
  passageId: string
  body: string
  createdAt: string
}

export interface Draft {
  id: string
  caseId: string
  title: string
  type: string
  body: string
  sourcePassageIds: string[]
  updatedAt: string
}

export interface HearingPlan {
  id: string
  caseId: string
  issues: string[]
  questions: string[]
  sourcePassageIds: string[]
  notes: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  previewUrl?: string
}

export interface Preferences {
  theme: ThemeId
  textScale: "default" | "large"
  reducedTransparency: boolean
  reducedMotion: boolean
}

export interface AppState {
  activeCaseId: string
  activeConversationId: string
  view: ViewId
  previousView: ViewId
  selectedPassageId?: string
  messages: Message[]
  conversations: Conversation[]
  documents: DocumentRecord[]
  passages: SourcePassage[]
  timeline: TimelineEntry[]
  notes: Note[]
  drafts: Draft[]
  hearingPlans: HearingPlan[]
  composerDrafts: Record<string, string>
  preferences: Preferences
}
