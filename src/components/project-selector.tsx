"use client"

import { FolderKanban } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjects } from "@/lib/hooks/use-data"

interface ProjectSelectorProps {
  value: string | null
  onChange: (projectId: string | null) => void
  showAll?: boolean
  className?: string
}

export function ProjectSelector({ value, onChange, showAll = true, className }: ProjectSelectorProps) {
  const { data: rawProjects } = useProjects()
  const projects = rawProjects ?? []

  return (
    <Select
      value={value ?? "all"}
      onValueChange={(val) => onChange(val === "all" ? null : val)}
    >
      <SelectTrigger className={cn("w-[250px]", className)}>
        <div className="flex items-center gap-2 truncate">
          <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="All My Projects" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {showAll && (
          <SelectItem value="all">All My Projects</SelectItem>
        )}
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <div className="flex flex-col">
              <span>{project.name}</span>
              <span className="text-xs text-muted-foreground">{project.status} · {project.progress}%</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
