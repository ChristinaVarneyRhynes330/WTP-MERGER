import monogram from "../assets/wtp-monogram.png"
import tulip from "../assets/wtp-tulip.png"
import { useLook } from "../lib/look"

const photos = import.meta.glob("../assets/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

function photo(name: string) {
  return photos[`../assets/${name}.jpg`]
}

/** hero / app follow the chosen look; flowers and silk are fixed section photos. */
export type ArtKind = "hero" | "app" | "flowers" | "silk"

export function Monogram({ size = 96 }: { size?: number }) {
  return (
    <img
      className="monogram"
      src={monogram}
      width={size}
      height={size}
      alt="We The Parent"
      draggable={false}
    />
  )
}

export function TulipMark({ size = 56 }: { size?: number }) {
  return (
    <img
      className="tulip-mark"
      src={tulip}
      height={size}
      width={Math.round(size * 0.95)}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}

export function BotanicalArt({
  className = "",
  kind = "app",
}: {
  className?: string
  kind?: ArtKind
}) {
  const look = useLook()
  const name =
    kind === "hero" || kind === "app"
      ? `${kind}-${look}`
      : kind === "flowers"
        ? "section-flowers"
        : "section-silk"
  return (
    <div className={`art art--${look} art--${kind} ${className}`} aria-hidden="true">
      <img className="art__photo" src={photo(name)} alt="" draggable={false} />
      <div className="art__veil" />
    </div>
  )
}
