import { useEffect, useState } from "react"
import { BriefcaseBusiness, LockKeyhole } from "lucide-react"
import { BotanicalArt } from "../components/brand"
import { ReadingSurface } from "../components/ui"
import { supabase } from "../lib/supabase"
import { handoffBridge } from "./connection"
import { LegacyCounselHandoffView } from "./LegacyCounselHandoffView"

type OwnerCheck = "checking" | "owner" | "disconnected" | "unavailable"

/**
 * The already-developed handoff inventory remains preserved for its matter
 * owner to review. It is NOT the new counsel-sharing system.
 *
 * This client check restricts the display of the legacy UI, but is NOT the
 * security boundary; existing database membership policies must be replaced
 * and tested before any professional access or per-object sharing is enabled.
 */
export function HandoffModule({ matterId }: { matterId: string }) {
  const [access, setAccess] = useState<OwnerCheck>("checking")

  useEffect(() => {
    let current = true
    setAccess("checking")
    const check = async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser()
        if (authError || !auth.user) throw new Error("Authentication required")
        const { data: matter, error: matterError } = await supabase
          .from("matters")
          .select("owner_id")
          .eq("id", matterId)
          .is("archived_at", null)
          .maybeSingle()
        if (matterError) throw matterError
        if (!current) return
        const connection = await handoffBridge.getConnection(matterId)
        if (!current) return
        // The connection remains disconnected for everyone. Only the owner can
        // view the EXISTING legacy inventory, which is not an approved share.
        setAccess(
          connection.status === "disconnected" && matter?.owner_id === auth.user.id
            ? "owner"
            : "disconnected",
        )
      } catch {
        if (current) setAccess("unavailable")
      }
    }
    void check()
    return () => { current = false }
  }, [matterId])

  if (access === "owner") {
    return <LegacyCounselHandoffView matterId={matterId} />
  }

  return (
    <main className="page-view counsel-handoff">
      <BotanicalArt kind="app" className="counsel-handoff__art" />
      <ReadingSurface className="counsel-handoff__guardrail">
        {access === "checking" ? (
          <p role="status">Checking your account and matter ownership…</p>
        ) : (
          <>
            <LockKeyhole size={24} aria-hidden="true" />
            <div>
              <h1>Handoff connection is not active</h1>
              <p>
                {access === "unavailable"
                  ? "Ownership could not be verified. No handoff data was loaded."
                  : "Professional sharing is disconnected until object-by-object permissions and revocation have been implemented and tested."}
              </p>
              <p>No matter membership or visible UI control can approve access to a private source.</p>
              <a className="counsel-handoff__back" href={`#/app/matters/${encodeURIComponent(matterId)}`}>
                <BriefcaseBusiness size={16} aria-hidden="true" /> Return to Parent Headquarters
              </a>
            </div>
          </>
        )}
      </ReadingSurface>
    </main>
  )
}
