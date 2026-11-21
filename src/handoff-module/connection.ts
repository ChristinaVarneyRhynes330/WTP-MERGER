/**
 * Proposed parent-to-counsel integration boundary.
 *
 * IMPORTANT: The legacy Supabase RLS policies still use matter membership.
 * This adapter intentionally does NOT claim to enforce object grants or expose
 * any shared records. A server-enforced grant service must replace it before
 * the counsel connection can be enabled.
 */
export type VisibilityDomain =
  | "PARENT_PRIVATE"
  | "SHARED_MATTER"
  | "COUNSEL_PRIVATE"
  | "SYSTEM_RESTRICTED"

export type HandoffStatus = "disconnected" | "awaiting-approval" | "connected"

export type HandoffConnection = {
  status: HandoffStatus
  matterId: string
  authorizedObjectIds: readonly string[]
  reason: string
}

export type SharedMatterObject = {
  objectId: string
  matterId: string
  visibility: "SHARED_MATTER"
}

export interface HandoffBridge {
  getConnection(matterId: string): Promise<HandoffConnection>
  listGrantedObjects(matterId: string): Promise<readonly SharedMatterObject[]>
}

/**
 * Deliberately fail closed. No localStorage toggle, role flag, or client-side
 * approval may grant access. A future implementation must verify identity,
 * action, object and active grant on the server BEFORE fetching any metadata,
 * source chunks, signed URLs, or AI context.
 */
export const handoffBridge: HandoffBridge = Object.freeze({
  async getConnection(matterId: string): Promise<HandoffConnection> {
    return {
      matterId,
      status: "disconnected",
      authorizedObjectIds: [],
      reason: "Object-level grants and revocation are not yet enforced by the backend.",
    }
  },
  async listGrantedObjects(): Promise<readonly SharedMatterObject[]> {
    return []
  },
})
