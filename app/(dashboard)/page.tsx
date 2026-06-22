"use client"
import { useEffect, useState, useCallback } from "react"
import { Header } from "@/components/layout/header"
import { KpiCard } from "@/components/dashboard/kpi-card"
import {
  SeverityPieChart, StatusBarChart, VelocityLineChart,
  IssuesTimelineChart, OwnerWorkloadChart,
} from "@/components/dashboard/charts"
import { UserProgressTable, type UserProgressRow } from "@/components/dashboard/user-progress-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  ClipboardList, Bug, AlertTriangle, Zap,
  HeadphonesIcon, ListTodo, CheckSquare, Filter, X, GitPullRequestArrow, FileCheck2, Rocket,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface DashboardData {
  kpi: {
    totalRequirements: number
    openRequirements: number
    totalIssues: number
    openIssues: number
    totalTestItems: number
    openTestItems: number
    overdueItems: number
    latestVelocity: number
    latestSprintName: string
    openSupport: number
    openActions: number
    openChangeRequests: number
    pendingSignOffs: number
    signOffProgress: number
    nextGoLiveDate: string | null
    nextGoLiveTitle: string | null
    daysToGoLive: number | null
  }
  charts: {
    severityData: { name: string; value: number }[]
    reqStatusData: { name: string; value: number }[]
    velocityData: { sprint: string; planned: number; completed: number; velocity: number }[]
    timelineData: { date: string; opened: number; resolved: number }[]
    ownerData: { owner: string; open: number }[]
  }
  userProgress: UserProgressRow[]
}

interface UserOption { id: string; name: string; role: string }

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserOption[]>([])

  // filter state
  const [userId, setUserId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [applied, setApplied] = useState({ userId: "", fromDate: "", toDate: "" })
  const isFiltered = applied.userId || applied.fromDate || applied.toDate

  const fetchData = useCallback((f: typeof applied) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.userId)   params.set("userId", f.userId)
    if (f.fromDate) params.set("from",   f.fromDate)
    if (f.toDate)   params.set("to",     f.toDate)
    fetch(`/api/dashboard?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // fetch users for dropdown
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchData(applied) }, [fetchData, applied])

  const applyFilters = () => setApplied({ userId, fromDate, toDate })
  const resetFilters = () => {
    setUserId(""); setFromDate(""); setToDate("")
    setApplied({ userId: "", fromDate: "", toDate: "" })
  }

  const today = new Date()
  const kpi = data?.kpi

  const selectedUser = users.find((u) => u.id === applied.userId)

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Title + Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team Overview</h2>
              <p className="text-sm text-gray-500">{formatDate(today)} — Real-time project status</p>
            </div>
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mr-1">
              <Filter className="h-4 w-4" />
              Filters
            </div>

            {/* User filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Team Member</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="h-8 text-sm rounded-md border border-gray-200 bg-white px-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
              >
                <option value="">All Members</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 text-sm rounded-md border border-gray-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 text-sm rounded-md border border-gray-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 mt-auto">
              <Button size="sm" onClick={applyFilters} className="h-8 px-4">
                Apply
              </Button>
              {isFiltered && (
                <Button size="sm" variant="outline" onClick={resetFilters} className="h-8 px-3 gap-1">
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>

            {/* Active filter chips */}
            {isFiltered && (
              <div className="flex flex-wrap items-center gap-2 ml-1">
                {selectedUser && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {selectedUser.name}
                  </span>
                )}
                {(applied.fromDate || applied.toDate) && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    {applied.fromDate || "…"} → {applied.toDate || "today"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Requirements"
              value={kpi?.totalRequirements ?? 0}
              subtitle={`${kpi?.openRequirements ?? 0} open · ${(kpi?.totalRequirements ?? 0) - (kpi?.openRequirements ?? 0)} closed`}
              icon={ClipboardList}
              color="blue"
            />
            <KpiCard
              title="Issues"
              value={kpi?.totalIssues ?? 0}
              subtitle={`${kpi?.openIssues ?? 0} open · ${(kpi?.totalIssues ?? 0) - (kpi?.openIssues ?? 0)} closed`}
              icon={Bug}
              color="red"
            />
            <KpiCard
              title="Test Items"
              value={kpi?.totalTestItems ?? 0}
              subtitle={`${kpi?.openTestItems ?? 0} open`}
              icon={CheckSquare}
              color="green"
            />
            <KpiCard
              title="Overdue Items"
              value={kpi?.overdueItems ?? 0}
              subtitle="across all modules"
              icon={AlertTriangle}
              color="yellow"
            />
            <KpiCard
              title="Sprint Velocity"
              value={`${(kpi?.latestVelocity ?? 0).toFixed(0)}%`}
              subtitle={kpi?.latestSprintName ?? "—"}
              icon={Zap}
              color="purple"
            />
            <KpiCard
              title="Open Support"
              value={kpi?.openSupport ?? 0}
              subtitle="unresolved tickets"
              icon={HeadphonesIcon}
              color="green"
            />
            <KpiCard
              title="Action Items"
              value={kpi?.openActions ?? 0}
              subtitle="open items"
              icon={ListTodo}
              color="blue"
            />
            <KpiCard
              title="Open Issues"
              value={kpi?.openIssues ?? 0}
              subtitle={`${kpi?.totalIssues ? (((kpi.totalIssues - kpi.openIssues) / kpi.totalIssues) * 100).toFixed(0) : 0}% resolved`}
              icon={Bug}
              color="orange"
            />
            <KpiCard
              title="Change Requests"
              value={kpi?.openChangeRequests ?? 0}
              subtitle="open / in-review"
              icon={GitPullRequestArrow}
              color="purple"
            />
            <KpiCard
              title="Sign-Off Progress"
              value={`${kpi?.signOffProgress ?? 0}%`}
              subtitle={`${kpi?.pendingSignOffs ?? 0} items pending`}
              icon={FileCheck2}
              color="green"
            />
            <KpiCard
              title="Go-Live Countdown"
              value={kpi?.daysToGoLive != null ? (kpi.daysToGoLive <= 0 ? "Launched!" : `${kpi.daysToGoLive}d`) : "—"}
              subtitle={kpi?.nextGoLiveTitle ?? "No upcoming go-live"}
              icon={Rocket}
              color="red"
            />
          </div>
        )}

        {/* Charts Row 1 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SeverityPieChart data={data?.charts.severityData ?? []} />
            <StatusBarChart title="Requirements Status" description="By current status" data={data?.charts.reqStatusData ?? []} />
            <VelocityLineChart data={data?.charts.velocityData ?? []} />
          </div>
        )}

        {/* Charts Row 2 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <IssuesTimelineChart data={data?.charts.timelineData ?? []} />
            <OwnerWorkloadChart data={data?.charts.ownerData ?? []} />
            <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm p-6">
              More charts coming soon
            </div>
          </div>
        )}

        {/* User Progress Table */}
        {loading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <UserProgressTable
            data={data?.userProgress ?? []}
            highlightUserId={applied.userId || undefined}
          />
        )}

      </div>
    </div>
  )
}
