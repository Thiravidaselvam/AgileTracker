"use client"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, ShieldCheck, ShieldAlert, Shield, RefreshCw, Pencil, Trash2 } from "lucide-react"
import { AdminTools } from "@/components/layout/admin-tools"

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

// Static COLOR_MAP so Tailwind v4 never purges these classes
const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  slate:  { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-200",  dot: "bg-slate-400"  },
  blue:   { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-200",   dot: "bg-blue-400"   },
  green:  { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-200",  dot: "bg-green-400"  },
  amber:  { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200",  dot: "bg-amber-400"  },
  red:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-200",    dot: "bg-red-400"    },
  purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", dot: "bg-purple-400" },
  pink:   { bg: "bg-pink-100",   text: "text-pink-800",   border: "border-pink-200",   dot: "bg-pink-400"   },
  orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-400" },
  teal:   { bg: "bg-teal-100",   text: "text-teal-800",   border: "border-teal-200",   dot: "bg-teal-400"   },
  cyan:   { bg: "bg-cyan-100",   text: "text-cyan-800",   border: "border-cyan-200",   dot: "bg-cyan-400"   },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", dot: "bg-indigo-400" },
  rose:   { bg: "bg-rose-100",   text: "text-rose-800",   border: "border-rose-200",   dot: "bg-rose-400"   },
}
const COLOR_KEYS = Object.keys(COLOR_MAP)
function colorCls(color: string) { return COLOR_MAP[color] ?? COLOR_MAP.slate }

const emptyForm = { name: "", email: "", password: "", role: "MEMBER", customRoleId: "" }
const emptyCustomRoleForm = { name: "", description: "", color: "slate" }

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

  const [data,        setData]        = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [roleFilter,  setRoleFilter]  = useState("all")
  const [open,        setOpen]        = useState(false)
  const [editing,     setEditing]     = useState<any | null>(null)
  const [form,        setForm]        = useState(emptyForm)
  const [saving,      setSaving]      = useState(false)
  const [roleChanging,       setRoleChanging]       = useState<string | null>(null)
  const [customRoleChanging, setCustomRoleChanging] = useState<string | null>(null)

  const [perms,        setPerms]        = useState<PermMatrix>({})
  const [permsLoading, setPermsLoading] = useState(false)
  const [toggling,     setToggling]     = useState<string | null>(null)

  const [customRoles,        setCustomRoles]        = useState<any[]>([])
  const [customRolesLoading, setCustomRolesLoading] = useState(false)
  const [selectedCustomRole, setSelectedCustomRole] = useState<any | null>(null)
  const [crTogglingKey,      setCrTogglingKey]      = useState<string | null>(null)
  const [crOpen,             setCrOpen]             = useState(false)
  const [crEditing,          setCrEditing]          = useState<any | null>(null)
  const [crForm,             setCrForm]             = useState(emptyCustomRoleForm)
  const [crSaving,           setCrSaving]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter !== "all") params.set("role", roleFilter)
    const r = await fetch(`/api/users?${params}`)
    setData(await r.json())
    setLoading(false)
  }, [roleFilter])

  useEffect(() => { load() }, [load])

  const loadPerms = useCallback(async () => {
    setPermsLoading(true)
    const r = await fetch("/api/role-permissions")
    setPerms(await r.json())
    setPermsLoading(false)
  }, [])

  const loadCustomRoles = useCallback(async () => {
    setCustomRolesLoading(true)
    const r = await fetch("/api/custom-roles")
    const list = await r.json()
    setCustomRoles(list)
    if (list.length > 0 && !selectedCustomRole) setSelectedCustomRole(list[0])
    setCustomRolesLoading(false)
  }, [selectedCustomRole])

  function canEdit(row: any) {
    if (isAdmin) return true
    if (isManager && row.role === "MEMBER") return true
    if (row.id === callerId) return true
    return false
  }

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true) }

  function openEdit(row: any) {
    if (!canEdit(row)) { toast({ title: "You can only edit your own profile", variant: "destructive" }); return }
    setEditing(row)
    setForm({ name: row.name, email: row.email, password: "", role: row.role, customRoleId: row.customRoleId ?? "" })
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (res.ok) { toast({ title: "User deleted", variant: "destructive" }); load() }
    else { const e = await res.json(); toast({ title: e.error ?? "Error deleting user", variant: "destructive" }) }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" }); return
    }
    if (!editing && !form.password) {
      toast({ title: "Password is required for new users", variant: "destructive" }); return
    }
    setSaving(true)
    const method = editing ? "PUT" : "POST"
    const url    = editing ? `/api/users/${editing.id}` : "/api/users"
    const body: any = { name: form.name, email: form.email, role: form.role, customRoleId: form.customRoleId || null }
    if (form.password) body.password = form.password
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) { toast({ title: editing ? "User updated" : "User created", variant: "success" }); setOpen(false); load() }
    else { const e = await res.json(); toast({ title: e.error ?? "Error saving user", variant: "destructive" }) }
  }

  async function quickRoleChange(user: any, newRole: string) {
    if (newRole === user.role) return
    setRoleChanging(user.id)
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: user.name, email: user.email, role: newRole, customRoleId: user.customRoleId }),
    })
    setRoleChanging(null)
    if (res.ok) { toast({ title: `${user.name} → ${newRole}`, variant: "success" }); load() }
    else { const e = await res.json(); toast({ title: e.error ?? "Failed to change role", variant: "destructive" }) }
  }

  async function quickCustomRoleChange(user: any, newCustomRoleId: string) {
    setCustomRoleChanging(user.id)
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: user.name, email: user.email, role: user.role, customRoleId: newCustomRoleId || null }),
    })
    setCustomRoleChanging(null)
    if (res.ok) { toast({ title: "Custom role updated", variant: "success" }); load() }
    else { const e = await res.json(); toast({ title: e.error ?? "Failed to update custom role", variant: "destructive" }) }
  }

  async function togglePerm(role: string, module: string, perm: PermKey, current: boolean) {
    const key = `${role}_${module}_${perm}`
    setToggling(key)
    const res = await fetch("/api/role-permissions", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, module, permission: perm, value: !current }),
    })
    if (res.ok) {
      setPerms(prev => ({ ...prev, [role]: { ...prev[role], [module]: { ...prev[role]?.[module], [perm]: !current } } }))
    } else { toast({ title: "Failed to update permission", variant: "destructive" }) }
    setToggling(null)
  }

  async function toggleCrPerm(roleId: string, module: string, perm: PermKey, current: boolean) {
    const key = `${roleId}_${module}_${perm}`
    setCrTogglingKey(key)
    const res = await fetch(`/api/custom-roles/${roleId}/permissions`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, permission: perm, value: !current }),
    })
    if (res.ok) {
      const updater = (cr: any) => ({
        ...cr,
        permissions: cr.permissions.map((p: any) => p.module === module ? { ...p, [perm]: !current } : p),
      })
      setCustomRoles(prev => prev.map(cr => cr.id === roleId ? updater(cr) : cr))
      setSelectedCustomRole((prev: any) => prev?.id === roleId ? updater(prev) : prev)
    } else { toast({ title: "Failed to update permission", variant: "destructive" }) }
    setCrTogglingKey(null)
  }

  function openNewCustomRole() { setCrEditing(null); setCrForm(emptyCustomRoleForm); setCrOpen(true) }

  function openEditCustomRole(cr: any) {
    setCrEditing(cr)
    setCrForm({ name: cr.name, description: cr.description ?? "", color: cr.color })
    setCrOpen(true)
  }

  async function handleSaveCustomRole() {
    if (!crForm.name.trim()) { toast({ title: "Role name is required", variant: "destructive" }); return }
    setCrSaving(true)
    const method = crEditing ? "PUT" : "POST"
    const url    = crEditing ? `/api/custom-roles/${crEditing.id}` : "/api/custom-roles"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(crForm) })
    setCrSaving(false)
    if (res.ok) {
      const updated = await res.json()
      toast({ title: crEditing ? "Role updated" : "Role created", variant: "success" })
      setCrOpen(false)
      await loadCustomRoles()
      if (!crEditing) setSelectedCustomRole(updated)
    } else { const e = await res.json(); toast({ title: e.error ?? "Error saving role", variant: "destructive" }) }
  }

  async function handleDeleteCustomRole(cr: any) {
    if (!confirm(`Delete role "${cr.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/custom-roles/${cr.id}`, { method: "DELETE" })
    if (res.ok) {
      toast({ title: `Role "${cr.name}" deleted`, variant: "destructive" })
      const next = customRoles.filter(r => r.id !== cr.id)
      setCustomRoles(next)
      setSelectedCustomRole(next[0] ?? null)
    } else { const e = await res.json(); toast({ title: e.error ?? "Error deleting role", variant: "destructive" }) }
  }

  const editableRoles = isAdmin ? [...ROLES] : ["MEMBER"]
  const filteredData  = roleFilter === "all" ? data : data.filter(u => u.role === roleFilter)

  return (
    <div className="flex flex-col h-full">
      <Header title="User Management" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">

        {/* legend */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          {(["ADMIN","MANAGER","MEMBER"] as const).map((r, i) => (
            <>
              {i > 0 && <span key={`dot-${r}`} className="text-gray-300">·</span>}
              <span key={r} className="flex items-center gap-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_BADGE[r]}`}>
                  {ROLE_ICON[r]} {r}
                </span>
                {r === "ADMIN" ? "Full access — manage users, roles & permissions" : r === "MANAGER" ? "Manage members, view all modules" : "Standard access per permission settings"}
              </span>
            </>
          ))}
        </div>

        <Tabs defaultValue="users" onValueChange={(v) => {
          if (v === "permissions"  && Object.keys(perms).length === 0) loadPerms()
          if (v === "custom-roles" && customRoles.length === 0)        loadCustomRoles()
        }}>
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="permissions">System Roles</TabsTrigger>
            <TabsTrigger value="custom-roles">Custom Roles</TabsTrigger>
          </TabsList>

          {/* USERS */}
          <TabsContent value="users" className="space-y-4">
            {isAdmin && <AdminTools onDataChange={load} />}

            <div className="flex flex-wrap items-center gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</Button>
              {canAddUsers && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add User</Button>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">{filteredData.length} user{filteredData.length !== 1 ? "s" : ""}</p>
              </div>
              {loading ? (
                <div className="space-y-2 p-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : filteredData.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {["Name","Email","System Role","Custom Role","Created","Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                          <td className="px-4 py-3 text-gray-500">{user.email}</td>
                          <td className="px-4 py-3">
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
                                {roleChanging === user.id && <span className="text-xs text-gray-400 animate-pulse">Saving…</span>}
                              </div>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.MEMBER}`}>
                                {ROLE_ICON[user.role]} {user.role}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={user.customRoleId ?? ""}
                                  disabled={customRoleChanging === user.id}
                                  onChange={(e) => quickCustomRoleChange(user, e.target.value)}
                                  className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 max-w-[140px]"
                                >
                                  <option value="">— none —</option>
                                  {customRoles.map(cr => <option key={cr.id} value={cr.id}>{cr.name}</option>)}
                                </select>
                                {customRoleChanging === user.id && <span className="text-xs text-gray-400 animate-pulse">Saving…</span>}
                              </div>
                            ) : user.customRole ? (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${colorCls(user.customRole.color).bg} ${colorCls(user.customRole.color).text} ${colorCls(user.customRole.color).border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${colorCls(user.customRole.color).dot}`} />
                                {user.customRole.name}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
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

          {/* SYSTEM ROLES */}
          <TabsContent value="permissions" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex-1">
                {isAdmin ? "Click any permission button to toggle access for that role. ADMIN always has full access." : "Only Admins can modify role permissions."}
              </div>
              <Button variant="outline" size="sm" onClick={loadPerms} disabled={permsLoading}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> {permsLoading ? "Loading…" : "Refresh"}
              </Button>
            </div>

            {permsLoading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
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
                          {role === "ADMIN" && <p className="text-xs text-gray-400 font-normal mt-0.5">locked</p>}
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 bg-white">
                      <td className="px-4 py-1.5 text-xs text-gray-400">
                        <span className="inline-flex gap-1">
                          {PERMS.map(p => <span key={p} className={`px-1.5 py-0.5 rounded border text-xs font-bold ${PERM_ON[p]}`}>{PERM_SHORT[p]}</span>)}
                          <span className="text-gray-400 ml-1">= {PERMS.map(p => PERM_LABEL[p]).join(" / ")}</span>
                        </span>
                      </td>
                      {ROLES.map(role => (
                        <td key={role} colSpan={4} className="px-4 py-1.5 text-center text-xs text-gray-400">{PERMS.map(p => PERM_SHORT[p]).join("  ")}</td>
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
                                  className={["w-8 h-8 rounded-md border text-xs font-bold transition-all",
                                    granted ? PERM_ON[perm] : "bg-gray-100 text-gray-300 border-gray-200",
                                    locked ? "cursor-not-allowed opacity-80" : isAdmin ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default",
                                    spinning ? "animate-pulse" : ""].join(" ")}
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

            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
              {PERMS.map(p => (
                <span key={p} className="flex items-center gap-1.5">
                  <span className={`w-6 h-6 rounded border text-xs font-bold flex items-center justify-center ${PERM_ON[p]}`}>{PERM_SHORT[p]}</span>
                  {PERM_LABEL[p]}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded border text-xs font-bold flex items-center justify-center bg-gray-100 text-gray-300 border-gray-200">V</span>
                Permission denied
              </span>
            </div>
          </TabsContent>

          {/* CUSTOM ROLES */}
          <TabsContent value="custom-roles" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-600 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 flex-1">
                {isAdmin
                  ? "Create named roles (e.g. TESTER, DEVELOPER) and configure module-level permissions independently of system roles."
                  : "Custom roles are defined by your admin. Contact your admin to request changes."}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadCustomRoles} disabled={customRolesLoading}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> {customRolesLoading ? "Loading…" : "Refresh"}
                </Button>
                {isAdmin && (
                  <Button size="sm" onClick={openNewCustomRole}><Plus className="h-4 w-4 mr-1" /> New Role</Button>
                )}
              </div>
            </div>

            {customRolesLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : customRoles.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                No custom roles yet.{isAdmin && " Click \"New Role\" to create one."}
              </div>
            ) : (
              <div className="flex gap-4">
                {/* sidebar */}
                <div className="w-[280px] shrink-0 space-y-2">
                  {customRoles.map(cr => {
                    const cc = colorCls(cr.color)
                    const isSel = selectedCustomRole?.id === cr.id
                    return (
                      <div
                        key={cr.id}
                        onClick={() => setSelectedCustomRole(cr)}
                        className={["p-3 rounded-lg border cursor-pointer transition-all",
                          isSel ? `${cc.bg} ${cc.border} shadow-sm` : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cc.dot}`} />
                            <span className={`text-sm font-semibold truncate ${isSel ? cc.text : "text-gray-800"}`}>{cr.name}</span>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0 ml-2">{cr._count?.users ?? 0} user{(cr._count?.users ?? 0) !== 1 ? "s" : ""}</span>
                        </div>
                        {cr.description && <p className={`text-xs mt-1 truncate ${isSel ? cc.text : "text-gray-500"}`}>{cr.description}</p>}
                        {isAdmin && isSel && (
                          <div className="flex gap-1 mt-2">
                            <button onClick={(e) => { e.stopPropagation(); openEditCustomRole(cr) }}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomRole(cr) }}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white border border-red-200 text-red-600 hover:bg-red-50">
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* permission matrix */}
                {selectedCustomRole && (
                  <div className="flex-1 overflow-x-auto rounded-xl border border-gray-200 self-start">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${colorCls(selectedCustomRole.color).dot}`} />
                      <span className="font-semibold text-gray-800">{selectedCustomRole.name}</span>
                      {selectedCustomRole.description && <span className="text-xs text-gray-400">{selectedCustomRole.description}</span>}
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Module</th>
                          {PERMS.map(p => (
                            <th key={p} className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded border font-bold text-xs ${PERM_ON[p]}`}>{PERM_SHORT[p]}</span>
                              <p className="text-[10px] font-normal text-gray-400 mt-0.5">{PERM_LABEL[p]}</p>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {MODULES.map((mod, i) => {
                          const permRow = selectedCustomRole.permissions?.find((p: any) => p.module === mod.key)
                          return (
                            <tr key={mod.key} className={i % 2 === 1 ? "bg-gray-50/50" : "bg-white"}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{mod.label}</td>
                              {PERMS.map(perm => {
                                const granted  = permRow?.[perm] ?? true
                                const key      = `${selectedCustomRole.id}_${mod.key}_${perm}`
                                const spinning = crTogglingKey === key
                                return (
                                  <td key={perm} className="px-3 py-2 text-center">
                                    <button
                                      title={`${mod.label} · ${PERM_LABEL[perm]}: ${granted ? "Granted" : "Denied"}`}
                                      disabled={!isAdmin || spinning}
                                      onClick={() => isAdmin && toggleCrPerm(selectedCustomRole.id, mod.key, perm, granted)}
                                      className={["w-8 h-8 rounded-md border text-xs font-bold transition-all",
                                        granted ? PERM_ON[perm] : "bg-gray-100 text-gray-300 border-gray-200",
                                        isAdmin ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default",
                                        spinning ? "animate-pulse" : ""].join(" ")}
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
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add / Edit User */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>System Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{editableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                {!isAdmin && <p className="text-xs text-gray-400">Only Admins can change roles.</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
            </div>
            {isAdmin && (
              <div className="space-y-1.5">
                <Label>Custom Role</Label>
                <select
                  value={form.customRoleId}
                  onChange={(e) => setForm({ ...form, customRoleId: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">— none —</option>
                  {customRoles.map(cr => <option key={cr.id} value={cr.id}>{cr.name}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{editing ? "New Password" : "Password *"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Leave blank to keep current" : "Set a password"} />
              {editing && <p className="text-xs text-gray-400">Leave blank to keep the current password.</p>}
            </div>
            {editing && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Effective Permissions ({form.role})</p>
                <div className="grid grid-cols-2 gap-1">
                  {MODULES.map(mod => {
                    const rp = perms[form.role]?.[mod.key]
                    const all = form.role === "ADMIN"
                    return (
                      <div key={mod.key} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-gray-600 truncate">{mod.label}</span>
                        <div className="flex gap-0.5 shrink-0">
                          {PERMS.map(p => {
                            const on = all || (rp?.[p] ?? true)
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
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Custom Role */}
      <Dialog open={crOpen} onOpenChange={setCrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{crEditing ? "Edit Custom Role" : "Create Custom Role"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Role Name *</Label>
              <Input value={crForm.name} onChange={(e) => setCrForm({ ...crForm, name: e.target.value })} placeholder="e.g. TESTER, DEVELOPER" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={crForm.description} onChange={(e) => setCrForm({ ...crForm, description: e.target.value })} placeholder="Optional short description" />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_KEYS.map(c => {
                  const cc = colorCls(c)
                  return (
                    <button key={c} onClick={() => setCrForm({ ...crForm, color: c })} title={c}
                      className={["w-7 h-7 rounded-full border-2 transition-transform hover:scale-110", cc.dot,
                        crForm.color === c ? "border-gray-700 scale-110 ring-2 ring-offset-1 ring-gray-400" : "border-transparent"].join(" ")}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 capitalize">Selected: {crForm.color}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCrOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCustomRole} disabled={crSaving}>{crSaving ? "Saving…" : crEditing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
