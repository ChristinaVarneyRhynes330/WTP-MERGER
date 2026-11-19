# We The Parent (WTP) - Copilot Implementation Guide

**Context for AI Assistant:**
You are acting as a Senior Full-Stack Engineer helping to build "We The Parent," a secure, React/Next.js/Supabase application for pro se litigants. We have completed Sprint 1 (UI Shell, Shadcn components, basic routing, and static CSS).

We are now entering Sprint 2. Your goal is to help the user implement the following phases step-by-step. Do not skip ahead. Wait for the user to ask for the code for each specific step.

---

## Phase 1: Visual Refinement (Deep Ocean & Copper Rose)
**Goal:** Update the CSS variables to match the user's specific mood boards (deep oceanic teals, dark wet rose, and rich copper).

**Instructions for Copilot:**
When the user asks to "Execute Phase 1", update `src/index.css`. Modify the `:root` and `[data-theme="rose"]` blocks to incorporate these specific hex codes:
*   **Deep Ocean/Teal Base:** `#0F1A1C` transitioning to `#183A3D`
*   **Copper/Rose Gold Accents:** `#B67872`, `#D6B9AE`, and `#E0C2AE`
*   **Text/Parchment:** `#F2E9E3`
Update the `background` linear-gradients in `.atmosphere` and the `--rim-gradient` in `src/gold-glass.css` to reflect a darker, more dramatic contrast between the deep teal background and the glowing copper UI borders.

---

## Phase 2: Database Foundation & Storage (Supabase)
**Goal:** Apply the database schema and set up the immutable storage bucket for evidence.

**Instructions for Copilot:**
When the user asks to "Execute Phase 2", provide the terminal commands and SQL snippets to:
1.  Initialize the Supabase project locally (`npx supabase init` and `npx supabase start` if needed, or link to a remote project).
2.  Apply the existing migration file: `supabase/migrations/20261002170000_founder_alpha_foundation.sql`.
3.  Write the additional SQL to enable the `pgvector` extension and create a `source_chunks` table for Retrieval-Augmented Generation (RAG).
    *   *Schema needed:* `id`, `matter_id`, `source_id`, `content` (text), `embedding` (vector 768 or 1536 depending on Gemini model).
    *   *RPC needed:* `match_documents` function for cosine similarity search.

---

## Phase 3: The "Scribe" Edge Function (Automated Ingestion)
**Goal:** Build the backend pipeline that automatically extracts text from uploaded PDFs/images and vectorizes it.

**Instructions for Copilot:**
When the user asks to "Execute Phase 3", write the code for `supabase/functions/make-server-82d9c8b6/index.ts` (or a dedicated `ingest-document` function):
1.  Create a Supabase Database Webhook trigger that listens for `INSERT` on the `sources` table.
2.  Write the Edge Function logic to:
    *   Download the file from the `matter-originals` bucket.
    *   Send the file payload to the **Google Gemini API (Vision/Pro)** for high-fidelity OCR and text extraction.
    *   Chunk the returned text (e.g., by page or paragraph).
    *   Call the Gemini Embedding API to generate vector embeddings for each chunk.
    *   Insert the chunks and embeddings into the `source_chunks` table.

---

## Phase 4: Source-Grounded Chat (RAG Integration)
**Goal:** Connect the frontend chat UI to the vectorized database so the AI only answers using uploaded evidence.

**Instructions for Copilot:**
When the user asks to "Execute Phase 4", refactor `src/features/chat/ChatView.tsx` and create the corresponding backend API call:
1.  Take the user's input from the `<Composer />` component.
2.  Create a frontend service function (e.g., in `src/services/ai.ts`) that calls a new Supabase Edge Function: `ask-assistant`.
3.  In the `ask-assistant` Edge Function:
    *   Convert the user's question into a vector embedding.
    *   Call the `match_documents` RPC to fetch the top 5 most relevant chunks from `source_chunks` for the active `matter_id`.
    *   Construct a strict system prompt combining the retrieved chunks and the user's question.
    *   Call the Gemini API to generate the response and extract citations.
4.  Update the UI state to stream or display the response, replacing the `sampleResponse` mock data.

---

## Phase 5: The Human Verification Loop
**Goal:** Allow the parent to verify AI-extracted text and facts, moving the status from `Unverified` to `Verified by User`.

**Instructions for Copilot:**
When the user asks to "Execute Phase 5", update `src/features/evidence/SourceWorkbench.tsx`:
1.  Add a UI component (a button group or toggle) below the extracted text allowing the user to select: `Verify Extraction`, `Flag Anomaly`, or `Contest Record`.
2.  Write the Supabase client call to update the `confirmation_state` column in the `sources` table based on the user's selection.
3.  Update the UI to immediately reflect the new status (e.g., changing the badge color to Sage Green for verified).

---
**User/Dev Note:** To begin, simply open your Copilot Chat and type:
*"I am ready to Execute Phase 1 of the COPILOT_IMPLEMENTATION_GUIDE.md. Please provide the updated CSS."*
```eof

### How to use this file:
1. Save the generated text above into a new file in the root of your VS Code project named `COPILOT_IMPLEMENTATION_GUIDE.md`.
2. Open your GitHub Copilot Chat window in VS Code.
3. Type: `@workspace I have added COPILOT_IMPLEMENTATION_GUIDE.md. Please read it, and let's execute Phase 1 to match my new color palette.`

Copilot will read the guide, understand exactly where the project stands, look at your current CSS, and generate the exact code needed to inject those moody teals and coppers into your UI.

WE THE PARENT™ — Master Implementation Plan
Copilot spec (We_The_Parent_Merged_Base44_UI).

1. Vision & Principles
Case intelligence platform for child-welfare/dependency cases.

Human Over AI: AI assists; evidence informs; parent decides. No legal advice, predictions, or dependence.

Capability Compounding: Teach evidence/procedure on-the-job as confirmed intelligence grows.

Separation: Separate immutable originals from OCR, summaries, recollections, and interpretations.

Discipline: Discrepancy≠falsehood; repetition≠corroboration; pattern≠intent; recollection≠official record; AI suggestion≠confirmed fact.

Dual Voice: Represented (attorney-ready) or Self-represented (plain-language + clerk reminders).

Identity Modes: Parent, Litigant, Witness, Investigator, Strategist, Human Mode (clean exit).

2. Visual System & 3-Pane UX
Palette: Deep teal (#0F1A1C→#183A3D), botanical chiaroscuro (z:0), copper/rose 1-3px rims (#B67872, #D6B9AE, #E0C2AE). Optical glass (blur 20-24px) nav/composer; frosted cards; parchment (#F2E9E3/#F8F0EE, dark ink) for originals.

Type/A11y: Serif (Newsreader/Cormorant/Playfair), sans (Figtree/Plus Jakarta/Inter), mono (JetBrains Mono). WCAG AA, 44px targets, Large Text, Reduced Transparency/Motion.

3-Pane Shell: Left Rail (240-260px, collapsible: monogram, case switcher w/ confirm, nav, recents, guardrail); Center (Context Bar + view + Command Bar: text, voice, upload, quick actions); Right Pane (340-480px, resizable Source Workbench: parchment, quotes, pages, metadata, verification, linked work).

Contracts: [DOC-ID·p.N] opens Right Pane to exact span keeping scroll/drafts; close restores focus. 3 panes (desktop), drawer+overlay (tablet), 1 view+bottom nav+sheet (phone). Explicit errors (OCR/PDF, offline, retry, expired session); never fake success.

3. Modules (Unified Graph)
Overview: Daily brief (hearings, docs, issues, tasks, voice).

Chat: Grounded AI (AiInsightCard: records show, missing, uncertainty, CitationPills, actions) + read-aloud/dictation.

Evidence: PDFs, images, media, emails, texts, Verbal Diary. SHA-256 originals, parchment viewer, Statement Tagging, epistemic tags, status (Private→Ruled upon).

Timeline: Event vs. Documented Date + lag, certainty (exact/approx/disputed/unknown), conflicts, source links.

Issues: Linked quotes, agrees vs. contradicts, missing records (1-click task), alternatives, Source/Correction Chains.

Drafting: Attorney/Court Questions, Record Requests, Timelines, Hearing Packets. Permanent "DRAFT — NOT FILED OR SERVED" stamp; clickable citations.

Hearing/Courtroom Mode: 2-3 issue packet; high-contrast Courtroom Mode (packet, exhibits, 4-field logger: Requested/Discussed/Ruled/To verify); order reconciliation.

Learning Lab: 10 modules w/ speed-controlled audio narration, checks, reflections.

Tasks & Audit: Stage-grouped tasks + immutable Audit Log.

Settings: Multi-matter, representation/counsel, themes, a11y, guardrails.

4. AI ("Case Brain") & Security
Scribe: Upload→make-server-82d9c8b6 (auth, RLS, SHA-256, matter-originals, sources/source_files)→ingest-source OCRs via Gemini→derivatives (ai_suggested), chunks, embeds (text-embedding-004, 768d)→source_chunks.

RAG (ask-assistant): Embed query→match_source_chunks RPC (RLS by matter_id)→chunks+statements+voice→Gemini JSON (answer, verified_facts, unverified_or_missing, uncertainty, citations, suggested_action)→verify verbatim quotes.

Taxonomy: Epistemic (Allegation, Observation, Parent Recollection, Professional Opinion, Inference, Court Finding); Confirmation (ai_suggested, user_confirmed, disputed, unverified, needs_source). Teach distinctions on discrepancies.

Security: Strict User→Matter→Sources RLS (never disable); protect_original_file trigger; signed URLs + SHA-256 (integrity.ts). Base: 20261002170000_founder_alpha_foundation.sql.

5. Phased Roadmap
P1: Verify manifests, Tailwind v4 build, teal/copper tokens (index.css, gold-glass.css, public.css).

P2: Migration 20261118000000_ai_retrieval_and_modules.sql (pgvector, source_chunks+RLS, match_source_chunks, matters cols, hearing_notes, learning_progress); update database.ts.

P3: ingest-source (GEMINI_API_KEY): OCR→derivatives, chunk, 768d embed→source_chunks, processing_jobs.

P4: ask-assistant & generate-draft Edge Functions + services/ai.ts.

P5: Isolate #/chat demo from #/app; strip Base44/TanStack from shell/* & evidence/*; wire 3-pane citations.

P6: Wire Evidence (upload, SHA-256 download, ParchmentPage, CitationForm, Verify/Flag/Contest→confirmations), Chat (AiInsightCard), Timeline (events).

P7: Wire issues/, drafts/ (work_products), hearing/ (Courtroom Mode+hearing_notes), learning/ (10 modules+AudioNarration), tasks/+audit_log.

P8: 2-user RLS, anon block, SHA-256 round-trip, error states (SECURITY-GATES.md), Vercel deploy.