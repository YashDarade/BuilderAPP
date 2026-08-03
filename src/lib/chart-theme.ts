import type { CSSProperties } from "react"

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  } as CSSProperties,
  labelStyle: { color: "hsl(var(--foreground))" } as CSSProperties,
  itemStyle: { color: "hsl(var(--foreground))" } as CSSProperties,
}

export const CHART_LEGEND_STYLE = {
  wrapperStyle: { color: "hsl(var(--foreground))" } as CSSProperties,
}
