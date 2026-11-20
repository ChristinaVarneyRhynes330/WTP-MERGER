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
