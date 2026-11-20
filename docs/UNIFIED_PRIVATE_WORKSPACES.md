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
