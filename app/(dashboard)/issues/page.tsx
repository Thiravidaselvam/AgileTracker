"use client"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TrackerTable, SeverityBadge, StatusBadge } from "@/components/forms/tracker-table"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Search } from "lucide-react"

const STATUSES   = ["Open", "In Progress", "Fixed", "Closed"]
const SEVERITIES = ["HIGH", "MEDIUM", "LOW"]

const emptyForm = {
  issueId: "", module: "", description: "", severity: "MEDIUM",
  reportedBy: "", ownerId: "", status: "Open",
  dueDate: "", actualCompletion: "", resolution: "",
}

const KANBAN_COLS = [
  { key: "Open",        label: "Open",        color: "border-blue-300 bg-blue-50" },
  { key: "In Progress", label: "In Progress",  color: "border-yellow-300 bg-yellow-50" },
  { key: "Fixed",       label: "Fixed",        color: "border-green-300 bg-green-50" },
  { key: "Closed",      label: "Closed",       color: "border-gray-300 bg-gray-50" },
]

export default function IssuesPage() {
  const { toast } = useToast()
  const [data, setData]         = useState<any[]>([])
  const [users, setUsers]       = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [severity, setSeverity] = useState("all")
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<any | null>(null)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)             params.set("search", search)
    if (severity !== "all") params.set("severity", severity)
    const r = await fetch(`/api/issues?${params}`)
    setData(await r.json())
    setLoading(false)
  }

  const loadUsers = async () => {
    const r   = await fetch("/api/users")
    const all = await r.json()
    setUsers(all.map((u: any) => ({ id: u.id, name: u.name })))
  }

  useEffect(() => { load() }, [search, severity])
  useEffect(() => { loadUsers() }, [])

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true) }
  function openEdit(row: any) {
    setEditing(row)
    setForm({
      issueId:         row.issueId,
      module:          row.module ?? "",
      description:     row.description,
      severity:        row.severity,
      reportedBy:      row.reportedBy,
      ownerId:         row.owner?.id ?? "",
      status:          row.status,
      dueDate:         row.dueDate         ? row.dueDate.split("T")[0]         : "",
      actualCompletion:row.actualCompletion ? row.actualCompletion.split("T")[0]: "",
      resolution:      row.resolution ?? "",
    })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this issue?")) return
    await fetch(`/api/issues/${id}`, { method: "DELETE" })
    toast({ title: "Deleted", variant: "destructive" })
    load()
  }

  async function handleSave() {
    setSaving(true)
    const method = editing ? "PUT" : "POST"
    const url    = editing ? `/api/issues/${editing.id}` : "/api/issues"
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast({ title: editing ? "Updated" : "Created", variant: "success" }); setOpen(false); load() }
    else toast({ title: "Error saving", variant: "destructive" })
  }

  const columns = [
    { key: "issueId",          label: "ID",               className: "font-mono text-xs w-24" },
    { key: "module",           label: "Module",            filter: { getVal: (r: any) => r.module ?? "" } },
    { key: "description",      label: "Description",       render: (r: any) => <span className="line-clamp-2 text-xs max-w-xs block">{r.description}</span> },
    { key: "severity",         label: "Severity",          filter: { getVal: (r: any) => r.severity ?? "" },            render: (r: any) => <SeverityBadge value={r.severity} /> },
    { key: "reportedBy",       label: "Reported By",       className: "whitespace-nowrap" },
    { key: "openDate",         label: "Open Date",         filter: { getVal: (r: any) => formatDate(r.openDate) },      render: (r: any) => formatDate(r.openDate) },
    { key: "status",           label: "Status",            filter: { getVal: (r: any) => r.status ?? "" },              render: (r: any) => <StatusBadge value={r.status} /> },
    { key: "owner",            label: "Owner",             filter: { getVal: (r: any) => r.owner?.name ?? "" },         render: (r: any) => r.owner?.name ?? "—" },
    { key: "daysOpen",         label: "Days Open",         render: (r: any) => <span className={r.daysOpen > 7 ? "text-red-600 font-medium" : ""}>{r.daysOpen}d</span> },
    { key: "dueDate",          label: "Due",               filter: { getVal: (r: any) => formatDate(r.dueDate) },       render: (r: any) => formatDate(r.dueDate) },
    { key: "actualCompletion", label: "Actual Completion", filter: { getVal: (r: any) => formatDate(r.actualCompletion) }, render: (r: any) => formatDate(r.actualCompletion) },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Issue Tracker" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search issues…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>

        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">{data.length} issues</p>
              </div>
              <TrackerTable columns={columns as any} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} pageSize={20} />
            </div>
          </TabsContent>

          <TabsContent value="kanban">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              {KANBAN_COLS.map((col) => {
                const items = data.filter((i) => i.status === col.key)
                return (
                  <div key={col.key} className={`rounded-xl border-2 ${col.color} p-3 space-y-2`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-700 uppercase">{col.label}</h3>
                      <span className="text-xs bg-white rounded-full px-2 py-0.5 font-medium">{items.length}</span>
                    </div>
                    {items.map((item) => (
                      <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md" onClick={() => openEdit(item)}>
                        <p className="text-xs font-mono text-gray-400">{item.issueId}</p>
                        <p className="text-xs text-gray-700 mt-1 line-clamp-3">{item.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <SeverityBadge value={item.severity} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Issue" : "Add Issue"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Issue ID</Label>
              <Input value={form.issueId} onChange={(e) => setForm({ ...form, issueId: e.target.value })} placeholder="Auto-generated if blank" />
            </div>
            <div className="space-y-1.5">
              <Label>Module</Label>
              <Input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} placeholder="e.g. Login, Dashboard…" />
            </div>
            <div className="space-y-1.5">
              <Label>Reported By</Label>
              <Select value={form.reportedBy} onValueChange={(v) => setForm({ ...form, reportedBy: v })}>
                <SelectTrigger><SelectValue placeholder="Select reporter" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Actual Completion</Label>
              <Input type="date" value={form.actualCompletion} onChange={(e) => setForm({ ...form, actualCompletion: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Resolution</Label>
              <Textarea value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} rows={2} />
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
