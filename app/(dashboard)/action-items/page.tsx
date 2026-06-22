"use client"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TrackerTable, StatusBadge } from "@/components/forms/tracker-table"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Search } from "lucide-react"
import { differenceInDays } from "date-fns"

const STATUSES = ["Open", "In Progress", "Completed", "Closed"]
const emptyForm = { type: "", description: "", dueDate: "", status: "Open" }

export default function ActionItemsPage() {
  const { toast } = useToast()
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState("all")
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== "all") params.set("status", status)
    const r = await fetch(`/api/action-items?${params}`)
    setData(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true) }
  function openEdit(row: any) {
    setEditing(row)
    setForm({ type: row.type, description: row.description,
      dueDate: row.dueDate ? row.dueDate.split("T")[0] : "", status: row.status })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this action item?")) return
    await fetch(`/api/action-items/${id}`, { method: "DELETE" })
    toast({ title: "Deleted", variant: "destructive" })
    load()
  }

  async function handleSave() {
    setSaving(true)
    const method = editing ? "PUT" : "POST"
    const url    = editing ? `/api/action-items/${editing.id}` : "/api/action-items"
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast({ title: "Saved", variant: "success" }); setOpen(false); load() }
    else toast({ title: "Error", variant: "destructive" })
  }

  const columns = [
    { key: "type",        label: "Type",        className: "font-medium w-32", filter: { getVal: (r: any) => r.type ?? "" } },
    { key: "description", label: "Description", render: (r: any) => <span className="line-clamp-2 text-xs max-w-sm block">{r.description}</span> },
    { key: "owner",       label: "Owner",       filter: { getVal: (r: any) => r.owner?.name ?? "" },  render: (r: any) => r.owner?.name ?? "—" },
    { key: "createdAt",   label: "Created",     filter: { getVal: (r: any) => formatDate(r.createdAt) }, render: (r: any) => formatDate(r.createdAt) },
    { key: "dueDate",     label: "Due",         filter: { getVal: (r: any) => formatDate(r.dueDate) }, render: (r: any) => {
      const d = r.dueDate ? new Date(r.dueDate) : null
      const overdue = d && differenceInDays(d, new Date()) < 0 && !["Completed","Closed"].includes(r.status)
      const daysLeft = d ? differenceInDays(d, new Date()) : null
      return (
        <span className={overdue ? "text-red-600 font-medium" : ""}>
          {formatDate(r.dueDate)}
          {daysLeft !== null && !["Completed","Closed"].includes(r.status) && (
            <span className="ml-1 text-xs text-gray-400">({overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})</span>
          )}
        </span>
      )
    }},
    { key: "status", label: "Status", filter: { getVal: (r: any) => r.status ?? "" }, render: (r: any) => <StatusBadge value={r.status} /> },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Action Items" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">{data.length} action items</p>
          </div>
          <TrackerTable columns={columns as any} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} pageSize={20} />
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Action Item" : "Add Action Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Type *</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Follow-up, Risk…" required /></div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
