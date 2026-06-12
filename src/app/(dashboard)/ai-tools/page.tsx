"use client"

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Brain,
  ScanLine,
  Lightbulb,
  AlertTriangle,
  Upload,
  CheckCircle,
  Loader2,
  XCircle,
  Camera,
  Sparkles,
  Zap,
} from "lucide-react"
import type { BillScan, MaterialDetection, AIInsight } from "@/lib/types"
import {
  mockBillScans,
  mockProjects,
  mockAIInsights,
} from "@/lib/mock-data"

function formatCurrencyINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

const MOCK_DETECTIONS: MaterialDetection[] = [
  {
    id: "det-001",
    photo_id: "photo-001",
    object_type: "Cement Bags",
    count: 24,
    confidence_score: 0.96,
    created_at: new Date().toISOString(),
  },
  {
    id: "det-002",
    photo_id: "photo-001",
    object_type: "Bricks",
    count: 150,
    confidence_score: 0.92,
    created_at: new Date().toISOString(),
  },
  {
    id: "det-003",
    photo_id: "photo-001",
    object_type: "Steel Bundles",
    count: 8,
    confidence_score: 0.88,
    created_at: new Date().toISOString(),
  },
  {
    id: "det-004",
    photo_id: "photo-001",
    object_type: "Pipes",
    count: 12,
    confidence_score: 0.85,
    created_at: new Date().toISOString(),
  },
]

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: "insight-001",
    project_id: "",
    insight_type: "risk_assessment",
    title: "Budget Risk",
    description:
      "Based on current spending trajectory, the project may exceed budget by 8-12%. Material costs have increased faster than projected.",
    severity: "high",
    recommendations: [
      "Review and renegotiate vendor contracts for steel and cement",
      "Consider alternative material suppliers for non-critical items",
      "Implement stricter expense approval workflow",
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "insight-002",
    project_id: "",
    insight_type: "material_optimization",
    title: "Material Shortage Risk",
    description:
      "Current cement stock will last approximately 12 days at present consumption rate. Steel bars need reorder within a week.",
    severity: "medium",
    recommendations: [
      "Place immediate reorder for OPC 53 Cement (min 100 bags)",
      "Order TMT Steel Bars 12mm - minimum 50 pieces",
      "Verify delivery timelines with vendors before monsoon",
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "insight-003",
    project_id: "",
    insight_type: "progress_prediction",
    title: "Project Delay Risk",
    description:
      "Weather forecasts indicate heavy rainfall for the next 5 days. This may cause a 3-4 day delay in foundation and outdoor activities.",
    severity: "medium",
    recommendations: [
      "Accelerate indoor activities before rain starts",
      "Cover exposed concrete and stored materials",
      "Prepare site drainage to prevent waterlogging",
      "Reschedule critical path activities if possible",
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "insight-004",
    project_id: "",
    insight_type: "cost_analysis",
    title: "Cost Optimization Opportunity",
    description:
      "AI analysis suggests bulk procurement of finishing materials could save 6-8% compared to current purchase pattern.",
    severity: "low",
    recommendations: [
      "Consolidate pending orders for tiles and paint",
      "Negotiate bulk discount with Kajaria Ceramics",
      "Schedule deliveries to align with construction phases",
    ],
    created_at: new Date().toISOString(),
  },
]

function getConfidenceColor(score: number): string {
  if (score >= 0.9) return "text-green-600"
  if (score >= 0.8) return "text-yellow-600"
  return "text-red-600"
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "high":
      return "destructive"
    case "critical":
      return "destructive"
    case "medium":
      return "default"
    case "low":
      return "secondary"
    default:
      return "default"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "processing":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <ScanLine className="h-4 w-4 text-muted-foreground" />
  }
}

export default function AIToolsPage() {
  const [billScanStatus, setBillScanStatus] = useState<string>("idle")
  const [scannedBill, setScannedBill] = useState<BillScan | null>(null)
  const [detectionStatus, setDetectionStatus] = useState<string>("idle")
  const [selectedProject, setSelectedProject] = useState("")
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [createExpenseDialogOpen, setCreateExpenseDialogOpen] = useState(false)

  const handleBillUpload = useCallback(() => {
    setBillScanStatus("processing")
    setTimeout(() => {
      setBillScanStatus("completed")
      setScannedBill(mockBillScans[0])
    }, 2000)
  }, [])

  const handleDetectionUpload = useCallback(() => {
    setDetectionStatus("processing")
    setTimeout(() => {
      setDetectionStatus("completed")
    }, 2500)
  }, [])

  const handleAnalyze = useCallback(() => {
    if (!selectedProject) return
    setInsightsLoading(true)
    setInsights([])
    setTimeout(() => {
      const projectInsights = MOCK_INSIGHTS.map((insight) => ({
        ...insight,
        id: `insight-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        project_id: selectedProject,
      }))
      setInsights(projectInsights)
      setInsightsLoading(false)
    }, 2000)
  }, [selectedProject])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Tools</h1>
          <p className="text-muted-foreground">
            AI-powered tools for construction site management
          </p>
        </div>
      </div>

      {/* Bill Scanner Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-500/10 p-2">
              <ScanLine className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Bill Scanner</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload a bill image to extract vendor, amount, date, and GST details
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {billScanStatus === "idle" && (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleBillUpload}
            >
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload bill image</p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, PDF - Max 10MB
              </p>
            </div>
          )}

          {billScanStatus === "processing" && (
            <div className="flex flex-col items-center justify-center rounded-lg border p-8">
              <Loader2 className="mb-3 h-10 w-10 text-blue-500 animate-spin" />
              <p className="text-sm font-medium">Processing bill...</p>
              <p className="text-xs text-muted-foreground">
                Extracting text and analyzing data
              </p>
            </div>
          )}

          {billScanStatus === "completed" && scannedBill && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Bill scanned successfully</span>
                <Badge variant="outline" className="ml-auto">
                  Status: Verified
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Vendor Name</p>
                  <p className="text-sm font-medium">{scannedBill.vendor_name}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium">
                    {formatCurrencyINR(scannedBill.amount)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{scannedBill.date}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">GST Number</p>
                  <p className="text-sm font-medium">
                    {scannedBill.gst_number || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Confidence Score:</span>
                  <span
                    className={`text-sm font-bold ${getConfidenceColor(scannedBill.confidence_score)}`}
                  >
                    {(scannedBill.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(scannedBill.status)}
                  <span className="text-sm capitalize">{scannedBill.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setCreateExpenseDialogOpen(true)}>
                  Create Expense
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBillScanStatus("idle")
                    setScannedBill(null)
                  }}
                >
                  Scan Another
                </Button>
              </div>
            </div>
          )}

          {billScanStatus === "failed" && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8">
              <XCircle className="mb-3 h-10 w-10 text-red-500" />
              <p className="text-sm font-medium text-red-700">
                Bill scanning failed
              </p>
              <p className="text-xs text-red-600">
                Could not extract text. Please try a clearer image.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setBillScanStatus("idle")}
              >
                Try Again
              </Button>
            </div>
          )}

          {billScanStatus === "idle" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Scans</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBillScans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium">
                        {scan.vendor_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyINR(scan.amount)}
                      </TableCell>
                      <TableCell>{scan.date}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${getConfidenceColor(scan.confidence_score)}`}
                        >
                          {(scan.confidence_score * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(scan.status)}
                          <span className="text-sm capitalize">{scan.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material Counting Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-green-500/10 p-2">
              <Camera className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Material Counting</CardTitle>
              <p className="text-sm text-muted-foreground">
                Computer vision for automated material detection on-site
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Computer Vision integration coming soon. The
              detection results shown below are simulated for demonstration.
            </p>
          </div>

          {detectionStatus === "idle" && (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleDetectionUpload}
            >
              <Camera className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload site image</p>
              <p className="text-xs text-muted-foreground">
                AI will detect and count construction materials
              </p>
            </div>
          )}

          {detectionStatus === "processing" && (
            <div className="flex flex-col items-center justify-center rounded-lg border p-8">
              <Loader2 className="mb-3 h-10 w-10 text-green-500 animate-spin" />
              <p className="text-sm font-medium">Analyzing image...</p>
              <p className="text-xs text-muted-foreground">
                Detecting materials using computer vision
              </p>
            </div>
          )}

          {detectionStatus === "completed" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  Detection complete - {MOCK_DETECTIONS.length} material types found
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Object Type</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="w-[200px]">Confidence Bar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_DETECTIONS.map((det) => (
                    <TableRow key={det.id}>
                      <TableCell className="font-medium">
                        {det.object_type}
                      </TableCell>
                      <TableCell className="text-right text-lg font-bold">
                        {det.count}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${getConfidenceColor(det.confidence_score)}`}
                        >
                          {(det.confidence_score * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Progress
                          value={Math.round(det.confidence_score * 100)}
                        >
                          <ProgressLabel className="sr-only">
                            Confidence
                          </ProgressLabel>
                          <ProgressValue />
                        </Progress>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                variant="outline"
                onClick={() => setDetectionStatus("idle")}
              >
                Scan Another Image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Insights Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-purple-500/10 p-2">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Project Insights</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis for budget, material, and timeline risks
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={selectedProject}
              onValueChange={(v) => setSelectedProject(v ?? "")}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {mockProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAnalyze}
              disabled={!selectedProject || insightsLoading}
            >
              {insightsLoading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              Analyze
            </Button>
          </div>

          {insightsLoading && (
            <div className="flex flex-col items-center justify-center rounded-lg border p-12">
              <Brain className="mb-3 h-12 w-12 text-purple-500 animate-pulse" />
              <p className="text-sm font-medium">Analyzing project data...</p>
              <p className="text-xs text-muted-foreground">
                AI is processing budget, materials, and progress information
              </p>
            </div>
          )}

          {!insightsLoading && insights.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  AI Insights ({insights.length} findings)
                </span>
                <Badge variant="outline" className="ml-auto">
                  {mockProjects.find((p) => p.id === selectedProject)?.name}
                </Badge>
              </div>

              {insights.map((insight) => (
                <Card key={insight.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                        <h3 className="text-sm font-semibold">{insight.title}</h3>
                      </div>
                      <Badge variant={getSeverityBadge(insight.severity)}>
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Recommendations
                      </p>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!insightsLoading && insights.length === 0 && selectedProject && (
            <div className="flex flex-col items-center justify-center rounded-lg border p-12 text-center">
              <Brain className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Click &quot;Analyze&quot; to generate AI insights</p>
              <p className="text-xs text-muted-foreground">
                The AI will analyze project data and provide recommendations
              </p>
            </div>
          )}

          {!selectedProject && (
            <div className="flex flex-col items-center justify-center rounded-lg border p-12 text-center">
              <Brain className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Select a project to get started</p>
              <p className="text-xs text-muted-foreground">
                Choose a project from the dropdown above to analyze
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Expense Dialog */}
      <Dialog
        open={createExpenseDialogOpen}
        onOpenChange={setCreateExpenseDialogOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Expense from Scan</DialogTitle>
            <DialogDescription>
              An expense entry will be created from the scanned bill data.
            </DialogDescription>
          </DialogHeader>
          {scannedBill && (
            <div className="space-y-3 py-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium">{scannedBill.vendor_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {formatCurrencyINR(scannedBill.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{scannedBill.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST Number</span>
                <span className="font-medium">
                  {scannedBill.gst_number || "N/A"}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateExpenseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setCreateExpenseDialogOpen(false)
                setBillScanStatus("idle")
                setScannedBill(null)
              }}
            >
              Create Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
