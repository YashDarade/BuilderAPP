"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Photos", href: "/photos", icon: Camera },
  { name: "Materials", href: "/materials", icon: Package },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Budget", href: "/budget", icon: Wallet },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "AI Tools", href: "/ai-tools", icon: Brain },
  { name: "Notifications", href: "/notifications", icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { currentUser, sidebarOpen, toggleSidebar } = useStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-5">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">BuildTrack</h1>
                <p className="text-[10px] text-orange-400 -mt-1">AI-Powered Construction</p>
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

          {/* Navigation */}
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

          {/* User Profile */}
          <div className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md px-3 py-4 text-left text-slate-300 hover:bg-slate-800 hover:text-white outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-orange-500 text-white text-xs">
                    {currentUser?.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{currentUser?.full_name || "John Builder"}</span>
                  <span className="text-xs text-slate-400 capitalize">{currentUser?.role || "Admin"}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
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
