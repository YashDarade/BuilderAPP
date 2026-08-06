/**
 * Client-side request deduplication + TTL cache.
 * Prevents redundant Supabase RPC calls when multiple hooks
 * request the same data within the TTL window.
 *
 * Production pattern used by React Query, SWR, etc.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

const DEFAULT_TTL = 30_000 // 30 seconds

/**
 * Deduped + cached fetcher.
 * If the same key is requested multiple times within TTL, returns cached data.
 * If a request is already in-flight, deduplicates by returning the same promise.
 */
export async function cachedFetcher<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Check cache
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data
  }

  // Deduplicate in-flight requests
  const existing = inflight.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  // Make the actual request
  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, timestamp: Date.now() })
      inflight.delete(key)
      return data
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, promise)
  return promise
}

/**
 * Invalidate a specific cache entry.
 * Called after mutations to bust the cache immediately.
 */
export function invalidateClientCache(keyPattern: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPattern)) {
      cache.delete(key)
    }
  }
}

/**
 * Clear the entire cache.
 */
export function clearClientCache(): void {
  cache.clear()
  inflight.clear()
}
