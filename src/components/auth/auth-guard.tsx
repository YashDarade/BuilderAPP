"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/config"
import { useStore } from "@/lib/store"
import { Loader2, HardHat } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { login, setLoading, isLoading } = useStore()
  const [checking, setChecking] = useState(true)
  const resolvedRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let timeout: NodeJS.Timeout

    async function loadProfile(session: any) {
      if (resolvedRef.current) return

      const { data: profileRows } = await supabase.rpc("get_user_profile", {
        user_auth_id: session.user.id,
        user_email: session.user.email,
      })

      const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows

      if (!profile) {
        resolvedRef.current = true
        try { await supabase.auth.signOut() } catch {}
        window.location.href = "/sign-in"
        return
      }

      resolvedRef.current = true
      login(profile as any)
      setChecking(false)
      setLoading(false)
    }

    // Step 1: Check "Remember Me" flags
    // If bt_no_persist cookie exists but bt_session_active is missing (browser was reopened),
    // the user did not check "Remember Me" — sign out
    const noPersist = document.cookie.includes("bt_no_persist=1")
    const sessionActive = sessionStorage.getItem("bt_session_active")

    if (noPersist && !sessionActive) {
      supabase.auth.signOut().catch(() => {})
      document.cookie = "bt_no_persist=; path=/; max-age=0"
      resolvedRef.current = true
      setChecking(false)
      setLoading(false)
      window.location.href = "/sign-in"
      return
    }

    // Step 2: Try getSession() directly (most reliable)
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (resolvedRef.current) return

      if (session) {
        loadProfile(session)
        return
      }

      timeout = setTimeout(() => {
        if (resolvedRef.current) return
        resolvedRef.current = true
        setChecking(false)
        setLoading(false)
        window.location.href = "/sign-in"
      }, 3000)
    })

    // Step 3: Also listen for onAuthStateChange as backup
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (resolvedRef.current) return

      if (session) {
        clearTimeout(timeout)
        loadProfile(session)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [login, setLoading, router])

  if (checking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/icon-192.png" alt="BuildTrack" className="h-12 w-12 rounded-lg" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading BuildTrack...</span>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
