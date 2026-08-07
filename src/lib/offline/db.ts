import { openDB, type IDBPDatabase } from "idb"

const DB_NAME = "buildtrack-cache"
const DB_VERSION = 1

const STORES = [
  "projects",
  "expenses",
  "materials",
  "site_photos",
  "progress_reports",
  "notifications",
  "roadmaps",
  "budget_alerts",
  "activity_logs",
  "users",
  "vendors",
  "purchase_orders",
  "vendor_payments",
] as const

type StoreName = (typeof STORES)[number]

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id" })
          }
        }
      },
    })
  }
  return dbPromise
}

export async function getCachedData<T>(store: StoreName): Promise<T[]> {
  try {
    const db = await getDB()
    return await db.getAll(store)
  } catch {
    return []
  }
}

export async function getCacheTimestamp(store: StoreName): Promise<number | null> {
  try {
    const db = await getDB()
    const meta = await db.get("meta" as StoreName, `lastSync:${store}`)
    return meta?.value ?? null
  } catch {
    return null
  }
}

export async function setCacheTimestamp(store: StoreName, ts: number) {
  try {
    const db = await getDB()
    await db.put("meta" as StoreName, { id: `lastSync:${store}`, value: ts })
  } catch {
    // silent
  }
}

export async function putCachedData<T extends { id: string }>(store: StoreName, data: T[]) {
  try {
    const db = await getDB()
    const tx = db.transaction(store, "readwrite")
    await tx.store.clear()
    for (const item of data) {
      await tx.store.put(item)
    }
    await tx.done
  } catch {
    // silent
  }
}

export async function getCachedItem<T>(store: StoreName, id: string): Promise<T | undefined> {
  try {
    const db = await getDB()
    return await db.get(store, id)
  } catch {
    return undefined
  }
}

export { STORES }
export type { StoreName }
