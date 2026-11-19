# GitHub Copilot Instructions — `counsel-handoff/5D2026-2915` Branch

## 1. Branch Scope & Matter Context
- **Active Branch:** `counsel-handoff/5D2026-2915`
- **Matter Identity:** Fifth District Court of Appeal Case No. `5D2026-2915` (Lower Tribunal Case No. `05-2024-DP-000587-XXDP-BC`, 18th Judicial Circuit, Brevard County, Florida).
- **Assigned Appellate Counsel:** Thomas Butler (`CONFIDENTIAL — Butler Counsel Handoff`).
- **Purpose:** Private litigation command center, recursive Google Drive inventory explorer (~1,422 files), Evidence Record Pathways audit matrix, Preservation Red Flags log, and Counsel Q&A working agenda.
- **Architectural Rule:** Extend existing **We The Parent** shell primitives (`src/components/shell/AppShell.jsx`, `src/components/shell/LeftRail.jsx`, `src/components/shell/RightPane.jsx`), styling (`src/gold-glass.css`, `src/index.css`), and Supabase infrastructure (`src/lib/supabase.ts`). Do **not** introduce competing CSS frameworks, parallel UI kits, or unauthenticated data paths.

---

## 2. Security & Privacy Boundaries (NON-NEGOTIABLE)
1. **Strict Isolation from Public Routes:**
   - Never expose any route, navigation link, search result, sitemap entry, or teaser card referencing `5D2026-2915`, `05-2024-DP-000587-XXDP-BC`, or Butler Counsel Handoff assets inside public **We The Parent** views (`src/features/public/Public.tsx`, `src/features/site/Site.tsx`, or public landing pages).
   - Gate all counsel-handoff views behind authenticated session verification and explicit matter-level access checks (`src/services/auth.ts`, `src/services/matters.ts`).
2. **Database & Row-Level Security (RLS):**
   - Every new Supabase table (`handoff_files`, `evidence_pathways`, `preservation_flags`, `counsel_qa_items`) **must** have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` enforced in the same migration file.
   - Never allow `anon` role read/write policies on counsel handoff tables. Restrict policies to authenticated users explicitly authorized for the matter.
3. **Secrets & Server-Side AI Execution:**
   - Never expose `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or Google Drive OAuth credentials in client-side `VITE_*` variables or browser bundles.
   - All AI triage, summarization, and embedding calls must execute exclusively inside Supabase Edge Functions (`supabase/functions/`) or protected server-side API routes.
4. **Static Security Gates:**
   - Preserve and pass all existing repository security and integrity checks (`tests/security-static.test.mjs`, `tests/integrity.test.mjs`) before committing.

---

## 3. Design System & Visual Tokens
Maintain visual continuity with the **We The Parent** Champagne Frosted Glassmorphic Dark UI (`src/gold-glass.css`):
- **Deep Denim Base Background:** `#1A2530` (radial/ambient gradient base)
- **Frosted Glass Card Surface:** `rgba(43, 59, 75, 0.75)` (`#2B3B4B` with `backdrop-blur-md` / `backdrop-blur-xl`)
- **Sub-Panel / Input Well:** `rgba(26, 37, 48, 0.85)` (`#1A2530`)
- **Antique Cream Primary Text:** `#F7EEDF` (Secondary muted cream: `#D5C7B2` / `#B8A790`)
- **Dusty Rose Alert / Preservation Red Flag:** `#9B6364` (Soft highlight text: `#E5989B`)
- **Sage Green Verified / Confirmed Status:** `#7C8E72` (Soft highlight text: `#A8C69F`)
- **Warm Taupe Interactive / Active Accent:** `#8E6D57`
- **Champagne Gold Hairline Border:** `1px solid rgba(214, 189, 152, 0.32)` (Active focus/glow: `rgba(214, 189, 152, 0.45)`)
- **Typography:** Sans-serif UI headers/body (`Inter` / system-ui) paired with `font-mono` for case numbers, file tree paths (`Folder\Subfolder\File.ext`), MIME badges, and Florida appellate rule citations.

---

## 4. Procedural & Legal Record-Status Rules
Copilot must preserve exact legal distinctions across TypeScript interfaces, database schemas, UI labels, and AI prompts:
1. **Explicit Four-Part Procedural Status Tracking:**
   Every evidence record must track these distinct states separately—never collapse them into a single generic "verified" boolean:
   - `filed_with_clerk` (e.g., `Verified`, `Not verified`, `Reference Key`)
   - `offered_proffered` (e.g., `Considered`, `Proffered on Record`, `Not verified`, `N/A`)
   - `admitted_status` (e.g., `Court File`, `Admitted`, `Excluded (Proffered)`, `Not verified`)
   - `in_transmitted_roa` (e.g., `Included in ROA`, `Omitted / Unchecked`, `Check ROA Index`, `Not verified`)
2. **Florida Rule of Appellate Procedure 9.200(f) Guardrails:**
   - **`Rule 9.200(f)`:** Strictly applies to items filed with the clerk or considered in the lower tribunal (`05-2024-DP-000587-XXDP-BC`) that were omitted or truncated in the certified Record on Appeal (ROA). **Rule 9.200(f) cannot be used to introduce new evidence not presented below.**
   - **`Proffer / Record`:** Applies to evidence offered at a hearing/trial, excluded by the lower tribunal, and preserved on the record via formal proffer (`Fla. Stat. § 90.104(1)(b)`).
   - **`Unverified Source`:** Default state for Drive handoff assets whose clerk docket entry and ROA transmission have not yet been cross-checked. Never render unverified archive items as certified ROA citations.
3. **Preserve Drive File Tree Provenance:**
   - Always store and display the full hierarchical breadcrumb path (`full_tree_path`, e.g., `CONFIDENTIAL — Butler Counsel Handoff — 5D2026-2915 — 2026-11-16\00_READ_FIRST_AND_INDEX\...`) alongside the file name and Drive source URL.
   - Sync pipelines updating Drive metadata (`last_updated`, `file_url`, `mime_type`) must **never** overwrite human-edited `review_status`, `priority`, `pathway_rule`, `preservation_flag`, or `notes`.

---

## 5. Grounded AI & Human-in-the-Loop Standards
- **No Uncited Legal Claims:** Any AI triage output or document summary must cite the exact `record_id`, `file_name`, and `full_tree_path` from the database.
- **Explicit Verification State:** AI-generated pathway classifications, priority suggestions, or red-flag alerts must be stored/displayed as **Unverified AI Suggestions** until a user or counsel clicks **Accept Suggestion**.
- **Structured JSON Outputs:** Server-side Gemini calls must enforce strict JSON schemas (`suggested_pathway`, `confidence`, `rationale`, `citation_check`, `draft_note`) so outputs map deterministically to UI controls without freeform hallucination.

---

## 6. Preferred File & Code Conventions
- **TypeScript Strictness:** Define shared domain types in `src/types/counselHandoff.ts` (`HandoffFileRecord`, `PathwayRuleCode`, `PreservationFlag`, `CounselQaItem`).
- **Component Structure:**
  - `src/features/counsel-handoff/CounselHandoffWorkspace.tsx` (3-pane shell controller)
  - `src/features/counsel-handoff/FolderTreeSidebar.tsx` (collapsible hierarchy filter)
  - `src/features/counsel-handoff/EvidencePathwaysTable.tsx` (filterable pathways & red-flag list)
  - `src/features/counsel-handoff/EvidenceInspectorDrawer.tsx` (source preview, grounded AI triage card, live metadata editor)
  - `src/features/counsel-handoff/CounselQaAgenda.tsx` (active vs. archived Q&A threads)
- **Verification Checklist:** Before finishing any task on this branch, run `npm run build` (or `pnpm build`) and execute `node tests/security-static.test.mjs` to verify zero TypeScript errors and zero public-route leaks.