import type { Project, Expense, Material, SitePhoto, ProgressReport, Roadmap, User, BillScan, BudgetAlert, Notification } from "@/lib/types"

// ============================================================
// APP EVENTS — single source of truth for all domain events
// ============================================================

export type AppEvent =
  // Projects
  | { type: "project.created"; data: Project }
  | { type: "project.updated"; data: Project; old_value?: Partial<Project> }
  | { type: "project.deleted"; data: { id: string; name?: string } }

  // Expenses
  | { type: "expense.created"; data: Expense }
  | { type: "expense.updated"; data: Expense; old_value?: Partial<Expense> }
  | { type: "expense.deleted"; data: { id: string; name?: string } }

  // Materials
  | { type: "material.created"; data: Material }
  | { type: "material.updated"; data: Material; old_value?: Partial<Material> }
  | { type: "material.deleted"; data: { id: string; name?: string } }

  // Photos
  | { type: "photo.uploaded"; data: SitePhoto }
  | { type: "photo.deleted"; data: { id: string; name?: string } }

  // Reports
  | { type: "report.created"; data: ProgressReport }

  // Roadmaps
  | { type: "roadmap.created"; data: Roadmap }
  | { type: "roadmap.updated"; data: Roadmap; old_value?: Partial<Roadmap> }

  // Team
  | { type: "team.member_added"; data: User }
  | { type: "team.member_removed"; data: { id: string; name?: string } }
  | { type: "team.member_role_changed"; data: User; old_value?: Partial<User> }

  // Bill Scans
  | { type: "billscan.uploaded"; data: BillScan }
  | { type: "billscan.processed"; data: BillScan }

  // Notifications
  | { type: "notification.created"; data: Notification }

// Event type name → payload type mapping (for type-safe on/emit)
export type EventMap = {
  [K in AppEvent["type"]]: Extract<AppEvent, { type: K }>
}
