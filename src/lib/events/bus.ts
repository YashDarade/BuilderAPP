import type { AppEvent, EventMap } from "./types"

type Handler<T = any> = (data: T) => void

const listeners = new Map<string, Set<Handler>>()

const BROADCAST_CHANNEL_NAME = "buildtrack:events"
let broadcastChannel: BroadcastChannel | null = null

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      broadcastChannel.onmessage = (event: MessageEvent) => {
        if (event.data?.type && event.data?.source !== "self") {
          dispatchLocal(event.data.type, event.data)
        }
      }
    } catch {
      // BroadcastChannel not supported (e.g., old browsers)
    }
  }
  return broadcastChannel
}

function dispatchLocal(type: string, eventData: any): void {
  const handlers = listeners.get(type)
  if (!handlers) return
  handlers.forEach((handler) => {
    try {
      handler(eventData)
    } catch (err) {
      console.error(`[EventBus] Error in handler for "${type}":`, err)
    }
  })
}

/**
 * Emit an application event. Dispatches to local handlers + broadcasts to other tabs.
 */
export function emit<K extends AppEvent["type"]>(
  ...args: Extract<AppEvent, { type: K }> extends { data: infer D }
    ? [type: K, data: D, extra?: Record<string, any>]
    : [type: K]
): void {
  const [type, data, extra] = args as [K, any, Record<string, any> | undefined]
  const eventObj = { type, data, ...extra, source: "self" as const }

  // Dispatch locally
  dispatchLocal(type, eventObj)

  // Broadcast to other tabs
  const channel = getBroadcastChannel()
  if (channel) {
    try {
      channel.postMessage(eventObj)
    } catch {
      // Channel closed or not available
    }
  }

  // Persist to Redis (fire-and-forget, server handles storage)
  if (typeof window !== "undefined") {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data, extra }),
    }).catch(() => {})
  }
}

/**
 * Subscribe to an event type. Returns an unsubscribe function.
 */
export function on<K extends AppEvent["type"]>(
  type: K,
  handler: Handler<EventMap[K]>
): () => void {
  if (!listeners.has(type)) {
    listeners.set(type, new Set())
  }
  listeners.get(type)!.add(handler)

  return () => {
    listeners.get(type)?.delete(handler)
  }
}

/**
 * Remove all listeners for a given event type (or all types if no type given).
 */
export function clearListeners(type?: AppEvent["type"]): void {
  if (type) {
    listeners.delete(type)
  } else {
    listeners.clear()
  }
}

/**
 * Get the count of registered handlers for debugging.
 */
export function getListenerCount(type?: AppEvent["type"]): number {
  if (type) {
    return listeners.get(type)?.size ?? 0
  }
  let total = 0
  listeners.forEach((set) => {
    total += set.size
  })
  return total
}

/**
 * Replay recent events from Redis history. Called on page load.
 */
export async function replayRecentEvents(): Promise<void> {
  try {
    const res = await fetch("/api/events?replay=true")
    if (!res.ok) return
    const { events } = await res.json()
    if (!Array.isArray(events)) return
    for (const event of events) {
      dispatchLocal(event.type, { ...event, source: "replay" })
    }
  } catch {
    // Silently fail — events are best-effort
  }
}
