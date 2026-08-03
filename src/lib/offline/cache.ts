import {
  getCachedData,
  putCachedData,
  getCacheTimestamp,
  setCacheTimestamp,
  type StoreName,
} from "./db"

const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true
  return navigator.onLine
}

export async function fetchWithCache<T extends { id: string }>(
  store: StoreName,
  fetcher: () => Promise<T[]>
): Promise<{ data: T[]; fromCache: boolean }> {
  const online = isOnline()

  if (online) {
    try {
      const data = await fetcher()
      // Write to cache silently
      putCachedData(store, data).catch(() => {})
      setCacheTimestamp(store, Date.now()).catch(() => {})
      return { data, fromCache: false }
    } catch {
      // Fall through to cache on error
    }
  }

  // Offline or fetch failed — try cache
  const cached = await getCachedData<T>(store)
  if (cached.length > 0) {
    return { data: cached, fromCache: true }
  }

  // No cache available — if online, rethrow; if offline, return empty
  if (online) throw new Error("Fetch failed and no cache available")
  return { data: [], fromCache: true }
}
