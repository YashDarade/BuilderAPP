"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Calendar,
  Camera,
  FileText,
  Building2,
  MapPin,
  Clock,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import {
  mockProjects,
  mockSitePhotos,
  mockProgressReports,
} from "@/lib/mock-data"
import type { Project, SitePhoto, ProgressReport } from "@/lib/types"

const CLIENT_ID = "user-004"

const statusColors: Record<string, string> = {
  Planning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Foundation:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Structure:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Brickwork:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Finishing:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
}

const categoryColors: Record<string, string> = {
  Foundation: "bg-amber-100 text-amber-800",
  Columns: "bg-blue-100 text-blue-800",
  Brickwork: "bg-orange-100 text-orange-800",
  Plumbing: "bg-cyan-100 text-cyan-800",
  Electrical: "bg-yellow-100 text-yellow-800",
  Roofing: "bg-red-100 text-red-800",
  Structure: "bg-purple-100 text-purple-800",
  Finishing: "bg-green-100 text-green-800",
}

export default function ClientPortalPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const clientProjects = mockProjects.filter(
    (p) => p.client_id === CLIENT_ID
  )

  const getProjectPhotos = (projectId: string): SitePhoto[] => {
    return mockSitePhotos.filter((photo) => photo.project_id === projectId)
  }

  const getProjectReports = (projectId: string): ProgressReport[] => {
    return mockProgressReports.filter(
      (report) => report.project_id === projectId
    )
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (selectedProject) {
    const photos = getProjectPhotos(selectedProject.id)
    const reports = getProjectReports(selectedProject.id)

    const milestones = [
      {
        title: "Project Started",
        date: selectedProject.start_date,
        completed: true,
      },
      {
        title: "Foundation Complete",
        date: null,
        completed:
          ["Structure", "Brickwork", "Finishing", "Completed"].includes(
            selectedProject.status
          ),
      },
      {
        title: "Structure Complete",
        date: null,
        completed: ["Brickwork", "Finishing", "Completed"].includes(
          selectedProject.status
        ),
      },
      {
        title: "Brickwork Complete",
        date: null,
        completed: ["Finishing", "Completed"].includes(
          selectedProject.status
        ),
      },
      {
        title: "Finishing Complete",
        date: null,
        completed: selectedProject.status === "Completed",
      },
      {
        title: "Project Handover",
        date: selectedProject.expected_completion_date,
        completed: false,
      },
    ]

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedProject(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
            <p className="text-muted-foreground">
              {selectedProject.address}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={statusColors[selectedProject.status]}
                    variant="secondary"
                  >
                    {selectedProject.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-lg font-semibold">
                    {selectedProject.progress}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Expected Completion
                  </p>
                  <p className="text-sm font-medium">
                    {format(
                      new Date(selectedProject.expected_completion_date),
                      "MMM dd, yyyy"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Overall Progress
                </span>
                <span className="font-medium">
                  {selectedProject.progress}%
                </span>
              </div>
              <Progress value={selectedProject.progress}>
                <span className="sr-only">
                  {selectedProject.progress}% complete
                </span>
              </Progress>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gallery">
              <Camera className="mr-2 h-4 w-4" />
              Photos ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Project Name
                      </p>
                      <p className="font-medium">{selectedProject.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium flex items-start gap-1">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        {selectedProject.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-medium">
                        {selectedProject.client_name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Start Date
                      </p>
                      <p className="font-medium">
                        {format(
                          new Date(selectedProject.start_date),
                          "MMM dd, yyyy"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Expected Completion
                      </p>
                      <p className="font-medium">
                        {format(
                          new Date(
                            selectedProject.expected_completion_date
                          ),
                          "MMM dd, yyyy"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Budget
                      </p>
                      <p className="font-medium">
                        {formatCurrency(selectedProject.budget)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>
                  Site photos captured during construction
                </CardDescription>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No photos available yet
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative overflow-hidden rounded-lg border"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={photo.url}
                            alt={photo.notes}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Badge
                            className={categoryColors[photo.category]}
                            variant="secondary"
                          >
                            {photo.category}
                          </Badge>
                          <p className="mt-1 text-xs line-clamp-2">
                            {photo.notes}
                          </p>
                          <p className="mt-1 text-xs text-white/70">
                            {format(new Date(photo.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress Reports</CardTitle>
                <CardDescription>
                  Daily progress reports from the site team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No reports available yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(
                                new Date(report.report_date),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {format(
                              new Date(report.created_at),
                              "hh:mm a"
                            )}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Work Completed
                            </p>
                            <p className="text-sm">{report.work_completed}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Materials Used
                            </p>
                            <p className="text-sm">{report.material_used}</p>
                          </div>
                          {report.issues && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Issues
                              </p>
                              <p className="text-sm text-amber-600 dark:text-amber-400">
                                {report.issues}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Tomorrow&apos;s Plan
                            </p>
                            <p className="text-sm">{report.tomorrow_plan}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Key milestones and their completion status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative ml-3 border-l-2 border-muted pl-8">
                  {milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="relative mb-8 last:mb-0"
                    >
                      <div
                        className={`absolute -left-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          milestone.completed
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted bg-background"
                        }`}
                      >
                        {milestone.completed && (
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            milestone.completed
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {milestone.title}
                        </p>
                        {milestone.date && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(milestone.date), "MMM dd, yyyy")}
                          </p>
                        )}
                        {!milestone.date && milestone.completed && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Completed
                          </p>
                        )}
                        {!milestone.date && !milestone.completed && (
                          <p className="text-sm text-muted-foreground">
                            Pending
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Projects</h1>
        <p className="text-muted-foreground">
          View and track the progress of your construction projects
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientProjects.map((project) => (
          <Card
            key={project.id}
            className="group cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setSelectedProject(project)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.address}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  className={statusColors[project.status]}
                  variant="secondary"
                >
                  {project.status}
                </Badge>
                <span className="text-sm font-medium">
                  {project.progress}%
                </span>
              </div>
              <Progress value={project.progress}>
                <span className="sr-only">{project.progress}% complete</span>
              </Progress>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expected completion
                </span>
                <span className="font-medium">
                  {format(
                    new Date(project.expected_completion_date),
                    "MMM yyyy"
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientProjects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No Projects Found</p>
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any projects assigned yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
