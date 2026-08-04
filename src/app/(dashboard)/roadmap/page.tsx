"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { useRoadmaps, useProjects } from "@/lib/hooks/use-data"
import { createRoadmap, updateRoadmap } from "@/lib/hooks/use-mutation"
import { isAdmin } from "@/lib/supabase/auth"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { roadmapSchema, roadmapPhaseSchema } from "@/lib/validation-schemas"
import { ErrorState } from "@/components/error-state"
import { EmptyState } from "@/components/empty-state"
import { RefreshButton } from "@/components/refresh-button"
import { ProjectSelector } from "@/components/project-selector"
import {
  Plus,
  Map,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Roadmap, RoadmapPhase, RoadmapPhaseStatus } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"

const statusConfig: Record<RoadmapPhaseStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  not_started: { label: "Not Started", color: "bg-slate-500/20 text-slate-400", icon: Circle },
  in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  blocked: { label: "Blocked", color: "bg-red-500/20 text-red-400", icon: AlertTriangle },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function RoadmapPage() {
  const { currentUser } = useStore()
  const admin = isAdmin(currentUser)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const { data: rawRoadmaps, isLoading, error: roadmapsError, refetch: refetchRoadmaps } = useRoadmaps(selectedProject || undefined)
  const roadmaps = rawRoadmaps ?? []
  const { data: rawProjects, refetch: refetchProjects } = useProjects()
  const projects = rawProjects ?? []

  useRealtimeSync(["roadmaps", "projects"], () => {
    refetchRoadmaps()
    refetchProjects()
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editPhase, setEditPhase] = useState<{ roadmapId: string; phase: RoadmapPhase } | null>(null)
  const [saving, setSaving] = useState(false)

  function getOverallProgress(phases: RoadmapPhase[]) {
    if (phases.length === 0) return 0
    return Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length)
  }

  async function handleCreateRoadmap(data: { title: string; description: string; project_id: string }) {
    const result = roadmapSchema.safeParse(data)
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid input"
      toast.error(firstError)
      return
    }
    setSaving(true)
    try {
      await createRoadmap({
        project_id: result.data.project_id,
        title: result.data.title,
        description: result.data.description || "",
        phases: [],
        created_by: currentUser?.id || "",
      })
      setCreateOpen(false)
      refetchRoadmaps()
    } catch (err: any) {
      toast.error(err.message || "Failed to create roadmap")
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePhase(roadmapId: string, updatedPhase: RoadmapPhase) {
    const roadmap = roadmaps.find((r) => r.id === roadmapId)
    if (!roadmap) return
    const newPhases = roadmap.phases.map((p) => (p.id === updatedPhase.id ? updatedPhase : p))
    setSaving(true)
    try {
      await updateRoadmap(roadmapId, { phases: newPhases })
      setEditPhase(null)
      refetchRoadmaps()
    } catch (err: any) {
      toast.error(err.message || "Failed to update phase")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddPhase(roadmapId: string) {
    const roadmap = roadmaps.find((r) => r.id === roadmapId)
    if (!roadmap) return
    const newPhase: RoadmapPhase = {
      id: `phase-${uuidv4()}`,
      name: "New Phase",
      status: "not_started",
      progress: 0,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      notes: "",
    }
    const newPhases = [...roadmap.phases, newPhase]
    setSaving(true)
    try {
      await updateRoadmap(roadmapId, { phases: newPhases })
      refetchRoadmaps()
    } catch (err: any) {
      toast.error(err.message || "Failed to add phase")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePhase(roadmapId: string, phaseId: string) {
    const roadmap = roadmaps.find((r) => r.id === roadmapId)
    if (!roadmap) return
    const newPhases = roadmap.phases.filter((p) => p.id !== phaseId)
    setSaving(true)
    try {
      await updateRoadmap(roadmapId, { phases: newPhases })
      refetchRoadmaps()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete phase")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (roadmapsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Roadmap</h1>
          <p className="text-muted-foreground">Create and monitor project roadmaps</p>
        </div>
        <ErrorState message={roadmapsError} onRetry={refetchRoadmaps} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Roadmap</h1>
          <p className="text-muted-foreground">
            {admin ? "Create and monitor project roadmaps" : "View project roadmaps and progress"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={refetchRoadmaps} />
          <ProjectSelector value={selectedProject} onChange={setSelectedProject} />
          {admin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger
                render={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Roadmap
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Roadmap</DialogTitle>
                </DialogHeader>
                <CreateRoadmapForm projects={projects} onSubmit={handleCreateRoadmap} saving={saving} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {roadmaps.length === 0 ? (
        <EmptyState
          type="roadmap"
          title="No roadmaps yet"
          description={admin ? "Create a roadmap to track project phases and milestones." : "No roadmaps have been created for your projects yet."}
          action={admin ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Roadmap
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {roadmaps.map((roadmap) => {
            const project = projects.find((p) => p.id === roadmap.project_id)
            const overall = getOverallProgress(roadmap.phases)
            const expanded = expandedId === roadmap.id

            return (
              <Card key={roadmap.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : roadmap.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Map className="h-5 w-5 text-orange-500 shrink-0" />
                        <CardTitle className="text-lg">{roadmap.title}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">{project?.name || "Unknown Project"}</p>
                      {roadmap.description && (
                        <p className="text-sm text-muted-foreground mt-1">{roadmap.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{overall}%</p>
                        <p className="text-xs text-muted-foreground">Overall</p>
                      </div>
                      {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        overall >= 80 ? "bg-green-500" : overall >= 40 ? "bg-blue-500" : "bg-orange-500"
                      )}
                      style={{ width: `${overall}%` }}
                    />
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3 mt-4">
                      {roadmap.phases.map((phase, idx) => {
                        const config = statusConfig[phase.status]
                        const StatusIcon = config.icon
                        return (
                          <div
                            key={phase.id}
                            className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0 text-sm font-medium">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{phase.name}</span>
                                <Badge variant="secondary" className={cn("text-xs", config.color)}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {config.label}
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(phase.start_date)} — {formatDate(phase.end_date)}
                                </span>
                                <span>{phase.progress}%</span>
                              </div>
                              {phase.notes && (
                                <p className="mt-1 text-sm text-muted-foreground">{phase.notes}</p>
                              )}
                              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    phase.status === "completed" ? "bg-green-500" :
                                    phase.status === "blocked" ? "bg-red-500" :
                                    phase.status === "in_progress" ? "bg-blue-500" : "bg-slate-400"
                                  )}
                                  style={{ width: `${phase.progress}%` }}
                                />
                              </div>
                            </div>
                            {admin && (
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={saving}
                                  onClick={(e) => { e.stopPropagation(); setEditPhase({ roadmapId: roadmap.id, phase }) }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                  disabled={saving}
                                  onClick={(e) => { e.stopPropagation(); handleDeletePhase(roadmap.id, phase.id) }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {admin && (
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        disabled={saving}
                        onClick={() => handleAddPhase(roadmap.id)}
                      >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Add Phase
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {editPhase && (
        <Dialog open={!!editPhase} onOpenChange={() => setEditPhase(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Phase</DialogTitle>
            </DialogHeader>
            <EditPhaseForm
              phase={editPhase.phase}
              saving={saving}
              onSubmit={(updated) => handleUpdatePhase(editPhase.roadmapId, updated)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function CreateRoadmapForm({ projects, onSubmit, saving }: { projects: any[]; onSubmit: (data: any) => void; saving: boolean }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState("")

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Project</label>
        <Select value={projectId} onValueChange={(val) => setProjectId(val ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Roadmap title" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
      </div>
      <Button className="w-full" disabled={!title || !projectId || saving} onClick={() => onSubmit({ title, description, project_id: projectId })}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create Roadmap
      </Button>
    </div>
  )
}

function EditPhaseForm({ phase, onSubmit, saving }: { phase: RoadmapPhase; saving: boolean; onSubmit: (data: RoadmapPhase) => void }) {
  const [name, setName] = useState(phase.name)
  const [status, setStatus] = useState<RoadmapPhaseStatus>(phase.status)
  const [progress, setProgress] = useState(phase.progress)
  const [startDate, setStartDate] = useState(phase.start_date)
  const [endDate, setEndDate] = useState(phase.end_date)
  const [notes, setNotes] = useState(phase.notes)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Phase Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as RoadmapPhaseStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Progress ({progress}%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Phase notes" />
      </div>
      <Button className="w-full" disabled={saving} onClick={() => onSubmit({ ...phase, name, status, progress, start_date: startDate, end_date: endDate, notes })}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Changes
      </Button>
    </div>
  )
}
