import { useEffect, useMemo, useState } from "react"
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, FileText, Pause, Play, RotateCcw, Volume2 } from "lucide-react"
import { useApp } from "../../state/AppContext"
import { CalendarDays, Gavel, MessageSquare, Files } from "lucide-react"
import { learningModules } from "./learningCurriculum"

type InspectorTab = "method" | "example" | "source"

/**
 * Fictional education demonstration sourced from the user-provided framework.
 * No authentication, case records, grading service, server write or legal advice.
 * The browser's optional speech synthesis reads the same text displayed onscreen.
 */
export function LearningLab() {
  const [moduleIndex, setModuleIndex] = useState(0)
  const [tab, setTab] = useState<InspectorTab>("method")
  const [selection, setSelection] = useState<number | null>(null)
  const [reviewed, setReviewed] = useState<number[]>([])
  const [teachBack, setTeachBack] = useState("")
  const [playbackRate, setPlaybackRate] = useState(1.25)
  const [playing, setPlaying] = useState(false)
  const [speechNotice, setSpeechNotice] = useState("")
  const { dispatch } = useApp()
  const goToLearningArea = (id: string) => {
    const node = document.getElementById(id)
    node?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    })
    node?.focus({ preventScroll: true })
  }
  const mod = learningModules[moduleIndex]

  const spokenText = useMemo(() => [
    mod.title, mod.focus, mod.lesson, "Example. " + mod.example,
    "Knowledge check. " + mod.question
  ].join(". "), [mod])

  const speechSupported = typeof window !== "undefined" &&
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window

  useEffect(() => {
    if (speechSupported) window.speechSynthesis.cancel()
    setPlaying(false)
    setSpeechNotice("")
    setSelection(null)
    setTeachBack("")
    setTab("method")
    return () => { if (speechSupported) window.speechSynthesis.cancel() }
  }, [moduleIndex, speechSupported])

  const stop = () => {
    if (speechSupported) window.speechSynthesis.cancel()
    setPlaying(false)
  }

  const play = () => {
    if (!speechSupported) {
      setSpeechNotice("Speech playback is unavailable in this browser. All lesson text remains visible.")
      return
    }
    if (playing) { stop(); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(spokenText)
    utterance.rate = playbackRate
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => {
      setPlaying(false)
      setSpeechNotice("Speech playback stopped. You can continue reading the visible text.")
    }
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
    setSpeechNotice("Reading the displayed lesson text aloud.")
  }

  const markReviewed = () => setReviewed(ids =>
    ids.includes(mod.id) ? ids : [...ids, mod.id]
  )

  const changeModule = (index: number) => {
    if (index < 0 || index >= learningModules.length) return
    setModuleIndex(index)
  }

  const correct = selection === mod.correct

  return (
    <main className="page-view wtp-learning-route">
      <div className="wtp-learning">
        <div className="wtp-learning__intro">
          <div>
            <span className="wtp-learning__small">Learning Lab · Master Operating Framework</span>
            <h1>Learn the method. Keep your judgment.</h1>
            <p>Ten guided modules from the supplied operating framework, adapted as a fictional teaching experience.</p>
          </div>
          <div className="wtp-learning__disclosure" role="note">
            <BookOpen size={17} />
            <span><strong>EDUCATIONAL DEMO.</strong> No actual case data, legal research, or saved progress. Nothing here establishes a court finding or preserves a legal right.</span>
          </div>
        </div>

        <button type="button" className="wtp-learning__context-jump" onClick={() => goToLearningArea("wtp-learning-inspector")}>
          Method, example &amp; source context <ChevronRight size={16} aria-hidden="true" />
        </button>
        <div className="wtp-learning__grid">
          <nav className="wtp-learning__syllabus" aria-label="Learning modules">
            <div className="wtp-learning__small">THE TEN-MODULE PATH</div>
            <div className="wtp-learning__count">{reviewed.length} of 10 reviewed <span>· this session only</span></div>
            <div className="wtp-learning__track" aria-hidden="true"><span style={{ width: String(reviewed.length * 10) + "%" }} /></div>
            <div className="wtp-learning__module-list">
            {learningModules.map((item, index) => (
              <button
                type="button" key={item.id}
                className={"wtp-learning__module" + (index === moduleIndex ? " is-active" : "")}
                aria-current={index === moduleIndex ? "step" : undefined}
                onClick={() => changeModule(index)}
              >
                <span className="wtp-learning__roman">{item.roman}</span>
                <span className="wtp-learning__module-name">{item.title}</span>
                {reviewed.includes(item.id) && <CheckCircle2 aria-label="Reviewed this session" size={15} />}
              </button>
            ))}
            </div>
          </nav>

          <section className="wtp-learning__lesson" aria-labelledby="wtp-learning-title">
            <div className="wtp-learning__module-header">
              <div className="wtp-learning__small">MODULE {mod.roman} · {moduleIndex + 1} OF TEN</div>
              <h2 id="wtp-learning-title">{mod.title}</h2>
              <p>{mod.focus}</p>
            </div>
            <div className="wtp-learning__read-controls" role="group" aria-label="Read-along controls">
              <button type="button" className="wtp-learning__control" onClick={play} disabled={!speechSupported}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
                {playing ? "Stop read-along" : "Read aloud"}
              </button>
              <label>Speed
                <select value={playbackRate} onChange={e => { stop(); setPlaybackRate(Number(e.target.value)) }} aria-label="Speech playback speed">
                  <option value={1}>1×</option>
                  <option value={1.25}>1.25×</option>
                  <option value={1.5}>1.5×</option>
                </select>
              </label>
              <Volume2 size={16} aria-hidden="true" />
              <span className="wtp-learning__hint">Read the text while the same text plays aloud.</span>
            </div>
            <p className="wtp-learning__notice" role="status">{speechNotice}</p>
            <article className="wtp-learning__reading" aria-label="Lesson reading">
              <div className="wtp-learning__small">CORE PRINCIPLE</div>
              <p>{mod.lesson}</p>
              <div className="wtp-learning__example"><strong>Worked example</strong><p>{mod.example}</p></div>
            </article>
            <section className="wtp-learning__check" aria-label="Knowledge check">
              <div className="wtp-learning__small">TEST YOUR UNDERSTANDING · NO SCORES</div>
              <h3>{mod.question}</h3>
              <div className="wtp-learning__options">
                {mod.answers.map((answer, index) => (
                  <button
                    type="button" key={answer}
                    aria-pressed={selection === index}
                    className={"wtp-learning__option" + (selection === index ? " is-selected" : "")}
                    onClick={() => setSelection(index)}
                  >
                    <span className="wtp-learning__option-letter">{String.fromCharCode(65 + index)}</span>{answer}
                  </button>
                ))}
              </div>
              {selection !== null && (
                <div className="wtp-learning__feedback" role="status">
                  <strong>{correct ? "That follows the framework." : "Consider the distinction again."}</strong>
                  <p>{mod.explanation}</p>
                  <button type="button" onClick={() => setSelection(null)}><RotateCcw size={13}/> Try again</button>
                </div>
              )}
            </section>
            <section className="wtp-learning__reflection" aria-label="Private practice reflection">
              <label htmlFor="wtp-reflection">Teach it back in your own words</label>
              <p>This is a temporary practice note. It is not saved and is cleared when you switch modules.</p>
              <textarea id="wtp-reflection" value={teachBack} onChange={e => setTeachBack(e.target.value)}
                placeholder="What would you verify next? Which assumption would you test?" rows={3} />
              <div className="wtp-learning__reflection-actions">
                <button type="button" className="wtp-learning__control" onClick={markReviewed} disabled={reviewed.includes(mod.id)}>
                  <CheckCircle2 size={15}/>{reviewed.includes(mod.id) ? "Reviewed this session" : "Mark reviewed"}
                </button>
                <span>Reviewed ≠ legal or factual verification</span>
              </div>
            </section>
            <div className="wtp-learning__pagination">
              <button type="button" onClick={() => changeModule(moduleIndex - 1)} disabled={moduleIndex === 0}><ChevronLeft size={17}/> Previous</button>
              <span>{moduleIndex + 1} / {learningModules.length}</span>
              <button type="button" onClick={() => changeModule(moduleIndex + 1)} disabled={moduleIndex === learningModules.length - 1}>Next <ChevronRight size={17}/></button>
            </div>
          </section>

          <aside id="wtp-learning-inspector" className="wtp-learning__inspector" aria-label="Method and source inspector" tabIndex={-1}>
            <div className="wtp-learning__small">CONTEXT INSPECTOR</div>
            <div className="wtp-learning__tabs" role="tablist" aria-label="Inspector category">
              {([
                ["method", "Method"],
                ["example", "Example"],
                ["source", "Source"]
              ] as const).map(([id, label]) => (
                <button type="button" role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""}
                  key={id} onClick={() => setTab(id)}>{label}</button>
              ))}
            </div>
            {tab === "method" && <div className="wtp-learning__inspector-content">
              <CircleHelp size={26}/><h3>What to carry forward</h3>
              <p>{mod.focus}</p>
              <p>Distinguish the exercise from what can actually be established through current law, authenticated sources, and human review.</p>
            </div>}
            {tab === "example" && <div className="wtp-learning__inspector-content">
              <h3>A fictional example</h3><p>{mod.example}</p>
              <button type="button" onClick={() => dispatch({ type: "navigate", view: "evidence" })} className="wtp-learning__text-link">Explore fictional evidence →</button>
            </div>}
            {tab === "source" && <div className="wtp-learning__inspector-content">
              <FileText size={24}/><h3>Framework provenance</h3>
              <p>{mod.provenance}</p>
              <p>Adapted from the user-supplied Master Operating Framework HTML; its referenced PDFs and legal assertions were not independently checked for this demo.</p>
              <p className="wtp-learning__source-status">Unverified teaching reference · Not an admitted exhibit</p>
            </div>}
            <button type="button" className="wtp-learning__back-to-reading" onClick={() => goToLearningArea("wtp-learning-title")}>
              <ChevronLeft size={16} aria-hidden="true" /> Back to lesson
            </button>
          </aside>
        </div>

        <nav className="wtp-learning__mobile-nav" aria-label="Learning Lab mobile shortcuts">
          <button type="button" onClick={() => dispatch({ type: "navigate", view: "chat" })}>
            <MessageSquare size={18} aria-hidden="true" /><span>Chat</span>
          </button>
          <button type="button" onClick={() => dispatch({ type: "navigate", view: "evidence" })}>
            <Files size={18} aria-hidden="true" /><span>Evidence</span>
          </button>
          <span className="wtp-learning__mobile-nav-current" aria-current="page">
            <BookOpen size={19} aria-hidden="true" /><span>Learn</span>
          </span>
          <button type="button" onClick={() => dispatch({ type: "navigate", view: "timeline" })}>
            <CalendarDays size={18} aria-hidden="true" /><span>Timeline</span>
          </button>
          <button type="button" onClick={() => dispatch({ type: "navigate", view: "hearing" })}>
            <Gavel size={18} aria-hidden="true" /><span>Prepare</span>
          </button>
        </nav>
      </div>
    </main>
  )
}
