import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const THUMBNAIL_SIZES = [
  { suffix: "thumb_lg", width: 400 },
  { suffix: "thumb_sm", width: 200 },
  { suffix: "thumb_xs", width: 80 },
]

export async function POST(request: NextRequest) {
  try {
    const { storagePath, bucket, entityId, entityType } = await request.json()

    if (!storagePath || !bucket || !entityId || !entityType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Download original from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(storagePath)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Failed to download image" }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const thumbnailUrls: Record<string, string> = {}

    // Generate thumbnails
    for (const { suffix, width } of THUMBNAIL_SIZES) {
      const thumbBuffer = await sharp(buffer)
        .resize(width, null, { withoutEnlargement: true, fit: "inside" })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer()

      // Upload thumbnail
      const folder = storagePath.substring(0, storagePath.lastIndexOf("/"))
      const baseName = storagePath.substring(storagePath.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "")
      const thumbPath = `${folder}/${baseName}_${suffix}.jpg`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(thumbPath, thumbBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(thumbPath)
        thumbnailUrls[suffix] = urlData.publicUrl
      }
    }

    // Update entity in database with thumbnail URLs
    const thumbnailUrl = thumbnailUrls["thumb_lg"] || thumbnailUrls["thumb_sm"] || ""

    if (entityType === "photo" && thumbnailUrl) {
      await supabase.rpc("update_photo_thumbnail", {
        p_id: entityId,
        p_thumbnail_url: thumbnailUrl,
      })
    }

    return NextResponse.json({
      thumbnails: thumbnailUrls,
      thumbnailUrl,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
