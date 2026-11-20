import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const main = read("../src/main.tsx");
const type = read("../src/typography-hierarchy.css");
const visual = read("../src/demo-visual-parity.css");
const intake = read("../src/features/private/FirstRecordJourney.tsx");
const signin = read("../src/features/views.tsx");

test("typography and demo-parity styles load after baseline styles", () => {
  const base = main.indexOf("import './gold-glass.css'");
  const hierarchy = main.indexOf("import './typography-hierarchy.css'");
  const parity = main.indexOf("import './demo-visual-parity.css'");
  assert.ok(base > 0 && hierarchy > base && parity > hierarchy);
});

test("public hero type is scaled down without replacing the current public header", () => {
  assert.match(type, /--wtp-type-display: clamp\(2\.75rem, 4\.9vw, 4\.625rem\)/);
  assert.match(type, /\.pub \.phero h1/);
  assert.match(type, /\.pub \.phero__lede/);
  assert.match(type, /\.pub \.topbar__brand/);
  assert.doesNotMatch(visual, /\.pub \.topbar\s*\{/);
  // The approved fictional demo remains visually unchanged by this typography pass.
  assert.doesNotMatch(type, /\\.sidebar \\.nav-row\\s*\\{/);
  assert.doesNotMatch(type, /\\.workbench__title\\s*\\{/);
  assert.doesNotMatch(type, /\\.context-bar__identity strong\\s*\\{/);
});

test("private view inherits approved separate gold rim and glass surfaces", () => {
  for (const part of ["rail", "main", "inspector"]) {
    assert.ok(visual.includes(`.private-home__${part}`));
  }
  assert.match(visual, /--rim-gradient/);
  assert.match(visual, /backdrop-filter: blur/);
  assert.match(visual, /@media \(max-width: 767px\)/);
  assert.match(type, /\.private-home__heading h1/);
});

test("fictional matter validator recognizes text before the user's next upload", () => {
  const patternLine = intake.split("\n").find((line) => line.includes("const fictionalMatter ="));
  assert.ok(patternLine);
  assert.match(patternLine, /\[\\s:_-\]/);
  assert.doesNotMatch(patternLine, /\[\\\\s:_-\]/);
  assert.match(intake, /preservedSourceId/);
  assert.match(intake, /private-first-record__receipt/);
});

test("signin upload result is announced, visible and linked to authenticated work", () => {
  assert.match(signin, /id="preservation-result"/);
  assert.match(signin, /className="preservation-receipt"/);
  assert.match(signin, /role="status"/);
  assert.match(signin, /scrollIntoView/);
  assert.match(signin, /href="#\/app"/);
  assert.match(visual, /\.site--signin \.preservation-receipt/);
});
