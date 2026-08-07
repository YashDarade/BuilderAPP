import { redis } from "@/lib/redis"

const QUEUE_PREFIX = "buildtrack:queue:"
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

export type JobType =
  | "image.process"
  | "billscan.process"
  | "notification.send"
  | "analytics.aggregate"
  | "budget.check"
  | "notification.cleanup"

export interface Job {
  id: string
  type: JobType
  data: Record<string, any>
  retries: number
  createdAt: number
}

/**
 * Queue Service — Redis list-based job queue.
 * Uses LPUSH/BRPOP for reliable job processing.
 */
export const QueueService = {
  /**
   * Enqueue a job.
   */
  async enqueue(type: JobType, data: Record<string, any> = {}): Promise<string> {
    if (!redis) {
      console.warn("[QueueService] Redis not available, skipping job")
      return ""
    }

    const job: Job = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      data,
      retries: 0,
      createdAt: Date.now(),
    }

    await redis.lpush(`${QUEUE_PREFIX}${type}`, JSON.stringify(job))
    return job.id
  },

  /**
   * Dequeue the next job (non-blocking pop).
   */
  async dequeue(type: JobType): Promise<Job | null> {
    if (!redis) return null

    const raw = await redis.rpop(`${QUEUE_PREFIX}${type}`)
    if (!raw) return null

    try {
      return JSON.parse(raw) as Job
    } catch {
      return null
    }
  },

  /**
   * Re-enqueue a failed job with retry.
   */
  async retry(job: Job): Promise<void> {
    if (!redis) return

    if (job.retries >= MAX_RETRIES) {
      console.error(`[QueueService] Job ${job.id} exceeded max retries`)
      return
    }

    const retryJob: Job = {
      ...job,
      retries: job.retries + 1,
    }

    // Delay before retry
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    await redis.lpush(`${QUEUE_PREFIX}${job.type}`, JSON.stringify(retryJob))
  },

  /**
   * Get queue length for monitoring.
   */
  async getQueueLength(type: JobType): Promise<number> {
    if (!redis) return 0
    return (await redis.llen(`${QUEUE_PREFIX}${type}`)) || 0
  },

  /**
   * Get all queue lengths for monitoring.
   */
  async getAllQueueLengths(): Promise<Record<string, number>> {
    const types: JobType[] = [
      "image.process",
      "billscan.process",
      "notification.send",
      "analytics.aggregate",
      "budget.check",
      "notification.cleanup",
    ]

    const lengths: Record<string, number> = {}
    for (const type of types) {
      lengths[type] = await this.getQueueLength(type)
    }
    return lengths
  },
}
