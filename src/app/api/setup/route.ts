import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function goTrueSignUp(email: string, password: string, data: Record<string, string>) {
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    body: JSON.stringify({ email, password, data }),
  })
  const json = await res.json()
  return { status: res.status, ok: res.ok, error: json.error_description || json.error || json.msg || null, user: json.user || null }
}

async function goTrueSignIn(email: string, password: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  return { status: res.status, ok: res.ok, error: json.error_description || json.error || json.msg || null, user: json.user || null, session: json.access_token || null }
}

async function ensureUser(email: string, password: string, fullName: string, role: string, phone: string) {
  const signIn = await goTrueSignIn(email, password)
  if (signIn.ok && signIn.user) {
    return { authId: signIn.user.id, wasExisting: true, session: signIn.session }
  }
  const signUp = await goTrueSignUp(email, password, { full_name: fullName, role, phone })
  if (signUp.ok && signUp.user) {
    return { authId: signUp.user.id, wasExisting: false, session: null }
  }
  throw new Error(`Cannot create/sign-in ${email}: signIn=${signIn.error}, signUp=${signUp.error}`)
}

export async function GET() {
  const results: Record<string, any> = {}
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Clean up all public data
    await supabase.from("notifications").delete().gte("created_at", "2020-01-01")
    await supabase.from("budget_alerts").delete().gte("created_at", "2020-01-01")
    await supabase.from("progress_reports").delete().gte("created_at", "2020-01-01")
    await supabase.from("site_photos").delete().gte("created_at", "2020-01-01")
    await supabase.from("expenses").delete().gte("created_at", "2020-01-01")
    await supabase.from("materials").delete().gte("created_at", "2020-01-01")
    await supabase.from("projects").delete().gte("created_at", "2020-01-01")
    await supabase.from("users").delete().gte("created_at", "2020-01-01")
    results.step1_cleanup = "done"

    // Ensure auth users exist
    const admin = await ensureUser("admin@buildtrack.com", "DEMO1234", "Rajesh Kumar", "owner", "+91 98765 43210")
    const engineer = await ensureUser("site@buildtrack.com", "DEMO1234", "Priya Sharma", "site_engineer", "+91 98765 43211")
    const client = await ensureUser("client@buildtrack.com", "DEMO1234", "Amit Patel", "client", "+91 98765 43212")
    results.step2_users = { admin: admin.authId, engineer: engineer.authId, client: client.authId }

    // Use admin's session to make authenticated inserts (bypasses RLS properly)
    const adminClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${admin.session}` } },
    })

    // If admin session is null (existing user, signIn doesn't return full session via raw fetch),
    // create an authenticated client via the Supabase client signInWithPassword
    let authedSupabase = supabase
    if (!admin.session) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: "admin@buildtrack.com",
        password: "DEMO1234",
      })
      if (signInErr || !signInData.session) {
        throw new Error(`Admin signIn failed: ${signInErr?.message}`)
      }
      authedSupabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${signInData.session.access_token}` } },
      })
    } else {
      authedSupabase = adminClient
    }
    results.step3_auth = "authenticated"

    // Insert public profiles using authenticated client
    const { data: adminProfile, error: adminErr } = await authedSupabase.from("users").insert({
      auth_id: admin.authId, email: "admin@buildtrack.com", full_name: "Rajesh Kumar", role: "owner", org_id: "00000000-0000-0000-0000-000000000001", phone: "+91 98765 43210"
    }).select().single()
    if (adminErr) throw new Error(`Admin profile: ${adminErr.message}`)

    const { data: engProfile, error: engErr } = await authedSupabase.from("users").insert({
      auth_id: engineer.authId, email: "site@buildtrack.com", full_name: "Priya Sharma", role: "site_engineer", org_id: "00000000-0000-0000-0000-000000000001", phone: "+91 98765 43211"
    }).select().single()
    if (engErr) throw new Error(`Engineer profile: ${engErr.message}`)

    const { data: cliProfile, error: cliErr } = await authedSupabase.from("users").insert({
      auth_id: client.authId, email: "client@buildtrack.com", full_name: "Amit Patel", role: "client", org_id: "00000000-0000-0000-0000-000000000001", phone: "+91 98765 43212"
    }).select().single()
    if (cliErr) throw new Error(`Client profile: ${cliErr.message}`)

    results.step4_profiles = { admin: !!adminProfile, engineer: !!engProfile, client: !!cliProfile }

    // Seed projects
    const projects = [
      { name: "Sunset Villa Complex", client_name: "Amit Patel", client_id: cliProfile.id, address: "123 Marine Drive, Mumbai", start_date: "2024-01-15", expected_completion_date: "2025-06-30", budget: 25000000, spent: 15750000, status: "Structure", progress: 45, created_by: adminProfile.id },
      { name: "Metro Office Tower", client_name: "Neha Gupta", client_id: cliProfile.id, address: "456 Business Park, Bangalore", start_date: "2024-03-01", expected_completion_date: "2025-12-31", budget: 75000000, spent: 37500000, status: "Brickwork", progress: 60, created_by: adminProfile.id },
      { name: "Harbor View Residency", client_name: "Amit Patel", client_id: cliProfile.id, address: "789 Coastal Road, Chennai", start_date: "2024-06-01", expected_completion_date: "2025-09-30", budget: 40000000, spent: 12000000, status: "Foundation", progress: 20, created_by: adminProfile.id },
      { name: "Green Valley Apartments", client_name: "Neha Gupta", client_id: cliProfile.id, address: "321 Hill Station Road, Pune", start_date: "2024-02-15", expected_completion_date: "2025-08-15", budget: 55000000, spent: 41250000, status: "Finishing", progress: 80, created_by: adminProfile.id },
      { name: "Skyline Commercial Hub", client_name: "Amit Patel", client_id: cliProfile.id, address: "567 Industrial Area, Hyderabad", start_date: "2023-11-01", expected_completion_date: "2025-05-30", budget: 90000000, spent: 81000000, status: "Finishing", progress: 90, created_by: adminProfile.id },
      { name: "Riverside Homes", client_name: "Neha Gupta", client_id: cliProfile.id, address: "890 River Bank, Kolkata", start_date: "2024-08-01", expected_completion_date: "2026-02-28", budget: 35000000, spent: 3500000, status: "Planning", progress: 5, created_by: adminProfile.id },
    ]
    const { data: projectRows, error: projErr } = await authedSupabase.from("projects").insert(projects).select()
    if (projErr) throw new Error(`Projects: ${projErr.message}`)
    results.step5_projects = projectRows?.length || 0

    const p1 = projectRows[0].id, p2 = projectRows[1].id, p4 = projectRows[3].id, p5 = projectRows[4].id

    await authedSupabase.from("materials").insert([
      { project_id: p1, name: "OPC 53 Cement", category: "Cement", quantity_purchased: 500, quantity_used: 320, unit: "bags", cost_per_unit: 380, vendor: "UltraTech Cement", reorder_level: 100 },
      { project_id: p1, name: "TMT Steel Bars 12mm", category: "Steel", quantity_purchased: 200, quantity_used: 150, unit: "pcs", cost_per_unit: 850, vendor: "Tata Steel", reorder_level: 50 },
      { project_id: p2, name: "Red Clay Bricks", category: "Bricks", quantity_purchased: 50000, quantity_used: 35000, unit: "pcs", cost_per_unit: 8, vendor: "Local Brick Kiln", reorder_level: 10000 },
      { project_id: p4, name: "Asian Paints Apex", category: "Paint", quantity_purchased: 200, quantity_used: 160, unit: "liters", cost_per_unit: 450, vendor: "Asian Paints", reorder_level: 40 },
      { project_id: p5, name: "TMT Steel Bars 16mm", category: "Steel", quantity_purchased: 300, quantity_used: 270, unit: "pcs", cost_per_unit: 1200, vendor: "SAIL", reorder_level: 50 },
    ])
    results.step6_materials = 5

    await authedSupabase.from("expenses").insert([
      { project_id: p1, amount: 250000, category: "Labor", vendor: "ABC Contractors", description: "Foundation labor", date: "2024-01-20", created_by: adminProfile.id },
      { project_id: p1, amount: 190000, category: "Cement", vendor: "UltraTech", description: "500 bags cement", date: "2024-01-22", created_by: adminProfile.id },
      { project_id: p2, amount: 500000, category: "Labor", vendor: "XYZ Constructions", description: "Structure labor", date: "2024-04-01", created_by: adminProfile.id },
      { project_id: p4, amount: 350000, category: "Miscellaneous", vendor: "Asian Paints", description: "Premium paint", date: "2025-01-15", created_by: adminProfile.id },
      { project_id: p5, amount: 800000, category: "Labor", vendor: "Premium Builders", description: "Finishing labor", date: "2025-03-01", created_by: adminProfile.id },
    ])
    results.step7_expenses = 5

    await authedSupabase.from("notifications").insert([
      { user_id: adminProfile.id, title: "Low Stock Alert", message: "Cement stock running low", type: "low_stock", is_read: false },
      { user_id: adminProfile.id, title: "Budget Warning", message: "Metro Office at 50%", type: "budget_warning", is_read: false },
      { user_id: engProfile.id, title: "Report Approved", message: "Your report approved", type: "new_report", is_read: false },
      { user_id: cliProfile.id, title: "Project Update", message: "Sunset Villa at 45%", type: "milestone", is_read: false },
    ])
    results.step8_notifications = 4

    await authedSupabase.from("budget_alerts").insert([
      { project_id: p1, alert_type: "budget_70", threshold_percentage: 63, message: "Budget at 63%", is_read: false },
      { project_id: p5, alert_type: "budget_90", threshold_percentage: 90, message: "Budget at 90%", is_read: false },
    ])
    results.step9_alerts = 2

    results.status = "FULL_SEED_COMPLETE"

  } catch (e: any) {
    results.error = e.message
    return NextResponse.json(results, { status: 500 })
  }

  return NextResponse.json(results, { status: 200 })
}
