import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const sql = read("../supabase/migrations/20261002170000_founder_alpha_foundation.sql");
const handoffSql = read("../supabase/migrations/20261119120000_counsel_handoff_5d2026_2915.sql");
const edge = read("../supabase/functions/make-server-82d9c8b6/index.ts");
const triage = read("../supabase/functions/triage-counsel-handoff/index.ts");
const app = read("../src/App.tsx");
const triageConfig = read("../supabase/config.toml");
const counselService = read("../src/services/counselHandoff.ts");
const views = read("../src/features/views.tsx");
const contextBar = read("../src/components/layout/ContextBar.tsx");
const lib = read("../src/lib/supabase.ts");
const demo = read("../src/data/demo.ts");

test("migration enables matter RLS and private storage", () => {
  assert.match(sql, /alter table public\.matters enable row level security/i);
  assert.match(sql, /alter table public\.source_files enable row level security|foreach table_name in array array\[/i);
  assert.match(sql, /'matter-originals', false/i);
  assert.match(sql, /on storage\.objects for select to authenticated/i);
  assert.doesNotMatch(sql, /disable row level security/i);
});

test("server upload verifies user and matter edit permission", () => {
  assert.match(edge, /auth\.getUser\(token\)/);
  assert.match(edge, /can_edit_matter/);
  assert.match(edge, /upsert: false/);
  assert.doesNotMatch(edge, /getPublicUrl\(/);
});

test("browser configuration has no committed keys or private case examples", () => {
  assert.match(lib, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(lib + demo, /AIza[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(demo, /\b\d{2}-20\d{2}-DP-\d{6}\b|real.case.identifier/i);
});

test("counsel handoff tables require matter membership and preserve review fields", () => {
  for (const table of ["handoff_files", "evidence_pathways", "counsel_qa_items"]) {
    assert.match(handoffSql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(handoffSql, new RegExp(`on public\\.${table} for select to authenticated`, "i"));
    assert.match(handoffSql, new RegExp(`on public\\.${table} for update to authenticated`, "i"));
  }
  assert.match(handoffSql, /upsert_handoff_file_scan/);
  assert.match(handoffSql, /review_status|preservation_flag/);
});

test("counsel handoff route and triage require authentication", () => {
  assert.match(app, /PrivateCounselHandoffRoute/);
  assert.match(app, /if \(!session\) return <SignInView \/>/);
  assert.match(triage, /Authentication required/);
  assert.match(triage, /is_matter_member/);
  assert.match(triage, /unverified/i);
  assert.match(triage, /responseSchema/);
  assert.match(triage, /GEMINI_MODEL/);
  assert.match(triage, /matter_id/);
  assert.match(triage, /handoff_file_id/);
  assert.match(triageConfig, /\[functions\.triage-counsel-handoff\][\s\S]*verify_jwt\s*=\s*true/);
  assert.match(counselService, /matter_id/);
  assert.match(counselService, /handoff_file_id/);
});

test("private workspace routes require session and selected matter", () => {
  assert.match(app, /function PrivateWorkspaceRoute/);
  assert.match(app, /if \(!session\) return <SignInView \/>/);
  assert.match(app, /if \(!getActiveMatterId\(\)\)/);
  assert.match(app, /<PrivateMatterWorkspace matterId=/);
  assert.match(app, /app\\\/matters\\\//);
  assert.match(counselService, /rpc\\("is_matter_member"/);
  assert.doesNotMatch(counselService, /\\.eq\\("case_number"/);
  assert.match(views, /location\.hash = "#\/app"/);
  assert.match(contextBar, /privateMode \? "Private workspace" : "Fictional demo"/);
});
