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
  restoreProject as _restoreProject,
  restoreExpense as _restoreExpense,
  restoreMaterial as _restoreMaterial,
  restorePhoto as _restorePhoto,
  restoreRoadmap as _restoreRoadmap,
  restoreTeamMember as _restoreTeamMember,
  createVendor as _createVendor,
  updateVendor as _updateVendor,
  deleteVendor as _deleteVendor,
  restoreVendor as _restoreVendor,
  createPurchaseOrder as _createPurchaseOrder,
  updatePurchaseOrder as _updatePurchaseOrder,
  cancelPurchaseOrder as _cancelPurchaseOrder,
  deletePurchaseOrder as _deletePurchaseOrder,
  recordMaterialReceiving as _recordMaterialReceiving,
  recordVendorPayment as _recordVendorPayment,
  deleteVendorPayment as _deleteVendorPayment,
} from "./use-data"
import type { Project, Expense, Material, SitePhoto, ProgressReport, Roadmap, User, BillScan, Vendor, PurchaseOrder, MaterialReceiving, VendorPayment } from "@/lib/types"

// ============================================================
// PROJECTS
// ============================================================

export async function createProject(data: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project> {
  const project = await _createProject(data)
  emit("project.created", project)
  return project
}

export async function updateProject(id: string, updates: Partial<Project>, old_value?: Partial<Project>): Promise<Project> {
  const project = await _updateProject(id, updates)
  emit("project.updated", project, { old_value })
  return project
}

export async function deleteProject(id: string, name?: string): Promise<void> {
  await _deleteProject(id)
  emit("project.deleted", { id, name })
}

export async function restoreProject(id: string): Promise<void> {
  await _restoreProject(id)
  emit("project.restored", { id } as Project)
}

// ============================================================
// EXPENSES
// ============================================================

export async function createExpense(data: Omit<Expense, "id" | "created_at" | "org_id">): Promise<Expense> {
  const expense = await _createExpense(data)
  emit("expense.created", expense)
  return expense
}

export async function updateExpense(id: string, updates: Partial<Expense>, old_value?: Partial<Expense>): Promise<Expense> {
  const expense = await _updateExpense(id, updates)
  emit("expense.updated", expense, { old_value })
  return expense
}

export async function deleteExpense(id: string): Promise<void> {
  await _deleteExpense(id)
  emit("expense.deleted", { id })
}

export async function restoreExpense(id: string): Promise<void> {
  await _restoreExpense(id)
  emit("expense.restored", { id } as Expense)
}

// ============================================================
// MATERIALS
// ============================================================

export async function createMaterial(data: Omit<Material, "id" | "created_at" | "updated_at" | "quantity_remaining" | "total_cost" | "org_id">): Promise<Material> {
  const material = await _createMaterial(data)
  emit("material.created", material)
  return material
}

export async function updateMaterial(id: string, updates: Partial<Material>, old_value?: Partial<Material>): Promise<Material> {
  const material = await _updateMaterial(id, updates)
  emit("material.updated", material, { old_value })
  return material
}

export async function deleteMaterial(id: string): Promise<void> {
  await _deleteMaterial(id)
  emit("material.deleted", { id })
}

export async function restoreMaterial(id: string): Promise<void> {
  await _restoreMaterial(id)
  emit("material.restored", { id } as Material)
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

export async function restorePhoto(id: string): Promise<void> {
  await _restorePhoto(id)
  emit("photo.restored", { id } as SitePhoto)
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

export async function updateRoadmap(id: string, updates: Partial<Roadmap>, old_value?: Partial<Roadmap>): Promise<Roadmap> {
  const roadmap = await _updateRoadmap(id, updates)
  emit("roadmap.updated", roadmap, { old_value })
  return roadmap
}

export async function deleteRoadmap(id: string): Promise<void> {
  await _deleteRoadmap(id)
  emit("roadmap.deleted", { id })
}

export async function restoreRoadmap(id: string): Promise<void> {
  await _restoreRoadmap(id)
  emit("roadmap.restored", { id } as Roadmap)
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

export async function updateMemberRole(userId: string, newRole: string, oldRole?: string): Promise<void> {
  await _updateMemberRole(userId, newRole)
  emit("team.member_role_changed", { id: userId, role: newRole } as User, { old_value: oldRole ? { role: oldRole } : undefined })
}

export async function removeMember(userId: string): Promise<void> {
  await _removeMember(userId)
  emit("team.member_removed", { id: userId })
}

export async function restoreTeamMember(userId: string): Promise<void> {
  await _restoreTeamMember(userId)
  emit("team.member_restored", { id: userId } as User)
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

// ============================================================
// VENDORS
// ============================================================

export async function createVendor(data: Omit<Vendor, "id" | "created_at" | "updated_at" | "org_id">): Promise<Vendor> {
  const vendor = await _createVendor(data)
  emit("vendor.created", vendor)
  return vendor
}

export async function updateVendor(id: string, updates: Partial<Vendor>, old_value?: Partial<Vendor>): Promise<Vendor> {
  const vendor = await _updateVendor(id, updates)
  emit("vendor.updated", vendor, { old_value })
  return vendor
}

export async function deleteVendor(id: string, name?: string): Promise<void> {
  await _deleteVendor(id)
  emit("vendor.deleted", { id, name })
}

export async function restoreVendor(id: string): Promise<void> {
  await _restoreVendor(id)
  emit("vendor.restored", { id } as Vendor)
}

// ============================================================
// PURCHASE ORDERS
// ============================================================

export async function createPurchaseOrder(data: {
  vendor_id: string; project_id: string; po_date: string;
  expected_delivery_date?: string; tax_amount?: number;
  transport_amount?: number; notes?: string;
  items: { material_name: string; description?: string; quantity: number; unit: string; unit_price: number }[];
}): Promise<PurchaseOrder> {
  const po = await _createPurchaseOrder(data)
  emit("po.created", po)
  return po
}

export async function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>, old_value?: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
  const po = await _updatePurchaseOrder(id, updates)
  emit("po.updated", po, { old_value })
  return po
}

export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const po = await _cancelPurchaseOrder(id)
  emit("po.cancelled", po)
  return po
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await _deletePurchaseOrder(id)
  emit("po.deleted", { id })
}

// ============================================================
// MATERIAL RECEIVING
// ============================================================

export async function recordMaterialReceiving(data: {
  po_id: string; po_item_id: string; received_quantity: number;
  received_date?: string; notes?: string;
}): Promise<MaterialReceiving> {
  const receiving = await _recordMaterialReceiving(data)
  emit("receiving.recorded", receiving)
  return receiving
}

// ============================================================
// VENDOR PAYMENTS
// ============================================================

export async function recordVendorPayment(data: {
  po_id: string; vendor_id: string; amount: number;
  payment_date?: string; payment_method: string;
  reference_number?: string; notes?: string;
}): Promise<VendorPayment> {
  const payment = await _recordVendorPayment(data)
  emit("vendor_payment.recorded", payment)
  return payment
}

export async function deleteVendorPayment(id: string): Promise<void> {
  await _deleteVendorPayment(id)
  emit("vendor_payment.deleted", { id })
}
