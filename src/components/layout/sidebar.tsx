"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  Camera,
  Package,
  Receipt,
  Wallet,
  FileText,
  Brain,
  Bell,
  HardHat,
  ChevronLeft,
  LogOut,
  Settings,
  User,
  Map,
  History,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { signOut } from "@/lib/supabase/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "site_engineer", "client"] },
  { name: "Projects", href: "/projects", icon: FolderKanban, roles: ["owner", "site_engineer", "client"] },
  { name: "Photos", href: "/photos", icon: Camera, roles: ["owner", "site_engineer", "client"] },
  { name: "Materials", href: "/materials", icon: Package, roles: ["owner", "site_engineer"] },
  { name: "Expenses", href: "/expenses", icon: Receipt, roles: ["owner", "site_engineer", "client"] },
  { name: "Budget", href: "/budget", icon: Wallet, roles: ["owner"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["owner", "site_engineer", "client"] },
  { name: "Roadmap", href: "/roadmap", icon: Map, roles: ["owner", "client"] },
  { name: "AI Tools", href: "/ai-tools", icon: Brain, roles: ["owner"] },
  { name: "Team", href: "/team", icon: Users, roles: ["owner"] },
  { name: "Activity Log", href: "/activity", icon: History, roles: ["owner", "site_engineer"] },
  { name: "Notifications", href: "/notifications", icon: Bell, roles: ["owner", "site_engineer", "client"] },
  { name: "Profile", href: "/profile", icon: User, roles: ["owner", "site_engineer", "client"] },
]

const roleBadgeColors: Record<string, string> = {
  owner: "bg-orange-500/20 text-orange-400",
  site_engineer: "bg-blue-500/20 text-blue-400",
  client: "bg-green-500/20 text-green-400",
}

const roleLabels: Record<string, string> = {
  owner: "Builder",
  site_engineer: "Engineer",
  client: "Client",
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, sidebarOpen, toggleSidebar } = useStore()
  const role = currentUser?.role || "owner"

  const navigation = allNavigation.filter((item) => item.roles.includes(role))

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      // sign-out may fail but we still want to clear local state
    }
    useStore.getState().logout()
    window.location.href = "/sign-in"
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-5">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/icon-192.png" alt="BuildTrack" className="h-9 w-9 rounded-lg" />
              <div>
                <h1 className="text-lg font-bold">BuildTrack</h1>
                <p className="text-[10px] text-orange-400 -mt-1">Construction Management</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-slate-800"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          <Separator className="bg-slate-800" />

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-500/20 text-orange-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-orange-400" : "text-slate-400")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <Separator className="bg-slate-800" />

          <div className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md px-3 py-4 text-left text-slate-300 hover:bg-slate-800 hover:text-white outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-orange-500 text-white text-xs">
                    {currentUser?.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-sm font-medium truncate w-full">{currentUser?.full_name || "User"}</span>
                  <Badge variant="secondary" className={cn("text-[10px] mt-0.5 px-1.5 py-0", roleBadgeColors[role])}>
                    {roleLabels[role]}
                  </Badge>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href="/profile" />}
                >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/profile" />}
                >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  )
}
