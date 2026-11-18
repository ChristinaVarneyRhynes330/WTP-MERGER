import { useEffect, useState } from "react"

export type LookId = "botanical" | "sepia"
const KEY = "wtp-look"

function readLook(): LookId {
  try {
    const query = new URLSearchParams(location.search).get("look")
    if (query === "sepia" || query === "botanical") return query
    const stored = localStorage.getItem(KEY)
    if (stored === "sepia" || stored === "botanical") return stored
  } catch {
    /* storage unavailable: fall back to the default look */
  }
  return "botanical"
}

export function applyLook(look: LookId) {
  document.documentElement.dataset.look = look
}

export function setLook(look: LookId) {
  try {
    localStorage.setItem(KEY, look)
  } catch {
    /* the look still applies for this session */
  }
  applyLook(look)
  window.dispatchEvent(new Event("wtp-look"))
}

export function useLook() {
  const [look, setState] = useState<LookId>(readLook)
  useEffect(() => {
    applyLook(look)
  }, [look])
  useEffect(() => {
    const sync = () => setState(readLook())
    window.addEventListener("wtp-look", sync)
    return () => window.removeEventListener("wtp-look", sync)
  }, [])
  return look
}
