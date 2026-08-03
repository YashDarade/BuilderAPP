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
