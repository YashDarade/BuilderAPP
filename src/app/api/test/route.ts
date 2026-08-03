import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function goTrueSignUp(email: string, password: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ email, password, data: { full_name: "Test" } }),
  })
  const json = await res.json()
  return { status: res.status, ok: res.ok, error: json.error_description || json.error || json.msg || null, hasUser: !!json.user }
}

async function goTrueSignIn(email: string, password: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  return { status: res.status, ok: res.ok, error: json.error_description || json.error || json.msg || null, hasSession: !!json.access_token }
}

export async function GET() {
  const results: Record<string, any> = {}

  // Test 1: Random email signUp (like before)
  const randomEmail = `test_${Date.now()}@example.com`
  results.randomSignUp = await goTrueSignUp(randomEmail, "TestPass123!")

  // Test 2: admin email signUp
  results.adminSignUp = await goTrueSignUp("admin@buildtrack.com", "DEMO1234")

  // Test 3: signIn admin
  results.adminSignIn = await goTrueSignIn("admin@buildtrack.com", "DEMO1234")

  // Test 4: Check auth.users via listUsers
  try {
    const supabase = (await import("@supabase/supabase-js")).createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.auth.admin.listUsers()
    results.listUsers = { ok: !error, error: error?.message, count: data?.users?.length, users: data?.users?.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })) }
  } catch (e: any) {
    results.listUsers = { error: e.message }
  }

  // Test 5: Try deleting a user via admin API
  if (results.listUsers?.users?.length > 0) {
    const firstUser = results.listUsers.users[0]
    try {
      const supabase = (await import("@supabase/supabase-js")).createClient(supabaseUrl, supabaseKey)
      const { error } = await supabase.auth.admin.deleteUser(firstUser.id)
      results.deleteUser = { ok: !error, error: error?.message, userId: firstUser.id }
    } catch (e: any) {
      results.deleteUser = { error: e.message }
    }
  }

  return NextResponse.json(results, { status: 200 })
}
