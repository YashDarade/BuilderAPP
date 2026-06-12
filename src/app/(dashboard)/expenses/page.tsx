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
import {
  Receipt,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
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
import type { Expense, ExpenseCategory } from "@/lib/types"
import {
  mockExpenses,
  mockProjects,
  mockUsers,
} from "@/lib/mock-data"

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Labor",
  "Cement",
  "Steel",
  "Plumbing",
  "Electrical",
  "Transport",
  "Machinery",
  "Finishing",
  "Miscellaneous",
]

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function getProjectName(projectId: string): string {
  return mockProjects.find((p) => p.id === projectId)?.name || "Unknown"
}

function getUserName(userId: string): string {
  return mockUsers.find((u) => u.id === userId)?.full_name || "Unknown"
}

const CATEGORY_COLORS: Record<string, string> = {
  Labor: "#3b82f6",
  Cement: "#6b7280",
  Steel: "#ef4444",
  Plumbing: "#06b6d4",
  Electrical: "#f59e0b",
  Transport: "#8b5cf6",
  Machinery: "#ec4899",
  Finishing: "#22c55e",
  Miscellaneous: "#64748b",
}

const emptyForm = {
  amount: 0,
  category: "" as ExpenseCategory | "",
  vendor: "",
  description: "",
  date: "",
  project_id: "",
  bill_url: null as string | null,
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const now = new Date()

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.vendor.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        categoryFilter === "all" || e.category === categoryFilter
      const matchesProject =
        projectFilter === "all" || e.project_id === projectFilter
      const expenseDate = new Date(e.date)
      const matchesDateFrom = !dateFrom || expenseDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || expenseDate <= new Date(dateTo)
      return (
        matchesSearch &&
        matchesCategory &&
        matchesProject &&
        matchesDateFrom &&
        matchesDateTo
      )
    })
  }, [expenses, search, categoryFilter, projectFilter, dateFrom, dateTo])

  const totalExpenses = useMemo(
    () => expenses.reduce((acc, e) => acc + e.amount, 0),
    [expenses]
  )

  const thisMonthExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((acc, e) => acc + e.amount, 0)
  }, [expenses])

  const thisYearExpenses = useMemo(() => {
    return expenses
      .filter((e) => new Date(e.date).getFullYear() === now.getFullYear())
      .reduce((acc, e) => acc + e.amount, 0)
  }, [expenses])

  const avgMonthly = useMemo(() => {
    if (expenses.length === 0) return 0
    const months = new Set(
      expenses.map((e) => {
        const d = new Date(e.date)
        return `${d.getFullYear()}-${d.getMonth()}`
      })
    )
    return totalExpenses / months.size
  }, [expenses, totalExpenses])

  const monthlyChartData = useMemo(() => {
    const aggregated: Record<string, number> = {}
    expenses.forEach((e) => {
      const d = new Date(e.date)
      const key = `${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`
      aggregated[key] = (aggregated[key] || 0) + e.amount
    })
    const entries = Object.entries(aggregated).map(([month, amount]) => ({
      month,
      amount,
    }))
    entries.sort((a, b) => {
      const parseDate = (m: string) => {
        const [month, year] = m.split(" ")
        const d = new Date(`${month} 1, ${year}`)
        return d.getTime()
      }
      return parseDate(a.month) - parseDate(b.month)
    })
    return entries
  }, [expenses])

  function handleAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function handleEdit(e: Expense) {
    setEditingId(e.id)
    setForm({
      amount: e.amount,
      category: e.category,
      vendor: e.vendor,
      description: e.description,
      date: e.date,
      project_id: e.project_id,
      bill_url: e.bill_url,
    })
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  function handleSave() {
    const now = new Date().toISOString()
    if (editingId) {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, ...form, category: form.category as ExpenseCategory }
            : e
        )
      )
    } else {
      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        ...form,
        category: form.category as ExpenseCategory,
        created_by: "user-001",
        created_at: now,
      }
      setExpenses((prev) => [...prev, newExpense])
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage project expenses
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrencyINR(totalExpenses)}</p>
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
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{formatCurrencyINR(thisMonthExpenses)}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <CalendarDays className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Year</p>
                <p className="text-2xl font-bold">{formatCurrencyINR(thisYearExpenses)}</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Monthly</p>
                <p className="text-2xl font-bold">{formatCurrencyINR(avgMonthly)}</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Expense Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by description or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {mockProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-40"
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-40"
              placeholder="To"
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No expenses found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(e.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {e.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: CATEGORY_COLORS[e.category],
                            color: CATEGORY_COLORS[e.category],
                          }}
                        >
                          {e.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {getProjectName(e.project_id)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrencyINR(e.amount)}
                      </TableCell>
                      <TableCell>{e.vendor}</TableCell>
                      <TableCell>{getUserName(e.created_by)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(e)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(e.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the expense details below."
                : "Fill in the details to record a new expense."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g. Foundation labor charges"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm({ ...form, category: (val ?? "") as ExpenseCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Project</Label>
                <Select
                  value={form.project_id}
                  onValueChange={(val) =>
                    setForm({ ...form, project_id: val ?? "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={form.vendor}
                onChange={(e) =>
                  setForm({ ...form, vendor: e.target.value })
                }
                placeholder="e.g. UltraTech Cement"
              />
            </div>
            <div className="grid gap-2">
              <Label>Bill Upload</Label>
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>Drag & drop or click to upload bill</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
