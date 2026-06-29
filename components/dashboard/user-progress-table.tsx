"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ModuleStat { open: number; closed: number; total: number }

export interface UserProgressRow {
  userId:       string
  name:         string
  role:         string
  requirements: ModuleStat
  issues:       ModuleStat
  testItems:    ModuleStat
  support:      ModuleStat
  actions:      ModuleStat
}

const roleColor: Record<string, string> = {
  ADMIN:   "bg-blue-100 text-blue-700",
  MANAGER: "bg-green-100 text-green-700",
  MEMBER:  "bg-gray-100 text-gray-600",
}

function StatCell({ stat }: { stat: ModuleStat }) {
  if (stat.total === 0) return <span className="text-gray-300 text-xs">—</span>
  return (
    <div className="text-xs leading-tight">
      <span className="font-semibold text-gray-800">{stat.total}</span>
      <span className="text-gray-400"> ({stat.open} open)</span>
    </div>
  )
}

function ProgressBar({ stat }: { stat: ModuleStat }) {
  if (stat.total === 0) return null
  const pct = Math.round((stat.closed / stat.total) * 100)
  return (
    <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
      <div
        className={cn("h-1 rounded-full", pct === 100 ? "bg-green-500" : "bg-blue-500")}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

interface UserProgressTableProps {
  data: UserProgressRow[]
  highlightUserId?: string
}

export function UserProgressTable({ data, highlightUserId }: UserProgressTableProps) {
  const totalOpen = (row: UserProgressRow) =>
    row.requirements.open + row.issues.open + row.testItems.open + row.support.open + row.actions.open
  const totalAll = (row: UserProgressRow) =>
    row.requirements.total + row.issues.total + row.testItems.total + row.support.total + row.actions.total

  const sorted = [...data].sort((a, b) => totalOpen(b) - totalOpen(a))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">User-wise Progress</CardTitle>
        <CardDescription className="text-xs">Open vs closed items per team member</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5 w-44">Member</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2.5">Reqs</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2.5">Issues</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2.5">Tests</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2.5">Support</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2.5">Actions</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2.5 w-28">Total Progress</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const open  = totalOpen(row)
                const total = totalAll(row)
                const pct   = total > 0 ? Math.round(((total - open) / total) * 100) : 0
                const isHighlighted = highlightUserId === row.userId
                return (
                  <tr
                    key={row.userId}
                    className={cn(
                      "border-b border-gray-50 hover:bg-gray-50 transition-colors",
                      isHighlighted && "bg-blue-50 hover:bg-blue-50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold shrink-0">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{row.name}</p>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", roleColor[row.role] ?? roleColor.MEMBER)}>
                            {row.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatCell stat={row.requirements} />
                      <ProgressBar stat={row.requirements} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatCell stat={row.issues} />
                      <ProgressBar stat={row.issues} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatCell stat={row.testItems} />
                      <ProgressBar stat={row.testItems} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatCell stat={row.support} />
                      <ProgressBar stat={row.support} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatCell stat={row.actions} />
                      <ProgressBar stat={row.actions} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn("text-xs font-bold", pct === 100 ? "text-green-600" : open > 0 ? "text-orange-500" : "text-gray-400")}>
                          {total > 0 ? `${pct}%` : "—"}
                        </span>
                        {total > 0 && (
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={cn("h-1.5 rounded-full", pct === 100 ? "bg-green-500" : "bg-blue-500")}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                        {total > 0 && (
                          <span className="text-[10px] text-gray-400">{total - open}/{total} done</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
