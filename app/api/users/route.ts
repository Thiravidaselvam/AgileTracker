import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role")

  const users = await db.user.findMany({
    where: role ? { role: role as any } : undefined,
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const callerRole = (session.user as any).role
  // Only ADMIN and MANAGER can create users
  if (callerRole !== "ADMIN" && callerRole !== "MANAGER")
    return NextResponse.json({ error: "Only admins and managers can create users" }, { status: 403 })

  const { name, email, password, role } = await req.json()

  if (!name || !email || !password)
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })

  // MANAGER can only create MEMBER accounts
  const assignedRole = role ?? "MEMBER"
  if (callerRole === "MANAGER" && assignedRole !== "MEMBER")
    return NextResponse.json({ error: "Managers can only create Member accounts" }, { status: 403 })

  const existing = await db.user.findUnique({ where: { email } })
  if (existing)
    return NextResponse.json({ error: "Email is already in use" }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await db.user.create({
    data: { name, email, passwordHash, role: assignedRole },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}
