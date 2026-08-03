"use client"

import { useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { OfflineBanner } from "@/components/offline-banner"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster richColors position="top-right" />
      <OfflineBanner />
    </ThemeProvider>
  )
}
