"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/config"
import { useStore } from "@/lib/store"
import { fetchWithCache } from "@/lib/offline/cache"
import type { StoreName } from "@/lib/offline/db"
import type { Project, Expense, Material, SitePhoto, ProgressReport, Notification, BudgetAlert, Roadmap, BillScan, ActivityLog, ActivityAction, EntityType } from "@/lib/types"

function getSupabase() {
  return createClient()
}

function getCurrentOrgId(): string | null {
  return useStore.getState().currentUser?.org_id || null
}

function getCurrentUserId(): string | null {
  return useStore.getState().currentUser?.id || null
}

// Generic query hook with loading/error states
// cacheStore: optional IndexedDB store name for offline-first reads
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
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data || []) as Project[]
  }, [], "projects")
}

export function useProject(id: string | undefined) {
  return useSupabaseQuery<Project | null>(async () => {
    if (!id) return null
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()
    if (error) throw error
    return data as Project | null
  }, [id])
}

export async function createProject(project: Omit<Project, "id" | "created_at" | "updated_at">) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single()
  if (error) throw error
  return data as Project
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Project
}

export async function deleteProject(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) throw error
}

// ============================================================
// EXPENSES
// ============================================================
export function useExpenses(projectId?: string) {
  return useSupabaseQuery<Expense[]>(async () => {
    const supabase = getSupabase()
    let query = supabase.from("expenses").select("*").order("date", { ascending: false })
    if (projectId) query = query.eq("project_id", projectId)
    const { data, error } = await query
    if (error) throw error
    return (data || []) as Expense[]
  }, [projectId], "expenses")
}

export async function createExpense(expense: Omit<Expense, "id" | "created_at" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const { data, error } = await supabase.from("expenses").insert({ ...expense, org_id: orgId }).select().single()
  if (error) throw error
  return data as Expense
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.from("expenses").delete().eq("id", id)
  if (error) throw error
}

// ============================================================
// MATERIALS
// ============================================================
export function useMaterials(projectId?: string) {
  return useSupabaseQuery<Material[]>(async () => {
    const supabase = getSupabase()
    let query = supabase.from("materials").select("*").order("name")
    if (projectId) query = query.eq("project_id", projectId)
    const { data, error } = await query
    if (error) throw error
    return (data || []) as Material[]
  }, [projectId], "materials")
}

export async function createMaterial(material: Omit<Material, "id" | "created_at" | "updated_at" | "quantity_remaining" | "total_cost" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const { data, error } = await supabase.from("materials").insert({ ...material, org_id: orgId }).select().single()
  if (error) throw error
  return data as Material
}

export async function updateMaterial(id: string, updates: Partial<Material>) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("materials").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data as Material
}

export async function deleteMaterial(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.from("materials").delete().eq("id", id)
  if (error) throw error
}

// ============================================================
// PHOTOS
// ============================================================
export function usePhotos(projectId?: string) {
  return useSupabaseQuery<SitePhoto[]>(async () => {
    const supabase = getSupabase()
    let query = supabase.from("site_photos").select("*").order("created_at", { ascending: false })
    if (projectId) query = query.eq("project_id", projectId)
    const { data, error } = await query
    if (error) throw error
    return (data || []) as SitePhoto[]
  }, [projectId], "site_photos")
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

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${orgId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("site-photos")
    .upload(filePath, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from("site-photos").getPublicUrl(filePath)
  const publicUrl = urlData.publicUrl

  const { data, error } = await supabase
    .from("site_photos")
    .insert({
      project_id: projectId,
      org_id: orgId,
      url: publicUrl,
      thumbnail_url: publicUrl,
      notes,
      category,
      gps_lat: 0,
      gps_lng: 0,
      uploaded_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data as SitePhoto
}

export async function deletePhoto(id: string, storagePath?: string) {
  const supabase = getSupabase()
  if (storagePath) {
    await supabase.storage.from("site-photos").remove([storagePath])
  }
  const { error } = await supabase.from("site_photos").delete().eq("id", id)
  if (error) throw error
}

// ============================================================
// REPORTS
// ============================================================
export function useReports(projectId?: string) {
  return useSupabaseQuery<ProgressReport[]>(async () => {
    const supabase = getSupabase()
    let query = supabase.from("progress_reports").select("*").order("report_date", { ascending: false })
    if (projectId) query = query.eq("project_id", projectId)
    const { data, error } = await query
    if (error) throw error
    return (data || []) as ProgressReport[]
  }, [projectId], "progress_reports")
}

export async function createReport(report: Omit<ProgressReport, "id" | "created_at" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const { data, error } = await supabase.from("progress_reports").insert({ ...report, org_id: orgId }).select().single()
  if (error) throw error
  return data as ProgressReport
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export function useNotifications() {
  return useSupabaseQuery<Notification[]>(async () => {
    const supabase = getSupabase()
    const userId = getCurrentUserId()
    if (!userId) return []
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data || []) as Notification[]
  }, [], "notifications")
}

export async function markNotificationRead(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const supabase = getSupabase()
  const userId = getCurrentUserId()
  if (!userId) return
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
  if (error) throw error
}

// ============================================================
// BUDGET ALERTS
// ============================================================
export function useBudgetAlerts() {
  return useSupabaseQuery<BudgetAlert[]>(async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("budget_alerts")
      .select("*")
      .order("created_at", { ascending: false })
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
    const { data, error } = await supabase
      .from("bill_scans")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data || []) as BillScan[]
  })
}

export async function uploadBillScan(file: File): Promise<BillScan> {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  if (!orgId || !userId) throw new Error("Not authenticated")

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${orgId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("bill-scans")
    .upload(filePath, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from("bill-scans").getPublicUrl(filePath)
  const publicUrl = urlData.publicUrl

  const { data, error } = await supabase
    .from("bill_scans")
    .insert({
      org_id: orgId,
      image_url: publicUrl,
      expense_id: null,
      vendor_name: "Processing...",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      gst_number: null,
      confidence_score: 0,
      status: "processing",
    })
    .select()
    .single()
  if (error) throw error
  return data as BillScan
}

export async function updateBillScan(id: string, updates: Partial<BillScan>) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("bill_scans")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as BillScan
}

// ============================================================
// ROADMAPS
// ============================================================
export function useRoadmaps(projectId?: string) {
  return useSupabaseQuery<Roadmap[]>(async () => {
    const supabase = getSupabase()
    let query = supabase.from("roadmaps").select("*").order("created_at", { ascending: false })
    if (projectId) query = query.eq("project_id", projectId)
    const { data, error } = await query
    if (error) throw error
    return (data || []) as Roadmap[]
  }, [projectId], "roadmaps")
}

export async function createRoadmap(roadmap: Omit<Roadmap, "id" | "created_at" | "updated_at" | "org_id">) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const { data, error } = await supabase
    .from("roadmaps")
    .insert({ ...roadmap, org_id: orgId })
    .select()
    .single()
  if (error) throw error
  return data as Roadmap
}

export async function updateRoadmap(id: string, updates: Partial<Roadmap>) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("roadmaps")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Roadmap
}

export async function deleteRoadmap(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.from("roadmaps").delete().eq("id", id)
  if (error) throw error
}

// ============================================================
// DASHBOARD STATS (derived from real data)
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
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, date")
      .gte("date", sixMonthsAgo.toISOString().split("T")[0])
      .order("date")
    if (error) throw error
    // Group by month
    const grouped: Record<string, number> = {}
    data?.forEach((e: { amount?: number; date?: string }) => {
      const month = e.date?.substring(0, 7) || "Unknown"
      grouped[month] = (grouped[month] || 0) + (e.amount || 0)
    })
    return Object.entries(grouped).map(([month, amount]) => ({ month, amount }))
  })
}

export function useBudgetConsumption() {
  return useSupabaseQuery<{ project_id: string; project_name: string; budget: number; spent: number; percentage: number }[]>(async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, budget, spent")
    if (error) throw error
    return (data || []).map((p: { id: string; name: string; budget: number; spent: number }) => ({
      project_id: p.id,
      project_name: p.name,
      budget: p.budget || 0,
      spent: p.spent || 0,
      percentage: p.budget ? Math.round(((p.spent || 0) / p.budget) * 100) : 0,
    }))
  })
}

export function useProjectProgress() {
  return useSupabaseQuery<{ project_id: string; project_name: string; progress: number; status: string }[]>(async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, progress, status")
    if (error) throw error
    return (data || []).map((p: { id: string; name: string; progress: number; status: string }) => ({
      project_id: p.id,
      project_name: p.name,
      progress: p.progress || 0,
      status: p.status || "Planning",
    }))
  })
}

// ============================================================
// ACTIVITY LOGS
// ============================================================
export function useActivityLogs(limit = 50) {
  return useSupabaseQuery<ActivityLog[]>(async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, users!activity_logs_user_id_fkey(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(limit)
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
}) {
  const supabase = getSupabase()
  const orgId = getCurrentOrgId()
  const userId = getCurrentUserId()
  if (!orgId || !userId) return

  await supabase.from("activity_logs").insert({
    org_id: orgId,
    user_id: userId,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    entity_name: params.entity_name,
    details: params.details || null,
  })
}
