"use client"

import { useState } from "react"
import { RoleGuard } from "@/components/role-guard"
import { RefreshButton } from "@/components/refresh-button"
import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Undo2 } from "lucide-react"
import {
  useDeletedProjects,
  useDeletedExpenses,
  useDeletedMaterials,
  useDeletedPhotos,
  useDeletedRoadmaps,
  useDeletedTeamMembers,
  restoreProject,
  restoreExpense,
  restoreMaterial,
  restorePhoto,
  restoreRoadmap,
  restoreTeamMember,
} from "@/lib/hooks/use-data"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"

export default function DeletedItemsPage() {
  const [activeTab, setActiveTab] = useState("projects")
  const [confirmRestore, setConfirmRestore] = useState<{ id: string; name: string; type: string } | null>(null)

  const { data: projects, isLoading: loadingProjects, error: errorProjects, refetch: refetchProjects } = useDeletedProjects()
  const { data: expenses, isLoading: loadingExpenses, error: errorExpenses, refetch: refetchExpenses } = useDeletedExpenses()
  const { data: materials, isLoading: loadingMaterials, error: errorMaterials, refetch: refetchMaterials } = useDeletedMaterials()
  const { data: photos, isLoading: loadingPhotos, error: errorPhotos, refetch: refetchPhotos } = useDeletedPhotos()
  const { data: roadmaps, isLoading: loadingRoadmaps, error: errorRoadmaps, refetch: refetchRoadmaps } = useDeletedRoadmaps()
  const { data: members, isLoading: loadingMembers, error: errorMembers, refetch: refetchMembers } = useDeletedTeamMembers()

  useRealtimeSync(["projects", "expenses", "materials", "site_photos", "roadmaps", "users"], () => {
    refetchProjects()
    refetchExpenses()
    refetchMaterials()
    refetchPhotos()
    refetchRoadmaps()
    refetchMembers()
  })

  async function handleRestore() {
    if (!confirmRestore) return
    try {
      switch (confirmRestore.type) {
        case "project": await restoreProject(confirmRestore.id); break
        case "expense": await restoreExpense(confirmRestore.id); break
        case "material": await restoreMaterial(confirmRestore.id); break
        case "photo": await restorePhoto(confirmRestore.id); break
        case "roadmap": await restoreRoadmap(confirmRestore.id); break
        case "team": await restoreTeamMember(confirmRestore.id); break
      }
      toast.success("Item restored successfully")
      setConfirmRestore(null)
      refetchProjects()
      refetchExpenses()
      refetchMaterials()
      refetchPhotos()
      refetchRoadmaps()
      refetchMembers()
    } catch (e: any) {
      toast.error(e.message || "Failed to restore")
    }
  }

  return (
    <RoleGuard allowedRoles={["owner"]}>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Deleted Items</h1>
            <p className="text-muted-foreground">Restore accidentally deleted data</p>
          </div>
          <RefreshButton
            onRefresh={() => {
              refetchProjects()
              refetchExpenses()
              refetchMaterials()
              refetchPhotos()
              refetchRoadmaps()
              refetchMembers()
            }}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="projects">Projects ({projects?.length || 0})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses?.length || 0})</TabsTrigger>
            <TabsTrigger value="materials">Materials ({materials?.length || 0})</TabsTrigger>
            <TabsTrigger value="photos">Photos ({photos?.length || 0})</TabsTrigger>
            <TabsTrigger value="roadmaps">Roadmaps ({roadmaps?.length || 0})</TabsTrigger>
            <TabsTrigger value="team">Team ({members?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            {loadingProjects ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : errorProjects ? (
              <ErrorState message="Failed to load deleted projects" />
            ) : !projects?.length ? (
              <EmptyState type="deleted" title="No deleted projects" description="Deleted projects will appear here" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.client_name}</TableCell>
                      <TableCell>{p.deleted_at ? new Date(p.deleted_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setConfirmRestore({ id: p.id, name: p.name, type: "project" })}>
                          <Undo2 className="mr-1 h-3 w-3" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="expenses">
            {loadingExpenses ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : errorExpenses ? (
              <ErrorState message="Failed to load deleted expenses" />
            ) : !expenses?.length ? (
              <EmptyState type="deleted" title="No deleted expenses" description="Deleted expenses will appear here" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.description}</TableCell>
                      <TableCell>₹{e.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                      <TableCell>{e.deleted_at ? new Date(e.deleted_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setConfirmRestore({ id: e.id, name: e.description, type: "expense" })}>
                          <Undo2 className="mr-1 h-3 w-3" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="materials">
            {loadingMaterials ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : errorMaterials ? (
              <ErrorState message="Failed to load deleted materials" />
            ) : !materials?.length ? (
              <EmptyState type="deleted" title="No deleted materials" description="Deleted materials will appear here" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                      <TableCell>{m.quantity_purchased} {m.unit}</TableCell>
                      <TableCell>{m.deleted_at ? new Date(m.deleted_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setConfirmRestore({ id: m.id, name: m.name, type: "material" })}>
                          <Undo2 className="mr-1 h-3 w-3" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="photos">
            {loadingPhotos ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : errorPhotos ? (
              <ErrorState message="Failed to load deleted photos" />
            ) : !photos?.length ? (
              <EmptyState type="deleted" title="No deleted photos" description="Deleted photos will appear here" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {photos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.category}</TableCell>
                      <TableCell>{p.notes || "-"}</TableCell>
                      <TableCell>{p.deleted_at ? new Date(p.deleted_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setConfirmRestore({ id: p.id, name: p.category, type: "photo" })}>
                          <Undo2 className="mr-1 h-3 w-3" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="roadmaps">
            {loadingRoadmaps ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : errorRoadmaps ? (
              <ErrorState message="Failed to load deleted roadmaps" />
            ) : !roadmaps?.length ? (
              <EmptyState type="deleted" title="No deleted roadmaps" description="Deleted roadmaps will appear here" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roadmaps.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.description || "-"}</TableCell>
                      <TableCell>{r.deleted_at ? new Date(r.deleted_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setConfirmRestore({ id: r.id, name: r.title, type: "roadmap" })}>
                          <Undo2 className="mr-1 h-3 w-3" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="team">
            {loadingMembers ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : errorMembers ? (
              <ErrorState message="Failed to load deleted team members" />
            ) : !members?.length ? (
              <EmptyState type="deleted" title="No deleted team members" description="Removed team members will appear here" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.full_name}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell><Badge variant="outline">{m.role}</Badge></TableCell>
                      <TableCell>{m.deleted_at ? new Date(m.deleted_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setConfirmRestore({ id: m.id, name: m.full_name, type: "team" })}>
                          <Undo2 className="mr-1 h-3 w-3" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!confirmRestore} onOpenChange={() => setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore {confirmRestore?.type}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to restore <strong>{confirmRestore?.name}</strong>? It will reappear in the main list.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(null)}>Cancel</Button>
            <Button onClick={handleRestore}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  )
}
