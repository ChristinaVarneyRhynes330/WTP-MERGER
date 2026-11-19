# Counsel handoff context

- Target case: Appeal `5D2026-2915`; lower tribunal `05-2024-DP-000587-XXDP-BC`.
- Reuse the existing `src/gold-glass.css` glassmorphic surfaces, the current `AppShell`/`RightPane` layout primitives (or their active workspace equivalents), and the Supabase client in `src/lib/supabase.ts`. Do not create a second UI kit.
- Keep record-status distinctions explicit:
  - Filed With Clerk?
  - Offered / Proffered?
  - Admitted as Evidence?
  - Included in Transmitted ROA?
  - Rule 9.200(f)
  - Unverified archive item

The handoff module is private, matter-scoped, and intentionally separate from public routes. Drive scans must update source metadata without overwriting counsel review fields.

## Importing a FILE LIST export

Use `npm run import:handoff -- .\file_list_export.csv` (JSON is also supported) with these local environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HANDOFF_MATTER_ID`
- `HANDOFF_CREATED_BY` (the authorized owner/counsel user UUID)

The importer maps the export's status labels into the current schema, creates new records as unverified by default, and updates only Drive metadata for existing records. Never commit the service-role key or the export file.
