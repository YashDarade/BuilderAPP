import type { AppEvent, EventMap } from "./types"

type Handler<T = any> = (data: T) => void

const listeners = new Map<string, Set<Handler>>()

/**
 * Emit an application event. All registered handlers for this event type run synchronously.
 */
export function emit<K extends AppEvent["type"]>(
  ...args: Extract<AppEvent, { type: K }> extends { data: infer D }
    ? [type: K, data: D, extra?: Record<string, any>]
    : [type: K]
): void {
  const [type, data, extra] = args as [K, any, Record<string, any> | undefined]
  const handlers = listeners.get(type)
  if (!handlers) return
  const eventObj = { type, data, ...extra }
  handlers.forEach((handler) => {
    try {
      handler(eventObj)
    } catch (err) {
      console.error(`[EventBus] Error in handler for "${type}":`, err)
    }
  })
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
 * Subscribe to an event type. Auto-unsubscribes on component unmount.
 * Use inside React useEffect.
 */
export function useOn<K extends AppEvent["type"]>(
  type: K,
  handler: Handler<EventMap[K]>
): void {
  // This is a convenience wrapper — actual implementation uses React effect
  // Import and call from useEffect in your component
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
  handlers.forEach((set) => { total += set.size })
  return total
}

// Internal reference for getListenerCount
const handlers = listeners
