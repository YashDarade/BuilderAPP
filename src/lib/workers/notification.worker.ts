import type { Job } from "@/lib/services/queue.service"
import { NotificationService } from "@/lib/services/notification.service"

/**
 * Notification Worker — sends notifications via email/push.
 * Currently creates in-app notifications. Can be extended for email (Resend/SendGrid) or push (Web Push).
 */
export async function processNotificationJob(job: Job): Promise<void> {
  const { userId, orgId, title, message, type, entityType, entityId } = job.data

  if (!userId || !orgId || !title || !message) {
    console.error("[NotificationWorker] Missing required data:", job.data)
    return
  }

  // Create in-app notification
  await NotificationService.create({
    user_id: userId,
    org_id: orgId,
    title,
    message,
    type: type || "info",
    entity_type: entityType,
    entity_id: entityId,
  })

  // Future: Add email notification here
  // if (user.email) {
  //   await sendEmail({ to: user.email, subject: title, body: message })
  // }

  // Future: Add push notification here
  // if (user.pushSubscription) {
  //   await sendPushNotification(user.pushSubscription, { title, body: message })
  // }
}
