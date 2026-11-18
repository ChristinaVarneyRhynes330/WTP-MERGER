# Security verification gates — MUST pass before uploading real records

## P0 — remediation / isolation
- [ ] Rotate and revoke all potentially compromised Gemini and other provider keys in historical public repositories.
- [ ] Invalidate the GitHub-tracked Playwright auth state (`we-the-parent-v4-2/playwright/.auth/user.json`), remove it from history, review sign-ins.
- [ ] Review public source for real family or child details; sanitize and evaluate history-removal or repo privacy as appropriate.
- [ ] Establish a **new or confirmed correct** Supabase project with owners, backups, retention settings, MFA/recovery and recovery tests. The connected account at audit time did not expose a usable WTP project.
- [ ] Review Supabase and Vercel current official docs, then review migration/function for supported Postgres/Supabase runtime and security policies.
- [ ] Add secret scanning, dependency audit, supply-chain pinning, and least-privilege controls.

## P0 — authorized test behaviors
- [ ] User A cannot see, edit, download, list, search, or infer User B's matter, originals, or audit events by guessing IDs.
- [ ] Anonymous user cannot read, write or retrieve any matter or storage object.
- [ ] Storage bucket `matter-originals` is private; listing and signed URLs require authorization.
- [ ] A file uploaded by A is retrievable unchanged, size and SHA-256 match a *server-verified* preservation record, and metadata corrections never alter original bytes.
- [ ] Invalid type, oversized file, revoked session, and disconnected network show explicit errors; no fake success.
- [ ] Source metadata and audit trail survive session refresh and a second browser/device.
- [ ] Test upload partial failures, retries, quotas, malware screening, retention, deletion, legal hold, backups/restores and file access logging.

## Current verified scope
- Static TypeScript checking and local utility tests can run with dependencies installed.
- Code demonstrates session checks, matter access checks, storage RLS intent, and SHA-256 comparison.
- **NOT verified:** live Supabase schema, effective RLS, cross-account negative tests, actual Edge Function deployment, real blob round-trip, backups, or production deployment.
- The application is **NOT authorized for real juvenile-dependency documents** at this stage.
