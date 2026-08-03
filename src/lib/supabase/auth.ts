import { createClient } from '@/lib/supabase/config'
import type { User } from '@/lib/types'

export async function signUp(
  email: string,
  password: string,
  metadata: { full_name: string; role?: string; phone?: string }
) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: metadata.full_name,
        role: metadata.role || 'site_engineer',
        phone: metadata.phone || '',
      },
    },
  })
  return { data, error }
}

export async function signIn(email: string, password: string, persistSession = true) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  // Call server-side API to properly clear HttpOnly cookies
  try {
    await fetch("/api/auth/signout", { method: "POST" })
  } catch {
    // API call may fail, continue with client-side cleanup
  }

  // Also call client-side signOut as fallback
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch {
    // ignore
  }

  // Clear Remember Me flags
  if (typeof document !== "undefined") {
    document.cookie = "bt_no_persist=; path=/; max-age=0"
    sessionStorage.removeItem("bt_session_active")
  }

  return { error: null }
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })
  return { data, error }
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  // Try auth_id first, fallback to email
  let { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (!profile) {
    const fallback = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()
    profile = fallback.data

    // Backfill auth_id for next time
    if (profile) {
      await supabase
        .from('users')
        .update({ auth_id: user.id })
        .eq('id', profile.id)
    }
  }

  return profile as User | null
}

export async function getSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const supabase = createClient()
  return supabase.auth.onAuthStateChange(callback)
}

export function isOwner(user: User | null): boolean {
  return user?.role === 'owner'
}

export function isAdmin(user: User | null): boolean {
  return isOwner(user)
}
