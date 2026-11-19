import { useCallback, useEffect, useState, type CSSProperties } from "react"
import type { Session } from "@supabase/supabase-js"
import { ContextBar } from "./components/layout/ContextBar"
import { Sidebar } from "./components/layout/Sidebar"
import { BotanicalArt } from "./components/brand"
import { Toast, useMediaQuery } from "./components/ui"
import { ChatView } from "./features/chat/ChatView"
import { SourceWorkbench } from "./features/evidence/SourceWorkbench"
import { CounselHandoffView } from "./features/counsel-handoff/CounselHandoffView"
import {
  DesignReviewView,
  DraftsView,
  EvidenceView,
  HearingView,
  SettingsView,
  SignInView,
  TimelineView,
} from "./features/views"
import {
  AboutPage,
  FaqPage,
  HelpPage,
  HomePage,
  HowItWorksPage,
  PlatformPage,
  PrivacyPage,
  ResourcesPage,
} from "./features/public/Public"
import { useLook } from "./lib/look"
import { isSupabaseConfigured } from "./lib/supabase"
import { getSession, onAuthStateChange } from "./services/auth"
import { getActiveMatterId } from "./services/activeMatter"
import { AppProvider, useApp } from "./state/AppContext"
import type { ViewId } from "./types"

const validViews: ViewId[] = [
  "chat",
  "evidence",
  "timeline",
  "drafts",
  "hearing",
  "settings",
  "design-review",
  "signin",
]

function CurrentView() {
  const { state } = useApp()
  switch (state.view) {
    case "evidence":
      return <EvidenceView />
    case "timeline":
      return <TimelineView />
    case "drafts":
      return <DraftsView />
    case "hearing":
      return <HearingView />
    case "settings":
      return <SettingsView />
    case "design-review":
      return <DesignReviewView />
    case "signin":
      return <SignInView />
    default:
      return <ChatView />
  }
}

function Workspace({ privateMode = false }: { privateMode?: boolean }) {
  const { state, dispatch, saveError } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCompact, setSidebarCompact] = useState(false)
  const [sourceSheetOpen, setSourceSheetOpen] = useState(true)
  const [workbenchWidth, setWorkbenchWidth] = useState(() => {
    const stored = Number(localStorage.getItem("we-the-parent-workbench-width"))
    return stored >= 340 && stored <= 480 ? stored : 368
  })
  const hasSource = Boolean(state.selectedPassageId)
  const sourceIsModal = useMediaQuery("(max-width: 1279px)")
  const sourceModalOpen =
    sourceIsModal && hasSource && sourceSheetOpen && state.view === "chat"
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const closeSource = useCallback(() => {
    setSourceSheetOpen(false)
    const passageId = state.selectedPassageId
    if (passageId) {
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() =>
          document.getElementById(`citation-${passageId}`)?.focus(),
        ),
      )
    }
  }, [state.selectedPassageId])

  const resizeWorkbench = useCallback((width: number) => {
    const next = Math.max(340, Math.min(480, Math.round(width)))
    setWorkbenchWidth(next)
    localStorage.setItem("we-the-parent-workbench-width", String(next))
  }, [])

  useEffect(() => {
    const readHash = () => {
      const view = location.hash.replace("#/", "") as ViewId
      if (validViews.includes(view)) dispatch({ type: "navigate", view })
    }
    readHash()
    window.addEventListener("hashchange", readHash)
    return () => window.removeEventListener("hashchange", readHash)
  }, [dispatch])

  useEffect(() => {
    const next = `#/${state.view}`
    if (location.hash !== next) location.hash = next
  }, [state.view])

  useEffect(() => {
    if (hasSource) setSourceSheetOpen(true)
  }, [hasSource, state.selectedPassageId])

  if (state.view === "signin") return null

  return (
    <div className="atmosphere">
      <BotanicalArt className="page-art" />
      <div
        className={`app-frame ${sidebarCompact ? "app-frame--compact" : ""} ${
          hasSource && sourceSheetOpen && state.view === "chat"
            ? "app-frame--source"
            : ""
        }`}
        style={
          {
            "--workbench-width": `${workbenchWidth}px`,
          } as CSSProperties
        }
      >
        <div className="workspace-environment" aria-hidden="true" />
        <Sidebar
          compact={sidebarCompact}
          open={sidebarOpen}
          onClose={closeSidebar}
          onToggleCompact={() => setSidebarCompact(!sidebarCompact)}
        />
        <section
          className="workspace"
          inert={sidebarOpen || sourceModalOpen}
          aria-hidden={sidebarOpen || sourceModalOpen ? true : undefined}
        >
          <BotanicalArt className="panel-art" />
          <ContextBar
            onMenu={() => setSidebarOpen(true)}
            onSource={() => setSourceSheetOpen(true)}
            privateMode={privateMode}
          />
          <CurrentView />
        </section>
        {sourceModalOpen && (
          <button
            className="source-scrim"
            aria-label="Close source workbench"
            onClick={closeSource}
          />
        )}
        {hasSource && sourceSheetOpen && state.view === "chat" && (
          <SourceWorkbench
            modal={sourceIsModal}
            width={workbenchWidth}
            onResize={resizeWorkbench}
            onClose={closeSource}
          />
        )}
      </div>
      {saveError && <Toast tone="danger">{saveError}</Toast>}
    </div>
  )
}

type Route =
  | "home"
  | "platform"
  | "how-it-works"
  | "resources"
  | "about"
  | "privacy-and-records"
  | "faq"
  | "help"
  | "signin"
  | "app"
  | "demo"
  | "counsel-handoff/5D2026-2915"

const siteRoutes: Route[] = [
  "platform",
  "how-it-works",
  "resources",
  "about",
  "privacy-and-records",
  "faq",
  "help",
  "signin",
  "app",
  "counsel-handoff/5D2026-2915",
]

function parseRoute(): Route {
  const path = location.hash.replace(/^#\/?/, "")
  if (!path) return "home"
  if (siteRoutes.includes(path as Route)) return path as Route
  if (validViews.includes(path as ViewId)) return "demo"
  return "home"
}

function PrivateCounselHandoffRoute() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void getSession()
      .then((current) => {
        if (active) {
          setSession(current)
          setReady(true)
        }
      })
      .catch(() => active && setReady(true))
    const unsubscribe = onAuthStateChange((_event, next) => {
      if (active) setSession(next)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  if (!ready) return null
  if (!session) return <SignInView />
  return <CounselHandoffView />
}

function PrivateWorkspaceRoute() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void getSession()
      .then((current) => {
        if (active) {
          setSession(current)
          setReady(true)
        }
      })
      .catch(() => active && setReady(true))
    const unsubscribe = onAuthStateChange((_event, next) => {
      if (active) setSession(next)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  if (!ready) return null
  if (!session) return <SignInView />
  if (!getActiveMatterId()) {
    return <SignInView />
  }
  return (
    <AppProvider>
      <Workspace privateMode />
    </AppProvider>
  )
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute)
  useLook()
  useEffect(() => {
    const update = () => setRoute(parseRoute())
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])

  switch (route) {
    case "platform":
      return <PlatformPage />
    case "how-it-works":
      return <HowItWorksPage />
    case "resources":
      return <ResourcesPage />
    case "about":
      return <AboutPage />
    case "privacy-and-records":
      return <PrivacyPage />
    case "faq":
      return <FaqPage />
    case "help":
      return <HelpPage />
    case "signin":
      return isSupabaseConfigured ? <SignInView /> : (
        <div className="wtp-setup-panel" role="status">
          <h1>Private application setup required</h1>
          <p>The founder-alpha interface is prepared, but no verified Supabase project is configured.</p>
          <p>Add the public URL and publishable key to a local <code>.env.local</code> file, apply the reviewed migration, and deploy the source-preservation function. Do not upload confidential case files until the security tests pass.</p>
          <a href="#/">Return to public preview</a>
        </div>
      )
    case "app":
      return isSupabaseConfigured ? <PrivateWorkspaceRoute /> : (
        <div className="wtp-setup-panel" role="status">
          <h1>Private application setup required</h1>
          <p>Add a verified Supabase project before opening the private workspace.</p>
          <a href="#/">Return to public preview</a>
        </div>
      )
    case "counsel-handoff/5D2026-2915":
      return isSupabaseConfigured ? <PrivateCounselHandoffRoute /> : (
        <div className="wtp-setup-panel" role="status">
          <h1>Private handoff setup required</h1>
          <p>Authenticated Supabase access is required for this module.</p>
          <a href="#/">Return to public preview</a>
        </div>
      )
    case "demo":
      return (
        <AppProvider>
          <p className="wtp-demo-banner" role="status">FICTIONAL DESIGN DEMO — data is stored in this browser only. Not connected to your private matter.</p>
          <Workspace />
        </AppProvider>
      )
    default:
      return <HomePage />
  }
}
