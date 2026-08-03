import { cn } from "@/lib/utils"
import { FolderOpen, Camera, FileText, Package, Receipt, Map, Bell, Building2, ScanLine, Brain, Users } from "lucide-react"

const icons = {
  projects: FolderOpen,
  photos: Camera,
  reports: FileText,
  materials: Package,
  expenses: Receipt,
  roadmap: Map,
  notifications: Bell,
  clientPortal: Building2,
  bills: ScanLine,
  aiTools: Brain,
  team: Users,
  default: FolderOpen,
}

interface EmptyStateProps {
  type?: keyof typeof icons
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ type = "default", title, description, action }: EmptyStateProps) {
  const Icon = icons[type] || icons.default

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
