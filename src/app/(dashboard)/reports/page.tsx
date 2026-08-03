"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Plus,
  Calendar,
  TrendingUp,
  Package,
  Eye,
  BarChart3,
  Users,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ProgressReport } from "@/lib/types"
import {
  useReports,
  useMaterials,
  useExpenses,
  useProjects,
  useMonthlyExpenses,
  useBudgetConsumption,
  createReport,
  logActivity,
} from "@/lib/hooks/use-data"
import { useStore } from "@/lib/store"
import { isAdmin } from "@/lib/supabase/auth"
import { reportSchema } from "@/lib/validation-schemas"
import { ErrorState } from "@/components/error-state"
import { toast } from "sonner"
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-theme"

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function getProjectName(projectId: string, projects: { id: string; name: string }[]): string {
  return projects.find((p) => p.id === projectId)?.name || "Unknown"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const MONTHS = [
  "Jan 2025",
  "Feb 2025",
  "Mar 2025",
  "Apr 2025",
  "May 2025",
  "Jun 2025",
]

const emptyReportForm = {
  project_id: "",
  report_date: new Date().toISOString().split("T")[0],
  work_completed: "",
  material_used: "",
  issues: "",
  delays: "",
  tomorrow_plan: "",
}

export default function ReportsPage() {
  const { currentUser } = useStore()
  const admin = isAdmin(currentUser)
  const role = currentUser?.role || "owner"
  const canCreate = admin || role === "site_engineer"
  const isClient = role === "client"

  const { data: rawReports, isLoading: reportsLoading, error: reportsError, refetch: refetchReports } = useReports()
  const reportsData = rawReports ?? []
  const { data: rawMaterials, isLoading: materialsLoading } = useMaterials()
  const materials = rawMaterials ?? []
  const { data: rawExpenses, isLoading: expensesLoading } = useExpenses()
  const expenses = rawExpenses ?? []
  const { data: rawProjects, isLoading: projectsLoading } = useProjects()
  const projects = rawProjects ?? []
  const { data: rawMonthlyExpenses } = useMonthlyExpenses()
  const monthlyExpenses = rawMonthlyExpenses ?? []
  const { data: rawBudgetConsumption } = useBudgetConsumption()
  const budgetConsumption = rawBudgetConsumption ?? []

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ProgressReport | null>(null)
  const [form, setForm] = useState(emptyReportForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [expenseMonthFilter, setExpenseMonthFilter] = useState("all")
  const [materialProjectFilter, setMaterialProjectFilter] = useState("all")

  const reports = reportsData
  const isLoading = reportsLoading || materialsLoading || expensesLoading || projectsLoading

  const monthlyExpenseData = useMemo(() => {
    const aggregated: Record<string, number> = {}
    expenses.forEach((e) => {
      const d = new Date(e.date)
      const key = `${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`
      aggregated[key] = (aggregated[key] || 0) + e.amount
    })
    return MONTHS.map((m) => ({
      month: m,
      amount: aggregated[m] || 0,
    }))
  }, [expenses])

  const filteredMaterials = useMemo(() => {
    if (materialProjectFilter === "all") return materials
    return materials.filter((m) => m.project_id === materialProjectFilter)
  }, [materials, materialProjectFilter])

  const totalMaterialCost = useMemo(
    () => filteredMaterials.reduce((acc, m) => acc + m.total_cost, 0),
    [filteredMaterials]
  )

  const lowStockCount = useMemo(
    () => filteredMaterials.filter((m) => m.quantity_remaining <= m.reorder_level).length,
    [filteredMaterials]
  )

  async function handleCreateReport() {
    const result = reportSchema.safeParse(form)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        errors[field] = issue.message
      })
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    try {
      const report = await createReport({
        project_id: result.data.project_id,
        report_date: result.data.report_date,
        work_completed: result.data.work_completed,
        material_used: result.data.material_used || "",
        issues: result.data.issues || "",
        delays: result.data.delays || "",
        tomorrow_plan: result.data.tomorrow_plan || "",
        photos: [],
        created_by: currentUser?.id || "",
      })
      logActivity({ action: "create", entity_type: "report", entity_id: report.id, entity_name: `Report - ${result.data.report_date}` })
      toast.success("Report created successfully")
      setCreateDialogOpen(false)
      setForm(emptyReportForm)
    } catch (e: any) {
      toast.error("Failed to create report: " + e.message)
    }
  }

  function viewReportDetail(report: ProgressReport) {
    setSelectedReport(report)
    setDetailDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-28 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-[400px]" />
        <div className="space-y-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (reportsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Manage progress, expense, material, and client reports</p>
        </div>
        <ErrorState message={reportsError} onRetry={refetchReports} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Manage progress, expense, material, and client reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">
            <FileText className="mr-1.5 h-4 w-4" />
            Progress Reports
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Expense Reports
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Package className="mr-1.5 h-4 w-4" />
            Material Reports
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="mr-1.5 h-4 w-4" />
            Client Reports
          </TabsTrigger>
        </TabsList>

        {/* Progress Reports Tab */}
        <TabsContent value="progress" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Daily work progress reports from site engineers
            </p>
            {canCreate && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Report
            </Button>
            )}
          </div>

          <div className="grid gap-4">
            {reports
              .sort(
                (a, b) =>
                  new Date(b.report_date).getTime() -
                  new Date(a.report_date).getTime()
              )
              .map((report) => (
                <Card
                  key={report.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => viewReportDetail(report)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formatDate(report.report_date)}
                          </span>
                          <Badge variant="outline">
                            {getProjectName(report.project_id, projects)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {report.work_completed}
                        </p>
                        {report.delays && (
                          <p className="text-xs text-orange-600">
                            Delays: {report.delays}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon-sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Expense Reports Tab */}
        <TabsContent value="expenses" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select
                value={expenseMonthFilter}
                onValueChange={(v) => setExpenseMonthFilter(v ?? "all")}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Filter by month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyINR(
                        expenses.reduce((a, e) => a + e.amount, 0)
                      )}
                    </p>
                  </div>
                  <div className="rounded-full bg-red-500/10 p-3">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyINR(
                        expenses
                          .filter((e) => {
                            const d = new Date(e.date)
                            const now = new Date()
                            return (
                              d.getMonth() === now.getMonth() &&
                              d.getFullYear() === now.getFullYear()
                            )
                          })
                          .reduce((a, e) => a + e.amount, 0)
                      )}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Monthly</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyINR(
                        expenses.reduce((a, e) => a + e.amount, 0) / 6
                      )}
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyExpenseData}>
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
                        formatCurrencyINR(Number(value)),
                        "Amount",
                      ]}
                      {...CHART_TOOLTIP_STYLE}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project-wise Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Usage %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetConsumption.map((bc) => (
                    <TableRow key={bc.project_id}>
                      <TableCell className="font-medium">{bc.project_name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyINR(bc.budget)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyINR(bc.spent)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyINR(bc.budget - bc.spent)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            bc.percentage > 60
                              ? "border-red-500 text-red-500"
                              : bc.percentage > 40
                                ? "border-yellow-500 text-yellow-500"
                                : "border-green-500 text-green-500"
                          }
                        >
                          {bc.percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Material Reports Tab */}
        <TabsContent value="materials" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select
                value={materialProjectFilter}
                onValueChange={(v) => setMaterialProjectFilter(v ?? "all")}
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Materials</p>
                    <p className="text-2xl font-bold">{filteredMaterials.length}</p>
                  </div>
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyINR(totalMaterialCost)}
                    </p>
                  </div>
                  <div className="rounded-full bg-green-500/10 p-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                    <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
                  </div>
                  <div className="rounded-full bg-orange-500/10 p-3">
                    <Package className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Material Usage Summary</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Purchased</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((m) => {
                    const isLow = m.quantity_remaining <= m.reorder_level
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{m.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {m.quantity_purchased.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.quantity_used.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.quantity_remaining.toLocaleString()}
                        </TableCell>
                        <TableCell>{m.unit}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrencyINR(m.total_cost)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isLow ? "destructive" : "default"}
                          >
                            {isLow ? "Low Stock" : "In Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Levels Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMaterials.map((m) => {
                  const usagePercent = Math.round(
                    (m.quantity_used / m.quantity_purchased) * 100
                  )
                  const isLow = m.quantity_remaining <= m.reorder_level
                  return (
                    <div key={m.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">
                          {m.quantity_remaining} {m.unit} remaining
                          {isLow && (
                            <span className="ml-2 text-orange-600 font-medium">
                              (Low - reorder at {m.reorder_level})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isLow
                              ? "bg-orange-500"
                              : usagePercent > 80
                                ? "bg-red-500"
                                : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Reports Tab */}
        <TabsContent value="clients" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Project summary reports for client review
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {projects.map((project) => {
              const projectExpenses = expenses.filter(
                (e) => e.project_id === project.id
              )
              const projectMaterials = materials.filter(
                (m) => m.project_id === project.id
              )
              const totalSpent = projectExpenses.reduce(
                (a, e) => a + e.amount,
                0
              )
              const remainingBudget = project.budget - project.spent

              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Client: {project.client_name}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          project.status === "Completed"
                            ? "border-green-500 text-green-500"
                            : project.status === "Finishing"
                              ? "border-blue-500 text-blue-500"
                              : "border-primary text-primary"
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="text-xl font-bold">{project.progress}%</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-xl font-bold">
                          {formatCurrencyINR(project.budget)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Spent</p>
                        <p className="text-xl font-bold">
                          {formatCurrencyINR(project.spent)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-xl font-bold">
                          {formatCurrencyINR(remainingBudget)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Project Completion</span>
                        <span className="text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">
                          {formatDate(project.start_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expected Completion</p>
                        <p className="font-medium">
                          {formatDate(project.expected_completion_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Materials Tracked</p>
                        <p className="font-medium">
                          {projectMaterials.length} items
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Progress Report</DialogTitle>
            <DialogDescription>
              Fill in the daily progress report details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Project</Label>
                <Select
                  value={form.project_id}
                  onValueChange={(v) =>
                    setForm({ ...form, project_id: v ?? "" })
                  }
                >
                  <SelectTrigger className={formErrors.project_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.project_id && <p className="text-xs text-destructive">{formErrors.project_id}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report_date">Report Date</Label>
                <Input
                  id="report_date"
                  type="date"
                  value={form.report_date}
                  onChange={(e) =>
                    setForm({ ...form, report_date: e.target.value })
                  }
                  className={formErrors.report_date ? "border-destructive" : ""}
                />
                {formErrors.report_date && <p className="text-xs text-destructive">{formErrors.report_date}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="work_completed">Work Completed</Label>
              <Textarea
                id="work_completed"
                value={form.work_completed}
                onChange={(e) =>
                  setForm({ ...form, work_completed: e.target.value })
                }
                placeholder="Describe the work completed today..."
                className={formErrors.work_completed ? "border-destructive" : ""}
              />
              {formErrors.work_completed && <p className="text-xs text-destructive">{formErrors.work_completed}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="material_used">Material Used</Label>
              <Textarea
                id="material_used"
                value={form.material_used}
                onChange={(e) =>
                  setForm({ ...form, material_used: e.target.value })
                }
                placeholder="List materials used today..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="issues">Issues</Label>
                <Textarea
                  id="issues"
                  value={form.issues}
                  onChange={(e) =>
                    setForm({ ...form, issues: e.target.value })
                  }
                  placeholder="Any issues encountered..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="delays">Delays</Label>
                <Textarea
                  id="delays"
                  value={form.delays}
                  onChange={(e) =>
                    setForm({ ...form, delays: e.target.value })
                  }
                  placeholder="Any delays today..."
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tomorrow_plan">Tomorrow&apos;s Plan</Label>
              <Textarea
                id="tomorrow_plan"
                value={form.tomorrow_plan}
                onChange={(e) =>
                  setForm({ ...form, tomorrow_plan: e.target.value })
                }
                placeholder="Plan for tomorrow..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Photos</Label>
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span>Click to upload site photos</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport}>Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Progress Report</DialogTitle>
            <DialogDescription>
              {selectedReport &&
                `${formatDate(selectedReport.report_date)} - ${getProjectName(selectedReport.project_id, projects)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Work Completed
                </p>
                <p className="text-sm">{selectedReport.work_completed}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Material Used
                </p>
                <p className="text-sm">{selectedReport.material_used}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Issues
                  </p>
                  <p className="text-sm">{selectedReport.issues || "None"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Delays
                  </p>
                  <p className="text-sm">{selectedReport.delays || "None"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Tomorrow&apos;s Plan
                </p>
                <p className="text-sm">{selectedReport.tomorrow_plan}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
