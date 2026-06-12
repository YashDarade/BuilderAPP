"use client"

import { useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  PieChart as PieChartIcon,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  mockProjects,
  mockBudgetConsumption,
  mockBudgetAlerts,
} from "@/lib/mock-data"

const CHART_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#ef4444", "#8b5cf6", "#eab308"]

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function getProgressColor(percentage: number): string {
  if (percentage > 90) return "bg-red-500"
  if (percentage >= 70) return "bg-yellow-500"
  return "bg-green-500"
}

function getAlertIcon(type: string) {
  switch (type) {
    case "budget_exceeded":
      return "text-red-500"
    case "budget_critical":
      return "text-orange-500"
    default:
      return "text-yellow-500"
  }
}

function getAlertBadgeVariant(type: string): "destructive" | "secondary" | "outline" {
  switch (type) {
    case "budget_exceeded":
      return "destructive"
    case "budget_critical":
      return "secondary"
    default:
      return "outline"
  }
}

export default function BudgetPage() {
  const totalBudget = useMemo(
    () => mockProjects.reduce((acc, p) => acc + p.budget, 0),
    []
  )

  const totalSpent = useMemo(
    () => mockProjects.reduce((acc, p) => acc + p.spent, 0),
    []
  )

  const totalRemaining = totalBudget - totalSpent
  const overallPercentage = Math.round((totalSpent / totalBudget) * 100)

  const pieData = useMemo(
    () =>
      mockBudgetConsumption.map((item) => ({
        name: item.project_name,
        value: item.spent,
        percentage: item.percentage,
      })),
    []
  )

  const unreadAlerts = useMemo(
    () => mockBudgetAlerts.filter((a) => !a.is_read),
    []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
        <p className="text-muted-foreground">
          Monitor project budgets and spending across all projects
        </p>
      </div>

      {/* Overall Budget Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrencyINR(totalBudget)}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrencyINR(totalSpent)}</p>
              </div>
              <div className="rounded-full bg-red-500/10 p-3">
                <TrendingUp className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">{formatCurrencyINR(totalRemaining)}</p>
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
                <p className="text-sm text-muted-foreground">Overall Used</p>
                <p className="text-2xl font-bold">{overallPercentage}%</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <PieChartIcon className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Distribution by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((_, index) => (
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
                    formatCurrencyINR(Number(value)),
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

      {/* Per-Project Budget Cards */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Project Budgets</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockBudgetConsumption.map((item) => {
            const colorClass = getProgressColor(item.percentage)
            return (
              <Card key={item.project_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{item.project_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrencyINR(item.spent)} of {formatCurrencyINR(item.budget)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.percentage > 90
                          ? "destructive"
                          : item.percentage >= 70
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {item.percentage}%
                    </Badge>
                  </div>
                  <Progress value={item.percentage}>
                    <ProgressLabel className="sr-only">Budget usage</ProgressLabel>
                    <ProgressValue />
                  </Progress>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Remaining: {formatCurrencyINR(item.budget - item.spent)}
                    </span>
                    {item.percentage > 70 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {item.percentage > 90 ? "Critical" : "Warning"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Budget Alerts */}
      {unreadAlerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Budget Alerts ({unreadAlerts.length} unread)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadAlerts.map((alert) => {
                const projectName =
                  mockProjects.find((p) => p.id === alert.project_id)?.name ||
                  "Unknown"
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-lg border bg-white/50 p-3 dark:bg-black/20"
                  >
                    <AlertTriangle
                      className={`mt-0.5 h-4 w-4 shrink-0 ${getAlertIcon(alert.alert_type)}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{projectName}</p>
                        <Badge variant={getAlertBadgeVariant(alert.alert_type)}>
                          {alert.alert_type.replace("budget_", "").replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
