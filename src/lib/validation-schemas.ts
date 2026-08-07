import { z } from "zod/v4"

// ============================================================
// PROJECT
// ============================================================
export const projectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be under 100 characters")
    .regex(/^[a-zA-Z0-9\s\-&,.'()]+$/, "Project name contains invalid characters"),
  client_name: z
    .string()
    .min(2, "Client name must be at least 2 characters")
    .max(100, "Client name must be under 100 characters"),
  address: z
    .string()
    .max(200, "Address must be under 200 characters")
    .optional()
    .or(z.literal("")),
  budget: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), "Budget must be a positive number"),
  start_date: z.string().optional().or(z.literal("")),
  expected_completion_date: z.string().optional().or(z.literal("")),
  status: z.enum(["Planning", "Foundation", "Structure", "Brickwork", "Finishing", "Completed"]),
})

export type ProjectFormValues = z.infer<typeof projectSchema>

// ============================================================
// MATERIAL
// ============================================================
export const materialSchema = z.object({
  name: z
    .string()
    .min(1, "Material name is required")
    .max(100, "Name must be under 100 characters"),
  category: z.string().min(1, "Category is required"),
  project_id: z.string().min(1, "Project is required"),
  quantity_purchased: z
    .number()
    .min(0, "Quantity cannot be negative")
    .max(999999, "Quantity is too large"),
  quantity_used: z
    .number()
    .min(0, "Quantity cannot be negative"),
  unit: z
    .string()
    .min(1, "Unit is required")
    .max(20, "Unit must be under 20 characters"),
  cost_per_unit: z
    .number()
    .min(0, "Cost cannot be negative")
    .max(9999999, "Cost is too large"),
  vendor: z
    .string()
    .max(100, "Vendor name must be under 100 characters")
    .optional()
    .or(z.literal("")),
  reorder_level: z
    .number()
    .min(0, "Reorder level cannot be negative")
    .max(999999, "Reorder level is too large"),
})

export type MaterialFormValues = z.infer<typeof materialSchema>

// ============================================================
// EXPENSE
// ============================================================
export const expenseSchema = z.object({
  description: z
    .string()
    .min(2, "Description must be at least 2 characters")
    .max(200, "Description must be under 200 characters"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(99999999, "Amount is too large"),
  category: z.string().min(1, "Category is required"),
  project_id: z.string().min(1, "Project is required"),
  vendor: z
    .string()
    .max(100, "Vendor name must be under 100 characters")
    .optional()
    .or(z.literal("")),
  date: z.string().min(1, "Date is required"),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>

// ============================================================
// REPORT
// ============================================================
export const reportSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  report_date: z.string().min(1, "Report date is required"),
  work_completed: z
    .string()
    .min(5, "Please describe the work completed (at least 5 characters)")
    .max(2000, "Work completed must be under 2000 characters"),
  material_used: z
    .string()
    .max(1000, "Materials must be under 1000 characters")
    .optional()
    .or(z.literal("")),
  issues: z
    .string()
    .max(1000, "Issues must be under 1000 characters")
    .optional()
    .or(z.literal("")),
  delays: z
    .string()
    .max(1000, "Delays must be under 1000 characters")
    .optional()
    .or(z.literal("")),
  tomorrow_plan: z
    .string()
    .max(1000, "Plan must be under 1000 characters")
    .optional()
    .or(z.literal("")),
})

export type ReportFormValues = z.infer<typeof reportSchema>

// ============================================================
// ROADMAP
// ============================================================
export const roadmapSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .optional()
    .or(z.literal("")),
  project_id: z.string().min(1, "Project is required"),
})

export type RoadmapFormValues = z.infer<typeof roadmapSchema>

// ============================================================
// ROADMAP PHASE
// ============================================================
export const roadmapPhaseSchema = z.object({
  name: z
    .string()
    .min(1, "Phase name is required")
    .max(100, "Name must be under 100 characters"),
  status: z.enum(["not_started", "in_progress", "completed", "blocked"]),
  progress: z
    .number()
    .min(0, "Progress must be between 0 and 100")
    .max(100, "Progress must be between 0 and 100"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters")
    .optional()
    .or(z.literal("")),
})

export type RoadmapPhaseFormValues = z.infer<typeof roadmapPhaseSchema>

// ============================================================
// PHOTO UPLOAD
// ============================================================
export const photoUploadSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  category: z.string().min(1, "Category is required"),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters")
    .optional()
    .or(z.literal("")),
})

export type PhotoUploadFormValues = z.infer<typeof photoUploadSchema>

// ============================================================
// VENDOR
// ============================================================
export const vendorSchema = z.object({
  business_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be under 100 characters"),
  owner_name: z
    .string()
    .min(2, "Owner name must be at least 2 characters")
    .max(100, "Owner name must be under 100 characters"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be under 15 digits")
    .regex(/^[0-9+\s\-]+$/, "Phone contains invalid characters"),
  alt_phone: z
    .string()
    .max(15, "Alt phone must be under 15 digits")
    .regex(/^[0-9+\s\-]*$/, "Alt phone contains invalid characters")
    .optional()
    .or(z.literal("")),
  gst_number: z
    .string()
    .max(15, "GST number must be under 15 characters")
    .regex(/^[0-9A-Z]*$/, "GST must contain only uppercase letters and digits")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(300, "Address must be under 300 characters")
    .optional()
    .or(z.literal("")),
  material_categories: z
    .array(z.string())
    .optional()
    .default([]),
  payment_terms_days: z
    .number()
    .min(0, "Payment terms cannot be negative")
    .max(365, "Payment terms must be under 365 days"),
  credit_limit: z
    .number()
    .min(0, "Credit limit cannot be negative")
    .max(99999999, "Credit limit is too large"),
  status: z.enum(["active", "inactive"]),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters")
    .optional()
    .or(z.literal("")),
})

export type VendorFormValues = z.infer<typeof vendorSchema>

// ============================================================
// PURCHASE ORDER
// ============================================================
export const purchaseOrderSchema = z.object({
  vendor_id: z.string().min(1, "Vendor is required"),
  project_id: z.string().min(1, "Project is required"),
  po_date: z.string().min(1, "PO date is required"),
  expected_delivery_date: z.string().optional().or(z.literal("")),
  tax_amount: z
    .number()
    .min(0, "Tax cannot be negative")
    .max(9999999, "Tax is too large"),
  transport_amount: z
    .number()
    .min(0, "Transport cannot be negative")
    .max(9999999, "Transport is too large"),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters")
    .optional()
    .or(z.literal("")),
  items: z
    .array(
      z.object({
        material_name: z.string().min(1, "Material name is required"),
        description: z.string().optional().or(z.literal("")),
        quantity: z.number().positive("Quantity must be greater than 0"),
        unit: z.string().min(1, "Unit is required"),
        unit_price: z.number().min(0, "Price cannot be negative"),
      })
    )
    .min(1, "At least one line item is required"),
})

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>

// ============================================================
// PO LINE ITEM (for inline editing)
// ============================================================
export const poItemSchema = z.object({
  material_name: z.string().min(1, "Material name is required"),
  description: z.string().optional().or(z.literal("")),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  unit_price: z.number().min(0, "Price cannot be negative"),
})

export type POItemFormValues = z.infer<typeof poItemSchema>

// ============================================================
// MATERIAL RECEIVING
// ============================================================
export const materialReceivingSchema = z.object({
  po_item_id: z.string().min(1, "Line item is required"),
  received_quantity: z
    .number()
    .positive("Received quantity must be greater than 0"),
  received_date: z.string().min(1, "Received date is required"),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters")
    .optional()
    .or(z.literal("")),
})

export type MaterialReceivingFormValues = z.infer<typeof materialReceivingSchema>

// ============================================================
// VENDOR PAYMENT
// ============================================================
export const vendorPaymentSchema = z.object({
  po_id: z.string().min(1, "Purchase order is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.enum(["cash", "upi", "cheque", "bank_transfer"]),
  reference_number: z
    .string()
    .max(50, "Reference must be under 50 characters")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters")
    .optional()
    .or(z.literal("")),
})

export type VendorPaymentFormValues = z.infer<typeof vendorPaymentSchema>
