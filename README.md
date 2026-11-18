# WE THE PARENT — Private Application Foundation (Sprint 1)

**Status:** Local, import-ready source. **Not deployed, not connected to a verified private database, and not approved for real records.**

## Why this repository exists
This is the **one proposed production application**. The design repositories remain untouched. This package is derived from an earlier, user-supplied WTP design-lineage ZIP and selected existing Supabase schema and Edge Function code; it is not a full copy of the newer design studio.

## Local development
1. Install Node.js 22 or newer (and npm).
2. Run `npm ci` in this directory.
3. Run `npm test`, `npm run typecheck`, `npm run build`, then `npm run dev`.
4. Open the localhost URL. `#/chat` shows fictional design-only demo data; `#/app` or `#/signin` shows the private entrance, and will explicitly say the backend is unconfigured until configured.

## To connect an isolated staging backend (not real case data)
1. Identify or create a **dedicated** Supabase project under the correct account. Don't reuse an unknown project reference or historical credentials.
2. Review `supabase/migrations/20261002170000_founder_alpha_foundation.sql` and the included security checklist against current Supabase documentation.
3. Test the migration on staging, then deploy the Edge Function under its exact name `make-server-82d9c8b6` after reviewing request limits/CORS/JWT verification.
4. Create `.env.local` from `.env.example` with **browser-safe** project URL and publishable key. The secret/service-role key belongs only in the Supabase server secret store; never in `VITE_*` or the repo.
5. Confirm two-user cross-matter negative tests, upload and retrieval SHA-256, logout, and error handling before handling any sensitive information.

## GitHub repository creation (one-time owner action)
The connected GitHub integration does not expose `Create repository`. The owner must create **PRIVATE** `ChristinaVarneyRhynes330/we-the-parent-app` at https://github.com/new, **without** auto-generating a README. Then, in the folder extracted from this ZIP:

```sh
git init -b main
git add .
git commit -m "Initialize WTP private Sprint 1 foundation"
git remote add origin https://github.com/ChristinaVarneyRhynes330/we-the-parent-app.git
git push -u origin main
```

Run `git status` and ensure no secrets or `.env.local` files are tracked before pushing. You may use GitHub Desktop if preferred.

## Deployment
Keep `www.wetheparen.space` and Vercel `we-the-parent-v4` **unchanged**. After repository creation, create a separate **preview-only** Vercel project connected to this repo. Do not attach the public domain until security and functional acceptance tests pass and rollback is planned.

See `docs/SPRINT-1.md`, `docs/SECURITY-GATES.md`, `docs/DESIGN-PROVENANCE.md`.
