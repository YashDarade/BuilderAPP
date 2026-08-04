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
  on("project.created", (project) => {
    logActivity({ action: "create", entity_type: "project", entity_id: project.id, entity_name: project.name })
    toast.success("Project created")
  })

  on("project.updated", (project) => {
    logActivity({ action: "update", entity_type: "project", entity_id: project.id, entity_name: project.name })
  })

  on("project.deleted", (data) => {
    logActivity({ action: "delete", entity_type: "project", entity_id: data.id, entity_name: "Project" })
    toast.success("Project deleted")
  })

  // ---- EXPENSES ----
  on("expense.created", (expense) => {
    logActivity({ action: "create", entity_type: "expense", entity_id: expense.id, entity_name: expense.description })
    toast.success("Expense added")
  })

  on("expense.updated", (expense) => {
    logActivity({ action: "update", entity_type: "expense", entity_id: expense.id, entity_name: expense.description })
    toast.success("Expense updated")
  })

  on("expense.deleted", (data) => {
    logActivity({ action: "delete", entity_type: "expense", entity_id: data.id, entity_name: "Expense" })
    toast.success("Expense deleted")
  })

  // ---- MATERIALS ----
  on("material.created", (material) => {
    logActivity({ action: "create", entity_type: "material", entity_id: material.id, entity_name: material.name })
    toast.success("Material added")
  })

  on("material.updated", (material) => {
    logActivity({ action: "update", entity_type: "material", entity_id: material.id, entity_name: material.name })
    toast.success("Material updated")
  })

  on("material.deleted", (data) => {
    logActivity({ action: "delete", entity_type: "material", entity_id: data.id, entity_name: "Material" })
    toast.success("Material deleted")
  })

  // ---- PHOTOS ----
  on("photo.uploaded", (photo) => {
    logActivity({ action: "create", entity_type: "photo", entity_id: photo.id, entity_name: photo.category })
    toast.success("Photo uploaded")
  })

  on("photo.deleted", (data) => {
    logActivity({ action: "delete", entity_type: "photo", entity_id: data.id, entity_name: "Site Photo" })
    toast.success("Photo deleted")
  })

  // ---- REPORTS ----
  on("report.created", (report) => {
    logActivity({ action: "create", entity_type: "report", entity_id: report.id, entity_name: `Report - ${report.report_date}` })
    toast.success("Report created")
  })

  // ---- ROADMAPS ----
  on("roadmap.created", (roadmap) => {
    logActivity({ action: "create", entity_type: "roadmap", entity_id: roadmap.id, entity_name: roadmap.title })
    toast.success("Roadmap created")
  })

  on("roadmap.updated", (roadmap) => {
    logActivity({ action: "update", entity_type: "roadmap", entity_id: roadmap.id, entity_name: roadmap.title })
    toast.success("Phase updated")
  })

  // ---- TEAM ----
  on("team.member_added", (user) => {
    logActivity({ action: "create", entity_type: "team", entity_id: user.id, entity_name: user.full_name })
    toast.success("Team member added")
  })

  on("team.member_removed", (data) => {
    logActivity({ action: "delete", entity_type: "team", entity_id: data.id, entity_name: "Team Member" })
    toast.success("Member removed")
  })

  on("team.member_role_changed", (user) => {
    logActivity({ action: "update", entity_type: "team", entity_id: user.id, entity_name: user.full_name })
    toast.success("Role updated")
  })

  // ---- BILL SCANS ----
  on("billscan.uploaded", (scan) => {
    toast.success("Bill uploaded — processing...")
  })

  on("billscan.processed", (_scan) => {
    toast.success("Bill processed")
  })
}
