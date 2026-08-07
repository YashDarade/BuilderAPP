"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Package,
  IndianRupee,
  CreditCard,
  Truck,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import {
  usePurchaseOrder,
  usePOItems,
  usePOReceivings,
} from "@/lib/hooks/use-data"
import {
  cancelPurchaseOrder,
  recordMaterialReceiving,
} from "@/lib/hooks/use-mutation"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { useStore } from "@/lib/store"
import { materialReceivingSchema } from "@/lib/validation-schemas"
import { ErrorState } from "@/components/error-state"
import { TablePageSkeleton } from "@/components/page-skeletons"
import { RoleGuard } from "@/components/role-guard"
import { toast } from "sonner"
import { RefreshButton } from "@/components/refresh-button"
import type { POItem, MaterialReceiving, POStatus } from "@/lib/types"

function formatCurrencyINR(amount: number): string {
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

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const poId = params.id as string
  const { currentUser } = useStore()

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [receiveForm, setReceiveForm] = useState({
    received_quantity: 0,
    received_date: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const { data: po, isLoading: poLoading, error: poError, refetch: refetchPO } = usePurchaseOrder(poId)
  const { data: items, isLoading: itemsLoading, refetch: refetchItems } = usePOItems(poId)
  const { data: receivings, isLoading: receivingsLoading, refetch: refetchReceivings } = usePOReceivings(poId)

  useRealtimeSync(["purchase_orders", "po_items", "material_receivings"], () => {
    refetchPO()
    refetchItems()
    refetchReceivings()
  })

  const canReceive = po && ["sent", "partially_delivered"].includes(po.status)
  const canCancel = po && ["draft", "sent", "partially_delivered"].includes(po.status)

  async function handleCancel() {
    if (!confirm("Cancel this purchase order?")) return
    try {
      await cancelPurchaseOrder(poId)
      toast.success("PO cancelled")
      refetchPO()
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel PO")
    }
  }

  async function handleReceive() {
    if (!selectedItem) {
      setErrors({ po_item_id: "Select a line item" })
      return
    }
    setSubmitting(true)
    setErrors({})
    try {
      const result = materialReceivingSchema.safeParse({
        po_item_id: selectedItem,
        ...receiveForm,
      })
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
      await recordMaterialReceiving({
        po_id: poId,
        po_item_id: selectedItem,
        ...receiveForm,
      })
      toast.success("Material delivery recorded")
      setReceiveDialogOpen(false)
      refetchItems()
      refetchReceivings()
      refetchPO()
    } catch (e: any) {
      toast.error(e.message || "Failed to record delivery")
    } finally {
      setSubmitting(false)
    }
  }

  if (poLoading) return <TablePageSkeleton />
  if (poError) return <ErrorState message={poError} onRetry={refetchPO} />
  if (!po) return <ErrorState message="Purchase order not found" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{po.po_number}</h1>
              <Badge variant={getStatusColor(po.status)}>{po.status}</Badge>
              <Badge variant={po.payment_status === "paid" ? "default" : po.payment_status === "partial" ? "secondary" : "destructive"}>
                {po.payment_status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{po.vendor_name} - {po.project_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={() => { refetchPO(); refetchItems(); refetchReceivings() }} />
          {canReceive && (
            <RoleGuard allowedRoles={["owner", "site_engineer"]}>
              <Button onClick={() => setReceiveDialogOpen(true)}>
                <Truck className="mr-2 h-4 w-4" />
                Record Delivery
              </Button>
            </RoleGuard>
          )}
          {canCancel && (
            <RoleGuard allowedRoles={["owner"]}>
              <Button variant="destructive" onClick={handleCancel}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel PO
              </Button>
            </RoleGuard>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PO Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{po.po_date}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{po.expected_delivery_date || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrencyINR(po.total_amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
            <CreditCard className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-destructive">{formatCurrencyINR(po.balance_due)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Line Items ({items?.length || 0})</TabsTrigger>
          <TabsTrigger value="receivings">Delivery History ({receivings?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardContent className="pt-6">
              {itemsLoading ? (
                <TablePageSkeleton />
              ) : !items || items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No line items</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty Ordered</TableHead>
                      <TableHead className="text-right">Qty Received</TableHead>
                      <TableHead className="text-right">Qty Pending</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.material_name}</TableCell>
                        <TableCell>{item.description || "-"}</TableCell>
                        <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                        <TableCell className="text-right">{item.quantity_received} {item.unit}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.quantity_pending > 0 ? "text-yellow-600" : "text-green-600"}>
                            {item.quantity_pending} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrencyINR(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrencyINR(item.total_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivings">
          <Card>
            <CardContent className="pt-6">
              {receivingsLoading ? (
                <TablePageSkeleton />
              ) : !receivings || receivings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No deliveries recorded</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivings.map((receiving) => (
                      <TableRow key={receiving.id}>
                        <TableCell>{receiving.received_date}</TableCell>
                        <TableCell>{receiving.material_name}</TableCell>
                        <TableCell className="text-right">{receiving.received_quantity}</TableCell>
                        <TableCell>{receiving.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">Subtotal: {formatCurrencyINR(po.subtotal)}</div>
              <div className="text-sm text-muted-foreground">Tax: {formatCurrencyINR(po.tax_amount)}</div>
              <div className="text-sm text-muted-foreground">Transport: {formatCurrencyINR(po.transport_amount)}</div>
              <div className="text-lg font-bold">Total: {formatCurrencyINR(po.total_amount)}</div>
              <div className="text-sm text-muted-foreground">Paid: {formatCurrencyINR(po.total_paid)}</div>
              <div className="text-lg font-bold text-destructive">Balance: {formatCurrencyINR(po.balance_due)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Material Delivery</DialogTitle>
            <DialogDescription>Record received materials against this purchase order</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Line Item *</Label>
              <Select value={selectedItem} onValueChange={(v) => setSelectedItem(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items?.filter(item => item.quantity_pending > 0).map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.material_name} - Pending: {item.quantity_pending} {item.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.po_item_id && <p className="text-xs text-destructive">{errors.po_item_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Received Quantity *</Label>
                <Input
                  type="number"
                  value={receiveForm.received_quantity}
                  onChange={(e) => setReceiveForm({ ...receiveForm, received_quantity: parseFloat(e.target.value) || 0 })}
                />
                {errors.received_quantity && <p className="text-xs text-destructive">{errors.received_quantity}</p>}
              </div>
              <div className="space-y-2">
                <Label>Received Date *</Label>
                <Input
                  type="date"
                  value={receiveForm.received_date}
                  onChange={(e) => setReceiveForm({ ...receiveForm, received_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={receiveForm.notes}
                onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReceive} disabled={submitting}>
              {submitting ? "Saving..." : "Record Delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
