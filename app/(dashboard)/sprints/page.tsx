"use client"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TrackerTable, StatusBadge } from "@/components/forms/tracker-table"
import { VelocityLineChart } from "@/components/dashboard/charts"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus } from "lucide-react"

const SPRINT_STATUSES = ["Planning", "Active", "Completed", "Cancelled"]
const emptyForm = { sprintName: "", startDate: "", endDate: "", plannedStories: 0, completedStories: 0, sprintStatus: "Planning" }

export default function SprintsPage() {
  const { toast } = useToast()
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm]       = useState<any>(emptyForm)
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    setLoading(true)
    const r = await fetch("/api/sprints")
    setData(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true) }
  function openEdit(row: any) {
    setEditing(row)
    setForm({ sprintName: row.sprintName, startDate: row.startDate.split("T")[0], endDate: row.endDate.split("T")[0],
      plannedStories: row.plannedStories, completedStories: row.completedStories, sprintStatus: row.sprintStatus })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sprint?")) return
    await fetch(`/api/sprints/${id}`, { method: "DELETE" })
    toast({ title: "Deleted", variant: "destructive" })
    load()
  }

  async function handleSave() {
    setSaving(true)
    const method = editing ? "PUT" : "POST"
    const url    = editing ? `/api/sprints/${editing.id}` : "/api/sprints"
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast({ title: "Saved", variant: "success" }); setOpen(false); load() }
    else toast({ title: "Error", variant: "destructive" })
  }

  const chartData = [...data].reverse().slice(-10).map((s) => ({
    sprint: s.sprintName, planned: s.plannedStories,
    completed: s.completedStories, velocity: s.velocityPct,
  }))

  const columns = [
    { key: "sprintName",       label: "Sprint",     className: "font-medium" },
    { key: "startDate",        label: "Start",      filter: { getVal: (r: any) => formatDate(r.startDate) }, render: (r: any) => formatDate(r.startDate) },
    { key: "endDate",          label: "End",        filter: { getVal: (r: any) => formatDate(r.endDate) },   render: (r: any) => formatDate(r.endDate) },
    { key: "plannedStories",   label: "Planned" },
    { key: "completedStories", label: "Completed" },
    { key: "velocityPct",      label: "Velocity",   render: (r: any) => <span className={r.velocityPct >= 80 ? "text-green-600 font-medium" : r.velocityPct >= 60 ? "text-yellow-600" : "text-red-600"}>{r.velocityPct.toFixed(0)}%</span> },
    { key: "sprintStatus",     label: "Status",     filter: { getVal: (r: any) => r.sprintStatus ?? "" },    render: (r: any) => <StatusBadge value={r.sprintStatus} /> },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Sprint Tracker" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{data.length} sprints tracked</p>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Sprint</Button>
        </div>

        {data.length > 0 && <VelocityLineChart data={chartData} />}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TrackerTable columns={columns as any} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} pageSize={20} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Sprint" : "Add Sprint"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5"><Label>Sprint Name *</Label><Input value={form.sprintName} onChange={(e) => setForm({ ...form, sprintName: e.target.value })} placeholder="e.g. Sprint 1" required /></div>
            <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Planned Stories</Label><Input type="number" value={form.plannedStories} onChange={(e) => setForm({ ...form, plannedStories: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Completed Stories</Label><Input type="number" value={form.completedStories} onChange={(e) => setForm({ ...form, completedStories: Number(e.target.value) })} /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Status</Label>
              <Select value={form.sprintStatus} onValueChange={(v) => setForm({ ...form, sprintStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SPRINT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
