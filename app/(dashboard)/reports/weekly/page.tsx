"use client"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Pager, usePager } from "@/components/ui/pager"
import { exportWeeklyXLSX } from "@/lib/reports/export-xlsx"
import { Download, Send, RefreshCw, FileSpreadsheet } from "lucide-react"

export default function WeeklyReportPage() {
  const { toast } = useToast()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const sprintsPager  = usePager(report?.sprints  ?? [], 10)
  const atRiskPager   = usePager(report?.atRisk   ?? [], 10)

  const load = async () => {
    setLoading(true)
    const r = await fetch("/api/reports/weekly")
    setReport(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function sendReport() {
    const res = await fetch("/api/reports/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "weekly", data: report }),
    })
    if (res.ok) toast({ title: "Weekly report sent!", variant: "success" })
    else toast({ title: "Failed to send", variant: "destructive" })
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Weekly Progress Report" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Weekly Report</h2>
            {report && <p className="text-sm text-gray-500">{report.period}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-4 w-4 mr-1" />Export</Button>
            <Button variant="outline" size="sm" onClick={() => report && exportWeeklyXLSX(report)} disabled={!report} className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"><FileSpreadsheet className="h-4 w-4 mr-1" />Export XLSX</Button>
            <Button size="sm" onClick={sendReport} disabled={loading}><Send className="h-4 w-4 mr-1" />Send to Manager</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : report && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Issues Opened",   value: report.summary.openedIssues   },
                { label: "Issues Resolved", value: report.summary.resolvedIssues },
                { label: "Reqs Opened",     value: report.summary.openedReqs     },
                { label: "Reqs Closed",     value: report.summary.closedReqs     },
                { label: "Open Support",    value: report.summary.openSupport    },
                { label: "At Risk",         value: report.summary.atRiskCount    },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {report.sprints.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sprints This Week <span className="text-xs font-normal text-gray-400">({report.sprints.length})</span></CardTitle>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="divide-y divide-gray-100">
                    {sprintsPager.visibleItems.map((s: any) => (
                      <div key={s.id} className="py-2 flex items-center justify-between text-sm">
                        <span className="font-medium">{s.sprintName}</span>
                        <span className={s.velocityPct >= 80 ? "text-green-600 font-medium" : "text-yellow-600"}>
                          {s.completedStories}/{s.plannedStories} stories · {s.velocityPct.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <Pager {...sprintsPager.pagerProps} />
              </Card>
            )}

            {report.atRisk.length > 0 && (
              <Card className="border-yellow-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-yellow-700">⚠ At-Risk Items <span className="text-xs font-normal text-yellow-500">({report.atRisk.length})</span></CardTitle>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="space-y-1">
                    {atRiskPager.visibleItems.map((i: any, idx: number) => (
                      <p key={idx} className="text-xs text-gray-600 p-2 bg-yellow-50 rounded">• Severity: {i.severity} — Days Open: {i.daysOpen}</p>
                    ))}
                  </div>
                </CardContent>
                <Pager {...atRiskPager.pagerProps} />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
