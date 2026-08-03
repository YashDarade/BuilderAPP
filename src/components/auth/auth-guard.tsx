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

      // Try auth_id first, fallback to email
      let { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", session.user.id)
        .single()

      if (!profile) {
        const fallback = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single()
        profile = fallback.data

        if (profile) {
          await supabase
            .from("users")
            .update({ auth_id: session.user.id })
            .eq("id", profile.id)
        }
      }

      if (!profile) {
        console.error("[AuthGuard] No profile found")
        resolvedRef.current = true
        try { await supabase.auth.signOut() } catch {}
        window.location.href = "/sign-in"
        return
      }

      console.log("[AuthGuard] Profile loaded:", profile.email, profile.role)
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
      console.log("[AuthGuard] No-persist flag set and session not active — signing out")
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
        console.log("[AuthGuard] getSession found session")
        loadProfile(session)
        return
      }

      // Step 2: No session from getSession — set a short timeout
      // onAuthStateChange may still fire with the session
      timeout = setTimeout(() => {
        if (resolvedRef.current) return
        console.log("[AuthGuard] No session after timeout — redirecting")
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
      console.log("[AuthGuard] onAuthStateChange:", event, "session:", !!session)
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
