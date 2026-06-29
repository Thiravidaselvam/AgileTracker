"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { Header } from "@/components/layout/header"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronDown, ChevronRight, CheckCircle2, Circle,
  Pencil, FileText, AlertTriangle, Building2,
  CalendarDays, User, Briefcase, Layers,
  Upload, Download, BookOpen, X,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

type ErpTask = {
  id: string; section: string; taskName: string; taskType: string
  status: string; owner: string | null; dueDate: string | null; notes: string | null; order: number
}
type ErpPhase = {
  id: string; phaseNumber: number; phaseName: string; status: string
  startDate: string | null; endDate: string | null; tasks: ErpTask[]
}
type ErpDocument = {
  id: string; docNumber: number; category: string; title: string
  preparedBy: string | null; status: string; notes: string | null
  fileName: string | null; fileSize: number | null; uploadedAt: string | null
}
type ErpRisk = {
  id: string; riskNumber: number; description: string; probability: string
  impact: string; mitigation: string | null; status: string
}
type ErpProject = {
  id: string; projectName: string; clientName: string; erpSoftware: string
  partner: string; startDate: string | null; goLiveDate: string | null
  pm: string | null; clientPoc: string | null; notes: string | null
  phases: ErpPhase[]; documents: ErpDocument[]; risks: ErpRisk[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function phasePct(phase: ErpPhase) {
  const total = phase.tasks.length
  if (total === 0) return 0
  return Math.round((phase.tasks.filter((t) => t.status === "Done").length / total) * 100)
}

function phaseColor(pct: number) {
  if (pct === 100) return { ring: "ring-green-500", bg: "bg-green-500", text: "text-green-700", light: "bg-green-50" }
  if (pct > 0)     return { ring: "ring-blue-500",  bg: "bg-blue-500",  text: "text-blue-700",  light: "bg-blue-50"  }
  return               { ring: "ring-gray-300",  bg: "bg-gray-300",  text: "text-gray-500",  light: "bg-gray-50"  }
}

const TYPE_BADGE: Record<string, string> = {
  activity:    "bg-blue-100 text-blue-700",
  deliverable: "bg-purple-100 text-purple-700",
  checklist:   "bg-amber-100 text-amber-700",
  milestone:   "bg-rose-100 text-rose-700",
}
const TYPE_LABEL: Record<string, string> = {
  activity: "A", deliverable: "D", checklist: "C", milestone: "M",
}

const DOC_STATUS_CYCLE: Record<string, string> = {
  "Pending":     "In Progress",
  "In Progress": "Done",
  "Done":        "Pending",
}
const DOC_STATUS_COLORS: Record<string, string> = {
  "Pending":     "bg-gray-100 text-gray-500",
  "In Progress": "bg-blue-100 text-blue-700",
  "Done":        "bg-green-100 text-green-700",
  "Skipped":     "bg-yellow-100 text-yellow-700",
}

const RISK_STATUS_COLORS: Record<string, string> = {
  "Open":      "bg-red-100 text-red-700",
  "Mitigated": "bg-amber-100 text-amber-700",
  "Closed":    "bg-green-100 text-green-700",
}
const PROB_COLORS: Record<string, string> = {
  High: "text-red-600 font-semibold", Medium: "text-amber-600 font-semibold", Low: "text-green-600 font-semibold",
}

function groupBySection(tasks: ErpTask[]): Record<string, ErpTask[]> {
  const out: Record<string, ErpTask[]> = {}
  for (const t of tasks) {
    if (!out[t.section]) out[t.section] = []
    out[t.section].push(t)
  }
  return out
}

function fmtDate(s: string | null) {
  if (!s) return "—"
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionAccordion({
  section, tasks, onToggle,
}: { section: string; tasks: ErpTask[]; onToggle: (id: string, newStatus: string) => void }) {
  const [open, setOpen] = useState(true)
  const done  = tasks.filter((t) => t.status === "Done").length
  const total = tasks.length

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-700">{section}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${done === total ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
          {done}/{total}
        </span>
      </button>

      {open && (
        <div className="divide-y divide-gray-50">
          {tasks.map((task) => {
            const isDone = task.status === "Done"
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => onToggle(task.id, isDone ? "Pending" : "Done")}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <Circle className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                  }
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 mt-0.5 ${TYPE_BADGE[task.taskType] ?? "bg-gray-100 text-gray-500"}`}>
                  {TYPE_LABEL[task.taskType] ?? "?"}
                </span>
                <span className={`text-sm leading-relaxed flex-1 ${isDone ? "line-through text-gray-400" : "text-gray-700"}`}>
                  {task.taskName}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  projectName: "", clientName: "", erpSoftware: "", partner: "",
  startDate: "", goLiveDate: "", pm: "", clientPoc: "", notes: "",
}

export default function ErpTrackerPage() {
  const [project, setProject]       = useState<ErpProject | null>(null)
  const [loading, setLoading]       = useState(true)
  const [selectedPhase, setSelected] = useState(1)
  const [editOpen, setEditOpen]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/erp-tracker")
    if (res.ok) {
      const data: ErpProject = await res.json()
      setProject(data)
      // auto-select first in-progress phase
      const inProg = data.phases.find((p) => phasePct(p) > 0 && phasePct(p) < 100)
      if (inProg) setSelected(inProg.phaseNumber)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openEdit() {
    if (!project) return
    setForm({
      projectName: project.projectName,
      clientName:  project.clientName,
      erpSoftware: project.erpSoftware,
      partner:     project.partner,
      startDate:   project.startDate  ? project.startDate.split("T")[0]  : "",
      goLiveDate:  project.goLiveDate ? project.goLiveDate.split("T")[0] : "",
      pm:          project.pm         ?? "",
      clientPoc:   project.clientPoc  ?? "",
      notes:       project.notes      ?? "",
    })
    setEditOpen(true)
  }

  async function saveProject() {
    setSaving(true)
    const res = await fetch("/api/erp-tracker", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) { setEditOpen(false); load() }
  }

  async function toggleTask(taskId: string, newStatus: string) {
    if (!project) return
    // optimistic update
    setProject((p) => p ? {
      ...p,
      phases: p.phases.map((ph) => ({
        ...ph,
        tasks: ph.tasks.map((t) => t.id === taskId ? { ...t, status: newStatus } : t),
      })),
    } : p)
    await fetch(`/api/erp-tracker/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  async function cycleDocStatus(docId: string, currentStatus: string) {
    const nextStatus = DOC_STATUS_CYCLE[currentStatus] ?? "Pending"
    setProject((p) => p ? {
      ...p,
      documents: p.documents.map((d) => d.id === docId ? { ...d, status: nextStatus } : d),
    } : p)
    await fetch(`/api/erp-tracker/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
  }

  async function cycleRiskStatus(riskId: string, currentStatus: string) {
    const cycle: Record<string, string> = { Open: "Mitigated", Mitigated: "Closed", Closed: "Open" }
    const next = cycle[currentStatus] ?? "Open"
    setProject((p) => p ? {
      ...p,
      risks: p.risks.map((r) => r.id === riskId ? { ...r, status: next } : r),
    } : p)
    await fetch(`/api/erp-tracker/risks/${riskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
  }

  function triggerUpload(docId: string) {
    setUploadingDocId(docId)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadingDocId) return
    e.target.value = ""
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch(`/api/erp-tracker/documents/${uploadingDocId}`, {
      method: "POST",
      body: fd,
    })
    if (res.ok) {
      const data = await res.json()
      setProject((p) => p ? {
        ...p,
        documents: p.documents.map((d) =>
          d.id === uploadingDocId
            ? { ...d, fileName: data.fileName, fileSize: data.fileSize, uploadedAt: data.uploadedAt }
            : d
        ),
      } : p)
    }
    setUploading(false)
    setUploadingDocId(null)
  }

  async function removeUpload(docId: string) {
    const res = await fetch(`/api/erp-tracker/documents/${docId}`, { method: "DELETE" })
    if (res.ok) {
      setProject((p) => p ? {
        ...p,
        documents: p.documents.map((d) =>
          d.id === docId ? { ...d, fileName: null, fileSize: null, uploadedAt: null } : d
        ),
      } : p)
    }
  }

  function fmtFileSize(bytes: number | null) {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── computed ──────────────────────────────────────────────────────────────
  const allTasks    = project?.phases.flatMap((p) => p.tasks) ?? []
  const totalTasks  = allTasks.length
  const doneTasks   = allTasks.filter((t) => t.status === "Done").length
  const overallPct  = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const totalDocs   = project?.documents.length ?? 0
  const doneDocs    = project?.documents.filter((d) => d.status === "Done").length ?? 0

  const totalRisks  = project?.risks.length ?? 0
  const openRisks   = project?.risks.filter((r) => r.status === "Open").length ?? 0

  const activePhase = project?.phases.find((p) => p.phaseNumber === selectedPhase)

  const docsByCategory = project?.documents.reduce<Record<string, ErpDocument[]>>((acc, d) => {
    if (!acc[d.category]) acc[d.category] = []
    acc[d.category].push(d)
    return acc
  }, {}) ?? {}

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col h-full">
      <Header title="ERP Implementation Tracker" />
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )

  if (!project) return null

  return (
    <div className="flex flex-col h-full">
      <Header title="ERP Implementation Tracker" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── Project Overview Banner ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{project.projectName}</h2>
                <p className="text-sm text-gray-500">{project.partner}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={openEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Project
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            {[
              { icon: Building2,    label: "Client",     value: project.clientName  },
              { icon: Layers,       label: "ERP System", value: project.erpSoftware },
              { icon: User,         label: "PM",         value: project.pm ?? "—"   },
              { icon: Briefcase,    label: "Client POC", value: project.clientPoc ?? "—" },
              { icon: CalendarDays, label: "Go-Live",    value: fmtDate(project.goLiveDate) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
                  <Icon className="w-3 h-3" /> {label}
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Overall Progress ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Overall Implementation Progress</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {doneTasks}/{totalTasks} tasks · {doneDocs}/{totalDocs} documents · {openRisks} open risks
              </p>
            </div>
            <span className="text-2xl font-bold text-gray-900">{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-2.5" />

          {/* Phase mini stats */}
          <div className="grid grid-cols-7 gap-2 mt-4">
            {project.phases.map((ph) => {
              const pct = phasePct(ph)
              const col = phaseColor(pct)
              return (
                <div key={ph.id} className="text-center">
                  <div className="text-[10px] text-gray-400 mb-1">P{ph.phaseNumber}</div>
                  <div className={`h-1.5 rounded-full ${col.bg} mx-auto`} style={{ width: "100%" }} />
                  <div className={`text-[10px] mt-1 font-medium ${col.text}`}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="phases">
          <TabsList className="grid grid-cols-3 w-full max-w-md bg-gray-100">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="documents">
              Documents <span className="ml-1 text-[10px] bg-white text-gray-500 px-1.5 py-0.5 rounded-full">{doneDocs}/{totalDocs}</span>
            </TabsTrigger>
            <TabsTrigger value="risks">
              Risks <span className="ml-1 text-[10px] bg-white text-gray-500 px-1.5 py-0.5 rounded-full">{openRisks} open</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Phases Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="phases" className="space-y-4 mt-4">
            {/* Phase Selector */}
            <div className="flex flex-wrap gap-2">
              {project.phases.map((ph) => {
                const pct = phasePct(ph)
                const col = phaseColor(pct)
                const active = ph.phaseNumber === selectedPhase
                return (
                  <button
                    key={ph.id}
                    onClick={() => setSelected(ph.phaseNumber)}
                    className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[110px] ${
                      active
                        ? `${col.ring} ${col.light} border-current`
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-xs font-bold ${active ? col.text : "text-gray-500"}`}>
                        Phase {ph.phaseNumber}
                      </span>
                      {pct === 100 && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    </div>
                    <p className="text-[10px] text-gray-500 text-center leading-tight">{ph.phaseName}</p>
                    <div className="mt-1.5 w-full">
                      <Progress value={pct} className="h-1" />
                      <span className={`text-[10px] font-semibold mt-0.5 block text-right ${col.text}`}>{pct}%</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Phase Detail */}
            {activePhase && (() => {
              const pct = phasePct(activePhase)
              const col = phaseColor(pct)
              const sections = groupBySection(activePhase.tasks)
              const doneCnt  = activePhase.tasks.filter((t) => t.status === "Done").length
              return (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Phase Header */}
                  <div className={`px-5 py-4 ${col.light} border-b border-gray-100`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Phase {activePhase.phaseNumber}
                        </p>
                        <h3 className="text-base font-bold text-gray-900">{activePhase.phaseName}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{doneCnt}/{activePhase.tasks.length} done</span>
                        <span className={`text-lg font-bold ${col.text}`}>{pct}%</span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-3 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                    <span className="font-medium">Legend:</span>
                    {Object.entries(TYPE_LABEL).map(([type, label]) => (
                      <span key={type} className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${TYPE_BADGE[type]}`}>{label}</span>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    ))}
                    <span className="ml-auto text-gray-400">Click any row to toggle Done</span>
                  </div>

                  {/* Sections */}
                  <div className="p-4 space-y-3">
                    {Object.entries(sections).map(([section, tasks]) => (
                      <SectionAccordion
                        key={section}
                        section={section}
                        tasks={tasks}
                        onToggle={toggleTask}
                      />
                    ))}
                  </div>
                </div>
              )
            })()}
          </TabsContent>

          {/* ── Documents Tab ───────────────────────────────────────────────── */}
          <TabsContent value="documents" className="mt-4">
            {/* Hidden file input for upload */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Required Documentation</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Click status to cycle · Sample = template · Upload your file · Download uploaded file
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{doneDocs}/{totalDocs}</p>
                    <p className="text-xs text-gray-400">completed</p>
                  </div>
                  <Progress value={totalDocs > 0 ? (doneDocs / totalDocs) * 100 : 0} className="h-8 w-24 rounded-lg" />
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {Object.entries(docsByCategory).map(([category, docs]) => {
                  const catDone = docs.filter((d) => d.status === "Done").length
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{category}</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catDone === docs.length ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                          {catDone}/{docs.length}
                        </span>
                      </div>
                      {docs.map((doc) => (
                        <div key={doc.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                          <span className="text-xs text-gray-400 w-6 text-right font-mono mt-1 shrink-0">{doc.docNumber}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${doc.status === "Done" ? "line-through text-gray-400" : "text-gray-800"}`}>
                              {doc.title}
                            </p>
                            {doc.preparedBy && (
                              <p className="text-xs text-gray-400 mt-0.5">{doc.preparedBy}</p>
                            )}
                            {doc.fileName && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <FileText className="w-3 h-3 text-green-500 shrink-0" />
                                <span className="text-xs text-green-700 truncate max-w-[160px]">
                                  {doc.fileName.replace(/^[^_]+_/, "")}
                                </span>
                                {doc.fileSize && (
                                  <span className="text-xs text-gray-400 shrink-0">({fmtFileSize(doc.fileSize)})</span>
                                )}
                                <button
                                  onClick={() => removeUpload(doc.id)}
                                  className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                                  title="Remove uploaded file"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            {/* Sample template download */}
                            <a
                              href={`/api/erp-tracker/documents/${doc.id}?type=sample`}
                              download
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors font-medium"
                              title="Download sample template"
                            >
                              <BookOpen className="w-3 h-3" /> Sample
                            </a>

                            {/* Upload button */}
                            <button
                              onClick={() => triggerUpload(doc.id)}
                              disabled={uploading && uploadingDocId === doc.id}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium disabled:opacity-50"
                              title="Upload your document"
                            >
                              <Upload className="w-3 h-3" />
                              {uploading && uploadingDocId === doc.id ? "..." : "Upload"}
                            </button>

                            {/* Download uploaded file (only if uploaded) */}
                            {doc.fileName && (
                              <a
                                href={`/api/erp-tracker/documents/${doc.id}`}
                                download
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
                                title="Download your uploaded file"
                              >
                                <Download className="w-3 h-3" /> Download
                              </a>
                            )}

                            {/* Status badge */}
                            <button
                              onClick={() => cycleDocStatus(doc.id, doc.status)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${DOC_STATUS_COLORS[doc.status] ?? "bg-gray-100 text-gray-500"}`}
                            >
                              {doc.status}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── Risks Tab ───────────────────────────────────────────────────── */}
          <TabsContent value="risks" className="mt-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Risk Register</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Click status badge to cycle: Open → Mitigated → Closed</p>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: "Open",      color: "bg-red-100 text-red-700",    count: project.risks.filter((r) => r.status === "Open").length },
                    { label: "Mitigated", color: "bg-amber-100 text-amber-700", count: project.risks.filter((r) => r.status === "Mitigated").length },
                    { label: "Closed",    color: "bg-green-100 text-green-700", count: project.risks.filter((r) => r.status === "Closed").length },
                  ].map(({ label, color, count }) => count > 0 && (
                    <span key={label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>
                      {count} {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 w-8">#</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Risk Description</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 w-24">Probability</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 w-20">Impact</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Mitigation</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {project.risks.map((risk) => (
                      <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{risk.riskNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 max-w-xs">{risk.description}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {risk.probability === "High" && <AlertTriangle className="w-3 h-3 text-red-500" />}
                            <span className={`text-xs ${PROB_COLORS[risk.probability] ?? "text-gray-600"}`}>
                              {risk.probability}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${PROB_COLORS[risk.impact] ?? "text-gray-600"}`}>
                            {risk.impact}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">{risk.mitigation ?? "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => cycleRiskStatus(risk.id, risk.status)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${RISK_STATUS_COLORS[risk.status] ?? "bg-gray-100 text-gray-500"}`}
                          >
                            {risk.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Legend ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-400 pb-2">
          <span className="font-medium text-gray-500">Task types:</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">A</span> Activity
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">D</span> Deliverable
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">C</span> Checklist
          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-semibold">M</span> Milestone
        </div>
      </div>

      {/* ── Edit Project Dialog ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {([
              ["projectName", "Project Name",    "text", "[Project Name]"],
              ["clientName",  "Client Name",     "text", "[Client Name]"],
              ["erpSoftware", "ERP Software",    "text", "SAP / Oracle / Odoo..."],
              ["partner",     "Implementing Partner", "text", "[Your Company]"],
              ["pm",          "Project Manager", "text", "Name"],
              ["clientPoc",   "Client POC",      "text", "Name"],
              ["startDate",   "Start Date",      "date", ""],
              ["goLiveDate",  "Go-Live Date",    "date", ""],
            ] as [keyof typeof form, string, string, string][]).map(([key, label, type, placeholder]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Additional project notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveProject} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
