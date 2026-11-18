import { ArrowRight, Menu, X } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { BotanicalArt, type ArtKind, TulipMark } from "../../components/brand"
import { useLook } from "../../lib/look"

export type PublicRoute =
  | "home"
  | "platform"
  | "how-it-works"
  | "privacy-and-records"
  | "resources"
  | "about"
  | "faq"
  | "help"

const links: { route: PublicRoute; label: string; href: string }[] = [
  { route: "platform", label: "The platform", href: "#/platform" },
  { route: "how-it-works", label: "How it works", href: "#/how-it-works" },
  { route: "privacy-and-records", label: "Privacy & records", href: "#/privacy-and-records" },
  { route: "resources", label: "Resources", href: "#/resources" },
  { route: "about", label: "About", href: "#/about" },
]

function TopBar({ route }: { route: PublicRoute }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(false)
  }, [route])
  return (
    <header className="topbar">
      <a className="topbar__brand" href="#/" aria-label="We The Parent, home">
        <TulipMark size={40} />
        <span>We The Parent</span>
      </a>
      <nav
        id="topbar-nav"
        className={`topbar__nav ${open ? "is-open" : ""}`}
        aria-label="Main"
      >
        {links.map((link) => (
          <a
            key={link.route}
            href={link.href}
            aria-current={route === link.route ? "page" : undefined}
          >
            {link.label}
          </a>
        ))}
        <span className="topbar__actions">
          <a className="pill pill--sm" href="#/signin">
            Sign in
          </a>
          <a className="cta cta--gold cta--sm" href="#/chat">
            Explore the demo
          </a>
        </span>
      </nav>
      <button
        className="topbar__toggle"
        aria-expanded={open}
        aria-controls="topbar-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={26} /> : <Menu size={26} />}
      </button>
    </header>
  )
}

function Footer() {
  return (
    <footer className="pub-footer">
      <div className="pub-footer__brand">
        <TulipMark size={44} />
        <div>
          <strong>We The Parent</strong>
          <span>Empowering the people</span>
        </div>
      </div>
      <nav aria-label="Footer">
        {links.map((link) => (
          <a key={link.route} href={link.href}>
            {link.label}
          </a>
        ))}
        <a href="#/faq">Questions</a>
        <a href="#/help">Help</a>
        <a href="#/signin">Sign in</a>
      </nav>
      <p>
        Account creation is by invitation only. We The Parent helps you
        organize records and prepare your work. It does not give legal advice.
      </p>
    </footer>
  )
}

export function PublicShell({
  route,
  children,
}: {
  route: PublicRoute
  children: ReactNode
}) {
  useLook()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])
  return (
    <div className="pub">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopBar route={route} />
      <main id="main">{children}</main>
      <Footer />
    </div>
  )
}

function Band({
  art,
  className = "",
  children,
  label,
}: {
  art?: ArtKind
  className?: string
  children: ReactNode
  label?: string
}) {
  return (
    <section className={`band ${className}`} aria-label={label}>
      {art && <BotanicalArt kind={art} className="band__art" />}
      <div className="band__inner">{children}</div>
    </section>
  )
}

const steps = [
  { title: "Education", text: "Understand the language and the process." },
  { title: "Preparation", text: "Bring questions and records together." },
  { title: "Preservation", text: "Keep records and their context connected." },
  { title: "Navigation", text: "Find your way through the next steps." },
]

function Tour() {
  return (
    <figure className="tour" aria-label="Example of the workspace, using a fictional case">
      <div className="tour__chat">
        <div className="tour__bubble tour__bubble--user">
          Compare the provider email with the service summary. What needs
          clarification?
        </div>
        <div className="tour__bubble">
          <h3>The records differ.</h3>
          <p>
            The records describe the September 12 appointment differently. These
            records alone do not establish which account is correct.
          </p>
          <span className="tour__chips">
            <span><b>1</b> DOC-001 · Email body</span>
            <span><b>2</b> DOC-002 · Page 2</span>
          </span>
        </div>
      </div>
      <div className="tour__source">
        <small>Source viewer</small>
        <h4>Provider appointment email</h4>
        <div className="tour__paper">
          <i /><i />
          <mark>We need to cancel the September 12 appointment because a provider is unavailable.</mark>
          <i /><i /><i />
        </div>
        <p>Original and interpretation stay separate.</p>
      </div>
      <figcaption>Fictional demo content.</figcaption>
    </figure>
  )
}

export function HomePage() {
  return (
    <PublicShell route="home">
      <section className="phero" aria-labelledby="hero-title">
        <BotanicalArt kind="hero" className="phero__art" />
        <div className="phero__inner">
          <p className="phero__strap">Empowering the people</p>
          <h1 id="hero-title">A clearer place to begin.</h1>
          <p className="phero__lede">
            Understand the process. Organize your records. Prepare your next
            steps.
          </p>
          <div className="phero__actions">
            <a className="cta cta--gold" href="#/chat">
              Explore the demo
              <ArrowRight size={22} aria-hidden="true" />
            </a>
            <a className="cta cta--dark" href="#/signin">
              Open workspace
              <ArrowRight size={22} aria-hidden="true" />
            </a>
          </div>
          <p className="phero__note">
            Explore a fictional case, or sign in to your workspace.
          </p>
        </div>
      </section>

      <Band art="silk" label="The problem">
        <div className="split">
          <h2>A complex case should not also be a scattered one.</h2>
          <div className="prose">
            <p>
              Records arrive in different forms, on different dates, from
              different people. Terms and steps are unfamiliar. It is easy to
              lose track of what a document says, where it came from, and what
              it can and cannot show.
            </p>
            <p>
              We The Parent keeps your records, your questions and your prepared
              work in one private place, so you can check any statement against
              its source.
            </p>
          </div>
        </div>
      </Band>

      <Band label="Built around you">
        <h2 className="band__title">Built around you</h2>
        <ol className="cards">
          {steps.map((step, index) => (
            <li key={step.title} className="glass-card">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </Band>

      <Band art="flowers" label="See the whole picture">
        <div className="split split--tour">
          <div>
            <h2>See the whole picture.</h2>
            <p className="lede">
              Ask about your records. Every answer points to the passage it came
              from, and the original stays open beside the conversation.
            </p>
            <a className="text-link" href="#/platform">
              Explore the platform
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
          <Tour />
        </div>
      </Band>

      <Band label="Why you can check it">
        <h2 className="band__title">Why you can check it</h2>
        <ul className="cards cards--three">
          <li className="glass-card">
            <h3>Originals stay unchanged</h3>
            <p>
              An uploaded original is stored privately inside its matter and
              registered with a SHA-256 checksum.
            </p>
          </li>
          <li className="glass-card">
            <h3>Answers cite their source</h3>
            <p>
              Each answer links to the passage behind it, so you can read the
              original and decide for yourself.
            </p>
          </li>
          <li className="glass-card">
            <h3>Uncertainty stays visible</h3>
            <p>
              When records disagree, the workspace says so. It does not decide
              which one is right.
            </p>
          </li>
        </ul>
        <p className="band__note">
          In this version the demo uses a fictional case and scripted examples.
          Live AI answers are not connected yet.{" "}
          <a href="#/privacy-and-records">What is and is not built</a>
        </p>
      </Band>

      <Band art="silk" label="What this is and is not">
        <div className="glass-card notice">
          <h2>What this is, and what it is not.</h2>
          <p>
            We The Parent is a workspace for organizing records and preparing
            your own work. It is not a law firm, it does not give legal advice,
            and it does not replace an attorney. It will not promise an outcome.
          </p>
        </div>
      </Band>

      <Band className="band--cta" label="Get started">
        <h2 className="band__title">Start with the fictional case.</h2>
        <p className="lede lede--center">
          Look around the workspace without using any of your own records.
          Account creation is by invitation only.
        </p>
        <div className="phero__actions phero__actions--center">
          <a className="cta cta--gold" href="#/chat">
            Explore the demo
            <ArrowRight size={22} aria-hidden="true" />
          </a>
          <a className="cta cta--dark" href="#/signin">
            I have an invitation
            <ArrowRight size={22} aria-hidden="true" />
          </a>
        </div>
      </Band>
    </PublicShell>
  )
}

function PageHead({
  title,
  lede,
}: {
  title: string
  lede: string
}) {
  return (
    <section className="phead">
      <BotanicalArt kind="silk" className="phead__art" />
      <div className="phead__inner">
        <h1>{title}</h1>
        <p>{lede}</p>
      </div>
    </section>
  )
}

function InfoPage({
  route,
  title,
  lede,
  children,
}: {
  route: PublicRoute
  title: string
  lede: string
  children: ReactNode
}) {
  return (
    <PublicShell route={route}>
      <PageHead title={title} lede={lede} />
      <Band>
        <div className="glass-card info">{children}</div>
      </Band>
    </PublicShell>
  )
}

export function PlatformPage() {
  const parts = [
    ["Conversation", "Ask about your records. Answers point to the passage they came from."],
    ["Evidence", "Keep each original with its date, origin and status."],
    ["Timeline", "Place events in order. Disputed or unknown dates stay marked as such."],
    ["Drafts", "Write beside the conversation with sources linked to the text."],
    ["Hearing prep", "Gather issues, questions and exact sources for a hearing."],
  ]
  return (
    <InfoPage
      route="platform"
      title="One workspace for the whole record."
      lede="Conversation, source records and prepared work stay connected, so you can check any statement against its source."
    >
      <dl className="info__list">
        {parts.map(([term, text]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <p className="info__note">
        The demo uses a fictional case and scripted examples. Live AI is not
        connected in this version.
      </p>
      <a className="cta cta--gold" href="#/chat">
        Explore the demo
        <ArrowRight size={22} aria-hidden="true" />
      </a>
    </InfoPage>
  )
}

export function HowItWorksPage() {
  const detail = [
    "Learn the terms and the steps of a process before you act on them.",
    "Gather your questions and your records in one place before a hearing or a deadline.",
    "Originals are stored unchanged and registered with a checksum. Notes and interpretations stay separate from them.",
    "Follow a timeline and drafts that link back to their sources.",
  ]
  return (
    <InfoPage
      route="how-it-works"
      title="Built around you"
      lede="Four parts of the work, kept in one place."
    >
      <ol className="info__steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{step.title}</h2>
              <p>
                {step.text} {detail[index]}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </InfoPage>
  )
}

export function PrivacyPage() {
  return (
    <InfoPage
      route="privacy-and-records"
      title="Privacy and your records."
      lede="What this version does today, and what it does not do yet."
    >
      <h2>What this version does</h2>
      <ul className="info__bullets">
        <li>Each matter is its own boundary. Records are kept inside the matter they were added to.</li>
        <li>An uploaded original is stored privately inside its matter and registered with a SHA-256 checksum.</li>
        <li>Account creation is by invitation only.</li>
        <li>The demo uses a fictional case. Its drafts and notes are saved only in your own browser.</li>
      </ul>
      <h2>What is not in this version</h2>
      <ul className="info__bullets">
        <li>Live AI answers. Demo responses are scripted examples.</li>
        <li>Sharing, audit history, version history and export. These are planned and not yet available.</li>
      </ul>
      <p className="info__note">
        This page describes the current build. It will be updated before any
        wider release, and it is not a legal or compliance guarantee.
      </p>
    </InfoPage>
  )
}

export function ResourcesPage() {
  return (
    <InfoPage
      route="resources"
      title="Resources"
      lede="Guides and plain-language explanations will appear here."
    >
      <p className="info__note">No resources have been published yet.</p>
    </InfoPage>
  )
}

export function AboutPage() {
  return (
    <InfoPage
      route="about"
      title="About We The Parent"
      lede="A private workspace that makes a complex case easier to understand and act on."
    >
      <p>
        We The Parent helps you organize records, compare accounts and prepare
        your work. It does not give legal advice and does not replace an
        attorney.
      </p>
    </InfoPage>
  )
}

export function FaqPage() {
  const items = [
    ["Is this legal advice?", "No. We The Parent helps you organize records and prepare your own work. It is not a law firm and does not replace an attorney."],
    ["Who can create an account?", "Account creation is by invitation only."],
    ["Does the demo use real records?", "No. The demo is a fictional case. You can explore it without adding anything of your own."],
    ["Is AI connected?", "Not in this version. The demo's responses are scripted examples."],
    ["Where do my uploaded records go?", "An original is stored privately inside the matter you add it to, unchanged, and registered with a SHA-256 checksum."],
  ]
  return (
    <InfoPage
      route="faq"
      title="Questions"
      lede="Short answers about the current version."
    >
      <div className="faq">
        {items.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  )
}

export function HelpPage() {
  return (
    <InfoPage
      route="help"
      title="Help"
      lede="Account creation is by invitation only."
    >
      <p>
        If you have an invitation, use Sign in. To reduce glass effects or
        motion, open Settings in the demo workspace.
      </p>
      <a className="cta cta--gold" href="#/signin">
        Sign in
        <ArrowRight size={22} aria-hidden="true" />
      </a>
    </InfoPage>
  )
}
