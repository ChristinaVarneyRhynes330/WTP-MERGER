import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
const journey = read("../src/features/private/FirstRecordJourney.tsx");
const home = read("../src/features/private/PrivateCaseHome.tsx");
const uiCss = read("../src/first-record-journey.css");
const app = read("../src/App.tsx");

test("first-record journey uses authorized backend records rather than browser demo state", () => {
  assert.match(app, /return <PrivateCaseHome \/>/);
  assert.match(home, /getMatter\(matterId\)/);
  assert.match(home, /listSources\(matterId\)/);
  assert.match(journey, /uploadOriginalSource\(/);
  assert.match(journey, /matterId:\s*matter\.id/);
  assert.match(journey, /sourceRegisterAvailable/);
  assert.doesNotMatch(journey, /AppProvider|sampleQuestion|demo\.original|localStorage/);
});

test("fictional-only staging intake has explicit restrictions and reports failures", () => {
  assert.match(journey, /MAX_PILOT_BYTES = 64 \* 1024/);
  assert.match(journey, /\/\\\.txt\$/i);
  assert.match(journey, /pilotConfirmed/);
  assert.match(journey, /no confidential case data/i);
  assert.match(journey, /role="alert"/);
  assert.match(journey, /uploadOriginalSource\(/);
  assert.match(journey, /sourceDate: documentDate \|\| undefined/);
  assert.match(journey, /"The original was registered, but the list could not be refreshed/);
});

test("source-check compares retrieved original bytes with the stored digest", () => {
  assert.match(home, /createOriginalSignedUrl\(firstOriginal\.id\)/);
  assert.match(home, /fetch\(signedUrl, \{ cache: "no-store" \}\)/);
  assert.match(home, /verifyOriginalBytes\(originalBytes, firstOriginal\.byte_size, firstOriginal\.sha256\)/);
  assert.match(home, /ok: false/);
  assert.match(home, /ok: true/);
  assert.match(journey, /verifiedOriginalId/);
});

test("missing processing and private modules are not presented as completed", () => {
  for (const term of ["Extraction completion is not connected", "Private timeline integration not yet enabled", "Private source-grounded conversation not yet enabled", "Private linked tasks not yet enabled"]) {
    assert.ok(journey.includes(term), `Expected honest capability statement: ${term}`);
  }
  assert.match(journey, /Source date|Date written on document/);
  assert.match(journey, /The retrieved bytes have not yet been rechecked/);
  assert.match(uiCss, /\.private-first-record__steps/);
  assert.match(uiCss, /max-width: 700px/);
});

test("fictional test files cannot be mixed into ordinary matter workspaces through guided intake", () => {
  assert.match(journey, /const fictionalMatter =/);
  assert.match(journey, /if \(!fictionalMatter\)/);
  assert.match(journey, /Create or select a separately labeled fictional matter/);
  assert.match(journey, /\!fictionalMatter \|\| !file/);
});

test("source selection respects narrow screens and reduced motion", () => {
  assert.match(home, /function|const inspectSource/);
  assert.match(home, /max-width: 1023px/);
  assert.match(home, /scrollIntoView/);
  assert.match(home, /prefers-reduced-motion: reduce/);
  assert.match(home, /id="private-source-viewer"/);
});
