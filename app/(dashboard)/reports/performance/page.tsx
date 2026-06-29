"use client"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Trophy, AlertTriangle, TrendingUp, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const PERIODS = [
  { key: "weekly",    label: "Weekly"    },
  { key: "monthly",   label: "Monthly"   },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly",    label: "Yearly"    },
]

function gradeColor(grade: string) {
  switch (grade) {
    case "Excellent":      return "bg-green-100 text-green-700 border-green-200"
    case "Good":           return "bg-blue-100 text-blue-700 border-blue-200"
    case "Average":        return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "Needs Attention":return "bg-red-100 text-red-700 border-red-200"
    default:               return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

function scoreBar(score: number) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold w-7 text-right">{score}</span>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="text-xs font-bold text-gray-500 w-6 text-center">#{rank}</span>
}

export default function PerformancePage() {
  const [period, setPeriod]   = useState("monthly")
  const [report, setReport]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async (p = period) => {
    setLoading(true)
    const r = await fetch(`/api/reports/performance?period=${p}`)
    setReport(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const switchPeriod = (p: string) => {
    setPeriod(p)
    load(p)
  }

  const owners: any[]        = report?.owners ?? []
  const problems             = owners.filter((o) => o.problems.length > 0)
  const topPerformers        = owners.filter((o) => o.grade === "Excellent" || o.grade === "Good")
  const needsAttention       = owners.filter((o) => o.grade === "Needs Attention")

  return (
    <div className="flex flex-col h-full">
      <Header title="Owner Performance Analysis" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">Performance Rankings</h2>
            {report && <p className="text-sm text-gray-500">{report.period}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => switchPeriod(p.key)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors",
                    period === p.key
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : owners.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-400">No data for this period. Assign items to owners first.</CardContent></Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-2xl font-bold">{topPerformers.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Top Performers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <p className="text-2xl font-bold text-red-600">{needsAttention.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Needs Attention</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold">
                    {owners.length > 0 ? Math.round(owners.reduce((s, o) => s + o.score, 0) / owners.length) : 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Avg Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-2xl font-bold text-orange-600">
                    {owners.reduce((s, o) => s + o.overdue, 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Overdue</p>
                </CardContent>
              </Card>
            </div>

            {/* Problem alerts */}
            {problems.length > 0 && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Issues Detected
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-1.5">
                    {problems.map((o) => (
                      <div key={o.ownerId} className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-gray-800 min-w-[120px]">{o.name}</span>
                        <span className="text-red-700">{o.problems.join(" · ")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rankings table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Owner Rankings — {report?.period}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-xs text-gray-500">
                        <th className="text-left py-2 px-4 w-10">Rank</th>
                        <th className="text-left py-2 px-4">Owner</th>
                        <th className="text-right px-3">Assigned</th>
                        <th className="text-right px-3">Completed</th>
                        <th className="text-right px-3">Completion%</th>
                        <th className="text-right px-3">On-Time%</th>
                        <th className="text-right px-3">Overdue</th>
                        <th className="text-right px-3">Avg Days</th>
                        <th className="px-4 min-w-[140px]">Score</th>
                        <th className="text-left px-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {owners.map((o) => (
                        <tr key={o.ownerId} className={cn("hover:bg-gray-50 transition-colors", o.grade === "Needs Attention" && "bg-red-50/40")}>
                          <td className="py-2.5 px-4">
                            <RankBadge rank={o.rank} />
                          </td>
                          <td className="py-2.5 px-4 font-medium">{o.name}</td>
                          <td className="text-right px-3 text-gray-600">{o.assigned}</td>
                          <td className="text-right px-3 font-medium">{o.completed}</td>
                          <td className="text-right px-3">
                            <span className={cn("font-medium", o.completionRate >= 80 ? "text-green-600" : o.completionRate >= 50 ? "text-yellow-600" : "text-red-600")}>
                              {o.completionRate}%
                            </span>
                          </td>
                          <td className="text-right px-3">
                            {o.onTimeRate !== null
                              ? <span className={cn("font-medium", o.onTimeRate >= 80 ? "text-green-600" : o.onTimeRate >= 50 ? "text-yellow-600" : "text-red-600")}>{o.onTimeRate}%</span>
                              : <span className="text-gray-400">—</span>
                            }
                          </td>
                          <td className="text-right px-3">
                            <span className={cn("font-medium", o.overdue === 0 ? "text-green-600" : o.overdue <= 2 ? "text-yellow-600" : "text-red-600")}>
                              {o.overdue}
                            </span>
                          </td>
                          <td className="text-right px-3 text-gray-500">
                            {o.avgDays !== null ? `${o.avgDays}d` : "—"}
                          </td>
                          <td className="px-4 py-2.5 min-w-[140px]">
                            {scoreBar(o.score)}
                          </td>
                          <td className="px-3">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", gradeColor(o.grade))}>
                              {o.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Detail cards for each owner */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {owners.map((o) => (
                <Card key={o.ownerId} className={cn("relative", o.grade === "Needs Attention" && "border-red-200")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <RankBadge rank={o.rank} />
                        <div>
                          <p className="font-semibold text-sm">{o.name}</p>
                          <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium border", gradeColor(o.grade))}>{o.grade}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{o.score}</p>
                        <p className="text-xs text-gray-400">score</p>
                      </div>
                    </div>
                    <div className="mb-3">{scoreBar(o.score)}</div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="font-bold text-base">{o.assigned}</p>
                        <p className="text-gray-500">Assigned</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className={cn("font-bold text-base", o.completed > 0 ? "text-green-600" : "text-gray-400")}>{o.completed}</p>
                        <p className="text-gray-500">Completed</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className={cn("font-bold text-base", o.overdue === 0 ? "text-green-600" : "text-red-600")}>{o.overdue}</p>
                        <p className="text-gray-500">Overdue</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <p className={cn("font-bold text-base", o.completionRate >= 80 ? "text-green-600" : o.completionRate >= 50 ? "text-yellow-600" : "text-red-600")}>{o.completionRate}%</p>
                        <p className="text-gray-500">Completion</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        {o.onTimeRate !== null
                          ? <p className={cn("font-bold text-base", o.onTimeRate >= 80 ? "text-green-600" : o.onTimeRate >= 50 ? "text-yellow-600" : "text-red-600")}>{o.onTimeRate}%</p>
                          : <p className="font-bold text-base text-gray-400">—</p>
                        }
                        <p className="text-gray-500">On-Time</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="font-bold text-base text-gray-600">{o.avgDays !== null ? `${o.avgDays}d` : "—"}</p>
                        <p className="text-gray-500">Avg Close</p>
                      </div>
                    </div>
                    {o.problems.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-100 text-xs text-red-700">
                        {o.problems.map((p: string, i: number) => <p key={i}>• {p}</p>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
