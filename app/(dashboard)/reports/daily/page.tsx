"use client"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Pager, usePager } from "@/components/ui/pager"
import { exportDailyXLSX } from "@/lib/reports/export-xlsx"
import { Download, Send, RefreshCw, FileSpreadsheet } from "lucide-react"

export default function DailyReportPage() {
  const { toast } = useToast()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const issuesPager = usePager(report?.details.updatedIssues ?? [], 10)
  const reqsPager   = usePager(report?.details.updatedReqs   ?? [], 10)
  const overduePager = usePager(report?.details.overdueIssues ?? [], 10)

  const load = async (date?: string) => {
    setLoading(true)
    const url = date ? `/api/reports/daily?date=${date}` : "/api/reports/daily"
    const r   = await fetch(url)
    setReport(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function sendReport() {
    setSending(true)
    const res = await fetch("/api/reports/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "daily", data: report }),
    })
    setSending(false)
    if (res.ok) toast({ title: "Report sent to manager!", variant: "success" })
    else toast({ title: "Failed to send report", variant: "destructive" })
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Daily Progress Report" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Daily Report</h2>
            {report && <p className="text-sm text-gray-500">{report.date}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => report && exportDailyXLSX(report)} disabled={!report} className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20">
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Export XLSX
            </Button>
            <Button size="sm" onClick={sendReport} disabled={sending || loading}>
              <Send className="h-4 w-4 mr-1" /> {sending ? "Sending…" : "Send to Manager"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : report && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Issues Updated",   value: report.summary.issuesUpdated   },
                { label: "Reqs Updated",     value: report.summary.reqsUpdated     },
                { label: "Tests Updated",    value: report.summary.testsUpdated    },
                { label: "New Issues",       value: report.summary.newIssues       },
                { label: "New Requirements", value: report.summary.newRequirements },
                { label: "Overdue Issues",   value: report.summary.overdueIssues   },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Updated Issues */}
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

            {/* Updated Requirements */}
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

            {/* Overdue */}
            {report.details.overdueIssues.length > 0 && (
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700">⚠ Overdue Issues <span className="text-xs font-normal text-red-400">({report.details.overdueIssues.length})</span></CardTitle>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="space-y-2">
                    {overduePager.visibleItems.map((i: any) => (
                      <div key={i.id} className="flex items-start gap-3 p-2 rounded-lg bg-red-50">
                        <Badge variant="danger" className="font-mono text-xs shrink-0">{i.issueId}</Badge>
                        <p className="text-xs text-gray-700 line-clamp-2 flex-1">{i.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <Pager {...overduePager.pagerProps} />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
