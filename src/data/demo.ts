import type { AppState, Case, Proceeding } from "../types"

export const cases: Case[] = [
  {
    id: "case-a",
    name: "Sample family case A",
    shortName: "Family case A",
    proceedingId: "proc-a",
  },
  {
    id: "case-b",
    name: "Sample family case B",
    shortName: "Family case B",
    proceedingId: "proc-b",
  },
]

export const proceedings: Proceeding[] = [
  { id: "proc-a", caseId: "case-a", name: "Service record review" },
  { id: "proc-b", caseId: "case-b", name: "Parenting schedule review" },
]

export const sampleQuestion =
  "Compare the provider email with the service summary. What needs clarification?"

export const sampleResponse =
  "The records differ.\n\nThe records describe the September 12 appointment differently. The provider email says the appointment needed to be cancelled because a provider was unavailable, while the later service summary says the parent did not attend.\n\nThese are documentary statements in two records—not verification of what occurred. The records do not resolve when the cancellation notice was sent or received, whether the appointment remained on the schedule, whether any later scheduling change occurred, or whether a replacement appointment was offered.\n\nWhat needs clarification: cancellation timing, who received notice and when, any scheduling changes, and whether a replacement date was offered. The discrepancy alone does not establish intent or dishonesty."

export const initialState: AppState = {
  activeCaseId: "case-a",
  activeConversationId: "conv-a-1",
  view: "chat",
  previousView: "chat",
  selectedPassageId: undefined,
  conversations: [
    {
      id: "conv-a-1",
      caseId: "case-a",
      title: "Appointment record differences",
      messageIds: ["m-demo-q", "m-demo-a"],
      updatedAt: "2026-09-16T09:00:00Z",
    },
    {
      id: "conv-a-2",
      caseId: "case-a",
      title: "Questions for provider",
      messageIds: [],
      updatedAt: "2026-09-15T16:00:00Z",
    },
    {
      id: "conv-b-1",
      caseId: "case-b",
      title: "October schedule notes",
      messageIds: [],
      updatedAt: "2026-10-02T11:00:00Z",
    },
  ],
  messages: [
    {
      id: "m-demo-q",
      conversationId: "conv-a-1",
      role: "user",
      body: "Compare the provider email with the service summary. What needs clarification?",
      createdAt: "2026-09-16T10:14:00Z",
    },
    {
      id: "m-demo-a",
      conversationId: "conv-a-1",
      role: "assistant",
      body: sampleResponse,
      sample: true,
      citations: [
        { passageId: "passage-001", label: "DOC-001 · Email body" },
        { passageId: "passage-002", label: "DOC-002 · Page 2" },
      ],
      createdAt: "2026-09-16T10:14:00Z",
    },
  ],
  documents: [
    {
      id: "DOC-001",
      caseId: "case-a",
      title: "Provider appointment email",
      type: "Email",
      documentDate: "2026-09-10",
      receivedFrom: "Sample provider",
      tags: ["appointment", "scheduling"],
      status: "Ready",
      fictional: true,
    },
    {
      id: "DOC-002",
      caseId: "case-a",
      title: "Service summary",
      type: "Service record",
      documentDate: "2026-09-15",
      receivedFrom: "Sample agency",
      tags: ["attendance", "services"],
      status: "Ready",
      fictional: true,
    },
    {
      id: "DOC-B01",
      caseId: "case-b",
      title: "October parenting schedule",
      type: "Schedule",
      documentDate: "2026-09-28",
      receivedFrom: "Parent notes",
      tags: ["schedule"],
      status: "Ready",
      fictional: true,
    },
  ],
  passages: [
    {
      id: "passage-001",
      documentId: "DOC-001",
      caseId: "case-a",
      location: "Email body",
      text: "We need to cancel the September 12 appointment because a provider is unavailable. We will contact you to arrange another date.",
      interpretation:
        "The email records a planned cancellation and says another date would be arranged. It does not establish when the message was received.",
      assertionType: "documentary statement",
    },
    {
      id: "passage-002",
      documentId: "DOC-002",
      caseId: "case-a",
      location: "Page 2 · Service activity",
      text: "The parent did not attend the appointment scheduled for September 12.",
      interpretation:
        "The summary records non-attendance. It does not address the earlier cancellation email or whether the appointment remained scheduled.",
      assertionType: "conflicting account",
    },
    {
      id: "passage-b01",
      documentId: "DOC-B01",
      caseId: "case-b",
      location: "Week 2",
      text: "Exchange moved to Sunday at 10:00 a.m. by agreement.",
      interpretation:
        "A parent-created schedule note for the separate sample case.",
      assertionType: "documentary statement",
    },
  ],
  timeline: [
    {
      id: "tl-a-existing",
      caseId: "case-a",
      title: "Provider appointment cancellation email dated",
      description:
        "Provider email states that the September 12 appointment needed to be cancelled.",
      eventDate: "2026-09-10",
      dateKind: "exact",
      sourcePassageIds: ["passage-001"],
    },
    {
      id: "tl-b-existing",
      caseId: "case-b",
      title: "Schedule note created",
      description:
        "October parenting schedule records an agreed exchange time.",
      eventDate: "2026-09-28",
      dateKind: "exact",
      sourcePassageIds: ["passage-b01"],
    },
  ],
  notes: [],
  drafts: [
    {
      id: "draft-a-1",
      caseId: "case-a",
      title: "Questions about the September appointment",
      type: "Question list",
      body: "Confirm when the cancellation notice was sent and received.\nConfirm whether a replacement appointment was offered.",
      sourcePassageIds: ["passage-001", "passage-002"],
      updatedAt: "2026-09-16T10:15:00Z",
    },
  ],
  hearingPlans: [
    {
      id: "hearing-a",
      caseId: "case-a",
      issues: [
        "Different descriptions of the September 12 appointment",
        "Notice and replacement scheduling",
      ],
      questions: [
        "When was the cancellation notice sent and received?",
        "Was the appointment formally removed from the schedule?",
        "Was a replacement date offered?",
      ],
      sourcePassageIds: ["passage-001", "passage-002"],
      notes:
        "Keep the focus on what each record says and what remains unknown.",
    },
  ],
  composerDrafts: {},
  preferences: {
    theme: "champagne",
    textScale: "default",
    reducedTransparency: false,
    reducedMotion: false,
  },
}
