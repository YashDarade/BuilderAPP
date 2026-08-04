/**
 * Server-side Turnstile verification.
 * Call this from API routes to verify the captcha token.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // If no secret key configured, skip verification (dev mode)
  if (!secretKey) return true

  // If token is empty, fail
  if (!token) return false

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    })

    const result = await response.json()
    return result.success === true
  } catch {
    return false
  }
}
