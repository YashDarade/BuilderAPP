import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Check if "Remember Me" was unchecked during sign-in
  const noPersist = request.cookies.get("bt_no_persist")?.value === "1"

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            // When "Remember Me" is unchecked, strip maxAge so cookies
            // become session cookies that clear on browser close
            const cookieOptions = noPersist
              ? { ...options, maxAge: undefined, expires: undefined }
              : options
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/sign-in") ||
    request.nextUrl.pathname.startsWith("/sign-up") ||
    request.nextUrl.pathname.startsWith("/forgot-password")

  const isApiRoute = request.nextUrl.pathname.startsWith("/api")

  if (isApiRoute) {
    return supabaseResponse
  }

  // If auth check itself fails, clear stale cookies and let through
  if (authError) {
    if (isAuthPage) {
      return supabaseResponse
    }
    // Clear stale cookies on the response
    const response = NextResponse.redirect(new URL("/sign-in", request.url))
    const allCookies = request.cookies.getAll()
    for (const cookie of allCookies) {
      if (cookie.name.startsWith("sb-") || cookie.name.includes("auth")) {
        response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" })
      }
    }
    return response
  }

  // Always allow auth pages — prevents redirect loops when session is stale
  if (isAuthPage) {
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
