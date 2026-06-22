"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { TrackerTable } from "@/components/forms/tracker-table"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus } from "lucide-react"
import { AdminTools } from "@/components/layout/admin-tools"

const ROLES = ["ADMIN", "MANAGER", "MEMBER"]

const roleVariant: Record<string, "default" | "secondary" | "success"> = {
  ADMIN:   "default",
  MANAGER: "success",
  MEMBER:  "secondary",
}

const emptyForm = { name: "", email: "", password: "", role: "MEMBER" }

export default function UsersPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const callerRole  = (session?.user as any)?.role ?? ""
  const callerId    = (session?.user as any)?.id ?? ""
  const isAdmin     = callerRole === "ADMIN"
  const isManager   = callerRole === "MANAGER"
  const canAddUsers = isAdmin || isManager

  const [data, setData]             = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [roleFilter, setRoleFilter] = useState("all")
  const [open, setOpen]             = useState(false)
  const [editing, setEditing]       = useState<any | null>(null)
  const [form, setForm]             = useState(emptyForm)
  const [saving, setSaving]         = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter !== "all") params.set("role", roleFilter)
    const r = await fetch(`/api/users?${params}`)
    setData(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [roleFilter])

  // Can this session user edit the given row?
  function canEdit(row: any) {
    if (isAdmin) return true
    if (isManager && row.role === "MEMBER") return true
    if (row.id === callerId) return true   // anyone can edit their own profile
    return false
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

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
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
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

  // Roles available in the form dropdown based on caller's role
  const editableRoles = isAdmin ? ROLES : ["MEMBER"]

  const columns = [
    {
      key: "name",
      label: "Name",
      className: "font-medium",
      filter: { getVal: (r: any) => r.name ?? "" },
    },
    {
      key: "email",
      label: "Email",
      filter: { getVal: (r: any) => r.email ?? "" },
      render: (r: any) => <span className="text-gray-600">{r.email}</span>,
    },
    {
      key: "role",
      label: "Role",
      filter: { getVal: (r: any) => r.role ?? "" },
      render: (r: any) => (
        <Badge variant={roleVariant[r.role] ?? "secondary"}>{r.role}</Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      filter: { getVal: (r: any) => formatDate(r.createdAt) },
      render: (r: any) => formatDate(r.createdAt),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="User Management" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">

        {/* Permission legend */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <span><Badge variant="default" className="text-xs mr-1">ADMIN</Badge> Full access — add, edit, delete, change roles</span>
          <span className="text-gray-300">·</span>
          <span><Badge variant="success" className="text-xs mr-1">MANAGER</Badge> Add &amp; edit Member accounts</span>
          <span className="text-gray-300">·</span>
          <span><Badge variant="secondary" className="text-xs mr-1">MEMBER</Badge> Edit own profile only · Full access to all other modules</span>
        </div>

        {/* Admin-only tools: clear data + import Excel */}
        {isAdmin && <AdminTools onDataChange={load} />}

        <div className="flex flex-wrap items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          {canAddUsers && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add User
            </Button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">{data.length} users</p>
          </div>
          <TrackerTable
            columns={columns as any}
            data={data}
            onEdit={canAddUsers || callerId ? openEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
            loading={loading}
            pageSize={20}
          />
        </div>
      </div>

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
                  disabled={!isAdmin && editing?.id !== callerId}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {editableRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!isAdmin && (
                  <p className="text-xs text-gray-400">Role can only be changed by an Admin.</p>
                )}
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
              {editing && (
                <p className="text-xs text-gray-400">Leave blank to keep the current password.</p>
              )}
            </div>
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
