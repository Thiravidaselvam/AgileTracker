import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const callerId = (session.user as any).id
  const callerRole = (session.user as any).role

  // Fetch the target user to enforce role-based rules
  const target = await db.user.findUnique({ where: { id }, select: { role: true } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const isSelf = callerId === id

  // Permission check:
  // - ADMIN can edit anyone
  // - MANAGER can edit MEMBER accounts (not ADMIN/MANAGER unless it's themselves)
  // - MEMBER can only edit their own profile
  if (callerRole === "MEMBER" && !isSelf)
    return NextResponse.json({ error: "Members can only edit their own profile" }, { status: 403 })
  if (callerRole === "MANAGER" && !isSelf && target.role !== "MEMBER")
    return NextResponse.json({ error: "Managers can only edit Member accounts" }, { status: 403 })

  const { name, email, password, role } = await req.json()

  if (!name || !email)
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 })

  // Only ADMIN can change roles; MANAGER and MEMBER cannot change roles
  const newRole = callerRole === "ADMIN" ? (role ?? target.role) : target.role

  const duplicate = await db.user.findFirst({ where: { email, NOT: { id } } })
  if (duplicate)
    return NextResponse.json({ error: "Email is already in use" }, { status: 409 })

  const data: any = { name, email, role: newRole }
  if (password) data.passwordHash = await bcrypt.hash(password, 10)

  const user = await db.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(user)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can delete users" }, { status: 403 })

  const { id } = await params

  if (id === (session.user as any).id)
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })

  await db.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
