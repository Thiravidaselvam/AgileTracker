import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "orange"
  trend?: { value: number; label: string }
}

const colors = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-600",   text: "text-blue-600"   },
  green:  { bg: "bg-green-50",  icon: "bg-green-600",  text: "text-green-600"  },
  red:    { bg: "bg-red-50",    icon: "bg-red-600",    text: "text-red-600"    },
  yellow: { bg: "bg-yellow-50", icon: "bg-yellow-500", text: "text-yellow-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-600", text: "text-purple-600" },
  orange: { bg: "bg-orange-50", icon: "bg-orange-500", text: "text-orange-600" },
}

export function KpiCard({ title, value, subtitle, icon: Icon, color = "blue", trend }: KpiCardProps) {
  const c = colors[color]
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {trend && (
              <p className={cn("text-xs font-medium mt-1", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
                {trend.value >= 0 ? "+" : ""}{trend.value} {trend.label}
              </p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-lg shrink-0", c.bg)}>
            <Icon className={cn("h-5 w-5", c.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
