"use client"
import React, { useRef, useState, useMemo, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Upload, Download, CheckCircle2, XCircle, FileSpreadsheet,
  RotateCcw, ChevronDown, ChevronUp, Search, Filter, Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type SheetSummary = { name: string; label: string; files: number; pass: number; fail: number; pct: number }
type TestRow      = { sheet: string; module: string; testFile: string; status: string; casesPass: number; casesFail: number; duration: string; failedTests: string }
type TypeStats    = { files: number; pass: number; fail: number }
type SummaryRow   = {
  module:      string
  functional:  TypeStats
  integration: TypeStats
  unit:        TypeStats
  structural:  TypeStats
  performance: TypeStats
  api:         TypeStats
  totalFiles:  number
  totalPass:   number
  totalFail:   number
  pct:         string
  testItemStatus:   string
  testItemsUpdated: number
}

type Result = {
  ok: boolean
  reset: number
  sheets: SheetSummary[]
  rows: TestRow[]
  summaryRows: SummaryRow[]
  totalTestItemsUpdated: number
  fileName?: string
  importedAt?: string
  error?: string
}

const SHEET_EMOJI: Record<string, string> = {
  Functional:  "⚡",
  Integration: "🔗",
  Unit:        "🧩",
  Structural:  "🏗️",
  Performance: "🚀",
  Api:         "🌐",
}

function StatusBadge({ value }: { value: string }) {
  const pass = value === "PASS"
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border",
      pass
        ? "text-green-700 bg-green-50 border-green-200"
        : "text-red-700 bg-red-50 border-red-200",
    )}>
      {pass ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {value}
    </span>
  )
}

export default function TestRunnerPage() {
  const { toast } = useToast()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [file, setFile]             = useState<File | null>(null)
  const [dragging, setDragging]     = useState(false)
  const [clearFirst, setClearFirst] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [clearing, setClearing]     = useState(false)
  const [result, setResult]         = useState<Result | null>(null)
  const [loadingResult, setLoadingResult] = useState(true)

  // Load latest import from DB on mount
  useEffect(() => {
    fetch("/api/test-runner/import")
      .then(r => r.json())
      .then(data => { if (data.ok) setResult(data) })
      .catch(() => {})
      .finally(() => setLoadingResult(false))
  }, [])

  function persistResult(r: Result | null) {
    setResult(r)
  }

  // Tab + filter state
  const [activeTab, setActiveTab]         = useState<string>("all")
  const [filterStatus, setFilterStatus]   = useState<"all" | "PASS" | "FAIL">("all")
  const [filterModule, setFilterModule]   = useState<string>("all")
  const [filterSearch, setFilterSearch]   = useState<string>("")
  const [expandedFail, setExpandedFail]   = useState<Set<string>>(new Set())

  function pickFile(f: File | null) {
    if (!f) return
    if (!f.name.match(/\.xlsx?$/i)) {
      toast({ title: "Invalid file", description: "Please upload an .xlsx file", variant: "destructive" })
      return
    }
    setFile(f)
    persistResult(null)
    resetFilters("all")
  }

  async function handleClear() {
    if (!confirm("This will reset ALL test item statuses to 'Open'. Continue?")) return
    setClearing(true)
    try {
      const res  = await fetch("/api/test-runner/clear", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Clear failed")
      // Also wipe the stored import so refresh doesn't restore old data
      await fetch("/api/test-runner/import", { method: "DELETE" }).catch(() => {})
      persistResult(null)
      setFile(null)
      resetFilters("all")
      toast({ title: `Cleared — ${data.cleared} test item statuses reset to Open`, variant: "success" })
    } catch (e: any) {
      toast({ title: "Clear failed", description: e.message, variant: "destructive" })
    } finally {
      setClearing(false)
    }
  }

  function resetFilters(tab: string) {
    setActiveTab(tab)
    setFilterStatus("all")
    setFilterModule("all")
    setFilterSearch("")
    setExpandedFail(new Set())
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("clearFirst", String(clearFirst))
    try {
      const res  = await fetch("/api/test-runner/import", { method: "POST", body: fd })
      const data: Result = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Import failed")
      persistResult(data)
      resetFilters("all")
      toast({ title: `Import complete — ${data.totalTestItemsUpdated} test items updated`, variant: "success" })
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function toggleFail(key: string) {
    setExpandedFail(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Rows for active tab
  const tabRows = useMemo(() => {
    if (!result) return []
    return activeTab === "all" ? result.rows : result.rows.filter(r => r.sheet === activeTab)
  }, [result, activeTab])

  // Unique modules in current tab
  const moduleOptions = useMemo(() => {
    const mods = Array.from(new Set(tabRows.map(r => r.module))).filter(Boolean).sort()
    return mods
  }, [tabRows])

  // Filtered rows
  const visibleRows = useMemo(() => {
    let rows = tabRows
    if (filterStatus !== "all")  rows = rows.filter(r => r.status === filterStatus)
    if (filterModule !== "all")  rows = rows.filter(r => r.module === filterModule)
    if (filterSearch.trim())     rows = rows.filter(r =>
      r.testFile.toLowerCase().includes(filterSearch.toLowerCase()) ||
      r.module.toLowerCase().includes(filterSearch.toLowerCase())
    )
    return rows
  }, [tabRows, filterStatus, filterModule, filterSearch])

  // Tab-level stats for each sheet
  const tabStats = useMemo(() => {
    if (!result) return {}
    const map: Record<string, { files: number; pass: number; fail: number; pct: number }> = {}
    for (const sh of result.sheets) map[sh.label] = { files: sh.files, pass: sh.pass, fail: sh.fail, pct: sh.pct }
    return map
  }, [result])

  const totalFiles = result?.sheets.reduce((s, sh) => s + sh.files, 0) ?? 0
  const totalPass  = result?.sheets.reduce((s, sh) => s + sh.pass,  0) ?? 0
  const totalFail  = result?.sheets.reduce((s, sh) => s + sh.fail,  0) ?? 0
  const totalPct   = totalFiles > 0 ? Math.round((totalPass / totalFiles) * 100) : 0

  const activeFilters = filterStatus !== "all" || filterModule !== "all" || filterSearch.trim() !== ""

  return (
    <div className="flex flex-col h-full">
      <Header title="Test Runner — Import Results" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* ── Upload card ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Upload Test Runner Report</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Supports multi-sheet xlsx — Functional, Integration, Unit, Structural, Performance, Api
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={handleClear}
                disabled={clearing || loading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {clearing ? "Clearing…" : "Clear Data"}
              </Button>
              <a href="/api/test-runner/template">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download Template
                </Button>
              </a>
              {result && (
                <a href="/api/test-runner/export">
                  <Button variant="outline" size="sm" className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Export Results
                  </Button>
                </a>
              )}
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-7 flex flex-col items-center gap-3 cursor-pointer transition-colors",
              dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50",
            )}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            <FileSpreadsheet className={cn("h-10 w-10", dragging ? "text-blue-500" : "text-gray-300")} />
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB — click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500">Drop your xlsx here or <span className="text-blue-600 font-medium">browse</span></p>
                <p className="text-xs text-gray-400 mt-1">Test Runner Report.xlsx</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className={cn(
              "flex items-center gap-2.5 cursor-pointer select-none px-3 py-2 rounded-lg border transition-colors",
              clearFirst
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300",
            )}>
              <input type="checkbox" checked={clearFirst} onChange={(e) => setClearFirst(e.target.checked)}
                className="accent-red-600 h-4 w-4 cursor-pointer" />
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">Reset all test item statuses to &ldquo;Open&rdquo; before import</span>
            </label>
            <Button onClick={handleImport} disabled={!file || loading} className="gap-2">
              <Upload className="h-4 w-4" />
              {loading ? "Importing…" : "Import Results"}
            </Button>
          </div>
        </div>

        {loadingResult && !result && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading last import…
          </div>
        )}

        {result && (
          <>
            {/* ── Summary bar ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              {/* File + import date meta row */}
              {(result.fileName || result.importedAt) && (
                <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                  {result.fileName && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span className="font-medium">{result.fileName}</span>
                    </div>
                  )}
                  {result.importedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span>Imported</span>
                      <span className="font-medium text-gray-600">
                        {new Date(result.importedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalPct}%</p>
                  <p className="text-xs text-gray-500">Overall Pass Rate</p>
                </div>
                <div className="flex-1 min-w-40">
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span className="text-green-600 font-medium">{totalPass} pass</span>
                    <span className="text-red-500 font-medium">{totalFail} fail</span>
                    <span>{totalFiles} files</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-700">{result.totalTestItemsUpdated}</span>
                  <span className="text-gray-500">test items updated</span>
                </div>
                {result.reset > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <RotateCcw className="h-4 w-4 text-orange-400" />
                    <span className="font-semibold text-orange-600">{result.reset}</span>
                    <span className="text-gray-500">reset to Open</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Module summary from Summary sheet ── */}
            {result.summaryRows.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Test Items Updated by Module</p>
                    <p className="text-xs text-gray-400 mt-0.5">Pass/fail per test type · Structural &amp; Performance aggregated from their sheets</p>
                  </div>
                  <span className="text-xs text-gray-400">{result.summaryRows.length} modules</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-center">
                      {/* Top header row — group labels */}
                      <tr>
                        <th className="px-3 py-2.5 text-left sticky left-0 bg-gray-50 z-10 border-r border-gray-200 min-w-36" rowSpan={2}>Module</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-100" colSpan={3}>⚡ Functional</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-100" colSpan={3}>🔗 Integration</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-100" colSpan={3}>🧩 Unit</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-100" colSpan={3}>🏗️ Structural</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-100" colSpan={3}>🚀 Performance</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-100" colSpan={3}>🌐 API</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-200" colSpan={3}>Total</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-200" rowSpan={2}>Pass %</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-200" rowSpan={2}>Status</th>
                        <th className="px-2 py-2 font-semibold border-l border-gray-100" rowSpan={2}>DB Updated</th>
                      </tr>
                      {/* Sub-header row */}
                      <tr className="border-t border-gray-100">
                        {/* Functional */}
                        <th className="px-2 py-1.5 font-medium text-gray-400 border-l border-gray-100">Files</th>
                        <th className="px-2 py-1.5 font-medium text-green-600">Pass</th>
                        <th className="px-2 py-1.5 font-medium text-red-500">Fail</th>
                        {/* Integration */}
                        <th className="px-2 py-1.5 font-medium text-gray-400 border-l border-gray-100">Files</th>
                        <th className="px-2 py-1.5 font-medium text-green-600">Pass</th>
                        <th className="px-2 py-1.5 font-medium text-red-500">Fail</th>
                        {/* Unit */}
                        <th className="px-2 py-1.5 font-medium text-gray-400 border-l border-gray-100">Files</th>
                        <th className="px-2 py-1.5 font-medium text-green-600">Pass</th>
                        <th className="px-2 py-1.5 font-medium text-red-500">Fail</th>
                        {/* Structural */}
                        <th className="px-2 py-1.5 font-medium text-gray-400 border-l border-gray-100">Files</th>
                        <th className="px-2 py-1.5 font-medium text-green-600">Pass</th>
                        <th className="px-2 py-1.5 font-medium text-red-500">Fail</th>
                        {/* Performance */}
                        <th className="px-2 py-1.5 font-medium text-gray-400 border-l border-gray-100">Files</th>
                        <th className="px-2 py-1.5 font-medium text-green-600">Pass</th>
                        <th className="px-2 py-1.5 font-medium text-red-500">Fail</th>
                        {/* API */}
                        <th className="px-2 py-1.5 font-medium text-gray-400 border-l border-gray-100">Files</th>
                        <th className="px-2 py-1.5 font-medium text-green-600">Pass</th>
                        <th className="px-2 py-1.5 font-medium text-red-500">Fail</th>
                        {/* Total */}
                        <th className="px-2 py-1.5 font-medium text-gray-400 border-l border-gray-200">Files</th>
                        <th className="px-2 py-1.5 font-medium text-green-600">Pass</th>
                        <th className="px-2 py-1.5 font-medium text-red-500">Fail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.summaryRows.map((m, i) => {
                        const pctNum  = parseInt(m.pct) || 0
                        const hasFail = m.totalFail > 0

                        function numCell(val: number, isPass?: boolean, isFail?: boolean) {
                          if (!val) return <span className="text-gray-200">—</span>
                          if (isPass) return <span className="text-green-600 font-medium">{val}</span>
                          if (isFail) return <span className="text-red-600 font-semibold">{val}</span>
                          return <span className="text-gray-500">{val}</span>
                        }

                        return (
                          <tr key={i} className={cn("hover:bg-gray-50 text-center", hasFail && "bg-red-50/20")}>
                            {/* Module */}
                            <td className="px-3 py-2 text-left font-semibold text-gray-800 sticky left-0 bg-white z-10 border-r border-gray-200">
                              {m.module}
                            </td>
                            {/* Functional */}
                            <td className="px-2 py-2 border-l border-gray-100">{numCell(m.functional.files)}</td>
                            <td className="px-2 py-2">{numCell(m.functional.pass, true)}</td>
                            <td className="px-2 py-2">{numCell(m.functional.fail, false, true)}</td>
                            {/* Integration */}
                            <td className="px-2 py-2 border-l border-gray-100">{numCell(m.integration.files)}</td>
                            <td className="px-2 py-2">{numCell(m.integration.pass, true)}</td>
                            <td className="px-2 py-2">{numCell(m.integration.fail, false, true)}</td>
                            {/* Unit */}
                            <td className="px-2 py-2 border-l border-gray-100">{numCell(m.unit.files)}</td>
                            <td className="px-2 py-2">{numCell(m.unit.pass, true)}</td>
                            <td className="px-2 py-2">{numCell(m.unit.fail, false, true)}</td>
                            {/* Structural */}
                            <td className="px-2 py-2 border-l border-gray-100">{numCell(m.structural.files)}</td>
                            <td className="px-2 py-2">{numCell(m.structural.pass, true)}</td>
                            <td className="px-2 py-2">{numCell(m.structural.fail, false, true)}</td>
                            {/* Performance */}
                            <td className="px-2 py-2 border-l border-gray-100">{numCell(m.performance.files)}</td>
                            <td className="px-2 py-2">{numCell(m.performance.pass, true)}</td>
                            <td className="px-2 py-2">{numCell(m.performance.fail, false, true)}</td>
                            {/* API */}
                            <td className="px-2 py-2 border-l border-gray-100">{numCell(m.api.files)}</td>
                            <td className="px-2 py-2">{numCell(m.api.pass, true)}</td>
                            <td className="px-2 py-2">{numCell(m.api.fail, false, true)}</td>
                            {/* Total */}
                            <td className="px-2 py-2 border-l border-gray-200 font-medium text-gray-700">{m.totalFiles || "—"}</td>
                            <td className="px-2 py-2">{numCell(m.totalPass, true)}</td>
                            <td className="px-2 py-2">{numCell(m.totalFail, false, true)}</td>
                            {/* Pass % */}
                            <td className="px-3 py-2 border-l border-gray-200 min-w-28">
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full", pctNum === 100 ? "bg-green-500" : pctNum >= 70 ? "bg-yellow-400" : "bg-red-400")}
                                    style={{ width: `${pctNum}%` }}
                                  />
                                </div>
                                <span className={cn("font-semibold",
                                  pctNum === 100 ? "text-green-600" : pctNum >= 70 ? "text-yellow-600" : "text-red-600",
                                )}>
                                  {m.pct}
                                </span>
                              </div>
                            </td>
                            {/* DB Status */}
                            <td className="px-2 py-2 border-l border-gray-200">
                              {m.testItemStatus === "—" ? (
                                <span className="text-gray-300">—</span>
                              ) : (
                                <span className={cn("inline-flex px-2 py-0.5 rounded font-semibold",
                                  m.testItemStatus === "Closed" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600",
                                )}>
                                  {m.testItemStatus}
                                </span>
                              )}
                            </td>
                            {/* DB updated count */}
                            <td className="px-2 py-2 border-l border-gray-100">
                              {m.testItemsUpdated > 0
                                ? <span className="font-semibold text-blue-600">{m.testItemsUpdated}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tabs + filter + table ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* Tab bar */}
              <div className="border-b border-gray-200 overflow-x-auto">
                <div className="flex min-w-max">
                  {/* All tab */}
                  <button
                    onClick={() => resetFilters("all")}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                      activeTab === "all"
                        ? "border-blue-500 text-blue-600 bg-blue-50/50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    📋 All
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                      activeTab === "all" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500",
                    )}>
                      {totalFiles}
                    </span>
                    {totalFail > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">
                        {totalFail} fail
                      </span>
                    )}
                  </button>

                  {/* Sheet tabs */}
                  {result.sheets.map((sh) => {
                    const active = activeTab === sh.label
                    return (
                      <button
                        key={sh.label}
                        onClick={() => resetFilters(sh.label)}
                        className={cn(
                          "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                          active
                            ? "border-blue-500 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        {SHEET_EMOJI[sh.label] ?? "📄"} {sh.label}
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                          active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500",
                        )}>
                          {sh.pct}%
                        </span>
                        {sh.fail > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">
                            {sh.fail} fail
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Filter bar */}
              <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-44">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search test file or module…"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                {/* Module dropdown */}
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <select
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-32"
                  >
                    <option value="all">All Modules</option>
                    {moduleOptions.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Status toggle */}
                <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs font-medium">
                  {(["all", "PASS", "FAIL"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={cn(
                        "px-3 h-8 transition-colors",
                        filterStatus === s
                          ? s === "PASS"
                            ? "bg-green-500 text-white"
                            : s === "FAIL"
                            ? "bg-red-500 text-white"
                            : "bg-gray-700 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50",
                      )}
                    >
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>

                {/* Row count + clear filters */}
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {visibleRows.length} of {tabRows.length} files
                  </span>
                  {activeFilters && (
                    <button
                      onClick={() => { setFilterStatus("all"); setFilterModule("all"); setFilterSearch("") }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      {activeTab === "all" && <th className="px-4 py-2.5 text-left font-medium">Sheet</th>}
                      <th className="px-4 py-2.5 text-left font-medium">Module</th>
                      <th className="px-4 py-2.5 text-left font-medium">Test File</th>
                      <th className="px-4 py-2.5 text-left font-medium">Status</th>
                      <th className="px-4 py-2.5 text-left font-medium">Pass</th>
                      <th className="px-4 py-2.5 text-left font-medium">Fail</th>
                      <th className="px-4 py-2.5 text-left font-medium">Duration</th>
                      <th className="px-4 py-2.5 text-left font-medium">Failed Tests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={activeTab === "all" ? 8 : 7} className="px-4 py-10 text-center text-xs text-gray-400">
                          No results match the current filters
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row, i) => {
                        const failKey = `${row.sheet}-${row.testFile}-${i}`
                        return (
                          <React.Fragment key={failKey}>
                            <tr
                              className={cn("hover:bg-gray-50", row.status !== "PASS" && "bg-red-50/30")}
                            >
                              {activeTab === "all" && (
                                <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                                  {SHEET_EMOJI[row.sheet] ?? "📄"} {row.sheet}
                                </td>
                              )}
                              <td className="px-4 py-2.5 text-xs font-medium text-gray-700">{row.module}</td>
                              <td className="px-4 py-2.5 font-mono text-xs text-gray-600 max-w-xs truncate">{row.testFile}</td>
                              <td className="px-4 py-2.5"><StatusBadge value={row.status} /></td>
                              <td className="px-4 py-2.5 text-xs text-green-600 font-medium">{row.casesPass}</td>
                              <td className="px-4 py-2.5 text-xs text-red-600 font-medium">{row.casesFail || "—"}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.duration || "—"}</td>
                              <td className="px-4 py-2.5 text-xs">
                                {row.failedTests ? (
                                  <button
                                    onClick={() => toggleFail(failKey)}
                                    className="flex items-center gap-1 text-red-600 hover:text-red-800"
                                  >
                                    {expandedFail.has(failKey) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {expandedFail.has(failKey) ? "hide" : "show"}
                                  </button>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            </tr>
                            {row.failedTests && expandedFail.has(failKey) && (
                              <tr className="bg-red-50">
                                <td colSpan={activeTab === "all" ? 8 : 7} className="px-6 pb-3 pt-1">
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {row.failedTests.split(/[,\n]+/).map((t, j) => (
                                      <li key={j} className="text-xs text-red-700 font-mono">{t.trim()}</li>
                                    ))}
                                  </ul>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
