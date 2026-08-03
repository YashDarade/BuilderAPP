"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Calendar, Building2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ProfileSkeleton } from "@/components/page-skeletons"

const roleBadgeColors: Record<string, string> = {
  owner: "bg-orange-100 text-orange-800 border-orange-200",
  site_engineer: "bg-green-100 text-green-800 border-green-200",
  client: "bg-purple-100 text-purple-800 border-purple-200",
}

const roleLabels: Record<string, string> = {
  owner: "Builder",
  site_engineer: "Site Engineer",
  client: "Client",
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    full_name: currentUser?.full_name ?? "",
    phone: currentUser?.phone ?? "",
  })

  useEffect(() => {
    if (currentUser?.org_id) {
      const supabase = createClient()
      supabase
        .from("organizations")
        .select("name")
        .eq("id", currentUser.org_id)
        .single()
        .then(({ data }: { data: { name: string } | null }) => {
          if (data) setOrgName(data.name)
        })
    }
  }, [currentUser?.org_id])

  const handleEdit = () => {
    if (currentUser) {
      setEditData({
        full_name: currentUser.full_name,
        phone: currentUser.phone,
      })
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (currentUser) {
      setEditData({
        full_name: currentUser.full_name,
        phone: currentUser.phone,
      })
    }
  }

  const handleSave = async () => {
    if (!currentUser) return

    if (!editData.full_name.trim()) {
      toast.error("Full name is required")
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({
          full_name: editData.full_name.trim(),
          phone: editData.phone.trim(),
        })
        .eq("id", currentUser.id)

      if (error) throw error

      setCurrentUser({
        ...currentUser,
        full_name: editData.full_name.trim(),
        phone: editData.phone.trim(),
      })

      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentUser) {
    return <ProfileSkeleton />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {!isEditing && (
              <Button variant="outline" onClick={handleEdit}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentUser.avatar_url ?? undefined} alt={currentUser.full_name} />
              <AvatarFallback className="text-lg bg-muted">
                {getInitials(currentUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{currentUser.full_name}</h2>
              <Badge
                variant="outline"
                className={`mt-1 ${roleBadgeColors[currentUser.role]}`}
              >
                {roleLabels[currentUser.role]}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="font-medium">{currentUser.email}</p>
            </div>

            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <p className="font-medium">{currentUser.full_name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <p className="font-medium">{currentUser.phone || "Not provided"}</p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Member Since
              </Label>
              <p className="font-medium">{formatDate(currentUser.created_at)}</p>
            </div>

            {orgName && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Organization
                </Label>
                <p className="font-medium">{orgName}</p>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
