"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell, X, AlertCircle, Bug, ClipboardList, CheckSquare, HeadphonesIcon, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotifData {
  total: number
  actionItems: { id: string; type: string; description: string; status: string; dueDate: string | null }[]
  issues: { id: string; issueId: string; description: string; status: string; severity: string; dueDate: string | null }[]
  requirements: { id: string; reqId: string; requirement: string; status: string; priority: string; targetDate: string | null }[]
  testItems: { id: string; testId: string; issueTitle: string; status: string; priority: string; targetDate: string | null }[]
  support: { id: string; customer: string; requirement: string; status: string; priority: string; targetDate: string | null }[]
}

const statusColor: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  "Open":        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
}

function StatusChip({ status }: { status: string }) {
  return (
    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", statusColor[status] ?? "bg-gray-100 text-gray-600")}>
      {status}
    </span>
  )
}

interface SectionProps {
  icon: React.ReactNode
  title: string
  href: string
  items: { label: string; status: string }[]
}

function Section({ icon, title, href, items }: SectionProps) {
  if (!items.length) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
        {icon}
        <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{title}</span>
        <span className="ml-auto text-[10px] font-bold text-gray-400">{items.length}</span>
      </div>
      <ul className="divide-y divide-gray-50 dark:divide-slate-700/50">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
            <span className="flex-1 text-xs text-gray-700 dark:text-slate-300 line-clamp-2 leading-4 mt-0.5">{item.label}</span>
            <StatusChip status={item.status} />
          </li>
        ))}
      </ul>
      <Link href={href} className="block text-center text-[11px] text-blue-600 hover:underline px-3 py-1.5 border-t border-gray-100 dark:border-slate-700">
        View all →
      </Link>
    </div>
  )
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NotifData | null>(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/notifications")
      if (r.ok) setData(await r.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const count = data?.total ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notifications</span>
              {count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                  {count} active
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && !data && (
              <p className="text-xs text-center text-gray-400 py-6">Loading…</p>
            )}

            {data && count === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-slate-500">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-xs">No active or pending items</p>
              </div>
            )}

            {data && count > 0 && (
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                <Section
                  icon={<ListTodo className="h-3.5 w-3.5 text-orange-500" />}
                  title="Action Items"
                  href="/action-items"
                  items={data.actionItems.map((i) => ({ label: `${i.type}: ${i.description}`, status: i.status }))}
                />
                <Section
                  icon={<Bug className="h-3.5 w-3.5 text-red-500" />}
                  title="Issues"
                  href="/issues"
                  items={data.issues.map((i) => ({ label: `${i.issueId} — ${i.description}`, status: i.status }))}
                />
                <Section
                  icon={<ClipboardList className="h-3.5 w-3.5 text-blue-500" />}
                  title="Requirements"
                  href="/requirements"
                  items={data.requirements.map((i) => ({ label: `${i.reqId}: ${i.requirement}`, status: i.status }))}
                />
                <Section
                  icon={<CheckSquare className="h-3.5 w-3.5 text-green-500" />}
                  title="Test Items"
                  href="/test-items"
                  items={data.testItems.map((i) => ({ label: `${i.testId} — ${i.issueTitle}`, status: i.status }))}
                />
                <Section
                  icon={<HeadphonesIcon className="h-3.5 w-3.5 text-purple-500" />}
                  title="Support"
                  href="/support"
                  items={data.support.map((i) => ({ label: `${i.customer}: ${i.requirement}`, status: i.status }))}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          {data && count > 0 && (
            <div className="border-t border-gray-100 dark:border-slate-700 px-3 py-2 text-center">
              <p className="text-[11px] text-gray-400 dark:text-slate-500">
                Showing up to 10 items per module • refreshes every minute
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
