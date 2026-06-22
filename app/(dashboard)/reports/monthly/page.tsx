"use client"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Pager, usePager } from "@/components/ui/pager"
import { exportMonthlyXLSX } from "@/lib/reports/export-xlsx"
import { Download, Send, RefreshCw, FileSpreadsheet } from "lucide-react"
import { StatusBadge } from "@/components/forms/tracker-table"
import { formatDate } from "@/lib/utils"

export default function MonthlyReportPage() {
  const { toast } = useToast()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const sprintsPager  = usePager(report?.sprints        ?? [], 10)
  const ticketsPager  = usePager(report?.supportTickets ?? [], 10)

  const load = async () => {
    setLoading(true)
    const r = await fetch("/api/reports/monthly")
    setReport(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function sendReport() {
    const res = await fetch("/api/reports/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "monthly", data: report }),
    })
    if (res.ok) toast({ title: "Monthly report sent!", variant: "success" })
    else toast({ title: "Failed to send", variant: "destructive" })
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Monthly Progress Report" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Monthly Report</h2>
            {report && <p className="text-sm text-gray-500">{report.period}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-4 w-4 mr-1" />Export</Button>
            <Button variant="outline" size="sm" onClick={() => report && exportMonthlyXLSX(report)} disabled={!report} className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"><FileSpreadsheet className="h-4 w-4 mr-1" />Export XLSX</Button>
            <Button size="sm" onClick={sendReport} disabled={loading}><Send className="h-4 w-4 mr-1" />Send to Manager</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : report && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Issues Raised",      value: report.summary.totalIssues     },
                { label: "Issues Resolved",    value: report.summary.resolvedIssues  },
                { label: "Resolution Rate",    value: `${report.summary.resolutionRate}%` },
                { label: "Reqs Opened",        value: report.summary.openedReqs      },
                { label: "Reqs Completed",     value: report.summary.closedReqs      },
                { label: "Avg Sprint Velocity",value: `${report.summary.avgVelocity}%` },
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
                  <CardTitle className="text-sm">Sprint Summary <span className="text-xs font-normal text-gray-400">({report.sprints.length})</span></CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-gray-500 border-b px-4">
                      <th className="text-left py-2 px-4">Sprint</th><th className="text-right px-4">Planned</th>
                      <th className="text-right px-4">Completed</th><th className="text-right px-4">Velocity</th><th className="text-right px-4">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {sprintsPager.visibleItems.map((s: any) => (
                        <tr key={s.id}>
                          <td className="py-2 px-4 font-medium">{s.sprintName}</td>
                          <td className="text-right px-4">{s.plannedStories}</td>
                          <td className="text-right px-4">{s.completedStories}</td>
                          <td className="text-right px-4 font-medium">{s.velocityPct.toFixed(0)}%</td>
                          <td className="text-right px-4"><StatusBadge value={s.sprintStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
                <Pager {...sprintsPager.pagerProps} />
              </Card>
            )}

            {report.supportTickets.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Support Tickets This Month <span className="text-xs font-normal text-gray-400">({report.supportTickets.length})</span></CardTitle>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="space-y-2">
                    {ticketsPager.visibleItems.map((t: any) => (
                      <div key={t.id} className="flex items-start gap-3 p-2 rounded bg-gray-50 text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-xs">{t.customer} — {t.product}</p>
                          <p className="text-xs text-gray-500">{t.requirement}</p>
                        </div>
                        <StatusBadge value={t.status} />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <Pager {...ticketsPager.pagerProps} />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
