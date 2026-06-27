"use client"
import { useEffect, useState, useCallback } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Pager, usePager } from "@/components/ui/pager"
import { exportDailyXLSX, exportProgressXLSX } from "@/lib/reports/export-xlsx"
import { exportManagerSummaryXLSX } from "@/lib/reports/export-xlsx-styled"
import { printDailyReport, printRangeReport } from "@/lib/reports/print-report"
import { formatDate } from "@/lib/utils"
import { Download, Send, FileSpreadsheet, RefreshCw } from "lucide-react"
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  subWeeks, subMonths, format,
} from "date-fns"

// ── date helpers ──────────────────────────────────────────────────────────────

function toInput(d: Date) { return format(d, "yyyy-MM-dd") }

const PRESETS = [
  { key: "today",      label: "Today"         },
  { key: "this-week",  label: "This Week"     },
  { key: "last-week",  label: "Last Week"     },
  { key: "this-month", label: "This Month"    },
  { key: "last-month", label: "Last Month"    },
  { key: "this-qtr",   label: "This Quarter"  },
  { key: "this-year",  label: "This Year"     },
]

function presetRange(key: string): [string, string] {
  const n = new Date()
  switch (key) {
    case "today":      return [toInput(n), toInput(n)]
    case "this-week":  return [toInput(startOfWeek(n, { weekStartsOn: 1 })), toInput(endOfWeek(n, { weekStartsOn: 1 }))]
    case "last-week":  { const w = subWeeks(n, 1); return [toInput(startOfWeek(w, { weekStartsOn: 1 })), toInput(endOfWeek(w, { weekStartsOn: 1 }))] }
    case "this-month": return [toInput(startOfMonth(n)), toInput(endOfMonth(n))]
    case "last-month": { const m = subMonths(n, 1); return [toInput(startOfMonth(m)), toInput(endOfMonth(m))] }
    case "this-qtr":   return [toInput(startOfQuarter(n)), toInput(endOfQuarter(n))]
    case "this-year":  return [toInput(startOfYear(n)), toInput(endOfYear(n))]
    default:           return [toInput(startOfMonth(n)), toInput(endOfMonth(n))]
  }
}

// ── utilities ─────────────────────────────────────────────────────────────────

function countBy(items: any[], key = "status"): Record<string, number> {
  return items.reduce((a, r) => { const s = r[key] || "—"; a[s] = (a[s] || 0) + 1; return a }, {})
}

function statusColor(s: string) {
  const v = s.toLowerCase()
  if (v === "open")                                                    return "bg-blue-100 text-blue-700"
  if (v.includes("progress") || v === "active" || v === "planning")   return "bg-yellow-100 text-yellow-700"
  if (v === "fixed")                                                   return "bg-teal-100 text-teal-700"
  if (["completed", "resolved", "closed", "passed", "done"].includes(v)) return "bg-green-100 text-green-700"
  if (v === "cancelled")                                               return "bg-red-100 text-red-600"
  return "bg-gray-100 text-gray-600"
}

function StatusPills({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(counts).map(([s, c]) => (
        <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s)}`}>
          {s} <span className="font-bold">{c}</span>
        </span>
      ))}
    </div>
  )
}

function buildOwnerGroups(report: any) {
  const map = new Map<string, { reqs: any[]; issues: any[]; support: any[]; actions: any[] }>()
  const init = () => ({ reqs: [], issues: [], support: [], actions: [] })
  const add  = (items: any[], field: keyof ReturnType<typeof init>, name: (r: any) => string) =>
    items.forEach(r => { const k = name(r); if (!map.has(k)) map.set(k, init()); (map.get(k)! as any)[field].push(r) })

  add(report.requirements   || [], "reqs",    r => r.owner?.name ?? "Unassigned")
  add(report.issues         || [], "issues",  r => r.owner?.name ?? "Unassigned")
  add(report.supportTickets || [], "support", r => r.owner?.name ?? "Unassigned")
  add(report.actionItems    || [], "actions", r => r.owner?.name ?? "Unassigned")

  return [...map.entries()]
    .map(([name, d]) => ({ name, ...d, total: d.reqs.length + d.issues.length + d.support.length + d.actions.length }))
    .filter(o => o.total > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function buildTesterGroups(report: any) {
  const map = new Map<string, any[]>()
  ;(report.testItems || []).forEach((t: any) => {
    const k = t.testedBy || "Unassigned"
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(t)
  })
  return [...map.entries()].map(([name, items]) => ({ name, items })).sort((a, b) => a.name.localeCompare(b.name))
}

const STATUS_MODULES = [
  { key: "requirements",   label: "Requirements"    },
  { key: "issues",         label: "Issues"          },
  { key: "testItems",      label: "Test Items"      },
  { key: "supportTickets", label: "Support Tickets" },
  { key: "actionItems",    label: "Action Items"    },
  { key: "sprints",        label: "Sprints"         },
]

const KPI_META: Record<string, string> = {
  openedIssues: "Issues Opened", resolvedIssues: "Issues Resolved",
  openedReqs: "Reqs Opened", closedReqs: "Reqs Closed",
  openSupport: "Open Support", atRiskCount: "At Risk",
  totalTestItems: "Test Items", avgVelocity: "Avg Velocity %",
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { toast } = useToast()
  const [active,  setActive]  = useState("this-month")
  const [from,    setFrom]    = useState(() => presetRange("this-month")[0])
  const [to,      setTo]      = useState(() => presetRange("this-month")[1])
  const [report,  setReport]  = useState<any>(null)
  const [type,    setType]    = useState<"daily" | "range">("range")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const load = useCallback(async (preset: string, f: string, t: string) => {
    setLoading(true)
    setReport(null)
    try {
      if (preset === "today") {
        const r = await fetch("/api/reports/daily")
        setReport(await r.json())
        setType("daily")
      } else {
        const r = await fetch(`/api/reports/range?from=${f}&to=${t}`)
        setReport(await r.json())
        setType("range")
      }
    } catch {
      toast({ title: "Failed to load report", variant: "destructive" })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { load("this-month", from, to) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function selectPreset(key: string) {
    const [f, t] = presetRange(key)
    setActive(key); setFrom(f); setTo(t)
    load(key, f, t)
  }

  async function sendReport() {
    if (!report) return
    setSending(true)
    const res = await fetch("/api/reports/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: type === "daily" ? "daily" : "progress", data: report }),
    })
    setSending(false)
    if (res.ok) toast({ title: "Report sent to manager!", variant: "success" })
    else        toast({ title: "Failed to send", variant: "destructive" })
  }

  function doExportXLSX() {
    if (!report) return
    if (type === "daily") exportDailyXLSX(report)
    else                  exportProgressXLSX(report)
  }

  function doPrint() {
    if (!report) return
    if (type === "daily") printDailyReport(report)
    else                  printRangeReport(report)
  }

  const ownerGroups  = (type === "range" && report) ? buildOwnerGroups(report)  : []
  const testerGroups = (type === "range" && report) ? buildTesterGroups(report) : []

  const ownersPager  = usePager(ownerGroups,           6)
  const testersPager = usePager(testerGroups,          6)
  const sprintsPager = usePager(report?.sprints ?? [], 10)
  const atRiskPager  = usePager(report?.atRisk  ?? [], 10)

  // daily-specific pagers
  const issuesPager  = usePager(report?.details?.updatedIssues  ?? [], 10)
  const reqsPager    = usePager(report?.details?.updatedReqs    ?? [], 10)
  const overduePager = usePager(report?.details?.overdueIssues  ?? [], 10)

  const periodLabel = type === "daily" ? report?.date : report?.period

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* ── Controls ── */}
        <Card className="no-print">
          <CardContent className="p-4 space-y-3">
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => selectPreset(p.key)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                    active === p.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">From</p>
                <Input type="date" value={from}
                  onChange={e => { setFrom(e.target.value); setActive("custom") }}
                  className="w-36 h-8 text-sm" />
              </div>
              <span className="text-gray-400 pb-1">–</span>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">To</p>
                <Input type="date" value={to} min={from}
                  onChange={e => { setTo(e.target.value); setActive("custom") }}
                  className="w-36 h-8 text-sm" />
              </div>
              {active === "custom" && (
                <Button onClick={() => load("custom", from, to)} disabled={loading} className="h-8">
                  {loading ? "Loading…" : "Generate"}
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8 ml-auto"
                onClick={() => load(active, from, to)} disabled={loading}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
              {report && (
                <>
                  <Button variant="outline" size="sm" className="h-8 text-green-700 border-green-300 hover:bg-green-50"
                    onClick={doExportXLSX}>
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Export XLSX
                  </Button>
                  {type === "range" && (
                    <Button variant="outline" size="sm" className="h-8 text-blue-700 border-blue-300 hover:bg-blue-50"
                      onClick={() => exportManagerSummaryXLSX(report)}>
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Manager Summary
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8" onClick={doPrint}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Print / PDF
                  </Button>
                  <Button size="sm" className="h-8" onClick={sendReport} disabled={sending}>
                    <Send className="h-3.5 w-3.5 mr-1" /> {sending ? "Sending…" : "Send to Manager"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        )}

        {!loading && !report && (
          <div className="text-center py-16 text-gray-400">
            Select a period above to generate the report.
          </div>
        )}

        {!loading && report && (
          <>
            {/* Print header — hidden on screen, shown when printing */}
            <div className="hidden print:block mb-4">
              <p className="print-title">Progress Report — {periodLabel}</p>
              <p style={{ fontSize: "10pt", color: "#666" }}>Generated: {new Date().toLocaleString()}</p>
            </div>

            {periodLabel && (
              <p className="text-sm font-medium text-gray-500 no-print">{periodLabel}</p>
            )}

            {/* ══════════════════════ DAILY VIEW ══════════════════════ */}
            {type === "daily" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "Issues Updated",   value: report.summary.issuesUpdated   },
                    { label: "Reqs Updated",     value: report.summary.reqsUpdated     },
                    { label: "Tests Updated",    value: report.summary.testsUpdated    },
                    { label: "New Issues",       value: report.summary.newIssues       },
                    { label: "New Requirements", value: report.summary.newRequirements },
                    { label: "Overdue Issues",   value: report.summary.overdueIssues,  red: true },
                  ].map((item: any) => (
                    <Card key={item.label}>
                      <CardContent className="p-4 text-center">
                        <p className={`text-2xl font-bold ${item.red && item.value > 0 ? "text-red-600" : "text-gray-900"}`}>{item.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {report.details.updatedIssues.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Issues Updated Today <span className="text-xs font-normal text-gray-400">({report.details.updatedIssues.length})</span></CardTitle>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="space-y-2">
                        {issuesPager.visibleItems.map((i: any) => (
                          <div key={i.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                            <Badge variant="outline" className="font-mono text-xs shrink-0">{i.issueId}</Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 line-clamp-2">{i.description}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Owner: {i.owner?.name ?? "—"} · Status: {i.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <Pager {...issuesPager.pagerProps} />
                  </Card>
                )}

                {report.details.updatedReqs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Requirements Updated Today <span className="text-xs font-normal text-gray-400">({report.details.updatedReqs.length})</span></CardTitle>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="space-y-2">
                        {reqsPager.visibleItems.map((r: any) => (
                          <div key={r.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                            <Badge variant="outline" className="font-mono text-xs shrink-0">{r.reqId}</Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 line-clamp-2">{r.requirement}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Status: {r.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <Pager {...reqsPager.pagerProps} />
                  </Card>
                )}

                {report.details.overdueIssues.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-700">⚠ Overdue Issues <span className="text-xs font-normal text-red-400">({report.details.overdueIssues.length})</span></CardTitle>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="space-y-2">
                        {overduePager.visibleItems.map((i: any) => (
                          <div key={i.id} className="flex items-start gap-3 p-2 rounded-lg bg-red-50">
                            <Badge variant="outline" className="font-mono text-xs shrink-0 border-red-200 text-red-600">{i.issueId}</Badge>
                            <p className="text-xs text-gray-700 line-clamp-2 flex-1">{i.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <Pager {...overduePager.pagerProps} />
                  </Card>
                )}

                {report.details.updatedIssues.length === 0 && report.details.updatedReqs.length === 0 && report.details.overdueIssues.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">No activity recorded today.</div>
                )}
              </>
            )}

            {/* ══════════════════════ RANGE VIEW ══════════════════════ */}
            {type === "range" && (
              <>
                {/* Module Status Summary */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Module Status Summary <span className="text-xs font-normal text-gray-400">(all-time totals)</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {STATUS_MODULES.map(({ key, label }) => {
                      const counts = report.statusSummary?.[key] || {}
                      const total  = Object.values(counts).reduce((s: any, v: any) => s + v, 0) as number
                      return (
                        <Card key={key}>
                          <CardHeader className="py-2 px-4 pb-0">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xs font-semibold text-gray-600">{label}</CardTitle>
                              <span className="text-xs text-gray-400">{total} total</span>
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 py-3">
                            <StatusPills counts={counts} />
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* KPI Summary */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Period Summary <span className="text-xs font-normal text-gray-400">({report.period})</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {Object.entries(report.summary).map(([key, val]) => (
                      <Card key={key}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xl font-bold text-gray-900">{val as any}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{KPI_META[key] ?? key}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* At-Risk Items */}
                {report.atRisk?.length > 0 && (
                  <Card className="border-yellow-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-yellow-700">⚠ At-Risk Items <span className="text-xs font-normal text-yellow-500">({report.atRisk.length})</span></CardTitle>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="space-y-1">
                        {atRiskPager.visibleItems.map((i: any, idx: number) => (
                          <p key={idx} className="text-xs text-gray-600 p-2 bg-yellow-50 rounded">
                            • Severity: {i.severity} — Days Open: {i.daysOpen}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                    <Pager {...atRiskPager.pagerProps} />
                  </Card>
                )}

                {/* Owner-wise Progress */}
                {ownerGroups.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">
                      Owner-wise Progress <span className="text-xs font-normal text-gray-400">({ownerGroups.length} owners)</span>
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {ownersPager.visibleItems.map((owner: any) => (
                        <Card key={owner.name}>
                          <CardHeader className="py-2 px-4 pb-1 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-semibold">{owner.name}</CardTitle>
                              <span className="text-xs text-gray-400">{owner.total} items</span>
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 py-2">
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-gray-400 border-b border-gray-100">
                                  <th className="text-left py-1 font-medium">Module</th>
                                  <th className="text-center py-1 font-medium w-10">Total</th>
                                  <th className="text-left py-1 font-medium pl-3">Status Breakdown</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { label: "Requirements", items: owner.reqs    },
                                  { label: "Issues",       items: owner.issues  },
                                  { label: "Support",      items: owner.support },
                                  { label: "Action Items", items: owner.actions },
                                ].filter(r => r.items.length > 0).map(({ label, items }) => (
                                  <tr key={label} className="border-b border-gray-50 last:border-0">
                                    <td className="py-2 pr-3 text-xs font-medium text-gray-600 whitespace-nowrap w-32">{label}</td>
                                    <td className="py-2 pr-4 text-xs font-bold text-center w-12">{items.length}</td>
                                    <td className="py-2"><StatusPills counts={countBy(items)} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden">
                      <Pager {...ownersPager.pagerProps} />
                    </div>
                  </div>
                )}

                {/* Tester-wise Progress */}
                {testerGroups.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">
                      Tester-wise Progress <span className="text-xs font-normal text-gray-400">({testerGroups.length} testers)</span>
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {testersPager.visibleItems.map((tester: any) => {
                        const ownerCounts: Record<string, number> = {}
                        tester.items.forEach((item: any) => {
                          const owner = item.owner?.name ?? "Unassigned"
                          ownerCounts[owner] = (ownerCounts[owner] || 0) + 1
                        })
                        const ownerEntries = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1])

                        return (
                          <Card key={tester.name}>
                            <CardHeader className="py-2 px-4 pb-1 border-b border-gray-100">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold">{tester.name}</CardTitle>
                                <span className="text-xs text-gray-400">{tester.items.length} test item{tester.items.length !== 1 ? "s" : ""}</span>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 py-3 space-y-2">
                              <StatusPills counts={countBy(tester.items)} />
                              {ownerEntries.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">By Owner</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {ownerEntries.map(([ownerName, count]) => (
                                      <span key={ownerName} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                                        {ownerName} <span className="font-bold">{count}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                    <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden">
                      <Pager {...testersPager.pagerProps} />
                    </div>
                  </div>
                )}

                {/* Sprints */}
                {report.sprints?.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">
                      Sprints in Period <span className="text-xs font-normal text-gray-400">({report.sprints.length})</span>
                    </h2>
                    <Card>
                      <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-gray-500">
                              {["Sprint", "Start", "End", "Planned", "Completed", "Velocity", "Status"].map(h => (
                                <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {sprintsPager.visibleItems.map((s: any) => (
                              <tr key={s.id}>
                                <td className="px-4 py-2 font-medium">{s.sprintName}</td>
                                <td className="px-4 py-2">{formatDate(s.startDate)}</td>
                                <td className="px-4 py-2">{formatDate(s.endDate)}</td>
                                <td className="px-4 py-2">{s.plannedStories}</td>
                                <td className="px-4 py-2">{s.completedStories}</td>
                                <td className="px-4 py-2 font-medium">
                                  <span className={s.velocityPct >= 80 ? "text-green-600" : s.velocityPct >= 60 ? "text-yellow-600" : "text-red-600"}>
                                    {s.velocityPct.toFixed(0)}%
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <StatusPills counts={{ [s.sprintStatus]: 1 }} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                      <Pager {...sprintsPager.pagerProps} />
                    </Card>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
