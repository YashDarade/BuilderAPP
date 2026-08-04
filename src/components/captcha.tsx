"use client"

import { useCallback } from "react"
import Turnstile from "react-turnstile"

interface CaptchaProps {
  onVerify: (token: string) => void
  theme?: "light" | "dark" | "auto"
  className?: string
}

export function Captcha({ onVerify, theme = "auto", className }: CaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  // If no Turnstile key configured, render nothing (dev mode)
  if (!siteKey) return null

  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token)
    },
    [onVerify]
  )

  return (
    <div className={className}>
      <Turnstile
        sitekey={siteKey}
        theme={theme}
        onVerify={handleVerify}
        onError={() => onVerify("")}
        onExpire={() => onVerify("")}
      />
    </div>
  )
}
