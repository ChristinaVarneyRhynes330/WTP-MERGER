import { X, type LucideIcon } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react"

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
let nextModalTrigger: HTMLElement | null = null

export function rememberModalTrigger(element: HTMLElement) {
  nextModalTrigger = element
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [query])

  return matches
}

export function useModalSurface(
  active: boolean,
  onClose: () => void,
  surfaceRef: RefObject<HTMLElement | null>,
) {
  const closeRef = useRef(onClose)
  const restoreTimerRef = useRef<number | null>(null)
  closeRef.current = onClose
  useEffect(() => {
    if (!active) return
    if (restoreTimerRef.current !== null) {
      window.clearTimeout(restoreTimerRef.current)
      restoreTimerRef.current = null
    }
    const previous =
      nextModalTrigger ?? document.activeElement as HTMLElement | null
    const previousId = previous?.id
    nextModalTrigger = null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusables = Array.from(
      surfaceRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ??
        [],
    )
    ;(focusables[0] ?? surfaceRef.current)?.focus()

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== "Tab") return
      const items = Array.from(
        surfaceRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ??
          [],
      ).filter((item) => !item.hasAttribute("disabled"))
      if (!items.length) {
        event.preventDefault()
        surfaceRef.current?.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = originalOverflow
      restoreTimerRef.current = window.setTimeout(() => {
        const target =
          (previousId
            ? document.getElementById(previousId)
            : previous?.isConnected
              ? previous
              : null) ?? previous
        target?.focus()
        restoreTimerRef.current = null
      }, 0)
    }
  }, [active, surfaceRef])
}

export function Button({
  children,
  icon: Icon,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode
  icon?: LucideIcon
  variant?: "primary" | "secondary" | "ghost" | "danger"
}) {
  return (
    <button className={`button button--${variant} ${className}`} {...props}>
      {Icon && <Icon aria-hidden="true" size={18} />}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  icon: Icon,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: LucideIcon
}) {
  return (
    <button
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon aria-hidden="true" size={20} />
    </button>
  )
}

export function FrostedPanel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`frosted-panel ${className}`}>{children}</section>
}

export function ReadingSurface({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`reading-surface ${className}`}>{children}</div>
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon aria-hidden="true" size={24} />
      </span>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  )
}

export function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  useModalSurface(true, onClose, panelRef)
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <IconButton label="Close" icon={X} onClick={onClose} />
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}

export function Toast({
  children,
  tone = "info",
}: {
  children: ReactNode
  tone?: "info" | "success" | "danger"
}) {
  return (
    <div className={`toast toast--${tone}`} role="status">
      {children}
    </div>
  )
}
