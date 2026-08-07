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
  Phone,
  IndianRupee,
  FileText,
  CreditCard,
  Plus,
} from "lucide-react"
import Link from "next/link"
import {
  useVendor,
  useVendorLedger,
  usePurchaseOrders,
  useVendorPayments,
} from "@/lib/hooks/use-data"
import {
  recordVendorPayment,
} from "@/lib/hooks/use-mutation"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { useStore } from "@/lib/store"
import { vendorPaymentSchema } from "@/lib/validation-schemas"
import { ErrorState } from "@/components/error-state"
import { TablePageSkeleton } from "@/components/page-skeletons"
import { RoleGuard } from "@/components/role-guard"
import { toast } from "sonner"
import { RefreshButton } from "@/components/refresh-button"
import type { PurchaseOrder, VendorLedgerEntry } from "@/lib/types"

function formatCurrencyINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`
}

function getStatusColor(status: string) {
  switch (status) {
    case "draft": return "secondary"
    case "sent": return "default"
    case "partially_delivered": return "default"
    case "delivered": return "default"
    case "cancelled": return "destructive"
    case "paid": return "default"
    case "partial": return "secondary"
    case "unpaid": return "destructive"
    default: return "default"
  }
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.id as string
  const { currentUser } = useStore()

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<string>("")
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash" as "cash" | "upi" | "cheque" | "bank_transfer",
    reference_number: "",
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const { data: vendor, isLoading: vendorLoading, error: vendorError, refetch: refetchVendor } = useVendor(vendorId)
  const { data: ledger, isLoading: ledgerLoading, refetch: refetchLedger } = useVendorLedger(vendorId)
  const { data: pos, isLoading: posLoading, refetch: refetchPOs } = usePurchaseOrders(undefined, undefined, vendorId)
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useVendorPayments(vendorId)

  useRealtimeSync(["vendors", "purchase_orders", "vendor_payments"], () => {
    refetchVendor()
    refetchLedger()
    refetchPOs()
    refetchPayments()
  })

  const unpaidPOs = useMemo(() => {
    if (!pos) return []
    return pos.filter(po => po.status !== "cancelled" && po.balance_due > 0)
  }, [pos])

  const ledgerWithBalance = useMemo(() => {
    if (!ledger) return []
    let runningBalance = 0
    return ledger.map((entry: VendorLedgerEntry) => {
      runningBalance += entry.debit - entry.credit
      return { ...entry, balance: runningBalance }
    })
  }, [ledger])

  async function handleRecordPayment() {
    if (!selectedPO) {
      setErrors({ po_id: "Select a purchase order" })
      return
    }
    setSubmitting(true)
    setErrors({})
    try {
      const result = vendorPaymentSchema.safeParse({
        po_id: selectedPO,
        ...paymentForm,
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
      await recordVendorPayment({
        po_id: selectedPO,
        vendor_id: vendorId,
        ...paymentForm,
      })
      toast.success("Payment recorded")
      setPaymentDialogOpen(false)
      refetchLedger()
      refetchPOs()
      refetchPayments()
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment")
    } finally {
      setSubmitting(false)
    }
  }

  if (vendorLoading) return <TablePageSkeleton />
  if (vendorError) return <ErrorState message={vendorError} onRetry={refetchVendor} />
  if (!vendor) return <ErrorState message="Vendor not found" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{vendor.business_name}</h1>
              <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
                {vendor.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{vendor.owner_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={() => { refetchVendor(); refetchLedger(); refetchPOs(); refetchPayments() }} />
          <RoleGuard allowedRoles={["owner"]}>
            <Button onClick={() => setPaymentDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </RoleGuard>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phone</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{vendor.phone}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Limit</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrencyINR(vendor.credit_limit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Terms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{vendor.payment_terms_days} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GST Number</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{vendor.gst_number || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{vendor.address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Material Categories</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {vendor.material_categories?.map(cat => (
                  <Badge key={cat} variant="secondary">{cat}</Badge>
                ))}
              </div>
            </div>
          </div>
          {vendor.notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium">{vendor.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders ({pos?.length || 0})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <Card>
            <CardContent className="pt-6">
              {ledgerLoading ? (
                <TablePageSkeleton />
              ) : ledgerWithBalance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerWithBalance.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right">
                          {entry.debit > 0 ? formatCurrencyINR(entry.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0 ? formatCurrencyINR(entry.credit) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrencyINR(entry.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <Card>
            <CardContent className="pt-6">
              {posLoading ? (
                <TablePageSkeleton />
              ) : !pos || pos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No purchase orders</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pos.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell>
                          <Link href={`/purchase-orders/${po.id}`} className="text-blue-500 hover:underline">
                            {po.po_number}
                          </Link>
                        </TableCell>
                        <TableCell>{po.po_date}</TableCell>
                        <TableCell>{po.project_name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(po.status)}>{po.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrencyINR(po.total_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrencyINR(po.total_paid)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrencyINR(po.balance_due)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              {paymentsLoading ? (
                <TablePageSkeleton />
              ) : !payments || payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No payments recorded</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>PO</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.payment_date}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{payment.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrencyINR(payment.amount)}</TableCell>
                        <TableCell>{payment.reference_number || "-"}</TableCell>
                        <TableCell>{payment.po_number}</TableCell>
                        <TableCell>{payment.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment for this vendor</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Purchase Order *</Label>
              <Select value={selectedPO} onValueChange={(v) => setSelectedPO(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {unpaidPOs.map(po => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.po_number} - Balance: {formatCurrencyINR(po.balance_due)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.po_id && <p className="text-xs text-destructive">{errors.po_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
              </div>
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={submitting}>
              {submitting ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
