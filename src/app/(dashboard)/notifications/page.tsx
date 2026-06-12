"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  AlertTriangle,
  FileText,
  CheckCircle,
  Bell,
  BellOff,
  Clock,
  RefreshCw,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Notification, NotificationType } from "@/lib/types"
import { mockNotifications } from "@/lib/mock-data"

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "material_low":
      return <Package className="h-4 w-4 text-orange-500" />
    case "budget_alert":
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case "report_generated":
      return <FileText className="h-4 w-4 text-blue-500" />
    case "progress_update":
    case "project_update":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "bill_scanned":
      return <FileText className="h-4 w-4 text-purple-500" />
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />
  }
}

function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case "material_low":
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Low Stock</Badge>
    case "budget_alert":
      return <Badge variant="destructive">Budget Alert</Badge>
    case "report_generated":
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Report</Badge>
    case "progress_update":
      return <Badge variant="outline" className="border-green-500 text-green-500">Progress</Badge>
    case "project_update":
      return <Badge variant="outline" className="border-green-500 text-green-500">Project</Badge>
    case "bill_scanned":
      return <Badge variant="outline" className="border-purple-500 text-purple-500">Bill</Badge>
    default:
      return <Badge variant="outline">Other</Badge>
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )

  const filtered = useMemo(() => {
    return notifications
      .filter((n) => {
        if (filter === "unread") return !n.is_read
        if (filter === "read") return n.is_read
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }, [notifications, filter])

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  function timeAgo(dateStr: string): string {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return "recently"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on project alerts, reports, and activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          <Bell className="mr-1.5 h-3.5 w-3.5" />
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === "read" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("read")}
        >
          <BellOff className="mr-1.5 h-3.5 w-3.5" />
          Read ({notifications.length - unreadCount})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filter === "all" && "All Notifications"}
            {filter === "unread" && "Unread Notifications"}
            {filter === "read" && "Read Notifications"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "No notifications to display"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.is_read
                      ? "border-l-4 border-l-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm ${
                          !notification.is_read
                            ? "font-semibold"
                            : "font-medium"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2">
                      {getNotificationBadge(notification.type)}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo(notification.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
