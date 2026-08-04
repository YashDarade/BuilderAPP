"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"

interface RefreshButtonProps {
  onRefresh: () => void
  className?: string
}

export function RefreshButton({ onRefresh, className }: RefreshButtonProps) {
  const [spinning, setSpinning] = useState(false)

  function handleClick() {
    setSpinning(true)
    onRefresh()
    setTimeout(() => setSpinning(false), 800)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className={className}>
      <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
      <span className="ml-2 hidden sm:inline">Refresh</span>
    </Button>
  )
}
