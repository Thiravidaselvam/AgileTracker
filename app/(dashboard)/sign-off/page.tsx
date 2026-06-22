"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus, Search, Upload, Eye, Edit2, Trash2, MoreVertical,
  CheckCircle2, Clock, FileText, FolderOpen, TrendingUp,
} from "lucide-react"
import { Header } from "@/components/layout/header"

interface SignOffDoc {
  id: string; docId: string; title: string; project: string; module?: string
  docDate?: string; description?: string; status: string
  createdBy?: { name: string }; createdAt: string
  total: number; approved: number; sections: number; progress: number
}

const STATUS_COLORS: Record<string, string> = {
  Draft:       "bg-slate-100 text-slate-700",
  "In Progress":"bg-blue-100 text-blue-700",
  Completed:   "bg-green-100 text-green-700",
  Archived:    "bg-gray-100 text-gray-500",
}

const EMPTY_FORM = { title: "", project: "", module: "", docDate: "", description: "", status: "Draft" }

export default function SignOffPage() {
  const router = useRouter()
  const [docs,    setDocs]    = useState<SignOffDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const [statusF, setStatusF] = useState("")

  const [createOpen,   setCreateOpen]   = useState(false)
  const [editDoc,      setEditDoc]      = useState<SignOffDoc | null>(null)
  const [deleteDoc,    setDeleteDoc]    = useState<SignOffDoc | null>(null)
  const [importOpen,   setImportOpen]   = useState(false)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [importFile,   setImportFile]   = useState<File | null>(null)
  const [importApprover, setImportApprover] = useState("")
  const [importing,    setImporting]    = useState(false)
  const [saving,       setSaving]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search)  p.set("search", search)
    if (statusF) p.set("status", statusF)
    const res = await fetch(`/api/sign-off?${p}`)
    if (res.ok) setDocs(await res.json())
    setLoading(false)
  }, [search, statusF])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    setSaving(true)
    const res = await fetch("/api/sign-off", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    if (res.ok) { setCreateOpen(false); setForm(EMPTY_FORM); load() }
    setSaving(false)
  }

  async function handleEdit() {
    if (!editDoc) return
    setSaving(true)
    const res = await fetch(`/api/sign-off/${editDoc.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    if (res.ok) { setEditDoc(null); load() }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteDoc) return
    await fetch(`/api/sign-off/${deleteDoc.id}`, { method: "DELETE" })
    setDeleteDoc(null); load()
  }

  async function handleImport() {
    if (!importFile) return
    setImporting(true)
    const fd = new FormData()
    fd.append("file", importFile)
    if (importApprover) fd.append("defaultApprovedBy", importApprover)
    const res = await fetch("/api/sign-off/import", { method: "POST", body: fd })
    if (res.ok) {
      const data = await res.json()
      setImportOpen(false); setImportFile(null); setImportApprover("")
      router.push(`/sign-off/${data.id}`)
    } else {
      const err = await res.json().catch(() => ({}))
      alert(`Import failed: ${err.error ?? res.statusText}`)
    }
    setImporting(false)
  }

  function openEdit(doc: SignOffDoc) {
    setEditDoc(doc)
    setForm({
      title: doc.title, project: doc.project, module: doc.module ?? "",
      docDate: doc.docDate ? doc.docDate.slice(0, 10) : "",
      description: doc.description ?? "", status: doc.status,
    })
  }

  const totalDocs     = docs.length
  const completedDocs = docs.filter((d) => d.status === "Completed").length
  const totalItems    = docs.reduce((s, d) => s + d.total, 0)
  const totalApproved = docs.reduce((s, d) => s + d.approved, 0)
  const overallPct    = totalItems > 0 ? Math.round((totalApproved / totalItems) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      <Header title="Sign-Off Documents" />
    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sign-Off Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track module sign-off approvals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Import Excel
          </Button>
          <Button onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" /> New Document
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: totalDocs,     icon: FileText,    color: "text-blue-600" },
          { label: "Completed",       value: completedDocs, icon: CheckCircle2, color: "text-green-600" },
          { label: "Total Items",     value: totalItems,    icon: FolderOpen,  color: "text-purple-600" },
          { label: "Overall Progress",value: `${overallPct}%`, icon: TrendingUp, color: "text-orange-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gray-50 ${k.color}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input placeholder="Search documents…" className="pl-9" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusF || "__all__"} onValueChange={(v) => setStatusF(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No sign-off documents yet</p>
          <p className="text-sm mt-1">Create a new document or import from Excel</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <div key={doc.id}
              className="bg-white rounded-xl border hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(`/sign-off/${doc.id}`)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{doc.docId}</span>
                      <Badge className={`text-xs ${STATUS_COLORS[doc.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {doc.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{doc.project}</p>
                    {doc.module && <p className="text-xs text-gray-400 truncate">{doc.module}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => router.push(`/sign-off/${doc.id}`)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(doc)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDoc(doc)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{doc.approved} / {doc.total} items approved</span>
                    <span className="font-medium text-gray-700">{doc.progress}%</span>
                  </div>
                  <Progress value={doc.progress} className="h-1.5"
                    style={{ "--progress-bg": doc.progress === 100 ? "#22c55e" : "#3b82f6" } as any} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" /> {doc.sections} section{doc.sections !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Sign-Off Document</DialogTitle></DialogHeader>
          <DocumentForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title || !form.project}>
              {saving ? "Creating…" : "Create Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(o) => !o && setEditDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Document</DialogTitle></DialogHeader>
          <DocumentForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving || !form.title || !form.project}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Document</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            Delete <strong>{deleteDoc?.title}</strong> and all its {deleteDoc?.total} items? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Import from Excel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload an Excel (.xlsx) sign-off file. Column layout is auto-detected for Procurement and HR formats.
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              {importFile ? (
                <p className="text-sm font-medium text-blue-600">{importFile.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Click to select an Excel file</p>
              )}
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1">
              <Label>Default Approved By <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. Mr. Sudharson — used when file has no Approved By column"
                value={importApprover}
                onChange={(e) => setImportApprover(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportFile(null); setImportApprover("") }}>Cancel</Button>
            <Button onClick={handleImport} disabled={!importFile || importing}>
              {importing ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}

function DocumentForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const f = (key: string) => ({ value: form[key], onChange: (e: any) => setForm({ ...form, [key]: e.target.value }) })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Document Title *</Label>
          <Input placeholder="e.g. Procurement Module Sign-Off" {...f("title")} />
        </div>
        <div className="space-y-1">
          <Label>Project *</Label>
          <Input placeholder="e.g. BPAPP" {...f("project")} />
        </div>
        <div className="space-y-1">
          <Label>Module / Area</Label>
          <Input placeholder="e.g. HR Management" {...f("module")} />
        </div>
        <div className="space-y-1">
          <Label>Document Date</Label>
          <Input type="date" {...f("docDate")} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Description</Label>
          <Textarea placeholder="Optional description or notes…" rows={2} {...f("description")} />
        </div>
      </div>
    </div>
  )
}
