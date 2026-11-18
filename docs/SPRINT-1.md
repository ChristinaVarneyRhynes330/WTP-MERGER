# Sprint 1 implementation status — 2026-10-30

| Deliverable | Local status | Remaining gate |
|---|---|---|
| Private repository `we-the-parent-app` | Import-ready source bundle | Owner creates repo; connector cannot create repositories |
| Approved design-lineage base | Copied from attached earlier `wtp (2).zip` | Sync latest explicitly approved design revisions |
| Public/demo isolation | Fictional demo banner and separate auth route | Browser E2E test |
| Credentials hygiene | Hard-coded Supabase project ID removed; `.env.example` provided | Configure new project and complete secret scan |
| Matter, Source, OriginalFile, audit, RLS migration | Copied into clean versioned SQL migration | Review, execute against dedicated test project and test isolation |
| Authorized upload/list/signed download Edge Function | Copied and retained user/matter authorization checks | Deploy and test with two accounts |
| Original download checksum | SHA-256 verify retrieved bytes against stored metadata | Run remote roundtrip; add independent server attestation |
| CI checks | npm test, typecheck and build workflow defined | Run CI in created GitHub repository |
| Vercel | New-project configuration prepared | New preview app only after GitHub repository exists |
| Existing sites and repositories | Not modified | No changes authorized |

**Known caution:** current database migration is inherited code, NOT independently tested against live Supabase. Verify every grant, RLS helper and function in a fresh staging project. Original-file metadata hashing happens in authenticated Edge Function, but for evidentiary defensibility an independently verifiable preservation and custody process remains to be tested. This sprint supplies a working starting codebase and acceptance gates, not production readiness.
