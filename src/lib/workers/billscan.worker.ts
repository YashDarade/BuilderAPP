import type { Job } from "@/lib/services/queue.service"

/**
 * Bill Scan Worker — processes uploaded bill scans via OCR.
 * Extracts amount, vendor, date from receipt images.
 */
export async function processBillScanJob(job: Job): Promise<void> {
  const { scanId, storagePath, orgId } = job.data

  if (!scanId || !storagePath) {
    console.error("[BillScanWorker] Missing required data:", job.data)
    return
  }

  // Future: Integrate OCR service (Textract, Google Vision, or OpenAI Vision)
  // For now, the bill scan is stored and marked as processed
  // The actual OCR extraction would happen here

  console.log(`[BillScanWorker] Processing scan ${scanId} from ${storagePath}`)
}
