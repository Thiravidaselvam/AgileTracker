import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can update roles" }, { status: 403 })

  const { id } = await params
  const { name, description, color } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const duplicate = await db.customRole.findFirst({ where: { name: name.trim(), NOT: { id } } })
  if (duplicate) return NextResponse.json({ error: "Role name already exists" }, { status: 409 })

  const role = await db.customRole.update({
    where: { id },
    data: { name: name.trim(), description: description?.trim() || null, color: color || "slate" },
    include: { permissions: true, _count: { select: { users: true } } },
  })

  return NextResponse.json(role)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can delete roles" }, { status: 403 })

  const { id } = await params

  const userCount = await db.user.count({ where: { customRoleId: id } })
  if (userCount > 0)
    return NextResponse.json({ error: `Cannot delete: ${userCount} user(s) assigned to this role` }, { status: 400 })

  await db.customRole.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
