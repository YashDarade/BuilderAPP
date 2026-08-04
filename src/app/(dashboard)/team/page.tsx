"use client"

import { useState } from "react"
import { useTeamMembers } from "@/lib/hooks/use-data"
import { addMember, updateMemberRole, removeMember } from "@/lib/hooks/use-mutation"
import { useStore } from "@/lib/store"
import { RoleGuard } from "@/components/role-guard"
import { useRealtimeSync } from "@/lib/hooks/use-realtime"
import { Captcha } from "@/components/captcha"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { RefreshButton } from "@/components/refresh-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserPlus, MoreVertical, Shield, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { UserRole } from "@/lib/types"

const roleLabels: Record<string, string> = {
  owner: "Builder",
  site_engineer: "Site Engineer",
  client: "Client",
}

const roleBadgeColors: Record<string, string> = {
  owner: "bg-orange-500/20 text-orange-400",
  site_engineer: "bg-blue-500/20 text-blue-400",
  client: "bg-green-500/20 text-green-400",
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function TeamPage() {
  const { currentUser } = useStore()
  const { data: members, isLoading, error, refetch } = useTeamMembers()

  useRealtimeSync(["users"], refetch)

  const [showAdd, setShowAdd] = useState(false)
  const [showEditRole, setShowEditRole] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [addForm, setAddForm] = useState({ email: "", full_name: "", role: "site_engineer", captchaToken: "" })
  const [addLoading, setAddLoading] = useState(false)
  const [addResult, setAddResult] = useState<{ email: string; password: string } | null>(null)
  const [editRoleLoading, setEditRoleLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)

  // ---- ADD MEMBER ----
  const handleAdd = async () => {
    if (!addForm.email || !addForm.full_name || !currentUser?.org_id) return
    setAddLoading(true)
    try {
      const result = await addMember({
        email: addForm.email,
        full_name: addForm.full_name,
        role: addForm.role,
        org_id: currentUser.org_id,
        captchaToken: addForm.captchaToken,
      })
      setAddResult({
        email: addForm.email,
        password: result.tempPassword || "Sign up with this email",
      })
      setAddForm({ email: "", full_name: "", role: "site_engineer", captchaToken: "" })
      refetch()
    } catch (e: any) {
      toast.error(e.message || "Failed to add member")
    } finally {
      setAddLoading(false)
    }
  }

  // ---- EDIT ROLE ----
  const handleEditRole = async (newRole: string) => {
    if (!selectedMember) return
    setEditRoleLoading(true)
    try {
      await updateMemberRole(selectedMember.id, newRole)
      setShowEditRole(false)
      setSelectedMember(null)
      refetch()
    } catch (e: any) {
      toast.error(e.message || "Failed to update role")
    } finally {
      setEditRoleLoading(false)
    }
  }

  // ---- REMOVE MEMBER ----
  const handleRemove = async () => {
    if (!selectedMember) return
    setRemoveLoading(true)
    try {
      await removeMember(selectedMember.id)
      setShowRemove(false)
      setSelectedMember(null)
      refetch()
    } catch (e: any) {
      toast.error(e.message || "Failed to remove member")
    } finally {
      setRemoveLoading(false)
    }
  }

  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Members</h1>
            <p className="text-muted-foreground">
              Manage your organization&apos;s team
            </p>
          </div>
          <div className="flex gap-2">
            <RefreshButton onRefresh={refetch} />
            <Button onClick={() => { setAddResult(null); setShowAdd(true) }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        {error && <ErrorState message={error} onRetry={refetch} />}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : !members || members.length === 0 ? (
          <EmptyState
            type="team"
            title="No team members yet"
            description="Add your first team member to get started"
          />
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-orange-500/20 text-orange-500 text-sm font-medium">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.full_name}
                      {member.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={roleBadgeColors[member.role]}>
                    {roleLabels[member.role] || member.role}
                  </Badge>
                  {member.id !== currentUser?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground outline-none">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMember(member)
                            setShowEditRole(true)
                          }}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedMember(member)
                            setShowRemove(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- ADD MEMBER DIALOG ---- */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          {addResult ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Member added successfully!
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share these credentials with the team member:
                </p>
                <div className="mt-2 rounded-md bg-background p-3 font-mono text-sm">
                  <p><span className="text-muted-foreground">Email:</span> {addResult.email}</p>
                  <p><span className="text-muted-foreground">Password:</span> {addResult.password}</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => { setAddResult(null); setShowAdd(false) }}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Full Name</Label>
                <Input
                  id="member-name"
                  placeholder="Enter full name"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="name@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={addForm.role} onValueChange={(v) => { if (v) setAddForm({ ...addForm, role: v }) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site_engineer">Site Engineer</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Captcha onVerify={(token) => setAddForm({ ...addForm, captchaToken: token })} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={addLoading || !addForm.email || !addForm.full_name}>
                  {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Add Member
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- EDIT ROLE DIALOG ---- */}
      <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Change role for <span className="font-medium text-foreground">{selectedMember.full_name}</span>
              </p>
              <Select
                defaultValue={selectedMember.role}
                onValueChange={handleEditRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Builder (Owner)</SelectItem>
                  <SelectItem value="site_engineer">Site Engineer</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditRole(false)}>Cancel</Button>
                <Button onClick={() => handleEditRole(selectedMember.role)} disabled={editRoleLoading}>
                  {editRoleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- REMOVE MEMBER DIALOG ---- */}
      <Dialog open={showRemove} onOpenChange={setShowRemove}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove{" "}
                <span className="font-medium text-foreground">{selectedMember.full_name}</span>{" "}
                from your organization? This action cannot be undone.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRemove(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleRemove} disabled={removeLoading}>
                  {removeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Remove
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </RoleGuard>
  )
}
