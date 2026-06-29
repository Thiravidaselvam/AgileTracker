import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "dd-MMM-yy")
}

export function calcDaysOpen(openDate: Date | string): number {
  return differenceInDays(new Date(), new Date(openDate))
}

export function priorityColor(priority: string) {
  switch (priority?.toUpperCase()) {
    case "HIGH":   return "bg-red-100 text-red-700 border-red-200"
    case "MEDIUM": return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "LOW":    return "bg-green-100 text-green-700 border-green-200"
    default:       return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export function statusColor(status: string) {
  const s = status?.toLowerCase()
  if (["completed", "fixed", "closed", "done", "resolved"].includes(s))
    return "bg-green-100 text-green-700 border-green-200"
  if (["inprogress", "in progress", "in_progress", "open"].includes(s))
    return "bg-blue-100 text-blue-700 border-blue-200"
  if (["overdue", "blocked"].includes(s))
    return "bg-red-100 text-red-700 border-red-200"
  return "bg-gray-100 text-gray-700 border-gray-200"
}

export function severityColor(severity: string) {
  switch (severity?.toUpperCase()) {
    case "HIGH":   return "bg-red-100 text-red-700 border-red-200"
    case "MEDIUM": return "bg-orange-100 text-orange-700 border-orange-200"
    case "LOW":    return "bg-green-100 text-green-700 border-green-200"
    default:       return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export function generateId(prefix: string, count: number): string {
  return `${prefix}-${String(count).padStart(3, "0")}`
}
