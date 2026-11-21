# WE THE PARENT™ — Unified Product Design & UX Contract

> **File:** `design.md`  
> **Document ID:** WTP-DS-001  
> **Version:** 1.1 — reconciled development baseline  
> **Date:** 2026-11-21  
> **Repository:** `ChristinaVarneyRhynes330/WTP-MERGER`  
> **Working branch:** `feature/unified-private-matter-workspaces`  
> **Canonical integration destination:** `we-the-parent-app` is **provisional** under WTP-DEC-0006; repository selection remains pending formal approval.  
> **Status:** **WORKING DESIGN CONTRACT — screen-specific founder review required.** Not a production release, visual sign-off, or security certification.

## 0. Mandatory instructions for developers and AI coding agents

**Read this before modifying any WE THE PARENT screen.** This document preserves the original November 16 design contract and incorporates the founder's newer November 20–21 teal-black / dusty-rose / champagne direction and the independently preserved counsel module.

1. **Do not redesign the application globally.** Protect functioning layouts and change one approved surface at a time.
2. **Never infer approval from a screenshot, Canva prototype, polished preview, build success, or CSS suffix.** Record explicit founder acceptance by route and commit.
3. **Use the current product's bundled tokens and components wherever possible.** Do not create an unrelated second design system to reproduce a mockup.
4. **Do not equate visually connected interfaces with shared data permissions.** The counsel bridge is disconnected pending server-enforced object grants.
5. **Do not invent working features.** If OCR, AI, upload, deadlines, notifications, preservation, counsel invitation, or audit is unimplemented, show truthful states.
6. **Preserve demo/real-user separation and original bytes.** Use fictional content for product testing until the designated security gates pass.
7. **Before any scoped edit:** capture the existing screen, record what must remain unchanged, specify the targeted differences, implement, test, and request a founder verdict.
8. This file is the **design/UX contract**. Security, evidence, data schema, and migration specifications still govern their respective technical domains.

### 0.1 Authority and conflicts

Apply authority in this order:

1. Latest explicit founder approval **of that particular screen or change**.
2. Founder-supplied screenshots, annotated corrections, HTML reference, and recorded design decisions **for that screen**.
3. The November 16, 2026 uploaded `design.md` v1.0 and this reconciled contract, subject to newer screen-specific decisions.
4. Historically referenced design-studio artifacts and provenance documents **only if retrieved and compared**.
5. Current React/CSS implementation as evidence of what exists, **not** proof of what is approved.

If two references differ, **record the conflict and preserve the last confirmed working screen**. Newer iterations are not automatically replacements and older V4/V5/V6/V7/V8 treatments are not additive stylesheet layers.

Historic documents such as `docs/WTP-CANONICAL-IMPLEMENTATION-BASELINE.md`, `docs/DESIGN-PROVENANCE.md`, `docs/SCREEN-VISUAL-FIDELITY-MATRIX.md`, and `docs/FOUNDER-VISUAL-REFERENCE-2026-11-02.md` were cited by v1.0 but **not found at those paths on the inspected WTP-MERGER development branch**. Their absence at those paths does not establish that they never existed. Locate the originals before treating historic screen conflicts as resolved.

### 0.2 Approved direction versus pending acceptance

- **Direction accepted for implementation:** preserve existing public/demo layouts; bring the authenticated application toward the public site's midnight teal-black, rose-peony, ivory and champagne atmosphere, using the useful workflow elements of the Canva Parent MVP prototype.
- **Not yet founder-accepted:** pixel-level appearance of the most recent private Parent and Counsel branch builds; precise rim weights; exact component proportions; type sizes across devices; per-screen layout adjustments.
- **Do not globally change** font families, backgrounds, theme variants, or screen structure just because a reference screenshot uses a different implementation.

---

## 1. Brand promise and product philosophy

- **Brand:** WE THE PARENT™
- **Primary positioning:** **Your Case. Your Evidence. Your Understanding. Your Voice.**
- **Product north star:** **Chat-first. Case-aware. Evidence-grounded. Glassmorphic.**
- **Architecture expressed in UX:** **Structured underneath. Conversational on top. Complexity underneath. Calm on the surface.**
- **Public/demo philosophy in current references:** **The AI assists. The evidence informs. The human decides.**
- **Alternative historical copy:** “The AI assists. The evidence informs. The parent decides.” Preserve the variation until placement-specific copy is approved.

The product helps parents understand procedures, preserve and review records, trace claims to sources, organize questions, prepare their own work, access contextual education, and collaborate selectively with authorized professionals. It is **not a law firm**, does not replace counsel, does not guarantee outcomes, and must not portray an unverified assertion as a finding.

### Language and cognition

Use respectful, composed, plain language. Prefer “This record states…”, “Two accounts differ…”, “Source review needed”, and “Unresolved” to unsubstantiated accusations or conclusions. Build for high cognitive load: clear next actions, limited clutter, persistent matter context, readable source excerpts, progressive disclosure, and synchronized text + audio for supported learning activities.

Always distinguish:

| Axis | Required distinct states |
|---|---|
| Statement | direct quotation, observation, allegation, testimony, recollection, characterization, judicial finding, inference, unknown |
| Evidence | source, potential evidence, proposed exhibit, admitted evidence |
| Procedure | draft, filed, served, noticed, argued, ruled upon |
| Verification | unverified, needs source, proposed/suggested, disputed, user-confirmed with reviewer and basis |
| Dates | event, document, filing, received, uploaded, discovered, approximate, range, unknown |
| Case operation | empty, ready, processing, success, failure/retry, permission denied, partial result, not synced |

**A verified quotation does not establish the truth of the quoted allegation.** A registered document is not necessarily preserved, filed, admissible, or included in an appellate record.

---

## 2. Visual foundation

### 2.1 Newer default color direction

The newer public-site screenshot establishes the target **environmental** balance: midnight teal-black is dominant; peonies and dusty rose supply warmth; ivory carries the copy; champagne is a restrained metallic action/highlight material.

Use **existing global CSS variables** first. The following values were inspected on the WTP-MERGER development branch on November 21; they are implementation values and a proposed default, **not unconditional sign-off on every screen**.

| Token | Current branch value | Role |
|---|---|---|
| `--color-bg-deep` | `#0F1A1C` | Midnight ink / darkest canvas |
| `--color-bg-base` | `#183A3D` | Deep teal atmosphere |
| `--color-bg-warm` | `#3D292C` | Burgundy/rose atmospheric depth |
| `--color-surface-solid` | `#14272A` | Stable dark surface |
| `--color-surface-raised` | `#1B3437` | Elevated readable surface |
| `--color-surface-reading` | `#112124` | Dense reading background |
| `--color-text-primary` | `#F2E9E3` | Ivory text |
| `--color-text-secondary` | `#D6B9AE` | Subordinate text / pale rose |
| `--color-accent` | `#B67872` | Dusty rose interaction accent |
| `--color-champagne` | `#C9A77D` | Champagne metallic finish |
| `--color-metal-highlight` | `#E0C2AE` | Reflected edge highlights |
| `--color-metal-mid` | `#B67872` | Rose metallic midtone |
| `--color-metal-shadow` | `#6E4543` | Recessed metal |
| `--color-focus` | `#A9D6CE` | Accessible focus feedback |

**Do not let brown dominate the authenticated interface.** Teal-black should provide negative space around the rose botanical imagery and champagne frames.

Current CSS also contains scoped `--wtp-*` variables in `src/features/matter/private-matter.css` and counsel-scoped palette values in `src/index.css`. **Reconcile those with the global tokens as a targeted, screenshot-tested refactor**; do not add a third competing token set. Never flatten the existing `[data-theme="rose"]` and `[data-theme="pearl"]` variants or separate background preferences.

### 2.2 Typography

| Use | Preferred existing font | Contract |
|---|---|---|
| Display headings and editorial statements | **Newsreader Variable** | Elegant readable serif, strong hierarchy, avoid excessive size on short laptops |
| UI, buttons, navigation, labels, body | **Figtree Variable** | High legibility, balanced weights, limited all-caps |
| Document excerpts / source text | Legible document treatment (Figtree or faithful document rendering) | Opaque/dense backing, preserved source wording, selection/copy |
| IDs, hashes, precise locators | Monospace | Full value available, wrap long strings |

Both primary families are already bundled locally through `src/main.tsx`. Do not add external font CDNs or globally replace them with Playfair, Lora, or DM Sans because a Canva/standalone HTML reference uses those fonts. A screen-specific typography change requires deliberate approval.

**Sizing targets, not rigid pixels:** app view headings approximately 28–40px, section headings 19–27px, body 15–17px, source text 16–18px where practical, metadata 12–14px at sufficient contrast. Avoid 9–11px critical statuses or unreadable compressed labels merely to mimic a screenshot.

### 2.3 Materials and depth

Use different materials for different jobs.

1. **Atmospheric canvas:** deep teal/ink plus separately layered dark botanical art. Never make the text depend on floral detail for contrast.
2. **Sculpted primary frames:** substantial, multistop champagne/rose-metal bevel, soft reflected highlight and dark inner trough for the **major workspace zones**.
3. **Smoked navigation glass:** denser/less transparent, stable readable controls.
4. **Liquid conversation glass:** medium transparency and restrained highlights for messages and composer.
5. **Frosted functional glass:** controls, drawers, supporting information; blur behind, not through, text.
6. **Warm archival paper or dense reading surface:** original excerpts, comparison, long text and metadata.
7. **Semantic state:** words, icons, basis and actor; never color alone.

**Rim hierarchy:** three major freestanding frames may be heavily sculpted. Nested cards should **not all receive the same thick double champagne rim**. Use restrained borders, tonal separators, opacity and elevation. Avoid uniform gold boxes, blown highlights, low-contrast glass, clipped content, or wallpaper made from a screenshot of an entire UI.

### 2.4 Botanical artwork and branding

Preserve the existing crest/monogram, peony assets, and dark silk/floral imagery until a specific replacement is approved. Use independently addressable assets, not flattened screenshots. Keep floral art secondary to labels, search, evidence text and forms. Do not use real case paperwork or identifiable children in public/demo imagery.

---

## 3. Product surfaces and route boundaries

| Surface | Actual route / state | Design function | Trust rule |
|---|---|---|---|
| Public website | `#/` and informational routes | Editorial narrative, benefits, fictional examples | No private matter data |
| Sign-in / matter selection | `#/signin` | Compact branded authentication and matter entry | Real auth; honest failure/loading |
| Fictional demo | `#/demo` (historical other fictional routes may vary) | Three-panel interactive exploration | Fictional/browser-local; visually labeled |
| Authenticated parent | `#/app` | Authorized matter hub and working views | Matter scoped; backend access controls required |
| Legacy counsel inventory | `#/app/matters/:matterId/counsel` | Preserved three-column owner-review archive | UI owner gate only; **not** professional sharing |
| Future counsel connection | `src/handoff-module/connection.ts` | Explicit object-grant bridge | **Disconnected**, no granted objects |
| Learning / educational experience | Prototype and future authenticated module | Progressive contextual instruction | No invented durable progress or legal authority |
| Public advocacy/publication | Future separate experience | Optional redacted publishing | Independent, explicit review and approval |

No navigation path, selected matter, role flag, or visible invitation should accidentally copy fictional data into real storage or expose one private domain through another.

---

## 4. Screen-level contracts

### 4.1 Public website

**Visual authority:** founder's latest supplied public screenshot: dark teal-black hero, dramatic pink/rose peonies, ivory editorial headline “A clearer place to begin.”, subtle top navigation, champagne/rose controls, and alternating dark editorial/feature sections.

**Preserve:** existing horizontal desktop navigation, hero composition, section order, copy, CTA meanings, spacing rhythm, responsive collapse, and public/privacy disclosures. **Do not impose the Canva workspace sidebar on the public marketing site.** The palette is a reference for the private workspace, not permission to rearrange the homepage.

### 4.2 Sign-in and matter selection

Focus on a usable form over ornament. Keep brand on one side at desktop sizes when space allows and the actual auth form on the other. Support password recovery, visible request/auth failure, sensible keyboard order, and clear pilot/invitation copy where true. Never simulate successful login or route an authenticated user into the fictional demo.

### 4.3 Authenticated Parent Headquarters — next visual acceptance target

**Inputs:** user-provided November 20 Canva prototype screenshots/HTML, existing WTP-MERGER private shell, the newer public-site palette and the founder's instruction to update color/materials **without replacing the core layout**.

Preserve the purpose of Headquarters: one matter, relevant action priorities, honest statuses, quick access to evidence/review and a guided next step.

Keep these **separate**:

- **Permanent destination navigation:** Case Headquarters, Evidence Library, Review What We Found, Source Viewer, Ask My Case, Timeline, Learn in Context, Tasks & Follow-Up, Activity History, MVP Acceptance Journey, Designed for Later, Share & Collaborate.
- **Ten-stage journey:** create matter, upload, preserve, process, review, source-check, organize, ask, connect, prepare. This is a *process indicator/guide*, not a requirement for ten additional permanent sidebar tabs.
- **Case-attention cards:** show actual registered records, pending review and implementation limitations. Never imply that a checksum, OCR attempt, court filing, or authorization test succeeded when it did not.
- **Overview and continuity:** easy return to the current matter and source-linked work.

**Current implementation note:** `src/features/matter/PrivateMatterWorkspace.tsx` and `private-matter.css` already contain a first teal/rose visual pass, separate journey ribbon and owner-only handoff link. **Candidate only:** compare the rendered screen against the user's Canva/website references before approving more CSS. Keep the existing functionality and captions during palette cleanup.

### 4.4 Conversation / Ask My Case

Preserve the founder's strong three-zone investigative pattern:

- **Left navigation:** crest, matter/context switcher, core destinations and optional tools.
- **Center working canvas:** question and answer, source-linked citations, legible composer, preserved draft text and conversation context.
- **Right workbench:** exact authorized source, locator and selected passage, source/meta tabs, compare/notes/draft, focus return when closed.

Desktop proportions are *reference relationships*, not rigid columns: approximately 18–20% navigation, 52% center and 25–28% source at generous width, with the central reading area protected. At smaller widths, use responsive drawers/modal access rather than squeezing three panes.

Citations must open the specific authorized source and identify page/paragraph/timecode or offsets as appropriate. Quote verification is different from a finding of truth. Do not fabricate source chips or send unshared content to a model.

### 4.5 Evidence Library and preservation

Keep searchable evidence records with titles, origin, dates, source status, labels and actionable filters. The technical lifecycle must separate:

`original bytes → registered source → derivative / processing → proposed metadata or assertion → human review → verified quotation / linked knowledge`

Evidence registration is not proof of preservation. A working upload needs authorized storage, immutable original preservation, unique evidence ID, real checksum, and true success/failure feedback. Display OCR failure and retries explicitly. Never fabricate processing completion.

### 4.6 Review What We Found

Use the Canva **two-column proposal-and-review layout**: one panel for proposed information against the source, another for extraction status, date semantics and recovery. The user can confirm, dispute, correct, or leave unresolved **only when those decisions are stored with real actor/time/basis**. Never silently promote an uploaded date to an event date.

Show original and derivative differences and exact source locators. Keep previous proposals and human decisions traceable in protected review history.

### 4.7 Source Viewer and comparison

Preserve Canva's side-by-side **original versus derivative** distinction, supported by the existing demo's contextual right-hand Source Workbench. Different tasks may use a dedicated compare page or side inspector; do not force all of them into one generic dashboard.

Show source title, original status, checksum state, origin, locator, original text, separately labeled extracted text, relevant highlight, and failure/provenance information. A link to an original must be short-lived and **authorized server-side**. No simulated PDF preview should claim to show uploaded bytes.

### 4.8 Timeline, issue investigation, drafts and hearing tools

- **Timeline:** event vs document vs upload date; exact, approximate, disputed and unknown states; source links; explicit confirmation before an inferred event becomes reviewed.
- **Issue investigation:** what each record says, contradictory and dependent accounts, alternative explanations, missing evidence, provenance, and user review. Repetition is not independent corroboration.
- **Drafts:** linked sources; real persistence status; distinguish draft, filed and served.
- **Hearing prep:** issue/question/source matrix, compact focus mode, post-hearing reconciliation. Practice is not an official courtroom record.
- **Tasks:** user reminders vs lawyer-supplied dates vs officially sourced deadlines vs AI suggestions must remain separate.
- **Activity history:** sanitized, authorized projections; never show raw system-restricted snapshots to matter members.

### 4.9 Learning Lab and contextual education

Preserve the educational three-column treatment (curriculum rail, central lesson and checks, contextual method/source inspector) where appropriate, without forcing its particular bronze buttons onto other screens. Support synchronized narration **of the same visible lesson text** (where platform support permits), selectable speed including 1.0×, 1.25× and 1.5×, transcript/selection, keyboard controls and feedback.

Integrate brief learning interventions contextually into documents, timeline and preparation. Show the distinction between educational examples and actual local law; never claim measured legal competence or durable progress without the corresponding service.

### 4.10 Separate counsel handoff — preserve, do not fold into core screens

**The existing counsel handoff was developed before the new sharing architecture and must remain independently maintainable.** Current branch module map:

- `src/handoff-module/LegacyCounselHandoffView.tsx` — preserved hierarchy / preservation register / inspector.
- `src/handoff-module/legacyService.ts` — existing legacy data calls, not a share-grant service.
- `src/handoff-module/HandoffModule.tsx` — authenticated owner-only *UI* entry to the legacy archive.
- `src/handoff-module/connection.ts` — fail-closed bridge, always disconnected with zero authorized shared objects.

**Visual treatment:** part of WE THE PARENT's teal/rose/champagne family, but professional, denser and more restrained. Maintain three functional inspector panes, readable filenames, sorting/filtering and accessible nested folders. Do not mix it into the Parent Sidebar or main chat state.

**Security truth:** legacy matter-membership-based SQL policies remain unresolved. Client-side owner gating is **not** data-layer isolation. Do not invite professionals, expose counsel-private notes, present a connected status, or enable sharing/AI retrieval merely because a role appears in the matter. Legacy review notes are **not** attorney-private work product. The bridge requires separately tested server-enforced object grants before connection.

---

## 5. Visibility and data-access design rules

Four domains must be distinct throughout the UI and backend:

1. **PARENT_PRIVATE** — default parent records, metadata, source contents, private notes and derivatives; only authorized parent-side subjects.
2. **SHARED_MATTER** — only specifically approved and actively granted objects, actions and recipients; no blanket inheritance.
3. **COUNSEL_PRIVATE** — professional notes, strategy and work product behind independent authorization.
4. **SYSTEM_RESTRICTED** — privileged raw audit, internal system operations, security records.

Apply each decision at **identity → matter → role → object → action → active grant** before revealing filename, search result, source chunk, export, signed URL, model context or attachment. A disconnected bridge returns no granted records. Revocation must affect all subsequently issued data reads and new links, with appropriate TTL and cache behavior.

**No new sensitive evidence should enter a shared or legacy table merely because its screen looks private.** Current Supabase RLS, Storage, search, audit and AI context policies are **not independently certified**. The ten live security cases `AT-SEC-GRANT-001` through `010` must execute against a clean, isolated synthetic environment before a professional or confidential pilot.

Never copy real juvenile-case records into screenshots, demo fixtures, CI logs, public sites or unapproved AI prompts.

---

## 6. Responsive and accessibility requirements

### Required visual acceptance sizes

| Viewport | What must work |
|---|---|
| **1672×941** | Desktop reference for freestanding three-pane workbench |
| **1440×900** | Comfortable source and reading space |
| **1366×768** | No clipped composer, sidebar, inspector or actions |
| **1366×680** and **1366×600** | Short-laptop independent scrolling and reachable action controls |
| **1024–1279px** | Workbench adapts to drawer/modal when necessary |
| **~768px** | Tablet: no squeezed permanent three-column layout |
| **390×844** | Mobile: one main task, accessible drawer, no horizontal page scrolling |

Target WCAG 2.2 AA where applicable. Check rendered contrast **after** overlays and blur (normally 4.5:1 for body text and 3:1 for large/non-text targets where applicable). Test 200% zoom, keyboard tab order, focus return from modals/source views, 44px-ish touch targets when practical, visible active states, screen-reader announcements, reduced motion, reduced transparency, and forced colors.

Do not force a source panel to remain open on a 390px screen or hide key actions below a 600px viewport. Independent pane scroll must not swallow the composer or evidence details. Provide dense readable alternatives to glass rather than depending on backdrop blur.

---

## 7. Engineering implementation map and guardrails

| Role | Present source |
|---|---|
| Route boundaries and fictional Workspace | `src/App.tsx` |
| Global colors and theme variants | `src/index.css` |
| Shared bevel / glass system | `src/gold-glass.css` |
| Public site styling / components | `src/public.css`, `src/features/public/Public.tsx` |
| Botanical assets and crest | `src/components/brand.tsx` |
| Fictional chat/navigation | `src/features/chat/ChatView.tsx`, `src/components/layout/Sidebar.tsx` |
| Source workbench | `src/features/evidence/SourceWorkbench.tsx` |
| Parent private shell and views | `src/features/matter/PrivateMatterWorkspace.tsx`, `private-matter.css` |
| Independent counsel archive and bridge | `src/handoff-module/` |
| Auth, matter, sources and AI services | `src/services/`, `src/lib/supabase.ts`, Supabase functions |
| Scope / current implementation notes | `docs/UNIFIED_PRIVATE_WORKSPACES.md` |
| Regression checks | `tests/` and GitHub Actions |

**Migration and repository governance:** this document is committed to the **active donor branch** for design consistency while development proceeds. It does not decide WTP-DEC-0006, authorize a copy into private `we-the-parent-app`, merge draft PR #6, or change production records.

### Development process — one screen at a time

1. Choose one route and identify the **actual founder reference** and its date/approval.
2. Capture the current screen at the required reference sizes.
3. Record exact elements to preserve: wording, layout, workflow, sources, states and contracts.
4. Specify a narrow targeted visual/interaction diff. Prefer reusable tokens and components.
5. Apply the diff without changing auth, evidence bytes, permissions or unrelated routes.
6. Run `npm ci`, `npm test`, `npm run typecheck` and `npm run build` (build may already include typecheck; record actual commands).
7. Run real browser interaction checks with fictional data at desktop/short-laptop/mobile widths, including keyboard and error states.
8. Compare **before / reference / after** screenshots at matching dimensions and 100% zoom. Note deviations, not just successes.
9. Record **PENDING / APPROVED / CHANGES REQUESTED** founder disposition for that specific route and commit.
10. Promote only through authorized review/merge/rollback; do not equate passing CI with founder approval or production safety.

### Visual acceptance record template

```text
Screen / route:
Reference link or screenshot file + date:
Founder approval record for this surface:
Branch + commit:
Specific proposed change:
Elements/behavior unchanged:
Screenshot widths: 1672x941 / 1366x768 / 1366x600 / 390x844
Browser checks: navigation / keyboard / modal-source focus / scroll / loading-errors
Data checks: fictional or auth / permission status / no private content in demo
Reference differences:
Unresolved decisions:
Founder verdict: PENDING | APPROVED | CHANGES REQUESTED
Reviewed by / date:
```

---

## 8. Known implementation gaps and decisions

| Item | Current disposition |
|---|---|
| Parent Headquarters exact Canva/public-site parity | **Candidate**; recent branch CSS committed but no matched screenshot acceptance |
| Competing private `--wtp-*` versus global `--color-*` tokens | **Needs targeted reconciliation**, no global replace |
| Heavy champagne rims on every nested card | **Needs visual hierarchy review**; reserve sculpted frames for primary panels |
| Bundled Newsreader/Figtree fonts | **Keep** unless founder approves a per-screen change |
| Rose/pearl and background settings | **Preserve and test** |
| Public/demo existing layouts | **Preserve**; not authorized for wholesale redesign |
| Source original/derivative compare and human correction | **Partial / unverified in authenticated app** |
| Contextual read-along and durable Learning Lab | **Prototype / integration pending** |
| Counsel legacy inventory module | **Preserved, owner-preview UI only** |
| Professional handoff connection and object grants | **Disconnected / backend implementation and tests pending** |
| Full synthetic-only staging snapshot and live grant tests | **Not completed**; current staging contains preexisting records |
| Canonical integration repository | **Provisional** under WTP-DEC-0006, not finalized |
| Historical referenced design/provenance files | **Locate and compare**, do not invent contents |

### Release and acceptance gates

A feature/screen is **not complete** solely because it renders, is polished, or passes TypeScript. Required independent evidence includes:

- **Visual:** exact reference, matched screenshots, deviations and founder verdict.
- **Functional:** nondecorative controls with real request/persistence/failure behavior.
- **Source integrity:** exact original/locator linkage; meaningful state provenance.
- **Security:** real authorization, Storage, signed URL, search and AI-context boundaries; synthetic multiuser tests.
- **Accessibility:** keyboard/focus, contrast, zoom, mobile, short laptop, reduced motion/transparency.
- **Legal accuracy:** no unsourced jurisdiction rules, invented rulings or filing success.
- **Resilience:** route changes, matter switches, auth expiry and failed network requests do not leak or erase another context.
- **Release control:** approved scope, integration target, review, rollback plan and explicit release authorization.

---

## 9. Reference registry and provenance

**Source documents:**

- Founder-uploaded `design.md` v1.0, 2026-11-16, **working** design consolidation.
- `WTP_design_contract_reconciliation_2026-11-21.md`, review of historic v1.0 versus the current WTP-MERGER source.
- Founder-supplied November 20 Canva Parent MVP Alpha screenshots, design HTML and workflow example; editor: https://www.canva.com/design/DAHbY6NOGvU/YfwyIdhay6PXCUCVC400QQ/edit (editor access may require permission).
- Published founder Canva prototype link: https://tamaraw-fsf08l.my.canva.site/ (the screen captures, not the URL alone, ground the layout analysis).
- Founder-supplied public-site screenshots with peony/teal-black hero and three-panel fictional conversation/source reference.
- The current GitHub development branch and `docs/UNIFIED_PRIVATE_WORKSPACES.md`.
- Historical `we-the-parent-design-studio` and specific provenance documents cited by v1.0 **pending direct recovery**.

**Dates and approval are not inferred from design filenames or asset modification times.** If later explicit approval conflicts with this document, update this file through a controlled revision and retain the prior decision in the change log.

### Change history

| Date | Version | Change | Approval |
|---|---|---|---|
| 2026-11-16 | 1.0 | Original design/UX consolidation; bronze/gold historic implementation and fidelity gates | Working draft, screen-specific approval pending |
| 2026-11-21 | 1.1 | Reconcile founder's newer teal-black direction, Canva Parent MVP, current branch, isolated counsel handoff, security and acceptance boundaries | **Working contract; founder per-screen acceptance pending** |

> **Protect the central principle:** WE THE PARENT must make sophisticated case intelligence understandable without requiring parents to learn an elaborate interface first. Art and materials create the atmosphere; readable evidence and honest status build trust; the parent remains in control.
