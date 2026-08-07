"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useVendors, useProjects } from "@/lib/hooks/use-data"
import { createPurchaseOrder } from "@/lib/hooks/use-mutation"
import { purchaseOrderSchema } from "@/lib/validation-schemas"
import { toast } from "sonner"
import type { POItemFormValues } from "@/lib/validation-schemas"

export default function CreatePurchaseOrderPage() {
  const router = useRouter()
  const { data: vendors } = useVendors()
  const { data: projects } = useProjects()

  const [form, setForm] = useState({
    vendor_id: "",
    project_id: "",
    po_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    tax_amount: 0,
    transport_amount: 0,
    notes: "",
  })
  const [items, setItems] = useState<POItemFormValues[]>([
    { material_name: "", description: "", quantity: 1, unit: "pcs", unit_price: 0 }
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const total = subtotal + form.tax_amount + form.transport_amount

  function addItem() {
    setItems([...items, { material_name: "", description: "", quantity: 1, unit: "pcs", unit_price: 0 }])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof POItemFormValues, value: any) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  async function handleSubmit(status: "draft" | "sent") {
    setSubmitting(true)
    setErrors({})
    try {
      const result = purchaseOrderSchema.safeParse({
        ...form,
        items,
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
      await createPurchaseOrder({
        vendor_id: form.vendor_id,
        project_id: form.project_id,
        po_date: form.po_date,
        expected_delivery_date: form.expected_delivery_date || undefined,
        tax_amount: form.tax_amount,
        transport_amount: form.transport_amount,
        notes: form.notes || undefined,
        items: items.map(item => ({
          material_name: item.material_name,
          description: item.description || undefined,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
        })),
      })
      toast.success("Purchase order created")
      router.push("/purchase-orders")
    } catch (e: any) {
      toast.error(e.message || "Failed to create PO")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
            <p className="text-muted-foreground">Create a new purchase order for a vendor</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PO Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.business_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendor_id && <p className="text-xs text-destructive">{errors.vendor_id}</p>}
            </div>
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project_id && <p className="text-xs text-destructive">{errors.project_id}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>PO Date *</Label>
              <Input
                type="date"
                value={form.po_date}
                onChange={(e) => setForm({ ...form, po_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input
                type="date"
                value={form.expected_delivery_date}
                onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Amount (₹)</Label>
              <Input
                type="number"
                value={form.tax_amount}
                onChange={(e) => setForm({ ...form, tax_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Transport Amount (₹)</Label>
              <Input
                type="number"
                value={form.transport_amount}
                onChange={(e) => setForm({ ...form, transport_amount: parseFloat(e.target.value) || 0 })}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3 space-y-1">
                {index === 0 && <Label className="text-xs">Material Name *</Label>}
                <Input
                  placeholder="Material name"
                  value={item.material_name}
                  onChange={(e) => updateItem(index, "material_name", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                {index === 0 && <Label className="text-xs">Description</Label>}
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                />
              </div>
              <div className="col-span-1 space-y-1">
                {index === 0 && <Label className="text-xs">Qty *</Label>}
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-1 space-y-1">
                {index === 0 && <Label className="text-xs">Unit *</Label>}
                <Input
                  value={item.unit}
                  onChange={(e) => updateItem(index, "unit", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                {index === 0 && <Label className="text-xs">Unit Price (₹) *</Label>}
                <Input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                {index === 0 && <Label className="text-xs">Total</Label>}
                <div className="h-10 px-3 flex items-center border rounded-md bg-muted">
                  ₹{(item.quantity * item.unit_price).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="col-span-1">
                {index === 0 && <Label className="text-xs invisible">Action</Label>}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end space-y-2">
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">Subtotal: ₹{subtotal.toLocaleString("en-IN")}</div>
              <div className="text-sm text-muted-foreground">Tax: ₹{form.tax_amount.toLocaleString("en-IN")}</div>
              <div className="text-sm text-muted-foreground">Transport: ₹{form.transport_amount.toLocaleString("en-IN")}</div>
              <div className="text-lg font-bold">Total: ₹{total.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/purchase-orders")}>Cancel</Button>
        <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={submitting}>
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit("sent")} disabled={submitting}>
          Save & Send
        </Button>
      </div>
    </div>
  )
}
