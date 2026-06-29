"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft, Plus, Printer, Edit2, Trash2, MoreVertical,
  CheckCircle2, Clock, AlertCircle, XCircle, ChevronDown, ChevronRight,
  Filter,
} from "lucide-react"
import { Header } from "@/components/layout/header"

interface SignOffItem {
  id: string; sno: number; section: string; menuItem: string
  description?: string; status: string; approvedBy?: string
  signOffDate?: string; remarks?: string
}
interface SignOffDoc {
  id: string; docId: string; title: string; project: string; module?: string
  docDate?: string; description?: string; status: string
  createdBy?: { name: string }; createdAt: string
  items: SignOffItem[]
}

const STATUS_OPTIONS = ["Pending", "In Review", "Approved", "Rejected", "Deferred"]

const STATUS_STYLE: Record<string, { color: string; icon: any }> = {
  Pending:    { color: "bg-gray-100 text-gray-600",  icon: Clock },
  "In Review":{ color: "bg-blue-100 text-blue-700",  icon: Filter },
  Approved:   { color: "bg-green-100 text-green-700",icon: CheckCircle2 },
  Rejected:   { color: "bg-red-100 text-red-700",    icon: XCircle },
  Deferred:   { color: "bg-amber-100 text-amber-700",icon: AlertCircle },
}

const EMPTY_ITEM = {
  section: "", menuItem: "", description: "", status: "Pending",
  approvedBy: "", signOffDate: "", remarks: "",
}

function fmt(d?: string | null) {
  if (!d) return "—"
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function SignOffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [doc,        setDoc]        = useState<SignOffDoc | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [collapsed,  setCollapsed]  = useState<Set<string>>(new Set())
  const [filterStat, setFilterStat] = useState("")

  const [addOpen,    setAddOpen]    = useState(false)
  const [editItem,   setEditItem]   = useState<SignOffItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<SignOffItem | null>(null)
  const [bulkOpen,   setBulkOpen]   = useState(false)
  const [bulkStatus, setBulkStatus] = useState("Approved")
  const [bulkBy,     setBulkBy]     = useState("")
  const [bulkDate,   setBulkDate]   = useState(new Date().toISOString().slice(0, 10))
  const [addSection, setAddSection] = useState("")
  const [itemForm,   setItemForm]   = useState(EMPTY_ITEM)
  const [saving,     setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/sign-off/${id}`)
    if (res.ok) setDoc(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!doc)    return <div className="p-8 text-center text-gray-400">Document not found.</div>

  const items    = filterStat ? doc.items.filter((i) => i.status === filterStat) : doc.items
  const sections = [...new Set(doc.items.map((i) => i.section))]
  const total    = doc.items.length
  const approved = doc.items.filter((i) => i.status === "Approved").length
  const inReview = doc.items.filter((i) => i.status === "In Review").length
  const pending  = doc.items.filter((i) => i.status === "Pending").length
  const rejected = doc.items.filter((i) => i.status === "Rejected").length
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0

  const sectionStats = sections.map((s) => {
    const sit = doc.items.filter((i) => i.section === s)
    return { name: s, total: sit.length, approved: sit.filter((i) => i.status === "Approved").length }
  })

  // Derive unique approvers from items (for signature block)
  const approvers = [...new Set(doc.items.map((i) => i.approvedBy).filter(Boolean))] as string[]

  function toggleSelect(itemId: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(itemId) ? n.delete(itemId) : n.add(itemId); return n })
  }
  function toggleAll(ids: string[]) {
    setSelected((prev) => {
      const allIn = ids.every((itemId) => prev.has(itemId))
      const n = new Set(prev)
      ids.forEach((itemId) => allIn ? n.delete(itemId) : n.add(itemId))
      return n
    })
  }
  function toggleCollapse(s: string) {
    setCollapsed((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

  async function addItem() {
    setSaving(true)
    const payload = { ...itemForm, section: addSection || itemForm.section }
    await fetch(`/api/sign-off/${id}/items`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    })
    setAddOpen(false); setItemForm(EMPTY_ITEM); setAddSection(""); load()
    setSaving(false)
  }

  async function saveEdit() {
    if (!editItem) return
    setSaving(true)
    await fetch(`/api/sign-off/${id}/items/${editItem.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(itemForm),
    })
    setEditItem(null); load()
    setSaving(false)
  }

  async function deleteOne() {
    if (!deleteItem) return
    await fetch(`/api/sign-off/${id}/items/${deleteItem.id}`, { method: "DELETE" })
    setDeleteItem(null); load()
  }

  async function patchStatus(itemId: string, status: string) {
    await fetch(`/api/sign-off/${id}/items`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: [itemId], status, signOffDate: new Date().toISOString().slice(0, 10) }),
    })
    load()
  }

  async function bulkApply() {
    await fetch(`/api/sign-off/${id}/items`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: [...selected], status: bulkStatus, approvedBy: bulkBy, signOffDate: bulkDate }),
    })
    setSelected(new Set()); setBulkOpen(false); load()
  }

  function openEdit(item: SignOffItem) {
    setEditItem(item)
    setItemForm({
      section:     item.section,
      menuItem:    item.menuItem,
      description: item.description ?? "",
      status:      item.status,
      approvedBy:  item.approvedBy  ?? "",
      signOffDate: item.signOffDate ? item.signOffDate.slice(0, 10) : "",
      remarks:     item.remarks     ?? "",
    })
  }

  // ─── Print in clean window (no layout overflow clipping) ───────────────────
  function handlePrint() {
    const el = document.getElementById("sod-print-content")
    if (!el) return
    const win = window.open("", "_blank")
    if (!win) { window.print(); return }
    const docId    = doc?.docId ?? ""
    const docTitle = doc?.title ?? ""
    win.document.write(`<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/>
<title>${docId} — ${docTitle}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 1.8cm 1.5cm; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 9pt; color: #111; background: white; }
/* ── Page header ── */
.sod-page-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 10pt; margin-bottom: 14pt; }
.sod-header-logo { font-size: 16pt; font-weight: 800; color: #1e3a5f; letter-spacing: 1px; }
.sod-header-sub  { font-size: 8pt; color: #666; margin-top: 2pt; }
.sod-header-right { text-align: right; }
.sod-doc-id     { font-size: 11pt; font-weight: 700; color: #1e3a5f; }
.sod-doc-status { display: inline-block; margin-top: 4pt; padding: 2pt 8pt; background: #1e3a5f; color: white; font-size: 7.5pt; font-weight: 600; border-radius: 3pt; letter-spacing: 0.5px; text-transform: uppercase; }
/* ── Meta table ── */
.sod-meta-table { width: 100%; border-collapse: collapse; margin-bottom: 8pt; }
.sod-meta-table th { width: 18%; padding: 5pt 8pt; background: #f0f4f8; color: #1e3a5f; font-size: 8pt; font-weight: 600; text-align: left; border: 1px solid #c8d6e5; }
.sod-meta-table td { padding: 5pt 8pt; border: 1px solid #c8d6e5; font-size: 8.5pt; color: #333; }
/* ── Section title ── */
.sod-section-title { font-size: 10pt; font-weight: 700; color: #1e3a5f; border-bottom: 1.5px solid #1e3a5f; padding-bottom: 3pt; margin-bottom: 8pt; text-transform: uppercase; letter-spacing: 0.5px; }
/* ── Summary table ── */
.sod-summary-table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; font-size: 8.5pt; }
.sod-summary-table th { padding: 5pt 8pt; background: #1e3a5f; color: white; font-weight: 600; text-align: left; border: 1px solid #1e3a5f; }
.sod-summary-table th.sod-num { text-align: center; }
.sod-summary-table td { padding: 4pt 8pt; border: 1px solid #c8d6e5; }
.sod-summary-table td.sod-num { text-align: center; }
.sod-summary-table td.sod-approved { font-weight: 700; color: #166534; }
.sod-summary-table td.sod-pct { font-weight: 700; color: #1e3a5f; }
.sod-section-name { font-weight: 600; color: #1e3a5f; }
.sod-total-row td { font-weight: 700; background: #e8f0f8; color: #1e3a5f; border: 1px solid #1e3a5f; text-align: center; padding: 5pt 8pt; }
.sod-total-row td:first-child { text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
/* ── Section block ── */
.sod-section-block { margin-bottom: 16pt; page-break-inside: avoid; }
.sod-section-heading { display: flex; justify-content: space-between; align-items: center; background: #1e3a5f; color: white; padding: 5pt 10pt; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
.sod-section-badge { font-size: 7.5pt; font-weight: 400; background: rgba(255,255,255,0.2); padding: 1pt 6pt; border-radius: 3pt; }
/* ── Items table ── */
.sod-items-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
.sod-items-table th { padding: 4pt 7pt; background: #dce8f4; color: #1e3a5f; font-weight: 600; text-align: left; border: 1px solid #a8bfd4; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
.sod-items-table td { padding: 4pt 7pt; border: 1px solid #c8d6e5; vertical-align: top; }
.sod-row-even { background: white; }
.sod-row-odd  { background: #f7fafd; }
.sod-no       { width: 4%;  text-align: center; color: #666; font-weight: 600; }
.sod-item     { width: 22%; font-weight: 500; color: #1a1a2e; }
.sod-desc     { width: 34%; color: #444; font-size: 7.5pt; }
.sod-status   { width: 10%; text-align: center; font-weight: 600; font-size: 7.5pt; }
.sod-approver { width: 16%; }
.sod-date     { width: 14%; color: #555; }
.sod-st-approved { color: #166534; }
.sod-st-review   { color: #1d4ed8; }
.sod-st-rejected { color: #991b1b; }
.sod-st-deferred { color: #92400e; }
.sod-st-pending  { color: #374151; }
/* ── Signature block ── */
.sod-signature-section { margin-top: 20pt; page-break-inside: avoid; }
.sod-sig-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 6pt; }
.sod-sig-table th { padding: 5pt 10pt; background: #f0f4f8; color: #1e3a5f; font-weight: 600; border: 1px solid #c8d6e5; text-align: left; }
.sod-sig-table td { padding: 14pt 10pt 5pt; border: 1px solid #c8d6e5; }
.sod-sig-line { border-bottom: 1px solid #999; }
/* ── Remarks ── */
.sod-remarks-box { margin-top: 16pt; border: 1px solid #c8d6e5; border-radius: 4pt; padding: 8pt 10pt; page-break-inside: avoid; }
.sod-remarks-label { font-weight: 700; color: #1e3a5f; font-size: 8.5pt; margin-bottom: 6pt; }
.sod-remarks-body  { font-size: 8pt; color: #444; }
.sod-remark-line   { margin-bottom: 4pt; }
/* ── Footer ── */
.sod-footer { position: fixed; bottom: 1cm; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 7pt; color: #888; border-top: 1px solid #c8d6e5; padding-top: 5pt; padding-left: 1.5cm; padding-right: 1.5cm; }
</style>
</head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 600)
  }

  // ─── Screen view ────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Screen-only UI ── */}
      <div className="flex flex-col h-full print:hidden">
        <Header title="Sign-Off Documents" />
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/sign-off")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Sign-Off Documents
          </Button>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
                Bulk Update ({selected.size} selected)
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print / PDF
            </Button>
            <Button size="sm" onClick={() => {
              setAddSection(sections[0] ?? ""); setItemForm(EMPTY_ITEM); setAddOpen(true)
            }}>
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>
        </div>

        {/* Doc header */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-gray-400">{doc.docId}</span>
                <Badge className={`text-xs ${doc.status === "Completed" ? "bg-green-100 text-green-700" : doc.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                  {doc.status}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{doc.title}</h2>
              <p className="text-gray-500">
                Project: <strong>{doc.project}</strong>
                {doc.module && <> &nbsp;|&nbsp; Module: <strong>{doc.module}</strong></>}
                {doc.docDate && <> &nbsp;|&nbsp; Date: <strong>{fmt(doc.docDate)}</strong></>}
              </p>
              {doc.description && <p className="text-sm text-gray-400 mt-1">{doc.description}</p>}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Items", value: total },
              { label: "Approved",    value: approved,  cls: "text-green-600" },
              { label: "In Review",   value: inReview,  cls: "text-blue-600"  },
              { label: "Pending",     value: pending,   cls: "text-gray-500"  },
              { label: "Rejected",    value: rejected,  cls: "text-red-600"   },
            ].map((k) => (
              <div key={k.label} className="text-center">
                <p className={`text-2xl font-bold ${k.cls ?? "text-gray-800"}`}>{k.value}</p>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Overall Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Section summary */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Section Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sectionStats.map((s) => {
              const pct = s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium text-gray-700 truncate">{s.name}</span>
                      <span className="text-gray-500 ml-2 shrink-0">{s.approved}/{s.total}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500">Filter:</span>
          {["", ...STATUS_OPTIONS].map((s) => (
            <button key={s || "all"} onClick={() => setFilterStat(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStat === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {s || "All"}
            </button>
          ))}
        </div>

        {/* Items by section */}
        <div className="space-y-4">
          {sections.map((section) => {
            const sItems = items.filter((i) => i.section === section)
            if (sItems.length === 0) return null
            const sIds = sItems.map((i) => i.id)
            const allChecked  = sIds.every((sid) => selected.has(sid))
            const isCollapsed = collapsed.has(section)
            return (
              <div key={section} className="bg-white rounded-xl border overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b cursor-pointer select-none"
                  onClick={() => toggleCollapse(section)}>
                  <button onClick={(e) => { e.stopPropagation(); toggleCollapse(section) }}>
                    {isCollapsed
                      ? <ChevronRight className="w-4 h-4 text-gray-400" />
                      : <ChevronDown  className="w-4 h-4 text-gray-400" />}
                  </button>
                  <Checkbox checked={allChecked}
                    onCheckedChange={() => toggleAll(sIds)}
                    onClick={(e) => e.stopPropagation()} />
                  <h4 className="font-semibold text-gray-800 flex-1">{section}</h4>
                  <span className="text-xs text-gray-500">
                    {sItems.filter((i) => i.status === "Approved").length}/{sItems.length} approved
                  </span>
                </div>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b bg-white">
                          <th className="w-8 px-4 py-2" />
                          <th className="w-10 px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Module / Menu Item</th>
                          <th className="px-3 py-2 text-left hidden md:table-cell">Description</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left hidden lg:table-cell">Approved By</th>
                          <th className="px-3 py-2 text-left hidden lg:table-cell">Sign-Off Date</th>
                          <th className="px-3 py-2 text-left hidden xl:table-cell">Remarks</th>
                          <th className="w-10 px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {sItems.map((item) => {
                          const st   = STATUS_STYLE[item.status] ?? STATUS_STYLE["Pending"]
                          const Icon = st.icon
                          return (
                            <tr key={item.id}
                              className={`border-b last:border-0 hover:bg-gray-50/50 ${selected.has(item.id) ? "bg-blue-50/40" : ""}`}>
                              <td className="px-4 py-2.5">
                                <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                              </td>
                              <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{item.sno}</td>
                              <td className="px-3 py-2.5 font-medium text-gray-800">{item.menuItem}</td>
                              <td className="px-3 py-2.5 text-gray-500 text-xs hidden md:table-cell max-w-xs">
                                <p className="line-clamp-2">{item.description}</p>
                              </td>
                              <td className="px-3 py-2.5">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button>
                                      <Badge className={`text-xs cursor-pointer gap-1 ${st.color}`}>
                                        <Icon className="w-3 h-3" /> {item.status}
                                      </Badge>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {STATUS_OPTIONS.map((s) => (
                                      <DropdownMenuItem key={s} onClick={() => patchStatus(item.id, s)}>
                                        {s}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                              <td className="px-3 py-2.5 text-gray-500 text-xs hidden lg:table-cell">{item.approvedBy}</td>
                              <td className="px-3 py-2.5 text-gray-500 text-xs hidden lg:table-cell">{fmt(item.signOffDate)}</td>
                              <td className="px-3 py-2.5 text-gray-400 text-xs hidden xl:table-cell max-w-xs">
                                <p className="line-clamp-1">{item.remarks}</p>
                              </td>
                              <td className="px-3 py-2.5">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteItem(item)}>
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!isCollapsed && (
                  <div className="px-5 py-2 border-t bg-gray-50/50">
                    <button className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      onClick={() => { setAddSection(section); setItemForm({ ...EMPTY_ITEM, section }); setAddOpen(true) }}>
                      <Plus className="w-3.5 h-3.5" /> Add item to {section}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Button variant="outline" size="sm"
          onClick={() => { setAddSection(""); setItemForm(EMPTY_ITEM); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-1" /> Add to New Section
        </Button>
      </div>
      </div>

      {/* ── Print template (hidden on screen, extracted by handlePrint) ── */}
      <div id="sod-print-content" style={{ display: "none" }}>
        {/* Page header */}
        <div className="sod-page-header">
          <div className="sod-header-left">
            <div className="sod-header-logo">PAPYRUS BP</div>
            <div className="sod-header-sub">Enterprise Application Sign-Off Document</div>
          </div>
          <div className="sod-header-right">
            <div className="sod-doc-id">{doc.docId}</div>
            <div className="sod-doc-status">{doc.status}</div>
          </div>
        </div>

        {/* Document meta table */}
        <table className="sod-meta-table">
          <tbody>
            <tr>
              <th>Document Title</th>
              <td colSpan={3}>{doc.title}</td>
            </tr>
            <tr>
              <th>Project</th><td>{doc.project}</td>
              <th>Module / Area</th><td>{doc.module || "—"}</td>
            </tr>
            <tr>
              <th>Document Date</th><td>{fmt(doc.docDate)}</td>
              <th>Printed On</th><td>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</td>
            </tr>
            <tr>
              <th>Total Items</th><td>{total}</td>
              <th>Approved</th><td>{approved} of {total} ({progress}%)</td>
            </tr>
            {doc.description && (
              <tr>
                <th>Description</th>
                <td colSpan={3} style={{ fontStyle: "italic" }}>{doc.description}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Progress summary */}
        <div className="sod-section-title" style={{ marginTop: "18pt" }}>Sign-Off Progress Summary</div>
        <table className="sod-summary-table">
          <thead>
            <tr>
              <th>Section</th>
              <th className="sod-num">Total</th>
              <th className="sod-num">Approved</th>
              <th className="sod-num">Pending / Review</th>
              <th className="sod-num">% Complete</th>
            </tr>
          </thead>
          <tbody>
            {sectionStats.map((s) => {
              const pct = s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0
              const pend = s.total - s.approved
              return (
                <tr key={s.name}>
                  <td className="sod-section-name">{s.name}</td>
                  <td className="sod-num">{s.total}</td>
                  <td className="sod-num sod-approved">{s.approved}</td>
                  <td className="sod-num">{pend}</td>
                  <td className="sod-num sod-pct">{pct}%</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="sod-total-row">
              <td>TOTAL</td>
              <td className="sod-num">{total}</td>
              <td className="sod-num">{approved}</td>
              <td className="sod-num">{total - approved}</td>
              <td className="sod-num">{progress}%</td>
            </tr>
          </tfoot>
        </table>

        {/* Items by section */}
        {sections.map((section) => {
          const sItems = doc.items.filter((i) => i.section === section)
          if (sItems.length === 0) return null
          const sApproved = sItems.filter((i) => i.status === "Approved").length
          return (
            <div key={section} className="sod-section-block">
              <div className="sod-section-heading">
                <span>{section}</span>
                <span className="sod-section-badge">{sApproved}/{sItems.length} Approved</span>
              </div>
              <table className="sod-items-table">
                <thead>
                  <tr>
                    <th className="sod-no">#</th>
                    <th className="sod-item">Module / Menu Item</th>
                    <th className="sod-desc">Description / Remarks</th>
                    <th className="sod-status">Status</th>
                    <th className="sod-approver">Approved By</th>
                    <th className="sod-date">Sign-Off Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sItems.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "sod-row-even" : "sod-row-odd"}>
                      <td className="sod-no">{item.sno}</td>
                      <td className="sod-item">{item.menuItem}</td>
                      <td className="sod-desc">{item.description || item.remarks || ""}</td>
                      <td className={`sod-status ${
                        item.status === "Approved"   ? "sod-st-approved" :
                        item.status === "In Review"  ? "sod-st-review"   :
                        item.status === "Rejected"   ? "sod-st-rejected" :
                        item.status === "Deferred"   ? "sod-st-deferred" : "sod-st-pending"
                      }`}>{item.status}</td>
                      <td className="sod-approver">{item.approvedBy || ""}</td>
                      <td className="sod-date">{fmt(item.signOffDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        {/* Signature / Approval block */}
        <div className="sod-signature-section">
          <div className="sod-section-title">Approval &amp; Sign-Off</div>
          <table className="sod-sig-table">
            <thead>
              <tr>
                <th>Role / Designation</th>
                <th>Name</th>
                <th>Signature</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {approvers.length > 0
                ? approvers.map((ap) => (
                    <tr key={ap}>
                      <td></td>
                      <td>{ap}</td>
                      <td className="sod-sig-line"></td>
                      <td className="sod-sig-line"></td>
                    </tr>
                  ))
                : (
                  <>
                    <tr><td></td><td></td><td className="sod-sig-line"></td><td className="sod-sig-line"></td></tr>
                    <tr><td></td><td></td><td className="sod-sig-line"></td><td className="sod-sig-line"></td></tr>
                  </>
                )
              }
            </tbody>
          </table>
        </div>

        {/* Remarks / Notes box */}
        <div className="sod-remarks-box">
          <div className="sod-remarks-label">Notes &amp; Remarks</div>
          <div className="sod-remarks-body">
            {doc.items.filter((i) => i.remarks).map((i) => (
              <div key={i.id} className="sod-remark-line">
                <strong>{i.sno}. {i.menuItem}:</strong> {i.remarks}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sod-footer">
          <span>{doc.docId} — {doc.title}</span>
          <span>Confidential — For Internal Use Only</span>
          <span>Generated: {new Date().toLocaleDateString("en-GB")}</span>
        </div>
      </div>

      {/* ── Dialogs (always in DOM, screen-only) ── */}
      <div className="print:hidden">
        {/* Add / Edit Item */}
        <Dialog open={addOpen || !!editItem} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditItem(null) } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Item" : "Add Sign-Off Item"}</DialogTitle>
            </DialogHeader>
            <ItemForm form={itemForm} setForm={setItemForm} sections={sections}
              addSection={addSection} setAddSection={setAddSection} />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAddOpen(false); setEditItem(null) }}>Cancel</Button>
              <Button onClick={editItem ? saveEdit : addItem} disabled={saving || !itemForm.menuItem}>
                {saving ? "Saving…" : editItem ? "Save Changes" : "Add Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Item */}
        <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete Item</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-600">Delete <strong>{deleteItem?.menuItem}</strong>?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
              <Button variant="destructive" onClick={deleteOne}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Update */}
        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Bulk Update — {selected.size} items</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Set Status</Label>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Approved By</Label>
                <Input placeholder="Approver name" value={bulkBy} onChange={(e) => setBulkBy(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Sign-Off Date</Label>
                <Input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
              <Button onClick={bulkApply}>Apply to {selected.size} items</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

    </>
  )
}

function ItemForm({ form, setForm, sections, addSection, setAddSection }: {
  form: any; setForm: (f: any) => void
  sections: string[]; addSection: string; setAddSection: (s: string) => void
}) {
  const [newSection, setNewSection] = useState(false)
  const f = (key: string) => ({
    value: form[key],
    onChange: (e: any) => setForm({ ...form, [key]: e.target.value }),
  })
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Section *</Label>
        {!newSection ? (
          <Select
            value={addSection || "__new__"}
            onValueChange={(v) => {
              if (v === "__new__") { setNewSection(true); setAddSection("") }
              else { setAddSection(v); setForm({ ...form, section: v }) }
            }}>
            <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
            <SelectContent>
              {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              <SelectItem value="__new__">+ New section…</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-2">
            <Input placeholder="New section name" value={addSection}
              onChange={(e) => { setAddSection(e.target.value); setForm({ ...form, section: e.target.value }) }} />
            {sections.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setNewSection(false)}>Existing</Button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Label>Module / Menu Item *</Label>
        <Input placeholder="e.g. Purchase Order" {...f("menuItem")} />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea rows={2} placeholder="Optional description…" {...f("description")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Sign-Off Date</Label>
          <Input type="date" {...f("signOffDate")} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Approved By</Label>
          <Input placeholder="Approver name" {...f("approvedBy")} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Remarks</Label>
          <Textarea rows={2} placeholder="Any notes or pending actions…" {...f("remarks")} />
        </div>
      </div>
    </div>
  )
}
