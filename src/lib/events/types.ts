import type { Project, Expense, Material, SitePhoto, ProgressReport, Roadmap, User, BillScan, BudgetAlert, Notification, Vendor, PurchaseOrder, POItem, MaterialReceiving, VendorPayment, POStatus } from "@/lib/types"

// ============================================================
// APP EVENTS — single source of truth for all domain events
// ============================================================

export type AppEvent =
  // Projects
  | { type: "project.created"; data: Project }
  | { type: "project.updated"; data: Project; old_value?: Partial<Project> }
  | { type: "project.deleted"; data: { id: string; name?: string } }
  | { type: "project.restored"; data: Project }

  // Expenses
  | { type: "expense.created"; data: Expense }
  | { type: "expense.updated"; data: Expense; old_value?: Partial<Expense> }
  | { type: "expense.deleted"; data: { id: string; name?: string } }
  | { type: "expense.restored"; data: Expense }

  // Materials
  | { type: "material.created"; data: Material }
  | { type: "material.updated"; data: Material; old_value?: Partial<Material> }
  | { type: "material.deleted"; data: { id: string; name?: string } }
  | { type: "material.restored"; data: Material }

  // Photos
  | { type: "photo.uploaded"; data: SitePhoto }
  | { type: "photo.deleted"; data: { id: string; name?: string } }
  | { type: "photo.restored"; data: SitePhoto }

  // Reports
  | { type: "report.created"; data: ProgressReport }

  // Roadmaps
  | { type: "roadmap.created"; data: Roadmap }
  | { type: "roadmap.updated"; data: Roadmap; old_value?: Partial<Roadmap> }
  | { type: "roadmap.deleted"; data: { id: string; name?: string } }
  | { type: "roadmap.restored"; data: Roadmap }

  // Team
  | { type: "team.member_added"; data: User }
  | { type: "team.member_removed"; data: { id: string; name?: string } }
  | { type: "team.member_role_changed"; data: User; old_value?: Partial<User> }
  | { type: "team.member_restored"; data: User }

  // Bill Scans
  | { type: "billscan.uploaded"; data: BillScan }
  | { type: "billscan.processed"; data: BillScan }

  // Notifications
  | { type: "notification.created"; data: Notification }
  | { type: "notification.read"; data: { id: string } }
  | { type: "notification.read_all"; data: { user_id: string } }

  // Analytics
  | { type: "analytics.dashboard_viewed"; data: { user_id: string; role: string } }
  | { type: "analytics.report_exported"; data: { format: string; user_id: string } }
  | { type: "analytics.search_performed"; data: { query: string; user_id: string } }

  // Budget Alerts
  | { type: "budget.threshold_reached"; data: BudgetAlert }

  // Billing (scaffold)
  | { type: "billing.subscription.created"; data: { org_id: string; plan: string } }
  | { type: "billing.subscription.cancelled"; data: { org_id: string } }
  | { type: "billing.invoice.paid"; data: { org_id: string; amount: number } }

  // Vendors
  | { type: "vendor.created"; data: Vendor }
  | { type: "vendor.updated"; data: Vendor; old_value?: Partial<Vendor> }
  | { type: "vendor.deleted"; data: { id: string; name?: string } }
  | { type: "vendor.restored"; data: Vendor }

  // Purchase Orders
  | { type: "po.created"; data: PurchaseOrder }
  | { type: "po.updated"; data: PurchaseOrder; old_value?: Partial<PurchaseOrder> }
  | { type: "po.deleted"; data: { id: string; po_number?: string } }
  | { type: "po.restored"; data: PurchaseOrder }
  | { type: "po.status_changed"; data: PurchaseOrder; old_value?: { status: POStatus } }
  | { type: "po.cancelled"; data: PurchaseOrder }

  // Material Receiving
  | { type: "receiving.recorded"; data: MaterialReceiving }

  // Vendor Payments
  | { type: "vendor_payment.recorded"; data: VendorPayment }
  | { type: "vendor_payment.deleted"; data: { id: string } }

// Event type name → payload type mapping (for type-safe on/emit)
export type EventMap = {
  [K in AppEvent["type"]]: Extract<AppEvent, { type: K }>
}
