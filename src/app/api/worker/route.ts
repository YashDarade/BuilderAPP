import { NextResponse } from "next/server"
import { QueueService, type JobType } from "@/lib/services/queue.service"
import { processJob } from "@/lib/workers"

const JOB_TYPES: JobType[] = [
  "image.process",
  "billscan.process",
  "notification.send",
  "analytics.aggregate",
  "budget.check",
]

/**
 * GET /api/worker — Process pending jobs from all queues.
 * Called by Vercel Cron every minute.
 */
export async function GET() {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return NextResponse.json({ ok: true, message: "Redis not configured, skipping worker" })
  }

  let processed = 0
  const errors: string[] = []

  for (const jobType of JOB_TYPES) {
    // Process up to 5 jobs per queue per invocation
    for (let i = 0; i < 5; i++) {
      const job = await QueueService.dequeue(jobType)
      if (!job) break

      try {
        await processJob(job)
        processed++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push(`${job.type}: ${errorMsg}`)

        // Retry the job
        await QueueService.retry(job)
      }
    }
  }

  // Get queue lengths for monitoring
  const queueLengths = await QueueService.getAllQueueLengths()

  return NextResponse.json({
    ok: true,
    processed,
    errors,
    queueLengths,
  })
}

/**
 * POST /api/worker — Manually enqueue a job (for testing or admin use).
 */
export async function POST(request: Request) {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !JOB_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${JOB_TYPES.join(", ")}` },
        { status: 400 }
      )
    }

    const jobId = await QueueService.enqueue(type, data || {})

    return NextResponse.json({ ok: true, jobId })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
