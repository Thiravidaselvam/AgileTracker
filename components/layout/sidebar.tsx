"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3, Bug, CheckSquare, Zap, HeadphonesIcon,
  ListTodo, FileBarChart, LayoutDashboard, ChevronLeft, ChevronRight,
  ClipboardList, Users, GitPullRequestArrow, FileCheck2, Rocket,
} from "lucide-react"
import { useState } from "react"

const nav = [
  { href: "/",              label: "Dashboard",         icon: LayoutDashboard },
  { href: "/requirements",  label: "Requirements",      icon: ClipboardList   },
  { href: "/issues",        label: "Issue Tracker",     icon: Bug             },
  { href: "/test-items",    label: "Test Items",        icon: CheckSquare     },
  { href: "/sprints",       label: "Sprint Tracker",    icon: Zap             },
  { href: "/support",       label: "Support",           icon: HeadphonesIcon  },
  { href: "/action-items",     label: "Action Items",     icon: ListTodo             },
  { href: "/change-requests",  label: "Change Requests",  icon: GitPullRequestArrow  },
  { href: "/sign-off",         label: "Sign-Off Docs",    icon: FileCheck2           },
  { href: "/go-live",          label: "Go-Live Checklist", icon: Rocket               },
  { href: "/users",            label: "User Management",  icon: Users                },
  { label: "Reports", icon: FileBarChart, sub: [
    { href: "/reports/progress",    label: "Reports"     },
    { href: "/reports/performance", label: "Performance" },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith("/reports"))

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-200 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-600 rounded-lg shrink-0">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
              Agile Tracker
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {nav.map((item, i) => {
          if (item.sub) {
            const active = pathname.startsWith("/reports")
            return (
              <div key={i}>
                <button
                  onClick={() => setReportsOpen(!reportsOpen)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                    active ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className={cn("h-3 w-3 transition-transform", reportsOpen && "rotate-90")} />
                    </>
                  )}
                </button>
                {!collapsed && reportsOpen && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {item.sub.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "block px-2 py-1.5 rounded-md text-sm transition-colors",
                          pathname === sub.href
                            ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                        )}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href!)
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                active ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
