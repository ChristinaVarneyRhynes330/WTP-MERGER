import { MessageSquare, Files, CalendarRange, SearchCheck, PenLine, Gavel, GraduationCap, ListChecks } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Conversation", to: "/conversation", icon: MessageSquare },
  { label: "Evidence", to: "/evidence", icon: Files },
  { label: "Timeline", to: "/timeline", icon: CalendarRange },
  { label: "Issues", to: "/issues", icon: SearchCheck },
  { label: "Drafts", to: "/drafts", icon: PenLine },
  { label: "Hearing Prep", to: "/hearing-prep", icon: Gavel },
  { label: "Learning Lab", to: "/learning", icon: GraduationCap },
  { label: "Follow-Up Tasks", to: "/tasks", icon: ListChecks },
];

export const MOBILE_NAV = NAV_ITEMS.slice(0, 4).concat([{ label: "More", to: "/more", icon: ListChecks }]);