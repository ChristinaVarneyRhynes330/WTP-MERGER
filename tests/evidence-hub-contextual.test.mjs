import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = name => readFileSync(new URL(name, import.meta.url), "utf8")
const hub = read("../src/features/evidence/EvidenceHub.tsx")
const css = read("../src/features/evidence/evidence-hub.css")
const views = read("../src/features/views.tsx")
const main = read("../src/main.tsx")

test("evidence page mounts a contextual hub while retaining the existing local file modal", () => {
  assert.match(views, /<EvidenceHub\s+onAdd=\{\(\) => setAddOpen\(true\)\}/)
  assert.match(views, /onReselect=\{\(document\) => setReselectDocument\(document\)\}/)
  assert.match(views, /<AddDocumentModal onClose=/)
  assert.match(views, /File bytes stay in memory only/)
  assert.match(main, /import '\.\/features\/evidence\/evidence-hub\.css'/)
})

test("search and filters are backed by active-case documents and source text", () => {
  assert.match(hub, /state.documents.filter\(record => record.caseId === state.activeCaseId\)/)
  assert.match(hub, /state.passages.filter\(p => p.caseId === state.activeCaseId\)/)
  assert.match(hub, /p.documentId === record.id/)
  assert.match(hub, /record.receivedFrom/)
  assert.match(hub, /record.tags.join/)
  assert.match(hub, /record.status === "Preview unavailable"/)
  assert.match(hub, /typeFilter === "all" \|\| record.type === typeFilter/)
  assert.match(hub, /order === "newest" \? second.localeCompare\(first\)/)
  assert.match(hub, /Clear filters/)
})

test("source panel stays in Evidence and is explicit about unverified demo text", () => {
  assert.match(hub, /id="evidence-hub-inspector"/)
  assert.match(hub, /aria-label="Selected source and connected work"/)
  assert.match(hub, /"source", "connections", "actions"/)
  assert.match(hub, /Fictional sample passage, not a retrieved/)
  assert.match(hub, /ILLUSTRATIVE PASSAGE/)
  assert.match(hub, /Record interpretation · not a finding/)
  assert.match(hub, /No source passage is associated with this local record/)
  assert.match(hub, /Open source in conversation/)
  assert.doesNotMatch(hub, /uploadOriginalSource|listSources|supabase|storage\.from\(/)
})

test("linked actions require a matching passage and avoid inferred event dates", () => {
  assert.match(hub, /if \(!selectedPassage \|\| !noteDraft.trim\(\)\) return/)
  assert.match(hub, /sourcePassageIds: \[selectedPassage.id\]/)
  assert.match(hub, /type: "addNote"/)
  assert.match(hub, /type: "saveDraft"/)
  assert.match(hub, /type: "addTimeline"/)
  assert.match(hub, /dateKind === "unknown" \? "" : eventDate/)
  assert.match(hub, /Nothing is inferred automatically/)
  assert.match(hub, /not a court filing/)
  assert.match(hub, /caseId === state.activeCaseId/)
})

test("approved glass visuals remain scoped and mobile actions remain reachable", () => {
  assert.match(css, /\.page-view\.wtp-evidence-hub/)
  assert.match(css, /\.wtp-evidence-hub__inspector/)
  assert.match(css, /\.wtp-evidence-hub__mobile-nav/)
  assert.match(css, /calc\(114px \+ env\(safe-area-inset-bottom\)\)/)
  assert.match(css, /@media \(max-width: 900px\)/)
  assert.match(hub, /scrollIntoView/)
  assert.match(hub, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(css, /(^|\n)\s*\.(site|pub|private-home|sidebar)\b/)
})
