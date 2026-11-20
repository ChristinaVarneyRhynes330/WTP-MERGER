import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const app = read("../src/App.tsx")
const matter = read("../src/features/matter/PrivateMatterWorkspace.tsx")
const counsel = read("../src/features/counsel-handoff/CounselHandoffView.tsx")
const counselService = read("../src/services/counselHandoff.ts")
const style = read("../src/features/matter/private-matter.css")

test("private app route renders matter-backed UI instead of fictitious AppProvider", () => {
  assert.match(app, /<PrivateMatterWorkspace matterId=/)
  assert.match(app, /case "demo":\s*return \(\s*<AppProvider>/)
  const privateRoute = app.split("function PrivateWorkspaceRoute")[1].split("export default function App")[0]
  assert.doesNotMatch(privateRoute, /<AppProvider>/)
})

test("counsel route and service use authorized matter ID, never a case-number lookup", () => {
  assert.match(app, /app\\\/matters\\\//)
  assert.match(app, /<CounselHandoffView matterId=/)
  assert.match(counsel, /loadCounselHandoff\(matterId\)/)
  assert.match(counselService, /rpc\("is_matter_member"/)
  assert.match(counselService, /\.eq\("id", matterId\)/)
  assert.doesNotMatch(counselService, /\.eq\("case_number"/)
  assert.doesNotMatch(app, /case "counsel-handoff\//)
})

test("parent workspace checks signed-in membership and server-visible matter before showing sources", () => {
  assert.match(matter, /auth\.getUser\(\)/)
  assert.match(matter, /\.from\("matter_members"\)/)
  assert.match(matter, /\.eq\("user_id", data\.user\.id\)/)
  assert.match(matter, /getMatter\(matterId\)/)
  assert.match(matter, /listSources\(matterId\)/)
  assert.match(matter, /createOriginalSignedUrl\(original\.id\)/)
})

test("AI and preservation status remain separate from legal assertions", () => {
  assert.match(matter, /askAssistant\(\{ matterId, question:/)
  assert.match(matter, /Not user-confirmed/)
  assert.match(matter, /does not establish admissibility/)
  assert.match(matter, /not court deadlines/i)
  assert.doesNotMatch(matter, /from ["'].*data\/demo/)
})

test("founder botanical champagne/rose visual tokens are scoped to private matter", () => {
  assert.match(style, /\.wtp-private-parent/)
  for (const color of ["#131414", "#d4b483", "#e8c496", "#b07878", "#2b3b4b", "#7c8e72"]) {
    assert.ok(style.includes(color), `missing intended token ${color}`)
  }
  assert.match(style, /prefers-reduced-motion/)
  assert.match(style, /max-width:620px/)
})

test("private parent navigation carries the twelve reference destinations without fictional case operations", () => {
  const labels = [
    "Case Headquarters", "Evidence Library", "Review What We Found", "Source Viewer",
    "Ask My Case", "Timeline", "Learn in Context", "Tasks & Follow-Up",
    "Activity History", "MVP Acceptance Journey", "Designed for Later", "Share & Collaborate",
  ]
  for (const label of labels) assert.ok(matter.includes(`name: "${label}"`), `missing parent destination: ${label}`)
  assert.match(matter, /not connected to this matter view/i)
  assert.match(matter, /not a security certification/i)
  assert.match(matter, /source_files\.length > 0/)
  assert.match(style, /overflow-x: auto/)
})

test("private matter switch invalidates old source, answer and original-link responses", () => {
  assert.match(matter, /sourceLoadVersion\.current \+= 1/)
  assert.match(matter, /answerVersion\.current \+= 1/)
  assert.match(matter, /linkVersion\.current \+= 1/)
  assert.match(matter, /if \(version !== sourceLoadVersion\.current\) return/)
  assert.match(matter, /version === answerVersion\.current/)
  assert.match(matter, /version === linkVersion\.current/)
  assert.match(matter, /matter\.id !== matterId/)
  assert.match(matter, /setSignedSource\(null\)/)
})
