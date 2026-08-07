import { on } from "./bus"
import { logActivity } from "@/lib/hooks/use-data"
import { toast } from "sonner"

// ============================================================
// AUTO SIDE-EFFECTS — registered once, run on every emit
// ============================================================

let initialized = false

export function initEventHandlers() {
  if (initialized) return
  initialized = true

  // ---- PROJECTS ----
  on("project.created", (event) => {
    logActivity({ action: "create", entity_type: "project", entity_id: event.data.id, entity_name: event.data.name, new_value: event.data as any })
    toast.success("Project created")
    notifyOrg(event.data.org_id, "project", event.data.id, "New project created", `"${event.data.name}" has been added`, event.data.created_by)
  })

  on("project.updated", (event) => {
    logActivity({ action: "update", entity_type: "project", entity_id: event.data.id, entity_name: event.data.name, old_value: event.old_value as any, new_value: event.data as any })
  })

  on("project.deleted", (event) => {
    logActivity({ action: "delete", entity_type: "project", entity_id: event.data.id, entity_name: event.data.name || "Project" })
    toast.success("Project deleted")
  })

  on("project.restored", (event) => {
    toast.success("Project restored")
  })

  // ---- EXPENSES ----
  on("expense.created", (event) => {
    logActivity({ action: "create", entity_type: "expense", entity_id: event.data.id, entity_name: event.data.description, new_value: event.data as any })
    toast.success("Expense added")
  })

  on("expense.updated", (event) => {
    logActivity({ action: "update", entity_type: "expense", entity_id: event.data.id, entity_name: event.data.description, old_value: event.old_value as any, new_value: event.data as any })
    toast.success("Expense updated")
  })

  on("expense.deleted", (event) => {
    logActivity({ action: "delete", entity_type: "expense", entity_id: event.data.id, entity_name: event.data.name || "Expense" })
    toast.success("Expense deleted")
  })

  on("expense.restored", (event) => {
    toast.success("Expense restored")
  })

  // ---- MATERIALS ----
  on("material.created", (event) => {
    logActivity({ action: "create", entity_type: "material", entity_id: event.data.id, entity_name: event.data.name, new_value: event.data as any })
    toast.success("Material added")
  })

  on("material.updated", (event) => {
    logActivity({ action: "update", entity_type: "material", entity_id: event.data.id, entity_name: event.data.name, old_value: event.old_value as any, new_value: event.data as any })
    toast.success("Material updated")
  })

  on("material.deleted", (event) => {
    logActivity({ action: "delete", entity_type: "material", entity_id: event.data.id, entity_name: event.data.name || "Material" })
    toast.success("Material deleted")
  })

  on("material.restored", (event) => {
    toast.success("Material restored")
  })

  // ---- PHOTOS ----
  on("photo.uploaded", (event) => {
    logActivity({ action: "create", entity_type: "photo", entity_id: event.data.id, entity_name: event.data.category, new_value: event.data as any })
    toast.success("Photo uploaded")
  })

  on("photo.deleted", (event) => {
    logActivity({ action: "delete", entity_type: "photo", entity_id: event.data.id, entity_name: event.data.name || "Site Photo" })
    toast.success("Photo deleted")
  })

  on("photo.restored", (event) => {
    toast.success("Photo restored")
  })

  // ---- REPORTS ----
  on("report.created", (event) => {
    logActivity({ action: "create", entity_type: "report", entity_id: event.data.id, entity_name: `Report - ${event.data.report_date}`, new_value: event.data as any })
    toast.success("Report created")
  })

  // ---- ROADMAPS ----
  on("roadmap.created", (event) => {
    logActivity({ action: "create", entity_type: "roadmap", entity_id: event.data.id, entity_name: event.data.title, new_value: event.data as any })
    toast.success("Roadmap created")
  })

  on("roadmap.updated", (event) => {
    logActivity({ action: "update", entity_type: "roadmap", entity_id: event.data.id, entity_name: event.data.title, old_value: event.old_value as any, new_value: event.data as any })
    toast.success("Phase updated")
  })

  on("roadmap.deleted", (event) => {
    toast.success("Roadmap deleted")
  })

  on("roadmap.restored", (event) => {
    toast.success("Roadmap restored")
  })

  // ---- TEAM ----
  on("team.member_added", (event) => {
    logActivity({ action: "create", entity_type: "team", entity_id: event.data.id, entity_name: event.data.full_name, new_value: event.data as any })
    toast.success("Team member added")
  })

  on("team.member_removed", (event) => {
    logActivity({ action: "delete", entity_type: "team", entity_id: event.data.id, entity_name: event.data.name || "Team Member" })
    toast.success("Member removed")
  })

  on("team.member_role_changed", (event) => {
    logActivity({ action: "update", entity_type: "team", entity_id: event.data.id, entity_name: event.data.full_name, old_value: event.old_value as any, new_value: event.data as any })
    toast.success("Role updated")
  })

  on("team.member_restored", (event) => {
    toast.success("Team member restored")
  })

  // ---- BILL SCANS ----
  on("billscan.uploaded", () => {
    toast.success("Bill uploaded — processing...")
  })

  on("billscan.processed", () => {
    toast.success("Bill processed")
  })

  // ---- NOTIFICATIONS ----
  on("notification.read", () => {
    // No toast for read actions
  })

  on("notification.read_all", () => {
    // No toast for read actions
  })

  // ---- VENDORS ----
  on("vendor.created", (event) => {
    logActivity({ action: "create", entity_type: "vendor", entity_id: event.data.id, entity_name: event.data.business_name, new_value: event.data as any })
    toast.success("Vendor added")
  })

  on("vendor.updated", (event) => {
    logActivity({ action: "update", entity_type: "vendor", entity_id: event.data.id, entity_name: event.data.business_name, old_value: event.old_value as any, new_value: event.data as any })
    toast.success("Vendor updated")
  })

  on("vendor.deleted", (event) => {
    logActivity({ action: "delete", entity_type: "vendor", entity_id: event.data.id, entity_name: event.data.name || "Vendor" })
    toast.success("Vendor deleted")
  })

  on("vendor.restored", () => { toast.success("Vendor restored") })

  // ---- PURCHASE ORDERS ----
  on("po.created", (event) => {
    logActivity({ action: "create", entity_type: "purchase_order", entity_id: event.data.id, entity_name: event.data.po_number, new_value: event.data as any })
    toast.success(`PO ${event.data.po_number} created`)
  })

  on("po.updated", (event) => {
    logActivity({ action: "update", entity_type: "purchase_order", entity_id: event.data.id, entity_name: event.data.po_number, old_value: event.old_value as any, new_value: event.data as any })
  })

  on("po.status_changed", (event) => {
    toast.success(`PO ${event.data.po_number} status: ${event.data.status}`)
  })

  on("po.cancelled", (event) => {
    toast.success(`PO ${event.data.po_number} cancelled`)
  })

  on("po.deleted", () => {
    toast.success("PO deleted")
  })

  on("po.restored", () => {
    toast.success("PO restored")
  })

  // ---- RECEIVING ----
  on("receiving.recorded", () => {
    toast.success("Material delivery recorded")
  })

  // ---- PAYMENTS ----
  on("vendor_payment.recorded", (event) => {
    logActivity({ action: "create", entity_type: "expense", entity_id: event.data.id, entity_name: "Payment to vendor", new_value: event.data as any })
    toast.success("Payment recorded")
  })

  on("vendor_payment.deleted", () => {
    toast.success("Payment deleted")
  })
}

/**
 * Helper: create notification for all org members (fire-and-forget).
 */
function notifyOrg(
  orgId: string,
  entityType: string,
  entityId: string,
  title: string,
  message: string,
  excludeUserId?: string
): void {
  if (typeof window === "undefined") return
  fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org_id: orgId,
      user_id: "broadcast",
      title,
      message,
      type: "info",
      entity_type: entityType,
      entity_id: entityId,
      broadcast: true,
      exclude_user_id: excludeUserId,
    }),
  }).catch(() => {})
}
