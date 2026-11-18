import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const sql = read("../supabase/migrations/20261002170000_founder_alpha_foundation.sql");
const edge = read("../supabase/functions/make-server-82d9c8b6/index.ts");
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
