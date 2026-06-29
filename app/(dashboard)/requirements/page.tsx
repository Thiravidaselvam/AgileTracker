"use client"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TrackerTable, PriorityBadge, StatusBadge } from "@/components/forms/tracker-table"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Search } from "lucide-react"

const STATUSES  = ["Open", "In Progress", "Fixed", "Closed"]
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"]

const emptyForm = { reqId: "", module: "", requirement: "", requestor: "", priority: "MEDIUM", status: "Open", targetDate: "", remarks: "" }

export default function RequirementsPage() {
  const { toast } = useToast()
  const [data, setData]       = useState<any[]>([])
  const [users, setUsers]     = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [status, setStatus]   = useState("all")
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)           params.set("search", search)
    if (status !== "all") params.set("status", status)
    const r = await fetch(`/api/requirements?${params}`)
    setData(await r.json())
    setLoading(false)
  }

  const loadUsers = async () => {
    const r = await fetch("/api/users")
    const all = await r.json()
    setUsers(all.map((u: any) => ({ id: u.id, name: u.name })))
  }

  useEffect(() => { load() }, [search, status])
  useEffect(() => { loadUsers() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(row: any) {
    setEditing(row)
    setForm({
      reqId: row.reqId, module: row.module, requirement: row.requirement,
      requestor: row.requestor, priority: row.priority, status: row.status,
      targetDate: row.targetDate ? row.targetDate.split("T")[0] : "",
      remarks: row.remarks ?? "",
    })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this requirement?")) return
    await fetch(`/api/requirements/${id}`, { method: "DELETE" })
    toast({ title: "Deleted", variant: "destructive" })
    load()
  }

  async function handleSave() {
    setSaving(true)
    const method = editing ? "PUT" : "POST"
    const url    = editing ? `/api/requirements/${editing.id}` : "/api/requirements"
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) {
      toast({ title: editing ? "Updated" : "Created", variant: "success" })
      setOpen(false)
      load()
    } else {
      toast({ title: "Error saving", variant: "destructive" })
    }
  }

  const columns = [
    { key: "reqId",       label: "Req ID",      className: "font-mono text-xs w-24" },
    { key: "module",      label: "Module",       className: "max-w-xs truncate" },
    { key: "requirement", label: "Requirement",  className: "max-w-xs", render: (r: any) => <span className="line-clamp-2 text-xs">{r.requirement}</span> },
    { key: "requestor",   label: "Requestor",    className: "whitespace-nowrap" },
    { key: "createdDate", label: "Created",      filter: { getVal: (r: any) => formatDate(r.createdDate) }, render: (r: any) => formatDate(r.createdDate) },
    { key: "priority",    label: "Priority",     filter: { getVal: (r: any) => r.priority ?? "" },          render: (r: any) => <PriorityBadge value={r.priority} /> },
    { key: "status",      label: "Status",       filter: { getVal: (r: any) => r.status ?? "" },            render: (r: any) => <StatusBadge   value={r.status}   /> },
    { key: "owner",       label: "Owner",        filter: { getVal: (r: any) => r.owner?.name ?? "" },       render: (r: any) => r.owner?.name ?? "—" },
    { key: "targetDate",  label: "Target",       filter: { getVal: (r: any) => formatDate(r.targetDate) },  render: (r: any) => formatDate(r.targetDate) },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Requirements Tracker" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search requirements…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{data.length} requirements</p>
          </div>
          <TrackerTable columns={columns as any} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} pageSize={20} />
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Requirement" : "Add Requirement"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Req ID</Label>
              <Input value={form.reqId} onChange={(e) => setForm({ ...form, reqId: e.target.value })} placeholder="Auto-generated if blank" />
            </div>
            <div className="space-y-1.5">
              <Label>Module / Menu</Label>
              <Input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Requirement *</Label>
              <Textarea value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} rows={3} required />
            </div>
            <div className="space-y-1.5">
              <Label>Requestor</Label>
              <Select value={form.requestor} onValueChange={(v) => setForm({ ...form, requestor: v })}>
                <SelectTrigger><SelectValue placeholder="Select requestor" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Date</Label>
              <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} />
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
