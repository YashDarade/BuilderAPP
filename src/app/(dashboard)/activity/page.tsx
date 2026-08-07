"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  Package,
  Receipt,
  Camera,
  FileText,
  Map,
  ScanLine,
  Users,
  RefreshCw,
  Clock,
  Users2,
  ClipboardList,
  IndianRupee,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useActivityLogs } from "@/lib/hooks/use-data"
import { useStore } from "@/lib/store"
import { ErrorState } from "@/components/error-state"
import { TablePageSkeleton } from "@/components/page-skeletons"
import { EmptyState } from "@/components/empty-state"
import type { ActivityAction, EntityType } from "@/lib/types"

const actionColors: Record<ActivityAction, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const actionIcons: Record<ActivityAction, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
}

const entityIcons: Record<EntityType, typeof FolderKanban> = {
  project: FolderKanban,
  material: Package,
  expense: Receipt,
  photo: Camera,
  report: FileText,
  roadmap: Map,
  bill_scan: ScanLine,
  team: Users,
  vendor: Users2,
  purchase_order: ClipboardList,
  vendor_payment: IndianRupee,
}

const entityLabels: Record<EntityType, string> = {
  project: "Project",
  material: "Material",
  expense: "Expense",
  photo: "Photo",
  report: "Report",
  roadmap: "Roadmap",
  bill_scan: "Bill Scan",
  team: "Team",
  vendor: "Vendor",
  purchase_order: "Purchase Order",
  vendor_payment: "Vendor Payment",
}

export default function ActivityPage() {
  const { currentUser } = useStore()
  const { data: rawLogs, isLoading, error, refetch } = useActivityLogs(100)
  const logs = rawLogs ?? []
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = actionFilter === "all" || log.action === actionFilter
      const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter
      return matchesAction && matchesEntity
    })
  }, [logs, actionFilter, entityFilter])

  if (isLoading) {
    return <TablePageSkeleton columns={5} />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">Track all changes across your projects</p>
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">Track all changes across your projects</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={actionFilter} onValueChange={(v) => v && setActionFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Created</SelectItem>
            <SelectItem value="update">Updated</SelectItem>
            <SelectItem value="delete">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={(v) => v && setEntityFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
            <SelectItem value="material">Materials</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="photo">Photos</SelectItem>
            <SelectItem value="report">Reports</SelectItem>
            <SelectItem value="roadmap">Roadmaps</SelectItem>
            <SelectItem value="bill_scan">Bill Scans</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          type="default"
          title="No activity recorded"
          description="Actions like creating, editing, and deleting items will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => {
                  const ActionIcon = actionIcons[log.action]
                  const EntityIcon = entityIcons[log.entity_type]
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline" className={actionColors[log.action]}>
                          <ActionIcon className="mr-1 h-3 w-3" />
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {log.entity_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <EntityIcon className="h-3.5 w-3.5" />
                          <span className="text-sm">{entityLabels[log.entity_type]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.user_id === currentUser?.id ? "You" : "Team member"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
