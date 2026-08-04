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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Package,
  AlertTriangle,
  IndianRupee,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
} from "lucide-react"
import type { Material } from "@/lib/types"
import { useMaterials, useProjects } from "@/lib/hooks/use-data"
import { createMaterial, updateMaterial, deleteMaterial } from "@/lib/hooks/use-mutation"
import { useStore } from "@/lib/store"
import { isAdmin } from "@/lib/supabase/auth"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { materialSchema } from "@/lib/validation-schemas"
import { ErrorState } from "@/components/error-state"
import { TablePageSkeleton } from "@/components/page-skeletons"
import { RoleGuard } from "@/components/role-guard"
import { toast } from "sonner"
import { RefreshButton } from "@/components/refresh-button"

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function getStatus(material: Material): "In Stock" | "Low Stock" | "Out of Stock" {
  if (material.quantity_remaining <= 0) return "Out of Stock"
  if (material.quantity_remaining <= material.reorder_level) return "Low Stock"
  return "In Stock"
}

function getStatusColor(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "In Stock":
      return "default"
    case "Low Stock":
      return "secondary"
    case "Out of Stock":
      return "destructive"
    default:
      return "default"
  }
}

const emptyForm = {
  name: "",
  category: "",
  project_id: "",
  quantity_purchased: 0,
  quantity_used: 0,
  quantity_remaining: 0,
  unit: "pieces",
  cost_per_unit: 0,
  total_cost: 0,
  vendor: "",
  reorder_level: 0,
}

export default function MaterialsPage() {
  const { currentUser } = useStore()
  const admin = isAdmin(currentUser)
  const role = currentUser?.role || "owner"
  const canEdit = admin || role === "site_engineer"
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const { data: rawMaterials, isLoading: materialsLoading, error: materialsError, refetch: refetchMaterials } = useMaterials(undefined, search)
  const materials = rawMaterials ?? []
  const { data: rawProjects, isLoading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects()
  const projects = rawProjects ?? []

  useRealtimeSync(["materials", "projects"], () => {
    refetchMaterials()
    refetchProjects()
  })

  const isLoading = materialsLoading || projectsLoading

  const categories = useMemo(() => [...new Set(materials.map((m) => m.category))].sort(), [materials])

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.vendor.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        categoryFilter === "all" || m.category === categoryFilter
      const matchesProject =
        projectFilter === "all" || m.project_id === projectFilter
      return matchesSearch && matchesCategory && matchesProject
    })
  }, [materials, search, categoryFilter, projectFilter])

  const totalValue = useMemo(
    () => materials.reduce((acc, m) => acc + m.quantity_remaining * m.cost_per_unit, 0),
    [materials]
  )

  const lowStockItems = useMemo(
    () => materials.filter((m) => m.quantity_remaining <= m.reorder_level && m.quantity_remaining > 0),
    [materials]
  )

  const uniqueCategories = useMemo(() => new Set(materials.map((m) => m.category)).size, [materials])

  function getProjectName(projectId: string): string {
    return projects.find((p) => p.id === projectId)?.name || "Unknown"
  }

  function handleAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setFormErrors({})
    setDialogOpen(true)
  }

  function handleEdit(m: Material) {
    setEditingId(m.id)
    setFormErrors({})
    setForm({
      name: m.name,
      category: m.category,
      project_id: m.project_id,
      quantity_purchased: m.quantity_purchased,
      quantity_used: m.quantity_used,
      quantity_remaining: m.quantity_remaining,
      unit: m.unit,
      cost_per_unit: m.cost_per_unit,
      total_cost: m.total_cost,
      vendor: m.vendor,
      reorder_level: m.reorder_level,
    })
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await deleteMaterial(id)
      refetchMaterials()
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message)
    }
    setEditingId(null)
  }

  async function handleSave() {
    const result = materialSchema.safeParse(form)
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
      if (editingId) {
        await updateMaterial(editingId, {
          name: result.data.name,
          category: result.data.category,
          project_id: result.data.project_id,
          quantity_purchased: result.data.quantity_purchased,
          quantity_used: result.data.quantity_used,
          unit: result.data.unit,
          cost_per_unit: result.data.cost_per_unit,
          vendor: result.data.vendor || "",
          reorder_level: result.data.reorder_level,
        })
      } else {
        await createMaterial({
          name: result.data.name,
          category: result.data.category,
          project_id: result.data.project_id,
          quantity_purchased: result.data.quantity_purchased,
          quantity_used: result.data.quantity_used,
          unit: result.data.unit,
          cost_per_unit: result.data.cost_per_unit,
          vendor: result.data.vendor || "",
          reorder_level: result.data.reorder_level,
        })
      }
      setDialogOpen(false)
      refetchMaterials()
    } catch (e: any) {
      toast.error("Failed to save: " + e.message)
    }
  }

  if (isLoading) {
    return <TablePageSkeleton columns={6} />
  }

  if (materialsError || projectsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground">Track and manage construction materials</p>
        </div>
        <ErrorState message={materialsError || projectsError || "Failed to load materials"} onRetry={refetchMaterials || refetchProjects} />
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["owner", "site_engineer"]}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground">
            Manage inventory across all projects
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onRefresh={refetchMaterials} />
          {canEdit && (
          <Button onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Material
          </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Materials</p>
                <p className="text-2xl font-bold">{materials.length}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
              </div>
              <div className="rounded-full bg-yellow-500/10 p-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrencyINR(totalValue)}</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <IndianRupee className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{uniqueCategories}</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <Layers className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((m) => (
                <Badge key={m.id} variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {m.name}: {m.quantity_remaining} {m.unit} left (reorder at {m.reorder_level})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or vendor..."
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
                {categories.map((cat) => (
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
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Materials Inventory</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Qty Purchased</TableHead>
                <TableHead className="text-right">Qty Used</TableHead>
                <TableHead className="text-right">Qty Remaining</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    No materials found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  const status = getStatus(m)
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {getProjectName(m.project_id)}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.quantity_purchased} {m.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.quantity_used} {m.unit}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {m.quantity_remaining} {m.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyINR(m.total_cost)}
                      </TableCell>
                      <TableCell>{m.vendor}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(status)}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(m)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {admin && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(m.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                          )}
                        </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      {canEdit && (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Material" : "Add Material"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the material details below."
                : "Fill in the details to add a new material."}
            </DialogDescription>
          </DialogHeader>
            <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Material Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. OPC 53 Cement"
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val ?? "" })}
                >
                  <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-xs text-destructive">{formErrors.category}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Project</Label>
                <Select
                  value={form.project_id}
                  onValueChange={(val) => setForm({ ...form, project_id: val ?? "" })}
                >
                  <SelectTrigger className={formErrors.project_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select" />
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="qty_purchased">Qty Purchased</Label>
                <Input
                  id="qty_purchased"
                  type="number"
                  value={form.quantity_purchased}
                  onChange={(e) =>
                    setForm({ ...form, quantity_purchased: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qty_used">Qty Used</Label>
                <Input
                  id="qty_used"
                  type="number"
                  value={form.quantity_used}
                  onChange={(e) =>
                    setForm({ ...form, quantity_used: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qty_remaining">Qty Remaining</Label>
                <Input
                  id="qty_remaining"
                  type="number"
                  value={form.quantity_remaining}
                  onChange={(e) =>
                    setForm({ ...form, quantity_remaining: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="e.g. bags, pieces"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost_per_unit">Cost/Unit (₹)</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  value={form.cost_per_unit}
                  onChange={(e) =>
                    setForm({ ...form, cost_per_unit: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reorder_level">Reorder Level</Label>
                <Input
                  id="reorder_level"
                  type="number"
                  value={form.reorder_level}
                  onChange={(e) =>
                    setForm({ ...form, reorder_level: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="e.g. UltraTech Cement"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Add Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
    </RoleGuard>
  )
}
