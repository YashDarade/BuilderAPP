"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/config"
import { useStore } from "@/lib/store"

type RealtimeTable = 
  | "projects"
  | "expenses"
  | "materials"
  | "site_photos"
  | "progress_reports"
  | "notifications"
  | "budget_alerts"
  | "roadmaps"
  | "activity_logs"
  | "users"
  | "bill_scans"
  | "vendors"
  | "purchase_orders"
  | "po_items"
  | "material_receivings"
  | "vendor_payments"

/**
 * Subscribes to Supabase Realtime changes on one or more tables
 * and calls refetch when anything changes (INSERT, UPDATE, DELETE).
 * Filters by org_id so team members only see their org's changes.
 */
export function useRealtimeSync(
  tables: RealtimeTable[],
  refetch: () => void
) {
  const { currentUser } = useStore()
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(() => {
    if (!currentUser?.org_id) return

    const supabase = createClient()
    const channelName = `realtime-org-${currentUser.org_id}-${tables.sort().join("-")}`
    const channel = supabase.channel(channelName)

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `org_id=eq.${currentUser.org_id}`,
        },
        () => {
          refetchRef.current()
        }
      )
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.org_id, tables.join(",")])
}

/**
 * Subscribe to realtime changes on notifications table (filtered by user_id).
 */
export function useNotificationsRealtime(refetch: () => void) {
  const { currentUser } = useStore()
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(() => {
    if (!currentUser?.id) return

    const supabase = createClient()
    const channel = supabase.channel(`realtime-notifications-${currentUser.id}`)

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${currentUser.id}`,
      },
      () => {
        refetchRef.current()
      }
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])
}

/**
 * Subscribe to realtime changes on activity_logs table (filtered by org_id).
 */
export function useActivityRealtime(refetch: () => void) {
  const { currentUser } = useStore()
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(() => {
    if (!currentUser?.org_id) return

    const supabase = createClient()
    const channel = supabase.channel(`realtime-activity-${currentUser.org_id}`)

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "activity_logs",
        filter: `org_id=eq.${currentUser.org_id}`,
      },
      () => {
        refetchRef.current()
      }
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.org_id])
}
