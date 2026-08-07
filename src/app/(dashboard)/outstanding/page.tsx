"use client"

import { useMemo } from "react"
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
import {
  AlertCircle,
  Clock,
  Calendar,
  TrendingUp,
  IndianRupee,
  Users2,
} from "lucide-react"
import Link from "next/link"
import {
  useOutstandingSummary,
  useTopVendors,
  usePurchaseOrders,
} from "@/lib/hooks/use-data"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { ErrorState } from "@/components/error-state"
import { TablePageSkeleton } from "@/components/page-skeletons"
import { RefreshButton } from "@/components/refresh-button"
import type { VendorSummary, PurchaseOrder } from "@/lib/types"

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

export default function OutstandingPage() {
  const { data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useOutstandingSummary()
  const { data: topVendors, isLoading: vendorsLoading, refetch: refetchVendors } = useTopVendors(5)
  const { data: pos, isLoading: posLoading, refetch: refetchPOs } = usePurchaseOrders()

  useRealtimeSync(["purchase_orders", "vendor_payments"], () => {
    refetchSummary()
    refetchVendors()
    refetchPOs()
  })

  const overduePOs = useMemo(() => {
    if (!pos) return []
    const today = new Date().toISOString().split("T")[0]
    return pos.filter(po =>
      po.expected_delivery_date &&
      po.expected_delivery_date < today &&
      po.balance_due > 0 &&
      po.status !== "cancelled"
    ).sort((a, b) => (a.expected_delivery_date || "").localeCompare(b.expected_delivery_date || ""))
  }, [pos])

  if (summaryError) return <ErrorState message={summaryError} onRetry={refetchSummary} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outstanding Dashboard</h1>
          <p className="text-muted-foreground">Track vendor payments and outstanding amounts</p>
        </div>
        <RefreshButton onRefresh={() => { refetchSummary(); refetchVendors(); refetchPOs() }} />
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Due</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryLoading ? "-" : formatCurrencyINR(summary?.today_due || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryLoading ? "-" : formatCurrencyINR(summary?.this_week_due || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryLoading ? "-" : formatCurrencyINR(summary?.this_month_due || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summaryLoading ? "-" : formatCurrencyINR(summary?.overdue_total || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryLoading ? "-" : formatCurrencyINR(summary?.upcoming_total || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <IndianRupee className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summaryLoading ? "-" : formatCurrencyINR(summary?.total_outstanding || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              Top Vendors by Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendorsLoading ? (
              <TablePageSkeleton />
            ) : !topVendors || topVendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No outstanding vendors</div>
            ) : (
              <div className="space-y-4">
                {topVendors.map((vendor: VendorSummary) => (
                  <Link
                    key={vendor.vendor_id}
                    href={`/vendors/${vendor.vendor_id}`}
                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{vendor.vendor_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {vendor.active_pos} active POs • {vendor.overdue_pos} overdue
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">{formatCurrencyINR(vendor.balance_due)}</p>
                        <p className="text-sm text-muted-foreground">
                          Paid: {formatCurrencyINR(vendor.total_paid)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Overdue Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {posLoading ? (
              <TablePageSkeleton />
            ) : overduePOs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No overdue POs</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overduePOs.slice(0, 5).map((po: PurchaseOrder) => {
                    const today = new Date()
                    const dueDate = new Date(po.expected_delivery_date!)
                    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <TableRow key={po.id}>
                        <TableCell>
                          <Link href={`/purchase-orders/${po.id}`} className="text-blue-500 hover:underline">
                            {po.po_number}
                          </Link>
                        </TableCell>
                        <TableCell>{po.vendor_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {po.expected_delivery_date}
                            <Badge variant="destructive" className="text-xs">{daysOverdue}d overdue</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrencyINR(po.balance_due)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Cash Required This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-destructive">
              {summaryLoading ? "-" : formatCurrencyINR(summary?.cash_required || 0)}
            </p>
            <p className="text-muted-foreground mt-2">
              Amount needed for vendor payments in the next 7 days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
