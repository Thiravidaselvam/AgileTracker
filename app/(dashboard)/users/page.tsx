"use client"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, ShieldCheck, ShieldAlert, Shield, RefreshCw, Pencil, Trash2 } from "lucide-react"
import { AdminTools } from "@/components/layout/admin-tools"

// ── color palette for custom roles ────────────────────────────────────────────

const COLOR_OPTIONS = ["slate","blue","green","amber","red","purple","pink","orange","teal","cyan","indigo","rose"] as const
type ColorKey = typeof COLOR_OPTIONS[number]

const COLOR_MAP: Record<ColorKey, { bg: string; text: string; border: string; dot: string }> = {
  slate:  { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-200",  dot: "bg-slate-400"  },
  blue:   { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-200",   dot: "bg-blue-500"   },
  green:  { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-200",  dot: "bg-green-500"  },
  amber:  { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200",  dot: "bg-amber-400"  },
  red:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-200",    dot: "bg-red-500"    },
  purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", dot: "bg-purple-500" },
  pink:   { bg: "bg-pink-100",   text: "text-pink-800",   border: "border-pink-200",   dot: "bg-pink-500"   },
  orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-500" },
  teal:   { bg: "bg-teal-100",   text: "text-teal-800",   border: "border-teal-200",   dot: "bg-teal-500"   },
  cyan:   { bg: "bg-cyan-100",   text: "text-cyan-800",   border: "border-cyan-200",   dot: "bg-cyan-500"   },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", dot: "bg-indigo-500" },
  rose:   { bg: "bg-rose-100",   text: "text-rose-800",   border: "border-rose-200",   dot: "bg-rose-500"   },
}

function colorCls(c: string) { return COLOR_MAP[c as ColorKey] ?? COLOR_MAP.slate }

// ── constants ─────────────────────────────────────────────────────────────────

const ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const

const MODULES = [
  { key: "requirements",   label: "Requirements"       },
  { key: "issues",         label: "Issues"             },
  { key: "testItems",      label: "Test Items"         },
  { key: "testRunner",     label: "Test Runner"        },
  { key: "sprints",        label: "Sprints"            },
  { key: "support",        label: "Support Tickets"    },
  { key: "actionItems",    label: "Action Items"       },
  { key: "changeRequests", label: "Change Requests"    },
  { key: "signOff",        label: "Sign-Off Docs"      },
  { key: "goLive",         label: "Go-Live Checklist"  },
  { key: "erpTracker",     label: "ERP Tracker"        },
  { key: "reports",        label: "Reports"            },
]

const PERMS = ["canView", "canCreate", "canEdit", "canDelete"] as const
type PermKey = typeof PERMS[number]

const PERM_SHORT: Record<PermKey, string> = { canView: "V", canCreate: "C", canEdit: "E", canDelete: "D" }
const PERM_LABEL: Record<PermKey, string> = { canView: "View", canCreate: "Create", canEdit: "Edit", canDelete: "Delete" }

const PERM_ON: Record<PermKey, string> = {
  canView:   "bg-blue-100  text-blue-700  border-blue-300",
  canCreate: "bg-green-100 text-green-700 border-green-300",
  canEdit:   "bg-amber-100 text-amber-700 border-amber-300",
  canDelete: "bg-red-100   text-red-700   border-red-300",
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  ADMIN:   <ShieldCheck  className="h-3.5 w-3.5 inline-block mr-1" />,
  MANAGER: <ShieldAlert  className="h-3.5 w-3.5 inline-block mr-1" />,
  MEMBER:  <Shield       className="h-3.5 w-3.5 inline-block mr-1" />,
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN:   "bg-blue-100  text-blue-800  border-blue-200",
  MANAGER: "bg-green-100 text-green-800 border-green-200",
  MEMBER:  "bg-gray-100  text-gray-700  border-gray-200",
}

const emptyForm = { name: "", email: "", password: "", role: "MEMBER" }

type PermMatrix = Record<string, Record<string, Record<PermKey, boolean>>>

// ── component ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const callerRole = (session?.user as any)?.role ?? ""
  const callerId   = (session?.user as any)?.id   ?? ""
  const isAdmin    = callerRole === "ADMIN"
  const isManager  = callerRole === "MANAGER"
  const canAddUsers = isAdmin || isManager

  // ── users state ──
  const [data,        setData]        = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [roleFilter,  setRoleFilter]  = useState("all")
  const [open,        setOpen]        = useState(false)
  const [editing,     setEditing]     = useState<any | null>(null)
  const [form,        setForm]        = useState(emptyForm)
  const [saving,      setSaving]      = useState(false)
  const [roleChanging, setRoleChanging] = useState<string | null>(null)

  // ── permissions state ──
  const [perms,        setPerms]        = useState<PermMatrix>({})
  const [permsLoading, setPermsLoading] = useState(false)
  const [toggling,     setToggling]     = useState<string | null>(null)

  // ── custom roles state ──
  const [customRoles,         setCustomRoles]         = useState<any[]>([])
  const [customRolesLoading,  setCustomRolesLoading]  = useState(false)
  const [crDialogOpen,        setCrDialogOpen]        = useState(false)
  const [crEditing,           setCrEditing]           = useState<any | null>(null)
  const [crForm,              setCrForm]              = useState({ name: "", description: "", color: "blue" })
  const [crSaving,            setCrSaving]            = useState(false)
  const [crToggles,           setCrToggles]           = useState<Record<string, boolean>>({})
  const [customRoleAssigning, setCustomRoleAssigning] = useState<string | null>(null)

  // ── load functions (must be declared before useEffect) ──
  const loadCustomRoles = useCallback(async () => {
    setCustomRolesLoading(true)
    const r = await fetch("/api/custom-roles")
    setCustomRoles(r.ok ? await r.json() : [])
    setCustomRolesLoading(false)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter !== "all") params.set("role", roleFilter)
    const r = await fetch(`/api/users?${params}`)
    setData(await r.json())
    setLoading(false)
  }, [roleFilter])

  const loadPerms = useCallback(async () => {
    setPermsLoading(true)
    const r = await fetch("/api/role-permissions")
    setPerms(await r.json())
    setPermsLoading(false)
  }, [])

  useEffect(() => { load(); loadCustomRoles() }, [load, loadCustomRoles])

  async function saveCustomRole() {
    if (!crForm.name.trim()) {
      toast({ title: "Role name is required", variant: "destructive" }); return
    }
    setCrSaving(true)
    const method = crEditing ? "PUT" : "POST"
    const url    = crEditing ? `/api/custom-roles/${crEditing.id}` : "/api/custom-roles"
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(crForm),
    })
    setCrSaving(false)
    if (res.ok) {
      toast({ title: crEditing ? "Role updated" : "Role created", variant: "success" })
      setCrDialogOpen(false)
      loadCustomRoles()
    } else {
      const err = await res.json()
      toast({ title: err.error ?? "Error saving role", variant: "destructive" })
    }
  }

  async function deleteCustomRole(cr: any) {
    if (!confirm(`Delete role "${cr.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/custom-roles/${cr.id}`, { method: "DELETE" })
    if (res.ok) { toast({ title: "Role deleted", variant: "destructive" }); loadCustomRoles() }
    else { const err = await res.json(); toast({ title: err.error ?? "Error deleting role", variant: "destructive" }) }
  }

  async function toggleCustomPerm(roleId: string, module: string, perm: PermKey, current: boolean) {
    const key = `${roleId}_${module}_${perm}`
    setCrToggles(prev => ({ ...prev, [key]: true }))
    const res = await fetch(`/api/custom-roles/${roleId}/permissions`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, permission: perm, value: !current }),
    })
    if (res.ok) {
      setCustomRoles(prev => prev.map(r => r.id !== roleId ? r : {
        ...r,
        permissions: r.permissions.map((p: any) =>
          p.module === module ? { ...p, [perm]: !current } : p
        ),
      }))
    } else toast({ title: "Failed to update permission", variant: "destructive" })
    setCrToggles(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  async function assignCustomRole(user: any, customRoleId: string | null) {
    setCustomRoleAssigning(user.id)
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: user.name, email: user.email, role: user.role, customRoleId }),
    })
    setCustomRoleAssigning(null)
    if (res.ok) { toast({ title: customRoleId ? "Custom role assigned" : "Custom role removed", variant: "success" }); load() }
    else { const err = await res.json(); toast({ title: err.error ?? "Error", variant: "destructive" }) }
  }

  // ── helpers ──
  function canEdit(row: any) {
    if (isAdmin) return true
    if (isManager && row.role === "MEMBER") return true
    if (row.id === callerId) return true
    return false
  }

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true) }

  function openEdit(row: any) {
    if (!canEdit(row)) {
      toast({ title: "You can only edit your own profile", variant: "destructive" })
      return
    }
    setEditing(row)
    setForm({ name: row.name, email: row.email, password: "", role: row.role })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast({ title: "User deleted", variant: "destructive" })
      load()
    } else {
      const err = await res.json()
      toast({ title: err.error ?? "Error deleting user", variant: "destructive" })
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" })
      return
    }
    if (!editing && !form.password) {
      toast({ title: "Password is required for new users", variant: "destructive" })
      return
    }
    setSaving(true)
    const method = editing ? "PUT" : "POST"
    const url    = editing ? `/api/users/${editing.id}` : "/api/users"
    const body: any = { name: form.name, email: form.email, role: form.role }
    if (form.password) body.password = form.password
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) {
      toast({ title: editing ? "User updated" : "User created", variant: "success" })
      setOpen(false)
      load()
    } else {
      const err = await res.json()
      toast({ title: err.error ?? "Error saving user", variant: "destructive" })
    }
  }

  async function quickRoleChange(user: any, newRole: string) {
    if (newRole === user.role) return
    setRoleChanging(user.id)
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: user.name, email: user.email, role: newRole }),
    })
    setRoleChanging(null)
    if (res.ok) {
      toast({ title: `${user.name} → ${newRole}`, variant: "success" })
      load()
    } else {
      const err = await res.json()
      toast({ title: err.error ?? "Failed to change role", variant: "destructive" })
    }
  }

  async function togglePerm(role: string, module: string, perm: PermKey, current: boolean) {
    const key = `${role}_${module}_${perm}`
    setToggling(key)
    const res = await fetch("/api/role-permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, module, permission: perm, value: !current }),
    })
    if (res.ok) {
      setPerms(prev => ({
        ...prev,
        [role]: { ...prev[role], [module]: { ...prev[role]?.[module], [perm]: !current } },
      }))
    } else {
      toast({ title: "Failed to update permission", variant: "destructive" })
    }
    setToggling(null)
  }

  const editableRoles = isAdmin ? [...ROLES] : ["MEMBER"]

  // ── filtered users ──
  const filteredData = roleFilter === "all" ? data : data.filter(u => u.role === roleFilter)

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <Header title="User Management" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">

        {/* Role legend */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <span className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_BADGE.ADMIN}`}>
              {ROLE_ICON.ADMIN} ADMIN
            </span>
            Full access — manage users, roles &amp; permissions
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_BADGE.MANAGER}`}>
              {ROLE_ICON.MANAGER} MANAGER
            </span>
            Manage members, view all modules
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_BADGE.MEMBER}`}>
              {ROLE_ICON.MEMBER} MEMBER
            </span>
            Standard access per permission settings
          </span>
        </div>

        <Tabs defaultValue="users" onValueChange={(v) => {
          if (v === "permissions") {
            if (Object.keys(perms).length === 0) loadPerms()
            if (customRoles.length === 0) loadCustomRoles()
          }
        }}>
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="permissions">Roles &amp; Permissions</TabsTrigger>
          </TabsList>

          {/* ══ USERS TAB ══════════════════════════════════════════════════ */}
          <TabsContent value="users" className="space-y-4">

            {isAdmin && <AdminTools onDataChange={load} />}

            <div className="flex flex-wrap items-center gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
              {canAddUsers && (
                <Button onClick={openNew}>
                  <Plus className="h-4 w-4 mr-1" /> Add User
                </Button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">{filteredData.length} user{filteredData.length !== 1 ? "s" : ""}</p>
              </div>

              {loading ? (
                <div className="space-y-2 p-4">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : filteredData.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {["Name", "Email", "System Role", "Custom Role", "Created", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                          <td className="px-4 py-3 text-gray-500">{user.email}</td>
                          <td className="px-4 py-3">
                            {/* Admin can change role inline for any user that isn't themselves */}
                            {isAdmin && user.id !== callerId ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={user.role}
                                  disabled={roleChanging === user.id}
                                  onChange={(e) => quickRoleChange(user, e.target.value)}
                                  className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                                >
                                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                {roleChanging === user.id && (
                                  <span className="text-xs text-gray-400 animate-pulse">Saving…</span>
                                )}
                              </div>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.MEMBER}`}>
                                {ROLE_ICON[user.role]} {user.role}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={user.customRoleId ?? ""}
                                  disabled={customRoleAssigning === user.id}
                                  onChange={(e) => assignCustomRole(user, e.target.value || null)}
                                  className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 min-w-[100px]"
                                >
                                  <option value="">— None —</option>
                                  {customRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                {customRoleAssigning === user.id && <span className="text-xs text-gray-400 animate-pulse">Saving…</span>}
                              </div>
                            ) : user.customRole ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colorCls(user.customRole.color).bg} ${colorCls(user.customRole.color).text} ${colorCls(user.customRole.color).border}`}>
                                {user.customRole.name}
                              </span>
                            ) : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {canEdit(user) && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(user)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isAdmin && user.id !== callerId && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══ PERMISSIONS TAB ════════════════════════════════════════════ */}
          <TabsContent value="permissions" className="space-y-4">

            {/* Header info */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex-1">
                {isAdmin
                  ? "Click any permission button to toggle access for that role. ADMIN always has full access."
                  : "Only Admins can modify role permissions. Contact your admin to request changes."}
              </div>
              <Button variant="outline" size="sm" onClick={loadPerms} disabled={permsLoading}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> {permsLoading ? "Loading…" : "Refresh"}
              </Button>
            </div>

            {permsLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : Object.keys(perms).length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No permissions loaded.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">Module</th>
                      {ROLES.map(role => (
                        <th key={role} className="px-4 py-3 text-center" colSpan={4}>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${ROLE_BADGE[role]}`}>
                            {ROLE_ICON[role]} {role}
                          </span>
                          {role === "ADMIN" && (
                            <p className="text-xs text-gray-400 font-normal mt-0.5">locked</p>
                          )}
                        </th>
                      ))}
                    </tr>
                    {/* Permission key sub-header */}
                    <tr className="border-b border-gray-100 bg-white">
                      <td className="px-4 py-1.5 text-xs text-gray-400">
                        <span className="inline-flex gap-1">
                          {PERMS.map(p => (
                            <span key={p} className={`px-1.5 py-0.5 rounded border text-xs font-bold ${PERM_ON[p]}`}>{PERM_SHORT[p]}</span>
                          ))}
                          <span className="text-gray-400 ml-1">= {PERMS.map(p => PERM_LABEL[p]).join(" / ")}</span>
                        </span>
                      </td>
                      {ROLES.map(role => (
                        <td key={role} colSpan={4} className="px-4 py-1.5 text-center text-xs text-gray-400">
                          {PERMS.map(p => PERM_SHORT[p]).join("  ")}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MODULES.map((mod, i) => (
                      <tr key={mod.key} className={i % 2 === 1 ? "bg-gray-50/50" : "bg-white"}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{mod.label}</td>
                        {ROLES.map(role => {
                          const locked = role === "ADMIN"
                          return PERMS.map(perm => {
                            const granted  = locked || (perms[role]?.[mod.key]?.[perm] ?? false)
                            const key      = `${role}_${mod.key}_${perm}`
                            const spinning = toggling === key
                            return (
                              <td key={perm} className="px-1 py-2 text-center">
                                <button
                                  title={`${role} · ${mod.label} · ${PERM_LABEL[perm]}: ${granted ? "Granted" : "Denied"}`}
                                  disabled={locked || !isAdmin || spinning}
                                  onClick={() => !locked && isAdmin && togglePerm(role, mod.key, perm, granted)}
                                  className={[
                                    "w-8 h-8 rounded-md border text-xs font-bold transition-all",
                                    granted ? PERM_ON[perm] : "bg-gray-100 text-gray-300 border-gray-200",
                                    locked  ? "cursor-not-allowed opacity-80" : isAdmin ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default",
                                    spinning ? "animate-pulse" : "",
                                  ].join(" ")}
                                >
                                  {spinning ? "…" : PERM_SHORT[perm]}
                                </button>
                              </td>
                            )
                          })
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
              {PERMS.map(p => (
                <span key={p} className="flex items-center gap-1.5">
                  <span className={`w-6 h-6 rounded border text-xs font-bold flex items-center justify-center ${PERM_ON[p]}`}>{PERM_SHORT[p]}</span>
                  {PERM_LABEL[p]}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded border text-xs font-bold flex items-center justify-center bg-gray-100 text-gray-300 border-gray-200">V</span>
                Permission denied (grayed)
              </span>
            </div>

            {/* ── Custom Roles Section ───────────────────────────────────── */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Custom Roles</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Create project-specific roles and configure module permissions. Assign them to users in the Users tab.</p>
                </div>
                {isAdmin && (
                  <Button size="sm" onClick={() => {
                    setCrEditing(null)
                    setCrForm({ name: "", description: "", color: "blue" })
                    setCrDialogOpen(true)
                  }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Create Role
                  </Button>
                )}
              </div>

              {customRolesLoading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : customRoles.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                  No custom roles yet.{isAdmin && <> Click <strong>Create Role</strong> to add one.</>}
                </div>
              ) : (
                <div className="space-y-4">
                  {customRoles.map(cr => {
                    const c = colorCls(cr.color)
                    const permMap: Record<string, any> = {}
                    cr.permissions?.forEach((p: any) => { permMap[p.module] = p })
                    return (
                      <div key={cr.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Role header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
                              {cr.name}
                            </span>
                            {cr.description && <span className="text-xs text-gray-500">{cr.description}</span>}
                            <span className="text-xs text-gray-400">({cr._count?.users ?? 0} user{cr._count?.users !== 1 ? "s" : ""})</span>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                setCrEditing(cr)
                                setCrForm({ name: cr.name, description: cr.description ?? "", color: cr.color })
                                setCrDialogOpen(true)
                              }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteCustomRole(cr)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* Permission matrix */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs min-w-[420px]">
                            <thead>
                              <tr className="border-b border-gray-100 bg-white">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-44">Module</th>
                                {PERMS.map(p => (
                                  <th key={p} className="px-2 py-2 text-center w-12">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${PERM_ON[p]}`}>{PERM_SHORT[p]}</span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {MODULES.map((mod, i) => {
                                const mp = permMap[mod.key]
                                return (
                                  <tr key={mod.key} className={i % 2 === 1 ? "bg-gray-50/50" : "bg-white"}>
                                    <td className="px-4 py-2 font-medium text-gray-700">{mod.label}</td>
                                    {PERMS.map(perm => {
                                      const granted  = mp?.[perm] ?? true
                                      const tKey     = `${cr.id}_${mod.key}_${perm}`
                                      const spinning = !!crToggles[tKey]
                                      return (
                                        <td key={perm} className="px-2 py-1.5 text-center">
                                          <button
                                            title={`${cr.name} · ${mod.label} · ${PERM_LABEL[perm]}: ${granted ? "Granted" : "Denied"}`}
                                            disabled={!isAdmin || spinning}
                                            onClick={() => isAdmin && toggleCustomPerm(cr.id, mod.key, perm, granted)}
                                            className={[
                                              "w-8 h-8 rounded-md border text-xs font-bold transition-all",
                                              granted ? PERM_ON[perm] : "bg-gray-100 text-gray-300 border-gray-200",
                                              isAdmin ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default",
                                              spinning ? "animate-pulse" : "",
                                            ].join(" ")}
                                          >
                                            {spinning ? "…" : PERM_SHORT[perm]}
                                          </button>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </TabsContent>
        </Tabs>
      </div>

      {/* ── Add / Edit User Dialog ─────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {editableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!isAdmin && <p className="text-xs text-gray-400">Only Admins can change roles.</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? "New Password" : "Password *"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Leave blank to keep current" : "Set a password"}
              />
              {editing && <p className="text-xs text-gray-400">Leave blank to keep the current password.</p>}
            </div>

            {/* Effective permissions preview (if editing an existing user) */}
            {editing && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Effective Permissions ({form.role})</p>
                <div className="grid grid-cols-2 gap-1">
                  {MODULES.map(mod => {
                    const rolePerms = perms[form.role]?.[mod.key]
                    const allGrant  = form.role === "ADMIN"
                    return (
                      <div key={mod.key} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-gray-600 truncate">{mod.label}</span>
                        <div className="flex gap-0.5 shrink-0">
                          {PERMS.map(p => {
                            const on = allGrant || (rolePerms?.[p] ?? true)
                            return (
                              <span key={p} className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border ${on ? PERM_ON[p] : "bg-gray-100 text-gray-300 border-gray-200"}`}>
                                {PERM_SHORT[p]}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Create / Edit Custom Role Dialog ───────────────────────────── */}
      <Dialog open={crDialogOpen} onOpenChange={setCrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{crEditing ? "Edit Role" : "Create Custom Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Role Name *</Label>
              <Input
                value={crForm.name}
                onChange={e => setCrForm({ ...crForm, name: e.target.value })}
                placeholder="e.g. TESTER, DEVELOPER, VIEWER"
              />
              <p className="text-xs text-gray-400">Name will be saved in uppercase.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={crForm.description}
                onChange={e => setCrForm({ ...crForm, description: e.target.value })}
                placeholder="Short description (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(c => {
                  const cls = COLOR_MAP[c]
                  return (
                    <button
                      key={c}
                      onClick={() => setCrForm({ ...crForm, color: c })}
                      title={c}
                      className={[
                        "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                        cls.dot,
                        crForm.color === c ? "border-gray-700 scale-110 ring-2 ring-offset-1 ring-gray-400" : "border-transparent",
                      ].join(" ")}
                    />
                  )
                })}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Preview:</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colorCls(crForm.color).bg} ${colorCls(crForm.color).text} ${colorCls(crForm.color).border}`}>
                  {crForm.name || "Role Name"}
                </span>
              </div>
            </div>
            {!crEditing && (
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
                All module permissions default to <strong>View / Create / Edit</strong> (Delete is off). Adjust them in the Roles &amp; Permissions tab after creation.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCrDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCustomRole} disabled={crSaving}>
              {crSaving ? "Saving…" : crEditing ? "Update" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
