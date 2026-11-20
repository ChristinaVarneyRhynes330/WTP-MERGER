import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8")
const curriculum = read("../src/features/learning/learningCurriculum.ts")
const lab = read("../src/features/learning/LearningLab.tsx")
const css = read("../src/features/learning/learning-lab.css")
const app = read("../src/App.tsx")
const sidebar = read("../src/components/layout/Sidebar.tsx")
const main = read("../src/main.tsx")
const types = read("../src/types/index.ts")
const state = read("../src/state/AppContext.tsx")

test("restores the ten original fictional lesson subjects without case-specific data", () => {
  const titles = [
    "The Master Objective", "Etymological Architecture", "Temporal Mapping",
    "Meticulous Investigation", "Risk Allocation Matrix", "Adversarial Empathy",
    "Live Hearing Simulator", "Stewardship & Adaptation", "Red-Team Sandbox",
    "Sui Juris Dossier",
  ]
  for (const title of titles) assert.ok(curriculum.includes('title: "' + title + '"'), title)
  assert.equal((curriculum.match(/correct: [012],/g) ?? []).length, 10)
  assert.doesNotMatch(curriculum, /05.2024.DP.000587|Christina Varney|Addyson|Lyllian|Amani|Jasmine Nedab|5th DCA|verified hash/i)
})

test("Learning Lab is navigable through the existing fictional app, not private case routing", () => {
  assert.match(types, /"learning"/)
  assert.match(state, /"learning"/)
  assert.match(app, /case "learning":\s*return <LearningLab \/>/)
  assert.match(app, /"learning",/)
  assert.match(sidebar, /\{ view: "learning", label: "Learning Lab", icon: BookOpen \}/)
  assert.match(main, /import '\.\/features\/learning\/learning-lab\.css'/)
  assert.match(app, /<AppProvider>/)
  assert.doesNotMatch(lab, /supabase|privateStorage|handoff_files|uploadOriginalSource|localStorage/)
})

test("educational content remains temporary, source-honest, and read-along compatible", () => {
  assert.match(lab, /EDUCATIONAL DEMO/)
  assert.match(lab, /Not an admitted exhibit/)
  assert.match(lab, /Unverified teaching reference/)
  assert.match(lab, /this session only/)
  assert.match(lab, /is not saved/)
  assert.match(lab, /SpeechSynthesisUtterance\(spokenText\)/)
  assert.match(lab, /Read the text while the same text plays aloud/)
})

test("responsive Learning Lab has contextual inspection and unobstructed mobile lesson", () => {
  assert.match(lab, /wtp-learning__mobile-nav/)
  assert.match(lab, /goToLearningArea\("wtp-learning-inspector"\)/)
  assert.match(lab, /id="wtp-learning-inspector"/)
  assert.match(lab, /role="tablist"/)
  assert.match(css, /\.page-view\.wtp-learning-route/)
  assert.match(css, /scroll-snap-type: x proximity/)
  assert.match(css, /calc\(116px \+ env\(safe-area-inset-bottom\)\)/)
  assert.match(css, /\.wtp-learning__mobile-nav/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(css, /(^|\n)\s*\.(pub|site|entrance|private-home)\b/)
})
