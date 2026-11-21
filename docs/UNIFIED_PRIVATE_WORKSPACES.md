# Unified private matter workspaces — implementation tranche

**Status:** application code and regression tests implemented on a review branch. Not deployed, not connected to a verified live backend, and not approved for actual juvenile-dependency uploads or counsel invitations.

## Existing product paths

| Route | Experience | Data boundary |
| --- | --- | --- |
| `#/` | Public We The Parent website | Public marketing only |
| `#/demo` | Fictional, browser-persisted demo | Explicitly not real evidence |
| `#/signin` | Account, matter selection, existing original-preservation flow | Supabase auth and matter policies |
| `#/app` | **Private Parent Headquarters** | Selected matter ID + verified signed-in membership + RLS |
| `#/app/matters/<matter-uuid>/counsel` | **Private Counsel/Reviewer Workspace** | Same authorized matter, independent permission check |

### Parent Headquarters visual

Reference: `we_the_parent_interactive_workspace_mockup.html` supplied by the founder, not committed to this public repository. The new scoped `PrivateMatterWorkspace` uses existing BotanicalArt and Monogram components and founder palette: obsidian, champagne, antique cream, dusty rose, sage, and denim. It carries compact sidebar navigation, glass cards and gold buttons, with a reduced-motion/mobile responsive layout. Public and fictional demo visual styles remain untouched.

### Visual-parity implementation tranche 1 — 20 November 2026

Design sources: founder's public homepage screenshots, the approved fictional conversation/source-viewer demo, the Canva Parent MVP prototype screenshots and its supplied HTML/CSS (reference source, not executable product data).

**Implemented in the private parent branch:**
- Scoped deep teal-black background with public-site ink, dusty rose, ivory and champagne palette.
- Layered botanical photograph using the repository's existing artwork; separate environmental veil for legibility.
- Compact crest-led, gold-rimmed sidebar with responsive horizontal destination navigation on narrow screens.
- Three distinct materials: teal/obsidian navigation, rose-smoked glass cards, and champagne-highlighted controls.
- Guided ten-stage workflow *separate* from the twelve permanent destinations.
- Case Headquarters hero, attention cards, verified-on-screen source registration counts and status caveats. These cards never claim an upload, OCR result or permission test that did not occur.
- Focus, forced-color and reduced-motion styling.

**Preserved:** public website, fictional demo, Supabase authentication, matter membership checks, source/original services, and AI call paths.

**Still to verify / implement:** pixel-level screenshots of rendered private app at matched desktop/tablet/phone viewports; precise bundled Playfair/Lora/DM Sans font assets if approved; the complete original-vs-derivative compare layout; accessible responsive Source Viewer; reference-faithful input and modal components; authentic counsel materials; object-grant security and source-integrity acceptance tests.

**Security boundary:** theme/style parity is not backend permission parity. The draft code must continue to use fictional cases only until the release-blocking tests are independently demonstrated.

### Parent mockup navigation parity — interim implementation

The parent workspace now exposes twelve destinations using the supplied mockup's screen labels and an added `Share & Collaborate` destination: Case Headquarters; Evidence Library; Review What We Found; Source Viewer; Ask My Case; Timeline; Learn in Context; Tasks & Follow-Up; Activity History; MVP Acceptance Journey; Designed for Later; Share & Collaborate.

Functional authorized data views currently include the parent summary, source register, protected-link source opening, registered-source confirmation status, and existing matter-scoped AI invocation. Other areas visibly explain their missing backend integration rather than simulating task completion, extraction verification, audit logging or deadline reminders. The ten-step acceptance view is an interim implementation-readiness tracker, **not a verbatim port of the founder's original ten-step evidence workflow**. Full interaction parity requires direct comparison against the original HTML, desktop and mobile screenshots, and user acceptance.

### Working behavior implemented in this tranche

- After Supabase authentication, the selected matter ID from `getActiveMatterId()` is checked using the authenticated user's `matter_members` row and the database's RLS-guarded `getMatter`.
- Parent homepage shows only matter-scoped registered source metadata. Source-service failures are explicit; absence of a response is not reported as an empty verified collection.
- Source search works over authorized source titles, IDs, origin and type. The original may be requested using the existing short-lived signed-link endpoint; no public original URL is constructed.
- Ask My Case invokes the existing matter-scoped AI service; source retrieval failures remain visible and no demo response is substituted.
- A dedicated Share & Collaborate area navigates to a separate authenticated counselor/reviewer route, without implicitly changing access.
- Counsel view and service no longer look up a hardcoded appeal case number; the UUID route is passed to `loadCounselHandoff(matterId)`, which verifies membership, selects that matter, and scopes every query to that ID.
- Legal procedural status remains separate from file metadata; AI triage suggestions remain unverified until explicitly adopted.

### Release blockers / explicitly not implemented

- Live authenticated browser test with two unrelated accounts, one authorized invited editor/viewer, revoked access, adversarial forged IDs and a negative cross-matter retrieval test.
- Independent security review of Supabase policies, signed original access, Edge Function logs, RLS, AI context retrieval, and transactional audit logging.
- Owner-only invitation flow, attorney identity verification, per-document sharing, legal privilege-aware notes, complete private timeline, Courtroom Mode, source provenance automation, and production records integration.
- Live staging deployment, fonts/visual parity screenshots at phone/tablet/desktop, keyboard/screen reader acceptance.
- Sync from Drive or Notion; **no evidence copied into GitHub** and no assumption that uploading a file creates a verified exhibit.

### Immediate verification

```bash
npm ci
npm test
npm run typecheck
npm run build
```

The latest project CI is necessary but not sufficient to launch. Pull-request visual and browser authorization tests must pass before release. All source data must be fictional until the privacy gate is met.

**Repository confidentiality:** The existing development branch already contains case-specific identifiers in tracked source. Merely protecting an application route does not make a public repository private. Convert the repository to private and audit history before treating any content as confidential.


## Counsel handoff separation — 21 November 2026

The pre-existing counsel handoff inventory was preserved as a separate module rather than refactored into the core evidence services:

- `src/handoff-module/LegacyCounselHandoffView.tsx` preserves the hierarchy/register/inspector interface.
- `src/handoff-module/legacyService.ts` preserves existing Supabase calls and metadata review behavior, still explicitly **legacy**.
- `src/handoff-module/HandoffModule.tsx` is the private route boundary. It checks authenticated matter ownership before displaying the legacy inventory. Non-owners see a disconnected state.
- `src/handoff-module/connection.ts` defines four visibility domains and a fail-closed future bridge. **No objects can be shared through it.**
- The parent Share & Collaborate card presents an owner-only **review of the legacy inventory**, not a professional invitation.
- `#/demo` and `#/app` remain separate. The counsel route remounts on session-user or matter changes.

Important: this is a **client-side separation, not a completed security remediation**. Legacy database read policies still depend on matter membership; other API clients may reach data outside this UI until RLS, Storage, signed links, search, audit and pre-AI authorization are remediated. The legacy note field is not Counsel Private, and legacy AI triage is disabled in the interface. Do not treat this tranche as release-ready or as proof that the November 6 historical handoff snapshot is identical to the November 19 migration.

Validation: Node contract checks and the existing test suite; CI runs `npm ci`, `npm test`, and `npm run build` (including TypeScript typecheck). Live `AT-SEC-GRANT-001` through `010` remain unexecuted against a clean isolated staging environment.

