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

  // ── load users ──
  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter !== "all") params.set("role", roleFilter)
    const r = await fetch(`/api/users?${params}`)
    setData(await r.json())
    setLoading(false)
  }, [roleFilter])

  useEffect(() => { load() }, [load])

  // ── load permissions ──
  const loadPerms = useCallback(async () => {
    setPermsLoading(true)
    const r = await fetch("/api/role-permissions")
    setPerms(await r.json())
    setPermsLoading(false)
  }, [])

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

        <Tabs defaultValue="users" onValueChange={(v) => { if (v === "permissions" && Object.keys(perms).length === 0) loadPerms() }}>
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
                        {["Name", "Email", "Role", "Created", "Actions"].map(h => (
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
    </div>
  )
}
