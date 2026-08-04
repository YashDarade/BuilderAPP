"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useProjects,
  useExpenses,
  useMaterials,
  useReports,
  useMonthlyExpenses,
  useBudgetConsumption,
  useProjectProgress,
  useDashboardStats,
} from "@/lib/hooks/use-data"
import { useStore } from "@/lib/store"
import { isAdmin } from "@/lib/supabase/auth"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { ErrorState } from "@/components/error-state"
import { cn } from "@/lib/utils"
import { CHART_TOOLTIP_STYLE, CHART_LEGEND_STYLE } from "@/lib/chart-theme"
import { RefreshButton } from "@/components/refresh-button"
import {
  FolderKanban,
  Wallet,
  Receipt,
  TrendingDown,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Camera,
  FileText,
  Plus,
  Map,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const CHART_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#ef4444", "#8b5cf6", "#eab308"]

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  const formatted = amount.toLocaleString("en-IN")
  return `₹${formatted}`
}

function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { currentUser } = useStore()
  const admin = isAdmin(currentUser)
  const role = currentUser?.role || "owner"
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: rawProjects, error: projectsError, refetch: refetchProjects } = useProjects()
  const projects = rawProjects ?? []
  const { data: rawExpenses, refetch: refetchExpenses } = useExpenses()
  const expenses = rawExpenses ?? []
  const { data: rawMaterials, refetch: refetchMaterials } = useMaterials()
  const materials = rawMaterials ?? []
  const { data: rawReports, refetch: refetchReports } = useReports()
  const reports = rawReports ?? []
  const { data: rawMonthlyExpenses, refetch: refetchMonthly } = useMonthlyExpenses()
  const monthlyExpenses = rawMonthlyExpenses ?? []
  const { data: rawBudgetConsumption, refetch: refetchBudget } = useBudgetConsumption()
  const budgetConsumption = rawBudgetConsumption ?? []
  const { data: rawProjectProgress, refetch: refetchProgress } = useProjectProgress()
  const projectProgress = rawProjectProgress ?? []

  useRealtimeSync(["projects", "expenses", "materials", "progress_reports", "site_photos", "roadmaps"], () => {
    refetchProjects()
    refetchExpenses()
    refetchMaterials()
    refetchReports()
    refetchMonthly()
    refetchBudget()
    refetchProgress()
  })

  const monthlyBarData = Object.values(
    monthlyExpenses.reduce(
      (acc, item) => {
        if (!acc[item.month]) {
          acc[item.month] = { month: item.month, amount: 0 }
        }
        acc[item.month].amount += item.amount
        return acc
      },
      {} as Record<string, { month: string; amount: number }>
    )
  )

  const budgetPieData = budgetConsumption.map((item) => ({
    name: item.project_name,
    value: item.spent,
    percentage: item.percentage,
  }))

  const materialByCategory = Object.values(
    materials.reduce(
      (acc, m) => {
        if (!acc[m.category]) {
          acc[m.category] = { category: m.category, used: 0, remaining: 0 }
        }
        acc[m.category].used += m.quantity_used * m.cost_per_unit
        acc[m.category].remaining += m.quantity_remaining * m.cost_per_unit
        return acc
      },
      {} as Record<string, { category: string; used: number; remaining: number }>
    )
  )

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())
    .slice(0, 4)

  function getProjectName(projectId: string): string {
    return projects.find((p) => p.id === projectId)?.name || "Unknown"
  }

  function getProjectStatus(projectId: string): string {
    return projects.find((p) => p.id === projectId)?.status || "Unknown"
  }

  if (statsError || projectsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <ErrorState
          message={statsError || projectsError || "Failed to load dashboard data"}
          onRetry={refetchProjects}
        />
      </div>
    )
  }

  // Engineer Dashboard
  if (role === "site_engineer") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Engineer Dashboard</h1>
            <p className="text-muted-foreground">Your projects and daily operations</p>
          </div>
          <div className="flex gap-2">
            <RefreshButton onRefresh={() => {
              refetchProjects()
              refetchExpenses()
              refetchMaterials()
              refetchReports()
            }} />
            <Link href="/photos">
              <Button variant="outline" size="sm">
                <Camera className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            </Link>
            <Link href="/reports">
              <Button size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Submit Report
              </Button>
            </Link>
          </div>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">My Projects</p>
                    <p className="text-2xl font-bold">{projects.length}</p>
                  </div>
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <FolderKanban className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reports Filed</p>
                    <p className="text-2xl font-bold">{reports.length}</p>
                  </div>
                  <div className="rounded-full bg-green-500/10 p-3">
                    <FileText className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Photos Uploaded</p>
                    <p className="text-2xl font-bold">15</p>
                  </div>
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <Camera className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses This Month</p>
                    <p className="text-2xl font-bold">{formatCurrencyINR(850000)}</p>
                  </div>
                  <div className="rounded-full bg-orange-500/10 p-3">
                    <Receipt className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.address}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="text-xs">{project.status}</Badge>
                    <div className="text-right">
                      <p className="text-sm font-bold">{project.progress}%</p>
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Reports</CardTitle>
              <Link href="/reports">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{getProjectName(report.project_id)}</p>
                    <span className="text-xs text-muted-foreground">{report.report_date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{report.work_completed}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Client Dashboard
  if (role === "client") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-orange-500/10 to-blue-500/10 border p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {currentUser?.full_name?.split(" ")[0] || "Client"}</h1>
            <p className="text-muted-foreground mt-1">
              You have {projects.length} active projects. Here&apos;s your overview.
            </p>
          </div>
          <RefreshButton onRefresh={() => {
            refetchProjects()
            refetchReports()
          }} />
        </div>

        {/* Project Health Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 6).map((project) => {
            const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{project.address}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{project.status}</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              project.progress >= 70 ? "bg-green-500" :
                              project.progress >= 40 ? "bg-blue-500" : "bg-orange-500"
                            )}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Budget</span>
                          <span className={cn("font-medium", budgetPct > 80 ? "text-red-500" : "")}>{budgetPct}% used</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              budgetPct > 80 ? "bg-red-500" : budgetPct > 50 ? "bg-yellow-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(budgetPct, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₹{(project.spent / 100000).toFixed(1)}L spent</span>
                        <span>₹{((project.budget - project.spent) / 100000).toFixed(1)}L left</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {budgetPieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [formatCurrencyFull(Number(value)), String(name)]}
                    {...CHART_TOOLTIP_STYLE}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => value.length > 20 ? `${value.slice(0, 18)}...` : value}
                    {...CHART_LEGEND_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports Brief */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Latest Reports</CardTitle>
              <Link href="/reports">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.slice(0, 3).map((report) => (
                <div key={report.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{getProjectName(report.project_id)}</p>
                    <span className="text-xs text-muted-foreground">{report.report_date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{report.work_completed}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin Dashboard (original with all charts)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your construction projects and financials
          </p>
        </div>
        <RefreshButton onRefresh={() => {
          refetchProjects()
          refetchExpenses()
          refetchMaterials()
          refetchReports()
          refetchMonthly()
          refetchBudget()
          refetchProgress()
        }} />
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                </div>
                <div className="rounded-full bg-blue-500/10 p-3">
                  <FolderKanban className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">{formatCurrencyINR(stats.totalBudget)}</p>
                </div>
                <div className="rounded-full bg-green-500/10 p-3">
                  <Wallet className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrencyINR(stats.totalExpenses)}</p>
                </div>
                <div className="rounded-full bg-red-500/10 p-3">
                  <Receipt className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Budget Remaining</p>
                  <p className="text-2xl font-bold">{formatCurrencyINR(stats.budgetRemaining)}</p>
                </div>
                <div className="rounded-full bg-orange-500/10 p-3">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Material Value</p>
                  <p className="text-2xl font-bold">{formatCurrencyINR(stats.materialValue)}</p>
                </div>
                <div className="rounded-full bg-purple-500/10 p-3">
                  <Package className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delayed Projects</p>
                  <p className="text-2xl font-bold">{stats.delayedProjects}</p>
                </div>
                <div className="rounded-full bg-yellow-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {statsLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBarData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} tickLine={false} />
                      <Tooltip
                        formatter={(value) => [formatCurrencyFull(Number(value)), "Expenses"]}
                        {...CHART_TOOLTIP_STYLE}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget Consumption by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {budgetPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [formatCurrencyFull(Number(value)), String(name)]}
                        {...CHART_TOOLTIP_STYLE}
                      />
                      <Legend verticalAlign="bottom" height={36} formatter={(value) => value.length > 20 ? `${value.slice(0, 18)}...` : value} {...CHART_LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {statsLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgress} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
                      <YAxis type="category" dataKey="project_name" tick={{ fontSize: 11 }} width={150} tickLine={false} />
                      <Tooltip formatter={(value) => [`${value}%`, "Progress"]} {...CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="progress" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {projectProgress.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.progress >= 60 ? "#22c55e" : entry.progress >= 40 ? "#3b82f6" : "#f97316"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Material Usage by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materialByCategory}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} tickLine={false} />
                      <Tooltip
                        formatter={(value, name) => [formatCurrencyFull(Number(value)), name === "used" ? "Used Value" : "Remaining Value"]}
                        {...CHART_TOOLTIP_STYLE}
                      />
                      <Legend />
                      <Bar dataKey="used" stackId="materials" fill="#ef4444" name="Used" />
                      <Bar dataKey="remaining" stackId="materials" fill="#22c55e" radius={[4, 4, 0, 0]} name="Remaining" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {statsLoading ? (
          <>
            <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-[200px] w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-[200px] w-full" /></CardContent></Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Expenses</CardTitle>
                  <span className="text-sm text-muted-foreground">Latest {recentExpenses.length} entries</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="rounded-full bg-primary/10 p-2 shrink-0">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">{getProjectName(expense.project_id)} · {expense.category} · {expense.vendor}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold text-red-500">-{formatCurrencyFull(expense.amount)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Reports</CardTitle>
                  <span className="text-sm text-muted-foreground">Latest updates</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{getProjectName(report.project_id)}</p>
                          <Badge variant="secondary" className="text-xs">{getProjectStatus(report.project_id)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{report.work_completed}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(report.report_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
