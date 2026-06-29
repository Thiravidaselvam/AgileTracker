"use client"
import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft, Plus, Printer, CheckCircle2, Clock, XCircle,
  AlertTriangle, SkipForward, ChevronDown, Pencil, Trash2,
  ShieldAlert, CalendarDays, User, Link2,
} from "lucide-react"

// ── Constants ────────────────────────────────────────────────────────────────

const PHASES    = ["Pre-Cutover", "Cutover Day", "Post-Go-Live"]
const CATS      = ["Infrastructure & Environment", "Data Migration", "System Configuration",
                   "User Access & Security", "Training & Communication", "Testing & Validation",
                   "Integration", "Go-Live Communication", "Monitoring & Support", "Rollback Readiness", "Other"]
const PRIORITIES = ["Critical", "High", "Medium", "Low"]
const STATUSES   = ["Not Started", "In Progress", "Done", "Blocked", "Skipped"]

const STATUS_STYLE: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-700",
  "Done":        "bg-green-100 text-green-700",
  "Blocked":     "bg-red-100 text-red-700",
  "Skipped":     "bg-gray-100 text-gray-400",
}
const PRIORITY_STYLE: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 font-semibold",
  High:     "bg-orange-100 text-orange-700",
  Medium:   "bg-amber-100 text-amber-700",
  Low:      "bg-gray-100 text-gray-500",
}
const CHECKLIST_STATUS_COLOR: Record<string, string> = {
  Planning: "bg-blue-100 text-blue-700", Active: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700", Cancelled: "bg-gray-100 text-gray-500",
}

// ── Types ─────────────────────────────────────────────────────────────────────

type GoLiveItem = {
  id: string; phase: string; category: string; task: string
  description: string | null; owner: string | null; dueDateTime: string | null
  priority: string; status: string; dependency: string | null; remarks: string | null; order: number
}
type Checklist = {
  id: string; checklistId: string; title: string; project: string
  goLiveDate: string; description: string | null; status: string
  items: GoLiveItem[]
}

// ── Item Form default ─────────────────────────────────────────────────────────

const emptyItem = {
  phase: "Pre-Cutover", category: "Infrastructure & Environment", task: "",
  description: "", owner: "", dueDateTime: "", priority: "High", status: "Not Started",
  dependency: "", remarks: "",
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function CountdownBadge({ goLiveDate }: { goLiveDate: string }) {
  const [diff, setDiff] = useState<number | null>(null)
  useEffect(() => {
    const calc = () => setDiff(Math.ceil((new Date(goLiveDate).getTime() - Date.now()) / 86400000))
    calc(); const t = setInterval(calc, 60000); return () => clearInterval(t)
  }, [goLiveDate])
  if (diff === null) return null
  if (diff < 0)  return <span className="text-sm font-semibold text-green-600">Launched {Math.abs(diff)}d ago</span>
  if (diff === 0) return <span className="text-sm font-bold text-red-600 animate-pulse">GO-LIVE TODAY!</span>
  const cls = diff <= 7 ? "text-red-600" : diff <= 30 ? "text-amber-600" : "text-blue-600"
  return (
    <div className={`text-center ${cls}`}>
      <div className="text-4xl font-black leading-none">{diff}</div>
      <div className="text-xs font-semibold uppercase tracking-wider mt-0.5">days to go</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GoLiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading]     = useState(true)
  const [activePhase, setActivePhase] = useState(0)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState("All")

  const [itemDialog, setItemDialog] = useState(false)
  const [editItem, setEditItem]     = useState<GoLiveItem | null>(null)
  const [itemForm, setItemForm]     = useState({ ...emptyItem })
  const [deleteItem, setDeleteItem] = useState<GoLiveItem | null>(null)
  const [bulkDialog, setBulkDialog] = useState(false)
  const [bulkStatus, setBulkStatus] = useState("Done")
  const [saving, setSaving]         = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/go-live/${id}`)
    if (res.ok) { setChecklist(await res.json()); setLoading(false) }
    else router.push("/go-live")
  }, [id, router])

  useEffect(() => { load() }, [load])

  // ── Derived stats ───────────────────────────────────────────────────────────

  function phaseItems(phase: string) {
    if (!checklist) return []
    return checklist.items.filter((i) => i.phase === phase)
  }

  function phaseStats(phase: string) {
    const items = phaseItems(phase)
    const total   = items.length
    const done    = items.filter((i) => i.status === "Done" || i.status === "Skipped").length
    const blocked = items.filter((i) => i.status === "Blocked").length
    const pct     = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, blocked, pct }
  }

  const allItems   = checklist?.items ?? []
  const totalDone  = allItems.filter((i) => i.status === "Done" || i.status === "Skipped").length
  const overallPct = allItems.length > 0 ? Math.round((totalDone / allItems.length) * 100) : 0

  // ── Inline status toggle ────────────────────────────────────────────────────

  async function setItemStatus(item: GoLiveItem, status: string) {
    await fetch(`/api/go-live/${id}/items/${item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    load()
  }

  // ── Bulk update ─────────────────────────────────────────────────────────────

  async function bulkUpdate() {
    setSaving(true)
    await fetch(`/api/go-live/${id}/items`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: [...selected], status: bulkStatus }),
    })
    setSaving(false); setBulkDialog(false); setSelected(new Set()); load()
  }

  // ── Item CRUD ────────────────────────────────────────────────────────────────

  function openAddItem() {
    setEditItem(null)
    setItemForm({ ...emptyItem, phase: PHASES[activePhase] })
    setItemDialog(true)
  }

  function openEditItem(item: GoLiveItem, e: React.MouseEvent) {
    e.stopPropagation()
    setEditItem(item)
    setItemForm({
      phase: item.phase, category: item.category, task: item.task,
      description: item.description ?? "", owner: item.owner ?? "",
      dueDateTime: item.dueDateTime ? item.dueDateTime.slice(0, 16) : "",
      priority: item.priority, status: item.status,
      dependency: item.dependency ?? "", remarks: item.remarks ?? "",
    })
    setItemDialog(true)
  }

  async function saveItem() {
    setSaving(true)
    const payload = {
      ...itemForm,
      dueDateTime: itemForm.dueDateTime || null,
      description: itemForm.description || null,
      owner: itemForm.owner || null,
      dependency: itemForm.dependency || null,
      remarks: itemForm.remarks || null,
    }
    if (editItem) {
      await fetch(`/api/go-live/${id}/items/${editItem.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
    } else {
      await fetch(`/api/go-live/${id}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
    }
    setSaving(false); setItemDialog(false); load()
  }

  async function confirmDeleteItem() {
    if (!deleteItem) return
    await fetch(`/api/go-live/${id}/items/${deleteItem.id}`, { method: "DELETE" })
    setDeleteItem(null); load()
  }

  // ── Print ────────────────────────────────────────────────────────────────────

  function handlePrint() {
    const el = document.getElementById("glc-print-content")
    if (!el || !checklist) return
    const win = window.open("", "_blank")
    if (!win) { window.print(); return }
    win.document.write(`<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/>
<title>${checklist.checklistId} — ${checklist.title}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 1.8cm 1.5cm; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 9pt; color: #111; background: white; }
.glc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 10pt; margin-bottom: 14pt; }
.glc-logo { font-size: 16pt; font-weight: 800; color: #1e3a5f; letter-spacing: 1px; }
.glc-logo-sub { font-size: 8pt; color: #666; margin-top: 2pt; }
.glc-id { font-size: 11pt; font-weight: 700; color: #1e3a5f; text-align: right; }
.glc-status { display: inline-block; margin-top: 4pt; padding: 2pt 8pt; background: #1e3a5f; color: white; font-size: 7.5pt; font-weight: 600; border-radius: 3pt; text-transform: uppercase; }
.glc-meta { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }
.glc-meta th { width: 18%; padding: 5pt 8pt; background: #f0f4f8; color: #1e3a5f; font-size: 8pt; font-weight: 600; border: 1px solid #c8d6e5; text-align: left; }
.glc-meta td { padding: 5pt 8pt; border: 1px solid #c8d6e5; font-size: 8.5pt; }
.glc-countdown { text-align: center; font-weight: 900; font-size: 22pt; color: #1e3a5f; }
.glc-countdown-label { font-size: 7.5pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
.section-title { font-size: 10pt; font-weight: 700; color: #1e3a5f; border-bottom: 1.5px solid #1e3a5f; padding-bottom: 3pt; margin: 14pt 0 8pt; text-transform: uppercase; letter-spacing: 0.5px; }
.phase-heading { display: flex; justify-content: space-between; align-items: center; background: #1e3a5f; color: white; padding: 5pt 10pt; font-size: 9pt; font-weight: 700; text-transform: uppercase; margin-bottom: 0; }
.phase-badge { font-size: 7.5pt; font-weight: 400; background: rgba(255,255,255,0.2); padding: 1pt 6pt; border-radius: 3pt; }
table.items { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 16pt; page-break-inside: avoid; }
table.items th { padding: 4pt 7pt; background: #dce8f4; color: #1e3a5f; font-weight: 600; border: 1px solid #a8bfd4; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3px; text-align: left; }
table.items td { padding: 4pt 7pt; border: 1px solid #c8d6e5; vertical-align: top; }
.row-even { background: white; } .row-odd { background: #f7fafd; }
.st-done { color: #166534; font-weight: 700; } .st-inprog { color: #1d4ed8; } .st-blocked { color: #991b1b; font-weight: 700; }
.st-skip { color: #6b7280; } .st-ns { color: #374151; }
.pr-crit { color: #991b1b; font-weight: 700; } .pr-high { color: #c2410c; } .pr-med { color: #b45309; } .pr-low { color: #6b7280; }
.glc-footer { position: fixed; bottom: 1cm; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 7pt; color: #888; border-top: 1px solid #c8d6e5; padding: 5pt 1.5cm 0; }
</style>
</head><body>${el.innerHTML}</body></html>`)
    win.document.close(); win.focus()
    setTimeout(() => { win.print(); win.close() }, 600)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
  if (!checklist) return null

  const currentPhaseItems = phaseItems(PHASES[activePhase])
  const filteredItems = filterStatus === "All" ? currentPhaseItems : currentPhaseItems.filter((i) => i.status === filterStatus)
  const categories    = [...new Set(filteredItems.map((i) => i.category))]

  const goLiveDiff = Math.ceil((new Date(checklist.goLiveDate).getTime() - Date.now()) / 86400000)

  return (
    <>
      {/* ── Screen UI ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col h-full print:hidden">
        <Header title="Go-Live Checklist" />
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => router.push("/go-live")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex-1" />
            {selected.size > 0 && (
              <Button size="sm" variant="outline" onClick={() => setBulkDialog(true)} className="border-blue-300 text-blue-700">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Bulk Update ({selected.size})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print / PDF
            </Button>
            <Button size="sm" onClick={openAddItem}>
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </div>

          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-wrap gap-6 items-start">
              {/* Left: meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-gray-400">{checklist.checklistId}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${CHECKLIST_STATUS_COLOR[checklist.status] ?? "bg-gray-100 text-gray-600"}`}>{checklist.status}</Badge>
                </div>
                <h1 className="text-xl font-bold text-gray-900">{checklist.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{checklist.project}</p>
                {checklist.description && <p className="text-sm text-gray-600 mt-2">{checklist.description}</p>}
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4" />
                  <span>Go-Live: <strong>{new Date(checklist.goLiveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</strong></span>
                </div>
                {/* Overall progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1 text-gray-500">
                    <span>Overall Progress</span>
                    <span className="font-semibold text-gray-700">{totalDone}/{allItems.length} done · {overallPct}%</span>
                  </div>
                  <Progress value={overallPct} className="h-2" />
                </div>
              </div>

              {/* Right: countdown */}
              <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 px-8 py-4 min-w-[110px]">
                <CountdownBadge goLiveDate={checklist.goLiveDate} />
              </div>

              {/* Phase progress mini cards */}
              <div className="w-full grid grid-cols-3 gap-3 mt-1">
                {PHASES.map((ph, i) => {
                  const s = phaseStats(ph)
                  return (
                    <div key={ph} className={`rounded-lg border p-3 cursor-pointer transition-all ${activePhase === i ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                      onClick={() => setActivePhase(i)}>
                      <div className="text-xs font-semibold text-gray-700 mb-1">{ph}</div>
                      <div className="text-[11px] text-gray-500 mb-1.5">{s.done}/{s.total} done {s.blocked > 0 && <span className="text-red-500 ml-1">· {s.blocked} blocked</span>}</div>
                      <Progress value={s.pct} className="h-1" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Phase tabs + filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
              {PHASES.map((ph, i) => (
                <button key={ph} onClick={() => setActivePhase(i)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activePhase === i ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                  {ph}
                </button>
              ))}
            </div>
            <div className="flex gap-1 ml-auto flex-wrap">
              {["All", ...STATUSES].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterStatus === s ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Items by category */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No tasks in this phase yet. Click <strong>Add Task</strong> to get started.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {categories.map((cat) => {
                const catItems = filteredItems.filter((i) => i.category === cat)
                return (
                  <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{cat}</span>
                      <span className="text-xs text-gray-400 ml-1">({catItems.length})</span>
                      <span className="ml-auto text-xs text-gray-500">{catItems.filter((i) => i.status === "Done").length} done</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-white text-xs text-gray-500 uppercase tracking-wide">
                          <th className="w-8 px-3 py-2"><Checkbox checked={catItems.every((i) => selected.has(i.id))} onCheckedChange={(v) => {
                            setSelected((prev) => { const n = new Set(prev); catItems.forEach((i) => v ? n.add(i.id) : n.delete(i.id)); return n })
                          }} /></th>
                          <th className="px-3 py-2 text-left w-8">#</th>
                          <th className="px-3 py-2 text-left">Task</th>
                          <th className="px-3 py-2 text-left w-28 hidden md:table-cell">Owner</th>
                          <th className="px-3 py-2 text-left w-36 hidden md:table-cell">Due</th>
                          <th className="px-3 py-2 text-center w-24">Priority</th>
                          <th className="px-3 py-2 text-center w-32">Status</th>
                          <th className="px-3 py-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map((item, idx) => {
                          const isDone    = item.status === "Done" || item.status === "Skipped"
                          const isBlocked = item.status === "Blocked"
                          return (
                            <tr key={item.id} className={`border-b border-gray-50 transition-colors ${isDone ? "bg-green-50/40" : isBlocked ? "bg-red-50/40" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/30`}>
                              <td className="px-3 py-2.5"><Checkbox checked={selected.has(item.id)} onCheckedChange={(v) => {
                                setSelected((prev) => { const n = new Set(prev); v ? n.add(item.id) : n.delete(item.id); return n })
                              }} /></td>
                              <td className="px-3 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                              <td className="px-3 py-2.5">
                                <div className={`font-medium text-gray-900 ${isDone ? "line-through text-gray-400" : ""}`}>{item.task}</div>
                                {item.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>}
                                {item.dependency && <div className="flex items-center gap-1 text-[10px] text-blue-500 mt-0.5"><Link2 className="w-3 h-3" />{item.dependency}</div>}
                                {item.remarks && <div className="text-[10px] text-amber-600 mt-0.5 italic">{item.remarks}</div>}
                              </td>
                              <td className="px-3 py-2.5 hidden md:table-cell">
                                {item.owner && <div className="flex items-center gap-1 text-xs text-gray-600"><User className="w-3 h-3" />{item.owner}</div>}
                              </td>
                              <td className="px-3 py-2.5 hidden md:table-cell">
                                {item.dueDateTime && (
                                  <div className={`text-xs ${new Date(item.dueDateTime) < new Date() && !isDone ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                                    {new Date(item.dueDateTime).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge className={`text-[10px] px-1.5 ${PRIORITY_STYLE[item.priority] ?? "bg-gray-100 text-gray-500"}`}>{item.priority}</Badge>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full cursor-pointer ${STATUS_STYLE[item.status] ?? "bg-gray-100 text-gray-600"}`}>
                                      {item.status}<ChevronDown className="w-2.5 h-2.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="center" className="min-w-[130px]">
                                    {STATUSES.map((s) => (
                                      <DropdownMenuItem key={s} onClick={() => setItemStatus(item, s)} className={item.status === s ? "font-semibold" : ""}>{s}</DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex gap-1 justify-end">
                                  <button onClick={(e) => openEditItem(item, e)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setDeleteItem(item)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Print template ─────────────────────────────────────────────────── */}
      <div id="glc-print-content" style={{ display: "none" }}>
        {/* Page header */}
        <div className="glc-header">
          <div>
            <div className="glc-logo">PAPYRUS BP</div>
            <div className="glc-logo-sub">Go-Live Cutover Checklist</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="glc-id">{checklist.checklistId}</div>
            <div className="glc-status">{checklist.status}</div>
          </div>
        </div>

        {/* Meta table */}
        <table className="glc-meta">
          <tbody>
            <tr><th>Project</th><td>{checklist.project}</td><th>Go-Live Date</th><td><strong>{new Date(checklist.goLiveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</strong></td></tr>
            <tr><th>Checklist Title</th><td colSpan={3}>{checklist.title}</td></tr>
            {checklist.description && <tr><th>Description</th><td colSpan={3}>{checklist.description}</td></tr>}
            <tr>
              <th>Overall Progress</th>
              <td>{overallPct}% complete ({totalDone}/{allItems.length} tasks)</td>
              <th>Days to Go-Live</th>
              <td><strong className="glc-countdown">{goLiveDiff < 0 ? `Launched ${Math.abs(goLiveDiff)}d ago` : goLiveDiff === 0 ? "TODAY" : `${goLiveDiff} days`}</strong></td>
            </tr>
          </tbody>
        </table>

        {/* Phase summary */}
        <div className="section-title">Phase Summary</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt", marginBottom: "14pt" }}>
          <thead>
            <tr>
              {["Phase", "Total", "Done", "Blocked", "Progress"].map((h) => (
                <th key={h} style={{ padding: "5pt 8pt", background: "#1e3a5f", color: "white", fontWeight: 600, border: "1px solid #1e3a5f", textAlign: h === "Phase" ? "left" : "center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHASES.map((ph, i) => {
              const s = phaseStats(ph)
              return (
                <tr key={ph} style={{ background: i % 2 === 0 ? "white" : "#f7fafd" }}>
                  <td style={{ padding: "4pt 8pt", border: "1px solid #c8d6e5", fontWeight: 600, color: "#1e3a5f" }}>{ph}</td>
                  <td style={{ padding: "4pt 8pt", border: "1px solid #c8d6e5", textAlign: "center" }}>{s.total}</td>
                  <td style={{ padding: "4pt 8pt", border: "1px solid #c8d6e5", textAlign: "center", color: "#166534", fontWeight: 600 }}>{s.done}</td>
                  <td style={{ padding: "4pt 8pt", border: "1px solid #c8d6e5", textAlign: "center", color: s.blocked > 0 ? "#991b1b" : "#374151", fontWeight: s.blocked > 0 ? 700 : 400 }}>{s.blocked}</td>
                  <td style={{ padding: "4pt 8pt", border: "1px solid #c8d6e5", textAlign: "center", fontWeight: 700, color: "#1e3a5f" }}>{s.pct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Items per phase */}
        {PHASES.map((ph) => {
          const items = phaseItems(ph)
          if (!items.length) return null
          const cats = [...new Set(items.map((i) => i.category))]
          return (
            <div key={ph} style={{ marginBottom: "4pt" }}>
              <div className="phase-heading">
                <span>{ph}</span>
                <span className="phase-badge">{items.filter((i) => i.status === "Done").length}/{items.length} done</span>
              </div>
              {cats.map((cat) => {
                const catItems = items.filter((i) => i.category === cat)
                return (
                  <div key={cat}>
                    <div style={{ background: "#dce8f4", padding: "3pt 8pt", fontSize: "7.5pt", fontWeight: 700, color: "#1e3a5f", borderBottom: "1px solid #a8bfd4" }}>{cat}</div>
                    <table className="items">
                      <thead>
                        <tr>
                          <th style={{ width: "4%"  }}>#</th>
                          <th style={{ width: "30%" }}>Task</th>
                          <th style={{ width: "22%" }}>Description</th>
                          <th style={{ width: "14%" }}>Owner</th>
                          <th style={{ width: "14%" }}>Due Date/Time</th>
                          <th style={{ width: "8%", textAlign: "center" }}>Priority</th>
                          <th style={{ width: "8%", textAlign: "center" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map((item, idx) => {
                          const stClass = item.status === "Done" ? "st-done" : item.status === "In Progress" ? "st-inprog" : item.status === "Blocked" ? "st-blocked" : item.status === "Skipped" ? "st-skip" : "st-ns"
                          const prClass = item.priority === "Critical" ? "pr-crit" : item.priority === "High" ? "pr-high" : item.priority === "Medium" ? "pr-med" : "pr-low"
                          return (
                            <tr key={item.id} className={idx % 2 === 0 ? "row-even" : "row-odd"}>
                              <td style={{ textAlign: "center", color: "#666", fontWeight: 600 }}>{idx + 1}</td>
                              <td style={{ fontWeight: 500, textDecoration: item.status === "Done" ? "line-through" : "none" }}>{item.task}</td>
                              <td style={{ fontSize: "7.5pt", color: "#555" }}>{item.description ?? ""}</td>
                              <td>{item.owner ?? ""}</td>
                              <td style={{ fontSize: "7.5pt" }}>{item.dueDateTime ? new Date(item.dueDateTime).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</td>
                              <td style={{ textAlign: "center" }} className={prClass}>{item.priority}</td>
                              <td style={{ textAlign: "center" }} className={stClass}>{item.status}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Signature block */}
        <div style={{ marginTop: "20pt", pageBreakInside: "avoid" }}>
          <div className="section-title">Approval &amp; Sign-Off</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt" }}>
            <thead>
              <tr>
                {["Role", "Name", "Signature", "Date"].map((h) => (
                  <th key={h} style={{ padding: "5pt 10pt", background: "#f0f4f8", color: "#1e3a5f", fontWeight: 600, border: "1px solid #c8d6e5", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Project Manager", "Technical Lead", "Business Owner", "IT Head"].map((role) => (
                <tr key={role}>
                  <td style={{ padding: "14pt 10pt 5pt", border: "1px solid #c8d6e5", fontWeight: 500 }}>{role}</td>
                  <td style={{ padding: "14pt 10pt 5pt", border: "1px solid #c8d6e5" }}></td>
                  <td style={{ padding: "14pt 10pt 5pt", border: "1px solid #c8d6e5" }}></td>
                  <td style={{ padding: "14pt 10pt 5pt", border: "1px solid #c8d6e5" }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="glc-footer">
          <span>PAPYRUS BP — Go-Live Cutover Checklist — {checklist.checklistId}</span>
          <span>Generated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}

      {/* Add/Edit Item */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "Edit Task" : "Add Task"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {/* Phase + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phase *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={itemForm.phase} onChange={(e) => setItemForm((p) => ({ ...p, phase: e.target.value }))}>
                  {PHASES.map((ph) => <option key={ph}>{ph}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={itemForm.category} onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {/* Task */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Task *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={itemForm.task} onChange={(e) => setItemForm((p) => ({ ...p, task: e.target.value }))} placeholder="e.g. Backup production database" />
            </div>
            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            {/* Owner + Due */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={itemForm.owner} onChange={(e) => setItemForm((p) => ({ ...p, owner: e.target.value }))} placeholder="Name or team" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date &amp; Time</label>
                <input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={itemForm.dueDateTime} onChange={(e) => setItemForm((p) => ({ ...p, dueDateTime: e.target.value }))} />
              </div>
            </div>
            {/* Priority + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={itemForm.priority} onChange={(e) => setItemForm((p) => ({ ...p, priority: e.target.value }))}>
                  {PRIORITIES.map((pr) => <option key={pr}>{pr}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={itemForm.status} onChange={(e) => setItemForm((p) => ({ ...p, status: e.target.value }))}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {/* Dependency */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dependency</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={itemForm.dependency} onChange={(e) => setItemForm((p) => ({ ...p, dependency: e.target.value }))} placeholder="e.g. Depends on database backup task" />
            </div>
            {/* Remarks */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
              <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" value={itemForm.remarks} onChange={(e) => setItemForm((p) => ({ ...p, remarks: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>Cancel</Button>
            <Button onClick={saveItem} disabled={saving || !itemForm.task}>{saving ? "Saving..." : editItem ? "Update" : "Add Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update */}
      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Update {selected.size} Tasks</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Set status to</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(false)}>Cancel</Button>
            <Button onClick={bulkUpdate} disabled={saving}>{saving ? "Updating..." : "Apply"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Task?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 py-2">Delete <strong>{deleteItem?.task}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteItem}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
