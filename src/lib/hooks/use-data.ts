"use client"

import { useState, useEffect, useCallback, useDeferredValue } from "react"
import { createClient } from "@/lib/supabase/config"
import { useStore } from "@/lib/store"
import { fetchWithCache } from "@/lib/offline/cache"
import type { StoreName } from "@/lib/offline/db"
import type { Project, Expense, Material, SitePhoto, ProgressReport, Notification, BudgetAlert, Roadmap, BillScan, ActivityLog, ActivityAction, EntityType, User, Vendor, PurchaseOrder, POItem, MaterialReceiving, VendorPayment, VendorLedgerEntry, VendorSummary } from "@/lib/types"
import { compressImage } from "@/lib/image-utils"
import { cachedFetcher, invalidateClientCache } from "@/lib/cache-client"

function getSupabase() {
  return createClient()
}

function getCurrentOrgId(): string | null {
  return useStore.getState().currentUser?.org_id || null
}

function getCurrentUserId(): string | null {
  return useStore.getState().currentUser?.id || null
}

function invalidateCache(entities: string[]) {
  entities.forEach((e) => invalidateClientCache(`rpc:${e}`))
}

function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  cacheStore?: StoreName
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [fromCache, setFromCache] = useState(false)
  const { currentUser } = useStore()

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return }
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const run = async () => {
      if (cacheStore) {
        const result = await fetchWithCache(
          cacheStore,
          fetcher as () => Promise<{ id: string }[]>
        )
        if (!cancelled) {
          setData(result.data as T)
          setFromCache(result.fromCache)
        }
      } else {
        const result = await fetcher()
        if (!cancelled) setData(result)
      }
    }

    run()
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [currentUser, ...deps, retryCount])

  const refetch = useCallback(() => setRetryCount((c) => c + 1), [])

  return { data, isLoading, error, refetch, fromCache }
}

// ============================================================
// PROJECTS
// ============================================================
export function useProjects() {
  return useSupabaseQuery<Project[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    return cachedFetcher(`rpc:projects:${orgId}`, async () => {
      const { data, error } = await supabase.rpc("get_all_projects", { p_org_id: orgId })
      if (error) throw error
      return (data || []) as Project[]
    })
  }, [], "projects")
}

export function useProject(id: string | undefined) {
  return useSupabaseQuery<Project | null>(async () => {
    if (!id) return null
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_project", { p_id: id })
    if (error) throw error
    return (data?.[0] || null) as Project | null
  }, [id])
}

export async function createProject(project: Omit<Project, "id" | "created_at" | "updated_at">) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("insert_project", {
    p_name: project.name,
    p_client_name: project.client_name,
    p_address: project.address || null,
    p_start_date: project.start_date || null,
    p_expected_completion_date: project.expected_completion_date || null,
    p_budget: project.budget || 0,
    p_status: project.status || "Planning",
    p_progress: project.progress || 0,
    p_org_id: project.org_id,
    p_created_by: project.created_by || null,
    p_client_id: project.client_id || null,
    p_engineer_id: project.engineer_id || null,
  })
  if (error) throw error
  invalidateCache(["projects"])
  return data?.[0] as Project
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("update_project", {
    p_id: id,
    p_name: updates.name ?? null,
    p_client_name: updates.client_name ?? null,
    p_address: updates.address ?? null,
    p_start_date: updates.start_date ?? null,
    p_expected_completion_date: updates.expected_completion_date ?? null,
    p_budget: updates.budget ?? null,
    p_spent: updates.spent ?? null,
    p_status: updates.status ?? null,
    p_progress: updates.progress ?? null,
    p_client_id: updates.client_id ?? null,
    p_engineer_id: updates.engineer_id ?? null,
  })
  if (error) throw error
  invalidateCache(["projects"])
  return data?.[0] as Project
}

export async function deleteProject(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("delete_project", { p_id: id })
  if (error) throw error
  invalidateCache(["projects"])
}

// ============================================================
// EXPENSES
// ============================================================
export function useExpenses(projectId?: string, search?: string) {
  const deferredSearch = useDeferredValue(search || "")
  return useSupabaseQuery<Expense[]>(async () => {
    const supabase = getSupabase()
    if (projectId) {
      const { data, error } = await supabase.rpc("get_project_expenses", { p_project_id: projectId })
      if (error) throw error
      return (data || []) as Expense[]
    }
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const cacheKey = deferredSearch ? `rpc:expenses:${orgId}:${deferredSearch}` : `rpc:expenses:${orgId}`
    return cachedFetcher(cacheKey, async () => {
      const params: Record<string, string> = { p_org_id: orgId }
      if (deferredSearch) params.p_search = deferredSearch
      const { data, error } = await supabase.rpc("get_all_expenses", params)
      if (error) throw error
      return (data || []) as Expense[]
    })
  }, [projectId, deferredSearch], "expenses")
}

export async function createExpense(expense: Omit<Expense, "id" | "created_at" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  const { data, error } = await supabase.rpc("insert_expense", {
    p_project_id: expense.project_id,
    p_amount: expense.amount,
    p_category: expense.category,
    p_vendor: expense.vendor || null,
    p_description: expense.description || null,
    p_date: expense.date,
    p_bill_url: expense.bill_url || null,
    p_created_by: userId,
    p_org_id: orgId,
  })
  if (error) throw error
  if (orgId) invalidateCache(["expenses"])
  return data?.[0] as Expense
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("update_expense", {
    p_id: id,
    p_amount: updates.amount ?? null,
    p_category: updates.category ?? null,
    p_vendor: updates.vendor ?? null,
    p_description: updates.description ?? null,
    p_date: updates.date ?? null,
    p_bill_url: updates.bill_url ?? null,
  })
  if (error) throw error
  invalidateCache(["expenses"])
  return data?.[0] as Expense
}

export async function deleteExpense(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("delete_expense", { p_id: id })
  if (error) throw error
  invalidateCache(["expenses"])
}

// ============================================================
// MATERIALS
// ============================================================
export function useMaterials(projectId?: string, search?: string) {
  const deferredSearch = useDeferredValue(search || "")
  return useSupabaseQuery<Material[]>(async () => {
    const supabase = getSupabase()
    if (projectId) {
      const { data, error } = await supabase.rpc("get_project_materials", { p_project_id: projectId })
      if (error) throw error
      return (data || []) as Material[]
    }
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const cacheKey = deferredSearch ? `rpc:materials:${orgId}:${deferredSearch}` : `rpc:materials:${orgId}`
    return cachedFetcher(cacheKey, async () => {
      const params: Record<string, string> = { p_org_id: orgId }
      if (deferredSearch) params.p_search = deferredSearch
      const { data, error } = await supabase.rpc("get_all_materials", params)
      if (error) throw error
      return (data || []) as Material[]
    })
  }, [projectId, deferredSearch], "materials")
}

export async function createMaterial(material: Omit<Material, "id" | "created_at" | "updated_at" | "quantity_remaining" | "total_cost" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const { data, error } = await supabase.rpc("insert_material", {
    p_project_id: material.project_id,
    p_name: material.name,
    p_category: material.category,
    p_quantity_purchased: material.quantity_purchased || 0,
    p_quantity_used: material.quantity_used || 0,
    p_unit: material.unit || "pcs",
    p_cost_per_unit: material.cost_per_unit || 0,
    p_vendor: material.vendor || null,
    p_reorder_level: material.reorder_level || 0,
    p_org_id: orgId,
  })
  if (error) throw error
  if (orgId) invalidateCache(["materials"])
  return data?.[0] as Material
}

export async function updateMaterial(id: string, updates: Partial<Material>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("update_material", {
    p_id: id,
    p_name: updates.name ?? null,
    p_category: updates.category ?? null,
    p_quantity_purchased: updates.quantity_purchased ?? null,
    p_quantity_used: updates.quantity_used ?? null,
    p_unit: updates.unit ?? null,
    p_cost_per_unit: updates.cost_per_unit ?? null,
    p_vendor: updates.vendor ?? null,
    p_reorder_level: updates.reorder_level ?? null,
  })
  if (error) throw error
  invalidateCache(["materials"])
  return data?.[0] as Material
}

export async function deleteMaterial(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("delete_material", { p_id: id })
  if (error) throw error
  invalidateCache(["materials"])
}

// ============================================================
// PHOTOS
// ============================================================
export function usePhotos(projectId?: string, search?: string) {
  const deferredSearch = useDeferredValue(search || "")
  return useSupabaseQuery<SitePhoto[]>(async () => {
    const supabase = getSupabase()
    if (projectId) {
      const params: Record<string, string> = { p_project_id: projectId }
      if (deferredSearch) params.p_search = deferredSearch
      const { data, error } = await supabase.rpc("get_project_photos", params)
      if (error) throw error
      return (data || []) as SitePhoto[]
    }
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const cacheKey = deferredSearch ? `rpc:photos:${orgId}:${deferredSearch}` : `rpc:photos:${orgId}`
    return cachedFetcher(cacheKey, async () => {
      const params: Record<string, string> = { p_org_id: orgId }
      if (deferredSearch) params.p_search = deferredSearch
      const { data, error } = await supabase.rpc("get_all_photos", params)
      if (error) throw error
      return (data || []) as SitePhoto[]
    })
  }, [projectId, deferredSearch], "site_photos")
}

export async function uploadPhoto(
  file: File,
  projectId: string,
  category: string,
  notes: string
): Promise<SitePhoto> {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  if (!orgId || !userId) throw new Error("Not authenticated")

  const compressed = await compressImage(file, { maxDimension: 2048, quality: 0.85 })

  const ext = compressed.name.split(".").pop() || "jpg"
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${orgId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("site-photos")
    .upload(filePath, compressed, { contentType: compressed.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from("site-photos").getPublicUrl(filePath)
  const publicUrl = urlData.publicUrl

  const { data, error } = await supabase.rpc("insert_photo", {
    p_project_id: projectId,
    p_url: publicUrl,
    p_thumbnail_url: publicUrl,
    p_notes: notes,
    p_category: category,
    p_gps_lat: 0,
    p_gps_lng: 0,
    p_uploaded_by: userId,
    p_org_id: orgId,
  })
  if (error) throw error

  const photo = data?.[0] as SitePhoto

  // Fire-and-forget: generate thumbnails server-side
  fetch("/api/process-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      storagePath: filePath,
      bucket: "site-photos",
      entityId: photo.id,
      entityType: "photo",
    }),
  }).catch(() => {})

  return photo
}

export async function deletePhoto(id: string, storagePath?: string) {
  const supabase = getSupabase()
  if (storagePath) {
    await supabase.storage.from("site-photos").remove([storagePath])
  }
  const { error } = await supabase.rpc("delete_photo", { p_id: id })
  if (error) throw error
  invalidateCache(["photos"])
}

// ============================================================
// REPORTS
// ============================================================
export function useReports(projectId?: string) {
  return useSupabaseQuery<ProgressReport[]>(async () => {
    const supabase = getSupabase()
    if (projectId) {
      const { data, error } = await supabase.rpc("get_project_progress", { p_project_id: projectId })
      if (error) throw error
      return (data || []) as ProgressReport[]
    }
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    return cachedFetcher(`rpc:reports:${orgId}`, async () => {
      const { data, error } = await supabase.rpc("get_all_reports", { p_org_id: orgId })
      if (error) throw error
      return (data || []) as ProgressReport[]
    })
  }, [projectId], "progress_reports")
}

export async function createReport(report: Omit<ProgressReport, "id" | "created_at" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  const { data, error } = await supabase.rpc("insert_report", {
    p_project_id: report.project_id,
    p_report_date: report.report_date,
    p_work_completed: report.work_completed || null,
    p_material_used: report.material_used || null,
    p_issues: report.issues || null,
    p_delays: report.delays || null,
    p_tomorrow_plan: report.tomorrow_plan || null,
    p_photos: report.photos || [],
    p_created_by: userId,
    p_org_id: orgId,
  })
  if (error) throw error
  if (orgId) invalidateCache(["reports"])
  return data?.[0] as ProgressReport
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export function useNotifications() {
  return useSupabaseQuery<Notification[]>(async () => {
    const supabase = getSupabase()
    const userId = getCurrentUserId()
    if (!userId) return []
    const { data, error } = await supabase.rpc("get_notifications", { p_user_id: userId })
    if (error) throw error
    return (data || []) as Notification[]
  }, [], "notifications")
}

export async function markNotificationRead(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("mark_notification_read", { p_id: id })
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const supabase = getSupabase()
  const userId = getCurrentUserId()
  if (!userId) return
  const { error } = await supabase.rpc("mark_all_notifications_read", { p_user_id: userId })
  if (error) throw error
}

// ============================================================
// BUDGET ALERTS
// ============================================================
export function useBudgetAlerts() {
  return useSupabaseQuery<BudgetAlert[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const { data, error } = await supabase.rpc("get_all_budget_alerts", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as BudgetAlert[]
  }, [], "budget_alerts")
}

// ============================================================
// BILL SCANS
// ============================================================
export function useBillScans() {
  return useSupabaseQuery<BillScan[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const { data, error } = await supabase.rpc("get_all_bill_scans", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as BillScan[]
  })
}

export async function uploadBillScan(file: File): Promise<BillScan> {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  if (!orgId) throw new Error("Not authenticated")

  const compressed = await compressImage(file, { maxDimension: 2048, quality: 0.85 })

  const ext = compressed.name.split(".").pop() || "jpg"
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${orgId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("bill-scans")
    .upload(filePath, compressed, { contentType: compressed.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from("bill-scans").getPublicUrl(filePath)
  const publicUrl = urlData.publicUrl

  const { data, error } = await supabase.rpc("insert_bill_scan", {
    p_org_id: orgId,
    p_image_url: publicUrl,
    p_expense_id: null,
    p_vendor_name: "Processing...",
    p_amount: 0,
    p_date: new Date().toISOString().split("T")[0],
    p_gst_number: null,
    p_confidence_score: 0,
    p_status: "processing",
  })
  if (error) throw error
  return data?.[0] as BillScan
}

export async function updateBillScan(id: string, updates: Partial<BillScan>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("update_bill_scan", {
    p_id: id,
    p_vendor_name: updates.vendor_name ?? null,
    p_amount: updates.amount ?? null,
    p_date: updates.date ?? null,
    p_gst_number: updates.gst_number ?? null,
    p_confidence_score: updates.confidence_score ?? null,
    p_status: updates.status ?? null,
    p_expense_id: updates.expense_id ?? null,
  })
  if (error) throw error
  return data?.[0] as BillScan
}

// ============================================================
// ROADMAPS
// ============================================================
export function useRoadmaps(projectId?: string) {
  return useSupabaseQuery<Roadmap[]>(async () => {
    const supabase = getSupabase()
    if (projectId) {
      const { data, error } = await supabase.rpc("get_project_roadmaps", { p_project_id: projectId })
      if (error) throw error
      return (data || []) as Roadmap[]
    }
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const { data, error } = await supabase.rpc("get_all_roadmaps", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as Roadmap[]
  }, [projectId], "roadmaps")
}

export async function createRoadmap(roadmap: Omit<Roadmap, "id" | "created_at" | "updated_at" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  const { data, error } = await supabase.rpc("insert_roadmap", {
    p_project_id: roadmap.project_id,
    p_org_id: orgId,
    p_title: roadmap.title,
    p_description: roadmap.description || "",
    p_phases: roadmap.phases || [],
    p_created_by: userId,
  })
  if (error) throw error
  if (orgId) invalidateCache(["projects"])
  return data?.[0] as Roadmap
}

export async function updateRoadmap(id: string, updates: Partial<Roadmap>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("update_roadmap", {
    p_id: id,
    p_title: updates.title ?? null,
    p_description: updates.description ?? null,
    p_phases: updates.phases ?? null,
  })
  if (error) throw error
  invalidateCache(["projects"])
  return data?.[0] as Roadmap
}

export async function deleteRoadmap(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("delete_roadmap", { p_id: id })
  if (error) throw error
  invalidateCache(["projects"])
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export function useDashboardStats() {
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjects()
  const { data: expenses, isLoading: expensesLoading } = useExpenses()
  const { data: materials, isLoading: materialsLoading } = useMaterials()

  const isLoading = projectsLoading || expensesLoading || materialsLoading

  const stats = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter((p) => p.status !== "Completed").length || 0,
    totalBudget: projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
    totalExpenses: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
    budgetRemaining: projects?.reduce((sum, p) => sum + ((p.budget || 0) - (p.spent || 0)), 0) || 0,
    materialValue: materials?.reduce((sum, m) => sum + ((m.quantity_remaining || 0) * (m.cost_per_unit || 0)), 0) || 0,
    delayedProjects: projects?.filter((p) => p.progress < 30 && p.status !== "Planning" && p.status !== "Completed").length || 0,
  }

  return { stats, isLoading, error: projectsError || null }
}

export function useMonthlyExpenses() {
  return useSupabaseQuery<{ month: string; amount: number }[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const since = sixMonthsAgo.toISOString().split("T")[0]
    return cachedFetcher(`rpc:expenses_chart:${orgId}:${since}`, async () => {
      const { data, error } = await supabase.rpc("get_expenses_for_chart", {
        p_org_id: orgId,
        p_since: since,
      })
      if (error) throw error
      const grouped: Record<string, number> = {}
      data?.forEach((e: { amount?: number; date?: string }) => {
        const month = e.date?.substring(0, 7) || "Unknown"
        grouped[month] = (grouped[month] || 0) + (e.amount || 0)
      })
      return Object.entries(grouped).map(([month, amount]) => ({ month, amount }))
    })
  })
}

export function useBudgetConsumption() {
  const { data: projects } = useProjects()
  const mapped = (projects || []).map((p) => ({
    project_id: p.id,
    project_name: p.name,
    budget: p.budget || 0,
    spent: p.spent || 0,
    percentage: p.budget ? Math.round(((p.spent || 0) / p.budget) * 100) : 0,
  }))
  return { data: mapped, isLoading: false, error: null, refetch: () => {} }
}

export function useProjectProgress() {
  const { data: projects } = useProjects()
  const mapped = (projects || []).map((p) => ({
    project_id: p.id,
    project_name: p.name,
    progress: p.progress || 0,
    status: p.status || "Planning",
  }))
  return { data: mapped, isLoading: false, error: null, refetch: () => {} }
}

// ============================================================
// ACTIVITY LOGS
// ============================================================
export function useActivityLogs(limit = 50) {
  return useSupabaseQuery<ActivityLog[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const { data, error } = await supabase.rpc("get_activity_logs", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as ActivityLog[]
  }, [limit], "activity_logs")
}

export async function logActivity(params: {
  action: ActivityAction
  entity_type: EntityType
  entity_id: string
  entity_name: string
  details?: Record<string, any>
  old_value?: Record<string, any> | null
  new_value?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
}) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  if (!orgId || !userId) return

  await supabase.rpc("insert_activity_log", {
    p_org_id: orgId,
    p_user_id: userId,
    p_action: params.action,
    p_entity_type: params.entity_type,
    p_entity_id: params.entity_id,
    p_entity_name: params.entity_name,
    p_details: params.details || null,
    p_old_value: params.old_value || null,
    p_new_value: params.new_value || null,
    p_ip_address: params.ip_address || null,
    p_user_agent: params.user_agent || (typeof navigator !== "undefined" ? navigator.userAgent : null),
  })
}

// ============================================================
// TEAM MEMBERS
// ============================================================
export function useTeamMembers() {
  return useSupabaseQuery<User[]>(async () => {
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_org_users", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as User[]
  })
}

export async function addMember(params: {
  email: string
  full_name: string
  role: string
  org_id: string
  captchaToken?: string
}): Promise<{ data: User; tempPassword?: string; message: string }> {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Not authenticated")

  const res = await fetch("/api/team/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Failed to add member")
  return json
}

export async function updateMemberRole(userId: string, newRole: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("update_user_role", {
    p_user_id: userId,
    p_role: newRole,
  })
  if (error) throw error
}

export async function removeMember(userId: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("delete_user", { p_user_id: userId })
  if (error) throw error
}

// ============================================================
// SOFT DELETE RESTORE FUNCTIONS
// ============================================================

export async function restoreProject(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("restore_project", { p_id: id })
  if (error) throw error
}

export async function restoreExpense(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("restore_expense", { p_id: id })
  if (error) throw error
}

export async function restoreMaterial(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("restore_material", { p_id: id })
  if (error) throw error
}

export async function restorePhoto(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("restore_photo", { p_id: id })
  if (error) throw error
}

export async function restoreRoadmap(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("restore_roadmap", { p_id: id })
  if (error) throw error
}

export async function restoreTeamMember(userId: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("restore_user", { p_user_id: userId })
  if (error) throw error
}

// ============================================================
// DELETED ITEMS HOOKS (owner-only view)
// ============================================================

export function useDeletedProjects() {
  return useSupabaseQuery<Project[]>(async () => {
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_deleted_projects", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as Project[]
  })
}

export function useDeletedExpenses() {
  return useSupabaseQuery<Expense[]>(async () => {
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_deleted_expenses", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as Expense[]
  })
}

export function useDeletedMaterials() {
  return useSupabaseQuery<Material[]>(async () => {
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_deleted_materials", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as Material[]
  })
}

export function useDeletedPhotos() {
  return useSupabaseQuery<SitePhoto[]>(async () => {
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_deleted_photos", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as SitePhoto[]
  })
}

export function useDeletedRoadmaps() {
  return useSupabaseQuery<Roadmap[]>(async () => {
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_deleted_roadmaps", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as Roadmap[]
  })
}

export function useDeletedTeamMembers() {
  return useSupabaseQuery<User[]>(async () => {
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_deleted_users", { p_org_id: orgId })
    if (error) throw error
    return (data || []) as User[]
  })
}

// ============================================================
// VENDORS
// ============================================================
export function useVendors(search?: string, status?: string) {
  const deferredSearch = useDeferredValue(search || "")
  return useSupabaseQuery<Vendor[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const cacheKey = `rpc:vendors:${orgId}:${deferredSearch}:${status || ""}`
    return cachedFetcher(cacheKey, async () => {
      const params: Record<string, string> = { p_org_id: orgId }
      if (deferredSearch) params.p_search = deferredSearch
      if (status && status !== "all") params.p_status = status
      const { data, error } = await supabase.rpc("get_all_vendors", params)
      if (error) throw error
      return (data || []) as Vendor[]
    })
  }, [deferredSearch, status], "vendors")
}

export function useVendor(id: string | undefined) {
  return useSupabaseQuery<Vendor | null>(async () => {
    if (!id) return null
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_vendor", { p_id: id })
    if (error) throw error
    return (data?.[0] || null) as Vendor | null
  }, [id])
}

export async function createVendor(vendor: Omit<Vendor, "id" | "created_at" | "updated_at" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  const { data, error } = await supabase.rpc("insert_vendor", {
    p_business_name: vendor.business_name,
    p_owner_name: vendor.owner_name,
    p_phone: vendor.phone,
    p_alt_phone: vendor.alt_phone || null,
    p_gst_number: vendor.gst_number || null,
    p_address: vendor.address || null,
    p_material_categories: vendor.material_categories || [],
    p_payment_terms_days: vendor.payment_terms_days || 30,
    p_credit_limit: vendor.credit_limit || 0,
    p_status: vendor.status || "active",
    p_notes: vendor.notes || null,
    p_org_id: orgId,
    p_created_by: userId,
  })
  if (error) throw error
  invalidateCache(["vendors"])
  return data?.[0] as Vendor
}

export async function updateVendor(id: string, updates: Partial<Vendor>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("update_vendor", {
    p_id: id,
    p_business_name: updates.business_name ?? null,
    p_owner_name: updates.owner_name ?? null,
    p_phone: updates.phone ?? null,
    p_alt_phone: updates.alt_phone ?? null,
    p_gst_number: updates.gst_number ?? null,
    p_address: updates.address ?? null,
    p_material_categories: updates.material_categories ?? null,
    p_payment_terms_days: updates.payment_terms_days ?? null,
    p_credit_limit: updates.credit_limit ?? null,
    p_status: updates.status ?? null,
    p_notes: updates.notes ?? null,
  })
  if (error) throw error
  invalidateCache(["vendors"])
  return data?.[0] as Vendor
}

export async function deleteVendor(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("delete_vendor", { p_id: id })
  if (error) throw error
  invalidateCache(["vendors"])
}

export async function restoreVendor(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("restore_vendor", { p_id: id })
  if (error) throw error
  invalidateCache(["vendors"])
}

// ============================================================
// PURCHASE ORDERS
// ============================================================
export function usePurchaseOrders(search?: string, status?: string, vendorId?: string, projectId?: string) {
  const deferredSearch = useDeferredValue(search || "")
  return useSupabaseQuery<PurchaseOrder[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const cacheKey = `rpc:pos:${orgId}:${deferredSearch}:${status || ""}:${vendorId || ""}:${projectId || ""}`
    return cachedFetcher(cacheKey, async () => {
      const params: Record<string, any> = { p_org_id: orgId }
      if (deferredSearch) params.p_search = deferredSearch
      if (status && status !== "all") params.p_status = status
      if (vendorId) params.p_vendor_id = vendorId
      if (projectId) params.p_project_id = projectId
      const { data, error } = await supabase.rpc("get_all_purchase_orders", params)
      if (error) throw error
      return (data || []) as PurchaseOrder[]
    })
  }, [deferredSearch, status, vendorId, projectId], "purchase_orders")
}

export function usePurchaseOrder(id: string | undefined) {
  return useSupabaseQuery<PurchaseOrder | null>(async () => {
    if (!id) return null
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_purchase_order", { p_id: id })
    if (error) throw error
    return (data?.[0] || null) as PurchaseOrder | null
  }, [id])
}

export function usePOItems(poId: string | undefined) {
  return useSupabaseQuery<POItem[]>(async () => {
    if (!poId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_po_items", { p_po_id: poId })
    if (error) throw error
    return (data || []) as POItem[]
  }, [poId])
}

export async function createPurchaseOrder(data: {
  vendor_id: string; project_id: string; po_date: string;
  expected_delivery_date?: string; tax_amount?: number;
  transport_amount?: number; notes?: string;
  items: { material_name: string; description?: string; quantity: number; unit: string; unit_price: number }[];
}) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  const { data: result, error } = await supabase.rpc("insert_purchase_order", {
    p_vendor_id: data.vendor_id,
    p_project_id: data.project_id,
    p_po_date: data.po_date,
    p_expected_delivery_date: data.expected_delivery_date || null,
    p_tax_amount: data.tax_amount || 0,
    p_transport_amount: data.transport_amount || 0,
    p_notes: data.notes || null,
    p_items: data.items,
    p_org_id: orgId,
    p_created_by: userId,
  })
  if (error) throw error
  invalidateCache(["purchase_orders", "vendors"])
  return result?.[0] as PurchaseOrder
}

export async function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("update_purchase_order", {
    p_id: id,
    p_expected_delivery_date: updates.expected_delivery_date ?? null,
    p_tax_amount: updates.tax_amount ?? null,
    p_transport_amount: updates.transport_amount ?? null,
    p_notes: updates.notes ?? null,
    p_status: updates.status ?? null,
  })
  if (error) throw error
  invalidateCache(["purchase_orders"])
  return data?.[0] as PurchaseOrder
}

export async function cancelPurchaseOrder(id: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("cancel_purchase_order", { p_id: id })
  if (error) throw error
  invalidateCache(["purchase_orders"])
  return data?.[0] as PurchaseOrder
}

export async function deletePurchaseOrder(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("delete_purchase_order", { p_id: id })
  if (error) throw error
  invalidateCache(["purchase_orders"])
}

// ============================================================
// MATERIAL RECEIVINGS
// ============================================================
export function usePOReceivings(poId: string | undefined) {
  return useSupabaseQuery<MaterialReceiving[]>(async () => {
    if (!poId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_po_receivings", { p_po_id: poId })
    if (error) throw error
    return (data || []) as MaterialReceiving[]
  }, [poId])
}

export async function recordMaterialReceiving(data: {
  po_id: string; po_item_id: string; received_quantity: number;
  received_date?: string; notes?: string;
}) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  const { data: result, error } = await supabase.rpc("insert_material_receiving", {
    p_po_id: data.po_id,
    p_po_item_id: data.po_item_id,
    p_received_quantity: data.received_quantity,
    p_received_date: data.received_date || null,
    p_notes: data.notes || null,
    p_org_id: orgId,
    p_received_by: userId,
  })
  if (error) throw error
  invalidateCache(["purchase_orders", "materials"])
  return result?.[0] as MaterialReceiving
}

// ============================================================
// VENDOR PAYMENTS
// ============================================================
export function useVendorPayments(vendorId?: string, poId?: string) {
  return useSupabaseQuery<VendorPayment[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const params: Record<string, any> = { p_org_id: orgId }
    if (vendorId) params.p_vendor_id = vendorId
    if (poId) params.p_po_id = poId
    const { data, error } = await supabase.rpc("get_all_vendor_payments", params)
    if (error) throw error
    return (data || []) as VendorPayment[]
  }, [vendorId, poId])
}

export async function recordVendorPayment(data: {
  po_id: string; vendor_id: string; amount: number;
  payment_date?: string; payment_method: string;
  reference_number?: string; notes?: string;
}) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  const { data: result, error } = await supabase.rpc("insert_vendor_payment", {
    p_po_id: data.po_id,
    p_vendor_id: data.vendor_id,
    p_amount: data.amount,
    p_payment_date: data.payment_date || null,
    p_payment_method: data.payment_method,
    p_reference_number: data.reference_number || null,
    p_notes: data.notes || null,
    p_org_id: orgId,
    p_created_by: userId,
  })
  if (error) throw error
  invalidateCache(["purchase_orders", "vendors"])
  return result?.[0] as VendorPayment
}

export async function deleteVendorPayment(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.rpc("delete_vendor_payment", { p_id: id })
  if (error) throw error
  invalidateCache(["purchase_orders", "vendors"])
}

// ============================================================
// VENDOR LEDGER
// ============================================================
export function useVendorLedger(vendorId: string | undefined) {
  return useSupabaseQuery<VendorLedgerEntry[]>(async () => {
    if (!vendorId) return []
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_vendor_ledger", { p_vendor_id: vendorId })
    if (error) throw error
    return (data || []) as VendorLedgerEntry[]
  }, [vendorId])
}

// ============================================================
// OUTSTANDING DASHBOARD
// ============================================================
export function useOutstandingSummary() {
  return useSupabaseQuery<any>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return null
    const { data, error } = await supabase.rpc("get_outstanding_summary", { p_org_id: orgId })
    if (error) throw error
    return data?.[0] || null
  })
}

export function useTopVendors(limit?: number) {
  return useSupabaseQuery<VendorSummary[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const { data, error } = await supabase.rpc("get_top_vendors", { p_org_id: orgId, p_limit: limit || 5 })
    if (error) throw error
    return (data || []) as VendorSummary[]
  }, [limit])
}

// ============================================================
// GLOBAL SEARCH
// ============================================================
export function useVendorSearch(query: string) {
  const deferredQuery = useDeferredValue(query)
  return useSupabaseQuery<any[]>(async () => {
    const supabase = getSupabase()
    const orgId = getCurrentOrgId()
    if (!orgId) return []
    const { data, error } = await supabase.rpc("search_vendors_and_pos", {
      p_org_id: orgId, p_query: deferredQuery,
    })
    if (error) throw error
    return (data || [])
  }, [deferredQuery])
}
