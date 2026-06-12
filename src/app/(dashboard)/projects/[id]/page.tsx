"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  mockProjects,
  mockExpenses,
  mockMaterials,
  mockSitePhotos,
  mockProgressReports,
} from "@/lib/mock-data"
import type { ProjectStatus } from "@/lib/types"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Wallet,
  User,
  Building2,
  Clock,
  CheckCircle2,
  Circle,
  Camera,
  Package,
  Receipt,
  FileText,
} from "lucide-react"

const STATUS_COLORS: Record<ProjectStatus, string> = {
  Planning: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  Foundation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Structure: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Brickwork: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Finishing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Completed: "bg-green-500/10 text-green-600 border-green-500/20",
}

const MILESTONES = [
  { status: "Planning", label: "Planning & Approvals" },
  { status: "Foundation", label: "Foundation Work" },
  { status: "Structure", label: "Structural Framework" },
  { status: "Brickwork", label: "Brickwork & Masonry" },
  { status: "Finishing", label: "Finishing & Interiors" },
  { status: "Completed", label: "Project Completed" },
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

function getStatusIndex(status: ProjectStatus): number {
  return MILESTONES.findIndex((m) => m.status === status)
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const project = mockProjects.find((p) => p.id === projectId)

  const projectExpenses = useMemo(
    () => mockExpenses.filter((e) => e.project_id === projectId),
    [projectId]
  )

  const projectMaterials = useMemo(
    () => mockMaterials.filter((m) => m.project_id === projectId),
    [projectId]
  )

  const projectPhotos = useMemo(
    () => mockSitePhotos.filter((p) => p.project_id === projectId),
    [projectId]
  )

  const projectReports = useMemo(
    () => mockProgressReports.filter((r) => r.project_id === projectId),
    [projectId]
  )

  const totalExpenses = projectExpenses.reduce((acc, e) => acc + e.amount, 0)

  const materialValue = projectMaterials.reduce(
    (acc, m) => acc + m.quantity_remaining * m.cost_per_unit,
    0
  )

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">Project not found</p>
            <p className="text-sm text-muted-foreground">
              The project you are looking for does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentMilestoneIndex = getStatusIndex(project.status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                {project.name}
              </h1>
              <Badge
                className={`border ${STATUS_COLORS[project.status]}`}
              >
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{project.client_name}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyINR(project.budget)}
                    </p>
                  </div>
                  <div className="rounded-full bg-green-500/10 p-3">
                    <Wallet className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="text-2xl font-bold text-red-500">
                      {formatCurrencyINR(project.spent)}
                    </p>
                  </div>
                  <div className="rounded-full bg-red-500/10 p-3">
                    <Receipt className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyINR(project.budget - project.spent)}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <Wallet className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Material Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyINR(materialValue)}
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <Package className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={project.progress}>
                <ProgressLabel className="text-sm">Completion</ProgressLabel>
                <ProgressValue />
              </Progress>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium">{project.client_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium">{project.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {formatDate(project.start_date)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Expected Completion:
                  </span>
                  <span className="font-medium">
                    {formatDate(project.expected_completion_date)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Budget</span>
                  <span className="font-medium">
                    {formatCurrencyINR(project.budget)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Expenses</span>
                  <span className="font-medium text-red-500">
                    {formatCurrencyINR(totalExpenses)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Used</span>
                  <span className="font-medium">
                    {((project.spent / project.budget) * 100).toFixed(1)}%
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Materials</span>
                  <span className="font-medium">
                    {projectMaterials.length} items
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Site Photos</span>
                  <span className="font-medium">{projectPhotos.length}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reports</span>
                  <span className="font-medium">{projectReports.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-8">
                  {MILESTONES.map((milestone, index) => {
                    const isCompleted = index < currentMilestoneIndex
                    const isCurrent = index === currentMilestoneIndex
                    const isFuture = index > currentMilestoneIndex

                    return (
                      <div
                        key={milestone.status}
                        className="relative flex items-start gap-4"
                      >
                        <div
                          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                            isCompleted
                              ? "border-green-500 bg-green-500/10"
                              : isCurrent
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-border bg-background"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : isCurrent ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p
                            className={`text-sm font-medium ${
                              isFuture
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {milestone.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isCompleted
                              ? "Completed"
                              : isCurrent
                              ? `In Progress — ${project.progress}%`
                              : "Pending"}
                          </p>
                        </div>
                        {isCompleted && (
                          <Badge className="border bg-green-500/10 text-green-600 border-green-500/20">
                            Done
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge className="border bg-blue-500/10 text-blue-600 border-blue-500/20">
                            Active
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Site Photos</CardTitle>
                <Badge variant="secondary">{projectPhotos.length} photos</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {projectPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Camera className="mb-4 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No photos uploaded yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {projectPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-lg border"
                    >
                      <img
                        src={photo.thumbnail_url}
                        alt={photo.notes}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Badge className="mb-1 border bg-background/90 text-foreground border-border text-[10px]">
                          {photo.category}
                        </Badge>
                        <p className="text-[10px] text-white line-clamp-2">
                          {photo.notes}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Materials</CardTitle>
                <Badge variant="secondary">
                  {projectMaterials.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {projectMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package className="mb-4 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No materials tracked yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{material.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {material.vendor} · {material.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Used</p>
                          <p className="font-medium">
                            {material.quantity_used} {material.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">
                            Remaining
                          </p>
                          <p
                            className={`font-medium ${
                              material.quantity_remaining <= material.reorder_level
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {material.quantity_remaining} {material.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Cost</p>
                          <p className="font-medium">
                            {formatCurrencyINR(material.total_cost)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Expenses</CardTitle>
                <Badge variant="secondary">
                  {projectExpenses.length} entries
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {projectExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Receipt className="mb-4 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No expenses recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectExpenses
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {expense.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expense.category} · {expense.vendor} ·{" "}
                            {formatDate(expense.date)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-red-500 shrink-0 ml-4">
                          -{formatCurrencyINR(expense.amount)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Progress Reports</CardTitle>
                <Badge variant="secondary">
                  {projectReports.length} reports
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {projectReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="mb-4 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No reports submitted yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectReports
                    .sort(
                      (a, b) =>
                        new Date(b.report_date).getTime() -
                        new Date(a.report_date).getTime()
                    )
                    .map((report) => (
                      <div
                        key={report.id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {formatDate(report.report_date)}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Work Completed
                            </p>
                            <p className="text-sm">{report.work_completed}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Materials Used
                            </p>
                            <p className="text-sm">{report.material_used}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Issues
                            </p>
                            <p className="text-sm">{report.issues}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Delays
                            </p>
                            <p className="text-sm">{report.delays}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Tomorrow&apos;s Plan
                          </p>
                          <p className="text-sm">{report.tomorrow_plan}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
