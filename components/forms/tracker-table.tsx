"use client"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { priorityColor, statusColor, severityColor, formatDate } from "@/lib/utils"
import { Pencil, Trash2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export interface FilterConfig {
  getVal: (row: any) => string
}

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
  filter?: FilterConfig
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface TrackerTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  onEdit?: (row: T) => void
  onDelete?: (id: string) => void
  loading?: boolean
  pageSize?: number
}

export function TrackerTable<T extends { id: string }>({
  columns, data, onEdit, onDelete, loading, pageSize: initialPageSize,
}: TrackerTableProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize ?? 20)
  const paginated = initialPageSize != null

  const hasFilters = Object.values(filters).some(Boolean)

  // Build unique option lists from the full (unfiltered) dataset
  const optionMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    columns.forEach((col) => {
      if (!col.filter) return
      const key = String(col.key)
      const vals = [...new Set(
        data.map((row) => col.filter!.getVal(row as any)).filter(Boolean)
      )].sort()
      map[key] = vals
    })
    return map
  }, [data, columns])

  // Apply active filters
  const filtered = useMemo(() => {
    if (!hasFilters) return data
    return data.filter((row) =>
      columns.every((col) => {
        const val = filters[String(col.key)]
        if (!val || !col.filter) return true
        return col.filter.getVal(row as any) === val
      })
    )
  }, [data, filters, columns, hasFilters])

  // Reset to page 1 whenever the filtered set changes
  useEffect(() => { setPage(1) }, [filters, data])

  const totalPages = paginated ? Math.max(1, Math.ceil(filtered.length / rowsPerPage)) : 1
  const visibleRows = paginated
    ? filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    : filtered

  const setFilter = (key: string, val: string) =>
    setFilters((prev) => ({ ...prev, [key]: val }))

  const clearFilters = () => setFilters({})

  const filterableCount = columns.filter((c) => c.filter).length

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-sm">No records found</p>
      </div>
    )
  }

  return (
    <div>
      {/* Active-filter summary bar */}
      {hasFilters && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
          <span>Showing <strong>{filtered.length}</strong> of {data.length} records</span>
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            <X className="h-3 w-3" /> Clear all filters
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {/* Column header row */}
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>

            {/* Filter row */}
            {filterableCount > 0 && (
              <tr className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {columns.map((col) => {
                  const key   = String(col.key)
                  const opts  = optionMap[key] ?? []
                  const value = filters[key] ?? ""
                  return (
                    <td key={`f-${key}`} className="px-2 py-1.5">
                      {col.filter ? (
                        <select
                          value={value}
                          onChange={(e) => setFilter(key, e.target.value)}
                          className={`w-full text-xs border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600 min-w-[90px] ${
                            value
                              ? "border-blue-400 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-slate-800"
                              : "border-gray-200 text-gray-600 dark:border-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <option value="">All</option>
                          {opts.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : null}
                    </td>
                  )
                })}
                {(onEdit || onDelete) && <td className="px-2 py-1.5" />}
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center py-12 text-gray-400 text-sm">
                  No records match the current filters.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-4 py-3 ${col.className ?? ""}`}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? "—")}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button variant="ghost" size="icon" onClick={() => onEdit(row)} className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="icon" onClick={() => onDelete(row.id)} className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {paginated && filtered.length > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex-wrap">
          {/* Rows-per-page */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-gray-200 dark:border-slate-600 rounded px-1.5 py-1 text-xs bg-white dark:bg-slate-900 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Range label */}
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}
          </span>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={page === 1}>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {buildPageNumbers(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`h-7 min-w-[28px] px-2 rounded text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total]
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total]
  return [1, "…", current - 1, current, current + 1, "…", total]
}

export function PriorityBadge({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityColor(value)}`}>{value}</span>
}

export function StatusBadge({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(value)}`}>{value}</span>
}

export function SeverityBadge({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColor(value)}`}>{value}</span>
}
