import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey)
}

export interface SearchResult {
  id: string
  type: "project" | "expense" | "material" | "photo"
  name: string
  description?: string
  relevance: number
}

/**
 * Search Service — unified full-text search across entities.
 * Uses PostgreSQL tsvector via Supabase RPC.
 */
export const SearchService = {
  /**
   * Search across all entities for an org.
   */
  async search(orgId: string, query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    const supabase = getSupabase()
    const results: SearchResult[] = []

    // Search projects
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, address")
      .eq("org_id", orgId)
      .ilike("name", `%${query}%`)
      .limit(5)

    if (projects) {
      results.push(
        ...projects.map((p) => ({
          id: p.id,
          type: "project" as const,
          name: p.name,
          description: p.address,
          relevance: 1,
        }))
      )
    }

    // Search expenses
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, description, vendor")
      .eq("org_id", orgId)
      .ilike("description", `%${query}%`)
      .limit(5)

    if (expenses) {
      results.push(
        ...expenses.map((e) => ({
          id: e.id,
          type: "expense" as const,
          name: e.description,
          description: e.vendor,
          relevance: 0.8,
        }))
      )
    }

    // Search materials
    const { data: materials } = await supabase
      .from("materials")
      .select("id, name, category")
      .eq("org_id", orgId)
      .ilike("name", `%${query}%`)
      .limit(5)

    if (materials) {
      results.push(
        ...materials.map((m) => ({
          id: m.id,
          type: "material" as const,
          name: m.name,
          description: m.category,
          relevance: 0.8,
        }))
      )
    }

    return results.sort((a, b) => b.relevance - a.relevance)
  },
}
