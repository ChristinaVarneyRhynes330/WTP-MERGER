import { useCallback, useEffect, useState, type FormEvent } from "react"
import {
  ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, CheckCircle2,
  FileCheck2, FileSearch, FolderLock, GraduationCap, LockKeyhole,
  MessageSquareText, RefreshCw, Search, ShieldCheck, Sparkles,
} from "lucide-react"
import { BotanicalArt, Monogram } from "../../components/brand"
import { askAssistant, type AiInsight } from "../../services/ai"
import { getMatter } from "../../services/matters"
import { createOriginalSignedUrl, listSources, type SourceSummary } from "../../services/sources"
import { supabase } from "../../lib/supabase"
import type { Matter, MatterRole } from "../../types/database"
import "./private-matter.css"

type Area = "headquarters" | "evidence" | "ask" | "collaboration"
const areas: Array<{ id: Area; name: string; icon: typeof FolderLock }> = [
  { id: "headquarters", name: "Case Headquarters", icon: FolderLock },
  { id: "evidence", name: "Evidence Library", icon: FileSearch },
  { id: "ask", name: "Ask My Case", icon: MessageSquareText },
  { id: "collaboration", name: "Share & Collaborate", icon: BriefcaseBusiness },
]

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

  const loadSources = useCallback(async () => {
    try {
      const items = await listSources(matterId)
      setSources(items)
      setSourceError("")
    } catch (cause) {
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
    setAsking(true)
    setAskError("")
    setInsight(null)
    try {
      setInsight(await askAssistant({ matterId, question: question.trim() }))
    } catch (cause) {
      setAskError(cause instanceof Error ? cause.message : "Source-grounded analysis is not available.")
    } finally {
      setAsking(false)
    }
  }

  const getOriginal = async (source: SourceSummary) => {
    const original = source.source_files[0]
    if (!original) return
    setSignError("")
    setSignedSource(null)
    try {
      const { signedUrl } = await createOriginalSignedUrl(original.id)
      setSignedSource({ id: original.id, url: signedUrl })
    } catch (cause) {
      setSignError(cause instanceof Error ? cause.message : "The private original could not be opened.")
    }
  }

  if (loading) return <main className="wtp-private-gate" role="status">Verifying private matter membership…</main>
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

  return (
    <div className="wtp-private-parent">
      <BotanicalArt kind="app" className="wtp-private-botanical" />
      <div className="wtp-private-shell">
        <aside className="wtp-private-sidebar" aria-label="Parent matter navigation">
          <a className="wtp-private-brand" href="#/" aria-label="We The Parent home">
            <Monogram size={62} />
            <span><strong>WE THE PARENT</strong><small>PRIVATE CASE WORKSPACE</small></span>
          </a>
          <p className="wtp-private-eyebrow">AUTHORIZED MATTER</p>
          <div className="wtp-private-matter-name" title={matter.name}>{matter.name}</div>
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
          <header className="wtp-private-top">
            <span>{matter.name} / {areas.find((item) => item.id === area)?.name}</span>
            <span><LockKeyhole size={14} aria-hidden="true"/> {role.toUpperCase()} ACCESS</span>
          </header>
          <div className="wtp-private-body">
            {area === "headquarters" && <>
              <div className="wtp-private-heading">
                <p className="wtp-private-eyebrow">CASE HEADQUARTERS · PRIVATE MATTER</p>
                <h1>Your case, one careful step at a time.</h1>
                <p>Review the sources you have preserved, identify what remains uncertain, and move into counsel review only when you decide to share.</p>
              </div>
              <div className="wtp-private-stats">
                <section className="wtp-private-card"><FileCheck2 aria-hidden="true"/><strong>{sources.length}</strong><span>Registered sources</span></section>
                <section className="wtp-private-card"><Search aria-hidden="true"/><strong>{sources.filter((s) => s.confirmation_state !== "user_confirmed").length}</strong><span>Not user-confirmed</span></section>
                <section className="wtp-private-card"><FolderLock aria-hidden="true"/><strong>{role}</strong><span>Access to this matter</span></section>
              </div>
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
            {area === "evidence" && <>
              <div className="wtp-private-heading">
                <p className="wtp-private-eyebrow">SOURCE REGISTER · VERIFIED ACCESS</p>
                <h1>Evidence Library</h1>
                <p>Each item is scoped to this matter. Registration does not establish admissibility, court filing, or appellate record inclusion.</p>
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
