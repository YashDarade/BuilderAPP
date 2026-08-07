import type { Job } from "@/lib/services/queue.service"
import { AnalyticsService } from "@/lib/services/analytics.service"
import { redis } from "@/lib/redis"

const ANALYTICS_CACHE_KEY = "buildtrack:analytics:dashboard"
const ANALYTICS_CACHE_TTL = 300 // 5 minutes

/**
 * Analytics Worker — aggregates dashboard stats and caches results.
 * Runs on a cron schedule to keep dashboard data fresh.
 */
export async function processAnalyticsJob(job: Job): Promise<void> {
  const { orgId } = job.data

  if (!orgId) {
    console.error("[AnalyticsWorker] Missing orgId")
    return
  }

  // Compute dashboard stats
  const [stats, monthlyExpenses, budgetConsumption] = await Promise.all([
    AnalyticsService.getDashboardStats(orgId),
    AnalyticsService.getMonthlyExpenses(orgId),
    AnalyticsService.getBudgetConsumption(orgId),
  ])

  // Cache results in Redis
  if (redis) {
    const cacheData = { stats, monthlyExpenses, budgetConsumption, computedAt: Date.now() }
    await redis.set(`${ANALYTICS_CACHE_KEY}:${orgId}`, JSON.stringify(cacheData), {
      ex: ANALYTICS_CACHE_TTL,
    })
  }
}

/**
 * Budget Check Worker — checks budget thresholds and creates alerts.
 */
export async function processBudgetCheckJob(job: Job): Promise<void> {
  const { orgId, projectId, projectName, percentage } = job.data

  if (!orgId || !projectId) {
    console.error("[BudgetCheckWorker] Missing required data")
    return
  }

  // Budget threshold logic is handled by Supabase database functions
  // This worker can add additional server-side checks or notifications

  if (percentage >= 90) {
    console.warn(`[BudgetCheck] CRITICAL: ${projectName} at ${percentage}% budget`)
  } else if (percentage >= 70) {
    console.warn(`[BudgetCheck] WARNING: ${projectName} at ${percentage}% budget`)
  }
}
