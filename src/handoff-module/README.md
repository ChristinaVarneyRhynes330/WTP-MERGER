# WE THE PARENT — Standalone counsel handoff module

**Status:** preserved legacy archive + disconnected future sharing bridge. Not approved for confidential professional access.

## What stays intact

- `LegacyCounselHandoffView.tsx` contains the existing preservation-register / hierarchy / inspector experience.
- `legacyService.ts` contains the unchanged existing Supabase calls. This is a **legacy inventory** and is NOT a server-approved object-sharing service.
- The legacy inventory remains viewable by the authenticated matter **owner** through the existing `#/app/matters/:id/counsel` route. The bridge remains disconnected for every account, including the owner.
- Existing imported handoff metadata, evidence pathway rows and database migrations are left untouched.
- No earlier milestone date is inferred from a migration filename or a repository snapshot.

## The later-connected bridge

- `connection.ts` defines the four domain labels and an explicit, fail-closed adapter.
- It always returns `disconnected` with **no granted objects**.
- `HandoffModule.tsx` verifies the matter owner's identity *before rendering the legacy owner inventory*. It does not grant professional access.
- Other matter members see the disconnected state instead of mounting the legacy inventory component.
- Share & Collaborate may link an owner to the legacy inventory, but must never imply a file has been shared.

**This is UI-level isolation, not yet RLS enforcement.** Supabase `handoff_files`, `evidence_pathways`, `counsel_qa_items`, `sources`, `source_chunks`, Storage and raw audits still require real object-level server authorization. Client checks cannot prevent direct API access under overly broad RLS. Do not load new sensitive counsel work product into `handoff_files.notes` (a legacy matter-visible field). Legacy AI triage is disabled in the interface pending permission-aware pre-context retrieval.

## Connecting later

A replacement adapter must receive server-authoritative object grants bound to user, matter, object and action with expiry/revocation. Deny by default. Query/filter *before* filenames, search, source chunks and AI context leave the data layer; enforce at downloads and signed URLs. Counsel-private notes must be stored separately from matter-wide legacy notes. System-restricted raw audit entries must not appear in shared history.

Release blockers: `AT-SEC-GRANT-001` through `AT-SEC-GRANT-010` live integration tests with synthetic Parent A / Counsel A / Parent B, staging snapshot and rollback exercise, RLS/storage/AI audit, and visual regression checks.

## Project structure

```
src/handoff-module/
  HandoffModule.tsx           Route boundary and owner-only legacy preview
  LegacyCounselHandoffView.tsx  Existing 3-pane interface
  legacyService.ts            Existing unmodified service operations
  connection.ts               Disabled object-sharing adapter
```

The public website and `#/demo` stay separate. No production SQL, user data or real case files are changed by this refactor.
