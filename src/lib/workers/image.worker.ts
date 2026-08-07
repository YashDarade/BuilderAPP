import type { Job } from "@/lib/services/queue.service"

/**
 * Image Worker — processes image thumbnails and compression.
 * Triggered by photo.uploaded events.
 */
export async function processImageJob(job: Job): Promise<void> {
  const { storagePath, photoId, orgId } = job.data

  if (!storagePath || !photoId) {
    console.error("[ImageWorker] Missing required data:", job.data)
    return
  }

  // Call the existing process-image API endpoint
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath, photoId, orgId }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Image processing failed: ${text}`)
  }
}
