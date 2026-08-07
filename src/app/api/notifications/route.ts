import { NextResponse, type NextRequest } from "next/server"
import { NotificationService } from "@/lib/services/notification.service"

/**
 * POST /api/notifications — Create a notification (server-side).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, org_id, title, message, type, entity_type, entity_id } = body

    if (!user_id || !org_id || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, org_id, title, message" },
        { status: 400 }
      )
    }

    await NotificationService.create({
      user_id,
      org_id,
      title,
      message,
      type,
      entity_type,
      entity_id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications — Cleanup old notifications.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    await NotificationService.cleanup(days)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
