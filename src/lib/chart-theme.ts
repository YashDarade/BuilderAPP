import type { CSSProperties } from "react"

export const CHART_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#8b5cf6",
  "#eab308",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
]

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  } as CSSProperties,
  labelStyle: { color: "var(--foreground)" } as CSSProperties,
  itemStyle: { color: "var(--foreground)" } as CSSProperties,
}

export const CHART_LEGEND_STYLE = {
  wrapperStyle: { color: "var(--foreground)" } as CSSProperties,
}

export const AXIS_TICK_STYLE = { fontSize: 12, fill: "var(--muted-foreground)" }
