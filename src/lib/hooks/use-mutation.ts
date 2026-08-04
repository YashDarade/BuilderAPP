import { emit } from "@/lib/events"
import {
  createProject as _createProject,
  updateProject as _updateProject,
  deleteProject as _deleteProject,
  createExpense as _createExpense,
  updateExpense as _updateExpense,
  deleteExpense as _deleteExpense,
  createMaterial as _createMaterial,
  updateMaterial as _updateMaterial,
  deleteMaterial as _deleteMaterial,
  uploadPhoto as _uploadPhoto,
  deletePhoto as _deletePhoto,
  createReport as _createReport,
  createRoadmap as _createRoadmap,
  updateRoadmap as _updateRoadmap,
  deleteRoadmap as _deleteRoadmap,
  addMember as _addMember,
  updateMemberRole as _updateMemberRole,
  removeMember as _removeMember,
  uploadBillScan as _uploadBillScan,
  updateBillScan as _updateBillScan,
} from "./use-data"
import type { Project, Expense, Material, SitePhoto, ProgressReport, Roadmap, User, BillScan } from "@/lib/types"

// ============================================================
// PROJECTS
// ============================================================

export async function createProject(data: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project> {
  const project = await _createProject(data)
  emit("project.created", project)
  return project
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const project = await _updateProject(id, updates)
  emit("project.updated", project)
  return project
}

export async function deleteProject(id: string): Promise<void> {
  await _deleteProject(id)
  emit("project.deleted", { id })
}

// ============================================================
// EXPENSES
// ============================================================

export async function createExpense(data: Omit<Expense, "id" | "created_at" | "org_id">): Promise<Expense> {
  const expense = await _createExpense(data)
  emit("expense.created", expense)
  return expense
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
  const expense = await _updateExpense(id, updates)
  emit("expense.updated", expense)
  return expense
}

export async function deleteExpense(id: string): Promise<void> {
  await _deleteExpense(id)
  emit("expense.deleted", { id })
}

// ============================================================
// MATERIALS
// ============================================================

export async function createMaterial(data: Omit<Material, "id" | "created_at" | "updated_at" | "quantity_remaining" | "total_cost" | "org_id">): Promise<Material> {
  const material = await _createMaterial(data)
  emit("material.created", material)
  return material
}

export async function updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
  const material = await _updateMaterial(id, updates)
  emit("material.updated", material)
  return material
}

export async function deleteMaterial(id: string): Promise<void> {
  await _deleteMaterial(id)
  emit("material.deleted", { id })
}

// ============================================================
// PHOTOS
// ============================================================

export async function uploadPhoto(file: File, projectId: string, category: string, notes: string): Promise<SitePhoto> {
  const photo = await _uploadPhoto(file, projectId, category, notes)
  emit("photo.uploaded", photo)
  return photo
}

export async function deletePhoto(id: string, storagePath?: string): Promise<void> {
  await _deletePhoto(id, storagePath)
  emit("photo.deleted", { id })
}

// ============================================================
// REPORTS
// ============================================================

export async function createReport(data: Omit<ProgressReport, "id" | "created_at" | "org_id">): Promise<ProgressReport> {
  const report = await _createReport(data)
  emit("report.created", report)
  return report
}

// ============================================================
// ROADMAPS
// ============================================================

export async function createRoadmap(data: Omit<Roadmap, "id" | "created_at" | "updated_at" | "org_id">): Promise<Roadmap> {
  const roadmap = await _createRoadmap(data)
  emit("roadmap.created", roadmap)
  return roadmap
}

export async function updateRoadmap(id: string, updates: Partial<Roadmap>): Promise<Roadmap> {
  const roadmap = await _updateRoadmap(id, updates)
  emit("roadmap.updated", roadmap)
  return roadmap
}

export async function deleteRoadmap(id: string): Promise<void> {
  await _deleteRoadmap(id)
}

// ============================================================
// TEAM
// ============================================================

export async function addMember(params: {
  email: string
  full_name: string
  role: string
  org_id: string
  captchaToken?: string
}): Promise<{ data: User; tempPassword?: string; message: string }> {
  const result = await _addMember(params)
  emit("team.member_added", result.data)
  return result
}

export async function updateMemberRole(userId: string, newRole: string): Promise<void> {
  await _updateMemberRole(userId, newRole)
  emit("team.member_role_changed", { id: userId, role: newRole } as User)
}

export async function removeMember(userId: string): Promise<void> {
  await _removeMember(userId)
  emit("team.member_removed", { id: userId })
}

// ============================================================
// BILL SCANS
// ============================================================

export async function uploadBillScan(file: File): Promise<BillScan> {
  const scan = await _uploadBillScan(file)
  emit("billscan.uploaded", scan)
  return scan
}

export async function updateBillScan(id: string, updates: Partial<BillScan>): Promise<BillScan> {
  const scan = await _updateBillScan(id, updates)
  emit("billscan.processed", scan)
  return scan
}
