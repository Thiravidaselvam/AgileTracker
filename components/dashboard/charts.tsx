"use client"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const COLORS = {
  HIGH:    "#ef4444",
  MEDIUM:  "#f97316",
  LOW:     "#22c55e",
  OPEN:    "#3b82f6",
  FIXED:   "#22c55e",
  CLOSED:  "#6b7280",
  blue:    "#3b82f6",
  green:   "#22c55e",
  red:     "#ef4444",
  orange:  "#f97316",
  purple:  "#8b5cf6",
}

export function SeverityPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Issue Severity</CardTitle>
        <CardDescription className="text-xs">Distribution by severity level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name as keyof typeof COLORS] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function StatusBarChart({ data, title, description }: { data: { name: string; value: number }[]; title: string; description?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name as keyof typeof COLORS] ?? "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function VelocityLineChart({ data }: { data: { sprint: string; velocity: number; planned: number; completed: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Sprint Velocity Trend</CardTitle>
        <CardDescription className="text-xs">Planned vs completed stories per sprint</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="sprint" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeWidth={2} dot={false} name="Planned" />
            <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} dot={false} name="Completed" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function IssuesTimelineChart({ data }: { data: { date: string; opened: number; resolved: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Issues Over Time</CardTitle>
        <CardDescription className="text-xs">Opened vs resolved by day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="opened" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            <Area type="monotone" dataKey="opened" stroke="#ef4444" fill="url(#opened)" name="Opened" />
            <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="url(#resolved)" name="Resolved" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ModuleBarChart({ data }: { data: { module: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Issues by Module</CardTitle>
        <CardDescription className="text-xs">Open issue count per module</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="module" type="category" tick={{ fontSize: 10 }} width={80} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Issues" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function OwnerWorkloadChart({ data }: { data: { owner: string; open: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Owner Workload</CardTitle>
        <CardDescription className="text-xs">Open items per team member</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="owner" type="category" tick={{ fontSize: 10 }} width={90} />
            <Tooltip />
            <Bar dataKey="open" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Open Items" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
