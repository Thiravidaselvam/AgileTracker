"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Plus, Rocket, Clock, CheckCircle2, AlertTriangle, XCircle,
  Trash2, Pencil, CalendarDays, BarChart3, ShieldAlert,
} from "lucide-react"

const PHASES = ["Pre-Cutover", "Cutover Day", "Post-Go-Live"]

const STATUS_COLORS: Record<string, string> = {
  Planning:  "bg-blue-100 text-blue-700",
  Active:    "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-500",
}

type ChecklistSummary = {
  id: string; checklistId: string; title: string; project: string
  goLiveDate: string; description: string | null; status: string; createdAt: string
  stats: { total: number; done: number; blocked: number; critical: number; pct: number }
}

function Countdown({ goLiveDate }: { goLiveDate: string }) {
  const [diff, setDiff] = useState<number | null>(null)
  useEffect(() => {
    const calc = () => {
      const ms = new Date(goLiveDate).getTime() - Date.now()
      setDiff(Math.ceil(ms / 86400000))
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [goLiveDate])

  if (diff === null) return null
  if (diff < 0) return <span className="text-xs font-semibold text-green-600">Launched {Math.abs(diff)}d ago</span>
  if (diff === 0) return <span className="text-xs font-bold text-red-600 animate-pulse">GO-LIVE TODAY!</span>
  return (
    <span className={`text-xs font-semibold ${diff <= 7 ? "text-red-600" : diff <= 30 ? "text-amber-600" : "text-gray-600"}`}>
      {diff}d to go-live
    </span>
  )
}

const emptyForm = { title: "", project: "", goLiveDate: "", description: "" }

export default function GoLivePage() {
  const router = useRouter()
  const [checklists, setChecklists] = useState<ChecklistSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ChecklistSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChecklistSummary | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/go-live")
    if (res.ok) setChecklists(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setError("")
    setDialogOpen(true)
  }

  function openEdit(c: ChecklistSummary, e: React.MouseEvent) {
    e.stopPropagation()
    setEditTarget(c)
    setForm({
      title: c.title, project: c.project,
      goLiveDate: c.goLiveDate.split("T")[0],
      description: c.description ?? "",
    })
    setError("")
    setDialogOpen(true)
  }

  async function save() {
    if (!form.title || !form.project || !form.goLiveDate) { setError("Title, project and go-live date are required."); return }
    setSaving(true)
    const method = editTarget ? "PUT" : "POST"
    const url    = editTarget ? `/api/go-live/${editTarget.id}` : "/api/go-live"
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { setDialogOpen(false); load() }
    else { const d = await res.json(); setError(d.error ?? "Failed") }
  }

  async function doDelete() {
    if (!deleteTarget) return
    await fetch(`/api/go-live/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    load()
  }

  const totalItems   = checklists.reduce((s, c) => s + c.stats.total, 0)
  const totalDone    = checklists.reduce((s, c) => s + c.stats.done, 0)
  const totalBlocked = checklists.reduce((s, c) => s + c.stats.blocked, 0)
  const overallPct   = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0
  const upcoming     = checklists.filter((c) => new Date(c.goLiveDate) >= new Date()).sort((a, b) => new Date(a.goLiveDate).getTime() - new Date(b.goLiveDate).getTime())[0]

  return (
    <div className="flex flex-col h-full">
      <Header title="Go-Live Checklist" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Checklists", value: checklists.length, icon: Rocket, color: "text-blue-600 bg-blue-50" },
            { label: "Overall Complete", value: `${overallPct}%`, icon: BarChart3, color: "text-green-600 bg-green-50" },
            { label: "Blocked Items", value: totalBlocked, icon: XCircle, color: "text-red-600 bg-red-50" },
            { label: "Next Go-Live", value: upcoming ? new Date(upcoming.goLiveDate).toLocaleDateString("en-GB") : "—", icon: CalendarDays, color: "text-amber-600 bg-amber-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
              <div><div className="text-xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-500">{label}</div></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            All Checklists <span className="text-gray-400 font-normal text-sm ml-1">({checklists.length})</span>
          </h2>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Checklist</Button>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : checklists.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Rocket className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No checklists yet</p>
            <p className="text-sm mt-1">Create your first go-live checklist to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {checklists.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/go-live/${c.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">{c.checklistId}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}>{c.status}</Badge>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{c.project}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    <button onClick={(e) => openEdit(c, e)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c) }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {/* Go-live date + countdown */}
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{new Date(c.goLiveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span className="text-gray-300">·</span>
                  <Countdown goLiveDate={c.goLiveDate} />
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{c.stats.done}/{c.stats.total} tasks done</span>
                    <span className="font-semibold text-gray-700">{c.stats.pct}%</span>
                  </div>
                  <Progress value={c.stats.pct} className="h-1.5" />
                </div>

                {/* Stat chips */}
                <div className="flex gap-2 flex-wrap">
                  {c.stats.blocked > 0 && (
                    <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      <XCircle className="w-3 h-3" /> {c.stats.blocked} blocked
                    </span>
                  )}
                  {c.stats.critical > 0 && (
                    <span className="flex items-center gap-1 text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      <ShieldAlert className="w-3 h-3" /> {c.stats.critical} critical open
                    </span>
                  )}
                  {c.stats.pct === 100 && (
                    <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Complete
                    </span>
                  )}
                  {c.stats.total === 0 && (
                    <span className="text-[10px] text-gray-400 italic">No items yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Checklist" : "New Go-Live Checklist"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}
            {(["title", "project"] as const).map((f) => (
              <div key={f}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{f} *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form[f]}
                  onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                  placeholder={f === "title" ? "ERP Go-Live — Phase 1" : "PAPYRUS BP ERP Implementation"}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Go-Live Date *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.goLiveDate}
                onChange={(e) => setForm((p) => ({ ...p, goLiveDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional notes about this go-live..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : editTarget ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Checklist?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 py-2">This will permanently delete <strong>{deleteTarget?.title}</strong> and all its items.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
