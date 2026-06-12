export type UserRole = 'admin' | 'site_engineer' | 'client'

export type ProjectStatus =
  | 'Planning'
  | 'Foundation'
  | 'Structure'
  | 'Brickwork'
  | 'Finishing'
  | 'Completed'

export type PhotoCategory =
  | 'Foundation'
  | 'Columns'
  | 'Brickwork'
  | 'Plumbing'
  | 'Electrical'
  | 'Roofing'
  | 'Structure'
  | 'Finishing'

export type ExpenseCategory =
  | 'Labor'
  | 'Cement'
  | 'Steel'
  | 'Plumbing'
  | 'Electrical'
  | 'Transport'
  | 'Machinery'
  | 'Finishing'
  | 'Miscellaneous'

export type AlertType = 'budget_warning' | 'budget_critical' | 'budget_exceeded'

export type NotificationType =
  | 'budget_alert'
  | 'progress_update'
  | 'material_low'
  | 'bill_scanned'
  | 'report_generated'
  | 'project_update'

export type InsightType =
  | 'cost_analysis'
  | 'progress_prediction'
  | 'material_optimization'
  | 'risk_assessment'
  | 'weather_impact'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export type BillStatus = 'pending' | 'verified' | 'rejected' | 'processed'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  phone: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  client_name: string
  client_id: string
  address: string
  start_date: string
  expected_completion_date: string
  budget: number
  spent: number
  status: ProjectStatus
  progress: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface SitePhoto {
  id: string
  project_id: string
  url: string
  thumbnail_url: string
  notes: string
  category: PhotoCategory
  gps_lat: number
  gps_lng: number
  uploaded_by: string
  created_at: string
}

export interface Material {
  id: string
  project_id: string
  name: string
  category: string
  quantity_purchased: number
  quantity_used: number
  quantity_remaining: number
  unit: string
  cost_per_unit: number
  total_cost: number
  vendor: string
  reorder_level: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  project_id: string
  amount: number
  category: ExpenseCategory
  vendor: string
  description: string
  date: string
  bill_url: string | null
  created_by: string
  created_at: string
}

export interface BudgetAlert {
  id: string
  project_id: string
  alert_type: AlertType
  threshold_percentage: number
  message: string
  is_read: boolean
  created_at: string
}

export interface ProgressReport {
  id: string
  project_id: string
  report_date: string
  work_completed: string
  material_used: string
  issues: string
  delays: string
  tomorrow_plan: string
  photos: string[]
  created_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  related_id: string | null
  created_at: string
}

export interface BillScan {
  id: string
  expense_id: string
  image_url: string
  vendor_name: string
  amount: number
  date: string
  gst_number: string | null
  confidence_score: number
  status: BillStatus
  created_at: string
}

export interface MaterialDetection {
  id: string
  photo_id: string
  object_type: string
  count: number
  confidence_score: number
  created_at: string
}

export interface AIInsight {
  id: string
  project_id: string
  insight_type: InsightType
  title: string
  description: string
  severity: Severity
  recommendations: string[]
  created_at: string
}

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalBudget: number
  totalSpent: number
  pendingExpenses: number
  lowStockMaterials: number
  alertsCount: number
  completionRate: number
}

export interface MonthlyExpense {
  month: string
  amount: number
  category: ExpenseCategory
}

export interface BudgetConsumption {
  project_id: string
  project_name: string
  budget: number
  spent: number
  percentage: number
}

export interface ProjectProgress {
  project_id: string
  project_name: string
  progress: number
  status: ProjectStatus
}
