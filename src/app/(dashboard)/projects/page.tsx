"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useProjects, createProject, logActivity } from "@/lib/hooks/use-data"
import { useStore } from "@/lib/store"
import { projectSchema } from "@/lib/validation-schemas"
import { ErrorState } from "@/components/error-state"
import { ProjectsSkeleton } from "@/components/page-skeletons"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"
import type { ProjectStatus } from "@/lib/types"
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Wallet,
  ArrowUpDown,
  FolderKanban,
} from "lucide-react"

const STATUS_COLORS: Record<ProjectStatus, string> = {
  Planning: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  Foundation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Structure: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Brickwork: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Finishing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Completed: "bg-green-500/10 text-green-600 border-green-500/20",
}

const STATUS_OPTIONS: ProjectStatus[] = [
  "Planning",
  "Foundation",
  "Structure",
  "Brickwork",
  "Finishing",
  "Completed",
]

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "date", label: "Date" },
  { value: "budget", label: "Budget" },
  { value: "progress", label: "Progress" },
]

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function ProjectsPage() {
  const { currentUser } = useStore()
  const { data: rawProjects, isLoading, error, refetch } = useProjects()
  const projects = rawProjects ?? []
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [newProject, setNewProject] = useState({
    name: "",
    client_name: "",
    address: "",
    budget: "",
    start_date: "",
    expected_completion_date: "",
    status: "Planning" as ProjectStatus,
  })

  const filteredProjects = useMemo(() => {
    let list = [...projects]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.client_name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter)
    }

    switch (sortBy) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "date":
        list.sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        )
        break
      case "budget":
        list.sort((a, b) => b.budget - a.budget)
        break
      case "progress":
        list.sort((a, b) => b.progress - a.progress)
        break
    }

    return list
  }, [projects, search, statusFilter, sortBy])

  async function handleAddProject() {
    const result = projectSchema.safeParse({
      name: newProject.name,
      client_name: newProject.client_name,
      address: newProject.address,
      budget: newProject.budget,
      start_date: newProject.start_date,
      expected_completion_date: newProject.expected_completion_date,
      status: newProject.status,
    })
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        errors[field] = issue.message
      })
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    setSaving(true)
    try {
      const project = await createProject({
        name: result.data.name,
        client_name: result.data.client_name,
        client_id: "",
        engineer_id: null,
        org_id: currentUser?.org_id || "",
        address: result.data.address || "",
        start_date: result.data.start_date || "",
        expected_completion_date: result.data.expected_completion_date || "",
        budget: Number(result.data.budget) || 0,
        spent: 0,
        status: result.data.status,
        progress: 0,
        created_by: currentUser?.id || "",
      })
      logActivity({ action: "create", entity_type: "project", entity_id: project.id, entity_name: project.name })
      toast.success("Project created successfully")
      setDialogOpen(false)
      setNewProject({
        name: "",
        client_name: "",
        address: "",
        budget: "",
        start_date: "",
        expected_completion_date: "",
        status: "Planning",
      })
    } catch (e: any) {
      toast.error("Failed to create project: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <ProjectsSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage and track all your construction projects</p>
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track all your construction projects
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new construction project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sunset Villa Complex"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client">Client Name</Label>
                <Input
                  id="client"
                  placeholder="e.g. Suresh Mehta"
                  value={newProject.client_name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, client_name: e.target.value })
                  }
                  className={formErrors.client_name ? "border-destructive" : ""}
                />
                {formErrors.client_name && <p className="text-xs text-destructive">{formErrors.client_name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g. 42 Sunset Boulevard, Pune"
                  value={newProject.address}
                  onChange={(e) =>
                    setNewProject({ ...newProject, address: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget (INR)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g. 8500000"
                  value={newProject.budget}
                  onChange={(e) =>
                    setNewProject({ ...newProject, budget: e.target.value })
                  }
                  className={formErrors.budget ? "border-destructive" : ""}
                />
                {formErrors.budget && <p className="text-xs text-destructive">{formErrors.budget}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end">Expected Completion</Label>
                  <Input
                    id="end"
                    type="date"
                    value={newProject.expected_completion_date}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        expected_completion_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={newProject.status}
                  onValueChange={(val) =>
                    val &&
                    setNewProject({
                      ...newProject,
                      status: val as ProjectStatus,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProject} disabled={saving}>
                {saving ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, client, or address..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(val) => val && setSortBy(val)}>
          <SelectTrigger className="w-full sm:w-36">
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          type="projects"
          title="No projects found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">
                      {project.name}
                    </CardTitle>
                    <Badge
                      className={`shrink-0 border ${STATUS_COLORS[project.status]}`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.client_name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{project.address}</span>
                  </div>

                  <Progress value={project.progress}>
                    <ProgressLabel className="text-sm">Progress</ProgressLabel>
                    <ProgressValue />
                  </Progress>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">
                        {formatCurrencyINR(project.budget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-medium text-red-500">
                        {formatCurrencyINR(project.spent)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDate(project.start_date)} –{" "}
                      {formatDate(project.expected_completion_date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
