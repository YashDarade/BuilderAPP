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
  })

  on("project.updated", (event) => {
    logActivity({ action: "update", entity_type: "project", entity_id: event.data.id, entity_name: event.data.name, old_value: event.old_value as any, new_value: event.data as any })
  })

  on("project.deleted", (event) => {
    logActivity({ action: "delete", entity_type: "project", entity_id: event.data.id, entity_name: event.data.name || "Project" })
    toast.success("Project deleted")
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

  // ---- PHOTOS ----
  on("photo.uploaded", (event) => {
    logActivity({ action: "create", entity_type: "photo", entity_id: event.data.id, entity_name: event.data.category, new_value: event.data as any })
    toast.success("Photo uploaded")
  })

  on("photo.deleted", (event) => {
    logActivity({ action: "delete", entity_type: "photo", entity_id: event.data.id, entity_name: event.data.name || "Site Photo" })
    toast.success("Photo deleted")
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

  // ---- BILL SCANS ----
  on("billscan.uploaded", () => {
    toast.success("Bill uploaded — processing...")
  })

  on("billscan.processed", () => {
    toast.success("Bill processed")
  })
}
