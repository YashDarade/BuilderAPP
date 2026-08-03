"use client"

import { useStore } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { UserRole } from "@/lib/types"

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

const roleLabels: Record<UserRole, string> = {
  owner: "Builder",
  site_engineer: "Site Engineer",
  client: "Client",
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { currentUser } = useStore()

  if (!currentUser) return null

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You need the <strong>{allowedRoles.map((r) => roleLabels[r]).join(" or ")}</strong> role to access this page.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your current role: <strong>{roleLabels[currentUser.role]}</strong>
            </p>
            <Link href="/dashboard" className="mt-6">
              <Button variant="outline">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
