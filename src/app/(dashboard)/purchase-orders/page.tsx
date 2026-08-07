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
  ClipboardList,
  Plus,
  Search,
  Eye,
  Trash2,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { usePurchaseOrders, useVendors, useProjects } from "@/lib/hooks/use-data"
import { deletePurchaseOrder } from "@/lib/hooks/use-mutation"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { useStore } from "@/lib/store"
import { ErrorState } from "@/components/error-state"
import { TablePageSkeleton } from "@/components/page-skeletons"
import { RoleGuard } from "@/components/role-guard"
import { toast } from "sonner"
import { RefreshButton } from "@/components/refresh-button"
import type { PurchaseOrder, POStatus } from "@/lib/types"

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function getStatusColor(status: POStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case "draft": return "secondary"
    case "sent": return "default"
    case "partially_delivered": return "default"
    case "delivered": return "default"
    case "cancelled": return "destructive"
    default: return "default"
  }
}

function getPaymentStatusColor(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "paid": return "default"
    case "partial": return "secondary"
    case "unpaid": return "destructive"
    default: return "default"
  }
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [vendorFilter, setVendorFilter] = useState("all")
  const { currentUser } = useStore()

  const { data: pos, isLoading, error, refetch } = usePurchaseOrders(search, statusFilter, vendorFilter === "all" ? undefined : vendorFilter)
  const { data: vendors } = useVendors()
  useRealtimeSync(["purchase_orders"], refetch)

  const stats = useMemo(() => {
    if (!pos) return { total: 0, draft: 0, pending: 0, outstanding: 0 }
    return {
      total: pos.length,
      draft: pos.filter(po => po.status === "draft").length,
      pending: pos.filter(po => ["sent", "partially_delivered"].includes(po.status)).length,
      outstanding: pos.reduce((sum, po) => sum + po.balance_due, 0),
    }
  }, [pos])

  async function handleDelete(po: PurchaseOrder) {
    if (po.status !== "draft") {
      toast.error("Only draft POs can be deleted")
      return
    }
    if (!confirm(`Delete PO ${po.po_number}?`)) return
    try {
      await deletePurchaseOrder(po.id)
      refetch()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete PO")
    }
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage vendor purchase orders</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} />
          <RoleGuard allowedRoles={["owner", "site_engineer"]}>
            <Link href="/purchase-orders/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80">
              <Plus className="h-4 w-4" />
              Create PO
            </Link>
          </RoleGuard>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
            <ClipboardList className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <FileText className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrencyINR(stats.outstanding)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search POs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={(v) => setVendorFilter(v ?? "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors?.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>{vendor.business_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TablePageSkeleton />
          ) : !pos || pos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found. Create your first PO to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.po_date}</TableCell>
                    <TableCell>{po.vendor_name}</TableCell>
                    <TableCell>{po.project_name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(po.status)}>{po.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusColor(po.payment_status)}>{po.payment_status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrencyINR(po.total_amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrencyINR(po.balance_due)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {po.status === "draft" && (
                          <RoleGuard allowedRoles={["owner"]}>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(po)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </RoleGuard>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
