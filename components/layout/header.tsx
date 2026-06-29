"use client"
import { useSession, signOut } from "next-auth/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LogOut, ChevronDown, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme/theme-provider"
import { NotificationBell } from "@/components/layout/notification-bell"

interface HeaderProps {
  title: string
}

const roleVariant: Record<string, "default" | "secondary" | "success"> = {
  ADMIN: "default",
  MANAGER: "success",
  MEMBER: "secondary",
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0">
      <h1 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h1>

      <div className="flex items-center gap-3">
        <NotificationBell />
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100 focus:outline-none">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{session.user.name}</p>
              </div>
              <Badge variant={roleVariant[session.user.role] ?? "secondary"} className="hidden sm:inline-flex text-xs">
                {session.user.role}
              </Badge>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{session.user.email}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={toggle} className="cursor-pointer gap-2">
                {theme === "dark" ? (
                  <><Sun className="h-4 w-4" /> Light Mode</>
                ) : (
                  <><Moon className="h-4 w-4" /> Dark Mode</>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
