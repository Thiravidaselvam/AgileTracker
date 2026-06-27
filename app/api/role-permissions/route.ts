import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const MODULES = [
  "requirements", "issues", "testItems", "testRunner", "sprints",
  "support", "actionItems", "changeRequests", "signOff", "goLive",
  "erpTracker", "reports",
]

const ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const

const DEFAULTS: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {
  ADMIN:   { canView: true, canCreate: true, canEdit: true, canDelete: true  },
  MANAGER: { canView: true, canCreate: true, canEdit: true, canDelete: false },
  MEMBER:  { canView: true, canCreate: true, canEdit: true, canDelete: false },
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await db.rolePermission.findMany()
  const existingSet = new Set(existing.map((p) => `${p.role}_${p.module}`))

  const toCreate: any[] = []
  for (const role of ROLES) {
    for (const module of MODULES) {
      if (!existingSet.has(`${role}_${module}`)) {
        toCreate.push({ role, module, ...DEFAULTS[role] })
      }
    }
  }

  if (toCreate.length > 0) await db.rolePermission.createMany({ data: toCreate })

  const all = toCreate.length > 0 ? await db.rolePermission.findMany() : existing

  const matrix: Record<string, Record<string, any>> = {}
  for (const p of all) {
    if (!matrix[p.role]) matrix[p.role] = {}
    matrix[p.role][p.module] = {
      canView: p.canView, canCreate: p.canCreate,
      canEdit: p.canEdit, canDelete: p.canDelete,
    }
  }

  return NextResponse.json(matrix)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can modify permissions" }, { status: 403 })

  const { role, module, permission, value } = await req.json()

  if (role === "ADMIN")
    return NextResponse.json({ error: "ADMIN permissions cannot be modified" }, { status: 400 })

  const allowed = ["canView", "canCreate", "canEdit", "canDelete"]
  if (!allowed.includes(permission))
    return NextResponse.json({ error: "Invalid permission field" }, { status: 400 })

  await db.rolePermission.upsert({
    where:  { role_module: { role: role as any, module } },
    update: { [permission]: value },
    create: { role: role as any, module, ...DEFAULTS[role] ?? DEFAULTS.MEMBER, [permission]: value },
  })

  return NextResponse.json({ success: true })
}
