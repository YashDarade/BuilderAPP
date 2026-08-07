"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Users2,
  Phone,
  Plus,
  Pencil,
  Trash2,
  Search,
  IndianRupee,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { useVendors } from "@/lib/hooks/use-data"
import { createVendor, updateVendor, deleteVendor } from "@/lib/hooks/use-mutation"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { useStore } from "@/lib/store"
import { vendorSchema } from "@/lib/validation-schemas"
import { ErrorState } from "@/components/error-state"
import { TablePageSkeleton } from "@/components/page-skeletons"
import { RoleGuard } from "@/components/role-guard"
import { toast } from "sonner"
import { RefreshButton } from "@/components/refresh-button"
import type { Vendor, MaterialVendorCategory } from "@/lib/types"

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

const MATERIAL_CATEGORIES: MaterialVendorCategory[] = [
  'Cement', 'Steel', 'Sand', 'Bricks', 'Tiles', 'Pipes',
  'Paint', 'Electrical', 'Plumbing', 'Timber', 'Aggregate',
  'Hardware', 'Chemicals', 'Other'
]

const emptyForm = {
  business_name: "",
  owner_name: "",
  phone: "",
  alt_phone: "",
  gst_number: "",
  address: "",
  material_categories: [] as MaterialVendorCategory[],
  payment_terms_days: 30,
  credit_limit: 0,
  status: "active" as "active" | "inactive",
  notes: "",
}

export default function VendorsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const { currentUser } = useStore()

  const { data: vendors, isLoading, error, refetch } = useVendors(search, statusFilter)
  useRealtimeSync(["vendors"], refetch)

  const filteredVendors = useMemo(() => {
    if (!vendors) return []
    return vendors
  }, [vendors])

  const stats = useMemo(() => {
    if (!vendors) return { total: 0, active: 0, inactive: 0 }
    return {
      total: vendors.length,
      active: vendors.filter(v => v.status === "active").length,
      inactive: vendors.filter(v => v.status === "inactive").length,
    }
  }, [vendors])

  function openAddDialog() {
    setEditingVendor(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEditDialog(vendor: Vendor) {
    setEditingVendor(vendor)
    setForm({
      business_name: vendor.business_name,
      owner_name: vendor.owner_name,
      phone: vendor.phone,
      alt_phone: vendor.alt_phone || "",
      gst_number: vendor.gst_number || "",
      address: vendor.address || "",
      material_categories: vendor.material_categories || [],
      payment_terms_days: vendor.payment_terms_days,
      credit_limit: vendor.credit_limit,
      status: vendor.status,
      notes: vendor.notes || "",
    })
    setErrors({})
    setDialogOpen(true)
  }

  function toggleCategory(cat: MaterialVendorCategory) {
    setForm(prev => ({
      ...prev,
      material_categories: prev.material_categories.includes(cat)
        ? prev.material_categories.filter(c => c !== cat)
        : [...prev.material_categories, cat]
    }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setErrors({})
    try {
      const result = vendorSchema.safeParse(form)
      if (!result.success) {
        const fieldErrors: Record<string, string> = {}
        result.error.issues.forEach(issue => {
          const field = issue.path.join(".")
          fieldErrors[field] = issue.message
        })
        setErrors(fieldErrors)
        setSubmitting(false)
        return
      }
      if (editingVendor) {
        await updateVendor(editingVendor.id, result.data as any)
        toast.success("Vendor updated")
      } else {
        await createVendor(result.data as any)
        toast.success("Vendor added")
      }
      setDialogOpen(false)
      refetch()
    } catch (e: any) {
      toast.error(e.message || "Failed to save vendor")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(vendor: Vendor) {
    if (!confirm(`Delete "${vendor.business_name}"?`)) return
    try {
      await deleteVendor(vendor.id, vendor.business_name)
      refetch()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete vendor")
    }
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage your suppliers and vendors</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} />
          <RoleGuard allowedRoles={["owner", "site_engineer"]}>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </RoleGuard>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TablePageSkeleton />
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vendors found. Add your first vendor to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.business_name}</TableCell>
                    <TableCell>{vendor.owner_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {vendor.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {vendor.material_categories?.slice(0, 2).map(cat => (
                          <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                        ))}
                        {(vendor.material_categories?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">+{vendor.material_categories.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/vendors/${vendor.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <RoleGuard allowedRoles={["owner", "site_engineer"]}>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(vendor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </RoleGuard>
                        <RoleGuard allowedRoles={["owner"]}>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </RoleGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
            <DialogDescription>
              {editingVendor ? "Update vendor details" : "Add a new vendor to your network"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                />
                {errors.business_name && <p className="text-xs text-destructive">{errors.business_name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Owner Name *</Label>
                <Input
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                />
                {errors.owner_name && <p className="text-xs text-destructive">{errors.owner_name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label>Alt Phone</Label>
                <Input
                  value={form.alt_phone}
                  onChange={(e) => setForm({ ...form, alt_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input
                  value={form.gst_number}
                  onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Material Categories</Label>
              <div className="flex flex-wrap gap-2">
                {MATERIAL_CATEGORIES.map(cat => (
                  <Badge
                    key={cat}
                    variant={form.material_categories.includes(cat) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms (days)</Label>
                <Input
                  type="number"
                  value={form.payment_terms_days}
                  onChange={(e) => setForm({ ...form, payment_terms_days: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Credit Limit (₹)</Label>
                <Input
                  type="number"
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editingVendor ? "Update" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
