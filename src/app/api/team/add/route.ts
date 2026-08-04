import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { teamAddLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute per IP
    if (teamAddLimiter) {
      const ip = getClientIp(request)
      const { success, limit, remaining, reset } = await teamAddLimiter.limit(ip)
      const blocked = rateLimitResponse(remaining, reset)
      if (!success && blocked) return blocked
    }

    const { email, full_name, role, org_id, captchaToken } = await request.json()

    // Verify CAPTCHA
    if (!await verifyTurnstile(captchaToken || "", getClientIp(request))) {
      return NextResponse.json({ error: "Invalid CAPTCHA" }, { status: 400 })
    }

    if (!email || !full_name || !role || !org_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { data: callerProfileRows } = await supabase.rpc("get_user_profile", {
      user_auth_id: user.id,
    })
    const callerProfile = Array.isArray(callerProfileRows) ? callerProfileRows[0] : callerProfileRows

    if (!callerProfile || callerProfile.role !== "owner" || callerProfile.org_id !== org_id) {
      return NextResponse.json({ error: "Only org owners can add team members" }, { status: 403 })
    }

    const tempPassword = "BuildTrack" + Math.random().toString(36).slice(2, 8) + "!"

    let authUserId: string | null = null
    try {
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name, role },
      })
      if (!createError && newAuthUser?.user) {
        authUserId = newAuthUser.user.id
      }
    } catch {
      // Admin API not available with anon key
    }

    const { data: profileRows, error: insertError } = await supabase.rpc("insert_team_member", {
      p_email: email,
      p_full_name: full_name,
      p_role: role,
      p_org_id: org_id,
      p_auth_id: authUserId,
    })

    const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows

    if (insertError || !profile) {
      return NextResponse.json({ error: insertError?.message || "Failed to create member" }, { status: 500 })
    }

    await supabase.rpc("insert_user_log", {
      p_org_id: org_id,
      p_user_id: profile.id,
      p_action: "create",
      p_entity_type: "user",
      p_entity_id: profile.id,
      p_entity_name: full_name,
      p_details: { role, email },
    })

    return NextResponse.json({
      data: profile,
      tempPassword: authUserId ? tempPassword : null,
      message: authUserId
        ? "Member added. Share these credentials: " + email + " / " + tempPassword
        : "Member profile created. They can sign up with this email to join.",
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
