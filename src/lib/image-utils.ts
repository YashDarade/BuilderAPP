/**
 * Client-side image compression using Canvas API.
 * Zero dependencies — uses browser-native Canvas.
 */

const MAX_DIMENSION = 2048
const JPEG_QUALITY = 0.85

/**
 * Compress an image file before upload.
 * Returns a new File with reduced dimensions and JPEG compression.
 * Handles HEIC conversion (browser renders HEIC as JPEG if supported).
 */
export async function compressImage(file: File, options?: {
  maxDimension?: number
  quality?: number
  outputFormat?: "jpeg" | "webp"
}): Promise<File> {
  const maxDim = options?.maxDimension ?? MAX_DIMENSION
  const quality = options?.quality ?? JPEG_QUALITY
  const outputFormat = options?.outputFormat ?? "jpeg"

  // Skip compression for small files (< 200KB) and non-images
  if (file.size < 200 * 1024 && file.type.startsWith("image/")) {
    return file
  }

  // Skip if already a small JPEG/WebP under max dimension
  if (
    file.size < 500 * 1024 &&
    (file.type === "image/jpeg" || file.type === "image/webp")
  ) {
    return file
  }

  const img = await loadImage(file)
  const { width, height } = calculateDimensions(img.width, img.height, maxDim)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) return file

  // Use high-quality downscaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, outputFormat, quality)
  if (!blob) return file

  const ext = outputFormat === "webp" ? "webp" : "jpg"
  const baseName = file.name.replace(/\.[^.]+$/, "")
  return new File([blob], `${baseName}.${ext}`, {
    type: `image/${outputFormat}`,
    lastModified: Date.now(),
  })
}

/**
 * Generate a thumbnail from a File (client-side).
 * Returns a Blob ready for upload.
 */
export async function generateThumbnail(
  file: File,
  size: number = 400
): Promise<Blob | null> {
  const img = await loadImage(file)
  const { width, height } = calculateDimensions(img.width, img.height, size)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, width, height)

  return canvasToBlob(canvas, "jpeg", 0.8)
}

/**
 * Extract EXIF-relevant info from a file.
 */
export async function getImageMetadata(file: File): Promise<{
  width: number
  height: number
  type: string
  size: number
}> {
  const img = await loadImage(file)
  return {
    width: img.width,
    height: img.height,
    type: file.type,
    size: file.size,
  }
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Failed to load image"))
    }
    img.src = URL.createObjectURL(file)
  })
}

function calculateDimensions(
  origW: number,
  origH: number,
  maxDim: number
): { width: number; height: number } {
  if (origW <= maxDim && origH <= maxDim) {
    return { width: origW, height: origH }
  }
  const ratio = Math.min(maxDim / origW, maxDim / origH)
  return {
    width: Math.round(origW * ratio),
    height: Math.round(origH * ratio),
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      `image/${format}`,
      quality
    )
  })
}
