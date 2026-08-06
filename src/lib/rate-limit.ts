import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/redis"

// ============================================================
// RATE LIMITERS — different limits for different actions
// ============================================================

/** Login: 5 attempts per 10 seconds per IP */
export const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10s"),
      analytics: true,
      prefix: "ratelimit:login",
    })
  : null

/** Sign-up: 3 attempts per minute per IP */
export const signupLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60s"),
      analytics: true,
      prefix: "ratelimit:signup",
    })
  : null

/** Team add: 10 requests per minute per user */
export const teamAddLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60s"),
      analytics: true,
      prefix: "ratelimit:team",
    })
  : null

/** General API: 60 requests per minute per IP */
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60s"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null

/** Upload: 20 uploads per minute per user */
export const uploadLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60s"),
      analytics: true,
      prefix: "ratelimit:upload",
    })
  : null

// ============================================================
// HELPER — extract IP from request
// ============================================================

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "127.0.0.1"
}

// ============================================================
// RATE LIMIT RESPONSE helper
// ============================================================

export function rateLimitResponse(remaining: number, reset: number): Response | null {
  if (remaining >= 0) return null

  const retryAfter = Math.ceil((reset - Date.now()) / 1000)
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      retryAfter: retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
      },
    }
  )
}
