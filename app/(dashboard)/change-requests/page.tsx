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
import { TrackerTable, PriorityBadge, StatusBadge } from "@/components/forms/tracker-table"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Search, Eye, Printer } from "lucide-react"
import { CRDocument } from "@/components/dashboard/cr-document"
import { printCRDocument, printCRList } from "@/lib/reports/print-report"

const STATUSES   = ["Submitted", "Under Review", "Approved", "Rejected", "In Progress", "Implemented", "Deferred"]
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"]

const KANBAN_COLS = [
  { key: "Submitted",    label: "Submitted",    color: "border-blue-300 bg-blue-50"   },
  { key: "Under Review", label: "Under Review", color: "border-yellow-300 bg-yellow-50" },
  { key: "Approved",     label: "Approved",     color: "border-green-300 bg-green-50" },
  { key: "In Progress",  label: "In Progress",  color: "border-purple-300 bg-purple-50" },
  { key: "Implemented",  label: "Implemented",  color: "border-teal-300 bg-teal-50"   },
  { key: "Rejected",     label: "Rejected",     color: "border-red-300 bg-red-50"     },
  { key: "Deferred",     label: "Deferred",     color: "border-gray-300 bg-gray-50"   },
]

const emptyForm = {
  crId: "", title: "", description: "", reason: "", impact: "",
  priority: "MEDIUM", status: "Submitted", requestedBy: "", ownerId: "__none__",
  estimatedEffort: "", targetDate: "", actualCompletion: "", remarks: "",
}

export default function ChangeRequestsPage() {
  const { toast } = useToast()
  const [data, setData]       = useState<any[]>([])
  const [users, setUsers]     = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [open, setOpen]       = useState(false)
  const [viewing, setViewing] = useState<any | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const r = await fetch(`/api/change-requests?${params}`)
    setData(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [search])
  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) =>
      setUsers(Array.isArray(d) ? d.map((u: any) => ({ id: u.id, name: u.name })) : [])
    )
  }, [])

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true) }
  function openEdit(row: any) {
    setEditing(row)
    setForm({
      crId:            row.crId,
      title:           row.title,
      description:     row.description,
      reason:          row.reason,
      impact:          row.impact          ?? "",
      priority:        row.priority,
      status:          row.status,
      requestedBy:     row.requestedBy,
      ownerId:         row.ownerId         ?? "__none__",
      estimatedEffort: row.estimatedEffort ?? "",
      targetDate:      row.targetDate      ? row.targetDate.split("T")[0] : "",
      actualCompletion: row.actualCompletion ? row.actualCompletion.split("T")[0] : "",
      remarks:         row.remarks         ?? "",
    })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this change request?")) return
    await fetch(`/api/change-requests/${id}`, { method: "DELETE" })
    toast({ title: "Deleted", variant: "destructive" })
    load()
  }

  async function handleSave() {
    if (!form.title || !form.description || !form.reason || !form.requestedBy) {
      toast({ title: "Title, description, reason and requested-by are required", variant: "destructive" })
      return
    }
    setSaving(true)
    const method = editing ? "PUT"  : "POST"
    const url    = editing ? `/api/change-requests/${editing.id}` : "/api/change-requests"
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ownerId: (form.ownerId && form.ownerId !== "__none__") ? form.ownerId : null }),
    })
    setSaving(false)
    if (res.ok) { toast({ title: editing ? "Updated" : "Created", variant: "success" }); setOpen(false); load() }
    else toast({ title: "Error saving", variant: "destructive" })
  }

  const columns = [
    { key: "crId",        label: "CR ID",       className: "font-mono text-xs w-28" },
    { key: "title",       label: "Title",        render: (r: any) => <span className="font-medium text-xs line-clamp-2 max-w-xs block">{r.title}</span> },
    { key: "priority",    label: "Priority",     filter: { getVal: (r: any) => r.priority }, render: (r: any) => <PriorityBadge value={r.priority} /> },
    { key: "status",      label: "Status",       filter: { getVal: (r: any) => r.status },   render: (r: any) => <StatusBadge value={r.status} /> },
    { key: "requestedBy", label: "Requested By", filter: { getVal: (r: any) => r.requestedBy } },
    { key: "owner",       label: "Owner",        filter: { getVal: (r: any) => r.owner?.name ?? "" }, render: (r: any) => r.owner?.name ?? "—" },
    { key: "targetDate",  label: "Target Date",  filter: { getVal: (r: any) => formatDate(r.targetDate) }, render: (r: any) => formatDate(r.targetDate) },
    { key: "createdAt",   label: "Raised On",    render: (r: any) => formatDate(r.createdAt) },
    {
      key: "view", label: "",
      render: (r: any) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setViewing(r) }}>
            <Eye className="h-3.5 w-3.5 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); printCRDocument(r) }}>
            <Printer className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Change Requests" />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by ID, title, description…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Button variant="outline" onClick={() => printCRList(data)} disabled={data.length === 0}>
            <Printer className="h-4 w-4 mr-1" /> Print List
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New CR</Button>
        </div>

        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">{data.length} change requests</p>
              </div>
              <TrackerTable columns={columns as any} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} pageSize={20} />
            </div>
          </TabsContent>

          <TabsContent value="kanban">
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mt-2">
              {KANBAN_COLS.map((col) => {
                const items = data.filter((i) => i.status === col.key)
                return (
                  <div key={col.key} className={`rounded-xl border-2 ${col.color} p-3 space-y-2`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-700 uppercase leading-tight">{col.label}</h3>
                      <span className="text-xs bg-white rounded-full px-2 py-0.5 font-medium shrink-0">{items.length}</span>
                    </div>
                    {items.map((item) => (
                      <div key={item.id}
                        className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md"
                        onClick={() => setViewing(item)}
                      >
                        <p className="text-xs font-mono text-gray-400">{item.crId}</p>
                        <p className="text-xs font-medium text-gray-800 mt-1 line-clamp-2">{item.title}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <PriorityBadge value={item.priority} />
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

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.crId}` : "New Change Request"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>CR ID</Label>
              <Input value={form.crId} onChange={(e) => setForm({ ...form, crId: e.target.value })} placeholder="Auto-generated if blank" disabled={!!editing} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short summary of the change" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What exactly needs to change?" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Reason / Justification *</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} placeholder="Why is this change needed?" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Impact Assessment</Label>
              <Textarea value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} rows={2} placeholder="Which modules, systems, or teams are affected?" />
            </div>

            <div className="space-y-1.5">
              <Label>Requested By *</Label>
              <Select value={form.requestedBy} onValueChange={(v) => setForm({ ...form, requestedBy: v })}>
                <SelectTrigger><SelectValue placeholder="Select requestor" /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Owner</Label>
              <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
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
              <Label>Estimated Effort</Label>
              <Input value={form.estimatedEffort} onChange={(e) => setForm({ ...form, estimatedEffort: e.target.value })} placeholder="e.g. 4 hours, 2 days" />
            </div>

            <div className="space-y-1.5">
              <Label>Target Date</Label>
              <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>Actual Completion</Label>
              <Input type="date" value={form.actualCompletion} onChange={(e) => setForm({ ...form, actualCompletion: e.target.value })} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} placeholder="Review notes, decisions, history…" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Print Dialog */}
      {viewing && (
        <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Change Request — {viewing.crId}</DialogTitle>
            </DialogHeader>
            <CRDocument cr={viewing} />
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setViewing(null); openEdit(viewing) }}>Edit</Button>
              <Button variant="outline" className="gap-1.5" onClick={() => printCRDocument(viewing)}>
                <Printer className="h-4 w-4" /> Print / PDF
              </Button>
              <Button onClick={() => setViewing(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
