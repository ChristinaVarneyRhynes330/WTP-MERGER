import type { ReactNode } from "react"
import { BotanicalArt, Monogram } from "../../components/brand"
import { useLook } from "../../lib/look"

export type SiteRoute =
  | "home"
  | "platform"
  | "how-it-works"
  | "resources"
  | "about"
  | "signin"
  | "help"

const mainLinks: { route: SiteRoute; label: string; href: string }[] = [
  { route: "home", label: "Home", href: "#/" },
  { route: "platform", label: "The platform", href: "#/platform" },
  { route: "how-it-works", label: "How it works", href: "#/how-it-works" },
  { route: "resources", label: "Resources", href: "#/resources" },
  { route: "about", label: "About", href: "#/about" },
]
const accountLinks: { route: SiteRoute; label: string; href: string }[] = [
  { route: "signin", label: "Sign in", href: "#/signin" },
  { route: "help", label: "Help", href: "#/help" },
]

function Pill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}) {
  return (
    <a
      className={`pill ${active ? "is-active" : ""}`}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </a>
  )
}

/** Shared chrome: gold-rimmed navigation rail beside a gold-rimmed main frame. */
export function SiteFrame({
  route,
  children,
  art = true,
}: {
  route: SiteRoute
  children: ReactNode
  art?: boolean
}) {
  useLook()
  return (
    <div className="site">
      <BotanicalArt className="page-art" />
      <nav className="site-rail rim" aria-label="Website">
        <a className="site-rail__logo" href="#/" aria-label="We The Parent home">
          <Monogram size={104} />
        </a>
        <div className="site-rail__links">
          {mainLinks.map((link) => (
            <Pill key={link.route} href={link.href} active={route === link.route}>
              {link.label}
            </Pill>
          ))}
        </div>
        <div className="site-rail__links site-rail__links--account">
          {accountLinks.map((link) => (
            <Pill key={link.route} href={link.href} active={route === link.route}>
              {link.label}
            </Pill>
          ))}
        </div>
      </nav>
      <main className="site-main rim">
        {art && <BotanicalArt />}
        <div className="site-main__content">{children}</div>
      </main>
    </div>
  )
}
