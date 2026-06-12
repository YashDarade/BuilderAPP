"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { mockSitePhotos, mockProjects, mockUsers } from "@/lib/mock-data"
import type { PhotoCategory } from "@/lib/types"
import {
  Upload,
  Grid3X3,
  List,
  Camera,
  Search,
  Calendar,
  User,
  MapPin,
} from "lucide-react"

const PHOTO_CATEGORIES: PhotoCategory[] = [
  "Foundation",
  "Columns",
  "Brickwork",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Finishing",
  "Structure",
]

const CATEGORY_COLORS: Record<PhotoCategory, string> = {
  Foundation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Columns: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Brickwork: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Plumbing: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  Electrical: "bg-yellow-600/10 text-yellow-700 border-yellow-600/20",
  Roofing: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  Finishing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Structure: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatDateGroup(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function getUserName(userId: string): string {
  return mockUsers.find((u) => u.id === userId)?.full_name || "Unknown"
}

function getProjectName(projectId: string): string {
  return mockProjects.find((p) => p.id === projectId)?.name || "Unknown"
}

export default function PhotosPage() {
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [newPhoto, setNewPhoto] = useState({
    notes: "",
    category: "Foundation" as PhotoCategory,
    project_id: "",
  })

  const filteredPhotos = useMemo(() => {
    let photos = [...mockSitePhotos]

    if (search) {
      const q = search.toLowerCase()
      photos = photos.filter(
        (p) =>
          p.notes.toLowerCase().includes(q) ||
          getUserName(p.uploaded_by).toLowerCase().includes(q) ||
          getProjectName(p.project_id).toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== "all") {
      photos = photos.filter((p) => p.category === categoryFilter)
    }

    if (projectFilter !== "all") {
      photos = photos.filter((p) => p.project_id === projectFilter)
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const cutoff = new Date()
      switch (dateFilter) {
        case "today":
          cutoff.setHours(0, 0, 0, 0)
          break
        case "week":
          cutoff.setDate(now.getDate() - 7)
          break
        case "month":
          cutoff.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          cutoff.setMonth(now.getMonth() - 3)
          break
      }
      photos = photos.filter((p) => new Date(p.created_at) >= cutoff)
    }

    photos.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return photos
  }, [search, categoryFilter, projectFilter, dateFilter])

  const photosByDate = useMemo(() => {
    const groups: Record<string, typeof filteredPhotos> = {}
    filteredPhotos.forEach((photo) => {
      const dateKey = new Date(photo.created_at).toISOString().split("T")[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(photo)
    })
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    )
  }, [filteredPhotos])

  function handleUpload() {
    setUploadDialogOpen(false)
    setNewPhoto({ notes: "", category: "Foundation", project_id: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Site Photos</h1>
          <p className="text-muted-foreground">
            View and manage construction site photographs
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Site Photo</DialogTitle>
              <DialogDescription>
                Add a new site photo with details and category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Select Photo</Label>
                <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/30">
                  <div className="text-center">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click to browse or drag and drop
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Project</Label>
                <Select
                  value={newPhoto.project_id}
                  onValueChange={(val) =>
                    val && setNewPhoto({ ...newPhoto, project_id: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={newPhoto.category}
                  onValueChange={(val) =>
                    val &&
                    setNewPhoto({
                      ...newPhoto,
                      category: val as PhotoCategory,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHOTO_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Describe what this photo shows..."
                  value={newPhoto.notes}
                  onChange={(e) =>
                    setNewPhoto({ ...newPhoto, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpload}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search photos by notes, uploader, or project..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PHOTO_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={(val) => val && setProjectFilter(val)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {mockProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={(val) => val && setDateFilter(val)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("timeline")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Camera className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">No photos found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or upload a new photo
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border bg-card"
            >
              <img
                src={photo.thumbnail_url}
                alt={photo.notes}
                className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <Badge
                  className={`mb-1.5 border text-[10px] ${CATEGORY_COLORS[photo.category]}`}
                >
                  {photo.category}
                </Badge>
                <p className="text-xs text-white line-clamp-2 mb-1">
                  {photo.notes}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-white/70">
                  <User className="h-3 w-3" />
                  <span>{getUserName(photo.uploaded_by)}</span>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <Badge
                  className={`border text-[10px] ${CATEGORY_COLORS[photo.category]}`}
                >
                  {photo.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {photosByDate.map(([date, photos]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  {formatDateGroup(date)}
                </h3>
                <Badge variant="secondary">{photos.length} photos</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-lg border bg-card"
                  >
                    <img
                      src={photo.thumbnail_url}
                      alt={photo.notes}
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <Badge
                        className={`mb-1.5 border text-[10px] ${CATEGORY_COLORS[photo.category]}`}
                      >
                        {photo.category}
                      </Badge>
                      <p className="text-xs text-white line-clamp-2 mb-1">
                        {photo.notes}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-white/70">
                        <User className="h-3 w-3" />
                        <span>{getUserName(photo.uploaded_by)}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge
                        className={`border text-[10px] ${CATEGORY_COLORS[photo.category]}`}
                      >
                        {photo.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
