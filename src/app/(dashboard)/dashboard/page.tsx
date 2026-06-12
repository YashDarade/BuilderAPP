"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  mockProjects,
  mockExpenses,
  mockMaterials,
  mockMonthlyExpenses,
  mockBudgetConsumption,
  mockProjectProgress,
} from "@/lib/mock-data"
import {
  FolderKanban,
  Wallet,
  Receipt,
  TrendingDown,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Clock,
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

// Compute stats from mock data
const activeProjects = mockProjects.filter(
  (p) => p.status !== "Completed"
).length
const totalBudget = mockProjects.reduce((acc, p) => acc + p.budget, 0)
const totalExpenses = mockProjects.reduce((acc, p) => acc + p.spent, 0)
const budgetRemaining = totalBudget - totalExpenses
const materialValue = mockMaterials.reduce(
  (acc, m) => acc + m.quantity_remaining * m.cost_per_unit,
  0
)
const delayedProjects = mockProjects.filter(
  (p) => p.progress < 30 && p.status !== "Planning"
).length

// Aggregate monthly expenses by month
const monthlyBarData = Object.values(
  mockMonthlyExpenses.reduce(
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

// Budget consumption pie data
const budgetPieData = mockBudgetConsumption.map((item) => ({
  name: item.project_name,
  value: item.spent,
  percentage: item.percentage,
}))

// Material usage by category
const materialByCategory = Object.values(
  mockMaterials.reduce(
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

// Recent expenses sorted by date
const recentExpenses = [...mockExpenses]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 6)

// Recent reports
const mockProgressReports = [
  {
    id: "1",
    project_id: "proj-004",
    report_date: "2025-06-07",
    work_completed:
      "Completed 1st floor slab casting for main building. Started brickwork for classroom blocks.",
    created_by: "user-003",
    created_at: "2025-06-07T18:00:00Z",
  },
  {
    id: "2",
    project_id: "proj-005",
    report_date: "2025-06-10",
    work_completed:
      "Completed floor tiling in apartments 1A, 2A, 3A, 1B. Painting work in progress on 3rd floor.",
    created_by: "user-003",
    created_at: "2025-06-10T18:00:00Z",
  },
  {
    id: "3",
    project_id: "proj-002",
    report_date: "2025-06-05",
    work_completed:
      "Completed brickwork on floors 5-7. Started plumbing rough-in on floors 1-4.",
    created_by: "user-003",
    created_at: "2025-06-05T18:00:00Z",
  },
  {
    id: "4",
    project_id: "proj-006",
    report_date: "2025-06-05",
    work_completed:
      "Completed site clearing and boundary wall construction. Excavation for main building foundation started.",
    created_by: "user-002",
    created_at: "2025-06-05T18:00:00Z",
  },
]

function getProjectName(projectId: string): string {
  return mockProjects.find((p) => p.id === projectId)?.name || "Unknown"
}

function getProjectStatus(projectId: string): string {
  return mockProjects.find((p) => p.id === projectId)?.status || "Unknown"
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your construction projects and financials
        </p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{activeProjects}</p>
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
                <p className="text-2xl font-bold">
                  {formatCurrencyINR(totalBudget)}
                </p>
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
                <p className="text-2xl font-bold">
                  {formatCurrencyINR(totalExpenses)}
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Budget Remaining
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrencyINR(budgetRemaining)}
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Material Value
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrencyINR(materialValue)}
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Delayed Projects
                </p>
                <p className="text-2xl font-bold">{delayedProjects}</p>
              </div>
              <div className="rounded-full bg-yellow-500/10 p-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Expenses Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBarData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrencyFull(Number(value)),
                      "Expenses",
                    ]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Budget Consumption Pie Chart */}
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
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrencyFull(Number(value)),
                      String(name),
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) =>
                      value.length > 20 ? `${value.slice(0, 18)}...` : value
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Project Progress Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockProjectProgress}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="project_name"
                    tick={{ fontSize: 11 }}
                    width={150}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Progress"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="progress" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {mockProjectProgress.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.progress >= 60
                            ? "#22c55e"
                            : entry.progress >= 40
                            ? "#3b82f6"
                            : "#f97316"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Material Usage Stacked Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Material Usage by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialByCategory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrencyFull(Number(value)),
                      name === "used" ? "Used Value" : "Remaining Value",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="used"
                    stackId="materials"
                    fill="#ef4444"
                    radius={[0, 0, 0, 0]}
                    name="Used"
                  />
                  <Bar
                    dataKey="remaining"
                    stackId="materials"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    name="Remaining"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Expenses</CardTitle>
              <span className="text-sm text-muted-foreground">
                Latest {recentExpenses.length} entries
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="rounded-full bg-primary/10 p-2 shrink-0">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {expense.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getProjectName(expense.project_id)} &middot;{" "}
                        {expense.category} &middot; {expense.vendor}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-red-500">
                      -{formatCurrencyFull(expense.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Progress Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Reports</CardTitle>
              <span className="text-sm text-muted-foreground">
                Latest updates
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockProgressReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">
                        {getProjectName(report.project_id)}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600">
                        {getProjectStatus(report.project_id)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.work_completed}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(report.report_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
