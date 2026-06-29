"use client"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Upload, AlertTriangle, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react"

interface ImportResult {
  message: string
  cleared: boolean
  imported: Record<string, number>
}

export function AdminTools({ onDataChange }: { onDataChange?: () => void }) {
  const { toast } = useToast()

  // ── Clear Data ──────────────────────────────────────────────────────────────
  const [clearOpen,    setClearOpen]    = useState(false)
  const [clearConfirm, setClearConfirm] = useState("")
  const [clearing,     setClearing]     = useState(false)

  async function handleClear() {
    if (clearConfirm !== "CLEAR") return
    setClearing(true)
    try {
      const res = await fetch("/api/admin/clear-data", { method: "POST" })
      const body = await res.json()
      if (res.ok) {
        toast({ title: "Data cleared", description: body.message, variant: "success" })
        setClearOpen(false)
        setClearConfirm("")
        onDataChange?.()
      } else {
        toast({ title: "Error", description: body.error, variant: "destructive" })
      }
    } finally {
      setClearing(false)
    }
  }

  // ── Import Excel ────────────────────────────────────────────────────────────
  const fileRef   = useRef<HTMLInputElement>(null)
  const [importOpen,   setImportOpen]   = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [clearFirst,   setClearFirst]   = useState(true)
  const [importing,    setImporting]    = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  function openImport() {
    setSelectedFile(null)
    setImportResult(null)
    setClearFirst(true)
    setImportOpen(true)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setSelectedFile(f)
    setImportResult(null)
  }

  async function handleImport() {
    if (!selectedFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const fd = new FormData()
      fd.append("file",       selectedFile)
      fd.append("clearFirst", String(clearFirst))
      const res  = await fetch("/api/admin/import-excel", { method: "POST", body: fd })
      const body = await res.json()
      if (res.ok) {
        setImportResult(body)
        toast({ title: "Import complete", description: body.message, variant: "success" })
        onDataChange?.()
      } else {
        toast({ title: "Import failed", description: body.error ?? "Unknown error", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: String(err?.message ?? err), variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      {/* ── Admin Tools bar ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-sm font-semibold text-red-700 dark:text-red-400">Admin Tools</span>
          <span className="text-xs text-red-400 ml-1">— Destructive actions. Users &amp; roles are never affected.</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setClearConfirm(""); setClearOpen(true) }}
            className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30 gap-2"
          >
            <Trash2 className="h-4 w-4" /> Clear All Tracker Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openImport}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 gap-2"
          >
            <Upload className="h-4 w-4" /> Import from Excel
          </Button>
        </div>
      </div>

      {/* ── Clear Confirmation Dialog ────────────────────────────────────────── */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <Trash2 className="h-5 w-5" /> Clear All Tracker Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 space-y-1">
              <p className="font-semibold text-red-700 dark:text-red-400">This will permanently delete:</p>
              <ul className="list-disc list-inside text-red-600 dark:text-red-300 space-y-0.5 text-xs mt-1">
                <li>All Requirements</li>
                <li>All Issues</li>
                <li>All Test Items</li>
                <li>All Sprints</li>
                <li>All Support Tickets</li>
                <li>All Action Items</li>
                <li>All Progress Logs &amp; Report Shares</li>
              </ul>
              <p className="text-xs text-red-500 mt-2 font-medium">Users and roles will NOT be affected.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                Type <strong>CLEAR</strong> to confirm:
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
                value={clearConfirm}
                onChange={e => setClearConfirm(e.target.value)}
                placeholder="CLEAR"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)}>Cancel</Button>
            <Button
              onClick={handleClear}
              disabled={clearConfirm !== "CLEAR" || clearing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {clearing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Clearing…</> : <><Trash2 className="h-4 w-4 mr-1" />Clear All Data</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Excel Dialog ──────────────────────────────────────────────── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <FileSpreadsheet className="h-5 w-5" /> Import from Excel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {/* Expected format note */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold">Expected sheet names &amp; columns:</p>
              <ul className="space-y-0.5 mt-1">
                <li><strong>Requirements Tracker</strong> — Req ID, Module/Menu, Requirement, Requestor, Priority, Status, Owner, Created Date, Target Date…</li>
                <li><strong>Issue Tracker</strong> — Issue ID, Issue Description, Severity, Reported By, Owner, Status, Open Date, Due Date, Days Open, Resolution</li>
                <li><strong>Test Items Tracker</strong> — Test ID, Module, Sub Module, Issue, Description, Tested By, Priority, Status, Owner, Created Date, Target Date</li>
                <li><strong>Sprint Tracker</strong> — Sprint, Start Date, End Date, Planned Stories, Completed Stories, Velocity %, Sprint Status</li>
                <li><strong>Support</strong> — Customer, Product, Requirement, Requestor, Priority, Status, Owner, Created Date, Target Date…</li>
                <li><strong>Action Item</strong> — Type, Description, Owner, Due Date, Status</li>
              </ul>
            </div>

            {/* File picker */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg px-4 py-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              {selectedFile ? (
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">{selectedFile.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Click to select <strong>.xlsx</strong> file</p>
              )}
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
            </div>

            {/* Clear first option */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={clearFirst}
                onChange={e => setClearFirst(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-blue-600"
              />
              <span className="text-sm">
                <span className="font-medium">Clear existing tracker data before import</span>
                <span className="block text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Recommended for a fresh import. Unchecked = merge / upsert (existing records updated by ID).
                </span>
              </span>
            </label>

            {/* Result summary */}
            {importResult && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 space-y-2">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Import Complete
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700 dark:text-green-400">
                  {Object.entries(importResult.imported).map(([k, v]) => (
                    <span key={k}><strong>{v}</strong> {k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Close</Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {importing
                ? <><Loader2 className="h-4 w-4 animate-spin" />Importing…</>
                : <><Upload className="h-4 w-4" />Import</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
