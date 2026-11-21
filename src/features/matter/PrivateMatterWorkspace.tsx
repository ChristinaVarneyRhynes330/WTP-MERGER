import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import {
  Activity, ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, CheckCircle2,
  ClipboardCheck, Clock3, Compass, Eye, FileCheck2, FileSearch, FolderLock,
  GraduationCap, ListChecks, ListTodo, LockKeyhole, MessageSquareText,
  RefreshCw, Search, ShieldCheck, Sparkles,
} from "lucide-react"
import { BotanicalArt, Monogram } from "../../components/brand"
import { askAssistant, type AiInsight } from "../../services/ai"
import { getMatter } from "../../services/matters"
import { createOriginalSignedUrl, listSources, type SourceSummary } from "../../services/sources"
import { supabase } from "../../lib/supabase"
import type { Matter, MatterRole } from "../../types/database"
import "./private-matter.css"

type Area =
  | "headquarters" | "evidence" | "review" | "source" | "ask" | "timeline"
  | "learning" | "tasks" | "history" | "acceptance" | "roadmap" | "collaboration"

const areas: Array<{ id: Area; name: string; icon: typeof FolderLock }> = [
  { id: "headquarters", name: "Case Headquarters", icon: FolderLock },
  { id: "evidence", name: "Evidence Library", icon: FileSearch },
  { id: "review", name: "Review What We Found", icon: ClipboardCheck },
  { id: "source", name: "Source Viewer", icon: Eye },
  { id: "ask", name: "Ask My Case", icon: MessageSquareText },
  { id: "timeline", name: "Timeline", icon: Clock3 },
  { id: "learning", name: "Learn in Context", icon: GraduationCap },
  { id: "tasks", name: "Tasks & Follow-Up", icon: ListTodo },
  { id: "history", name: "Activity History", icon: Activity },
  { id: "acceptance", name: "MVP Acceptance Journey", icon: ListChecks },
  { id: "roadmap", name: "Designed for Later", icon: Compass },
  { id: "collaboration", name: "Share & Collaborate", icon: BriefcaseBusiness },
]

// The guided sequence is separate from the permanent destination list. These
// buttons navigate to their real private views, including honest pending states.
const parentJourney: Array<{ label: string; area: Area }> = [
  { label: "MATTER", area: "headquarters" },
  { label: "UPLOAD", area: "evidence" },
  { label: "PRESERVE", area: "source" },
  { label: "PROCESS", area: "review" },
  { label: "REVIEW", area: "review" },
  { label: "SOURCE-CHECK", area: "source" },
  { label: "ORGANIZE", area: "timeline" },
  { label: "ASK", area: "ask" },
  { label: "CONNECT", area: "learning" },
  { label: "PREPARE", area: "tasks" },
]

const plannedSections: Partial<Record<Area, { heading: string; description: string; limitation: string }>> = {
  timeline: {
    heading: "Timeline",
    description: "The intended experience links dated events back to specific source records, with unknown and disputed dates kept separate.",
    limitation: "A private, source-linked timeline service is not connected to this matter view. The fictional demo is not your actual case history.",
  },
  learning: {
    heading: "Learn in Context",
    description: "Contextual education should explain a workflow alongside the records and questions that prompted it.",
    limitation: "Private matter-aware lessons are not connected. The existing fictional demo is separate from authorized sources.",
  },
  tasks: {
    heading: "Tasks & Follow-Up",
    description: "Future tasks will carry a responsible person, date provenance and links to the documents or decisions that justify them.",
    limitation: "No persistent private task or deadline service is connected. This screen does not set a reminder or court deadline.",
  },
  history: {
    heading: "Activity History",
    description: "The intended audit view distinguishes uploads, viewing, review actions and changes in authorized access.",
    limitation: "A complete, immutable, actor-attributed private audit history has not been implemented or independently tested.",
  },
  roadmap: {
    heading: "Designed for Later",
    description: "A dedicated place to track advanced features without cluttering the everyday parent workflow.",
    limitation: "Planned capabilities are not represented as existing, tested or available services.",
  },
}

/** This route is never backed by AppProvider's fictional, browser-persisted demo matter. */
export function PrivateMatterWorkspace({ matterId }: { matterId: string }) {
  const [matter, setMatter] = useState<Matter | null>(null)
  const [role, setRole] = useState<MatterRole | null>(null)
  const [area, setArea] = useState<Area>("headquarters")
  const [sources, setSources] = useState<SourceSummary[]>([])
  const [sourceError, setSourceError] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [question, setQuestion] = useState("")
  const [insight, setInsight] = useState<AiInsight | null>(null)
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState("")
  const [signedSource, setSignedSource] = useState<{ id: string; url: string } | null>(null)
  const [signError, setSignError] = useState("")
  const sourceLoadVersion = useRef(0)
  const answerVersion = useRef(0)
  const linkVersion = useRef(0)

  // Prevent a previous matter's in-flight response or signed link from surfacing
  // after the selected matter changes. Backend RLS remains the access boundary.
  useEffect(() => {
    sourceLoadVersion.current += 1
    answerVersion.current += 1
    linkVersion.current += 1
    setSignedSource(null)
    setInsight(null)
    setQuestion("")
    setAsking(false)
    setAskError("")
    setSourceError("")
    setSignError("")
  }, [matterId])

  const loadSources = useCallback(async () => {
    const version = ++sourceLoadVersion.current
    try {
      const items = await listSources(matterId)
      if (version !== sourceLoadVersion.current) return
      setSources(items)
      setSourceError("")
    } catch (cause) {
      if (version !== sourceLoadVersion.current) return
      setSourceError(cause instanceof Error ? cause.message : "The private source service is not available.")
    }
  }, [matterId])

  useEffect(() => {
    let active = true
    async function enter() {
      setLoading(true)
      setError("")
      setMatter(null)
      setRole(null)
      setSources([])
      try {
        const { data, error: authError } = await supabase.auth.getUser()
        if (authError || !data.user) throw new Error("Sign in to access this matter.")
        const { data: membership, error: memberError } = await supabase
          .from("matter_members").select("role")
          .eq("matter_id", matterId).eq("user_id", data.user.id).single()
        if (memberError || !membership) throw new Error("You are not authorized to access this matter.")
        const selected = await getMatter(matterId) // RLS checked again by the database
        if (selected.archived_at) throw new Error("This matter is archived.")
        if (!active) return
        setMatter(selected)
        setRole(membership.role)
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Access could not be verified.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void enter()
    return () => { active = false }
  }, [matterId])

  useEffect(() => {
    if (matter && matter.id === matterId) void loadSources()
  }, [matter, matterId, loadSources])

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!question.trim() || asking) return
    const version = ++answerVersion.current
    setAsking(true)
    setAskError("")
    setInsight(null)
    try {
      const nextInsight = await askAssistant({ matterId, question: question.trim() })
      if (version === answerVersion.current) setInsight(nextInsight)
    } catch (cause) {
      if (version === answerVersion.current) {
        setAskError(cause instanceof Error ? cause.message : "Source-grounded analysis is not available.")
      }
    } finally {
      if (version === answerVersion.current) setAsking(false)
    }
  }

  const getOriginal = async (source: SourceSummary) => {
    const original = source.source_files[0]
    if (!original) return
    const version = ++linkVersion.current
    setSignError("")
    setSignedSource(null)
    try {
      const { signedUrl } = await createOriginalSignedUrl(original.id)
      if (version === linkVersion.current) setSignedSource({ id: original.id, url: signedUrl })
    } catch (cause) {
      if (version === linkVersion.current) {
        setSignError(cause instanceof Error ? cause.message : "The private original could not be opened.")
      }
    }
  }

  if (loading || (matter && matter.id !== matterId)) {
    return <main className="wtp-private-gate" role="status">Verifying private matter membership…</main>
  }
  if (error || !matter || !role) return (
    <main className="wtp-private-gate" role="alert">
      <LockKeyhole aria-hidden="true" />
      <h1>Private matter unavailable</h1>
      <p>{error || "Access was not authorized."}</p>
      <a href="#/signin">Return to secure sign in</a>
    </main>
  )

  const matches = sources.filter((source) =>
    `${source.title} ${source.source_type} ${source.origin ?? ""} ${source.id}`
      .toLowerCase().includes(search.trim().toLowerCase()))
  const canEdit = role === "owner" || role === "editor"
  const counselUrl = `#/app/matters/${encodeURIComponent(matterId)}/counsel`
  const plannedSection = plannedSections[area]
  const preservedSources = sources.filter((source) => source.source_files.length > 0)
  const readinessSteps = [
    { label: "Authenticate and select the matter", complete: true, detail: "Signed-in membership and matter access have been checked." },
    { label: "Register evidence", complete: sources.length > 0, detail: "Registration is metadata, not proof of admissibility." },
    { label: "Preserve an original", complete: preservedSources.length > 0, detail: "Saved file metadata is present; original-byte recheck is still separate." },
    { label: "Inspect source metadata", complete: sources.length > 0, detail: "Open the Evidence Library for source dates, IDs and confirmation states." },
    { label: "Review extracted findings", complete: false, detail: "The private review-and-correction workflow is not connected here." },
    { label: "Confirm or dispute suggestions", complete: false, detail: "No AI extraction is silently accepted as verified evidence." },
    { label: "Connect an event to its sources", complete: false, detail: "The private source-linked timeline is pending." },
    { label: "Ask a matter-grounded question", complete: false, detail: "An AI endpoint is available, but a successful authorized response is not established by opening this screen." },
    { label: "Prepare selective professional sharing", complete: false, detail: "Viewing the counsel area is not an invitation or a grant of access." },
    { label: "Validate protection and revocation", complete: false, detail: "Independent multi-account authorization and revocation testing remain required." },
  ]

  return (
    <div className="wtp-private-parent">
      <BotanicalArt kind="app" className="wtp-private-botanical" />
      <div className="wtp-private-shell">
        <aside className="wtp-private-sidebar" aria-label="Parent matter navigation">
          <a className="wtp-private-brand" href="#/" aria-label="We The Parent home">
            <Monogram size={78} />
            <span><strong>WE THE PARENT</strong><small>YOUR CASE · YOUR VOICE</small></span>
          </a>
          <div className="wtp-private-sidebar-context">
            <p className="wtp-private-eyebrow">PRIVATE MATTER WORKSPACE</p>
            <div className="wtp-private-matter-name" title={matter.name}>{matter.name}</div>
          </div>
          <nav aria-label="Workspace tools" className="wtp-private-nav">
            {areas.map(({ id, name, icon: Icon }) => (
              <button key={id} type="button" className={area === id ? "active" : ""}
                aria-current={area === id ? "page" : undefined}
                onClick={() => setArea(id)}><Icon size={18} aria-hidden="true"/>{name}</button>
            ))}
          </nav>
          <div className="wtp-private-sidebar-foot">
            <ShieldCheck size={18} aria-hidden="true"/>
            <span>One matter. Authorized records only.</span>
            <a href="#/signin">Change matter / account</a>
          </div>
        </aside>
        <main className="wtp-private-main">
          <BotanicalArt kind="app" className="wtp-private-main-art" />
          <header className="wtp-private-top">
            <span>{matter.name} / {areas.find((item) => item.id === area)?.name}</span>
            <span><LockKeyhole size={14} aria-hidden="true"/> {role.toUpperCase()} ACCESS</span>
          </header>
          <div className="wtp-private-body">
            {area === "headquarters" && <>
              <div className="wtp-private-heading wtp-private-heading--hero">
                <div>
                  <p className="wtp-private-eyebrow">CASE HEADQUARTERS · PRIVATE MATTER</p>
                  <h1>Your case, one careful step at a time.</h1>
                  <p>Keep your records together, inspect what each source can show, and review proposed information before relying on it.</p>
                </div>
                <button className="wtp-private-hero-action" type="button" onClick={() => setArea("review")}>
                  Review what we found <ArrowRight size={16} aria-hidden="true"/>
                </button>
              </div>
              <nav className="wtp-private-workflow" aria-label="Ten-stage parent journey">
                {parentJourney.map(({ label, area: destination }, index) => (
                  <button key={label} type="button" onClick={() => setArea(destination)}
                    title={destination === "headquarters" ? "Open matter headquarters" : "Open " + areas.find((item) => item.id === destination)?.name}>
                    <span className="wtp-private-workflow-number">{String(index + 1).padStart(2, "0")}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
              <div className="wtp-private-section-heading">
                <h2>What needs your attention</h2>
                <span>Current registered information · not a release certification</span>
              </div>
              <div className="wtp-private-attention-grid">
                <section className="wtp-private-card wtp-private-attention">
                  <span className="wtp-private-status wtp-private-status--rose">P0 · VERIFICATION REQUIRED</span>
                  <h3>Protect the record</h3>
                  <p>{preservedSources.length} source record(s) have registered file metadata. Original-byte integrity and object-level access controls still need independent testing.</p>
                  <button type="button" onClick={() => setArea("source")}>Inspect registered sources <ArrowRight size={14} aria-hidden="true"/></button>
                </section>
                <section className="wtp-private-card wtp-private-attention">
                  <span className="wtp-private-status wtp-private-status--sage">HUMAN REVIEW</span>
                  <h3>Check what is confirmed</h3>
                  <p>{sources.filter((item) => item.confirmation_state !== "user_confirmed").length} source record(s) have not been user-confirmed. Registration and review are not proof of a case fact.</p>
                  <button type="button" onClick={() => setArea("review")}>Review source status <ArrowRight size={14} aria-hidden="true"/></button>
                </section>
                <section className="wtp-private-card wtp-private-attention">
                  <span className="wtp-private-status wtp-private-status--amber">BUILD STATUS · PARTIAL</span>
                  <h3>Processing needs verification</h3>
                  <p>Private extraction review, retry tracking, and full audit history are not yet connected. A failed operation must never look completed.</p>
                  <button type="button" onClick={() => setArea("acceptance")}>See readiness checks <ArrowRight size={14} aria-hidden="true"/></button>
                </section>
              </div>
              <div className="wtp-private-section-heading">
                <h2>Matter at a glance</h2>
                <span>Authorized metadata only</span>
              </div>
              <div className="wtp-private-stats">
                <section className="wtp-private-card"><FileCheck2 aria-hidden="true"/><strong>{sources.length}</strong><span>Registered sources</span></section>
                <section className="wtp-private-card"><Search aria-hidden="true"/><strong>{sources.filter((s) => s.confirmation_state !== "user_confirmed").length}</strong><span>Not user-confirmed</span></section>
                <section className="wtp-private-card"><FolderLock aria-hidden="true"/><strong>{role}</strong><span>Access to this matter</span></section>
              </div>
              <div className="wtp-private-section-heading"><h2>Continue your work</h2></div>
              <div className="wtp-private-feature-grid">
                <section className="wtp-private-card wtp-private-feature">
                  <FileSearch size={24} aria-hidden="true"/>
                  <h2>Evidence Library</h2><p>Find originals and check preservation metadata without changing source bytes.</p>
                  <button onClick={() => setArea("evidence")}>Open evidence <ArrowRight size={15}/></button>
                </section>
                <section className="wtp-private-card wtp-private-feature">
                  <Sparkles size={24} aria-hidden="true"/>
                  <h2>Ask My Case</h2><p>Ask for source-grounded explanations; unknown facts and unverified answers remain visible.</p>
                  <button onClick={() => setArea("ask")}>Open analysis <ArrowRight size={15}/></button>
                </section>
                <section className="wtp-private-card wtp-private-feature">
                  <BriefcaseBusiness size={24} aria-hidden="true"/>
                  <h2>Counsel workspace</h2><p>Review source pathways and a curated agenda, separately from the parent experience.</p>
                  <a href={counselUrl}>Open workspace <ArrowRight size={15}/></a>
                </section>
                <section className="wtp-private-card wtp-private-feature">
                  <GraduationCap size={24} aria-hidden="true"/>
                  <h2>Learning Lab</h2><p>The guided fictional learning demonstration is separate from private case material.</p>
                  <a href="#/demo">Open fictional demo <ArrowRight size={15}/></a>
                </section>
              </div>
            </>}
            {(area === "evidence" || area === "source") && <>
              <div className="wtp-private-heading">
                <p className="wtp-private-eyebrow">SOURCE REGISTER · VERIFIED ACCESS</p>
                <h1>{area === "source" ? "Source Viewer" : "Evidence Library"}</h1>
                <p>{area === "source"
                  ? "Request the authorized short-lived original without changing preserved bytes. A protected link does not confirm the contents or their legal status."
                  : "Each item is scoped to this matter. Registration does not establish admissibility, court filing, or appellate record inclusion."}</p>
              </div>
              <div className="wtp-private-controls">
                <label htmlFor="private-evidence-search">Search sources</label>
                <input id="private-evidence-search" value={search} onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, source ID, origin or type…" />
                <button onClick={() => void loadSources()}><RefreshCw size={16}/> Refresh</button>
                {canEdit && <a href="#/signin">Preserve another original</a>}
              </div>
              {sourceError && <p className="wtp-private-alert" role="alert">Source service unavailable: {sourceError}. No source is marked verified as a result of this failure.</p>}
              {signError && <p className="wtp-private-alert" role="alert">{signError}</p>}
              <div className="wtp-private-source-list">
                {matches.map((source) => <article className="wtp-private-card wtp-private-source" key={source.id}>
                  <div><small>{source.source_type} · {source.id.slice(0, 8)}</small><h2>{source.title}</h2>
                  <p>Source date: {source.source_date || "Not verified"} · Registration: {new Date(source.created_at).toLocaleDateString()}</p>
                  <span>Confirmation: {source.confirmation_state.replace(/_/g, " ")}</span></div>
                  <div className="wtp-private-source-actions">
                    <button onClick={() => void getOriginal(source)} disabled={!source.source_files[0]}>Request protected original</button>
                    {signedSource?.id === source.source_files[0]?.id && <a href={signedSource.url} target="_blank" rel="noopener noreferrer">Open short-lived link</a>}
                  </div>
                </article>)}
                {!sourceError && matches.length === 0 && <p className="wtp-private-empty">{sources.length ? "No results match your search." : "No source originals are registered yet."}</p>}
              </div>
            </>}
            {area === "ask" && <>
              <div className="wtp-private-heading">
                <p className="wtp-private-eyebrow">AUTHORIZED SOURCE RETRIEVAL</p><h1>Ask My Case</h1>
                <p>Answers must separate supported source statements, uncertainty, and unverified assertions. This is not a substitute for your attorney.</p>
              </div>
              <form className="wtp-private-card wtp-private-ask" onSubmit={(event) => void ask(event)}>
                <label htmlFor="private-case-question">Question about this matter</label>
                <textarea id="private-case-question" value={question} onChange={(event) => setQuestion(event.target.value)}
                  rows={4} placeholder="What does the record say about this event?" />
                <button type="submit" disabled={!question.trim() || asking}>{asking ? "Checking authorized sources…" : "Ask from the record"}</button>
              </form>
              {askError && <p className="wtp-private-alert" role="alert">{askError}</p>}
              {insight && <section className="wtp-private-card wtp-private-answer">
                <h2>Source-grounded response</h2><p>{insight.answer}</p>
                <h3>What the records show</h3><ul>{insight.verifiedFacts.map((fact,i) => <li key={i}>{fact}</li>)}</ul>
                <h3>Unverified or missing</h3><ul>{insight.unverifiedOrMissing.map((fact,i) => <li key={i}>{fact}</li>)}</ul>
                <h3>Uncertainty</h3><ul>{insight.uncertainty.map((fact,i) => <li key={i}>{fact}</li>)}</ul>
                <h3>Retrieved citations</h3>
                <ul>{insight.citations.map((citation,i) => <li key={i}>{citation.label} · {citation.pageNumber ? `page ${citation.pageNumber}` : "Page unverified"} · {citation.excerpt}</li>)}</ul>
              </section>}
            </>}
            {area === "review" && <>
              <div className="wtp-private-heading">
                <p className="wtp-private-eyebrow">HUMAN REVIEW · SOURCE PROVENANCE</p>
                <h1>Review What We Found</h1>
                <p>Reviewing a source is different from confirming an AI-generated assertion. This view shows the available registration and confirmation statuses; it does not yet save corrections to extracted findings.</p>
              </div>
              <section className="wtp-private-card">
                <h2 className="wtp-private-subheading">{sources.length} authorized source records</h2>
                <p className="wtp-private-muted">{sources.filter((item) => item.confirmation_state !== "user_confirmed").length} records have not been user-confirmed. A user-confirmed status does not establish admissibility or verified source contents.</p>
                {sourceError && <p className="wtp-private-alert" role="alert">{sourceError}</p>}
                <div className="wtp-private-review-list">
                  {sources.map((item) => <div key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.confirmation_state.replace(/_/g, " ")} · {item.source_files.length} registered original(s)</span>
                  </div>)}
                </div>
                <button className="wtp-private-secondary" type="button" onClick={() => setArea("evidence")}>Inspect source register <ArrowRight size={15} aria-hidden="true"/></button>
              </section>
              <p className="wtp-private-muted">Extracted passages, correction history, reviewer decisions and claim-level verification still require protected backend workflows.</p>
            </>}
            {plannedSection && <>
              <div className="wtp-private-heading">
                <p className="wtp-private-eyebrow">PARENT WORKFLOW · NOT YET CONNECTED</p>
                <h1>{plannedSection.heading}</h1>
                <p>{plannedSection.description}</p>
              </div>
              <section className="wtp-private-card">
                <h2 className="wtp-private-subheading">Implementation boundary</h2>
                <p className="wtp-private-muted">{plannedSection.limitation}</p>
                {area === "learning" && <a className="wtp-private-inline-link" href="#/demo">Open the separate fictional demonstration <ArrowRight size={15} aria-hidden="true"/></a>}
              </section>
            </>}
            {area === "acceptance" && <>
              <div className="wtp-private-heading">
                <p className="wtp-private-eyebrow">READINESS TRACKER · NOT A SECURITY CERTIFICATION</p>
                <h1>MVP Acceptance Journey</h1>
                <p>Ten implementation checks help show what this private matter can currently do and what must still be tested. This is a development checklist, not a claim that the original mockup's entire ten-step interaction has been recreated.</p>
              </div>
              <ol className="wtp-private-readiness">
                {readinessSteps.map((step, index) => <li className="wtp-private-card" key={step.label}>
                  <span className="wtp-private-step">{String(index + 1).padStart(2, "0")}</span>
                  <div><h2>{step.label}</h2><p>{step.detail}</p></div>
                  <span className="wtp-private-step-state">{step.complete ? "Available to inspect" : "Not yet verified"}</span>
                </li>)}
              </ol>
            </>}
            {area === "collaboration" && <>
              <div className="wtp-private-heading">
                <p className="wtp-private-eyebrow">PERMISSION-BOUND COLLABORATION</p>
                <h1>Share & Collaborate</h1>
                <p>Legal review is not automatic sharing. Only a matter-authorized member can read its counsel workspace; professional identity and sharing permissions must be checked separately.</p>
              </div>
              <section className="wtp-private-card wtp-private-collaboration">
                <BriefcaseBusiness size={26} aria-hidden="true"/>
                <h2>Specialized counsel review</h2>
                <p>Open the source-linked preservation register and consultation agenda for this matter. The legal significance of a source is a human decision.</p>
                <a href={counselUrl}>Open authorized counsel workspace <ArrowRight size={16}/></a>
                <p className="wtp-private-note">Invitations, selective per-document sharing and attorney-only privileged notes require additional protected access controls and are not active here.</p>
              </section>
            </>}
            <footer className="wtp-private-footer">
              <BookOpen size={15} aria-hidden="true"/> The AI assists. The evidence informs. The human decides.
              <span><CalendarDays size={14} aria-hidden="true"/> Dates are not court deadlines without a docket source.</span>
              <span><CheckCircle2 size={14} aria-hidden="true"/> Source status is not legal admissibility.</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}
