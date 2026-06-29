"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total]
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total]
  return [1, "…", current - 1, current, current + 1, "…", total]
}

interface PagerProps {
  page: number
  totalPages: number
  total: number
  rowsPerPage: number
  onPageChange: (p: number) => void
  onRowsPerPageChange: (n: number) => void
}

export function Pager({ page, totalPages, total, rowsPerPage, onPageChange, onRowsPerPageChange }: PagerProps) {
  if (total === 0) return null
  const from = (page - 1) * rowsPerPage + 1
  const to   = Math.min(page * rowsPerPage, total)

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex-wrap rounded-b-xl">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => { onRowsPerPageChange(Number(e.target.value)); onPageChange(1) }}
          className="border border-gray-200 dark:border-slate-600 rounded px-1.5 py-1 text-xs bg-white dark:bg-slate-900 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <span className="text-xs text-gray-500 dark:text-slate-400">{from}–{to} of {total}</span>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPageChange(1)} disabled={page === 1}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {buildPages(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
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
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function usePager<T>(items: T[], initialPageSize = 10) {
  const [page, setPage]               = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize)

  useEffect(() => { setPage(1) }, [items])

  const totalPages   = Math.max(1, Math.ceil(items.length / rowsPerPage))
  const visibleItems = items.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const pagerProps: PagerProps = {
    page, totalPages, total: items.length, rowsPerPage,
    onPageChange: setPage, onRowsPerPageChange: setRowsPerPage,
  }

  return { visibleItems, pagerProps }
}
