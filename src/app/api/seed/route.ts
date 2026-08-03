import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const ORG_ID = "00000000-0000-0000-0000-000000000001"

async function signUpUser(email: string, password: string, fullName: string, role: string, phone: string) {
  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, phone },
    },
  })
  if (error) throw new Error(`signUp ${email}: ${error.message}`)
  return data.user!
}

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    // Step 1: Clean up
    const emails = ["admin@buildtrack.com", "site@buildtrack.com", "client@buildtrack.com"]
    await supabaseAdmin.from("notifications").delete().in("user_id",
      (await supabaseAdmin.from("users").select("id").in("email", emails)).data?.map(u => u.id) || []
    )
    await supabaseAdmin.from("budget_alerts").delete().gte("created_at", "2020-01-01")
    await supabaseAdmin.from("progress_reports").delete().gte("created_at", "2020-01-01")
    await supabaseAdmin.from("site_photos").delete().gte("created_at", "2020-01-01")
    await supabaseAdmin.from("expenses").delete().gte("created_at", "2020-01-01")
    await supabaseAdmin.from("materials").delete().gte("created_at", "2020-01-01")
    await supabaseAdmin.from("projects").delete().gte("created_at", "2020-01-01")
    await supabaseAdmin.from("users").delete().in("email", emails)
    await supabaseAdmin.from("organizations").delete().eq("id", ORG_ID)
    results.cleanup = "done"

    // Step 2: Create organization
    const { data: org } = await supabaseAdmin.from("organizations").insert({
      id: ORG_ID,
      name: "BuildTrack Demo",
      plan: "pro",
    }).select().single()
    results.org = org?.id

    // Step 3: Sign up users through GoTrue
    const adminUser = await signUpUser("admin@buildtrack.com", "DEMO1234", "Rajesh Kumar", "owner", "+91 98765 43210")
    const engineerUser = await signUpUser("site@buildtrack.com", "DEMO1234", "Priya Sharma", "site_engineer", "+91 98765 43211")
    const clientUser = await signUpUser("client@buildtrack.com", "DEMO1234", "Amit Patel", "client", "+91 98765 43212")
    results.signUp = { admin: adminUser.id, engineer: engineerUser.id, client: clientUser.id }

    // Step 4: Create public profiles with org_id
    const { data: adminProfile } = await supabaseAdmin.from("users").insert({
      auth_id: adminUser.id, email: "admin@buildtrack.com", full_name: "Rajesh Kumar",
      role: "owner", org_id: ORG_ID, phone: "+91 98765 43210"
    }).select().single()

    const { data: engineerProfile } = await supabaseAdmin.from("users").insert({
      auth_id: engineerUser.id, email: "site@buildtrack.com", full_name: "Priya Sharma",
      role: "site_engineer", org_id: ORG_ID, phone: "+91 98765 43211"
    }).select().single()

    const { data: clientProfile } = await supabaseAdmin.from("users").insert({
      auth_id: clientUser.id, email: "client@buildtrack.com", full_name: "Amit Patel",
      role: "client", org_id: ORG_ID, phone: "+91 98765 43212"
    }).select().single()

    results.profiles = { admin: adminProfile?.id, engineer: engineerProfile?.id, client: clientProfile?.id }

    if (!adminProfile || !engineerProfile || !clientProfile) {
      results.error = "Failed to create profiles"
      return NextResponse.json(results, { status: 500 })
    }

    // Update org owner_id
    await supabaseAdmin.from("organizations").update({ owner_id: adminProfile.id }).eq("id", ORG_ID)

    // Step 5: Seed projects (org-scoped with engineer_id)
    const projects = [
      { name: "Sunshine Apartments", client_name: "Mr. Sharma", client_id: clientProfile.id, engineer_id: engineerProfile.id, org_id: ORG_ID, address: "123 MG Road, Pune", start_date: "2025-01-15", expected_completion_date: "2025-12-30", budget: 25000000, spent: 11250000, status: "Structure", progress: 45, created_by: adminProfile.id },
      { name: "Green Valley Villas", client_name: "Mrs. Patel", client_id: clientProfile.id, engineer_id: engineerProfile.id, org_id: ORG_ID, address: "456 Hinjewadi, Pune", start_date: "2025-02-01", expected_completion_date: "2025-10-15", budget: 18000000, spent: 11700000, status: "Brickwork", progress: 65, created_by: adminProfile.id },
      { name: "Metro Heights", client_name: "Mr. Kumar", client_id: clientProfile.id, engineer_id: engineerProfile.id, org_id: ORG_ID, address: "789 Baner Road, Pune", start_date: "2025-06-01", expected_completion_date: "2026-06-30", budget: 35000000, spent: 3500000, status: "Planning", progress: 10, created_by: adminProfile.id },
    ]
    const { data: projectRows } = await supabaseAdmin.from("projects").insert(projects).select()
    results.projects = projectRows?.length || 0

    if (!projectRows || projectRows.length === 0) {
      results.error = "Failed to create projects"
      return NextResponse.json(results, { status: 500 })
    }

    const [p1, p2, p3] = projectRows.map(p => p.id)

    // Step 6: Seed materials (org-scoped)
    const materials = [
      { project_id: p1, org_id: ORG_ID, name: "OPC 53 Cement", category: "Cement", quantity_purchased: 500, quantity_used: 320, unit: "bags", cost_per_unit: 380, vendor: "UltraTech Cement", reorder_level: 50 },
      { project_id: p1, org_id: ORG_ID, name: "TMT Steel Bars 12mm", category: "Steel", quantity_purchased: 200, quantity_used: 140, unit: "pcs", cost_per_unit: 950, vendor: "Tata Tiscon", reorder_level: 20 },
      { project_id: p1, org_id: ORG_ID, name: "River Sand", category: "Sand", quantity_purchased: 100, quantity_used: 75, unit: "tons", cost_per_unit: 1200, vendor: "Local Supplier", reorder_level: 10 },
      { project_id: p2, org_id: ORG_ID, name: "OPC 53 Cement", category: "Cement", quantity_purchased: 300, quantity_used: 210, unit: "bags", cost_per_unit: 380, vendor: "UltraTech Cement", reorder_level: 50 },
      { project_id: p2, org_id: ORG_ID, name: "Red Bricks", category: "Bricks", quantity_purchased: 10000, quantity_used: 7500, unit: "pcs", cost_per_unit: 8, vendor: "Brick Kiln Co", reorder_level: 1000 },
      { project_id: p2, org_id: ORG_ID, name: "CPVC Pipes", category: "Pipes", quantity_purchased: 150, quantity_used: 90, unit: "pcs", cost_per_unit: 250, vendor: "Astral Pipes", reorder_level: 20 },
      { project_id: p3, org_id: ORG_ID, name: "OPC 53 Cement", category: "Cement", quantity_purchased: 200, quantity_used: 20, unit: "bags", cost_per_unit: 380, vendor: "UltraTech Cement", reorder_level: 50 },
      { project_id: p3, org_id: ORG_ID, name: "TMT Steel Bars 12mm", category: "Steel", quantity_purchased: 100, quantity_used: 10, unit: "pcs", cost_per_unit: 950, vendor: "Tata Tiscon", reorder_level: 20 },
    ]
    await supabaseAdmin.from("materials").insert(materials)
    results.materials = materials.length

    // Step 7: Seed expenses (org-scoped)
    const expenses = [
      { project_id: p1, org_id: ORG_ID, amount: 450000, category: "Labor", vendor: "Ramesh Contractors", description: "Foundation labor charges - Month 1", date: "2025-02-01", created_by: adminProfile.id },
      { project_id: p1, org_id: ORG_ID, amount: 190000, category: "Cement", vendor: "UltraTech Cement", description: "200 bags OPC 53", date: "2025-02-05", created_by: adminProfile.id },
      { project_id: p1, org_id: ORG_ID, amount: 133000, category: "Steel", vendor: "Tata Tiscon", description: "140 TMT bars 12mm", date: "2025-02-10", created_by: adminProfile.id },
      { project_id: p1, org_id: ORG_ID, amount: 38000, category: "Transport", vendor: "ABC Logistics", description: "Material delivery charges", date: "2025-02-12", created_by: adminProfile.id },
      { project_id: p1, org_id: ORG_ID, amount: 75000, category: "Plumbing", vendor: "AquaFlow", description: "Underground plumbing rough-in", date: "2025-03-01", created_by: adminProfile.id },
      { project_id: p2, org_id: ORG_ID, amount: 350000, category: "Labor", vendor: "Suresh Builders", description: "Brickwork labor - Phase 1", date: "2025-04-01", created_by: adminProfile.id },
      { project_id: p2, org_id: ORG_ID, amount: 114000, category: "Cement", vendor: "UltraTech Cement", description: "300 bags OPC 53", date: "2025-04-05", created_by: adminProfile.id },
      { project_id: p2, org_id: ORG_ID, amount: 60000, category: "Bricks", vendor: "Brick Kiln Co", description: "7500 red bricks", date: "2025-04-08", created_by: adminProfile.id },
      { project_id: p2, org_id: ORG_ID, amount: 22500, category: "Electrical", vendor: "Havells", description: "Wiring and conduits", date: "2025-05-01", created_by: adminProfile.id },
      { project_id: p3, org_id: ORG_ID, amount: 76000, category: "Cement", vendor: "UltraTech Cement", description: "200 bags OPC 53", date: "2025-06-10", created_by: adminProfile.id },
      { project_id: p3, org_id: ORG_ID, amount: 95000, category: "Steel", vendor: "Tata Tiscon", description: "100 TMT bars 12mm", date: "2025-06-12", created_by: adminProfile.id },
    ]
    await supabaseAdmin.from("expenses").insert(expenses)
    results.expenses = expenses.length

    // Step 8: Seed reports (org-scoped)
    const reports = [
      { project_id: p1, org_id: ORG_ID, report_date: "2025-03-01", work_completed: "Foundation concrete pouring completed for Block A. Column reinforcement started.", material_used: "Cement: 50 bags, Steel: 20 bars", issues: "Minor waterlogging in excavation area", delays: "Rain caused 2-day delay", tomorrow_plan: "Complete column reinforcement for Block A", created_by: engineerProfile.id },
      { project_id: p1, org_id: ORG_ID, report_date: "2025-03-15", work_completed: "Column casting completed for Block A. Second floor slab shuttering in progress.", material_used: "Cement: 30 bags, Steel: 15 bars", issues: "None", delays: "None", tomorrow_plan: "Complete slab shuttering and start reinforcement", created_by: engineerProfile.id },
      { project_id: p2, org_id: ORG_ID, report_date: "2025-05-01", work_completed: "Ground floor brickwork completed. First floor slab casting done.", material_used: "Bricks: 3000, Cement: 40 bags", issues: "None", delays: "None", tomorrow_plan: "Start first floor brickwork", created_by: engineerProfile.id },
    ]
    await supabaseAdmin.from("progress_reports").insert(reports)
    results.reports = reports.length

    // Step 9: Seed notifications (org-scoped)
    const notifications = [
      { user_id: adminProfile.id, org_id: ORG_ID, title: "Budget Alert", message: "Sunshine Apartments has reached 70% budget utilization", type: "budget_warning", is_read: false },
      { user_id: adminProfile.id, org_id: ORG_ID, title: "New Report", message: "Priya Sharma submitted a daily progress report for Sunshine Apartments", type: "new_report", is_read: false },
      { user_id: adminProfile.id, org_id: ORG_ID, title: "Low Stock", message: "TMT Steel Bars stock is running low at Sunshine Apartments", type: "low_stock", is_read: false },
      { user_id: engineerProfile.id, org_id: ORG_ID, title: "Project Update", message: "Green Valley Villas status updated to Brickwork", type: "milestone", is_read: false },
      { user_id: clientProfile.id, org_id: ORG_ID, title: "Progress Report", message: "New progress report available for Sunshine Apartments", type: "new_report", is_read: false },
    ]
    await supabaseAdmin.from("notifications").insert(notifications)
    results.notifications = notifications.length

    // Step 10: Seed budget alerts (org-scoped)
    const alerts = [
      { project_id: p1, org_id: ORG_ID, alert_type: "budget_70", threshold_percentage: 45, message: "Sunshine Apartments budget at 45%", is_read: false },
      { project_id: p2, org_id: ORG_ID, alert_type: "budget_70", threshold_percentage: 65, message: "Green Valley Villas budget at 65%", is_read: false },
      { project_id: p3, org_id: ORG_ID, alert_type: "budget_70", threshold_percentage: 10, message: "Metro Heights budget at 10%", is_read: false },
    ]
    await supabaseAdmin.from("budget_alerts").insert(alerts)
    results.budgetAlerts = alerts.length

    results.status = "SUCCESS"

  } catch (e: any) {
    results.error = e.message
    return NextResponse.json(results, { status: 500 })
  }

  return NextResponse.json(results, { status: 200 })
}
