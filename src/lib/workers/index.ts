import type { Job } from "@/lib/services/queue.service"
import { processImageJob } from "./image.worker"
import { processNotificationJob } from "./notification.worker"
import { processAnalyticsJob, processBudgetCheckJob } from "./analytics.worker"
import { processBillScanJob } from "./billscan.worker"

/**
 * Worker Router — dispatches jobs to the appropriate worker based on type.
 */
export async function processJob(job: Job): Promise<void> {
  try {
    switch (job.type) {
      case "image.process":
        await processImageJob(job)
        break
      case "notification.send":
        await processNotificationJob(job)
        break
      case "analytics.aggregate":
        await processAnalyticsJob(job)
        break
      case "budget.check":
        await processBudgetCheckJob(job)
        break
      case "billscan.process":
        await processBillScanJob(job)
        break
      case "notification.cleanup":
        // Handled by NotificationService.cleanup()
        break
      default:
        console.warn(`[WorkerRouter] Unknown job type: ${(job as any).type}`)
    }
  } catch (error) {
    console.error(`[WorkerRouter] Error processing ${job.type}:`, error)
    throw error // Re-throw for retry logic
  }
}
