import { NextResponse, type NextRequest } from "next/server"
import { redis } from "@/lib/redis"

const EVENTS_KEY = "buildtrack:events:recent"
const EVENTS_TTL = 86400 // 24 hours
const MAX_EVENTS = 500

/**
 * POST /api/events — Receive events from client, store in Redis, publish to workers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, extra } = body

    if (!type) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 })
    }

    const event = {
      type,
      data,
      extra: extra || null,
      timestamp: Date.now(),
    }

    if (redis) {
      // Store in recent events list (newest first)
      await redis.lpush(EVENTS_KEY, JSON.stringify(event))
      // Trim to keep only last MAX_EVENTS
      await redis.ltrim(EVENTS_KEY, 0, MAX_EVENTS - 1)
      // Set expiry
      await redis.expire(EVENTS_KEY, EVENTS_TTL)

      // Publish to Redis pub/sub for workers
      await redis.publish("buildtrack:events", JSON.stringify(event))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: true }) // Always succeed — events are best-effort
  }
}

/**
 * GET /api/events?replay=true — Return recent events for replay on page load.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const replay = searchParams.get("replay")

  if (replay !== "true") {
    return NextResponse.json({ events: [] })
  }

  try {
    if (!redis) {
      return NextResponse.json({ events: [] })
    }

    const raw = await redis.lrange(EVENTS_KEY, 0, 49)
    const events = raw.map((item) => {
      try {
        return JSON.parse(item as string)
      } catch {
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ events: [] })
  }
}
