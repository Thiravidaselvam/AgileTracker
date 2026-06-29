import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const MODULES = [
  "requirements","issues","testItems","testRunner","sprints",
  "support","actionItems","changeRequests","signOff","goLive","erpTracker","reports",
]

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roles = await db.customRole.findMany({
    include: {
      permissions: true,
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(roles)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can create roles" }, { status: 403 })

  const { name, description, color } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const existing = await db.customRole.findUnique({ where: { name: name.trim() } })
  if (existing) return NextResponse.json({ error: "Role name already exists" }, { status: 409 })

  const role = await db.customRole.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "slate",
      permissions: {
        create: MODULES.map(module => ({
          module,
          canView: true, canCreate: true, canEdit: true, canDelete: false,
        })),
      },
    },
    include: { permissions: true, _count: { select: { users: true } } },
  })

  return NextResponse.json(role, { status: 201 })
}
