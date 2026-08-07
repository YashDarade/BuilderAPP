import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface DashboardStats {
  activeProjects: number
  totalBudget: number
  totalExpenses: number
  budgetRemaining: number
  materialValue: number
  delayedProjects: number
}

export interface MonthlyExpense {
  month: string
  amount: number
}

export interface BudgetConsumption {
  project_id: string
  project_name: string
  budget: number
  spent: number
  percentage: number
}

/**
 * Analytics Service — server-side data aggregation.
 * Replaces client-side dashboard stats computation.
 */
export const AnalyticsService = {
  /**
   * Get dashboard stats for an org.
   */
  async getDashboardStats(orgId: string): Promise<DashboardStats> {
    const supabase = getSupabase()

    const [projectsRes, expensesRes, materialsRes] = await Promise.all([
      supabase.rpc("get_all_projects", { p_org_id: orgId }),
      supabase.rpc("get_all_expenses", { p_org_id: orgId }),
      supabase.rpc("get_all_materials", { p_org_id: orgId }),
    ])

    const projects = (projectsRes.data || []) as any[]
    const expenses = (expensesRes.data || []) as any[]
    const materials = (materialsRes.data || []) as any[]

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const materialValue = materials.reduce(
      (sum, m) => sum + (m.quantity_remaining || 0) * (m.cost_per_unit || 0),
      0
    )

    return {
      activeProjects: projects.filter((p) => p.status !== "Completed").length,
      totalBudget,
      totalExpenses,
      budgetRemaining: totalBudget - totalExpenses,
      materialValue,
      delayedProjects: projects.filter((p) => p.status === "Delayed").length,
    }
  },

  /**
   * Get monthly expenses for chart data.
   */
  async getMonthlyExpenses(orgId: string): Promise<MonthlyExpense[]> {
    const supabase = getSupabase()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const since = sixMonthsAgo.toISOString().split("T")[0]

    const { data } = await supabase.rpc("get_expenses_for_chart", {
      p_org_id: orgId,
      p_since: since,
    })

    const grouped: Record<string, number> = {}
    ;(data || []).forEach((e: any) => {
      const month = e.date?.substring(0, 7) || "Unknown"
      grouped[month] = (grouped[month] || 0) + (e.amount || 0)
    })

    return Object.entries(grouped).map(([month, amount]) => ({ month, amount }))
  },

  /**
   * Get budget consumption per project.
   */
  async getBudgetConsumption(orgId: string): Promise<BudgetConsumption[]> {
    const supabase = getSupabase()
    const { data } = await supabase.rpc("get_all_projects", { p_org_id: orgId })

    const seen = new Set<string>()
    return (data || [])
      .filter((p: any) => {
        if (seen.has(p.name)) return false
        seen.add(p.name)
        return true
      })
      .map((p: any) => ({
        project_id: p.id,
        project_name: p.name,
        budget: p.budget || 0,
        spent: p.spent || 0,
        percentage: p.budget ? Math.round(((p.spent || 0) / p.budget) * 100) : 0,
      }))
  },
}
