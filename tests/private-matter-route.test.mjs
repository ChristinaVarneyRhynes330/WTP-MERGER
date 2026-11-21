import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const app = read("../src/App.tsx")
const matter = read("../src/features/matter/PrivateMatterWorkspace.tsx")
const counsel = read("../src/features/counsel-handoff/CounselHandoffView.tsx")
const counselService = read("../src/services/counselHandoff.ts")
const style = read("../src/features/matter/private-matter.css")
const siteStyle = read("../src/index.css")

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

test("visual parity tranche uses teal-black materials with Canva workflow on authorized parent only", () => {
  assert.match(matter, /<BotanicalArt kind="app" className="wtp-private-main-art"/)
  assert.match(matter, /aria-label="Ten-stage parent journey"/)
  assert.match(matter, /const parentJourney: Array/)
  assert.match(matter, /className="wtp-private-attention-grid"/)
  assert.match(matter, /className="wtp-private-heading wtp-private-heading--hero"/)
  assert.match(style, /WTP VISUAL PARITY TRANCHE 1/)
  for (const token of [
    "--wtp-ink: #0f1a1c",
    "--wtp-deep-teal: #183a3d",
    "--wtp-dusty-rose: #b67872",
    "--wtp-public-champagne: #c9a77d",
    "--wtp-parchment: #f2e9e3",
  ]) assert.ok(style.includes(token), "Missing shared palette token: " + token)
  assert.match(style, /\.wtp-private-main-art \.art__veil/)
  assert.match(style, /\.wtp-private-parent :is\(a,button,input,textarea\):focus-visible/)
  assert.match(style, /@media\(max-width:620px\)/)
  assert.match(style, /@media\(forced-colors:active\)/)
  // The fictional AppProvider remains routed separately.
  assert.match(app, /case "demo":\s*return \(\s*<AppProvider>/)
})


test("counsel workspace reuses the botanical atmosphere without changing file permissions", () => {
  assert.match(counsel, /BotanicalArt kind="app" className="counsel-handoff__art"/)
  assert.match(counsel, /className="counsel-handoff__workspace-tag"/)
  assert.match(counsel, /object-specific sharing and Counsel Private isolation are not yet validated/)
  assert.match(siteStyle, /Counsel visual integration, draft workspace only/)
  assert.match(siteStyle, /--counsel-ink: #0f1a1c/)
  assert.match(siteStyle, /--counsel-teal: #183a3d/)
  assert.match(siteStyle, /--counsel-rose: #b67872/)
  assert.match(siteStyle, /--counsel-champagne: #c9a77d/)
  assert.match(siteStyle, /grid-template-columns: clamp\(210px, 19vw, 260px\) minmax\(0, 1fr\) clamp\(290px, 26vw, 370px\)/)
  assert.match(siteStyle, /@media \(max-width: 740px\)/)
})

test("folder record counters include descendant files, not only direct children", () => {
  assert.match(counsel, /function countTreeFiles\(node: TreeNode\): number/)
  assert.match(counsel, /node\.files\.length \+ node\.children\.reduce\(\(total, child\) => total \+ countTreeFiles\(child\), 0\)/)
  assert.match(counsel, /<small title=\{\x60\$\{countTreeFiles\(node\)\} records in this folder and its subfolders\x60\}>\{countTreeFiles\(node\)\}<\/small>/)
})
