const ACTIVE_MATTER_KEY = "wtp-active-matter-id"

export function getActiveMatterId() {
  return window.localStorage.getItem(ACTIVE_MATTER_KEY)
}

export function setActiveMatterId(matterId: string | null) {
  if (matterId) {
    window.localStorage.setItem(ACTIVE_MATTER_KEY, matterId)
  } else {
    window.localStorage.removeItem(ACTIVE_MATTER_KEY)
  }
}
