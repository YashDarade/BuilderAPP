import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface CreateNotificationParams {
  user_id: string
  org_id: string
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  entity_type?: string
  entity_id?: string
}

/**
 * Notification Service — server-side notification management.
 * Creates notifications from domain events and manages read state.
 */
export const NotificationService = {
  /**
   * Create a notification for a user.
   */
  async create(params: CreateNotificationParams): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase.rpc("insert_notification", {
      p_user_id: params.user_id,
      p_org_id: params.org_id,
      p_title: params.title,
      p_message: params.message,
      p_type: params.type || "info",
      p_entity_type: params.entity_type || null,
      p_entity_id: params.entity_id || null,
    })
    if (error) console.error("[NotificationService] create error:", error)
  },

  /**
   * Create notifications for multiple users in an org.
   */
  async createForOrg(
    orgId: string,
    excludeUserId: string,
    params: Omit<CreateNotificationParams, "user_id" | "org_id">
  ): Promise<void> {
    const supabase = getSupabase()
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("org_id", orgId)
      .neq("id", excludeUserId)

    if (!users) return

    for (const user of users) {
      await this.create({ ...params, user_id: user.id, org_id: orgId })
    }
  },

  /**
   * Create notifications for all users in an org (including the actor).
   */
  async createForAllOrgMembers(
    orgId: string,
    params: Omit<CreateNotificationParams, "user_id" | "org_id">
  ): Promise<void> {
    const supabase = getSupabase()
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("org_id", orgId)

    if (!users) return

    for (const user of users) {
      await this.create({ ...params, user_id: user.id, org_id: orgId })
    }
  },

  /**
   * Mark a notification as read.
   */
  async markRead(notificationId: string): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase.rpc("mark_notification_read", {
      p_id: notificationId,
    })
    if (error) console.error("[NotificationService] markRead error:", error)
  },

  /**
   * Mark all notifications for a user as read.
   */
  async markAllRead(userId: string): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase.rpc("mark_all_notifications_read", {
      p_user_id: userId,
    })
    if (error) console.error("[NotificationService] markAllRead error:", error)
  },

  /**
   * Delete old notifications (cleanup job).
   */
  async cleanup(olderThanDays: number = 30): Promise<void> {
    const supabase = getSupabase()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - olderThanDays)
    const { error } = await supabase
      .from("notifications")
      .delete()
      .lt("created_at", cutoff.toISOString())
    if (error) console.error("[NotificationService] cleanup error:", error)
  },
}
