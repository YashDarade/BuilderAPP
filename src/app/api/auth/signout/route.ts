import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  let supabaseResponse = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Parse cookies from the request header
          const cookieHeader = request.headers.get("cookie") || ""
          const cookies: { name: string; value: string }[] = []
          cookieHeader.split(";").forEach((c) => {
            const [name, ...rest] = c.trim().split("=")
            if (name) {
              cookies.push({ name, value: rest.join("=") })
            }
          })
          return cookies
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.signOut()

  return supabaseResponse
}
